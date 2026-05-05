"""
app.py
-------
Flask microservice that exposes the job recommendation endpoint.

Run locally:
    pip install -r requirements.txt
    python app.py
Service will be available on http://localhost:8000
"""

import logging
from flask import Flask, request, jsonify
from flask_cors import CORS

from services.recommender import recommend_jobs, SIMILARITY_THRESHOLD

logging.basicConfig(
    level=logging.INFO,
    format="[ai-service] %(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)


@app.route("/", methods=["GET"])
def health():
    """Simple health check so you can open the URL in a browser."""
    return jsonify({
        "status": "ok",
        "service": "ai-service",
        "endpoint": "POST /recommend",
        "threshold": SIMILARITY_THRESHOLD,
    })


@app.route("/recommend", methods=["POST"])
def recommend():
    """
    Expected JSON body:
    {
        "candidateText": "Python SQL Machine Learning",
        "jobs": [ { "_id": "...", "title": "...", ... }, ... ],
        "threshold": 0.15   // optional override
    }

    Response:
    {
        "recommendations": [ { ...job..., "similarity_score": 0.71 }, ... ]
    }
    """
    data = request.get_json(silent=True) or {}

    candidate_text = data.get("candidateText", "")
    jobs = data.get("jobs", [])
    threshold = data.get("threshold", SIMILARITY_THRESHOLD)

    if not isinstance(jobs, list):
        return jsonify({"error": "`jobs` must be an array"}), 400

    if not isinstance(candidate_text, str):
        return jsonify({"error": "`candidateText` must be a string"}), 400

    try:
        threshold = float(threshold)
    except (TypeError, ValueError):
        threshold = SIMILARITY_THRESHOLD

    logger.info(
        "recommend request: jobs=%d candidate_len=%d threshold=%.2f",
        len(jobs),
        len(candidate_text),
        threshold,
    )

    try:
        recommendations = recommend_jobs(
            candidate_text,
            jobs,
            top_n=10,
            threshold=threshold,
        )
        return jsonify({"recommendations": recommendations}), 200
    except Exception as e:
        logger.exception("Recommendation error: %s", e)
        return jsonify({"error": "Failed to generate recommendations"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
