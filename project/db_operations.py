# -*- coding: utf-8 -*-
from collections import OrderedDict

import datetime

from math import ceil

from project.models import Author, Book, AuthorComment, BookComment, User, db

from flask import abort, current_app as app

from sqlalchemy import func, case


def get_all_authors_with_sections():
    """Returns an OrderedDict of first name letters of corresponding authors"""
    authors = Author.query.order_by(db.asc(Author.surname),
                                    db.asc(Author.name)).all()

    d = OrderedDict()
    for a in authors:
        first_letter = a.surname[0].upper() if a.surname else a.name[0].upper()
        if first_letter not in d:
            d[first_letter] = []
        d[first_letter].append(dict(id=a.id, name=a.name, surname=a.surname))
    return d

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
def get_user_by_id(sort_dict, user_id=None):
    user = User.query.get_or_404(user_id)
    comments_dict = sort_user_comments(sort_dict, user_id)

    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'confirmed_at': user.confirmed_at,
        'role': user.roles if user.roles else 'user',
        'activity': {
            'comments': comments_dict['comments'],
            'pages': comments_dict['pages']
        }
    }

def sort_user_comments(sort_dict, user_id=None):
    user = User.query.get_or_404(user_id)
    comments_per_page = app.config['USER_CABINET_PAGINATION_PER_PAGE']
    comments_type = (AuthorComment if sort_dict['comments_type'] == 'authors'
                     else BookComment)
    comments_query = (comments_type.query
                        .filter(comments_type.user_id == user.id))

    if sort_dict['sort_option'] == 'most-popular':
        sort_query = (comments_type.likes_count.asc()
                      if sort_dict['sort_direction'] == 'asc'
                      else comments_type.likes_count.desc())
    elif sort_dict['sort_option'] == 'most-hated':
        comments_query = comments_query.filter(comments_type.likes_count > 0)
        sort_query = (comments_type.likes_count.asc()
                      if sort_dict['sort_direction'] == 'asc'
                      else comments_type.likes_count.desc())
    elif sort_dict['sort_option'] == 'creation-date':
        sort_query = (comments_type.created_at.asc()
                      if sort_dict['sort_direction'] == 'asc'
                      else comments_type.created_at.desc())
    elif sort_dict['sort_option'] == 'last-change':
        comments_query = comments_query.filter(comments_type.edited.isnot(None))
        sort_query = (comments_type.edited.asc()
                      if sort_dict['sort_direction'] == 'asc'
                      else comments_type.edited.desc())
    elif sort_dict['sort_option'] == 'creation-change':
        if sort_dict['sort_direction'] == 'asc':
            sort_query = (
                case(
                    [(AuthorComment.edited.isnot(None),
                      AuthorComment.edited)],
                    else_=AuthorComment.created_at).asc())
        else:
            sort_query = (
                case(
                [(AuthorComment.edited.isnot(None),
                  AuthorComment.edited)],
                else_=AuthorComment.created_at).desc())
    comments_pagination = (comments_query
                .order_by(sort_query)
                .paginate(
                    page=int(sort_dict['page']),
                    per_page=comments_per_page))

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
    books = Book.query.order_by(db.asc(Book.title)).all()

    d = OrderedDict()
    for b in books:
        first_letter = b.title[0].upper()
        if first_letter not in d:
            d[first_letter] = []
        d[first_letter].append(dict(
            id=b.id,
            title=b.title,
            authors=[
                [a.name, a. surname] if a.surname
                else [a.name]
                for a in b.authors
            ]
        ))
    return d

def create_anonymous_author():
    author = Author(
        name='Anonymous',
        description='Sometimes the authorshop is not certain.'
    )
    db.session.add(author)
    db.session.commit()
    return author

def add_book(form):
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


def add_author(form):
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
                new_author.books.append(new_book)
    # flush to be able to increment book_count on author
    db.session.flush()
    new_author.book_count = Author.book_count + len(new_author.books)
    db.session.commit()


def update_author(author_id, form):
    author = Author.query.get(author_id)
    author.name = form.first_name.data
    author.surname = form.last_name.data
    book_tags = form.book_tags.data.rstrip().split(' ')
    if len(author.books) != len(book_tags):
        author.book_count = Author.book_count + (
            len(book_tags) - len(author.books)
        )
    author.books = [Book.query.get(n) for n in book_tags]
    author.description = form.description.data
    db.session.commit()


def update_comment(comment_id, comment_type, form):
    if comment_type.lower() == 'author':
        comment = AuthorComment.query.get(comment_id)
        comment.topic = form.topic.data
        comment.text = form.text.data
        comment.edited = datetime.datetime.now()
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
        comment.edited = datetime.datetime.now()
        db.session.commit()
        return {
        'topic': comment.topic,
        'text': comment.text,
        'edited': comment.edited,
        }
    else:
        return False



#FORM VALIDATION HELPERS
def check_if_author_exists(data):
    for author in data:
        if not Author.query.get(author):
            return False
    return True

def check_if_book_exists(data):
    for book in data:
        if not Book.query.get(book):
            return False
    return True


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
def suggestions_initial(suggestion_type):
    if suggestion_type.lower() == 'authors':
        author_number = Author.query.count()
        if author_number < 20:
            return {
                'suggestions': [a.surname + ' ' + a.name + ';' + str(a.id)
                                if a.surname else a.name + ';' + str(a.id)
                                for a in Author.query.all()],
                'finished': True,
                'amount': author_number
            }
        else:
            return {
                'suggestions': [a.surname + ' ' + a.name + ';' + str(a.id)
                                 if a.surname else a.name + ';' + str(a.id)
                                 for a in Author.query.order_by(
                                    Author.book_count.desc()).limit(50)],
                'finished': False if author_number > 50 else True,
                'amount': 50 if author_number >= 50 else author_number
            }
    elif suggestion_type.lower() == 'books':
        book_number = Book.query.count()
        if book_number < 20:
            return {
                'suggestions': [b.title + ';' + str(b.id)
                                for b in Book.query.all()],
                'finished': True,
                'amount': book_number
            }
        else:
            return {
                'suggestions': [b.title + ';' + str(b.id)
                                for b in Book.query.limit(50)],
                'finished': False if book_number > 50 else True,
                'amount': 50 if book_number >= 50 else book_number
            }

def get_suggestions(query, amount, suggestion_type):
    if suggestion_type.lower() == 'authors':
        author_number = Author.query.count()
        if author_number < 500:
            limited_number = None
            new_amount = author_number - amount
            finished = True
        else:
            limited_number = 500
            new_amount = (500 + amount
                          if author_number >= 500 + amount
                          else author_number - amount)
            finished = False if author_number >= 500 + amount else True
        suggestions = db.session.query(Author.id, Author.name, Author.surname)\
            .filter((Author.name.like('%' + query + '%')) |
                    (Author.surname.like('%' + query + '%')))\
            .order_by(Author.book_count.desc())\
            .offset(amount).limit(limited_number)\
            .all()
        return {
            'suggestions': [a.surname + ' ' + a.name + ';' + str(a.id)
                            if a.surname else a.name + ';' + str(a.id)
                            for a in suggestions],
            'amount': new_amount,
            'finished': finished
        }
    if suggestion_type.lower() == 'books':
        book_number = Book.query.count()
        if book_number < 500:
             limited_number = None
             new_amount = book_number - amount
             finished = True
        else:
            limited_number = 500
            new_amount = (500 + amount
                          if book_number >= 500 + amount
                          else book_number - amount)
            finished = False if book_number >= 500 + amount else True
            suggestions = db.session.query(Book.id, Book.title)\
                                    .filter(Book.title.like('%' + query + '%'))\
                                    .offset(amount).limit(limited_number)\
                                                   .all()
        return {
            'suggestions': [b.title + ';' + str(b.id)
                            for b in suggestions],
            'amount': new_amount,
            'finished': finished
        }


def get_all_author_comments_by_author_id(author_id, user_id=None):
    if user_id is None:
        comments = [
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
        for c in AuthorComment.query.join(Author, AuthorComment.author_id==author_id).all()]
    else:
        user = User.query.get(user_id)
        comments = [
            {
                'id': c.id,
                'topic': c.topic,
                'text': c.text,
                'likes_count': c.likes_count,
                'created_at': c.created_at,
                'edited': c.edited,
                'username': c.user.username,
                'liked': True if c in user.author_comments_likes else False,
                'disliked': True if c in user.author_comments_dislikes else False,
                'current_user_wrote': True if c.user is user else False
            }
            for c in AuthorComment.query.join(Author, AuthorComment.author_id==author_id).all()]

    return comments

def get_all_book_comments_by_book_id(book_id, user_id):
    if user_id is None:
        comments = [
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
        for c in BookComment.query.join(Book, BookComment.book_id==book_id).all()]
    else:
        user = User.query.get(user_id)
        comments = [
            {
                'id': c.id,
                'topic': c.topic,
                'text': c.text,
                'likes_count': c.likes_count,
                'created_at': c.created_at,
                'edited': c.edited,
                'username': c.user.username,
                'liked': True if c in user.book_comments_likes else False,
                'disliked': True if c in user.book_comments_dislikes else False,
                'current_user_wrote': True if c.user is user else False
            }
        for c in BookComment.query.join(Book, BookComment.book_id==book_id).all()]

    return comments

def add_comment (form, user_id, comment_type, entity_id):
    if comment_type.lower() == 'author':
        comment = AuthorComment()
        comment.topic = form.topic.data
        comment.text = form.text.data
        comment.author = Author.query.get(entity_id)
        comment.user = User.query.get(user_id)
        db.session.add(comment)
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
    if comment_type.lower() == 'author':
        author_comment_to_delete = AuthorComment.query.get(comment_id)
        db.session.delete(author_comment_to_delete)
        db.session.commit()
    elif comment_type.lower() == 'book':
        book_comment_to_delete = BookComment.query.get(comment_id)
        db.session.delete(book_comment_to_delete)
        db.session.commit()
    else:
        return False


def check_if_user_wrote_comment(user_id, comment_id, comment_type):
    if comment_type.lower() not in ['author', 'book']:
        return False
    return (
        user_id == AuthorComment.query.get(comment_id).user_id
        if comment_type.lower() == 'author'
        else user_id == BookComment.query.get(comment_id).user_id
    )
