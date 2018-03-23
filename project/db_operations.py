# -*- coding: utf-8 -*-
import datetime

from sortedcontainers import SortedDict, SortedListWithKey

from project.models import Author, Book, AuthorComment, BookComment, User, db


def get_all_authors_with_sections():
    """Returns a SortedDict of last name letters of corresponding authors"""
    authors = Author.query.all()
 
    d = SortedDict()
    for a in authors:
        first_letter = a.surname[0].upper() if a.surname else a.name[0].upper()
        if first_letter not in d:
            d[first_letter] = SortedListWithKey(
                key=lambda a: (
                    (a['surname'] + a['name']).lower()
                    if a['surname'] else a['name'].lower()
                ))
        d[first_letter].add({'id': a.id,
                             'name': a.name,
                             'surname': a.surname})

    #required to make SortedListWithKey JSON serializable
    for letter in d:
        d[letter] = list(d[letter])

    authors_dict = {'authors': d}

    return authors_dict


def get_author_by_id(id=None):
    """Returns an author by id or aborts with 404"""
    author = Author.query.get_or_404(id)
    author = dict(
        id=author.id,
        name=author.name,
        surname=author.surname,
        description=author.description,
        books=sorted([
            (b.id, b.title)
            for b in author.books
        ])
    )
    return author


def get_book_by_id(id=None):
    """Returns a book by id or aborts with 404"""
    book = Book.query.get_or_404(id)
    book = dict(
        id=book.id,
        title=book.title,
        description=book.description,
        text=book.text,
        authors=[
            {'name': a.name,
             'surname': a.surname,
             'id': a.id}
            if a.surname
            else {'name': a.name,
                  'id': a.id}
            for a in book.authors]
    )
    return book


#for comments invoke the get by sort option function
def get_user_by_id(sort_dict, max_comments_per_page, user_id=None):
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
    comments_type = (AuthorComment if sort_dict['comments_type'] == 'authors'
                     else BookComment)
    comments_query = (comments_type.query
                        .filter(comments_type.user_id == user_id))

    if sort_dict['sort_option'] == 'most-popular':
        sort_query = (comments_type.likes_count.asc()
                      if sort_dict['sort_direction'] == 'asc'
                      else comments_type.likes_count.desc())
    elif sort_dict['sort_option'] == 'most-hated':
        comments_query = comments_query.filter(comments_type.likes_count < 0)
        sort_query = (comments_type.likes_count.asc()
                      if sort_dict['sort_direction'] == 'asc'
                      else comments_type.likes_count.desc())
    elif sort_dict['sort_option'] == 'creation-date':
        sort_query = (comments_type.created_at.asc()
                      if sort_dict['sort_direction'] == 'asc'
                      else comments_type.created_at.desc())
    elif sort_dict['sort_option'] == 'last-change':
        comments_query = comments_query.filter(comments_type
                                               .edited !=
                                               comments_type
                                               .created_at)
        sort_query = (comments_type.edited.asc()
                      if sort_dict['sort_direction'] == 'asc'
                      else comments_type.edited.desc())
    elif sort_dict['sort_option'] == 'creation-change':
        if sort_dict['sort_direction'] == 'asc':
            sort_query = comments_type.edited.asc()
        else:
            sort_query = comments_type.edited.desc()
    comments_pagination = (comments_query
                .order_by(sort_query)
                .paginate(
                    page=int(sort_dict['page']),
                    per_page=comments_per_page,
                    error_out=False))

    return {
        'comments': [
            {'id': c.id,
             'topic': c.topic if len(c.topic) <=20
                 else c.topic[:20] + '...',
             'attitude': c.likes_count,
             'creation_date': c.created_at,
             'edition_date': c.edited,
             'text': c.text,
             'entity': {
                 'name': 'authors' if hasattr(c, 'author_id') else 'books',
                 'id': c.author_id if hasattr(c, 'author_id') else c.book_id
             }
            }
            for c in comments_pagination.items],
        'pages': comments_pagination.pages
    }


def get_all_books_with_sections():
    """Returns an OrderedDict of first name letters of corresponding books"""
    books = Book.query.order_by(Book.title.asc()).all()
    d = SortedDict()
    for b in books:
        first_letter = b.title[0].upper()
        if first_letter not in d:
            d[first_letter] = SortedListWithKey(key=lambda b: b['title'])
        d[first_letter].add(
            {
                'id': b.id,
                'title': b.title
            }
        )

    # required to make SortedListWithKey JSON serializable
    for letter in d:
        d[letter] = list(d[letter])

    books_dict = {'books': d}

    return books_dict


def create_anonymous_author():
    author = Author(
        name='Anonymous',
        description='Sometimes the authorshop is not certain.'
    )
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
        for a in author_tags:
            author = Author.query.get(a)
            new_book.authors.append(author)
            db.session.flush()
            author.book_count = Author.book_count + 1
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
    for a_id in new_authors:
        Author.query.get(a_id).book_count = Author.book_count + 1
    deleted_authors = current_authors - set(author_tags)
    for a_id in deleted_authors:
        Author.query.get(a_id).book_count = Author.book_count - 1
    book.authors = [Author.query.get(a_id) for a_id in author_tags]
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


#FORM VALIDATION HELPERS
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


#RETURNS RANDOM BOOK OR AUTHOR ID DEPENDING ON ENTITY_TYPE
def get_random_entity():
    from random import choice

    entity_type = choice(['book', 'author'])
    if entity_type == "book":
        book_ids = [n[0] for n in db.session.query(Book.id).all()]
        return {'id': choice(book_ids), 'entity': entity_type}
    elif entity_type == "author":
        author_ids =  [n[0] for n in db.session.query(Author.id).all()]
        return {'id': choice(author_ids), 'entity': entity_type}
    else:
        return


#SUGGESTIONS FUNCTIONS
def suggestions_initial(suggestion_type, initial_suggestions_number):
    initial_suggestions = initial_suggestions_number
    if suggestion_type.lower() == 'authors':
        author_number = Author.query.count()

        if author_number < initial_suggestions:
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
                                 for a in Author.query.order_by(
                                    Author.book_count.desc()).limit(
                                        initial_suggestions)],
                'finished': False
            }
    elif suggestion_type.lower() == 'books':
        book_number = Book.query.count()
        if book_number < initial_suggestions:
            return {
                'suggestions': [b.title + ';' + str(b.id)
                                for b in Book.query.all()],
                'finished': True
            }
        else:
            return {
                'suggestions': [b.title + ';' + str(b.id)
                                for b in Book.query.limit(
                                        initial_suggestions)],
                'finished': False
            }


def get_suggestions(query, suggestion_type, limited_number, amount=None):
    limited_number = limited_number
    if suggestion_type.lower() == 'authors':
        Entity = Author
        suggestions = db.session.query(Entity.id, Entity.name, Entity.surname)
        if query:
            suggestions = suggestions.filter((Entity.name_tsvector.match(
                                                 query + ':*',
                                                 postgresql_regconfig='simple')
                                            ) | (Entity.surname.match(
                                                 query + ':*',
                                                 postgresql_regconfig='simple')
                                            ))
        suggestions = suggestions.order_by(Entity.book_count.desc())
    else:
        Entity = Book
        suggestions = db.session.query(Entity.id, Entity.title)
        if query:
            suggestions = suggestions.filter(Entity.title.match(
                                                query + ':*',
                                                postgresql_regconfig='simple'))
    suggestions_count = suggestions.count()
    suggestions = suggestions.offset(amount).limit(limited_number)

    suggestions_list = suggestions.all()
    suggestions_dict = {}

    if not suggestions_list:
        suggestions_dict['suggestions'] = ['not found']
    elif Entity is Author:
        suggestions_dict['suggestions'] = (
            [a.surname + ' ' + a.name + ';' + str(a.id)
             if a.surname else a.name + ';' + str(a.id)
             for a in suggestions_list]
        )
    else:
        suggestions_dict['suggestions'] = (
            [b.title + ';' + str(b.id)
             for b in suggestions_list]
        )

    if amount:
        suggestions_dict['amount'] = (
            int(amount) + limited_number
            if suggestions_count >= limited_number
            else int(amount) + suggestions_count
        )
        suggestions_dict['finished'] = (
            True if suggestions_count <= limited_number + int(amount)
            else False)
    else:
        suggestions_dict['finished'] = (
            True if suggestions_count <= limited_number
            else False)

    return suggestions_dict


def get_all_author_comments_by_author_id(
        author_id,
        comments_per_chunk,
        user_id=None,
        chunk=1,
        comment_to_highlight=None):

    comments_per_chunk = comments_per_chunk
    comments_query = (AuthorComment.query
        .filter(AuthorComment.author_id==author_id)
        .order_by(AuthorComment.edited
        .desc()))
    if comment_to_highlight:
        comments_list = comments_query.all()
        comment_index = comments_list.index(
            AuthorComment.query.get(comment_to_highlight))
        comments_list = comments_list[:comment_index+comments_per_chunk]
        if comment_index > comments_per_chunk:
            chunk = comment_index / comments_per_chunk + 1
    else:
        comments_list = comments_query.offset((chunk-1)*comments_per_chunk)\
        .limit(comments_per_chunk).all()
    comments_left = True if (comments_list and not len(
        comments_list) < comments_per_chunk) else False

    if user_id is None:
        comments_dict = {
            'comments': [
            {
                'id': c.id,
                'topic': c.topic,
                'text': c.text,
                'likes_count': c.likes_count,
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
                'likes_count': c.likes_count,
                'created_at': c.created_at,
                'edited': c.edited,
                'username': c.user.username,
                'liked': True if c in user.author_comments_likes else False,
                'disliked': (True if c in user.author_comments_dislikes
                             else False),
                'current_user_wrote': True if c.user is user else False
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
        .filter(BookComment.book_id==book_id)
        .order_by(BookComment.edited
        .desc()))
    if comment_to_highlight:
        comments_list = comments_query.all()
        comment_index = comments_list.index(
            BookComment.query.get(comment_to_highlight))
        comments_list = comments_list[:comment_index+comments_per_chunk]
        if comment_index > comments_per_chunk:
            chunk = comment_index / comments_per_chunk + 1
    else:
        comments_list = comments_query.slice(((chunk-1)*comments_per_chunk),
        comments_per_chunk).all()
    comments_left = True if (comments_list and not len(
        comments_list) < comments_per_chunk) else False

    if user_id is None:
        comments_dict = {
            'comments': [
            {
                'id': c.id,
                'topic': c.topic,
                'text': c.text,
                'likes_count': c.likes_count,
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
                'likes_count': c.likes_count,
                'created_at': c.created_at,
                'edited': c.edited,
                'username': c.user.username,
                'liked': True if c in user.book_comments_likes else False,
                'disliked': (True if c in user.book_comments_dislikes
                             else False),
                'current_user_wrote': True if c.user is user else False
            }
        for c in comments_list],
            'chunk': chunk,
            'comments_left': comments_left
        }

    return comments_dict


def add_comment (form, user_id, comment_type, entity_id):
    if comment_type.lower() == 'author':
        comment = AuthorComment()
        comment.topic = form.topic.data
        comment.text = form.text.data
        comment.author = Author.query.get(entity_id)
        comment.user = User.query.get(user_id)
        db.session.add(comment)
        db.session.flush()
        comment.edited = comment.created_at
        db.session.commit()
        return {
            'id': comment.id,
            'topic': comment.topic,
            'text': comment.text,
            'likes_count': comment.likes_count,
            'created_at': comment.created_at,
            'edited': comment.edited,
            'username': comment.user.username,
            'current_user_wrote': True
        }
    elif comment_type.lower() == 'book':
        comment = BookComment()
        comment.topic = form.topic.data
        comment.text = form.text.data
        comment.book = Book.query.get(entity_id)
        comment.user = User.query.get(user_id)
        db.session.add(comment)
        db.session.flush()
        comment.edited = comment.created_at
        db.session.commit()
        return {
            'id': comment.id,
            'topic': comment.topic,
            'text': comment.text,
            'likes_count': comment.likes_count,
            'created_at': comment.created_at,
            'edited': comment.edited,
            'username': comment.user.username,
            'current_user_wrote': True

        }
    else:
        return False


def react_to_comment(attitude, comment_type, comment_id, user_id):
    if attitude.lower() == 'like':
        user = User.query.get(user_id)
        if comment_type.lower() == 'author':
            author_comment = AuthorComment.query.get(comment_id)
            if user in author_comment.users_liked:
                author_comment.users_liked.remove(user)
                author_comment.likes_count = AuthorComment.likes_count - 1
                db.session.commit()
                return {
                    'liked': False,
                    'disliked': False,
                    'likes_count': author_comment.likes_count
                }
            elif user in author_comment.users_disliked:
                author_comment.users_disliked.remove(user)
                author_comment.users_liked.append(user)
                author_comment.likes_count = AuthorComment.likes_count + 2
                db.session.commit()
                return {
                    'liked': True,
                    'disliked': False,
                    'likes_count': author_comment.likes_count
                }
            else:
                author_comment.users_liked.append(user)
                author_comment.likes_count = AuthorComment.likes_count + 1
                db.session.commit()
                return {
                    'liked': True,
                    'disliked': False,
                    'likes_count': author_comment.likes_count
                }
        elif comment_type.lower() == 'book':
            book_comment = BookComment.query.get(comment_id)
            if user in book_comment.users_liked:
                book_comment.users_liked.remove(user)
                book_comment.likes_count = BookComment.likes_count - 1
                db.session.commit()
                return {
                    'liked': False,
                    'disliked': False,
                    'likes_count': book_comment.likes_count
                }
            elif user in book_comment.users_disliked:
                book_comment.users_disliked.remove(user)
                book_comment.users_liked.append(user)
                book_comment.likes_count = BookComment.likes_count + 2
                db.session.commit()
                return {
                    'liked': True,
                    'disliked': False,
                    'likes_count': book_comment.likes_count
                }
            else:
                book_comment.users_liked.append(user)
                book_comment.likes_count = BookComment.likes_count + 1
                db.session.commit()
                return {
                    'liked': True,
                    'disliked': False,
                    'likes_count': book_comment.likes_count
                }
        else:
            return False
    elif attitude.lower() == 'dislike':
        user = User.query.get(user_id)
        if comment_type.lower() == 'author':
            author_comment = AuthorComment.query.get(comment_id)
            if user in author_comment.users_disliked:
                author_comment.users_disliked.remove(user)
                author_comment.likes_count = AuthorComment.likes_count + 1
                db.session.commit()
                return {
                    'liked': False,
                    'disliked': False,
                    'likes_count': author_comment.likes_count
                }
            elif user in author_comment.users_liked:
                author_comment.users_liked.remove(user)
                author_comment.users_disliked.append(user)
                author_comment.likes_count = AuthorComment.likes_count - 2
                db.session.commit()
                return {
                    'liked': False,
                    'disliked': True,
                    'likes_count': author_comment.likes_count
                }
            else:
                author_comment.users_disliked.append(user)
                author_comment.likes_count = AuthorComment.likes_count - 1
                db.session.commit()
                return {
                    'liked': False,
                    'disliked': True,
                    'likes_count': author_comment.likes_count
                }
        elif comment_type.lower() == 'book':
            book_comment = BookComment.query.get(comment_id)
            if user in book_comment.users_disliked:
                book_comment.users_disliked.remove(user)
                book_comment.likes_count = BookComment.likes_count + 1
                db.session.commit()
                return {
                    'liked': False,
                    'disliked': False,
                    'likes_count': book_comment.likes_count
                }
            elif user in book_comment.users_liked:
                book_comment.users_liked.remove(user)
                book_comment.users_disliked.append(user)
                book_comment.likes_count = BookComment.likes_count - 2
                db.session.commit()
                return {
                    'liked': False,
                    'disliked': True,
                    'likes_count': book_comment.likes_count
                }
            else:
                book_comment.users_disliked.append(user)
                book_comment.likes_count = BookComment.likes_count - 1
                db.session.commit()
                return {
                    'liked': False,
                    'disliked': True,
                    'likes_count': book_comment.likes_count
                }
        else:
            return False
    else:
        return False


def delete_comment(comment_type, comment_id):
    if comment_type.lower() == 'authors':
        author_comment_to_delete = AuthorComment.query.get(comment_id)
        db.session.delete(author_comment_to_delete)
        db.session.commit()
    elif comment_type.lower() == 'books':
        book_comment_to_delete = BookComment.query.get(comment_id)
        db.session.delete(book_comment_to_delete)
        db.session.commit()
    else:
        return False


def delete_book_or_author(entity_type, entity_id):
    if entity_type == 'authors':
        entity = Author
    elif entity_type == 'books':
        entity = Book
    else:
        return
    entity_to_delete = entity.query.get(entity_id)
    db.session.delete(entity_to_delete)
    db.session.commit()


def check_if_user_wrote_comment(user_id, comment_id, comment_type):
    if comment_type.lower() not in ['author', 'book']:
        return False
    return (
        user_id == AuthorComment.query.get(comment_id).user_id
        if comment_type.lower() == 'author'
        else user_id == BookComment.query.get(comment_id).user_id
    )


def check_if_user_can_edit_entity(entity_type, entity_id, user_id):
    if entity_type == 'author':
        author = Author.query.get_or_404(entity_id)
        return True if author.user_id == user_id else False
    elif entity_type == 'book':
        book = Book.query.get_or_404(entity_id)
        return True if book.user_id == user_id else False
    return False
