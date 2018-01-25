# -*- coding: utf-8 -*-
from flask_script import Manager, Server

from project import create_app

manager = Manager(create_app)


@manager.command
def create_db():
    "Creates the database"

    from project.models import db, Role

    db.create_all()

    from project.security import ADMIN_ROLE, EDITOR_ROLE
    db.session.add_all(
        [Role(name=ADMIN_ROLE, description='The site Deity'),
         Role(name=EDITOR_ROLE, description='Can add and edit items')]
    )
    db.session.commit()


@manager.command
def drop_db():
    "Drops the database"

    from project.models import db

    db.drop_all()


@manager.command
@manager.option('-u', '--username', dest='username')
@manager.option('-e', '--email', dest='email')
@manager.option('-p', '--password', dest='password')
@manager.option('-r', '--role', dest='role')
def add_user(username, email, password, role=None):
    "Creates an admin, an editor a basic level (if role is None) user"
    message = ''

    from project.models import db, User, Role
    from project.security import ADMIN_ROLE, EDITOR_ROLE
    user = User(username=username, email=email, password=password)

    if role:
        if role.lower() == EDITOR_ROLE.lower():
            user.roles.append(Role.query.filter_by(name=EDITOR_ROLE).one())
            message = 'Editor created'
        elif role.lower() == ADMIN_ROLE.lower():
            user.roles.append(Role.query.filter_by(name=ADMIN_ROLE).one())
            message = 'Admin created'
    else:
        message = 'User created'

    db.session.add(user)
    db.session.commit()
    return message


@manager.command
@manager.option('-i', '--iteration_number', dest='iteration_number')
@manager.option('-u', '--users_number', dest='users_number')
@manager.option('-c', '--max_comments', dest='max_comments_per_entity')
def create_fixtures(iteration_number=100,
                    users_number=10,
                    max_comments_per_entity=100):
    "Creates fixtures"
    from create_fixtures import create_fixtures as cf
    cf(int(iteration_number), int(users_number), int(max_comments_per_entity))


manager.add_command('runserver', Server())

if __name__ == '__main__':
    manager.run()
