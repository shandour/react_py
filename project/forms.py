from wtforms import (StringField, TextAreaField, FieldList, FormField,
                     validators, Form, Field, ValidationError)
from wtforms.widgets import TextInput
from flask_wtf import FlaskForm
from flask_security.forms import RegisterForm

from project.db_operations import check_if_author_exists

from flask_wtf.csrf import CSRFProtect

csrf = CSRFProtect()


class TagField(Field):
    widget = TextInput()

    def _value(self):
        if self.data:
            return u', '.join(self.data)
        else:
            return u''

    def process_data(self, value):
        if value:
            self.data = [str(val.id) for val in value]
        else:
            self.data = []

    def process_formdata(self, valuelist):
        if valuelist:
            self.data = [x.strip() for x in valuelist[0].split(',')]
        else:
            self.data = []


class AuthorsSearchForm(Form):
    name = StringField('Name', [validators.Length(max=50)])
    surname = StringField('Surname', [validators.Length(max=50),
                                      validators.Optional()])
    book_title = StringField('Book title', [validators.Optional()])


class SimpleBookForm(Form):
    title = StringField('Title', [validators.Length(max=200), validators.InputRequired()])
    overview = TextAreaField('Description', [validators.Optional(),
                                             validators.Length(max=2000)])
    content = TextAreaField('Content', [validators.InputRequired()])


class AddAuthorForm(FlaskForm):
    first_name = StringField('First name', [validators.Length(max=50),
                                            validators.InputRequired()])
    last_name = StringField('Last name', [validators.Length(max=50),
                                          validators.Optional()])
    description = TextAreaField('Description', [validators.Optional(),
                                                validators.Length(max=2000)])
    books = FieldList(FormField(SimpleBookForm), min_entries=0)

    def get_dict_errors(self):
        errors = {f: e for f, e in self.errors.iteritems() if not f.startswith('book')}
        errors['books'] = {}
        count = 0
        length = len(self.books)
        while (count < length):
            if self.books[count].title.errors:
                errors['books'][count] = {'title': self.books[count].title.errors}
            if self.books[count].overview.errors:
                if count in errors['books']:
                    errors['books'][count]['overview'] = self.books[count].overview.errors
                else:
                    errors['books'][count] = {'overview': self.books[count].overview.errors}
            if self.books[count].content.errors:
                if count in errors['books']:
                    errors['books'][count]['content'] = self.books[count].content.errors
                else:
                    errors['books'][count] = {'content': self.books[count].content.errors}
            count += 1
        return errors


class EditAuthorForm(FlaskForm):
    name = StringField('First name', [validators.Length(max=50),
                                      validators.InputRequired()])
    surname = StringField('Last name', [validators.Length(max=50),
                                        validators.Optional()])
    description = TextAreaField('Description', [validators.Optional(),
                                                validators.Length(max=2000)])
    books = TagField('Books')


class AddBookForm(FlaskForm):
    title = StringField('Title', [validators.Length(max=200),
                                  validators.InputRequired()])
    description = TextAreaField('Description', [validators.Optional(),
                                                validators.Length(max=2000)])
    text = TextAreaField('Content', [validators.InputRequired()])
    authors = TagField('Authors', [validators.InputRequired()])

    def validate_authors(form, field):
        if not check_if_author_exists(field.data):
            raise ValidationError('Incorrect author id')


# security forms
class UpgradedRegisterForm(RegisterForm):
    username = StringField('Username', [validators.Length(max=100),
                                        validators.InputRequired()])
