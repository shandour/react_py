from wtforms import (StringField, TextAreaField, FieldList, FormField,
                     validators, Form, ValidationError)
from flask_wtf import FlaskForm
from flask_security.forms import RegisterForm
from flask_wtf.csrf import CSRFProtect

from project.db_operations import check_if_author_exists, check_if_book_exists


csrf = CSRFProtect()


# a tweaked StringField that strips values to exclude
# incorrect addition, editing and sorting behaviour
class CleanStringField(StringField):
    def process_formdata(self, valuelist):
        super(CleanStringField, self).process_formdata(valuelist)
        self.data = self.data.strip()


class AddCommentForm(FlaskForm):
    topic = CleanStringField('Topic', [validators.Optional()])
    text = TextAreaField('Text', [validators.InputRequired()])


class SimpleBookForm(Form):
    title = CleanStringField('Title', [validators.Length(max=200),
                                       validators.InputRequired()])
    overview = TextAreaField('Description', [validators.Optional(),
                                             validators.Length(max=2000)])
    content = TextAreaField('Content', [validators.InputRequired()])


class AddAuthorForm(FlaskForm):
    first_name = CleanStringField('First name', [validators.Length(max=50),
                                                 validators.InputRequired()])
    last_name = CleanStringField('Last name', [validators.Length(max=50),
                                               validators.Optional()])
    description = TextAreaField('Description', [validators.Optional(),
                                                validators.Length(max=2000)])
    books = FieldList(FormField(SimpleBookForm), min_entries=0)

    def get_dict_errors(self):
        errors = {f: e for f, e in self.errors.iteritems()
                  if not f.startswith('book')}
        errors['books'] = {}
        count = 0
        length = len(self.books)
        while (count < length):
            if self.books[count].title.errors:
                errors['books'][count] = {'title': self.books[count]
                                                       .title
                                                       .errors}
            if self.books[count].overview.errors:
                if count in errors['books']:
                    errors['books'][count]['overview'] = self.books[count]\
                                                             .overview.errors
                else:
                    errors['books'][count] = {'overview': self.books[count]
                                                              .overview
                                                              .errors}
            if self.books[count].content.errors:
                if count in errors['books']:
                    errors['books'][count]['content'] = self.books[count]\
                                                            .content\
                                                            .errors
                else:
                    errors['books'][count] = {'content': self.books[count]
                                                             .content
                                                             .errors}
            count += 1
        return errors


class EditAuthorForm(FlaskForm):
    first_name = CleanStringField('First name', [validators.Length(max=50),
                                                 validators.InputRequired()])
    last_name = CleanStringField('Last name', [validators.Length(max=50),
                                               validators.Optional()])
    description = TextAreaField('Description', [validators.Optional(),
                                                validators.Length(max=2000)])
    book_tags = StringField('Books', [validators.Optional()])

    def validate_book_tags(form, field):
        if not check_if_book_exists([
                int(b_id) for b_id in field.data.rstrip().split(' ')]):
            raise ValidationError('Incorrect book id')


class AddBookForm(FlaskForm):
    title = CleanStringField('Title', [validators.Length(max=200),
                                       validators.InputRequired()])
    description = TextAreaField('Description', [validators.Optional(),
                                                validators.Length(max=2000)])
    text = TextAreaField('Content', [validators.InputRequired()])
    author_tags = StringField('Authors', [validators.InputRequired()])

    def validate_author_tags(form, field):
        if field.data.rstrip() == 'a':
            return
        if not check_if_author_exists([
                int(a_id) for a_id in field.data.rstrip().split(' ')]):
            raise ValidationError('Incorrect author id')


class CommentForm(FlaskForm):
    topic = CleanStringField('Topic',
                             [validators.Optional(),
                              validators.Length(max=500)])
    text = TextAreaField('Text', [validators.InputRequired()])


# security forms
class UpgradedRegisterForm(RegisterForm):
    username = CleanStringField('Username', [validators.Length(max=100),
                                             validators.InputRequired()])
