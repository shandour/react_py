# -*- coding: utf-8 -*-
import click

from project import create_app
from project.models import db, Role, Stats, constants_for_stats_dict
from project.security import ADMIN_ROLE, EDITOR_ROLE, user_datastore
from create_fixtures import create_fixtures as cf

app = create_app()


@app.cli.command()
@click.confirmation_option(
    help='This action will create a new database. Are you sure?')
def create_db():
    "Creates the database"

    db.create_all()

    db.session.add_all(
        [Role(name=ADMIN_ROLE, description='The site Deity'),
         Role(name=EDITOR_ROLE, description='Can add and edit items'),
         Stats(entity_name=constants_for_stats_dict['AUTHORS_NUMBER']),
         Stats(entity_name=constants_for_stats_dict['BOOKS_NUMBER'])])
    db.session.commit()


@app.cli.command()
@click.confirmation_option(
    help='This action will drop the database. Are you sure?')
def drop_db():
    "Drops the database"

    db.drop_all()


@app.cli.command()
@click.argument('username')
@click.argument('email')
@click.argument('password')
@click.option('--role', '-r', default=None)
def add_user(username, email, password, role):
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
    click.echo(message)


@app.cli.command()
@click.option('-i', '--iteration_number',
              type=int,
              default=1)
@click.option('-u', '--users_number',
              type=int,
              default=10)
@click.option('-m', '--max_comments_per_entity',
              type=int,
              default=10)
@click.option('-r', '--randomized_max_number',
              is_flag=True)
@click.confirmation_option(
    help='If the iteration number is great it may take a while.')
def create_fixtures(iteration_number,
                    users_number,
                    max_comments_per_entity,
                    randomized_max_number):
    "Creates fixtures"
    cf(iteration_number,
       users_number,
       max_comments_per_entity,
       randomized_max_number)
    click.echo(('Fixtures created with {iter_n} iterations, '
                '{u} users, {m} maximum comments per entity; '
                'max comments randomizer was set to {r}.')
               .format(iter_n=iteration_number,
                       u=users_number,
                       m=max_comments_per_entity,
                       r=randomized_max_number))
