# -*- coding: utf-8 -*-
import datetime

from sortedcontainers import SortedDict, SortedListWithKey

from project.models import Author, Book, AuthorComment, BookComment, User, db


def get_all_authors_with_sections():
    """Returns a SortedDict of last name letters of corresponding authors"""
    authors = Author.query.all()

    authors_sorted_by_letter = SortedDict()
    for a in authors:
        first_letter = a.surname[0].upper() if a.surname else a.name[0].upper()
        if first_letter not in authors_sorted_by_letter:
            authors_sorted_by_letter[first_letter] = SortedListWithKey(
                key=lambda a: (
                    (a['surname'] + a['name']).lower()
                    if a['surname']
                    else a['name'].lower()))
        authors_sorted_by_letter[first_letter].add({'id': a.id,
                                                    'name': a.name,
                                                    'surname': a.surname})

    # required to make SortedListWithKey JSON serializable
    for letter in authors_sorted_by_letter:
        authors_sorted_by_letter[letter] = list(
            authors_sorted_by_letter[letter])

    return {'authors': authors_sorted_by_letter}


def get_author_by_id(id=None):
    """Returns an author by id or aborts with 404"""
    author = Author.query.get_or_404(id)
    author = {
        'id': author.id,
        'name': author.name,
        'surname': author.surname,
        'description': author.description,
        'books': sorted([
            (b.id, b.title)
            for b in author.books
        ])
    }
    return author


def get_book_by_id(id=None):
    """Returns a book by id or aborts with 404"""
    book = Book.query.get_or_404(id)
    book = {
        'id': book.id,
        'title': book.title,
        'description': book.description,
        'text': book.text,
        'authors': [
            {'name': a.name,
             'surname': a.surname,
             'id': a.id}
            if a.surname
            else {'name': a.name,
                  'id': a.id}
            for a in book.authors]
    }
    return book


def get_user_by_id(sort_dict, max_comments_per_page, user_id=None):
    """Returns a jsonifiable dict with user info and his sorted comments"""
    user = User.query.get_or_404(user_id)
    max_comments_per_page = max_comments_per_page
    comments_dict = sort_user_comments(
        sort_dict,
        max_comments_per_page,
        user_id)

    if not user.roles:
        roles = 'user'
    else:
        roles = [r.name for r in user.roles]
        if len(roles) > 1:
            roles = '; '.join(roles)[:-2]

    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'confirmed_at': user.confirmed_at,
        'role': roles,
        'activity': {
            'comments': comments_dict['comments'],
            'pages': comments_dict['pages']
        }
    }


def sort_user_comments(sort_dict, max_comments_per_page, user_id=None):
    comments_per_page = max_comments_per_page
    comments_type = (AuthorComment
                     if sort_dict['comments_type'] == 'authors'
                     else BookComment)
    comments_query = (comments_type
                      .query
                      .filter(comments_type.user_id == user_id))

    if sort_dict['sort_option'] == 'most-popular':
        sort_query = (comments_type.rating.asc()
                      if sort_dict['sort_direction'] == 'asc'
                      else comments_type.rating.desc())
    elif sort_dict['sort_option'] == 'most-hated':
        comments_query = comments_query.filter(comments_type.rating < 0)
        sort_query = (comments_type.rating.asc()
                      if sort_dict['sort_direction'] == 'asc'
                      else comments_type.rating.desc())
    elif sort_dict['sort_option'] == 'creation-date':
        sort_query = (comments_type.created_at.asc()
                      if sort_dict['sort_direction'] == 'asc'
                      else comments_type.created_at.desc())
    elif sort_dict['sort_option'] == 'last-change':
        comments_query = comments_query.filter(
            comments_type.edited != comments_type.created_at)
        sort_query = (comments_type.edited.asc()
                      if sort_dict['sort_direction'] == 'asc'
                      else comments_type.edited.desc())
    elif sort_dict['sort_option'] == 'creation-change':
        sort_query = (comments_type.edited.asc()
                      if sort_dict['sort_direction'] == 'asc'
                      else comments_type.edited.desc())
    comments_pagination = (comments_query
                           .order_by(sort_query)
                           .paginate(
                               page=int(sort_dict['page']),
                               per_page=comments_per_page,
                               error_out=False))

    return {
        'comments': [
            {'id': c.id,
             'topic': (c.topic
                       if len(c.topic) <= 20
                       else c.topic[:20] + '...'),
             'attitude': c.rating,
             'creation_date': c.created_at,
             'edition_date': c.edited,
             'text': c.text,
             'entity': {
                 'name': 'authors' if hasattr(c, 'author_id') else 'books',
                 'id': c.author_id if hasattr(c, 'author_id') else c.book_id}}
            for c in comments_pagination.items],
        'pages': comments_pagination.pages
    }


def get_all_books_with_sections():
    """Returns an OrderedDict of first name letters of corresponding books"""
    books = Book.query.order_by(Book.title.asc()).all()
    books_sorted_by_letter = SortedDict()
    for b in books:
        first_letter = b.title[0].upper()
        if first_letter not in books_sorted_by_letter:
            books_sorted_by_letter[first_letter] = SortedListWithKey(
                key=lambda b: b['title'])
        books_sorted_by_letter[first_letter].add(
            {
                'id': b.id,
                'title': b.title
            })

    # required to make SortedListWithKey JSON serializable
    for letter in books_sorted_by_letter:
        books_sorted_by_letter[letter] = list(books_sorted_by_letter[letter])

    return {'books': books_sorted_by_letter}


def create_anonymous_author():
    author = Author(
        name='Anonymous',
        description='Sometimes the authorship is not certain.')
    db.session.add(author)
    db.session.commit()
    return author


def add_book(form, user_id):
    new_book = Book()
    new_book.title = form.title.data
    new_book.text = form.text.data
    if form.description:
        new_book.description = form.description.data
    author_tags = form.author_tags.data.rstrip().split(' ')
    if author_tags[0] == 'a':
        author = Author.query.filter(Author.name == 'Anonymous').first()
        if not author:
            author = create_anonymous_author()
        new_book.authors.append(author)
        db.session.flush()
        author.book_count = Author.book_count + 1
    else:
        new_book.authors = []
        authors_query = Author.query.filter(Author.id.in_(author_tags))
        authors_lst = authors_query.all()
        authors_query.update({Author.book_count: Author.book_count + 1},
                             synchronize_session=False)
        new_book.authors.extend(authors_lst)
    new_book.user = User.query.get_or_404(user_id)

    db.session.add(new_book)
    db.session.commit()


def update_book(book_id, form):
    book = Book.query.get(book_id)
    book.title = form.title.data
    book.description = form.description.data
    book.text = form.text.data

    author_tags = form.author_tags.data.rstrip().split(' ')
    current_authors = {a.id for a in book.authors}
    new_authors = set(author_tags) - current_authors
    Author.query.filter(Author.id.in_(new_authors))\
                .update({Author.book_count: Author.book_count + 1},
                        synchronize_session=False)
    deleted_authors = current_authors - set(author_tags)
    Author.query.filter(Author.id.in_(deleted_authors))\
                .update({Author.book_count: Author.book_count - 1},
                        synchronize_session=False)
    book.authors = Author.query.filter(Author.id.in_(author_tags)).all()
    db.session.commit()


def add_author(form, user_id):
    new_author = Author()
    new_author.name = form.first_name.data
    if form.last_name.data:
        new_author.surname = form.last_name.data
    if form.description.data:
        new_author.description = form.description.data
    db.session.add(new_author)
    if form.books:
        for book in form.books:
            if book.title.data and book.content.data:
                new_book = Book()
                new_book.title = book.title.data
                new_book.text = book.content.data
                if book.overview.data:
                    new_book.description = book.overview.data
                new_book.user = User.query.get_or_404(user_id)
                new_author.books.append(new_book)
    # flush to be able to increment book_count on author
    db.session.flush()
    new_author.book_count = Author.book_count + len(new_author.books)
    new_author.user = User.query.get_or_404(user_id)

    db.session.commit()


def update_author(author_id, form):
    author = Author.query.get(author_id)
    author.name = form.first_name.data
    author.surname = form.last_name.data
    book_tags = (form.book_tags.data.rstrip().split(' ')
                 if form.book_tags.data
                 else [])
    if len(author.books) != len(book_tags):
        author.book_count = Author.book_count + (
            len(book_tags) - len(author.books)
        )
    author.books = [Book.query.get(n) for n in book_tags] if book_tags else []
    author.description = form.description.data
    db.session.commit()


def update_comment(comment_id, comment_type, form):
    if comment_type.lower() == 'author':
        comment = AuthorComment.query.get(comment_id)
        comment.topic = form.topic.data
        comment.text = form.text.data
        comment.edited = datetime.datetime.utcnow()
        db.session.commit()
        return {
            'topic': comment.topic,
            'text': comment.text,
            'edited': comment.edited,
        }
    elif comment_type.lower() == 'book':
        comment = BookComment.query.get(comment_id)
        comment.topic = form.topic.data
        comment.text = form.text.data
        comment.edited = datetime.datetime.utcnow()
        db.session.commit()
        return {
            'topic': comment.topic,
            'text': comment.text,
            'edited': comment.edited,
        }
    else:
        return False


# FORM VALIDATION HELPERS
def check_if_author_exists(author_ids):
    authors_count = db.session\
        .query(db.func.count(Author.id))\
        .filter(Author.id.in_(author_ids))\
        .scalar()
    return len(author_ids) == authors_count


def check_if_book_exists(book_ids):
    books_count = db.session\
        .query(db.func.count(Book.id))\
        .filter(Book.id.in_(book_ids))\
        .scalar()
    return len(book_ids) == books_count


# SUGGESTIONS FUNCTIONS
def suggestions_initial(suggestion_type, initial_suggestions_number):
    suggestion_type = suggestion_type.lower()

    if suggestion_type == 'authors':
        author_number = Author.query.count()

        if author_number <= initial_suggestions_number:
            return {
                'suggestions': [a.surname + ' ' + a.name + ';' + str(a.id)
                                if a.surname else a.name + ';' + str(a.id)
                                for a in Author.query.all()],
                'finished': True
            }
        else:
            return {
                'suggestions': [a.surname + ' ' + a.name + ';' + str(a.id)
                                if a.surname else a.name + ';' + str(a.id)
                                for a in Author.query
                                    .order_by(Author.book_count.desc())
                                    .limit(initial_suggestions_number)
                                    .all()],
                'finished': False
            }
    elif suggestion_type == 'books':
        book_number = Book.query.count()
        if book_number <= initial_suggestions_number:
            return {
                'suggestions': [b.title + ';' + str(b.id)
                                for b in Book.query.all()],
                'finished': True
            }
        else:
            return {
                'suggestions': [b.title + ';' + str(b.id)
                                for b in Book.query
                                .order_by(Book.title)
                                .limit(initial_suggestions_number).all()],
                'finished': False
            }


def get_suggestions(query, suggestion_type, limited_number, amount=None):
    suggestion_type = suggestion_type.lower()

    if suggestion_type == 'authors':
        suggestions = db.session.query(Author.id, Author.name, Author.surname)
        if query:
            suggestions = suggestions.filter(
                (Author.name_tsvector.match(
                    query + ':*',
                    postgresql_regconfig='simple')) |
                (Author.surname_tsvector.match(
                    query + ':*',
                    postgresql_regconfig='simple')))
        suggestions = suggestions.order_by(Author.book_count.desc())
    else:
        suggestions = db.session.query(Book.id, Book.title)
        if query:
            suggestions = suggestions.filter(Book.title_tsvector.match(
                                                query + ':*',
                                                postgresql_regconfig='simple'))
            suggestions = suggestions.order_by(db.func.ts_rank(
                Book.title_tsvector,
                (query + ':*')))
    suggestions_count = suggestions.count()
    suggestions = suggestions.offset(amount).limit(limited_number)

    suggestions_list = suggestions.all()
    suggestions_dict = {}

    if not suggestions_list:
        suggestions_dict['suggestions'] = ['not found']
    elif suggestion_type == 'authors':
        suggestions_dict['suggestions'] = [
            a.surname + ' ' + a.name + ';' + str(a.id)
            if a.surname else a.name + ';' + str(a.id)
            for a in suggestions_list]
    else:
        suggestions_dict['suggestions'] = [b.title + ';' + str(b.id)
                                           for b in suggestions_list]

    if amount:
        suggestions_dict['amount'] = (
            int(amount) + limited_number
            if suggestions_count >= limited_number
            else int(amount) + suggestions_count)
        suggestions_dict['finished'] = (
            suggestions_count <= limited_number + int(amount))
    else:
        suggestions_dict['finished'] = suggestions_count <= limited_number

    return suggestions_dict


def get_all_author_comments_by_author_id(
        author_id,
        comments_per_chunk,
        user_id=None,
        chunk=1,
        comment_to_highlight=None):

    comments_per_chunk = comments_per_chunk
    comments_query = (AuthorComment.query
                      .filter(AuthorComment.author_id == author_id)
                      .order_by(AuthorComment.edited.desc()))
    if comment_to_highlight:
        comments_list = comments_query.all()
        comment_index = comments_list.index(
            AuthorComment.query.get(comment_to_highlight))
        comments_list = comments_list[:comment_index+comments_per_chunk]
        if comment_index > comments_per_chunk:
            chunk = comment_index / comments_per_chunk + 1
    else:
        comments_list = comments_query\
            .offset((chunk-1) * comments_per_chunk)\
            .limit(comments_per_chunk)\
            .all()
    comments_left = (len(comments_list) > 0 and
                     not len(comments_list) < comments_per_chunk)

    if user_id is None:
        comments_dict = {
            'comments': [
                {
                    'id': c.id,
                    'topic': c.topic,
                    'text': c.text,
                    'rating': c.rating,
                    'created_at': c.created_at,
                    'edited': c.edited,
                    'username': c.user.username,
                    'liked': False,
                    'disliked': False,
                    'current_user_wrote': False
                }
                for c in comments_list],
            'chunk': chunk,
            'comments_left': comments_left
        }
    else:
        user = User.query.get(user_id)
        comments_dict = {
            'comments': [
                {
                    'id': c.id,
                    'topic': c.topic,
                    'text': c.text,
                    'rating': c.rating,
                    'created_at': c.created_at,
                    'edited': c.edited,
                    'username': c.user.username,
                    'liked': c in user.author_comments_likes,
                    'disliked': c in user.author_comments_dislikes,
                    'current_user_wrote': c.user is user
                }
                for c in comments_list],
            'chunk': chunk,
            'comments_left': comments_left
        }

    return comments_dict


def get_all_book_comments_by_book_id(
        book_id,
        comments_per_chunk,
        user_id=None,
        chunk=1,
        comment_to_highlight=None):

    comments_per_chunk = comments_per_chunk
    comments_query = (BookComment.query
                      .filter(BookComment.book_id == book_id)
                      .order_by(BookComment.edited.desc()))
    if comment_to_highlight:
        comments_list = comments_query.all()
        comment_index = comments_list.index(
            BookComment.query.get(comment_to_highlight))
        comments_list = comments_list[:comment_index+comments_per_chunk]
        if comment_index > comments_per_chunk:
            chunk = comment_index / comments_per_chunk + 1
    else:
        comments_list = comments_query.slice(
            ((chunk-1)*comments_per_chunk), comments_per_chunk).all()
    comments_left = (len(comments_list) > 0 and
                     not len(comments_list) < comments_per_chunk)

    if user_id is None:
        comments_dict = {
            'comments': [
                {
                    'id': c.id,
                    'topic': c.topic,
                    'text': c.text,
                    'rating': c.rating,
                    'created_at': c.created_at,
                    'edited': c.edited,
                    'username': c.user.username,
                    'liked': False,
                    'disliked': False,
                    'current_user_wrote': False
                }
                for c in comments_list],
            'chunk': chunk,
            'comments_left': comments_left
        }
    else:
        user = User.query.get(user_id)
        comments_dict = {
            'comments': [
                {
                    'id': c.id,
                    'topic': c.topic,
                    'text': c.text,
                    'rating': c.rating,
                    'created_at': c.created_at,
                    'edited': c.edited,
                    'username': c.user.username,
                    'liked': c in user.book_comments_likes,
                    'disliked': c in user.book_comments_dislikes,
                    'current_user_wrote': c.user is user
                }
                for c in comments_list],
            'chunk': chunk,
            'comments_left': comments_left
        }

    return comments_dict


def add_comment(form, user_id, comment_type, entity_id):
    comment = None
    comment_type = comment_type.lower()

    if comment_type == 'author':
        comment = AuthorComment()
        comment.author = Author.query.get(entity_id)
    elif comment_type == 'book':
        comment = BookComment()
        comment.book = Book.query.get(entity_id)

    if comment:
        comment.topic = form.topic.data
        comment.text = form.text.data
        comment.user = User.query.get(user_id)

        db.session.add(comment)
        db.session.flush()
        comment.edited = comment.created_at
        db.session.commit()

        return {
            'id': comment.id,
            'topic': comment.topic,
            'text': comment.text,
            'rating': comment.rating,
            'created_at': comment.created_at,
            'edited': comment.edited,
            'username': comment.user.username,
            'current_user_wrote': True

        }

    return False


def react_to_comment(attitude, comment_type, comment_id, user_id):
    attitude = attitude.lower()
    comment_type = comment_type.lower()

    if attitude == 'like':
        post_modification_dct = _like_comment(comment_type,
                                              comment_id,
                                              user_id)
    elif attitude == 'dislike':
        post_modification_dct = _dislike_comment(comment_type,
                                                 comment_id,
                                                 user_id)

    return post_modification_dct


def delete_comment(comment_type, comment_id):
    comment_type = comment_type.lower()
    comment_to_delete = None

    if comment_type == 'authors':
        comment_to_delete = AuthorComment.query.get(comment_id)
    elif comment_type == 'books':
        comment_to_delete = BookComment.query.get(comment_id)

    if comment_to_delete:
        db.session.delete(comment_to_delete)
        db.session.commit()


def delete_book_or_author(entity_type, entity_id):
    entity_to_delete = None

    if entity_type == 'authors':
        entity_to_delete = Author.query.get(entity_id)
    elif entity_type == 'books':
        entity_to_delete = Book.query.get(entity_id)

    if entity_to_delete:
        db.session.delete(entity_to_delete)
        db.session.commit()


def check_if_user_wrote_comment(user_id, comment_id, comment_type):
    comment_type = comment_type.lower()

    if comment_type not in ['author', 'book']:
        return False

    return (
        user_id == AuthorComment.query.get(comment_id).user_id
        if comment_type == 'author'
        else user_id == BookComment.query.get(comment_id).user_id)


def check_if_user_can_edit_entity(entity_type, entity_id, user_id):
    if entity_type == 'author':
        author = Author.query.get_or_404(entity_id)
        return author.user_id == user_id
    elif entity_type == 'book':
        book = Book.query.get_or_404(entity_id)
        return book.user_id == user_id

    return False


# private helper functions for react_to_comment
def _like_comment(comment_type, comment_id, user_id):
    user = User.query.get(user_id)
    comment_class = AuthorComment if comment_type == 'author' else BookComment
    comment = comment_class.query.get(comment_id)
    post_modification_dct = {}

    if user in comment.users_liked:
        comment.users_liked.remove(user)
        comment.rating = comment_class.rating - 1
        post_modification_dct['user_reaction'] = 'neutral'
    elif user in comment.users_disliked:
        comment.users_disliked.remove(user)
        comment.users_liked.append(user)
        comment.rating = comment_class.rating + 2
        post_modification_dct['user_reaction'] = 'liked'
    else:
        comment.users_liked.append(user)
        comment.rating = comment_class.rating + 1
        post_modification_dct['user_reaction'] = 'liked'

    db.session.commit()
    post_modification_dct['rating'] = comment.rating

    return post_modification_dct


def _dislike_comment(comment_type, comment_id, user_id):
    user = User.query.get(user_id)
    comment_class = AuthorComment if comment_type == 'author' else BookComment
    comment = comment_class.query.get(comment_id)
    post_modification_dct = {}

    if user in comment.users_liked:
        comment.users_liked.remove(user)
        comment.users_disliked.append(user)
        comment.rating = comment_class.rating - 2
        post_modification_dct['user_reaction'] = 'disliked'
    elif user in comment.users_disliked:
        comment.users_disliked.remove(user)
        comment.rating = comment_class.rating + 1
        post_modification_dct['user_reaction'] = 'neutral'
    else:
        comment.users_disliked.append(user)
        comment.rating = comment_class.rating - 1
        post_modification_dct['user_reaction'] = 'disliked'

    db.session.commit()
    post_modification_dct['rating'] = comment.rating

    return post_modification_dct
