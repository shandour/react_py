# react_py
flask backend and react frontend

A one-page application with React-based frontend (React, React-Router, React-Bootstrap, React-Tags-Input, React-Infinite-Scroller), using Flask, Flask-Security, Flask-SqlAlchemy, Flask-Wtforms, Flask-Cli/click, sortedcontainers, Postgresql with indices and full-text search, Jinja.
This is a demonstrational library site, featuring the following models and ways to interact with them:
* Author, Book, AuthorComment, BookComment as the main interactable entities, which the users (depending on their roles) can add, delete and/or edit.
* User, Role used for authentication and authorization.
* A user can access his/her own personal cabinet (the profile page), where he/she can view his/her personal information and change password; also the comments written by the user can be sorted according to various sorting criteria.

To use the project:
-Create a virtual env;
-cd into project root;
-pip install -r requirements.txt;
-cd into ./project/static;
-install package.json with yarn or npm;
-run gulpfile.js (e.g., yarn run gulp) to create a bundle in ./js/;
-cd back to root;
-export PROJECT_SETTINGS_FILE=path to "prod" settings;
-export FLASK_APP (e.g., export FLASK_APP='/home/user/code/react_py/manage.py');
-flask run;
