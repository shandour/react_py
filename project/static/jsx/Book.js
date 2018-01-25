import React from 'react'

import {
    Link
} from 'react-router-dom'

import {
    Panel,
    ListGroup,
    ListGroupItem,
    PageHeader,
    Pagination
} from 'react-bootstrap'

import {Code404Error} from './Code404Error.js'

import {Comments} from './Comments.js'


function bookLinks(books) {
    const letters = Object.keys(books);
    let elementsList = [];
    for (let l of letters) {
        const letterList = books[l].map((obj) => {
            return(
                    <ListGroupItem key={obj.id}>
                    <Link to={`books/${obj.id}`}>
                    {obj.title}
                </Link>
                  </ListGroupItem>);
        })
        const list = <ListGroup><ListGroupItem header={l}>{letterList}</ListGroupItem></ListGroup>;
        elementsList.push(list);
    }
    return elementsList;
}


class Book extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            book: [],
            isLoaded: false,
            errorCode404: false
        }
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

    render() {
        let {isLoaded, book, errorCode404} = this.state;
        if (errorCode404) {
            return (<Code404Error location={location}/>);
        }
        if (isLoaded) {
            var title = book.title;
            var authors = book.authors.map(
                (obj) => {
                    const fullName = obj.surname? obj.surname + ' ' + obj.name: obj.name;
                    return <Link to={`/authors/${obj.id}`}>{fullName}; </Link>
                }
            );

        return (
                <div>
                <PageHeader>{title} <small>dedicated page</small></PageHeader>
                <h4 class="text-center">A book by {authors}</h4>
                <div>
                Spotted an error? Want to add smth? <Link to={`/books/${this.props.match.params.bookId}/edit`}> Please push here!</Link>
                </div>
                <Panel header="Book info">
                {book.description}
                </Panel>
                <Panel header="Contents">
                {book.text}
                </Panel>

                <div>
                <h3 class="text-center">The comment section</h3>
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
            active_page: 1,
            all_pages: null,
            isLoaded: false
        };
        this.handleSelect = this.handleSelect.bind(this);
    }

    componentDidMount() {
        fetch('/api/books?page=1').then(results=> results.json()).then(data => {
            this.setState({
                books: data.books,
                all_pages: data.all_pages,
                isLoaded:true
            });
        });
    }

    handleSelect(eventKey) {
        let req = new Request(`/api/books?page=${eventKey}`, {credentials: 'same-origin'});
        fetch(req).then(resp => resp.json()).then(data => {
            this.setState({
                books: data.books,
                all_pages: data.all_pages,
                active_page: data.active_page
            });
        }).catch(err => {console.log('Something went wrong while fetching data');});
    }

    render() {
        let {isLoaded, books, active_page, all_pages} = this.state;
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
                    {all_pages > 1 &&
                     <Pagination
                     prev
                     next
                     first
                     last
                     ellipsis
                     boundaryLinks
                     items={all_pages}
                     maxButtons={5}
                     activePage={Number(active_page)}
                     onSelect={this.handleSelect}
                     />
                    }
                </div>
            );
        } else {
            return <h3>Loading...</h3>
        }
    }
}

export {Book, Books}
