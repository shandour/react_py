import React from 'react'

import {
    Route,
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
        this.state = {
            author: [],
            isLoaded: false,
            errorCode404: false
        };
    }

    componentDidMount() {
        console.log(this.props.location.hash);
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
                    <h3 class="text-center">The comment section</h3>
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
           active_page: 1,
           all_pages: null,
           isLoaded: false
       };
       this.handleSelect = this.handleSelect.bind(this);
    }

    componentDidMount() {
        fetch('/api/authors?page=1').then(results => results.json()).then(data => {
            this.setState({
                authors: data.authors,
                all_pages: data.all_pages,
                isLoaded:true
            });
        });
    }

    handleSelect(eventKey) {
        let req = new Request(`/api/authors?page=${eventKey}`, {credentials: 'same-origin'});
        fetch(req).then(resp => resp.json()).then(data => {
            this.setState({
                authors: data.authors,
                all_pages: data.all_pages,
                active_page: data.active_page
            });
        }).catch(err => {console.log('Something went wrong while fetching data');});
    }

    render() {
        let {isLoaded, authors, active_page, all_pages} = this.state;
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

export {Author, Authors}
