import React from 'react';

import {Link} from 'react-router-dom';

import {
    PageHeader,
    Panel,
    DropdownButton,
    MenuItem,
    Button,
    Glyphicon,
    ListGroup,
    ListGroupItem,
    Badge,
    Label,
    Tooltip,
    OverlayTrigger,
    Pagination,
    FormGroup,
    ControlLabel,
    FormControl,
    HelpBlock
} from 'react-bootstrap';

import {CustomField} from './CustomInputField.js';


class UserCabinet extends React.Component {
    constructor(props) {
        super(props);

        this.password = {
                'password': '',
                'new_password': '',
                'new_password_confirm': ''
        };

        this.errors = {
                'password': [],
                'new_password': [],
                'new_password_confirm': []
        };

        this.state = {
            user: {},
            passwordChangeToggle: false,
            password: this.password,
            errors: this.errors,
            loaded: false,
            passwordChangeSuccess: false,
            warning: '',
            commentsDisplay: {
                commentsType: 'authors',
                sortOption: 'most-popular',
                sortDirection: 'desc',
                activePage: 1,
                expandedComments: [],
                expandAll: false
            }
        };
        this.handlePasswordChange = this.handlePasswordChange.bind(this);
        this.selectDropdown = this.selectDropdown.bind(this);
        this.handleSort = this.handleSort.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
        this.expandCommentInfo = this.expandCommentInfo.bind(this);
        this.fullExpandContract = this.fullExpandContract.bind(this);
        this.togglePasswordChange = this.togglePasswordChange.bind(this);
        this.submitPassword = this.submitPassword.bind(this);
    }

    componentDidMount() {
        let req = new Request(`/api/get-user-comments?sortOption=most-popular&sortDirection=desc&commentsType=authors&page=1&initial=True`, {credentials: "same-origin"});
        fetch(req).then(resp => {
            if (!resp.ok) {
                this.setState({warning: 'You have no permission to view this.'});
            } else {
                return resp.json();
            }
        }).then(data => {
            this.setState({user: data, loaded: true});
        }).catch(err => {console.log(`Responded with the error code ${err}. You either have no permission to view this or the server has experienced an error. The first is way more likely, pal.`);});
    }

    handlePasswordChange(e) {
        let password = Object.assign({}, this.state.password);
        password[e.target.name] = e.target.value;
        this.setState({password});
    }

    togglePasswordChange() {
        this.setState({passwordChangeToggle: !this.state.passwordChangeToggle, passwordChangeSuccess: false});
    }

    submitPassword(e) {
        e.preventDefault();
        let bodyObj = Object.assign({}, this.state.password);
        bodyObj['csrf_token'] = window.csrf_token;
        let myHeaders = new Headers();
        myHeaders.append('Content-Type', 'application/x-www-form-urlencoded');
        const req = new Request('/api/change-password', {method: 'POST', credentials: 'same-origin', headers: myHeaders, body: new URLSearchParams(bodyObj)});
        fetch(req).then(resp => {
            if (resp.ok){
                this.setState({password: this.password,
                               errors: this.errors,
                               passwordChangeToggle: false,
                               passwordChangeSuccess: true});
            } else if (resp.status == '401') {
                resp.json().then(data => {
                    this.setState({errors: data});
                });
            }
        })
    }

    handleSort(e) {
        let commentsDisplay = Object.assign({}, this.state.commentsDisplay);
        commentsDisplay.sortDirection = e.target.name;
        this.getCommentsOnChange(commentsDisplay);
    }

    selectDropdown(type, eventKey) {
        let commentsDisplay = Object.assign({}, this.state.commentsDisplay);
        console.log(eventKey);
        commentsDisplay[type] = eventKey;
        console.log(commentsDisplay[type]);
        this.getCommentsOnChange(commentsDisplay);
    }

    handleSelect(eventKey) {
        let commentsDisplay = Object.assign({}, this.state.commentsDisplay);
        commentsDisplay.activePage = eventKey;
        this.getCommentsOnChange(commentsDisplay);
    }

    getCommentsOnChange(commentsDisplay) {
        const commentsType = commentsDisplay.commentsType;
        const sortOption = commentsDisplay.sortOption;
        const sortDirection = commentsDisplay.sortDirection;
        const currentPage = commentsDisplay.activePage;
        console.log(commentsType);
        let req = new Request(`/api/get-user-comments?sortOption=${sortOption}&sortDirection=${sortDirection}&commentsType=${commentsType}&page=${currentPage}`, {credentials: 'same-origin'});

        fetch(req).then(resp => {
            if (!resp.ok) {
                this.setState({warning: 'You have no permission to view this.'});
            } else {
                return resp.json();
            }
        }).then(data => {
            let user = this.state.user;
            user.activity = data;
            this.setState({user: user, commentsDisplay: commentsDisplay});
        }).catch(err => {console.log(`Responded with the error code ${err}. You either have no permission to view this or the server has experienced an error. The first is way more likely, pal.`);});
    }

    expandCommentInfo(e) {
        let commentsDisplay = Object.assign({}, this.state.commentsDisplay);
        const commentId = Number(e.target.id);
        if (commentsDisplay.expandedComments.includes(commentId)) {
            commentsDisplay.expandedComments.splice(commentsDisplay.expandedComments.indexOf(commentId), 1);
        } else {
            commentsDisplay.expandedComments.push(commentId);
        }
        this.setState({commentsDisplay});
    }

    fullExpandContract() {
        let commentsDisplay = Object.assign({}, this.state.commentsDisplay);
        if (!commentsDisplay.expandAll) {
            commentsDisplay.expandedComments = Array.from(new Array(this.state.user.activity.comments.length).keys());
            commentsDisplay.expandAll = true;
        } else {
            commentsDisplay.expandedComments = [];
            commentsDisplay.expandAll = false;
        }
        this.setState({commentsDisplay});
    }


    render() {
        if (!this.state.loaded) {
            const warning = this.state.warning;
            return(<div>{warning.length > 0 ? {warning} : <h4>Loading...</h4>}</div>);
        } else {
            const {user,
                   passwordChangeToggle,
                   passwordChangeSuccess,
                   password,
                   errors} = this.state;
            let count = -1;
            const comments = user.activity.comments.map(obj => {
                count++;
                return(
                        <ListGroupItem key={`${obj.id}-${obj.entity.name}-comment`}>
                        <span className='expand-comment'>
                        <Button onClick={this.expandCommentInfo} id={`${count}`} bsStyle='small'><Glyphicon glyph='glyphicon glyphicon-collapse-down'/></Button>
                        </span>
                        <strong>Topic</strong>: <Label>{obj.topic}</Label>   <strong>Created</strong>: {obj.creation_date}   {obj.edition_date && <span><strong>Edited</strong>: {obj.edition_date}</span>}   <strong>Link</strong>: <Link to={{
                            pathname: `/${obj.entity.name}/${obj.entity.id}`,
                            hash: `#${obj.id}`
                        }}>link</Link> <OverlayTrigger placement='top' overlay={<Tooltip id="tooltip">Likes count</Tooltip>}><Badge>{obj.attitude}</Badge></OverlayTrigger>
                        {this.state.commentsDisplay.expandedComments.includes(count) &&
                         <div className='comment-content'>
                         {obj.text}
                         </div>
                        }
                        </ListGroupItem>)
            }
        );

            const passwordPanelStyle = passwordChangeSuccess ? {'border-color': 'green'} :null

            return(
                <div>
                    <PageHeader>User Cabinet</PageHeader>
                    <Panel><strong>Username</strong>: {user.username}</Panel>
                    <Panel><strong>Email</strong>: {user.email}</Panel>
                    <Panel><strong>Registration date</strong>: {user.confirmed_at}</Panel>
                    <Panel><strong>Access level</strong>: {user.role}</Panel>

                    <Panel style={passwordPanelStyle}>
                    <strong>Change password</strong>
                    <Button onClick={this.togglePasswordChange} id='toggle-password'>Change password</Button>
                    {passwordChangeToggle &&
                     <div id='change-password-div'>

                     {
                         Object.keys(password).map((key) => {
                             let state = typeof errors[key] !== 'undefined' && errors[key].length > 0 ? 'error' : null;
                             return (
                                  <div>
                                     <CustomField
                                 name={key}
                                 onChange={this.handlePasswordChange}
                                 validationState={state}
                                 type='password'
                                 key={key}
                                 value={password[key]}
                                     />
                                     <HelpBlock>
                                     {state !== null &&
                                      errors[key]
                                     }
                                 </HelpBlock>
                                     </div>
                             );
                     })
                     }

                     <Button type='submit' onClick={this.submitPassword}>Confirm change</Button>

                     </div>}
                    </Panel>

                    <hr/>


                    <h4 className='text-center'>Your Comments Section</h4>

                    <div id='expansion-contraction-button'>
                    <Button bsSize='small' id='expand-contract-button' onClick={this.fullExpandContract}>
                    {!this.state.commentsDisplay.expandAll
                     ? <span>Expand</span>
                     : <span>Collapse</span>
                    }
                </Button>
                    </div>

                    <DropdownButton title='Sort comments' id='sorting-menu-dropdown' onSelect={(e) => {this.selectDropdown('sortOption', e)}}>
                    <MenuItem eventKey="most-popular" active={this.state.commentsDisplay.sortOption == 'most-popular'? true: false}>Most Popular</MenuItem>
                    <MenuItem eventKey="most-hated" active={this.state.commentsDisplay.sortOption == 'most-hated'? true: false}>Most hated (only negative likes count)</MenuItem>
                    <MenuItem eventKey="creation-date" active={this.state.commentsDisplay.sortOption == 'creation-date'? true: false}>Creation date</MenuItem>
                    <MenuItem eventKey="last-change" active={this.state.commentsDisplay.sortOption == 'last-change'? true: false}>Last change date (exclude unedited)</MenuItem>
                    <MenuItem eventKey="creation-change" active={this.state.commentsDisplay.sortOption == 'creation-change'? true: false}>Creation/last change date</MenuItem>
                    </DropdownButton>

                    <DropdownButton title='Comment type' id='comment-type-dropdown' onSelect={(e) => {this.selectDropdown('commentsType', e)}}>
                    <MenuItem eventKey="authors" active={this.state.commentsDisplay.commentsType == 'authors'? true: false}>Authors</MenuItem>
                    <MenuItem eventKey="books" active={this.state.commentsDisplay.commentsType == 'books'? true: false}>Books</MenuItem>
                    </DropdownButton>

                    <Button name='asc' id='sort-up' onClick={this.handleSort} bsStyle={this.state.commentsDisplay.sortDirection == 'asc' ? 'primary' : 'default'}><Glyphicon glyph='glyphicon glyphicon-triangle-top'/></Button>
                    <Button name='desc' id='sort-down' onClick={this.handleSort} bsStyle={this.state.commentsDisplay.sortDirection == 'desc' ? 'primary' : 'default'}><Glyphicon glyph='glyphicon glyphicon-triangle-bottom'/></Button>

                    <Panel>
                    <ListGroup>
                    {comments}
                {user.activity.pages > 1 &&
                 <Pagination
                 prev
                 next
                 first
                 last
                 ellipsis
                 boundaryLinks
                 items={user.activity.pages}
                 maxButtons={5}
                 activePage={this.state.commentsDisplay.activePage}
                 onSelect={this.handleSelect}
                 />
                }
                </ListGroup>
                    </Panel>
                </div>
            );
        }
    }
}

export {UserCabinet};

