"""
text_builder.py
----------------
Small, reusable helpers that turn a job document (coming from MongoDB
via the Node backend) or a candidate profile into a single cleaned
text string. That plain text is what we feed into TF-IDF.

Keeping this separate from the recommender keeps the ML code small
and easy to test.
"""

import re


def _clean(text: str) -> str:
    """
    Lowercase, strip non-alphanumeric characters (keep spaces),
    and collapse multiple whitespace characters into one.
    """
    if not text:
        return ""

    text = str(text).lower()
    # keep letters, numbers and whitespace; drop punctuation/symbols
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _join_list(values) -> str:
    """Safely join a possible list/None/string into a single space-separated string."""
    if not values:
        return ""

    if isinstance(values, list):
        return " ".join(str(v) for v in values if v)

    return str(values)


def build_job_text(job: dict) -> str:
    """
    Build the combined text for a single job using:
      title + category + mandatorySkills + preferredSkills
      + experienceLevel + workType + description

    Mandatory skills are intentionally repeated twice to give them a
    slightly higher weight in TF-IDF without hurting readability.
    """
    if not isinstance(job, dict):
        return ""

    parts = [
        job.get("title", ""),
        job.get("category", ""),
        _join_list(job.get("mandatorySkills")),
        _join_list(job.get("mandatorySkills")),  # light boost
        _join_list(job.get("preferredSkills")),
        job.get("experienceLevel", ""),
        job.get("workType", ""),
        job.get("description", ""),
    ]

    combined = " ".join(str(p) for p in parts if p)
    return _clean(combined)


def build_candidate_text(candidate_text: str) -> str:
    """Clean candidate text the same way we clean job text."""
    return _clean(candidate_text or "")
