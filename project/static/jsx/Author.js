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
            errorCode404: false,
            deletionSuccess: false,
            deletionButtonStyle: null
        };
        this.deleteAuthor = this.deleteAuthor.bind(this);
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

    deleteAuthor() {
        if (this.state.deletionButtonStyle === null) {
            this.setState({deletionButtonStyle: 'danger'});
            return;
        }

        fetch(`/api/delete-entity?id=${this.state.author.id}&entity=author`, {credentials: 'same-origin'}).then(resp => {
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
             author,
             errorCode404,
             deletionSuccess,
             deletionButtonStyle} = this.state;

        if (errorCode404) {
            return (<Code404Error location={location}/>);
        } else if (deletionSuccess) {
            return (<Redirect to={'/authors'}/>);
        }

        if (isLoaded) {
            const fullName = author.surname ? author.name + " " + author.surname: author.name;
            const books = authorBooks(author.books);
            const deletionWarning = deletionButtonStyle ? 'This action is irreversible!' : null;

            return (
                    <div>
                    <PageHeader>{fullName}<small>&lsquo;s personal page</small></PageHeader>
                    <div>
                   Spotted an error? Want to add smth? <Link to={`/authors/${this.props.match.params.authorId}/edit`}> Please push here!</Link>
                    </div>
                    <div>
                    Have an issue with this entity? Be sure to excercise your deletion powers!
                    <Button className='pull-right'
                bsStyle={deletionButtonStyle}
                onClick={this.deleteAuthor}>Delete author</Button>
                    <h3>
                    {deletionWarning}
                    </h3>
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
