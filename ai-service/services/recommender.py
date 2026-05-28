"""
recommender.py
---------------
Core TF-IDF + cosine similarity recommendation logic.

Production architecture:
  - Load a pre-trained TF-IDF vectorizer once at process startup
    from `model/tfidf_vectorizer.pkl`.
  - For each request, use `vectorizer.transform(...)` to embed:
      candidate text (1 row) and job texts (N rows).
  - Compute cosine similarity for ranking.

This avoids re-fitting a new TF-IDF model on every request, improves
latency, and ensures consistent feature space across requests.

Key rules applied here:
  * Only jobs whose cosine similarity >= SIMILARITY_THRESHOLD are kept.
  * If the candidate text is empty or the TF-IDF vocabulary is empty,
    we return an empty list — we NEVER fake a "0% match" result.
  * Scores are cosine similarities in [0, 1].
"""

import logging
import joblib
from pathlib import Path
from typing import Optional

from sklearn.metrics.pairwise import cosine_similarity

from utils.text_builder import build_job_text, build_candidate_text

logger = logging.getLogger(__name__)

# Minimum cosine similarity required for a job to count as a real match.
# 0.15 is a good default for short TF-IDF queries with unigrams + bigrams.
# Tune between 0.10 (loose) and 0.25 (strict) for demo purposes.
SIMILARITY_THRESHOLD = 0.15


# --------------------------------------------------------------------------------------
# Pre-trained TF-IDF vectorizer (loaded once)
# --------------------------------------------------------------------------------------
#
# IMPORTANT: We load the pickled vectorizer at module import time so it is created only
# once per Python process (e.g., once per Gunicorn worker). Request handlers should only
# call `transform()` on it.
#
# If the model cannot be loaded, we keep the error around and fail fast at request time.
#
TFIDF_VECTORIZER = None
TFIDF_LOAD_ERROR: Optional[BaseException] = None

import joblib
from pathlib import Path

def _load_tfidf_vectorizer():
    base_dir = Path(__file__).resolve().parent.parent
    model_path = base_dir / "model" / "tfidf_vectorizer.pkl"

    return joblib.load(model_path)


try:
    TFIDF_VECTORIZER = _load_tfidf_vectorizer()
    logger.info("Loaded TF-IDF vectorizer from pickle successfully")
except Exception as e:
    TFIDF_VECTORIZER = None
    TFIDF_LOAD_ERROR = e
    # Log at import/startup so the root cause is visible in container logs.
    logger.exception("Failed to load TF-IDF vectorizer pickle: %s", e)


def recommend_jobs(
    candidate_text: str,
    jobs: list,
    top_n: int = 10,
    threshold: float = SIMILARITY_THRESHOLD,
) -> list:
    """
    Rank and filter jobs for a candidate using TF-IDF + cosine similarity.

    Parameters
    ----------
    candidate_text : str
        Free-text profile/CV summary for the candidate.
    jobs : list[dict]
        Jobs coming from MongoDB (already filtered to active ones).
    top_n : int
        Max number of ranked jobs to return (default 10).
    threshold : float
        Minimum similarity score a job must have to be returned.

    Returns
    -------
    list[dict]
        The original job dicts, sorted by similarity_score (desc),
        each with an added "similarity_score" float in [0, 1].
        Only jobs whose score >= `threshold` are included. If no
        job clears the threshold, an empty list is returned.
    """
    if not jobs:
        logger.info("recommend_jobs: no jobs provided")
        return []

    cleaned_candidate = build_candidate_text(candidate_text)

    # Defensive guard: if the Node backend ever forwards empty text,
    # do NOT invent a fake result. The caller should show an empty state.
    if not cleaned_candidate:
        logger.info("recommend_jobs: empty candidate_text after cleaning")
        return []

    job_texts = [build_job_text(job) for job in jobs]

    # Filter out jobs that produced an empty string (would break TF-IDF).
    valid_indices = [i for i, t in enumerate(job_texts) if t]
    if not valid_indices:
        logger.info("recommend_jobs: all job texts were empty after cleaning")
        return []

    valid_job_texts = [job_texts[i] for i in valid_indices]

    # Ensure the pre-trained vectorizer is available. If it failed to load at startup,
    # we cannot compute embeddings, so we surface a server error to the API layer.
    if TFIDF_VECTORIZER is None:
        raise RuntimeError(
            "TF-IDF vectorizer model is not available"
        ) from TFIDF_LOAD_ERROR

    try:
        # IMPORTANT: Use transform() (NOT fit/fit_transform) to keep the same
        # pretrained vocabulary and IDF weights for all requests.
        candidate_vec = TFIDF_VECTORIZER.transform([cleaned_candidate])
        job_vecs = TFIDF_VECTORIZER.transform(valid_job_texts)
    except Exception as e:
        logger.warning("recommend_jobs: TF-IDF transform failed: %s", e)
        return []

    scores = cosine_similarity(candidate_vec, job_vecs).flatten()

    ranked = []
    for score, original_index in zip(scores, valid_indices):
        score_float = round(float(score), 4)

        # Threshold filter — this is what keeps irrelevant jobs out.
        if score_float < threshold:
            continue

        job_with_score = {
            **jobs[original_index],
            "similarity_score": score_float,
        }
        ranked.append(job_with_score)

    ranked.sort(key=lambda j: j["similarity_score"], reverse=True)

    logger.info(
        "recommend_jobs: %d / %d jobs passed threshold=%.2f",
        len(ranked),
        len(valid_indices),
        threshold,
    )

    return ranked[:top_n]
