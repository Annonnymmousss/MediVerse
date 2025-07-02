from flask import Blueprint, request, jsonify
from app.models.heart_model import predict_heart_disease

heart_bp = Blueprint('heart', __name__)

@heart_bp.route('/predict/heart', methods=['POST'])
def heart_disease():
    try:
        data = request.get_json()
        print("Received Heart POST:", data)  
        input_data = tuple(data['features'])
        result = predict_heart_disease(input_data)
        return jsonify({'has_disease': result})
    except Exception as e:
        print("Error:", e)  
        return jsonify({'error': str(e)}), 400

