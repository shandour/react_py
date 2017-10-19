# -*- coding: utf-8 -*-
from flask_security import Security, SQLAlchemyUserDatastore

from project.models import db, User, Role

user_datastore = SQLAlchemyUserDatastore(db, User, Role)
security = Security()

# priviledged roles
ADMIN_ROLE = 'admin'
EDITOR_ROLE = 'editor'
