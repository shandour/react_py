import React from 'react';
import {Redirect, Link} from 'react-router-dom';
import {
    ListGroup,
    ListGroupItem,
    HelpBlock,
    FormGroup,
    ControlLabel,
    FormControl,
    Glyphicon,
    Checkbox
} from 'react-bootstrap'

import {CustomField} from './CustomInputField.js'


class Logout extends React.Component {
    constructor(props) {
        super(props);
        this.state = {finished: false};
    }

    componentDidMount() {
        const req = new Request('/api/logout', {credentials: 'same-origin'})
        fetch(req).then(resp => {
            if (resp.ok) {
                this.setState({finished: true});
                this.props.logout();
            }
        });
    }

    render() {
        if (this.state.finished) {
            return (
                    <Redirect to='/'/>
            );
        } else {
            return (<h2>Logging out...</h2>);
        }
    }
}


class Login extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            successStatus: false,
            errors: {
                email: [],
                password: [],
                remember: []
            },
            inputData: {
                email: '',
                password: '',
                remember: 'n'
            }
        }
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount() {
        fetch('/api/is-logged-in', {credentials: "same-origin"}).then(resp => {
            if (resp.ok) {
                this.setState({successStatus: true});
            }
        });
    }

    handleChange(e) {
        let name = e.target.name;
        let inputData = Object.assign({}, this.state.inputData);
        if (name == 'checkbox') {
            inputData['remember'] = inputData['remember'] == 'n' ? 'y': 'n';
        } else {
            inputData[name] = e.target.value;
        }
        this.setState({inputData});
    }

    handleSubmit(e) {
        e.preventDefault();
        let bodyObj = Object.assign({}, this.state.inputData);
        bodyObj['csrf_token'] = window.csrf_token;
        let myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/x-www-form-urlencoded');
        const req = new Request('/api/login',
                                {method: 'POST',
                                 credentials: 'same-origin',
                                 headers: myHeaders,
                                 body: new URLSearchParams(bodyObj)}
                               );
        fetch(req).then(resp => {
            if (resp.ok) {
                this.setState({successStatus: true});
                this.props.handleLogin();
            } else {
                return resp.json().then(data => {
                    this.setState({errors: data})});
            }
        }).catch(err => {console.log('The application has encountered an error while trying to log you in')});
    }

    render () {
        const {errors, inputData, successStatus} = this.state;

        if (successStatus) {
            return(<Redirect to="/"/>);
        }

        const inputFields = Object.keys(inputData).map(key => {
            const state = typeof errors[key] !== 'undefined' && errors[key].length > 0 ? 'error' : null;
            const type = key == 'password'? 'password': 'text';
            if (key == 'remember') {
                const checked = inputData['remember'] == 'n' ? false : true;
                return (
                        <FormGroup key={key.toString()}>
                        <Checkbox onClick={this.handleChange} name='checkbox' validationState={state} checked={checked}>Remember me</Checkbox>
                        </FormGroup>
                );
            }
                        return (
                                <div key={key.toString()}>
                                <CustomField name={`${key}`} onChange={this.handleChange} validationState={state} type={type}/>
                                <HelpBlock>
                                {typeof errors[key] !== 'undefined' && errors[key].length > 0 &&
                                            errors[key]
                                }
                            </HelpBlock>
                                </div>
                        );
                    });

        const glyph = <Glyphicon glyph="glyphicon glyphicon-king"/>;

        return (
                <div>

                <form onSubmit={this.handleSubmit}>
                {inputFields}
                <FormControl type="submit" value='Log in' id="submit-button"/>
               </form>


                <div style={{marginTop: '2em'}}>
                <ListGroup>
                <ListGroupItem header={'Never had one to begin with?'} active>
                {glyph} <Link to='/register' style={{'color': 'rgb(199, 221, 239)'}}> Guess what? In that case, we&#39;ve got what you need as well! </Link>
            </ListGroupItem>
                </ListGroup>
                </div>

                </div>
        );
    }
}


export {Logout, Login};
