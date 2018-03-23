# -*- coding: utf-8 -*-
from flask import Flask


def create_app(settings_module='project.settings'):
    app = Flask(__name__)
    app.config.from_object(settings_module)
    if not app.testing:
        app.config.from_envvar('PROJECT_SETTINGS_FILE')

    from project.models import db
    db.init_app(app)

    from project.security import security, user_datastore
    from project.forms import UpgradedRegisterForm
    security.init_app(app, datastore=user_datastore,
                      register_form=UpgradedRegisterForm,
                      register_blueprint=False
                      )

    from project.forms import csrf
    csrf.init_app(app)

    import project.views
    from project.blueprints import index_bp, api_bp
    app.register_blueprint(index_bp)
    app.register_blueprint(api_bp)

    return app
