import React from 'react'

import {WithContext as ReactTags} from 'react-tag-input';

import {Redirect} from 'react-router-dom'

import {Code404Error} from './Code404Error.js'

import {
    PageHeader,
    FormGroup,
    FormControl,
    ControlLabel,
    HelpBlock,
    Button
} from 'react-bootstrap'


function CustomField (props) {
    let formatted = props.name.replace(/_|-|\d/g, ' ');
    formatted = formatted.replace(/\s\s+/g, ' ');
    formatted = formatted.replace('books', 'book');
    return (
            <FormGroup validationState={props.validationState}>
            <ControlLabel>{`Enter ${formatted}`}</ControlLabel>
            <FormControl
        type="text"
        placeholder={`Provide ${formatted}`}
        name={props.name}
        onChange={props.onChange}
        value={props.value}
        id={props.id}
        componentClass={props.componentClass}
            />
            </FormGroup>
    );
}


class EditAuthorForm extends React.Component {
    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.handleAddition = this.handleAddition.bind(this);
        this.handleFilterSuggestions = this.handleFilterSuggestions.bind(this);
//empty string within initial suggestions to prevent the rendering from crashing in case the fetch of suggestions is tardy, so that the error props.suggestions is undefined gets thrown!
        this.state = {
            isLoaded: false,
            successStatus: false,
            errors: [],
            author: {
                first_name: "",
                last_name: "",
                description: ""
            }, book_tags: [],
            suggestions: [''],
            finished: false,
            amount: 0,
            errorCode404: false
        };
    }

    componentDidMount () {
        const req = new Request('/api/is-logged-in', {credentials: 'same-origin'});
        fetch(req).then(resp => {
            if (!resp.ok) {
                location.href='/login'
            } else {
                fetch(`/api/authors/${this.props.match.params.authorId}`).then(resp => {
                    if (resp.status == 404) {
                        this.setState({errorCode404: true});
                        resolve();
                    }
                    return resp.json();
                }).then(data => {
                    let author = {};
                    author['first_name'] = data['name'];
                    author['last_name'] = data['surname'];
                    author['description'] = data['description'];
                    let book_tags = [];
                    for (let b of data['books']) {
                        book_tags.push({
                            id: b[0],
                            title: b[1]
                        });
                    }
                    this.setState({author:author, book_tags:book_tags});
                    fetch("/api/books-initial-suggestions").then(results => results.json()).then(data => {
                        this.setState({
                            suggestions: data.suggestions,
                            finished: data.finished,
                            amount: data.amount,
                            isLoaded: true
                        });
                    });
                });
            }
        });
    }

    handleDelete(i) {
        let tags = this.state.book_tags;
        tags.splice(i, 1);
        this.setState({book_tags: tags});
    }

    handleAddition(tag) {
        if (tag == '') {
            return;
        }
        let tags = this.state.book_tags;
        let suggestions = this.state.suggestions;
        let tag_id = suggestions.filter(suggestion => suggestion.startsWith(tag))[0];
        tag_id = tag_id.slice(tag_id.lastIndexOf(';')+1);

        tags.push({
            id: tag_id,
            title: tag
        });
        this.setState({book_tags: tags});
    }

    handleFilterSuggestions(inputValue, suggestionsArray) {
        const query = inputValue.toLowerCase();
        let filteredSuggestions = suggestionsArray.filter(suggestion => suggestion.slice(0, suggestion.lastIndexOf(';')).toLowerCase().includes(query));
        if (filteredSuggestions.length > 0) {
            return filteredSuggestions.map(suggestion => suggestion.slice(0, suggestion.lastIndexOf(';')));
        } else if (filteredSuggestions.length == 0 && !this.state.finished && inputValue.length > 1) {
            fetch(`/api/books-get-suggestions?q=${inputValue}&amount=${this.state.amount}`, {credentials: "same-origin"}).then(results=> {return results.json();}).then(data => { this.setState({suggestions: data.suggestions, finished: data.finished, amount: data.amount});})
        } else if (filteredSuggestions.length == 0 && this.state.finished) {
            return ['Book not found']
        }
    }

    handleSubmit (e) {
        e.preventDefault();
        let bodyObj = Object.assign({}, this.state.author);
        bodyObj['book_tags'] = '';
        for (let obj of this.state.book_tags) {
            let tag = obj.id + ' ';
            bodyObj['book_tags'] += tag;
        }
        bodyObj['csrf_token'] = window.csrf_token;
        let myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/x-www-form-urlencoded');
        let options = {method: 'POST', body: new URLSearchParams(bodyObj), headers: myHeaders, credentials: "same-origin"};
        let req = new Request(`/api/edit-author/${this.props.match.params.authorId}`, options);
        fetch(req).then(resp => resp.json()).then(data => {
            if (data == 'success') {
                this.setState({successStatus: true});
                return;
            }
            this.setState({errors: data});
        });
    }

    handleChange (e) {
        let name = e.target.name;
        let author = Object.assign({}, this.state.author);
        author[name] = e.target.value;
        this.setState({author});
    }

    render () {
        const {
            book_tags,
            suggestions,
            successStatus,
            isLoaded,
            errorCode404
        } = this.state;
        if (errorCode404) {
            return (<Code404Error location={location}/>);
        }
        const redirectLink = `/authors/${this.props.match.params.authorId}`;
        const authorFields = Object.keys(this.state.author).map((d) => {
            let state = typeof this.state.errors[d] !== 'undefined' ? "error": null;
            return (
                    <div>
                    <CustomField name={`${d}`} onChange={this.handleChange} validationState={state} value={this.state.author[d]}/>
                    {(this.state.errors && typeof this.state.errors[d] !== 'undefined') &&
                     <HelpBlock>{this.state.errors[d]}</HelpBlock>
                    }
                </div>
            );
        });

        if (isLoaded) {
            return (
                    <div>
                    <PageHeader>
                    Edit this great person&#39;s literary bio!
                </PageHeader>

                    <form onSubmit={this.handleSubmit}>

                {authorFields}

                    <div>
                    <ReactTags
                tags={book_tags}
                minQueryLength={1}
                suggestions={suggestions}
                labelField={'title'}
                handleDelete={this.handleDelete}
                handleAddition={this.handleAddition}
                handleFilterSuggestions={this.handleFilterSuggestions}
                    />
                    {(this.state.errors && typeof this.state.errors['book_tags'] !== 'undefined') &&
                     <HelpBlock id='book-tags-errors'>{this.state.errors['book_tags']}</HelpBlock>
                    }
                </div>

                    <FormControl type="submit" value='Submit' id="submit-button"/>

                </form>

                {successStatus &&
                 <Redirect to={redirectLink}/>
                }

                </div>
            );
        } else {
            return <h3>Loading...</h3>
        }
    }
}

export {EditAuthorForm};
