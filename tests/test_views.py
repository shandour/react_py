from mock import patch, call, Mock, MagicMock
from flask_testing import TestCase
from flask import Response

from project import create_app


class TestView(TestCase):
    render_template = False

    def create_app(self):
        app = create_app(settings_module='tests.settings_test')
        return app

    def setUp(self):
        self.mocks = {
            'get_all_authors_with_sections': None,
            'get_author_by_id': None,
            'add_one_author': None,
            'update_author': None,
            'current_user': None,
            'AddAuthorForm': None,
            'EditAuthorForm': None,
            'AddCommentForm': None,
            'CommentForm': None,
            'LoginForm': None,
            'ChangePasswordForm': None,
            'UpgradedRegisterForm': None,
            'after_this_request': None,
            '_commit': None,
            'change_user_password': None,
            'sort_user_comments': None,
            'get_user_by_id': None,
            'login_user': None,
            'register_user': None,
            'check_if_user_can_edit_entity': None,
            'suggestions_initial': None,
            'get_suggestions': None,
            'delete_book_or_author': None,
            'logout_user': None,
            'get_all_author_comments_by_author_id': None,
            'react_to_comment': None,
            'delete_one_comment': None,
            'check_user_identity': None,
            'add_one_comment': None,
            'update_comment': None
        }

        for i in self.mocks.keys():
            patcher = patch('project.views.{}'.format(i))
            self.mocks[i] = patcher.start()
            self.addCleanup(patcher.stop)

    def test_index_returns_template(self):
        self.client.get('/')
        self.assert_template_used('index.html')

    def test_authors_returns_json(self):
        self.mocks['get_all_authors_with_sections'].return_value = 'aaa'
        r = self.client.get('/api/authors')
        self.assertIsInstance(r, Response)
        self.assertEqual(r.data, '"aaa"\n')

    def test_show_author_returns_author_json(self):
        self.mocks['get_author_by_id'].return_value = 1
        r = self.client.get('/api/authors/2')
        self.mocks['get_author_by_id'].assert_called_once_with(2)
        self.assertIsInstance(r, Response)
        self.assertEqual(r.data, '1\n')

    def test_add_author_returns_json(self):
        self.mocks['current_user'].is_authenticated = True
        form_inst = self.mocks['AddAuthorForm'].return_value
        r = self.client.post('/api/authors')
        self.mocks['add_one_author'].assert_called_with(
            form_inst, self.mocks['current_user'].id
        )
        self.assertEqual(r.status_code, 201)

    def test_add_author_returns_error_json(self):
        self.mocks['current_user'].is_authenticated = True
        form_inst = self.mocks['AddAuthorForm'].return_value
        form_inst.validate_on_submit.return_value = False
        form_inst.get_dict_errors.return_value = 'error'
        r = self.client.post('/api/authors')
        form_inst.get_dict_errors.assert_called_once()
        self.assertEqual(r.data, '"error"\n')

    def test_edit_author_returns_json(self):
        self.mocks['current_user'].is_authenticated = True
        self.mocks['current_user'].id = 10
        form_inst = self.mocks['EditAuthorForm'].return_value
        r = self.client.put('/api/authors/3')
        self.mocks['update_author'].assert_called_with(3, form_inst)
        self.assertEqual(r.status_code, 204)

        form_inst.validate_on_submit.return_value = False
        form_inst.errors = 'errors'
        r = self.client.put('/api/authors/3')
        self.assertEqual(r.data, '"errors"\n')

    def test_can_user_edit_entity_returns_401(self):
        self.mocks['current_user'].is_authenticated = False
        r = self.client.get('/api/books/4/can-be-edited')
        self.assertEqual(r.status_code, 401)

    def test_can_user_edit_entity_returns_200(self):
        self.mocks['current_user'].is_authenticated = True
        self.mocks['current_user'].id = 10
        self.mocks['check_if_user_can_edit_entity'].return_value = True

        r = self.client.get('/api/authors/7/can-be-edited')
        self.mocks['check_if_user_can_edit_entity'].assert_called_once_with(
            'authors',
            7,
            10
        )
        self.assertEqual(r.status_code, 200)

    def test_authors_initial_suggestions_returns_json(self):
        self.mocks['suggestions_initial'].return_value = 'initial'
        r = self.client.get('/api/authors/suggestions?initial=true')
        self.mocks['suggestions_initial'].assert_called_once_with(
            'authors',
            self.app.config['INITIAL_SUGGESTIONS_NUMBER']
        )
        self.assertEqual(r.data, '"initial"\n')

        self.mocks['get_suggestions'].return_value = 'suggestions'
        r = self.client.get('/api/authors/suggestions?amount=7&q=d')
        self.mocks['get_suggestions'].assert_called_once_with(
            'd',
            'authors',
            self.app.config['SUGGESTIONS_PER_QUERY'],
            '7'
        )
        self.assertEqual(r.data, '"suggestions"\n')

    def test_books_initial_suggestions_returns_json(self):
        self.mocks['suggestions_initial'].return_value = 'initial_b'
        r = self.client.get('/api/books/suggestions?initial=true')
        self.mocks['suggestions_initial'].assert_called_once_with(
            'books',
            self.app.config['INITIAL_SUGGESTIONS_NUMBER']
        )
        self.assertEqual(r.data, '"initial_b"\n')

        self.mocks['get_suggestions'].return_value = 'suggestions_b'
        r = self.client.get('/api/books/suggestions?amount=3&q=f')
        self.mocks['get_suggestions'].assert_called_once_with(
            'f',
            'books',
            self.app.config['SUGGESTIONS_PER_QUERY'],
            '3'
        )
        self.assertEqual(r.data, '"suggestions_b"\n')

    def test_delete_book_or_author_from_db_returns_401(self):
        self.mocks['current_user'].is_authenticated = False
        r = self.client.delete('/api/authors/3')
        self.assertEqual(r.status_code, 401)

        self.mocks['current_user'].is_authenticated = True
        self.mocks['current_user'].roles = []
        self.mocks['check_if_user_can_edit_entity'].return_value = False
        r = self.client.delete('/api/books/3')
        self.assertEqual(r.status_code, 403)

    def test_delete_book_or_author_from_db_returns_200(self):
        self.mocks['current_user'].is_authenticated = True
        self.mocks['current_user'].roles = []
        self.mocks['check_if_user_can_edit_entity'].return_value = True
        r = self.client.delete('/api/authors/3')
        self.mocks['check_if_user_can_edit_entity'].assert_called_once_with(
            'authors',
            3,
            self.mocks['current_user'].id
        )
        self.mocks['delete_book_or_author'].assert_called_once_with(
            'authors',
            3
        )
        self.assertEqual(r.status_code, 200)

    def test_is_user_logged_in_returns_401_and_200_properly(self):
        self.mocks['current_user'].is_authenticated = False
        r = self.client.get('/api/is-logged-in')
        self.assertEqual(r.status_code, 401)

        self.mocks['current_user'].is_authenticated = True
        r = self.client.get('/api/is-logged-in')
        self.assertEqual(r.status_code, 200)

    def test_is_user_logged_in_returns_json(self):
        self.mocks['current_user'].is_authenticated = True
        self.mocks['current_user'].username = 'usrnm'
        r = self.client.get('/api/users/current/info')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data, '{\n  "username": "usrnm"\n}\n')

    def test_logout_current_user_returns_401_or_logs_out_with_200(self):
        self.mocks['current_user'].is_authenticated = False
        r = self.client.get('/api/logout')
        self.assertEqual(r.status_code, 401)

        self.mocks['current_user'].is_authenticated = True
        r = self.client.get('/api/logout')
        self.mocks['logout_user'].assert_called_once()
        self.assertEqual(r.status_code, 200)

    def test_comments_returns_json(self):
        self.mocks['get_all_author_comments_by_author_id']\
            .return_value = {'comments': 'author comments'}
        self.mocks['current_user'].is_authenticated = False
        r = self.client.get('/api/authors/3/comments?highlight=55')
        self.mocks['get_all_author_comments_by_author_id']\
            .assert_called_once_with(
                3,
                self.app.config['COMMENTS_PER_CHUNK'],
                self.mocks['current_user'].id,
                1,
                55
            )
        self.assertEqual(
            r.data,
            ('{\n  "authenticated": false, \n  '
             '"comments": "author comments"\n}\n'))

    def test_attitude_on_comment_returns_json(self):
        self.mocks['current_user'].is_authenticated = False
        r = self.client.post('/api/authors/comments/8/attitude',
                             data={'attitude': 'like'})
        self.assertEqual(r.status_code, 401)

        self.mocks['current_user'].is_authenticated = True
        self.mocks['react_to_comment'].return_value = 'liked comment'
        r = self.client.post('/api/authors/comments/8/attitude',
                               data={'attitude': 'like'})
        self.mocks['react_to_comment'].assert_called_once_with(
            'like',
            'authors',
            8,
            self.mocks['current_user'].id
        )
        self.assertEqual(r.data, '"liked comment"\n')

    def test_delete_comment_returns_403_and_200(self):
        self.mocks['check_user_identity'].return_value = False
        r = self.client.delete('/api/books/comments/5')
        self.mocks['check_user_identity'].assert_called_with(5, 'books')
        self.assertEqual(r.status_code, 403)

        self.mocks['check_user_identity'].return_value = True
        r = self.client.delete('/api/books/comments/5')
        self.mocks['check_user_identity'].assert_called_with(5, 'books')
        self.mocks['delete_one_comment'].assert_called_once_with('books', 5)
        self.assertEqual(r.status_code, 200)

    def test_add_comment_returns_json(self):
        self.mocks['check_user_identity'].return_value = True
        self.mocks['add_one_comment'].return_value = 'comment'
        form = self.mocks['AddCommentForm'].return_value
        form.validate_on_submit.return_value = True

        r = self.client.post('/api/authors/2/comments')
        self.mocks['add_one_comment'].assert_called_once_with(
            form,
            self.mocks['current_user'].id,
            'authors',
            2
        )
        self.assertEqual(
            r.data,
            '{\n  "new_comment": "comment", \n  "success": true\n}\n'
        )

    def test_edit_comment_returns_json(self):
        self.mocks['check_user_identity'].return_value = True
        self.mocks['update_comment'].return_value = 'updated comment'
        form = self.mocks['CommentForm'].return_value
        form.validate_on_submit.return_value = True

        r = self.client.put('/api/books/comments/7')
        self.mocks['update_comment'].assert_called_once_with(
            7,
            'book',
            form
        )
        self.assertEqual(
            r.data,
            ('{\n  "edited_comment": "updated comment",'
             ' \n  "success": true\n}\n')
        )

    def test_can_user_edit_returns_200(self):
        self.mocks['check_user_identity'].return_value = True
        r = self.client.get('/api/authors/comments/1/can-be-edited')
        self.mocks['check_user_identity'].assert_called_once_with(
            1,
            'authors'
        )
        self.assertEqual(r.status_code, 200)

    def test_login_returns_errors(self):
        form = self.mocks['LoginForm'].return_value
        form.validate_on_submit.return_value = False
        form.errors = 'errors'

        r = self.client.post('/api/login')
        self.assertEqual(r.status_code, 401)
        self.assertEqual(r.data, '"errors"\n')

    def test_register_logs_in_and_returns_200(self):
        form = self.mocks['UpgradedRegisterForm'].return_value
        form.validate_on_submit.return_value = True
        form.to_dict.return_value = {'e': 'e'}
        self.mocks['register_user'].return_value = 'registered'

        r = self.client.post('/api/users')
        self.mocks['register_user'].assert_called_once_with(**{'e': 'e'})
        self.mocks['login_user'].assert_called_once_with('registered')
        self.assertEqual(r.status_code, 202)

    def test_change_password_changes_password(self):
        form = self.mocks['ChangePasswordForm'].return_value
        form.validate_on_submit.return_value = True

        r = self.client.put('/api/users/current')
        self.mocks['after_this_request'].assert_called_once_with(
            self.mocks['_commit']
        )
        self.mocks['change_user_password'].assert_called_once_with(
            self.mocks['current_user']._get_current_object(),
            form.new_password.data
        )
        self.assertEqual(r.status_code, 202)

    def test_get_user_author_comments_sorted_returns_user_json(self):
        self.mocks['current_user'].is_authenticated = True
        self.mocks['sort_user_comments'].return_value = 'user comments'

        r = self.client.get('/api/users/current/comments?sortOption=most-popular&'
                            'sortDirection=asc&commentsType=authors&page=1')
        self.mocks['sort_user_comments'].assert_called_once_with(
            {
                'sort_option': 'most-popular',
                'sort_direction': 'asc',
                'comments_type': 'authors',
                'page': '1'
            },
            self.app.config['USER_CABINET_PAGINATION_PER_PAGE'],
            self.mocks['current_user'].id)
        self.assertEqual(r.data, '"user comments"\n')

    def test_get_user_book_comments_sorted_returns_user_json(self):
        self.mocks['current_user'].is_authenticated = True
        self.mocks['get_user_by_id'].return_value = 'sorted comments'

        r = self.client.get('/api/users/current/comments?sortOption=most-hated&'
                            'sortDirection=desc&commentsType=books&page=3&'
                            'initial=true')
        self.mocks['get_user_by_id'].assert_called_once_with(
            {
                'sort_option': 'most-hated',
                'sort_direction': 'desc',
                'comments_type': 'books',
                'page': '3'
            },
            self.app.config['USER_CABINET_PAGINATION_PER_PAGE'],
            self.mocks['current_user'].id)
        self.assertEqual(r.data, '"sorted comments"\n')
