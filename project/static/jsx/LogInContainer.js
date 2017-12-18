import React from 'react'

class LogInContainer extends React.Component {
    render() {
        var content = document.querySelector('link[rel="import"]').import;

    document.body.appendChild(content.cloneNode(true));
        return(
                <div></div>
        );
    }
}

export {LogInContainer};
