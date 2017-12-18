# -*- coding: utf-8 -*-
from flask_sqlalchemy import SQLAlchemy

from flask_security import (Security, SQLAlchemyUserDatastore,
                            UserMixin, RoleMixin)

from sqlalchemy.ext.declarative import declared_attr

from datetime import datetime


db = SQLAlchemy()

authors_books = db.Table(
    'authors_books',
    db.Column('author_id', db.Integer, db.ForeignKey('authors.id'),
              primary_key=True),
    db.Column('book_id', db.Integer, db.ForeignKey('books.id'),
              primary_key=True))


class Author(db.Model):
    __tablename__ = 'authors'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    surname = db.Column(db.String(100))
    description = db.Column(db.Text)
    comments = db.relationship('AuthorComment', backref='author')

    books = db.relationship('Book', secondary=authors_books,
                            backref='authors')

    book_count = db.Column(db.Integer, default=0)

    def __repr__(self):
        return ("<id={id}, name: {name}, surname: {surname}"
                ", description: '{description}...'>").format(
                    id=self.id,
                    name=self.name,
                    surname=self.surname,
                    description=self.description[:20])


class Book(db.Model):
    __tablename__ = 'books'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(1000))
    text = db.Column(db.Text)
    description = db.Column(db.Text)
    comments = db.relationship('BookComment', backref='book')

    def __repr__(self):
        return ("<id={id}, title: {title}, description: '{description}"
                ", text: '{text}...'>").format(
                    id=self.id, title=self.title,
                    description=self.description[:20],
                    text=self.text[:25])


# FLASK SECURITY functionality

users_roles = db.Table(
    'users_roles',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'),
              primary_key=True),
    db.Column('role_id', db.Integer, db.ForeignKey('roles.id'),
              primary_key=True))

# COMMENTS functionality

class CommentsMixIn(object):
    id = db.Column(db.Integer, primary_key=True)
    topic = db.Column(db.String(1000))
    text = db.Column(db.Text)
    likes_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime(), default=datetime.now())
    edited = db.Column(db.DateTime())

class BookComment(db.Model, CommentsMixIn):
    __tablename__ = 'book_comments'

    book_id = db.Column(db.Integer, db.ForeignKey('books.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))

class AuthorComment(db.Model, CommentsMixIn):
    __tablename__ = 'author_comments'

    author_id = db.Column(db.Integer, db.ForeignKey('authors.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))

author_comments_users_like = db.Table(
    'author_comments_users_like',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'),
              primary_key=True),
    db.Column('author_comment_id', db.Integer, db.ForeignKey('author_comments.id'),
              primary_key=True),
)

author_comments_users_dislike = db.Table(
    'author_comments_users_dislike',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'),
              primary_key=True),
    db.Column('author_comment_id', db.Integer, db.ForeignKey('author_comments.id'),
              primary_key=True),
)

book_comments_users_like = db.Table(
    'book_comments_users_like',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'),
              primary_key=True),
    db.Column('book_comment_id', db.Integer, db.ForeignKey('book_comments.id'),
              primary_key=True),
)

book_comments_users_dislike = db.Table(
    'book_comments_users_dislike',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'),
              primary_key=True),
    db.Column('book_comment_id', db.Integer, db.ForeignKey('book_comments.id'),
              primary_key=True),
)


class User(db.Model, UserMixin):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(250), unique=True)
    email = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(100))
    active = db.Column(db.Boolean())
    confirmed_at = db.Column(db.DateTime(), default=datetime.now())
    roles = db.relationship('Role', secondary=users_roles,
                            backref='users')
    author_comments = db.relationship('AuthorComment', backref='user')
    book_comments = db.relationship('BookComment', backref='user')

    author_comments_likes = db.relationship('AuthorComment', secondary=author_comments_users_like, backref='users_liked')
    author_comments_dislikes = db.relationship('AuthorComment', secondary=author_comments_users_dislike, backref='users_disliked')
    book_comments_likes = db.relationship('BookComment', secondary=book_comments_users_like, backref='users_liked')
    book_comments_dislikes = db.relationship('BookComment', secondary=book_comments_users_dislike, backref='users_disliked')

    def __repr__(self):
        return ("<id={id}, username: {username}, email: {email}>").format(
            id=self.id, username=self.username, email=self.email
        )


class Role(db.Model, RoleMixin):
    __tablename__ = 'roles'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True)
    description = db.Column(db.String(200))

    def __repr__(self):
        return ("<id={id}, name: {name}>, description: {description}").format(
            id=self.id, name=self.name, description=self.description
        )


