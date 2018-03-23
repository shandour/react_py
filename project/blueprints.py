from flask import Blueprint


index_bp = Blueprint('index', __name__, template_folder='templates')
api_bp = Blueprint('api', __name__,  url_prefix='/api')
