# react_py
flask backend and react frontend

A one-page application with React-based frontend (React, React-Router, React-Bootstrap, React-Tags-Input, React-Infinite-Scroller), using Flask, Flask-Security, Flask-SqlAlchemy, Flask-Wtforms, sortedcontainers, Postgresql with indices and full-text search, Jinja.
This is a demonstrational library site, featuring the following models and ways to interact with them:
* Author, Book, AuthorComment, BookComment as the main interactable entities, which the users (depending on their roles) can add, delete and/or edit.
* User, Role used for authentication and authorization.
* A user can access his/her own personal cabinet (the profile page), where he/she can view his/her personal information and change password; also the comments written by the user can be sorted according to various sorting criteria.
