import React from 'react';
import {Redirect} from 'react-router-dom';
import {
    PageHeader,
    FormGroup,
    FormControl,
    ControlLabel,
    HelpBlock,
    Button
} from 'react-bootstrap';

import {CustomField} from './CustomInputField.js';


function getBookFields() {
    if (this.state.books.length < 1) {
        return null;
    }

    const errors = this.state.errors.books;
    let counter = 0;
    const bookFields = [];
    for (let item of this.state.books){
        for (let key of Object.keys(item)) {
            const errorKey = key.slice(key.lastIndexOf('-')+1);
            const errorsExist = (errors && typeof errors[counter] !== 'undefined'
                                 && typeof errors[counter][errorKey] !== 'undefined');
            const validationState = errorsExist? 'error': null;
            const componentClass = errorKey == 'content'? 'textarea': 'input';
            bookFields.push(
                    <div key={key.toString()}>
                    <CustomField name={key}
                onChange={this.handleChange}
                id={counter.toString()}
                value={item[key]}
                validationState={validationState}
                componentClass={componentClass}
                labelWord={'Enter'}
                applyBooksRegexFormat={true}/>
                    {errorsExist &&
                     <HelpBlock> {errors[counter][errorKey]} </HelpBlock>
                    }
                    </div>);
        }

        bookFields.push(
                <Button key={`${counter}-remove-button`}
            onClick={this.removeBook}
            id={counter.toString()}
            className='remove-book-button'>
                Remove book
            </Button>);
        counter++;
    }
    return bookFields;
}


class AuthorAddForm extends React.Component {
    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.addBook = this.addBook.bind(this);
        this.removeBook = this.removeBook.bind(this);
        this.state = {
            booksCounter: 0,
            author: {
                first_name: "",
                last_name: "",
                description: ""
            },
            books: [],
            errors: {},
            submitSuccessful: false
        };
    }

    handleSubmit(e) {
        e.preventDefault();
        let bodyObj = Object.assign({}, this.state.author);
        for (let obj of this.state.books) {
            let keys = Object.keys(obj);
            for (let i of keys) {
                bodyObj[i] = obj[i];
            }
        }
        bodyObj['csrf_token'] = window.csrf_token;
        let myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/x-www-form-urlencoded');
        let options = {method: 'POST',
                       body: new URLSearchParams(bodyObj),
                       headers: myHeaders,
                       credentials: "same-origin"};
        let req = new Request('/api/authors/add', options);
        fetch(req).then(resp => {
            if (resp.status == 201) {
                this.setState({submitSuccessful: true});
            } else if (!resp.ok) {
                throw resp.status;
            } else {
                return resp.json();
            }
        }).then(data => {
            this.setState({errors: data});
        });
    }

    handleChange (e) {
        let name = e.target.name;
        if (name.endsWith('name') || name == 'description') {
            let author = Object.assign({}, this.state.author);
            author[name] = e.target.value;
            this.setState({author});
        } else if (name.startsWith('books')){
            let books = this.state.books.slice();
            let num = e.target.id;
            books[num][name] = e.target.value;
            this.setState({books});
        }
    }

    addBook (e) {
        let {books, booksCounter} = this.state;
        let num = books.length;
        books.push({
            ['books-' + num + "-title"]:'',
            ['books-' + num + "-overview"]: '',
            ['books-' + num + "-content"]: ''
        });
        this.setState({
            books: books,
            booksCounter: booksCounter + 1
        });
    }

    removeBook (e){
        let removeId = e.target.id;
        let books = this.state.books.slice(0);
        let {errors, booksCounter} = this.state;
        books.splice(removeId, 1);

        while (removeId < books.length) {
            let newId = parseInt(removeId, 10) + 1;
            let title = books[removeId]['books-' + newId + "-title"];
            let overview = books[removeId]['books-' + newId + "-overview"];
            let contents = books[removeId]['books-' +newId + "-content"];
            books[removeId] = {
                ['books-' + removeId + "-title"]: title,
                ['books-' + removeId + "-overview"]: overview,
                ['books-' + removeId + "-content"]: contents
            };
            removeId++;
        }

        booksCounter--;

        if (errors.hasOwnProperty('books')){
            let removeErrorId = e.target.id;
            delete errors['books'][removeErrorId];
            let bookErrors = errors['books'];
            if (removeErrorId != (this.state.books.length -1)) {
                for (let k in bookErrors) {
                    if (k < removeErrorId) {
                        continue;
                    }
                    Object.defineProperty(bookErrors,(k-1).toString(),
                                          Object.getOwnPropertyDescriptor(bookErrors, k));
                    delete bookErrors[k];
                }
            }

            errors['books'] = bookErrors;
        }
        this.setState({
            errors: errors,
            booksCounter: booksCounter,
            books: books
        });
    }


    render () {
        if (!this.props.loggedIn) {
            return(<Redirect to='/login'/>)
        }

        let n = this.state.booksCounter;
        const booksField = getBookFields.bind(this)();

        const authorFields = Object.keys(this.state.author).map((key) => {
            const state = typeof this.state.errors[key] !== 'undefined' ? "error": null;

            return (
                <div key={key.toString()}>
                    <CustomField name={`${key}`} onChange={this.handleChange} validationState={state} labelWord={'Enter'}/>
                    {(this.state.errors && typeof this.state.errors[key] !== 'undefined') &&
                     <HelpBlock>{this.state.errors[key]}</HelpBlock>
                    }
                </div>
            );
        })
        
        return(
                <div>
                <PageHeader>
                Contribute to our trove of literary magnificence
                </PageHeader>

                <form onSubmit={this.handleSubmit}>
                {authorFields}
                <hr/>
                {booksField}
                <Button onClick={this.addBook} id="add-button">Add book</Button>
                <FormControl type="submit" value='Submit' id="submit-button"/>
                </form>

            {this.state.submitSuccessful &&
             <Redirect to="/authors"/>
            }
                            </div>
        );
    }
}

export {AuthorAddForm};
