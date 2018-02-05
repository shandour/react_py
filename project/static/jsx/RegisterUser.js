import React from 'react';

import {Redirect} from 'react-router-dom';

import {
    ListGroup,
    ListGroupItem,
    HelpBlock,
    FormGroup,
    ControlLabel,
    FormControl,
    Glyphicon,
    Checkbox
} from 'react-bootstrap';

import {CustomField} from './CustomInputField.js';


class RegisterUser extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            successStatus: false,
            errors: {
                username: [],
                email: [],
                password: [],
                password_confirm: []
            },
            inputData: {
                username: '',
                email: '',
                password: '',
                password_confirm: ''
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
        inputData[name] = e.target.value;
        this.setState({inputData});
    }

    handleSubmit(e) {
        e.preventDefault();
        let bodyObj = Object.assign({}, this.state.inputData);
        bodyObj['csrf_token'] = window.csrf_token;
        let myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/x-www-form-urlencoded');
        const req = new Request('/api/register',
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
        }).catch(err => {console.log('The application has encountered an error while trying to register a new user')});
    }

    render () {
        const {errors, inputData, successStatus} = this.state;

        if (successStatus) {
            return(<Redirect to="/"/>);
        }

        const inputFields =  Object.keys(inputData).map(key => {
            const state = typeof errors[key] !== 'undefined' && errors[key].length > 0 ? 'error' : null;
            const type = key == 'password' || key == 'password_confirm'? 'password': 'text';
            return (
                    <div key={key.toString()}>
                    <CustomField name={`${key}`} onChange={this.handleChange} validationState={state} type={type} labelWord={'Confirm'}/>
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
                <FormControl type="submit" value='Register' id="submit-button"/>
               </form>

                </div>
        );
    }
}


export {RegisterUser};
