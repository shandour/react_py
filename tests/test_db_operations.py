from mock import patch, call, Mock
from sortedcontainers import SortedDict
from flask_testing import TestCase

from project import create_app
from project.db_operations import (
    get_all_authors_with_sections,
    get_all_books_with_sections,
    get_author_by_id,
    get_book_by_id,
    get_user_by_id,
    sort_user_comments,
    create_anonymous_author,
    add_book,
    add_author,
    update_author,
    update_book,
    update_comment,
    check_if_author_exists,
    check_if_book_exists,
    suggestions_initial,
    get_suggestions,
    get_all_author_comments_by_author_id,
    get_all_book_comments_by_book_id,
    add_comment,
    react_to_comment,
    delete_comment,
    delete_book_or_author,
    check_if_user_wrote_comment,
    check_if_user_can_edit_entity
)


class TestDbOperations(TestCase):
    def create_app(self):
        app = create_app(settings_module='tests.settings_test')
        return app

    def setUp(self):
        self.mocks = {
            'db': None,
            'Author': None,
            'Book': None,
            'AuthorComment': None,
            'BookComment': None,
            'User': None,
            'Stats': None,
            'EditAuthorForm': None,
            'AddAuthorForm': None,
            'EditAuthorForm': None,
            'AddBookForm': None,
            'SimpleBookForm': None,
            'CommentForm': None,
            'sort_user_comments': None,
            'datetime': None
        }

        for i in self.mocks.keys():
            if i.endswith('Form'):
                patcher = patch(
                    'project.forms.{}'.format(i))
            else:
                patcher = patch(
                    'project.db_operations.{}'.format(i))
            self.mocks[i] = patcher.start()
            self.addCleanup(patcher.stop)

    def test_get_all_authors_with_sections_makes_calls_and_returns_dict(self):
        self.mocks['Author'].query.all.return_value = []
        result = get_all_authors_with_sections()
        self.mocks['Author'].query.all.assert_called_once()
        self.assertEqual(result, {'authors': SortedDict()})

    def test_get_author_by_id_makes_calls(self):
        get_author_by_id(9)
        self.mocks['Author'].query.get_or_404.assert_called_once_with(9)

    def test_get_book_by_id_makes_calls(self):
        get_book_by_id(3)
        self.mocks['Book'].query.get_or_404.assert_called_once_with(3)

    def test_get_user_by_id_returns_dict(self):
        user = self.mocks['User']()
        user.id = 2
        user.username = 'Bob'
        user.email = 'b@b.b'
        user.confirmed_at = 123
        user.roles = []
        comments_dict = {'comments': 'c', 'pages': 8}
        self.mocks['User'].query.get_or_404.return_value = user
        self.mocks['sort_user_comments'].return_value = comments_dict

        r = get_user_by_id(
            {},
            self.app.config['USER_CABINET_PAGINATION_PER_PAGE'],
            4)
        self.mocks['User'].query.get_or_404.assert_called_once_with(4)
        self.assertEqual(r, {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'confirmed_at': user.confirmed_at,
            'role': 'user',
            'activity': {
                'comments': comments_dict['comments'],
                'pages': comments_dict['pages']
            }
        })

    def test_sort_user_comments_returns_dict(self):
        r = sort_user_comments(
            {'comments_type': 'authors',
             'sort_option': 'most-popular',
             'sort_direction': 'asc',
             'page': 1},
            self.app.config['USER_CABINET_PAGINATION_PER_PAGE'],
            4)
        self.assertEqual(r, {
            'comments': [],
            'pages': self.mocks['AuthorComment']
                .query.filter().order_by().paginate().pages
        })

    def test_sort_user_comments_calls_db(self):
        r = sort_user_comments(
            {'comments_type': 'books',
             'sort_option': 'last-change',
             'sort_direction': 'desc',
             'page': 5},
            self.app.config['USER_CABINET_PAGINATION_PER_PAGE'],
            4)
        self.mocks['BookComment']\
            .query.filter.assert_called_once_with(
                self.mocks['BookComment'].user_id == 4
            )
        self.mocks['BookComment']\
            .query.filter()\
            .filter.assert_called_once_with(
                    self.mocks['BookComment'].edited !=
                    self.mocks['BookComment'].created_at)
        self.mocks['BookComment'].edited.desc.assert_called_once()
        self.mocks['BookComment']\
            .query.filter().filter().order_by.assert_called_once_with(
                self.mocks['BookComment'].edited.desc()
            )
        self.mocks['BookComment'].query\
            .filter().filter().order_by().paginate.assert_called_once_with(
                page=5,
                per_page=self.app.config['USER_CABINET_PAGINATION_PER_PAGE'],
                error_out=False
            )

    def test_all_books_with_sections_returns_dict(self):
        self.mocks['Book'].query.all.return_value = []
        r = get_all_books_with_sections()
        self.mocks['Book'].query.order_by.assert_called_once_with(
            self.mocks['Book'].title.asc()
        )
        self.mocks['Book'].query.order_by().all.assert_called_once()
        self.assertEqual(r, {'books': SortedDict()})

    def test_anonymous_user_adds_author(self):
        create_anonymous_author()
        self.mocks['db'].session.add.assert_called_once()
        self.mocks['db'].session.commit.assert_called_once()

    def test_add_book_makes_calls_to_db(self):
        form = self.mocks['AddBookForm']()
        form.title.data = 't'
        form.text.data = 'txt'
        form.description.data = 'd'
        form.author_tags.data = '1 2'

        add_book(form, 2)
        self.mocks['Author'].id\
            .in_.assert_called_once_with(form.author_tags.data.split(' '))
        self.mocks['User'].query.get_or_404.assert_called_once_with(2)
        self.mocks['db'].session.add.assert_called_once_with(
            self.mocks['Book']()
        )
        self.mocks['db'].session.commit.assert_called_once()

    def test_update_book_makes_calls_to_db(self):
        form = self.mocks['AddBookForm']()
        form.title.data = 't'
        form.text.data = 'txt'
        form.description.data = 'd'
        form.author_tags.data = '2'

        update_book(4, form)
        self.mocks['Book'].query.get.assert_called_once_with(4)
        self.mocks['Author'].id.in_.assert_called_with(['2'])
        self.mocks['db'].session.commit.assert_called_once()

    def test_add_author_makes_calls_to_db(self):
        form = self.mocks['AddAuthorForm']()
        form.first_name.data = 'n'
        form.last_name.data = 's'
        form.description.data = 'd'
        b_form = self.mocks['SimpleBookForm']()
        b_form.title.data = 't'
        b_form.content.data = 'c'
        form.books = [b_form]

        add_author(form, 22)
        self.mocks['Author'].assert_called_once()
        self.mocks['Book'].assert_called_once()
        self.mocks['db'].session.add.assert_called_once()
        self.mocks['User']\
            .query.get_or_404.assert_has_calls([call(22), call(22)])
        self.mocks['db'].session.flush.assert_called_once()
        self.mocks['db'].session.commit.assert_called_once()

    def test_update_author_makes_calls_to_db(self):
        form = self.mocks['EditAuthorForm']()
        form.first_name.data = 'n2'
        form.last_name.data = 's2'
        form.description.data = 'd2'
        form.book_tags.data = '1 2 3'

        update_author(212, form)
        self.mocks['Author'].query.get.assert_called_once_with(212)
        self.mocks['Book'].query.get.assert_has_calls([
            call('1'),
            call('2'),
            call('3')
        ])
        self.mocks['db'].session.commit.assert_called_once()

    def test_update_comment_makes_calls_to_db_and_returns_dict(self):
        form1 = self.mocks['CommentForm']()
        form1.topic.data = 'tpc'
        form1.text.data = 'txt'

        r1 = update_comment(1, 'author', form1)

        form2 = self.mocks['CommentForm']()
        form2.topic.data = 'tc'
        form2.text.data = 'tt'

        r2 = update_comment(2, 'book', form2)
        r3 = update_comment(3, 'sdsdsds', form1)

        self.mocks['AuthorComment'].query.get.assert_called_once_with(1)
        self.mocks['BookComment'].query.get.assert_called_once_with(2)
        self.mocks['db'].session.commit.assert_has_calls([call(), call()])
        self.mocks['datetime'].datetime.utcnow\
            .assert_has_calls([call(), call()])

        self.assertEqual(r1, {
            'topic': 'tpc',
            'text': 'txt',
            'edited': self.mocks['datetime'].datetime.utcnow()})
        self.assertEqual(r2, {
            'topic': 'tc',
            'text': 'tt',
            'edited': self.mocks['datetime'].datetime.utcnow()})
        self.assertEqual(r3, False)

    def test_check_if_author_exists_returns_false(self):
        author_ids = [1, 2, 3]
        r = check_if_author_exists(author_ids)

        self.mocks['db'].session.scalar.return_value = [1, 2]
        self.mocks['db'].func.count.assert_called_with(
            self.mocks['Author'].id
        )
        self.mocks['db'].session.query.assert_called_once_with(
            self.mocks['db'].func.count()
        )
        self.mocks['Author'].id.in_.assert_called_once_with(author_ids)
        self.mocks['db'].session.query().filter.assert_called_once_with(
            self.mocks['Author'].id.in_()
        )
        self.mocks['db'].session.query().filter().scalar.assert_called_once()
        self.assertEqual(r, False)

    def test_check_if_book_exists_returns_false(self):
        book_ids = [2, 1, 3]
        r = check_if_book_exists(book_ids)

        self.mocks['db'].session.scalar.return_value = [4, 5]
        self.mocks['db'].func.count.assert_called_with(
            self.mocks['Book'].id
        )
        self.mocks['db'].session.query.assert_called_once_with(
            self.mocks['db'].func.count()
        )
        self.mocks['Book'].id.in_.assert_called_once_with(book_ids)
        self.mocks['db'].session.query().filter.assert_called_once_with(
            self.mocks['Book'].id.in_()
        )
        self.mocks['db'].session.query().filter().scalar.assert_called_once()
        self.assertEqual(r, False)

    def test_suggestions_initial_returns_authors_dict(self):
        self.mocks['db'].session.query().filter().one\
            .return_value = self.app.config['INITIAL_SUGGESTIONS_NUMBER'] - 1
        a1 = self.mocks['Author']()
        a1.surname = 'sn'
        a1.name = 'nm'
        a1.id = 9
        authors = [a1]
        self.mocks['Author'].query.all.return_value = authors

        r = suggestions_initial(
            'authors',
            self.app.config['INITIAL_SUGGESTIONS_NUMBER'])
        self.mocks['db'].session.query().filter().one.assert_called_once_with()
        self.mocks['Author'].query.all.assert_called_once()
        self.assertEqual(r, {
            'suggestions': ['sn nm;9'],
            'finished': True
        })

    def test_suggestions_initial_returns_books_dict(self):
        self.mocks['db'].session.query().filter().one\
            .return_value = self.app.config['INITIAL_SUGGESTIONS_NUMBER'] + 1
        b1 = self.mocks['Book']()
        b1.title = 'tl'
        b1.id = 12
        books = [b1]
        self.mocks['Book'].query.order_by().limit().all.return_value = books

        r = suggestions_initial(
            'books',
            self.app.config['INITIAL_SUGGESTIONS_NUMBER'])
        self.mocks['db'].func.ts_rank.assert_called_once()
        self.mocks['Book'].query.order_by().limit.assert_called_with(
            self.app.config['INITIAL_SUGGESTIONS_NUMBER']
        )
        self.mocks['Book'].query.order_by().limit().all.assert_called()
        self.assertEqual(r, {
            'suggestions': ['tl;12'],
            'finished': False
        })

    def test_get_suggestions_returns_dict(self):
        self.mocks['db'].session.query().count\
            .return_value = self.app.config['SUGGESTIONS_PER_QUERY'] - 1
        self.mocks['db'].session\
            .query()\
            .filter()\
            .order_by()\
            .offset()\
            .limit()\
            .all\
            .return_value = []
        r = get_suggestions(
            'as',
            'authors',
            self.app.config['SUGGESTIONS_PER_QUERY']
        )
        self.mocks['db'].session.query.assert_called_with(
            self.mocks['Author'].id,
            self.mocks['Author'].name,
            self.mocks['Author'].surname
        )
        self.mocks['db'].session.query().filter.assert_called_with(
            self.mocks['Author'].name_tsvector.match() |
            self.mocks['Author'].surname.match()
        )
        self.mocks['db'].session\
            .query()\
            .filter()\
            .order_by\
            .assert_called_with(
                self.mocks['Author'].book_count.desc()
            )
        self.mocks['db'].session\
            .query()\
            .filter()\
            .order_by()\
            .count\
            .assert_called_once()
        self.mocks['db'].session\
            .query()\
            .filter()\
            .order_by()\
            .offset\
            .assert_called_with(None)
        self.mocks['db'].session\
            .query()\
            .filter()\
            .order_by()\
            .offset()\
            .limit\
            .assert_called_with(
                self.app.config['SUGGESTIONS_PER_QUERY'])
        self.mocks['db'].session\
            .query()\
            .filter()\
            .order_by()\
            .offset()\
            .limit()\
            .all\
            .assert_called_once()
        self.assertEqual(r, {
            'suggestions': ['not found'],
            'finished': False
        })

    def test_all_author_comments_by_author_id_returns_dict(self):
        u = self.mocks['User']()
        u.username = 'username'
        c = self.mocks['AuthorComment']()
        c.id = 2
        c.topic = 'tpc'
        c.text = 'txt'
        c.rating = 4
        c.created_at = 'created'
        c.edited = 'edited'
        c.user = u
        u.author_comments_likes = [c]
        self.mocks['AuthorComment'].query\
            .filter()\
            .order_by()\
            .offset()\
            .limit()\
            .all.return_value = [c]
        self.mocks['User'].query.get.return_value = u

        r = get_all_author_comments_by_author_id(
            2,
            self.app.config['COMMENTS_PER_CHUNK'],
            3,
            2
        )

        self.mocks['AuthorComment'].query.filter.assert_called_with(
            self.mocks['AuthorComment'].author_id == 2
        )
        self.mocks['AuthorComment'].query\
            .filter()\
            .order_by.assert_called_with(
            self.mocks['AuthorComment'].edited.desc()
        )
        self.mocks['AuthorComment'].query\
            .filter()\
            .order_by()\
            .offset.assert_called_with(
                1 * self.app.config['COMMENTS_PER_CHUNK']
            )
        self.mocks['AuthorComment'].query\
            .filter()\
            .order_by()\
            .offset()\
            .limit.assert_called_with(
                self.app.config['COMMENTS_PER_CHUNK']
            )
        self.mocks['AuthorComment'].query\
            .filter()\
            .order_by()\
            .offset()\
            .limit()\
            .all.assert_called_once()
        self.assertEqual(r, {
            'comments': [{
                'id': 2,
                'topic': 'tpc',
                'text': 'txt',
                'rating': 4,
                'created_at': 'created',
                'edited': 'edited',
                'username': 'username',
                'user_reaction': 'liked',
                'current_user_wrote': True
            }],
            'chunk': 2,
            'comments_left': False
        })

    def test_get_all_book_comments_by_book_id(self):
        u = self.mocks['User']()
        u.username = 'username2'
        c = self.mocks['BookComment']()
        c.id = 1
        c.topic = 'tpc2'
        c.text = 'txt2'
        c.rating = 22
        c.created_at = 'created2'
        c.edited = 'edited2'
        c.user = u
        self.mocks['BookComment'].query\
            .filter()\
            .order_by()\
            .slice()\
            .all.return_value = [c]
        self.mocks['User'].query.get.return_value = u

        r = get_all_book_comments_by_book_id(
            2,
            self.app.config['COMMENTS_PER_CHUNK'],
            3,
            2
        )

        self.mocks['BookComment'].query.filter.assert_called_with(
            self.mocks['BookComment'].book_id == 2
        )
        self.mocks['BookComment'].query\
            .filter()\
            .order_by.assert_called_with(
            self.mocks['BookComment'].edited.desc()
        )
        self.mocks['BookComment'].query\
            .filter()\
            .order_by()\
            .slice.assert_called_with(
                1 * self.app.config['COMMENTS_PER_CHUNK'],
                self.app.config['COMMENTS_PER_CHUNK']
            )
        self.mocks['BookComment'].query\
            .filter()\
            .order_by()\
            .slice()\
            .all.assert_called_once()
        self.assertEqual(r, {
            'comments': [{
                'id': 1,
                'topic': 'tpc2',
                'text': 'txt2',
                'rating': 22,
                'created_at': 'created2',
                'edited': 'edited2',
                'username': 'username2',
                'user_reaction': 'neutral',
                'current_user_wrote': True
            }],
            'chunk': 2,
            'comments_left': False
        })

    def test_add_comment_returns_author_comments_dict(self):
        form = self.mocks['CommentForm']()
        form.topic.data = 'topic'
        form.text.data = 'text'

        r = add_comment(
            form,
            5,
            'author',
            2
        )
        self.mocks['Author'].query.get.assert_called_once_with(2)
        self.mocks['User'].query.get.assert_called_once_with(5)
        self.mocks['db'].session.add.assert_called_once_with(
            self.mocks['AuthorComment']()
        )
        self.mocks['db'].session.flush.assert_called_once()
        self.mocks['db'].session.commit.assert_called_once()

        self.assertEqual(r, {
            'id': self.mocks['AuthorComment']().id,
            'topic': 'topic',
            'text': 'text',
            'rating': self.mocks['AuthorComment']().rating,
            'created_at': self.mocks['AuthorComment']().created_at,
            'edited': self.mocks['AuthorComment']().edited,
            'username': self.mocks['AuthorComment']().user.username,
            'current_user_wrote': True
        })

    def test_add_comments_returns_book_comments_dict(self):
        form = self.mocks['CommentForm']()
        form.topic.data = 'topic'
        form.text.data = 'text'

        r = add_comment(
            form,
            2,
            'book',
            5
        )
        self.mocks['Book'].query.get.assert_called_once_with(5)
        self.mocks['User'].query.get.assert_called_once_with(2)
        self.mocks['db'].session.add.assert_called_once_with(
            self.mocks['BookComment']()
        )
        self.mocks['db'].session.flush.assert_called_once()
        self.mocks['db'].session.commit.assert_called_once()

        self.assertEqual(r, {
            'id': self.mocks['BookComment']().id,
            'topic': 'topic',
            'text': 'text',
            'rating': self.mocks['BookComment']().rating,
            'created_at': self.mocks['BookComment']().created_at,
            'edited': self.mocks['BookComment']().edited,
            'username': self.mocks['BookComment']().user.username,
            'current_user_wrote': True
        })

    def test_react_to_comment_returns_liked_author_comment_dict(self):
        r = react_to_comment(
            'like',
            'author',
            1,
            2
        )
        self.mocks['User'].query.get.assert_called_once_with(2)
        self.mocks['AuthorComment'].query.get.assert_called_once_with(1)
        self.mocks['db'].session.commit.assert_called_once()
        self.assertEqual(r, {
            'user_reaction': 'liked',
            'rating': self.mocks['AuthorComment'].rating.__add__()
        })

    def test_react_to_comment_returns_disliked_book_comment_dict(self):
        r = react_to_comment(
            'dislike',
            'book',
            4,
            5
        )
        self.mocks['User'].query.get.assert_called_once_with(5)
        self.mocks['BookComment'].query.get.assert_called_once_with(4)
        self.mocks['db'].session.commit.assert_called_once()
        self.assertEqual(r, {
            'user_reaction': 'disliked',
            'rating': self.mocks['BookComment'].rating.__sub__()
        })

    def test_delete_comment_deletes(self):
        delete_comment('authors', 2)
        self.mocks['AuthorComment'].query.get.assert_called_once_with(2)
        self.mocks['db'].session.delete.assert_called_with(
           self.mocks['AuthorComment'].query.get())
        self.mocks['db'].session.commit.assert_called()

        delete_comment('books', 3)
        self.mocks['BookComment'].query.get.assert_called_once_with(3)
        self.mocks['db'].session.delete.assert_called_with(
           self.mocks['BookComment'].query.get())
        self.mocks['db'].session.commit.assert_called()

    def test_delete_book_or_author_deletes(self):
        delete_book_or_author('authors', 2)
        self.mocks['Author'].query.get.assert_called_once_with(2)
        self.mocks['db'].session.delete.assert_called_with(
            self.mocks['Author'].query.get()
        )

        delete_book_or_author('books', 3)
        self.mocks['Book'].query.get.assert_called_once_with(3)
        self.mocks['db'].session.delete.assert_called_with(
            self.mocks['Book'].query.get()
        )

    def test_check_if_user_wrote_comment_returns_True(self):
        self.mocks['AuthorComment'].query.get().user_id = 1
        r = check_if_user_wrote_comment(1, 2, 'author')
        self.mocks['AuthorComment'].query.get.assert_called_with(2)
        self.assertEqual(r, True)

    def test_check_if_user_can_edit_entity_returns_False(self):
        self.mocks['Book'].query.get_or_404().user_id = 90922
        r = check_if_user_can_edit_entity('book', 22, 3)
        self.mocks['Book'].query.get_or_404.assert_called_with(22)
        self.assertEqual(r, False)
