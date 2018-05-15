import React from 'react';
import { WithContext as ReactTags } from 'react-tag-input';
import {Redirect, Link} from 'react-router-dom';
import {
    PageHeader,
    FormGroup,
    FormControl,
    ControlLabel,
    HelpBlock,
    Button
} from 'react-bootstrap';

import {CustomField} from './CustomInputField.js';


class BookAddForm extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            submitSuccessful: false,
            errors: [],
            book: {
                title: '',
                description: '',
                text: ''
            }, author_tags: [
                {id: 'a', name: 'Anonymous'}
            ], suggestions: ['Anonymous;a'],
            initialFinished: false,
            intermediateFinished: false,
            amount: null,
            lastQuery: null
        };
        this.handleDelete = this.handleDelete.bind(this);
        this.handleAddition = this.handleAddition.bind(this);
        this.handleFilterSuggestions = this.handleFilterSuggestions.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.loadMoreSuggestions = this.loadMoreSuggestions.bind(this);
    }

    componentDidMount() {
        fetch("/api/authors/suggestions?initial=True").then(results=> results.json()).then(data => {
            this.setState({
                suggestions: data.suggestions,
                initialFinished: data.finished,
            });
        })
    }

    loadMoreSuggestions() {
        const query = document.getElementsByClassName('ReactTags__tagInputField')[0].value;
        if (this.state.initialFinished) {
            return;
        }

        let amount;
        if (query != this.state.lastQuery) {
            amount = 0;
        } else if (this.state.intermediateFinished) {
            return;
        } else {
            amount = this.state.amount;
        }

        fetch(`/api/authors/suggestions?q=${query}&amount=${amount}`,
              {credentials: "same-origin"}).then(resp => resp.json()).then(data => {
                  const suggestions = amount == 0 ? data.suggestions : [...this.state.suggestions, ...data.suggestions];
                  if (query.length > 0) {
                      this.setState({
                          suggestions: suggestions,
                          intermediateFinished: data.finished,
                          amount: data.amount,
                          lastQuery: query
                      });
                  } else {
                      this.setState({
                          suggestions: suggestions,
                          initialFinished: data.finished,
                          amount: data.amount,
                          lastQuery: query
                      });
                  }
              });
    }

    handleDelete(i) {
        let tags = this.state.author_tags;
        tags.splice(i, 1);
        this.setState({author_tags: tags});
    }

    handleAddition(tag) {
        if (tag == '') {
            return;
        }
        let tags = this.state.author_tags;
        let suggestions = this.state.suggestions;
        let tag_id = suggestions.filter(suggestion => suggestion.startsWith(tag))[0];
        tag_id = tag_id.slice(tag_id.lastIndexOf(';')+1);

        tags.push({
            id: tag_id,
            name: tag
        });
        this.setState({author_tags: tags});
    }

    handleFilterSuggestions(inputValue, suggestionsArray) {
        const query = inputValue.toLowerCase();
        let filteredSuggestions = suggestionsArray.filter(suggestion =>
                                                          suggestion.slice(0, suggestion.lastIndexOf(';')).
                                                          toLowerCase().
                                                          includes(query));
        if (filteredSuggestions.length > 0) {
            return filteredSuggestions.map(suggestion => suggestion.slice(0, suggestion.lastIndexOf(';')));
        }

        if (!this.state.initialFinished) {
            if (filteredSuggestions.length == 0 && !this.state.intermediateFinished && inputValue.length > 1)
            {
                fetch(`/api/authors/suggestions?q=${query}`, {credentials: "same-origin"}).then(
                    results => results.json()
                ).then(data => {
                    this.setState({
                        suggestions: data.suggestions,
                        intermediateFinished: data.finished,
                        lastQuery: query
                    });
                }).catch(err => {console.log('Something went wrong processing your query')});
                return this.state.suggestions;
            } else if (this.state.intermediateFinished && !query.startsWith(this.state.lastQuery)) {
                fetch(`/api/authors/suggestions?q=${query}`, {credentials: "same-origin"}).then(
                    results => results.json()
                ).then(data => {
                    this.setState({
                        suggestions: data.suggestions,
                        intermediateFinished: data.finished,
                        lastQuery: query
                    });
                }).catch(err => {console.log('Something went wrong processing your query')});
                return this.state.suggestions;
            } else {
                return ['Author not found']
            }
        } else {
            return ['Author not found']
        }
    }

    handleSubmit(e) {
        e.preventDefault();
        let bodyObj = Object.assign({}, this.state.book);
        bodyObj['author_tags'] = '';
        for (let obj of this.state.author_tags) {
            let tag = obj.id + ' ';
            bodyObj['author_tags'] += tag;
        }
        bodyObj['csrf_token'] = window.csrf_token;
        let myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/x-www-form-urlencoded');
        let options = {method: 'POST', body: new URLSearchParams(bodyObj), headers: myHeaders, credentials: "same-origin"};
        let req = new Request('/api/books', options);
        fetch(req).then(resp =>{
            if (resp.status == 201) {
                this.setState({submitSuccessful: true});
            } else if (!resp.ok) {
                throw resp.status;
            } else {
                return resp.json();
            }
        }).then(data => {
            this.setState({errors: data});
        }).catch(errCode => {
            console.log(`Aborted with the error code ${errCode}`);
        });
    }

    handleChange(e) {
        let name = e.target.name;
        let book = Object.assign({}, this.state.book);
        book[name] = e.target.value;
        this.setState({book});
    }

    render() {
        if (!this.props.loggedIn) {
            return <Redirect to='/login'/>;
        }

        const {author_tags, suggestions, submitSuccessful} = this.state;

        const bookFields = Object.keys(this.state.book).map((k) => {
            const state = typeof this.state.errors[k] !== 'undefined' ? "error": null;
            const fieldClass = k == 'text' ? 'textarea' : 'input';

            return (
                    <div key={k.toString()}>
                    <CustomField name={`${k}`} onChange={this.handleChange} validationState={state} componentClass={fieldClass}/>
                    {(this.state.errors && typeof this.state.errors[k] !== 'undefined') &&
                     <HelpBlock>{this.state.errors[k]}</HelpBlock>
                    }
                </div>
            );
        })

        return (
                <div>
                <PageHeader>
                Contribute to our trove of literary magnificence
            </PageHeader>

                <form onSubmit={this.handleSubmit}>

            {bookFields}

                <div>
                Please choose from our array of authors or leave the 'Anonymous' label in place if there is none. In case we do not as of yet have an author you need please go to <Link to='/authors/add'>our author add page.</Link>
                </div>
                <div>
                <ReactTags
            tags={author_tags}
            minQueryLength={1}
            suggestions={suggestions}
            labelField={'name'}
            handleDelete={this.handleDelete}
            handleAddition={this.handleAddition}
            handleFilterSuggestions={this.handleFilterSuggestions}
                />
                {(this.state.errors && typeof this.state.errors['author_tags'] !== 'undefined') &&
                 <HelpBlock id='author-tags-errors'>{this.state.errors['author_tags']}</HelpBlock>
                }
                <Button className='pull-right' onClick={this.loadMoreSuggestions}>Load suggestions</Button>
                </div>

                <FormControl type="submit" value='Submit' id="submit-button"/>

            </form>

            {submitSuccessful &&
             <Redirect to="/books"/>
            }

                </div>
        );
    }
}


export {BookAddForm};
