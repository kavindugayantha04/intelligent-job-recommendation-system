"""
recommender.py
---------------
Core TF-IDF + cosine similarity recommendation logic.

We fit a fresh TfidfVectorizer on every request using the jobs sent by
the Node backend. This is cheap for our dataset size (a few hundred
jobs) and avoids the complexity of keeping a persistent model in sync
with MongoDB for a university project.

Key rules applied here:
  * Only jobs whose cosine similarity >= SIMILARITY_THRESHOLD are kept.
  * If the candidate text is empty or the TF-IDF vocabulary is empty,
    we return an empty list — we NEVER fake a "0% match" result.
  * Scores are cosine similarities in [0, 1].
"""

import logging
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from utils.text_builder import build_job_text, build_candidate_text

logger = logging.getLogger(__name__)

# Minimum cosine similarity required for a job to count as a real match.
# 0.15 is a good default for short TF-IDF queries with unigrams + bigrams.
# Tune between 0.10 (loose) and 0.25 (strict) for demo purposes.
SIMILARITY_THRESHOLD = 0.15


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

    corpus = [cleaned_candidate] + valid_job_texts

    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),
        min_df=1,
        max_df=0.95,
    )

    try:
        tfidf_matrix = vectorizer.fit_transform(corpus)
    except ValueError as e:
        # Raised when the vocabulary ends up empty (e.g. all stop words).
        # That means we genuinely cannot compute similarity — return [].
        logger.warning("recommend_jobs: TF-IDF vectorization failed: %s", e)
        return []

    candidate_vec = tfidf_matrix[0]
    job_vecs = tfidf_matrix[1:]

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
