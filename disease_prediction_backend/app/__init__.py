from flask import Flask
from app.routes.heart import heart_bp
from app.routes.diabetes import diabetes_bp

def create_app():
    app = Flask(__name__)
    app.register_blueprint(heart_bp)
    app.register_blueprint(diabetes_bp)
    return app
