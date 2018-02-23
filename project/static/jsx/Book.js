import React from 'react';
import {
    Link,
    Redirect
} from 'react-router-dom';
import {
    Panel,
    ListGroup,
    ListGroupItem,
    PageHeader,
    Button
} from 'react-bootstrap';

import {Code404Error} from './Code404Error.js';
import {Comments} from './Comments.js';


function bookLinks(books) {
    const letters = Object.keys(books);
    let elementsList = [];
    const lettered_buttons = (
            <div>
            {
                letters.map(l =>
                            <Button className="letter-buttons" bsStyle="link" href={`#${l}`}>{l}</Button>
                           )
            }
        </div>
    );

    for (let l of letters) {
        const letterList = books[l].map((obj) => {
            return(
                    <ListGroupItem key={obj.id}>
                    <Link to={`books/${obj.id}`}>
                    {obj.title}
                </Link>
                  </ListGroupItem>);
        })
        const list = <ListGroup key={l.toString()}><ListGroupItem header={l} id={l}>{letterList}</ListGroupItem></ListGroup>;
        elementsList.push(list);
    }

    elementsList.unshift(lettered_buttons);

    return elementsList;
}


class Book extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            book: [],
            isLoaded: false,
            errorCode404: false,
            deletionSuccess: false,
            deletionButtonStyle: null
        };
        this.deleteBook = this.deleteBook.bind(this);
    }

    componentDidMount() {
        fetch(`/api/books/${this.props.match.params.bookId}`).then(results => {
            if (results.status == 404) {
                this.setState({errorCode404: true});
            }
            return results.json();
        }).then(data => {
            this.setState({book: data, isLoaded: true});
        });
    }

    deleteBook() {
        if (this.state.deletionButtonStyle === null) {
            this.setState({deletionButtonStyle: 'danger'});
            return;
        }

        fetch(`/api/delete-entity?id=${this.state.book.id}&entity=book`, {credentials: 'same-origin'}).then(resp => {
            if (resp.ok) {
                this.setState({deletionSuccess: true});
            } else {
                this.setState({deletionButtonStyle: null});
                throw resp.status;
            }
        }).catch(err => {console.log(`Failed with an error code ${err}`);});
    }

    render() {
        let {isLoaded,
             book,
             errorCode404,
             deletionSuccess,
             deletionButtonStyle} = this.state;

        if (errorCode404) {
            return (<Code404Error location={location}/>);
        } else if (deletionSuccess) {
            return (<Redirect to={'/books'}/>);
        }

        if (isLoaded) {
            const title = book.title;
            const authors = book.authors.map(
                (obj) => {
                    const fullName = obj.surname? obj.surname + ' ' + obj.name: obj.name;
                    return <Link to={`/authors/${obj.id}`} key={obj.id.toString()}>{fullName}; </Link>
                }
            );

            const deletionWarning = deletionButtonStyle ? 'This action is irreversible!' : null;


        return (
                <div>
                <PageHeader>{title} <small>dedicated page</small></PageHeader>
                <h4 className="text-center">A book by {authors}</h4>
                <div>
                Spotted an error? Want to add smth? <Link to={`/books/${this.props.match.params.bookId}/edit`}> Please push here!</Link>
                </div>
                <div>
                    Have an issue with this entity? Be sure to excercise your deletion powers!
                    <Button className='pull-right'
                bsStyle={deletionButtonStyle}
                onClick={this.deleteBook}>Delete book</Button>
                    <h3>
                    {deletionWarning}
                    </h3>
                </div>
                <Panel header="Book info">
                {book.description}
                </Panel>
                <Panel header="Contents">
                {book.text}
                </Panel>

                <div>
                <h3 className="text-center">The comment section</h3>
                <Comments entityType='book' entityId={this.state.book.id}/>
                </div>
                </div>
        );
        } else {
            return <h3>Loading...</h3>;
        }
    }
}

class Books extends React.Component{
    constructor(props) {
       super(props);
        this.state = {
            books: [],
            isLoaded: false
        };
    }

    componentDidMount() {
        fetch('/api/books').then(results=> results.json()).then(data => {
            this.setState({
                books: data.books,
                isLoaded:true
            });
        });
    }

    render() {
        let {isLoaded, books} = this.state;
        if (isLoaded) {
            var boundBookLinks = bookLinks.bind(this);
            var sortedBooks = boundBookLinks(books);

            return (
                    <div>
                    <div>
                    Here is our glorious treasury of opera magna, the book hoard any scholar would rip his way through the throats of those precluding his access thereto! If you feel like making our e-penis even bigger feel free to contribute!  <Link to={"/books/add"}> Please push here, then!</Link>
                    </div>
                    <div>
                    {sortedBooks}
                </div>
                </div>
            );
        } else {
            return <h3>Loading...</h3>
        }
    }
}

export {Book, Books};
