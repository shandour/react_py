import React from 'react';

import {
    ButtonGroup,
    Button,
    Image
} from 'react-bootstrap'

import {Link} from 'react-router-dom'


const Code404Error = ({location}) => (
        <div>
         <h1><strong>Page not found</strong></h1>
        <h3>No match for your requested url: <code>{location.pathname}</code></h3>
        <Image src="https://upload.wikimedia.org/wikipedia/commons/a/a4/Baphomet.png" responsive />
        <h2>There is no escape unless thou pledgest thy soul unto Lord Satan</h2>
        <Link to="/">Hail Satan!</Link>
        </div>
);

export {Code404Error};