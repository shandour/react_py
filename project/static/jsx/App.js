import React from 'react';

import {
    BrowserRouter as Router,
    Route,
    Link,
    NavLink,
    Switch,
    Redirect
} from 'react-router-dom';

import {
    Nav,
    Navbar,
    NavItem,
    NavDropdown,
    MenuItem,
    Grid,
    Row,
    Col,
    Panel
} from 'react-bootstrap';

import loremIpsum from 'lorem-ipsum';

import {Author, Authors} from './Author.js';

import {Book, Books} from './Book.js';

import {AuthorAddForm} from './AuthorAddForm.js';

import {BookAddForm} from './BookAddForm.js';

import {EditAuthorForm} from './EditAuthorForm.js';

import {EditBookForm} from './EditBookForm.js';

import {Random} from './Random.js';

import {Code404Error} from './Code404Error.js';

import {Logout, Login} from './LoginLogoutHelpers.js';

import {RegisterUser} from './RegisterUser.js';

import {UserCabinet} from './UserCabinet.js'


const testOutPut = loremIpsum({count:200});

const Home = () => (
  <div>
        <h2>Home</h2>
        {testOutPut}
  </div>
);

const About = (props) => (
  <div>
        <h2>About</h2>
        {testOutPut}
  </div>
);


const UserDropdown = (props) => (
        <Nav>
        <NavDropdown title={`User: ${props.username}`} id='super-duper-dropdown'>
        {props.username !== 'guest'
         ?
         <div>
         <MenuItem><Link to={`/user/cabinet`}>User cabinet</Link></MenuItem>
         <MenuItem divider />
         <MenuItem><Link to='/logout'>Logout</Link></MenuItem>
          </div>
         :
         <MenuItem><Link to='/login'>Login</Link></MenuItem>
        }
        </NavDropdown>
        </Nav>
);


class App extends React.Component {
    constructor(props) {
        super(props);
        this.guestUser = {'username': 'guest'};
        this.state = {
            loggedIn: '',
            user: this.guestUser,
            logInInfoLoaded: false
        };
        this.handleLogout = this.handleLogout.bind(this);
        this.handleLogin = this.handleLogin.bind(this);
    }

    handleLogin() {
        let req = new Request('/api/is-logged-in/info', {credentials: "same-origin"});
        fetch(req).then(resp => {
            if (!resp.ok) {
                this.setState({loggedIn: false});
                throw new Error('Login failed. Please try again later');
            } else {
                return resp.json();
            }
        }).then(data => {
            this.setState({loggedIn: true, user: data});
        }).catch(err => {console.log(err.message);});
    }

    handleLogout() {
        this.setState({loggedIn: false, user: this.guestUser});
    }

    componentDidMount() {
        let req = new Request('/api/is-logged-in/info', {credentials: "same-origin"});
        fetch(req).then(resp => {
            if (!resp.ok) {
                this.setState({loggedIn: false, logInInfoLoaded: true});
                throw new Error('Please log in if you want to access all of our functionality');
            } else {
                return resp.json();
            }
        }).then(data => {
            this.setState({loggedIn: true, user: data, logInInfoLoaded: true});
        }).catch(err => {console.log(err.message);});
    }

    render() {
        const {username} = this.state.user;
        const logInInfoLoaded = this.state.logInInfoLoaded;

        return (
                <Router>
                <div>

                <Navbar fixedTop fluid>

                <Col md={6} mdOffset={3}>
                <Navbar.Header>
                <Navbar.Brand>
                <NavLink to="/" >Home</NavLink>
                </Navbar.Brand>
                <Navbar.Toggle />
                </Navbar.Header>
                <Navbar.Collapse>
                <Nav bsStyle="pills" >
                <li><NavLink to="/books">Books</NavLink></li>
                <li><NavLink to="/authors">Authors</NavLink></li>
                <li><NavLink to='/about'>About</NavLink></li>
                <li><NavLink to='/random'>Random</NavLink></li>
                </Nav>
                </Navbar.Collapse>
                </Col>

                <Col md={3}>
                <UserDropdown username={`${username}`}/>
                </Col>

                </Navbar>


                <Grid fluid>
                <Col md={6} mdOffset={3} id='main-content'>

                {logInInfoLoaded ?
                <Switch>
                <Route exact path="/books/:bookId([0-9]+)" component={Book}/>
                <Route exact path="/books/:bookId([0-9]+)/edit" render={props => <EditBookForm {...props} loggedIn={this.state.loggedIn}/>}/>
                <Route exact path="/books/add" render={props => <BookAddForm {...props} loggedIn={this.state.loggedIn}/>}/>
                <Route exact path="/books" component={Books}/>


 
                 <Route exact path="/authors/:authorId([0-9]+)" component={Author}/>
                <Route exact path="/authors/:authorId([0-9]+)/edit" render={props => <EditAuthorForm {...props} loggedIn={this.state.loggedIn}/>}/>
                <Route exact path="/authors/add" render={props => <AuthorAddForm {...props} loggedIn={this.state.loggedIn}/>}/>
                <Route exact path="/authors" component={Authors}/>


                <Route exact path="/about" component={About}/>

                <Route exact path='/random' component={Random}/>

                <Route exact path="/logout" render={() => <Logout logout={this.handleLogout}/>}/>

                <Route exact path="/login" render={() => <Login handleLogin={this.handleLogin}/>}/>

                <Route exact path="/register" render={() => <RegisterUser handleLogin={this.handleLogin}/>}/>

                <Route exact path="/user/cabinet" component={UserCabinet}/>

                <Route exact path="/" component={Home}/>

                <Route path='*' component={Code404Error}/>
                 </Switch>
                 :
                 <h2>Confirming your identity. Please wait...</h2>
                }

                </Col>


                <Col md={6} mdOffset={3}>
                <Panel footer= "&copy; The Alexander literateur group 2017 - ad infinitum">
                </Panel>
                </Col>

            </Grid>

            </div>
                </Router>
        );
}

}

export default App;
