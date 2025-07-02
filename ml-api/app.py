from flask import Flask, request, jsonify
import joblib
import numpy as np
import re
import socket
import requests
import whois
import tldextract
import dns.resolver
from bs4 import BeautifulSoup
from datetime import datetime
from urllib.parse import urlparse

app = Flask(__name__)

# Load the model once at startup
model = joblib.load('phishing_model.pkl')

# Helper: classify with thresholds
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
        # Suspicious/Unknown
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
    pred, label, confidence, proba_dict = classify_with_thresholds(features, model)
    return jsonify({
        'prediction': int(pred),
        'label': label,
        'confidence': float(confidence),
        'probabilities': proba_dict,
        'features': features.tolist()  # Optional, for debugging
    })

def extract_features_from_url(url):
    # Helper functions
    def has_ip(url):
        try:
            host = urlparse(url).netloc
            socket.inet_aton(host)
            return 1
        except:
            return -1

    def long_url(url):
        return 1 if len(url) >= 54 else -1

    def short_url(url):
        shorteners = r"bit\.ly|goo\.gl|shorte\.st|go2l\.ink|x\.co|ow\.ly|t\.co|tinyurl|tr\.im|is\.gd|cli\.gs|yfrog\.com|migre\.me|ff\.im|tiny\.cc|url4\.eu|twit\.ac|su\.pr|twurl\.nl|snipurl\.com|short\.to|BudURL\.com|ping\.fm|post\.ly|Just\.as|bkite\.com|snipr\.com|fic\.kr|loopt\.us|doiop\.com|short\.ie|kl\.am|wp\.me|rubyurl\.com|om\.ly|to\.ly|bit\.do|lnkd\.in|db\.tt|qr\.ae|adf\.ly|bitly\.com|cur\.lv|tinyurl\.com|owly\.com|bit\.ly|ity\.im|q\.gs|is\.gd|po\.st|bc\.vc|twitthis\.com|u\.to|j\.mp|buzurl\.com|cutt\.us|u\.bb|yourls\.org|prettylinkpro\.com|scrnch\.me|filoops\.info|vzturl\.com|qr\.net|1url\.com|tweez\.me|v\.gd|tr\.im|link\.zip\.net"
        return 1 if re.search(shorteners, url) else -1

    def symbol_at(url):
        return 1 if "@" in url else -1

    def redirecting(url):
        return 1 if urlparse(url).path.count('//') > 0 else -1

    def prefix_suffix(url):
        return -1 if '-' in urlparse(url).netloc else 1

    def subdomains(url):
        netloc = urlparse(url).netloc
        if netloc.startswith("www."):
            netloc = netloc.replace("www.", "")
        dots = netloc.count('.')
        if dots == 1:
            return -1
        elif dots == 2:
            return 0
        else:
            return 1

    def https_token(url):
        # CSV expects 'HTTPS' as 1 if scheme is https, else -1
        return 1 if urlparse(url).scheme == "https" else -1

    def domain_reg_len(url):
        try:
            ext = tldextract.extract(url)
            domain = ext.registered_domain
            w = whois.whois(domain)
            exp = w.expiration_date
            if isinstance(exp, list):
                exp = exp[0]
            updated = w.updated_date
            if isinstance(updated, list):
                updated = updated[0]
            if exp and updated:
                days = (exp - updated).days
                return 1 if days > 365 else -1
            else:
                return -1
        except:
            return -1

    def favicon(url):
        try:
            r = requests.get(url, timeout=5)
            soup = BeautifulSoup(r.text, 'html.parser')
            for link in soup.find_all('link', rel='icon'):
                href = link.get('href', '')
                if urlparse(href).netloc and urlparse(href).netloc != urlparse(url).netloc:
                    return -1
            return 1
        except:
            return 1

    def non_std_port(url):
        try:
            port = urlparse(url).port
            if port and port not in [80, 443]:
                return 1
            return -1
        except:
            return -1

    def https_domain_url(url):
        # CSV expects 1 if 'https' in domain part, else -1
        return 1 if "https" in urlparse(url).netloc else -1

    def request_url(url):
        try:
            r = requests.get(url, timeout=5)
            soup = BeautifulSoup(r.text, 'html.parser')
            imgs = soup.find_all('img', src=True)
            total = len(imgs)
            linked = 0
            for img in imgs:
                src = img['src']
                if urlparse(src).netloc and urlparse(src).netloc != urlparse(url).netloc:
                    linked += 1
            if total == 0:
                return 1
            percent = linked / total
            if percent < 0.22:
                return 1
            elif percent < 0.61:
                return 0
            else:
                return -1
        except:
            return 1

    def anchor_url(url):
        try:
            r = requests.get(url, timeout=5)
            soup = BeautifulSoup(r.text, 'html.parser')
            anchors = soup.find_all('a', href=True)
            total = len(anchors)
            unsafe = 0
            for a in anchors:
                href = a['href']
                if not href or href.startswith('#') or 'javascript' in href.lower() or 'mailto' in href.lower() or urlparse(href).netloc != urlparse(url).netloc:
                    unsafe += 1
            if total == 0:
                return 1
            percent = unsafe / total
            if percent < 0.31:
                return 1
            elif percent < 0.67:
                return 0
            else:
                return -1
        except:
            return 1

    def links_in_script_tags(url):
        try:
            r = requests.get(url, timeout=5)
            soup = BeautifulSoup(r.text, 'html.parser')
            tags = soup.find_all(['script', 'link'], src=True)
            total = len(tags)
            linked = 0
            for tag in tags:
                src = tag.get('src', '')
                if urlparse(src).netloc and urlparse(src).netloc != urlparse(url).netloc:
                    linked += 1
            if total == 0:
                return 1
            percent = linked / total
            if percent < 0.17:
                return 1
            elif percent < 0.81:
                return 0
            else:
                return -1
        except:
            return 1

    def server_form_handler(url):
        try:
            r = requests.get(url, timeout=5)
            soup = BeautifulSoup(r.text, 'html.parser')
            forms = soup.find_all('form', action=True)
            for form in forms:
                action = form['action']
                if not action or action == "about:blank":
                    return -1
                elif urlparse(action).netloc and urlparse(action).netloc != urlparse(url).netloc:
                    return 0
            return 1
        except:
            return 1

    def info_email(url):
        try:
            r = requests.get(url, timeout=5)
            if re.search(r"mailto:|@", r.text):
                return 1
            return -1
        except:
            return -1

    def abnormal_url(url):
        try:
            ext = tldextract.extract(url)
            domain = ext.registered_domain
            return 1 if domain in url else -1
        except:
            return -1

    def website_forwarding(url):
        try:
            r = requests.get(url, timeout=5, allow_redirects=True)
            if len(r.history) > 1:
                return -1
            return 1
        except:
            return 1

    def status_bar_cust(url):
        # Needs JS analysis, not feasible here
        return -1

    def disable_right_click(url):
        # Needs JS analysis, not feasible here
        return -1

    def using_popup_window(url):
        # Needs JS analysis, not feasible here
        return -1

    def iframe_redirection(url):
        try:
            r = requests.get(url, timeout=5)
            soup = BeautifulSoup(r.text, 'html.parser')
            iframes = soup.find_all('iframe')
            for iframe in iframes:
                if iframe.get('frameborder', '') == '0':
                    return -1
            return 1
        except:
            return 1

    def age_of_domain(url):
        try:
            ext = tldextract.extract(url)
            domain = ext.registered_domain
            w = whois.whois(domain)
            creation = w.creation_date
            if isinstance(creation, list):
                creation = creation[0]
            if creation:
                age = (datetime.now() - creation).days
                return 1 if age > 180 else -1
            else:
                return -1
        except:
            return -1

    def dns_recording(url):
        try:
            ext = tldextract.extract(url)
            domain = ext.registered_domain
            dns.resolver.resolve(domain, 'A')
            return 1
        except:
            return -1

    def website_traffic(url):
        # Needs Alexa or similar API, not feasible for free
        return -1

    def page_rank(url):
        # Needs external API, not feasible for free
        return -1

    def google_index(url):
        # Could use Google search API, not feasible for free
        return 1

    def links_pointing_to_page(url):
        # Could use backlink check, not feasible for free
        return 1

    def stats_report(url):
        # Could use PhishTank or similar, not feasible for free
        return -1

    # Feature order and mapping to CSV columns:
    features = [
        has_ip(url),
        long_url(url),
        short_url(url),
        symbol_at(url),
        redirecting(url),
        prefix_suffix(url),
        subdomains(url),
        https_token(url),
        domain_reg_len(url),
        favicon(url),
        non_std_port(url),
        https_domain_url(url),
        request_url(url),
        anchor_url(url),
        links_in_script_tags(url),
        server_form_handler(url),
        info_email(url),
        abnormal_url(url),
        website_forwarding(url),
        status_bar_cust(url),
        disable_right_click(url),
        using_popup_window(url),
        iframe_redirection(url),
        age_of_domain(url),
        dns_recording(url),
        website_traffic(url),
        page_rank(url),
        google_index(url),
        links_pointing_to_page(url),
        stats_report(url)
    ]
    return features

@app.route('/extract-and-predict', methods=['POST'])
def extract_and_predict():
    data = request.get_json()
    url = data.get('url')
    if not url:
        return jsonify({'error': 'No URL provided'}), 400
    features = extract_features_from_url(url)
    features = np.array(features).reshape(1, -1)
    pred, label, confidence, proba_dict = classify_with_thresholds(features, model)
    return jsonify({
        'prediction': int(pred),
        'label': label,
        'confidence': float(confidence),
        'probabilities': proba_dict,
        'features': features.tolist()  # Optional, for debugging
    })

# Endpoint to return feature names in order
@app.route('/features', methods=['GET'])
def get_feature_names():
    feature_names = [
        "UsingIP",
        "LongURL",
        "ShortURL",
        "Symbol@",
        "Redirecting//",
        "PrefixSuffix-",
        "SubDomains",
        "HTTPS",
        "DomainRegLen",
        "Favicon",
        "NonStdPort",
        "HTTPSDomainURL",
        "RequestURL",
        "AnchorURL",
        "LinksInScriptTags",
        "ServerFormHandler",
        "InfoEmail",
        "AbnormalURL",
        "WebsiteForwarding",
        "StatusBarCust",
        "DisableRightClick",
        "UsingPopupWindow",
        "IframeRedirection",
        "AgeofDomain",
        "DNSRecording",
        "WebsiteTraffic",
        "PageRank",
        "GoogleIndex",
        "LinksPointingToPage",
        "StatsReport"
    ]
    return jsonify({"feature_names": feature_names})

if __name__ == '__main__':
    app.run(debug=True)