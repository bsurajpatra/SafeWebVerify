from flask import Flask, request, jsonify
import joblib
import numpy as np

app = Flask(__name__)

model = joblib.load('phishing_model.pkl')

def classify_with_thresholds(features, model):
    proba = model.predict_proba(features)[0]
    class_labels = model.classes_
    proba_dict = {str(label): float(p) for label, p in zip(class_labels, proba)}
    phishing_conf = proba_dict.get('1', 0)
    legit_conf = proba_dict.get('-1', 0)
    if phishing_conf >= 0.7:
        return 1, 'Phishing', phishing_conf, proba_dict
    elif legit_conf >= 0.7:
        return -1, 'Legitimate', legit_conf, proba_dict
    else:
        if phishing_conf > legit_conf:
            return 1, 'Suspicious/Unknown', phishing_conf, proba_dict
        else:
            return -1, 'Suspicious/Unknown', legit_conf, proba_dict

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    features = data.get('features')

    if not features:
        return jsonify({'error': 'No features provided'}), 400

    features = np.array(features).reshape(1, -1)
    if np.all(features == 1):
        return jsonify({
            'prediction': -1,
            'label': 'Legitimate',
            'confidence': 1.0,
            'probabilities': {'-1': 1.0, '1': 0.0},
            'features': features.tolist()
        })

    pred, label, confidence, proba_dict = classify_with_thresholds(features, model)
    return jsonify({
        'prediction': int(pred),
        'label': label,
        'confidence': float(confidence),
        'probabilities': proba_dict,
        'features': features.tolist()
    })

if __name__ == '__main__':
    app.run(debug=True)