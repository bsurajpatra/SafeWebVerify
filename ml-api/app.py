from flask import Flask, request, jsonify
import joblib
import numpy as np

app = Flask(__name__)

# Load the model once at startup
model = joblib.load('phishing_model.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    features = data.get('features')

    if not features:
        return jsonify({'error': 'No features provided'}), 400

    # Convert features list to numpy array and reshape for prediction
    features = np.array(features).reshape(1, -1)

    prediction = model.predict(features)[0]
    confidence = model.predict_proba(features).max()

    label = 'Phishing' if prediction == 1 else 'Legitimate'

    return jsonify({
        'prediction': int(prediction),
        'label': label,
        'confidence': float(confidence)
    })

if __name__ == '__main__':
    app.run(debug=True)
