import React from 'react'

import {
    BrowserRouter as Router,
    Switch,
  Route,
  Link,
  NavLink,
} from 'react-router-dom'

import {
    Nav,
    Navbar,
    Grid,
    Row,
    Col,
    Panel
} from 'react-bootstrap'

import loremIpsum from 'lorem-ipsum'

import {Author, Authors} from './Author.js'

import {Book, Books} from './Book.js'

import {AuthorAddForm} from './AuthorAddForm.js'


const testOutPut = loremIpsum({count:200});

const Home = () => (
  <div>
        <h2>Home</h2>
        {testOutPut}
  </div>
)

const About = () => (
  <div>
        <h2>About</h2>
        {testOutPut}
  </div>
)


const Random = () => (
  <div>
    <h2>Random</h2>
  </div>
)

const BasicExample = () => (

        <Router>
        <div>
        <header>
        <Navbar fixedTop>
        <Navbar.Header>
        <Navbar.Brand>
        <NavLink to="/" >Home</NavLink>
        </Navbar.Brand>
        </Navbar.Header>
        <Nav bsStyle="pills" >
        <li><NavLink to="/books">Books</NavLink></li>
        <li><NavLink to="/authors">Authors</NavLink></li>
        <li><NavLink to='/about'>About</NavLink></li>
        <li><NavLink to='/random'>Random</NavLink></li>
        </Nav>
        </Navbar>
        </header>


        <Grid fluid>
        <Row>
        <Col md={6} mdOffset={3} id='main-content'>
        <Route exact path="/books/:bookId([0-9]+)" component={Book}/>
        <Route exact path="/books" component={Books}/>


        <Route exact path="/authors/:authorId([0-9]+)" component={Author}/>
        <Route exact path="/authors/add" component={AuthorAddForm}/>
        <Route exact path="/authors" component={Authors}/>


        <Route exact path="/about" component={About}/>


        <Route exact path='/random' component={Random}/>

        <Route exact path="/" component={Home}/>
        </Col>
        </Row>

        <Col md={6} mdOffset={3}>
        <Panel footer= "&copy; The Alexander literateur group 2017 - ad infinitum">
        </Panel>
        </Col>

        </Grid>

        </div>
        </Router>

)

export default BasicExample
