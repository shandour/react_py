import React from 'react'

import {Redirect} from 'react-router-dom'

import {
    PageHeader,
    FormGroup,
    FormControl,
    ControlLabel,
    HelpBlock,
    Button
} from 'react-bootstrap'


function getBookFields(n, books, errors=[]) {
    if (n <= 0) {
        return '';
    }
    let counter = 0;
    const booksField = [];
    while (counter < n ){
        booksField[counter] = (
                <div>
                {errors && typeof errors[counter] !== 'undefined' && typeof errors[counter]['title'] !== 'undefined'
                 ?
                 <div>
                 <CustomField name={`books-${counter}-title`} onChange={this.handleChange} id={counter.toString()} value={books[counter]["books-"+ counter +"-title"]} validationState='error'/>
                 <HelpBlock>{errors[counter]['title']}</HelpBlock>
                 </div>
                 :
                 <CustomField name={`books-${counter}-title`} onChange={this.handleChange} id={counter.toString()} value={books[counter]["books-"+ counter +"-title"]} validationState={null}/>
                }

            {(errors && typeof errors[counter] !== 'undefined' && typeof errors[counter]['overview'] !== 'undefined')
             ?
             <div>
             <CustomField name={`books-${counter}-overview`} onChange={this.handleChange} id={counter.toString()} value={books[counter]["books-"+ counter +"-overview"]} validationState='error'/>
             <HelpBlock>{errors[counter]['title']}</HelpBlock>
             </div>
             :
             <CustomField name={`books-${counter}-overview`} onChange={this.handleChange} id={counter.toString()} value={books[counter]["books-"+ counter +"-overview"]} validationState={null}/>
            }

            {(errors && typeof errors[counter] !== 'undefined' && typeof errors[counter]['content'] !== 'undefined')
             ?
             <div>
             <CustomField name={`books-${counter}-content`} onChange={this.handleChange} id={counter.toString()} value={books[counter]["books-"+ counter +"-content"]} validationState='error' componentClass="textarea"/>
             <HelpBlock>{errors[counter]['title']}</HelpBlock>
             </div>
             :
             <CustomField name={`books-${counter}-content`} onChange={this.handleChange} id={counter.toString()} value={books[counter]["books-"+ counter +"-content"]} validationState={null} componentClass="textarea"/>
            }

                <Button onClick={this.removeBook} id={counter.toString()}>
                Remove book
            </Button>
                </div>);
        counter++;
    }
    return booksField;
}


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
            }, books: [],
            errors: {}};
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
        let options = {method: 'POST', body: new URLSearchParams(bodyObj), headers: myHeaders, credentials: "same-origin"};
        let req = new Request('/api/authors/add', options);
        fetch(req).then(resp => resp.json()).then(data => {
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
        let books = this.state.books.slice();
        let num = books.length;
        books.push({['books-' + num + "-title"]:'', ['books-' + num + "-overview"]: '', ['books-' + num + "-content"]: ''});
        this.setState({books});
        this.setState((prevState, props) => {
            return {booksCounter: prevState.booksCounter + 1};
        });
    }

//CHANGE: update state once at the end of all the stuff below; maybe, just copy the whole of this.state and tweak it, then set
    removeBook (e){
        let removeId = e.target.id;
        let books = this.state.books.slice();
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
        this.setState({books});
        this.setState((prevState, props) => {
            return {booksCounter: prevState.booksCounter - 1};
        });
        if (this.state.errors.hasOwnProperty('books')){
            let errors = Object.assign({}, this.state.errors);
            let removeErrorId = e.target.id
            delete errors['books'][removeErrorId];
            let bookErrors = errors['books'];
            if (removeErrorId != (this.state.books.length -1)) {
                for (let k in bookErrors) {
                    if (k < removeId) {
                        continue;
                    }
                    Object.defineProperty(bookErrors,(k-1).toString(),
                                          Object.getOwnPropertyDescriptor(bookErrors, k));
                    delete bookErrors[k];
                }
            }

                errors['books'] = bookErrors;
                this.setState({errors});
            }
        }


    render () {
        if (!this.props.loggedIn) {
            return(<Redirect to='/login'/>)
        }
        const successStatus = this.state.errors.success ? true: false;
        let n = this.state.booksCounter;
        const booksField = getBookFields.bind(this)(n, this.state.books, this.state.errors.books);

        const authorFields = Object.keys(this.state.author).map((d) => {
            let state = typeof this.state.errors[d] !== 'undefined' ? "error": null;

            return (
                <div>
                    <CustomField name={`${d}`} onChange={this.handleChange} validationState={state}/>
                    {(this.state.errors && typeof this.state.errors[d] !== 'undefined') &&
                     <HelpBlock>{this.state.errors[d]}</HelpBlock>
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

            {successStatus &&
             <Redirect to="/authors"/>
            }
                            </div>
        );
    }
}

export {AuthorAddForm};
