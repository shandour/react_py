from flask import (
    current_app as app,
    render_template,
    jsonify,
    request,
    Response,
    after_this_request,
    abort
)
from flask_security import (
    current_user,
    logout_user,
    login_user,
    LoginForm
)
from flask_security.views import _commit
from flask_security.forms import ChangePasswordForm
from flask_security.decorators import anonymous_user_required
from flask_security.registerable import register_user
from flask_security.changeable import change_user_password

from project.security import ADMIN_ROLE, EDITOR_ROLE
from project.forms import (
    AddAuthorForm,
    AddBookForm,
    EditAuthorForm,
    AddCommentForm,
    CommentForm,
    UpgradedRegisterForm
)
from project.db_operations import (
    get_all_authors_with_sections,
    get_author_by_id,
    get_all_books_with_sections,
    get_book_by_id,
    get_user_by_id,
    add_author as add_one_author,
    add_book as add_one_book,
    add_comment as add_one_comment,
    update_author,
    update_book,
    update_comment,
    suggestions_initial,
    get_suggestions,
    get_all_author_comments_by_author_id,
    get_all_book_comments_by_book_id,
    check_if_user_wrote_comment,
    react_to_comment,
    delete_comment as delete_one_comment,
    sort_user_comments,
    check_if_user_can_edit_entity,
    delete_book_or_author
)
from project.blueprints import index_bp, api_bp


@index_bp.route('/', defaults={'path': ''})
@index_bp.route('/<path:path>')
def index_page(path):
    return render_template('index.html')


@api_bp.route('/authors')
def authors():
    return jsonify(get_all_authors_with_sections())


@api_bp.route('/authors/<int:author_id>')
def show_author(author_id):
    return jsonify(get_author_by_id(author_id))


@api_bp.route('/authors/add', methods=['POST'])
def add_author():
    if not current_user.is_authenticated:
        abort(403)

    form = AddAuthorForm(request.form)

    if form.validate_on_submit():
        add_one_author(form, current_user.id)
        return Response(status='201')
    else:
        return jsonify(form.get_dict_errors())


@api_bp.route('/authors/<int:author_id>', methods=['PUT'])
def edit_author(author_id):
    if not current_user.is_authenticated:
        abort(403)
    form = EditAuthorForm(request.form)

    if form.validate_on_submit():
        update_author(author_id, form)
        return Response(status='204')
    else:
        return jsonify(form.errors)


@api_bp.route('/books')
def books():
    return jsonify(get_all_books_with_sections())


@api_bp.route('/books/<int:book_id>')
def show_book(book_id):
    return jsonify(get_book_by_id(book_id))


@api_bp.route('/books/add', methods=['POST'])
def add_book():
    if not current_user.is_authenticated:
        abort(403)
    form = AddBookForm(request.form)

    if form.validate_on_submit():
        add_one_book(form, current_user.id)
        return Response(status='201')
    else:
        return jsonify(form.errors)


@api_bp.route('/books/<int:book_id>', methods=['PUT'])
def edit_book(book_id):
    if not current_user.is_authenticated:
        abort(403)
    form = AddBookForm(request.form)

    if form.validate_on_submit():
        update_book(book_id, form)
        return Response(status='204')
    else:
        return jsonify(form.errors)


@api_bp.route('/can-user-edit-entity')
def can_user_edit_entity():
    if not current_user.is_authenticated:
        abort(403)
    roles = [r.name.lower() for r in current_user.roles]
    if not (ADMIN_ROLE in roles or EDITOR_ROLE in roles):
        if check_if_user_can_edit_entity(
                request.args['entity'],
                request.args['id'],
                current_user.id):
            return Response(status='200')
        return Response(status='403')
    return Response(status='200')


# suggestions for author and book tags:
# initial called when during React's componentDidMount
@api_bp.route('/authors/suggestions')
def authors_initial_suggestions():
    initial = request.args.get('initial')
    if initial:
        initial_suggestions_number = app.config['INITIAL_SUGGESTIONS_NUMBER']
        initial = suggestions_initial('authors', initial_suggestions_number)

        return jsonify(initial)

    current_amount = request.args.get('amount')
    query = request.args['q']
    limited_number = app.config['SUGGESTIONS_PER_QUERY']
    new_info = get_suggestions(
        query,
        'authors',
        limited_number,
        current_amount)

    return jsonify(new_info)


@api_bp.route('/books/suggestions')
def books_initial_suggestions():
    initial = request.args.get('initial')
    if initial:
        initial_suggestions_number = app.config['INITIAL_SUGGESTIONS_NUMBER']
        initial = suggestions_initial('books', initial_suggestions_number)

        return jsonify(initial)

    current_amount = request.args.get('amount')
    query = request.args['q']
    limited_number = app.config['SUGGESTIONS_PER_QUERY']
    new_info = get_suggestions(
        query,
        'books',
        limited_number,
        current_amount)

    return jsonify(new_info)


@api_bp.route('/<string:entity_type>/<int:entity_id>', methods=['DELETE'])
def delete_book_or_author_from_db(entity_type, entity_id):
    if not entity_id:
        abort(404)
    if not current_user.is_authenticated:
        abort(403)
    roles = [r.name.lower() for r in current_user.roles]
    if ((ADMIN_ROLE in roles or EDITOR_ROLE in roles)
        or check_if_user_can_edit_entity(
            entity_type[:-1],
            entity_id,
            current_user.id)):
        delete_book_or_author(entity_type, entity_id)
        return Response(status='200')
    abort(403)


# LOGIN LOGIC
@api_bp.route('/is-logged-in')
@api_bp.route('/is-logged-in/<string:info>')
def is_user_logged_in(info=None):
    if not current_user.is_authenticated:
        abort(403)
    elif info is not None:
        resp = jsonify({
            'username': current_user.username,
        })
        resp.status = '200'
        return resp
    else:
        return Response(status='200')


# LOGOUT ASSISTANT
@api_bp.route('/logout')
def logout_current_user():
    if not current_user.is_authenticated:
        abort(403)
    else:
        logout_user()
        return Response(status='200')


# COMMENTS functionality
@api_bp.route('/<string:comment_type>/<int:entity_id>/comments')
def comments(comment_type, entity_id):
    if comment_type not in ['authors', 'books']:
        return
    comments_per_chunk = app.config['COMMENTS_PER_CHUNK']
    comments = {}
    chunk = request.args.get('chunk')
    if not chunk:
        chunk = 1
    highlight = request.args.get('highlight')
    if highlight:
        highlight = int(highlight)
    user_id = current_user.id if hasattr(current_user, 'id') else None
    comments = (
        get_all_author_comments_by_author_id(entity_id,
                                             comments_per_chunk,
                                             user_id,
                                             int(chunk),
                                             highlight)
        if comment_type == 'authors'
        else get_all_book_comments_by_book_id(entity_id,
                                              comments_per_chunk,
                                              user_id,
                                              int(chunk),
                                              highlight)
    )
    comments['authenticated'] = current_user.is_authenticated
    return jsonify(comments)


# like, dislike or revert to neutral
@api_bp.route('/comments/attitude', methods=['POST'])
def attitude_on_comment():
    if not request.method == 'POST':
        abort(405)
    if not current_user.is_authenticated:
        abort(403)
    attitude = request.args.get('attitude')
    comment_type = request.args.get('comment_type')
    comment_id = request.args.get('comment_id')
    reaction = react_to_comment(attitude,
                                comment_type,
                                comment_id,
                                current_user.id)
    return jsonify(reaction)


# invoke check_user_identity or see if user is admin
@api_bp.route('/<string:comment_type>/comments/<int:comment_id>',
              methods=['DELETE'])
def delete_comment(comment_type, comment_id):
    if not check_user_identity(comment_id, comment_type[:-1]):
        abort(403)
    delete_one_comment(comment_type, comment_id)
    return Response(status='200')


@api_bp.route('/<string:comment_type>/comments/<int:comment_id>',
              methods=['POST'])
def add_comment(comment_type, comment_id):
    if not current_user.is_authenticated:
        abort(403)
    form = AddCommentForm(request.form)
    if form.validate_on_submit():
        comment = add_one_comment(form,
                                  current_user.id,
                                  comment_type[:-1],
                                  comment_id)
        if not comment:
            abort(422)
        payload = jsonify({'new_comment': comment, 'success': True})
        return payload
    else:
        return jsonify({'errors': form.errors})


@api_bp.route('/<string:comment_type>/comments/<int:comment_id>',
              methods=['PUT'])
def edit_comment(comment_type, comment_id):
    if not check_user_identity(comment_id, comment_type[:-1]):
        errors = {'topic': 'you don\'t have the permission to edit',
                  'text': 'you don\'t have the permission to edit'}
        return jsonify({'errors': errors, 'success': False})

    form = CommentForm(request.form)
    if form.validate_on_submit():
        comment = update_comment(comment_id, comment_type[:-1], form)
        if not comment:
            abort(422)
        payload = jsonify({'edited_comment': comment, 'success': True})
        return payload
    else:
        return jsonify({'errors': form.errors, 'success': False})


# check if user can edit and tell client
@api_bp.route('/can-user-edit')
def can_user_edit():
    comment_type = request.args.get('comment_type')
    comment_id = request.args.get('comment_id')
    if not check_user_identity(comment_id, comment_type):
        abort(403)
    else:
        return Response(status='200')


# check user identity: returns True if user is logged-in,
# wrote the comment or is admin
def check_user_identity(comment_id, comment_type):
    roles = [r.name.lower() for r in current_user.roles]
    return (current_user.is_authenticated
            and (ADMIN_ROLE in roles
                 or check_if_user_wrote_comment(
                     current_user.id,
                     comment_id,
                     comment_type
                 )))


# custom login mechanism
@api_bp.route('/login', methods=['POST'])
@anonymous_user_required
def login():
    form = LoginForm(request.form)

    if form.validate_on_submit():
        login_user(form.user, remember=form.remember.data)
        return Response(status='202')
    else:
        return jsonify(form.errors), 401


# custom register mechanism
@api_bp.route('/register', methods=['POST'])
@anonymous_user_required
def register():
    form = UpgradedRegisterForm(request.form)
    if form.validate_on_submit():
        user = register_user(**form.to_dict())
        login_user(user)
        return Response(status='202')
    else:
        return jsonify(form.errors), 401


# custom change password mechanism
@api_bp.route('/change-password', methods=['PUT'])
def change_password():
    if not current_user.is_authenticated:
        abort(403)
    form = ChangePasswordForm(request.form)
    if form.validate_on_submit():
        after_this_request(_commit)
        change_user_password(current_user._get_current_object(),
                             form.new_password.data)
        return Response(status='202')
    else:
        return jsonify(form.errors), 401


@api_bp.route('/get-user-comments')
def get_user_comments_sorted():
    if not current_user.is_authenticated:
        abort(403)
    sort_dict = {
        'sort_option': request.args.get('sortOption'),
        'sort_direction': request.args.get('sortDirection'),
        'comments_type': request.args.get('commentsType'),
        'page': request.args.get('page')
    }

    max_comments_per_page = app.config['USER_CABINET_PAGINATION_PER_PAGE']

    comments = (sort_user_comments(
                    sort_dict,
                    max_comments_per_page,
                    current_user.id)
                if not request.args.get('initial')
                else get_user_by_id(
                    sort_dict,
                    max_comments_per_page,
                    current_user.id))
    return jsonify(comments)
