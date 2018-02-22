import React from 'react';
import {Redirect} from 'react-router-dom';


class Random extends React.Component {
    constructor(props) {
        super(props);
        this.state = {isLoaded: true, redirectLink : ''};
    }

    componentDidMount() {
        fetch('/api/random').then(resp => resp.json()).then(data => {
            const redirectLink = `/${data.entity}s/${data.id}`;
            this.setState({
                isLoaded: true,
                redirectLink : redirectLink
            });
        });
    }

    render() {
        const {isLoaded, redirectLink} = this.state;
        const redir = redirectLink? <Redirect to={redirectLink}/>: null;
        return (
            <div>
                <h3>Randomizing our greatness for ya!..</h3>
                {redir}
            </div>
        );
    }
}

export {Random};
