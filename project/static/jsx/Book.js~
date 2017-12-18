import React from 'react'

import {
    Route,
    Link
} from 'react-router-dom'

import {
    Panel,
    ListGroup,
    ListGroupItem,
    PageHeader
} from 'react-bootstrap'


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
        this.state = {book: [], loaded: false}
    }

    componentDidMount() {
        fetch(`/api/books/${this.props.match.params.bookId}`).then(results=> {return results.json();}).then(data => { this.setState({book: data, loaded: true});})
    }

    render() {
        let {loaded, book} = this.state;
        console.log(book);
        if (loaded) {
            var title = book.title;
            var authors = book.authors.map(
                (obj) => {
                    const fullName = obj[1]? obj[1] + ' ' + obj[0]: obj[0];
                    return <Link to={`/authors/${obj[2]}`}>{fullName}; </Link>
                }
            );
        }
        return (
            <div>
                {loaded
                 ?
                 <div>
                 <PageHeader>{title} <small>dedicated page</small></PageHeader>
                 <h4 class="text-center">A book by {authors}</h4>
                 <Panel header="Book info">
                 {book.description}
                 </Panel>
                 <Panel header="Contents">
                 {book.text}
                 </Panel>
                 </div>
                 : <h2>Loading...</h2>}
            </div>
        );
    }
}

class Books extends React.Component{
    constructor(props) {
       super(props);
       this.state = {books: []};
    }

    componentDidMount() {
        fetch('/api/books').then(results=> {return results.json();}).then(data => { this.setState({books: data});})
    }

    render() {
        var f = bookLinks.bind(this);
        var sortedBooks = f(this.state.books);

        console.log(sortedBooks);
        
        return (
                <div>
                {sortedBooks.length > 0
                 ? <div>
                 {sortedBooks}
                 </div>
                 :<h1>Loading...</h1>
                }

  </div>
        );
    };
}

export {Book, Books}
