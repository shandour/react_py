# -*- coding: utf-8 -*-
from string import ascii_letters

from random import choice, randint

from loremipsum import get_paragraphs

from project.models import (
    db,
    Author,
    Book,
    AuthorComment,
    BookComment,
    User,
    Role
)


def create_fixtures(
        creation_iteration_number=100,
        users_number=10,
        max_comments_per_entity_number=100,
        use_randomized_max_number=False):
    if creation_iteration_number < 1:
        return

    user_list = create_users_list(users_number)

    object_list = [Author(
        name='Lolko',
        surname='Lolkun',
        description='simply da greatest',
        user=user_list[0],
        books=[
            Book(
                title='Lel Book',
                description=return_random_text(1, 3),
                text=return_random_text(1, 20),
                user=user_list[0]
            )
        ],
        book_count = 1
    )]

    while creation_iteration_number > 0:
        author = Author(
            name=return_random_string(5, 50),
            surname=return_random_string(0, 50),
            description=return_random_string(10, 200),
            user=choice(user_list)
        )

        book_list = []

        for x in range(randint(1, 10)):
            book_list.append(Book(
                title=return_random_string(2, 50),
                description=return_random_text(1, 3),
                text=return_random_text(1, 20),
                user=choice(user_list)
            ))

        author.books = book_list
        author.book_count = len(author.books)

        object_list.append(author)
        creation_iteration_number -= 1

    db.session.add_all(object_list)
    db.session.flush()
    create_comments(max_comments_per_entity_number, use_randomized_max_number)
    db.session.commit()
    db.engine.execute(AuthorComment.__table__.update().values(edited=AuthorComment.created_at))
    db.engine.execute(BookComment.__table__.update().values(edited=BookComment.created_at))


def return_random_string(min_letters, max_letters):
    return (
        "".join(choice(ascii_letters)
                for x in range(randint(min_letters, max_letters))).
                capitalize()
    )

def return_random_text(min_paragraphs, max_paragraphs):
    return " ".join(get_paragraphs(randint(min_paragraphs, max_paragraphs)))

def create_users_list(users_number):
    user_name_set = set()
    while len(user_name_set) < users_number:
        user_name_set.add(return_random_string(1, 50))
    user_name_list = list(user_name_set)

    user_list = [User(
            username='vova',
            email='vova@vova.vova',
            password='Mynameisvova',
            active=True)]

    iteration = 0
    while iteration < users_number:
        username = user_name_list[iteration]
        email = username + '@supermail.mail'
        user_list.append(
            User(
                username=username,
                email=email,
                password=return_random_string(10, 130),
                active=True
            )
        )
        iteration += 1

    db.session.add_all(user_list)
    db.session.flush()

    return user_list

def create_comments(max_comments_per_entity_number, use_randomized_max_number=False):
    book_list = Book.query.all()
    author_list = Author.query.all()
    user_list = User.query.all()
    create_comments_helper(
        'book',
        max_comments_per_entity_number,
        book_list,
        user_list,
        use_randomized_max_number)
    create_comments_helper(
        'author',
        max_comments_per_entity_number,
        author_list,
        user_list,
        use_randomized_max_number)



def create_comments_helper(
        comment_type,
        max_comments_per_entity_number,
        entity_list,
        user_list,
        use_randomized_max_number=False):
    Entity = BookComment if comment_type == 'book' else AuthorComment
    for e in entity_list:
        comments_number = (max_comments_per_entity_number
                           if not use_randomized_max_number
                           else randint(0, max_comments_per_entity_number))
        while comments_number > 0:
            comment = Entity(
                topic=return_random_string(0, 100),
                text=return_random_text(1, 5)
            )
            comment.user = choice(user_list)
            comment.users_liked = list(
                set(
                    choice(user_list) for i in range(randint(0, 10))
                )
            )

            leftover_users = [u for u in user_list
                              if u not in comment.users_liked]
            if leftover_users:
                comment.users_disliked = list(
                    set(
                        choice(leftover_users) for i in range(randint(0, 10))
                    )
                )

            comment.likes_count = (len(comment.users_liked) -
                                   len(comment.users_disliked))
            e.comments.append(comment)
            comments_number -= 1
