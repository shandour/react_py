import React from 'react'

import {
    PageHeader,
    FormGroup,
    FormControl,
    ControlLabel,
    HelpBlock,
    Button,
    Glyphicon,
    Badge,
    Well,
    Alert
} from 'react-bootstrap'


function CustomField (props) {
    return (
            <FormGroup validationState={props.validationState}>
            <ControlLabel>{`Enter ${props.name}`}</ControlLabel>
            <FormControl
        type="text"
        placeholder={`Provide ${props.name}`}
        name={props.name}
        onChange={props.onChange}
        value={props.value}
        id={props.id}
        componentClass={props.componentClass}
            />
            </FormGroup>
    );
}

//paginate comments (here and in db_operations)
//reset password element / use change password api view

class Comment extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            commentInfo: this.props.commentInfo,
            beingEdited: false,
            errors: {
                topic: [],
                text: []
            },
            warning: null,
            deleteWarning: false,
        };

        this.handleEdit = this.handleEdit.bind(this);
        this.handleEditSubmit = this.handleEditSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.reactToComment = this.reactToComment.bind(this);
        this.toggleDeleteAlert = this.toggleDeleteAlert.bind(this);
        this.handleAlertDismiss = this.handleAlertDismiss.bind(this);
        this.handleConfirmDelete = this.handleConfirmDelete.bind(this);
    }

    componentDidMount () {
        if (this.props.shouldFocus) {
            location.hash = this.state.commentInfo.id;
        }
    }

    handleEditSubmit(e) {
        e.preventDefault();
        let bodyObj = {};
        bodyObj['topic'] = this.state.commentInfo.topic;
        bodyObj['text'] = this.state.commentInfo.text;
        bodyObj['csrf_token'] = window.csrf_token;
        let myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/x-www-form-urlencoded');
        let options = {method: 'POST', body: new URLSearchParams(bodyObj), headers: myHeaders, credentials: "same-origin"};
        let req = new Request(`/api/edit-comment/${this.props.entityType}/${this.state.commentInfo.id}`, options);
        fetch(req).then(resp => resp.json()).then(data => {
            if (data['success']) {
                let commentInfo = Object.assign({}, this.state.commentInfo);
                commentInfo['topic'] = data['edited_comment']['topic'];
                commentInfo['text'] = data['edited_comment']['text'];
                commentInfo['edited'] = data['edited_comment']['edited'];
                this.setState({commentInfo});
                this.setState({beingEdited: false});
            } else {
                this.setState({errors: data['errors']});
            }
        });
    }

    handleEdit(e) {
        if (!this.props.loggedIn) {
            this.setState({warning: 'Please log in and check if you have the right to edit this'});
            return;
        }
        if (!this.state.beingEdited) {
            let req = new Request(`/api/can-user-edit/${this.props.entityType}/${this.props.commentInfo.id}`, {credentials: "same-origin"});
            fetch(req).then(resp => {
                if (resp.status == 200) {
                    this.setState({beingEdited: true});
                    return;
                } else if (resp.status == 403) {
                    this.setState({warning: 'You don\'t have the right to edit this'});
                } else {
                    this.setState({warning: `Action denied wiith error code ${resp.status}`});
                }
            });
        } else {
            this.setState({beingEdited: false});
            this.setState({commentInfo: this.props.commentInfo});
        }
    }

    handleChange(e) {
        const editField = e.target.id;
        let commentInfo = Object.assign({}, this.state.commentInfo);
        commentInfo[editField] = e.target.value;
        this.setState({commentInfo});
    }

    reactToComment(e) {
        if (!this.props.loggedIn) {
            this.setState({warning: 'Log in to react to comments'});
            return;
        } else {
            const reaction = e.target.name;
            let req = new Request(`/api/comments/attitude/${reaction}/${this.props.entityType}/${this.props.commentInfo.id}`, {credentials: 'same-origin'});
            fetch(req).then(resp => {
                if (resp.ok) {
                    return resp.json()
                }
                this.setState({warning: 'Log in to react to comments'});
                resolve();
            }).then(data => {
                let commentInfo = Object.assign({}, this.state.commentInfo);
                commentInfo['liked'] = data['liked'];
                commentInfo['disliked'] = data['disliked'];
                commentInfo['likes_count'] = data['likes_count'];
                this.setState({commentInfo});
            });
        }
    }

    handleConfirmDelete(e) {
        this.props.handleDeleteComment(e.target.id, e.target.name);
    }

    toggleDeleteAlert(e) {
        if (!this.props.loggedIn) {
            this.setState({warning: 'Log in to react to comments'});
            return;
        }
        this.setState({deleteWarning: true});
    }

    handleAlertDismiss(e) {
        this.setState({deleteWarning: false})
    }

    render() {
        let {commentInfo, beingEdited, errors, warning, deleteWarning} = this.state;
        let topicState = typeof errors.topic !== 'undefined' && errors.topic.length > 0? 'error': null;
        let textState = typeof errors.text !== 'undefined' && errors.text.length > 0? 'error': null;

        let liked = this.state.commentInfo.liked ? 'primary': 'default';
        let disliked = this.state.commentInfo.disliked ? 'primary': 'default';

        if (deleteWarning) {
            return (
                    <Alert bsStyle="danger" onDismiss={this.handleAlertDismiss}>
                    <h4>Delete warning!</h4>
                    <p>You are about to permanently delete a comment.</p>
                    <p>
                    <Button id={commentInfo.id} name={this.props.countInArray.toString()} bsStyle="danger" onClick={this.handleConfirmDelete}>Take this action</Button>
                    <span> or </span>
                    <Button onClick={this.handleAlertDismiss}>Dismiss</Button>
                    </p>
                    </Alert>
            );
        }

        let myStyleClass = this.props.shouldFocus ? 'focused-comment' : null;

        return (
                <div className={myStyleClass}>

                <div className="comment-info">
                A comment by <span class='username'>{this.props.username}</span>. Created {commentInfo.created_at}.
                {commentInfo.edited
                 ? <span> Edited: {commentInfo.edited}</span>
                 : null
                }
            </div>

            {beingEdited
             ?
             <form name='edit-form' onSubmit={this.handleEditSubmit}>
             <CustomField
             id={'topic'}
             name={'Topic'}
             value={commentInfo.topic}
             onChange={this.handleChange}
             validationState={topicState}
             />
             <HelpBlock>
             {typeof errors.topic !== 'undefined' && errors.topic.length> 0 && errors.topic.map(str => <span>{str}</span>)}
             </HelpBlock>

             <CustomField
             id={'text'}
             name={'Content'}
             value={commentInfo.text}
             onChange={this.handleChange}
             componentClass='textarea'
             validationState={textState}
             />
             <HelpBlock>
             {typeof errors.text !== 'undefined' && errors.text.length > 0 && errors.text.map(str => <span>{str}</span>)}
             </HelpBlock>
             <Button id={commentInfo.id} onClick={this.handleEdit}>Cancel edit</Button>

             <FormControl type="submit" value='Save edited comment' name="comment-save-edit-button" id={commentInfo.id}/>
             </form>
             :
             <div>
             <span className='delete-button'> <Button name ='delete-button' onClick={this.toggleDeleteAlert} disabled={this.props.deleteDisabled}><Glyphicon glyph='glyphicon glyphicon-remove' /></Button> </span>
             <div>
              Likes: <Badge>{commentInfo.likes_count}</Badge>
             <span className='attitude-button'><Button id={commentInfo.id} name='like' onClick={this.reactToComment} bsStyle={liked}><Glyphicon glyph='glyphicon glyphicon-thumbs-up'/></Button></span>
             <span className='attitude-button'><Button id={commentInfo.id} name='dislike' onClick={this.reactToComment} bsStyle={disliked}><Glyphicon glyph='glyphicon glyphicon-thumbs-down'/></Button></span>
             </div>

             <div className='comment-topic'><strong>Topic</strong>: {commentInfo.topic}</div>
             <Well>
             {commentInfo.text}
             </Well>

             <Button id={commentInfo.id} onClick={this.handleEdit}>Edit</Button>
             <span className='edit-impossible-warning'>{warning}</span>
             </div>
            }

                </div>
        );
    }
}


class Comments extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            commentsArray: [],
            isLoaded: false,
            loggedIn: '',
            warning: '',
            addComment: {
                topic: '',
                text: ''
            },
            addCommentErrors: {}
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleAddSubmit = this.handleAddSubmit.bind(this);
        this.handleDeleteComment = this.handleDeleteComment.bind(this);
    }

    componentDidMount() {
        let req = new Request(`/api/${this.props.entityType}s/${this.props.entityId}/comments`, {credentials: "same-origin"});
        fetch(req).then(resp => resp.json()).then(data => {
            this.setState({commentsArray: data['comments'], loggedIn: data['authenticated'], isLoaded: true});
        });
    }

    handleChange(e) {
        let addComment = this.state.addComment;
        addComment[e.target.id] = e.target.value;
        this.setState({addComment});
    }

    handleAddSubmit(e) {
        e.preventDefault();
        let bodyObj = Object.assign({}, this.state.addComment);
        bodyObj['csrf_token'] = window.csrf_token;
        let myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/x-www-form-urlencoded');
        let options = {method: 'POST', body: new URLSearchParams(bodyObj), headers: myHeaders, credentials: "same-origin"};
        let req = new Request(`/api/${this.props.entityType}s/${this.props.entityId}/add-comment`, options);
        fetch(req).then(resp => {
            if (resp.ok) {
                return resp.json();
            } else if (resp.status == 403) {
                this.setState({warning: 'You don\'t have the right to edit this'});
                resolve();
            } else {
                this.setState({warning: `Action denied wiith error code ${resp.status}`});
                resolve();
            }
        }).then(data => {
            if (data['errors']) {
                this.setState({addCommentErrors: data['errors']});
                return;
            }
            if (data['success'] && data['new_comment']) {
                let newComment = data['new_comment'];
                let commentsArray = Array.from(this.state.commentsArray);
                commentsArray.push(newComment);
                this.setState({commentsArray});
                this.setState({addComment: {topic: '', text: ''}});
                return;
            }
        });
    }


    handleDeleteComment(commentId, commentCount) {
        let req = new Request(`/api/can-user-edit/${this.props.entityType}/${commentId}`, {credentials: "same-origin"});
        fetch(req).then(resp => {
            if (resp.ok) {
                let req = new Request(`/api/delete-comment/${this.props.entityType}/${commentId}`, {credentials: "same-origin"});
                return fetch(req);
            } else {
                resolve();
            }
        }).then(resp => {
            if (resp.ok) {
                let commentsArray = Array.from(this.state.commentsArray);
                commentsArray.splice(commentCount, 1);
                this.setState({commentsArray});
                return;
            }
        });
    }


    render() {
        let {commentsArray, isLoaded, addCommentErrors, warning, addComment} = this.state;
        if (!isLoaded) {
            return <h3>Loading...</h3>;
        } else {
            let comments = [];
            let count = 0;
            for (let c of commentsArray) {
                const commentInfo = {
                    id: c.id,
                    topic: c.topic,
                    text: c.text,
                    likes_count: c.likes_count,
                    created_at: c.created_at,
                    edited: c.edited,
                    liked: c.liked,
                    disliked: c.disliked
                };
                const username = c.username;
                const disabled = c.current_user_wrote ? false : true;
                const shouldFocus = location.hash == `#${c.id}` ? true : false;
                console.log([c.id, shouldFocus]);
                comments.push(
                        <div class="comment">
                        <Comment key={commentInfo.id.toString()} commentInfo={commentInfo} username={username} handleDeleteComment={this.handleDeleteComment} loggedIn={this.state.loggedIn} entityType={this.props.entityType} countInArray={count} deleteDisabled={disabled} shouldFocus={shouldFocus}/>
                        </div>
                );
                count++;
            }

        let topicState = typeof addCommentErrors.topic!== 'undefined' ? 'error': null;
        let textState = typeof addCommentErrors.text!== 'undefined'? 'error': null;

            return (
                    <div>
                    <div>{comments}</div>

                <hr />
                    <form name='add-form' onSubmit={this.handleAddSubmit}>
                    <CustomField
                id={'topic'}
                name={'Topic'}
                onChange={this.handleChange}
                validationState={topicState}
                value={addComment.topic}
                    />
                    <HelpBlock>
                    {typeof addCommentErrors.topic!== 'undefined' && addCommentErrors.topic.map(str => <span>{str}</span>)}
                </HelpBlock>

                    <CustomField
                id={'text'}
                name={'Content'}
                onChange={this.handleChange}
                componentClass='textarea'
                validationState={textState}
                value={addComment.text}
                    />
                    <HelpBlock>
                    {typeof addCommentErrors.text !== 'undefined' && addCommentErrors.text.map(str => <span>{str}</span>)}
                </HelpBlock>

                  <FormControl type="submit" value='Add new comment' name="comment-add-button"/>
                    </form>
                    {warning &&
                     <span class='edit-impossible-warning'>{warning}</span>
                    }

                    </div>
            );
        }
    }
}


export {Comments};
