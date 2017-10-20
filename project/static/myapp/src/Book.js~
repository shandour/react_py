import React from 'react'

import {
    Route,
    Link
} from 'react-router-dom'

import {
    Panel,
    ListGroup,
    ListGroupItem
} from 'react-bootstrap'


function bookLinks(books) {
    const letters = Object.keys(books);
    let elementsList = [];
    for (let l of letters) {
        const letterList = books[l].map((obj) => {
            return(
                    <ListGroupItem key={obj.id} href={`${this.props.match.url}/${obj.id}`}>
                    {obj.title}
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

    componentWillMount() {
        fetch(`http://127.0.0.1:5000/books/show/${this.props.match.params.bookId}`).then(results=> {return results.json();}).then(data => { this.setState({book: data, loaded:true});})
    }

    render() {
        let {loaded, book} = this.state
        const title = book.title
        return (
            <div>
                {loaded
                 ? <Panel header={title}>
                 {book.description}
                 </Panel>
                 : <h2>Loading...</h2>}
            </div>
        );
    }
}

class Books extends React.Component{
   constructor(props) {
        super(props);
       this.state = {books: [], loaded:false};
    }

    componentWillMount() {
        fetch('http://127.0.0.1:5000/books').then(results=> {return results.json();}).then(data => { this.setState({books: data, loaded:true});})
    }

    render() {
        let {loaded, books} = this.state
        if (loaded) {
            var f = bookLinks.bind(this);
            var e = f(books);
        }

        return (
                <div>
                {e
                 ? <div>
                 {e}
                 </div>
                 :<h1>Loading...</h1>
                }


    <Route exact path={this.props.match.url} render={() => (
      <h3>Please select a topic.</h3>
    )}/>
  </div>
        );
    };
}

export {Book, Books}
