# -*- coding: utf-8 -*-
from flask_script import Manager, Server

from project import create_app
from project.models import db, User, Role
from project.security import ADMIN_ROLE, EDITOR_ROLE, user_datastore
from create_fixtures import create_fixtures as cf


manager = Manager(create_app)


@manager.command
def create_db():
    "Creates the database"

    db.create_all()

    db.session.add_all(
        [Role(name=ADMIN_ROLE, description='The site Deity'),
         Role(name=EDITOR_ROLE, description='Can add and edit items')]
    )
    db.session.commit()


@manager.command
def drop_db():
    "Drops the database"

    db.drop_all()


@manager.command
@manager.option('-u', '--username', dest='username')
@manager.option('-e', '--email', dest='email')
@manager.option('-p', '--password', dest='password')
@manager.option('-r', '--role', dest='role')
def add_user(username, email, password, role=None):
    "Creates an admin, an editor a basic level (if role is None) user"
    message = ''

    user = user_datastore.create_user(
        username=username,
        email=email,
        password=password,
        active=True
    )

    if role:
        if role.lower() == EDITOR_ROLE.lower():
            user.roles.append(Role.query.filter_by(name=EDITOR_ROLE).one())
            message = 'Editor created'
        elif role.lower() == ADMIN_ROLE.lower():
            user.roles.append(Role.query.filter_by(name=ADMIN_ROLE).one())
            message = 'Admin created'
    else:
        message = 'User created'

    db.session.commit()
    return message


@manager.command
@manager.option('-i', '--iteration_number',
                dest='iteration_number',
                type=int)
@manager.option('-u', '--users_number',
                dest='users_number',
                type=int)
@manager.option('-m', '--max_comments',
                dest='max_comments_per_entity',
                type=int)
@manager.option('-r', '--randomize_max_comments',
                dest='randomized_max_number',
                action='store_true')
def create_fixtures(iteration_number=1,
                    users_number=10,
                    max_comments_per_entity=100,
                    randomized_max_number=False):
    "Creates fixtures"
    cf(int(iteration_number),
       int(users_number),
       int(max_comments_per_entity),
       int(randomized_max_number))


manager.add_command('runserver', Server())

if __name__ == '__main__':
    manager.run()
