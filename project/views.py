from flask import current_app as app, render_template, jsonify

from project.db_operations import get_all_authors_with_sections, get_author_by_id, get_all_books_with_sections, get_book_by_id


@app.route('/')
def super_page():
    return render_template('home.html')

@app.route('/lol')
def lol():
    resp = jsonify({'number' : 123})
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp

@app.route('/authors')
def authors():
    authors = get_all_authors_with_sections()
    resp = jsonify(authors)
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp

@app.route('/authors/show/<int:author_id>')
def show_author(author_id):
    author = jsonify(get_author_by_id(author_id))
    author.headers['Access-Control-Allow-Origin'] = '*'
    return author

@app.route('/books')
def books():
    books = get_all_books_with_sections()
    resp = jsonify(books)
    resp.headers['Access-Control-Allow-Origin'] = '*'
    return resp

@app.route('/books/show/<int:book_id>')
def show_books(book_id):
    book = jsonify(get_book_by_id(book_id))
    book.headers['Access-Control-Allow-Origin'] = '*'
    return book
