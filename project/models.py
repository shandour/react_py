# -*- coding: utf-8 -*-
from datetime import datetime

from flask_sqlalchemy import SQLAlchemy
from flask_security import UserMixin, RoleMixin
from sqlalchemy import func
from sqlalchemy.orm import column_property


db = SQLAlchemy()

authors_books = db.Table(
    'authors_books',
    db.Column('author_id', db.Integer, db.ForeignKey('authors.id'),
              primary_key=True),
    db.Column('book_id', db.Integer, db.ForeignKey('books.id'),
              primary_key=True))


class Stats(db.Model):
    __tablename__ = 'stats'

    AUTHORS_NUMBER = 'authors'
    BOOKS_NUMBER = 'books'

    entity_name = db.Column(db.String(200), primary_key=True)
    count = db.Column(db.Integer, default=0)

    def __repr__(self):
        return "<Stats {entity_name}, number of entities: {count}>".format(
            entity_name=self.entity_name,
            count=self.count)


class Author(db.Model):
    __tablename__ = 'authors'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    surname = db.Column(db.String(100))
    description = db.Column(db.Text)
    comments = db.relationship('AuthorComment', backref='author')
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    name_tsvector = column_property(func.to_tsvector('simple', name))
    surname_tsvector = column_property(func.to_tsvector('simple', surname))

    books = db.relationship('Book', secondary=authors_books,
                            backref='authors', lazy='joined')

    book_count = db.Column(db.Integer, default=0, index=True)

    def __repr__(self):
        return ("<Author id={id}, name: {name}, surname: {surname}"
                ", description: '{description}'>").format(
                    id=self.id,
                    name=self.name,
                    surname=self.surname
                        if self.surname
                        else '',
                    description=self.description[:20]
                        if self.description
                        else '')


class Book(db.Model):
    __tablename__ = 'books'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(1000), index=True)
    text = db.Column(db.Text)
    description = db.Column(db.Text)
    comments = db.relationship('BookComment', backref='book')
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    title_tsvector = column_property(func.to_tsvector('simple', title))

    def __repr__(self):
        return ("<Book id={id}, title: {title}, description: '{description}"
                ", text: '{text}...'>").format(
                    id=self.id, title=self.title,
                    description=self.description[:20]
                        if self.description
                        else '',
                    text=self.text[:25])


# COMMENTS functionality
class CommentsMixIn(object):
    id = db.Column(db.Integer, primary_key=True)
    topic = db.Column(db.String(1000))
    text = db.Column(db.Text)
    rating = db.Column(db.Integer, default=0, index=True)
    created_at = db.Column(db.DateTime(), default=datetime.utcnow, index=True)
    edited = db.Column(db.DateTime(), index=True)


class BookComment(db.Model, CommentsMixIn):
    __tablename__ = 'book_comments'

    book_id = db.Column(db.Integer, db.ForeignKey('books.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))

    def __repr__(self):
        return '<BookComment id={id}, topic: {topic}>, text: {text}>'.format(
            id=self.id,
            topic=self.topic[:20]
                if self.topic
                else '',
            text=self.text[:20])


class AuthorComment(db.Model, CommentsMixIn):
    __tablename__ = 'author_comments'

    author_id = db.Column(db.Integer, db.ForeignKey('authors.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))

    def __repr__(self):
        return '<AuthorComment id={id}, topic: {topic}>, text: {text}>'.format(
            id=self.id,
            topic=self.topic[:20]
                if self.topic
                else '',
            text=self.text[:20])


author_comments_users_like = db.Table(
    'author_comments_users_like',
    db.Column('user_id',
              db.Integer,
              db.ForeignKey('users.id'),
              primary_key=True),
    db.Column('author_comment_id',
              db.Integer,
              db.ForeignKey('author_comments.id'),
              primary_key=True),
)


author_comments_users_dislike = db.Table(
    'author_comments_users_dislike',
    db.Column('user_id', db.Integer,
              db.ForeignKey('users.id'),
              primary_key=True),
    db.Column('author_comment_id',
              db.Integer,
              db.ForeignKey('author_comments.id'),
              primary_key=True),
)


book_comments_users_like = db.Table(
    'book_comments_users_like',
    db.Column('user_id',
              db.Integer,
              db.ForeignKey('users.id'),
              primary_key=True),
    db.Column('book_comment_id',
              db.Integer,
              db.ForeignKey('book_comments.id'),
              primary_key=True),
)


book_comments_users_dislike = db.Table(
    'book_comments_users_dislike',
    db.Column('user_id',
              db.Integer,
              db.ForeignKey('users.id'),
              primary_key=True),
    db.Column('book_comment_id',
              db.Integer,
              db.ForeignKey('book_comments.id'),
              primary_key=True),
)


# FLASK SECURITY functionality
users_roles = db.Table(
    'users_roles',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'),
              primary_key=True),
    db.Column('role_id', db.Integer, db.ForeignKey('roles.id'),
              primary_key=True))


class User(db.Model, UserMixin):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(250), unique=True)
    email = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(130))
    active = db.Column(db.Boolean())
    confirmed_at = db.Column(db.DateTime(), default=datetime.utcnow)
    roles = db.relationship('Role', secondary=users_roles,
                            backref='users', lazy='joined')
    author_comments = db.relationship('AuthorComment', backref='user')
    authors_added = db.relationship('Author', backref='user')
    book_comments = db.relationship('BookComment', backref='user')
    books_added = db.relationship('Book', backref='user')

    author_comments_likes = db.relationship(
        'AuthorComment',
        secondary=author_comments_users_like,
        backref='users_liked')
    author_comments_dislikes = db.relationship(
        'AuthorComment',
        secondary=author_comments_users_dislike,
        backref='users_disliked')
    book_comments_likes = db.relationship(
        'BookComment',
        secondary=book_comments_users_like,
        backref='users_liked')
    book_comments_dislikes = db.relationship(
        'BookComment',
        secondary=book_comments_users_dislike,
        backref='users_disliked')

    def __repr__(self):
        return "<User id={id}, username: {username}, email: {email}>".format(
            id=self.id, username=self.username, email=self.email)


class Role(db.Model, RoleMixin):
    __tablename__ = 'roles'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True)
    description = db.Column(db.String(200))

    def __repr__(self):
        return "<Role id={id}, name: {name}>, description: {description}>"\
            .format(id=self.id, name=self.name,
                    description=self.description
                    if self.description
                    else '')


# INDICES
# comments_indices;
# effectiveness checked on sets of comments larger than 100000
db.Index('idx_authorcomments_edited_user_id',
         AuthorComment.edited,
         AuthorComment.user_id)

db.Index('idx_bookcomments_edited_user_id',
         BookComment.edited,
         BookComment.user_id)


# full-text search indices
db.Index('idx_authors_name_full_text_search',
         Author.name_tsvector,
         Author.surname_tsvector,
         postgresql_using='gin')
db.Index('idx_books_title_full_text_search',
         Book.title_tsvector,
         postgresql_using='gin')
