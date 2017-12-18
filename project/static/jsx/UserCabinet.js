import React from 'react';

import {Link} from 'react-router-dom'

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
    OverlayTrigger
} from 'react-bootstrap'


class UserCabinet extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            user: {},
            loaded: false,
            warning: '',
            commentsDisplay: {
                commentsType: 'all',
                sortOption: 'most-popular',
                sortDirection: 'desc'
            }
        };
        this.handlePasswordChange = this.handlePasswordChange.bind(this);
        this.selectDropdown = this.selectDropdown.bind(this);
        this.handleSort = this.handleSort.bind(this);
    }

    componentDidMount() {
        let req = new Request('/api/get-current-user', {credentials: "same-origin"});
        fetch(req).then(resp => {
            if (!resp.ok) {
                this.setState({warning: 'You have no permission to view this.'});
            } else {
                return resp.json();
            }
        }).then(data => {
            this.setState({user: data, loaded: true});
        }).catch(err => {console.log('Responded with the error code {err}. You either have no permission to view this or the server has experienced an error. The first is way more likely, pal.');});
    }

    handlePasswordChange() {
        
    }

    handleSort(e) {
        let commentsDisplay = Object.assign({}, this.state.commentsDisplay);
        commentsDisplay.sortDirection = e.target.name;
        this.setState({commentsDisplay});
    }

    selectDropdown(type, eventKey) {
        let commentsDisplay = Object.assign({}, this.state.commentsDisplay);
        commentsDisplay[type] = eventKey;
        this.setState({commentsDisplay});
    }

    getComments() {
        let commentsType = this.state.commentsDisplay.commentsType;
        let sortOption = this.state.commentsDisplay.sortOption;
        let commentsArray;

        switch (commentsType) {
        case 'all':
            commentsArray = this.state.user.activity.author_comments.concat(this.state.user.activity.book_comments);
            break;
        case 'books':
            commentsArray = this.state.user.activity.book_comments;
            break;
        case 'authors':
            commentsArray = this.state.user.activity.author_comments;
            break;
        }

        let sortingFunction;

        switch (sortOption) {
        case 'most-popular':
            sortingFunction = this.state.commentsDisplay.sortDirection == 'desc' ? (a, b) => b.attitude - a.attitude : (a, b) => a.attitude - b.attitude;
            break;
        case 'most-hated':
            commentsArray = commentsArray.filter(item => item.attitude < 0);
            sortingFunction = this.state.commentsDisplay.sortDirection == 'desc' ? (a, b) => -(b.attitude - a.attitude) : (a, b) => -(a.attitude - b.attitude);
            break;
        case 'creation-date':
            sortingFunction = this.state.commentsDisplay.sortDirection == 'desc' ?
                (a, b) => {
                    let result = b.creation_date > a.creation_date ? 1: -1;
                    return result;
                } : (a, b) => {
                    let result = a.creation_date > b.creation_date ? 1: -1;
                    return result;
                }
            break;
        case 'last-change':
            commentsArray = commentsArray.filter(item => item.edition_date);
            sortingFunction = this.state.commentsDisplay.sortDirection == 'desc' ?
                (a, b) => {
                    let first = b.edition_date ? b.edition_date : b.creation_date;
                    let second = a.edition_date ? a.edition_date : a.creation_date;
                    let result = first > second ? 1 : -1;
                    return result;
                } : (a, b) => {
                    let first = a.edition_date ? a.edition_date : a.creation_date;
                    let second = b.edition_date ? b.edition_date : b.creation_date;
                    let result = first > second ? 1 : -1;
                    return result;
                };
            break;
        case 'creation-change':
        sortingFunction = this.state.commentsDisplay.sortDirection == 'desc' ?
                (a, b) => {
                    let first = b.edition_date ? b.edition_date : b.creation_date;
                    let second = a.edition_date ? a.edition_date : a.creation_date;
                    let result = first > second? 1 : -1;
                    return result;
                } : (a, b) => {
                    let first =  a.edition_date ? a.edition_date : a.creation_date;
                    let second = b.edition_date ? b.edition_date : b.creation_date;
                    let result = first > second? 1 : -1;
                    return result;
                };
            break;
        }

        commentsArray.sort(sortingFunction);
        const commentField = commentsArray.map((obj) =>
                                               <ListGroupItem>
                                               <strong>Topic</strong>: <Label>{obj.topic}</Label>   <strong>Created</strong>: {obj.creation_date}   {obj.edition_date && <span><strong>Edited</strong>: {obj.edition_date}</span>}   <strong>Link</strong>: <Link to={`/${obj.entity.name}/${obj.entity.id}`}>link</Link> <OverlayTrigger placement='top' overlay={<Tooltip id="tooltip">Likes count</Tooltip>}><Badge>{obj.attitude}</Badge></OverlayTrigger>
                                               </ListGroupItem>
        );
        return commentField;
    }

    render() {
        if (!this.state.loaded) {
            const warning = this.state.warning;
            return(<div>{warning.length > 0 ? {warning} : <h4>Loading...</h4>}</div>);
        } else {
            const user = this.state.user;
            const comments = this.getComments();

            return(
                <div>
                    <PageHeader>User Cabinet</PageHeader>
                    <Panel><strong>Username</strong>: {user.username}</Panel>
                    <Panel><strong>Email</strong>: {user.email}</Panel>
                    <Panel><strong>Registration date</strong>: {user.confirmed_at}</Panel>
                    <Panel><strong>Access level</strong>: {user.role}</Panel>
                    <hr/>
                    <h4 className='text-center'>Your Comments Section</h4>
                    <DropdownButton title='Sort comments' id='sorting-menu-dropdown' onSelect={(e) => {this.selectDropdown('sortOption', e)}}>
                    <MenuItem eventKey="most-popular" active={this.state.commentsDisplay.sortOption == 'most-popular'? true: false}>Most Popular</MenuItem>
                    <MenuItem eventKey="most-hated" active={this.state.commentsDisplay.sortOption == 'most-hated'? true: false}>Most hated (only negative likes count)</MenuItem>
                    <MenuItem eventKey="creation-date" active={this.state.commentsDisplay.sortOption == 'creation-date'? true: false}>Creation date</MenuItem>
                    <MenuItem eventKey="last-change" active={this.state.commentsDisplay.sortOption == 'last-change'? true: false}>Last change date (exclude unedited)</MenuItem>
                    <MenuItem eventKey="creation-change" active={this.state.commentsDisplay.sortOption == 'creation-change'? true: false}>Creation/last change date</MenuItem>
                    </DropdownButton>

                    <DropdownButton title='Comment type' id='comment-type-dropdown' onSelect={(e) => {this.selectDropdown('commentsType', e)}}>
                    <MenuItem eventKey="all" active={this.state.commentsDisplay.commentsType == 'all'? true: false}>All</MenuItem>
                    <MenuItem eventKey="authors" active={this.state.commentsDisplay.commentsType == 'authors'? true: false}>Authors</MenuItem>
                    <MenuItem eventKey="books" active={this.state.commentsDisplay.commentsType == 'books'? true: false}>Books</MenuItem>
                    </DropdownButton>

                    <Button name='asc' id='sort-up' onClick={this.handleSort} bsStyle={this.state.commentsDisplay.sortDirection == 'asc' ? 'primary' : 'default'}><Glyphicon glyph='glyphicon glyphicon-triangle-top'/></Button>
                    <Button name='desc' id='sort-down' onClick={this.handleSort} bsStyle={this.state.commentsDisplay.sortDirection == 'desc' ? 'primary' : 'default'}><Glyphicon glyph='glyphicon glyphicon-triangle-bottom'/></Button>

                    <Panel>
                    <ListGroup>
                    {comments}
                </ListGroup>
                    </Panel>
                </div>
            );
        }
    }
}

export {UserCabinet};


//TODO: sorting option
//TODO: display:none; display:block
//TODO:passwordchange
