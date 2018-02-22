import React from 'react';
import {
    FormGroup,
    ControlLabel,
    FormControl
} from 'react-bootstrap';


function CustomField (props) {
    let name = typeof applyRegex !== 'undefined'? props.name.replace(/_+/, ' '): props.name;
    const applyBooksRegexFormat = typeof props.applyBooksRegexFormat !== 'undefined'? true: false;

    if (applyBooksRegexFormat) {
        name = name.replace(/_|-|\d/g, ' ');
        name = name.replace(/\s\s+/g, ' ');
        name = name.replace('books', 'book');
    }

    if (props.name == 'password_confirm') {
        name = 'password';
    }

    const type = typeof props.type !== 'undefined'? props.type : 'text';
    const labelWord = typeof props.labelWord !== 'undefined'? props.labelWord: 'Provide';
    const placeholder = typeof props.placeholder !== 'undefined'? props.placeholder: `Provide ${name}`;

    return (
            <FormGroup validationState={props.validationState}>
            <ControlLabel>{`${labelWord} ${name}`}</ControlLabel>
            <FormControl
        placeholder={placeholder}
        name={props.name}
        onChange={props.onChange}
        value={props.value}
        id={props.id}
        componentClass={props.componentClass}
        type={type}
            />
            </FormGroup>
    );
}


export {CustomField};
