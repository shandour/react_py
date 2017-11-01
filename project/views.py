from flask import current_app as app, render_template, jsonify, request

from project.forms import AddAuthorForm

from project.db_operations import get_all_authors_with_sections, get_author_by_id, get_all_books_with_sections, get_book_by_id, add_author as add_one_author


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def super_page(path=None):
    return render_template('index.html')

@app.route('/lol')
def lol():
    resp = jsonify({'number' : 123})
    return resp

@app.route('/api/authors')
def authors():
    authors = get_all_authors_with_sections()
    resp = jsonify(authors)
    return resp

@app.route('/api/authors/<int:author_id>')
def show_author(author_id):
    author = jsonify(get_author_by_id(author_id))
    return author

@app.route('/api/authors/add', methods=['GET', 'POST'])
def add_author():
    form = AddAuthorForm(request.form)
 
    if request.method == "POST" and form.validate():
        add_one_author(form)
        return jsonify({'success': 'success'})
    else:
        errors = form.get_dict_errors()
        return jsonify(errors)

@app.route('/api/books')
def books():
    books = get_all_books_with_sections()
    resp = jsonify(books)
    return resp

@app.route('/api/books/<int:book_id>')
def show_book(book_id):
    book = jsonify(get_book_by_id(book_id))
    return book
