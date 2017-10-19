# -*- coding: utf-8 -*-
from flask_sqlalchemy import SQLAlchemy

from flask_security import (Security, SQLAlchemyUserDatastore,
                            UserMixin, RoleMixin)


db = SQLAlchemy()


authors_books = db.Table(
    'authors_books',
    db.Column('author_id', db.Integer, db.ForeignKey('authors.id'),
              primary_key=True),
    db.Column('books_id', db.Integer, db.ForeignKey('books.id'),
              primary_key=True))


class Author(db.Model):
    __tablename__ = 'authors'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    surname = db.Column(db.String(100))
    description = db.Column(db.Text)

    books = db.relationship('Book', secondary=authors_books,
                            backref='authors')

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

    def __repr__(self):
        return ("<id={id}, title: {title}, description: '{description}"
                ", text: '{text}...'>").format(
                    id=self.id, title=self.title,
                    description=self.description[:20],
                    text=self.text[:25])


# security functionality

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
    password = db.Column(db.String(100))
    active = db.Column(db.Boolean())
    confirmed_at = db.Column(db.DateTime())
    roles = db.relationship('Role', secondary=users_roles,
                            backref='users')

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
