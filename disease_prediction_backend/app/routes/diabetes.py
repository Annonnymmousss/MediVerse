from flask import Blueprint, request, jsonify
from app.models.diabetes_model import predict_diabetes

diabetes_bp = Blueprint('diabetes', __name__)

@diabetes_bp.route('/predict/diabetes', methods=['POST'])
def diabetes():
    try:
        data = request.get_json()
        input_data = tuple(data['features'])
        result = predict_diabetes(input_data)
        return jsonify({'is_diabetic': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 400
