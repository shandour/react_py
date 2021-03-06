import React from 'react';
import {WithContext as ReactTags} from 'react-tag-input';
import {Redirect} from 'react-router-dom';
import {
    PageHeader,
    FormGroup,
    FormControl,
    ControlLabel,
    HelpBlock,
    Button
} from 'react-bootstrap';

import {Code404Error} from './Code404Error.js';
import {CustomField} from './CustomInputField.js';


class EditBookForm extends React.Component {
    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.handleAddition = this.handleAddition.bind(this);
        this.handleFilterSuggestions = this.handleFilterSuggestions.bind(this);
        this.loadMoreSuggestions = this.loadMoreSuggestions.bind(this);
//empty string within initial suggestions to prevent the rendering from crashing in case the fetch of suggestions is tardy, so that the error props.suggestions is undefined gets thrown!
        this.state = {
            isLoaded: false,
            successStatus: false,
            errors: [],
            book: {
                title: "",
                description: "",
                text: ""
            }, author_tags: [],
            suggestions: [''],
            initialFinished: false,
            intermediateFinished: false,
            amount: null,
            lastQuery: null,
            errorCode404: false,
            unauthorizedWarning: false
        };
    }

    componentDidMount () {
        const req = new Request(`/api/books/${this.props.match.params.bookId}/can-be-edited`,
                                {credentials: 'same-origin'});
        fetch(req).then(resp => {
            if (resp.status == '403') {
                this.setState({unauthorizedWarning: true});
                throw '403';
            } else {
                fetch(`/api/books/${this.props.match.params.bookId}`).then(resp => {
                    if (resp.status == 404) {
                        this.setState({errorCode404: true});
                        throw '404';
                    }
                    return resp.json();
                }).then(data => {
                    let book = {};
                    book['title'] = data['title'];
                    book['description'] = data['description'];
                    book['text'] = data['text'];
                    let author_tags = [];
                    for (let a of data['authors']) {
                        const fullName = typeof a.surname !== 'undefined'? `${a.surname} ${a.name}`: a.name;
                        author_tags.push({
                            id: a.id,
                            text: fullName
                        });
                    }
                    this.setState({book:book, author_tags:author_tags});
                    fetch("/api/authors/suggestions?initial=True").then(results => results.json()).then(data => {
                        this.setState({
                            suggestions: data.suggestions,
                            initialFinished: data.finished,
                            isLoaded: true
                        });
                    });
                });
            }
        }).catch(err => {console.log('An error occured while fetching data from server')});
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
        tag_id = Number(tag_id.slice(tag_id.lastIndexOf(';') + 1));

        tags.push({
            id: tag_id,
            text: tag
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

    handleSubmit (e) {
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
        let options = {method: 'PUT',
                       body: new URLSearchParams(bodyObj),
                       headers: myHeaders,
                       credentials: "same-origin"};
        let req = new Request(`/api/books/${this.props.match.params.bookId}`, options);
        
        fetch(req).then(resp => {
            if (!resp.ok) {
                throw resp.status;
            } else if (resp.status == 204) {
                this.setState({successStatus: true});
            } else {
                return resp.json();
            }
        }).then(data => {
            this.setState({errors: data});
        }).catch(errCode => {
            console.log(`Aborted with the error code ${errCode}`);
        });
    }

    handleChange (e) {
        let name = e.target.name;
        let book = Object.assign({}, this.state.book);
        book[name] = e.target.value;
        this.setState({book});
    }

    render () {
        if (!this.props.loggedIn) {
            return(<Redirect to='/login'/>);
        }

        const {
            author_tags,
            suggestions,
            successStatus,
            isLoaded,
            errorCode404,
            unauthorizedWarning
        } = this.state;

        if (errorCode404) {
            return (<Code404Error location={location}/>);
        } else if (unauthorizedWarning) {
            return (<h2>You do not have the permission to edit this</h2>);
        }

        const redirectLink = `/books/${this.props.match.params.bookId}`;
        const bookFields = Object.keys(this.state.book).map((k) => {
            const state = typeof this.state.errors[k] !== 'undefined' ? "error": null;
            const fieldClass = k == 'text' ? 'textarea' : 'input';

            return (
                    <div key={k.toString()}>
                    <CustomField name={`${k}`} onChange={this.handleChange} validationState={state} value={this.state.book[k]} componentClass={fieldClass} labelWord={'Enter'} applyBooksRegexFormat={true}/>
                    {(this.state.errors && typeof this.state.errors[k] !== 'undefined') &&
                     <HelpBlock>{this.state.errors[k]}</HelpBlock>
                    }
                </div>
            );
        })

        if (isLoaded) {
            return (
                    <div>
                    <PageHeader>
                    Edit in or edit our stuff about dis opus magnum!
                </PageHeader>

                    <form onSubmit={this.handleSubmit}>

                {bookFields}

                    <div>
                    <ReactTags
                tags={author_tags}
                minQueryLength={1}
                suggestions={suggestions}
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

                {successStatus &&
                 <Redirect to={redirectLink}/>
                }

                </div>
            );
        } else {
            return <h3>Loading...</h3>;
        }
    }
}

export {EditBookForm};
