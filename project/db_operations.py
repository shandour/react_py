# -*- coding: utf-8 -*-
from collections import OrderedDict

from project.models import Author, Book, db

from flask import abort


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
    author = dict(id=author.id, name=author.name, surname=author.surname, description=author.description, books=sorted([(b.id, b.title) for b in author.books]))
    return author


def find_authors(name, surname=None, book_title=None):
    authors = Author.query.filter_by(name=name)
    if surname:
        authors = authors.filter_by(surname=surname)
    if book_title:
        authors = authors.join(Author.books).filter(Book.title == book_title)
    return authors.order_by(Author.surname.asc(), Author.name.asc())


def get_book_by_id(id=None):
    """Returns a book by id or aborts with 404"""
    book = Book.query.get_or_404(id)
    book =  dict(id=book.id, title=book.title, description=book.description, text=book.text, authors=[[a.name, a. surname, a.id] if a.surname else [a.name] for a in book.authors])
    return book


def get_all_books_with_sections():
    """Returns an OrderedDict of first name letters of corresponding books"""
    books = Book.query.order_by(db.asc(Book.title)).all()

    d = OrderedDict()
    for b in books:
        first_letter = b.title[0].upper()
        if first_letter not in d:
            d[first_letter] = []
        d[first_letter].append(dict(id=b.id, title=b.title, authors=[[a.name, a. surname] if a.surname else [a.name] for a in b.authors]))
    return d


def add_book(form):
    new_book = Book()
    new_book.title = form.title.data
    new_book.text = form.text.data
    if form.description:
        new_book.description = form.description.data
    new_book.authors = [Author.query.get(int(a)) for a in form.authors.data]

    db.session.add(new_book)
    db.session.commit()


def update_book(book, form):
    book.title = form.title.data
    book.authors = [get_author_by_id(n) for n in form.authors.data]
    book.description = form.description.data
    book.text = form.text.data
    db.session.commit()


def add_author(form):
    new_author = Author()
    new_author.name = form.first_name.data
    if form.last_name.data:
        new_author.surname = form.last_name.data
    if form.description.data:
        new_author.description = form.description.data
    if form.books:
        for book in form.books:
            if book.title.data and book.content.data:
                new_book = Book()
                new_book.title = book.title.data
                new_book.text = book.content.data
                if book.overview.data:
                    new_book.description = book.overview.data
                new_author.books.append(new_book)
    db.session.add(new_author)
    db.session.commit()


def update_author(author, form):
    author.name = form.name.data
    author.surname = form.surname.data
    author.books = [get_book_by_id(n) for n in form.books.data]
    author.description = form.description.data
    db.session.commit()


def get_author_autocomplete(search):
    return db.session.query(Author.id, Author.name, Author.surname).filter(
        (Author.name.like(search + '%')) | (
            Author.surname.like(search + '%')))


def get_all_authors():
    return db.session.query(Author.id, Author.name, Author.surname)


def get_all_books():
    return db.session.query(Book.id, Book.title)


def check_if_author_exists(data):
    for author in data:
        if not Author.query.get(int(author)):
            return
    return True


def get_random_entity(entity_type):
    from random import choice

    if entity_type.lower() == "book":
        book_id = [n[0] for n in db.session.query(Book.id).all()]
        return choice(book_id)
    elif entity_type.lower() == "author":
        author_id =  [n[0] for n in db.session.query(Author.id).all()]
        return choice(author_id)
    else:
        return
