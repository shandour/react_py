import React from 'react';
import {
    ButtonGroup,
    Button,
    Image
} from 'react-bootstrap';
import {Link} from 'react-router-dom';


const Code404Error = ({location}) => (
        <div>
         <h1><strong>Page not found</strong></h1>
        <h3>No match for your requested url: <code>{location.pathname}</code></h3>
        <Image src="https://upload.wikimedia.org/wikipedia/commons/b/bb/Kittyply_edit1.jpg" responsive />
        <h2>There is no escape unless the Kitty is satisfied</h2>
        <Link to="/">Home!</Link>
        </div>
);

export {Code404Error};
