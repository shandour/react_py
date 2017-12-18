import React from 'react'


class CheckLogIn extends React.Component {
    componentDidMount() {
        fetch('/api/is-logged-in').then(resp => {if (!resp.logged_in) { location.href='/login' }})
    }

    render() {
        return (
                <div>{props.children}</div>
        );
    }
}

export {CheckLogIn};
