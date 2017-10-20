import React from 'react'

import {
    PageHeader,
    FormGroup,
    FormControl,
    ControlLabel,
    HelpBlock
} from 'react-bootstrap'


function CustomField (props) {
    return (
            <FormGroup>
            <ControlLabel>Enter name</ControlLabel>
            <FormControl
        type="text"
        placeholder="Enter name"
        name={props.name}
            />
            </FormGroup>
    );
}


class AuthorAddForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {author: {name:'', surname:'', description: ''}, books: {title: '', description: '', text: ''}};
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(e) {
        e.preventDefault();
    }


    render () {
        return(
                <div>
                <PageHeader>Contribute to our trove of literary magnificence</PageHeader>
                <form method="POST" action="http://127.0.0.1:5000/authors/add">
                <CustomField/>
                
                </form>
                </div>
        );
    }
}

export {AuthorAddForm};
