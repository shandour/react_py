import React from 'react';
import {
    Route,
    Link
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


function authorLinks(authors) {
    const letters = Object.keys(authors);
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
        const letterList = authors[l].map(obj =>
                                          <ListGroupItem key={obj.id}>
                                          <Link to={`/authors/${obj.id}`}>
                                          {obj.surname} {obj.name}
                                          </Link>
                                          </ListGroupItem>
                                         );
        const list = <ListGroup key={l.toString()}><ListGroupItem header={l} id={l}>{letterList}</ListGroupItem></ListGroup>;
        elementsList.push(list);
    }

    elementsList.unshift(lettered_buttons);

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
        this.state = {
            author: [],
            isLoaded: false,
            errorCode404: false
        };
    }

    componentDidMount() {
        fetch(`/api/authors/${this.props.match.params.authorId}`).then(results => {
            if (results.status == 404) {
                this.setState({errorCode404: true});
            }
            return results.json();
        }).then(data =>
                {
                    this.setState({
                        author: data,
                        isLoaded:true
                    });
                });
    }

    render() {
        let {isLoaded, author, errorCode404} = this.state;
        if (errorCode404) {
            return (<Code404Error location={location}/>);
        }

        if (isLoaded) {
            let fullName = author.surname ? author.name + " " + author.surname: author.name;
            let books = authorBooks(author.books);

            return (
                    <div>
                    <PageHeader>{fullName}<small>&lsquo;s personal page</small></PageHeader>
                    <div>
                   Spotted an error? Want to add smth? <Link to={`/authors/${this.props.match.params.authorId}/edit`}> Please push here!</Link>
                    </div>
                    <Panel header="Author info">
                    {author.description}
                </Panel>
                    <Panel header="Bibliography">
                    <ListGroup>
                    {books}
                </ListGroup>
                    </Panel>

                    <hr/>

                    <div>
                    <h3 className="text-center">The comment section</h3>
                    <Comments entityType='author' entityId={this.state.author.id}/>
                    </div>
                    </div>
            );
        } else {
            return <h3>Loading...</h3>
        }
    }
}

class Authors extends React.Component{
   constructor(props) {
        super(props);
       this.state = {
           authors: [],
           isLoaded: false
       };
    }

    componentDidMount() {
        fetch('/api/authors').then(results => results.json()).then(data => {
            this.setState({
                authors: data.authors,
                isLoaded:true
            });
        });
    }

    render() {
        let {isLoaded, authors} = this.state;
        if (isLoaded) {
            let boundAuthorLinks = authorLinks.bind(this);
            const sortedAuthors = boundAuthorLinks(authors);

            return (
                    <div>
                    <div>
                    Behold the glorious auctores magni, now not only not names upon the gravestones of paper, but beautifully zombyfied and served e-style!
                </div>
                    <div>
                    Do you wish to make a contribution to our authors collection? <Link to={"/authors/add"}> Please push here!</Link>
                    </div>
                    <div>
                    {sortedAuthors}
                </div>
                    </div>
            );
        } else {
            return <h3>Loading...</h3>
        }
    }
}

export {Author, Authors};
