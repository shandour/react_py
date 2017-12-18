import React from 'react'

import { WithContext as ReactTags } from 'react-tag-input';

import {Redirect, Link} from 'react-router-dom'

import {
    PageHeader,
    FormGroup,
    FormControl,
    ControlLabel,
    HelpBlock,
    Button
} from 'react-bootstrap'


function CustomField (props) {
    return (
            <FormGroup validationState={props.validationState}>
            <ControlLabel>{`Provide ${props.name}`}</ControlLabel>
            <FormControl
        type="text"
        placeholder={`Provide ${props.name}`}
        name={props.name}
        onChange={props.onChange}
        value={props.value}
        id={props.id}
        componentClass={props.componentClass}
            />
            </FormGroup>
    );
}


class BookAddForm extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            successStatus: false,
            errors: [],
            book: {
                title: '',
                description: '',
                text: ''
            }, author_tags: [
                {id: 'a', text: 'Anonymous'}
            ], suggestions: ['Anonymous;a'],
            finished: false,
            amount: 0};
        this.handleDelete = this.handleDelete.bind(this);
        this.handleAddition = this.handleAddition.bind(this);
        this.handleFilterSuggestions = this.handleFilterSuggestions.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount() {
        fetch("/api/authors-initial-suggestions").then(results=> {return results.json();}).then(data => { this.setState({suggestions: data.suggestions, finished: data.finished, amount: data.amount});})
    }


    handleDelete(i) {
        let tags = this.state.author_tags;
        tags.splice(i, 1);
        this.setState({author_tags: tags});
    }

    handleAddition(tag) {
        let tags = this.state.author_tags;
        let suggestions = this.state.suggestions;
        let tag_id = suggestions.filter(suggestion => suggestion.startsWith(tag))[0];
        tag_id = tag_id.slice(tag_id.lastIndexOf(';')+1);

        tags.push({
            id: tag_id,
            text: tag
        });
        this.setState({author_tags: tags});
    }

    handleFilterSuggestions(inputValue, suggestionsArray) {
        const query = inputValue.toLowerCase();
        let filteredSuggestions = suggestionsArray.filter(suggestion => suggestion.slice(0, suggestion.lastIndexOf(';')).toLowerCase().includes(query));
        if (filteredSuggestions.length > 0) {
            return filteredSuggestions.map(suggestion => suggestion.slice(0, suggestion.lastIndexOf(';')));
        } else if (filteredSuggestions.length == 0 && !this.state.finished && inputValue.length > 1) {
            fetch(`/api/authors-get-suggestions?q=${inputValue}&amount=${this.state.amount}`, {credentials: "same-origin"}).then(results=> {return results.json();}).then(data => { this.setState({suggestions: data.suggestions, finished: data.finished, amount: data.amount});})
        } else if (filteredSuggestions.length == 0 && this.state.finished) {
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
        let req = new Request('/api/books/add', options);
        fetch(req).then(resp => resp.json()).then(data => {
            if (data == 'success') {
                this.setState({successStatus: true});
                return;
            }
            this.setState({errors: data});
        });
    }

    handleChange(e) {
        let name = e.target.name;
        let book = Object.assign({}, this.state.book);
        book[name] = e.target.value;
        this.setState({book});
    }

    render() {
        const {author_tags, suggestions, successStatus} = this.state;

        const bookFields = Object.keys(this.state.book).map((d) => {
            let state = typeof this.state.errors[d] !== 'undefined' ? "error": null;
            let fieldClass = d == 'text' ? 'textarea' : 'input';

            return (
                    <div>
                    <CustomField name={`${d}`} onChange={this.handleChange} validationState={state} componentClass={fieldClass}/>
                    {(this.state.errors && typeof this.state.errors[d] !== 'undefined') &&
                     <HelpBlock>{this.state.errors[d]}</HelpBlock>
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
            suggestions={suggestions}
            handleDelete={this.handleDelete}
            handleAddition={this.handleAddition}
            handleFilterSuggestions={this.handleFilterSuggestions}
                />
                {(this.state.errors && typeof this.state.errors['author_tags'] !== 'undefined') &&
                 <HelpBlock id='author-tags-errors'>{this.state.errors['author_tags']}</HelpBlock>
                }
                </div>

                <FormControl type="submit" value='Submit' id="submit-button"/>

            </form>

            {successStatus &&
             <Redirect to="/books"/>
            }

                </div>
        );
    }
}


export {BookAddForm}
