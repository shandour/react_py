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


function authorLinks(authors) {
    const letters = Object.keys(authors);
    let elementsList = [];
    for (let l of letters) {
        const letterList = authors[l].map((obj) => {
            return(
                    <ListGroupItem key={obj.id}>
                    <Link to={`/authors/${obj.id}`}>{obj.surname} {obj.name}</Link>
                  </ListGroupItem>);
        })
        const list = <ListGroup><ListGroupItem header={l}>{letterList}</ListGroupItem></ListGroup>;
        elementsList.push(list);
    }
    return elementsList;
}


function authorBooks(books) {
    let elementsList = books.map((obj) => {
            return( <ListGroupItem key={obj[0]}>
                    <Link to={`/books/${obj[0]}`}> {obj[1]}</Link>
                  </ListGroupItem>);
        })
    return elementsList;
}

class Author extends React.Component {
    constructor(props) {
        super(props);
        this.state = {author: [], loaded: false}
    }

    componentDidMount() {
        fetch(`/api/authors/${this.props.match.params.authorId}`).then(results=> {return results.json();}).then(data => { this.setState({author: data, loaded:true});})
    }

    render() {
        let {loaded, author} = this.state
        if (loaded) {
            var fullName = author.name + " " + author.surname;
            var books = authorBooks(author.books);
        }
        return (
            <div>
                {loaded
                 ?
                 <div>
                 <PageHeader>{fullName}<small>&lsquo;s personal page</small></PageHeader>
                 <Panel header="Author info">
                 {author.description}
                 </Panel>
                 <Panel header="Bibliography">
                 <ListGroup>
                 {books}
                 </ListGroup>
                 </Panel>
                 </div>
                 : <h2>Loading...</h2>}
            </div>
        );
    }
}

class Authors extends React.Component{
   constructor(props) {
        super(props);
       this.state = {authors: [], loaded:false};
    }

    componentDidMount() {
        fetch('/api/authors').then(results=> {return results.json();}).then(data => { this.setState({authors: data, loaded:true});})
    }

    render() {
        let {loaded, authors} = this.state
        if (loaded) {
            var f = authorLinks.bind(this);
            var e = f(authors);
        }

        return (
                <div>
                <div>
                Behold the glorious auctores magni, now not only not names upon the gravestones of paper, but beautifully zombyfied and served e-style!
            </div>
                <div>
                Do you wish to make a contribution to our authors collection?  <Link to={"/authors/add"}> Please push here!</Link></div>
                {e
                 ? <div>
                 {e}
                 </div>
                 :<h1>Loading...</h1>
                }

                </div>
        );
    };
}

export {Author, Authors}
