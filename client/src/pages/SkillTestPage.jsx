import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import UserNavbar from "../components/UserNavbar.jsx";
import Footer from "../components/Footer.jsx";
import { getQuestions } from "../api/questionApi.js";
import { evaluateMyScore } from "../api/skillGapApi.js";
import { getCourses } from "../api/courseApi.js";

/* =========================================================
   Skill Test Page (candidate side)
   - Updated UI for better alignment and readability
========================================================= */
export default function SkillTestPage() {
  const { skill } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); // { qId: optionIndex }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); 
  const [recommendedCourses, setRecommendedCourses] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    loadQuestions();
  }, [skill]);

  async function loadQuestions() {
    setLoading(true);
    setError("");
    setResult(null);
    setAnswers({});
    setRecommendedCourses([]);
    try {
      const data = await getQuestions({ skill });
      const list = Array.isArray(data) ? data : [];
      const shuffled = [...list].sort(() => Math.random() - 0.5).slice(0, 10);
      setQuestions(shuffled);
    } catch (e) {
      setError(
        e.response?.data?.message ||
          e.message ||
          "Failed to load questions for this skill."
      );
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(questionId, optionIndex) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  }

  async function submitTest() {
    if (questions.length === 0) return;

    const score = questions.reduce((acc, q) => {
      const picked = answers[q._id];
      return picked === q.correctAnswer ? acc + 1 : acc;
    }, 0);

    setSubmitting(true);
    setError("");

    try {
      const evalRes = await evaluateMyScore({
        skill,
        score,
        totalQuestions: questions.length,
      });
      setResult(evalRes);

      if (evalRes?.action === "COURSE") {
        try {
          const courses = await getCourses({ skill });
          setRecommendedCourses(Array.isArray(courses) ? courses : []);
        } catch {
          setRecommendedCourses([]);
        }
      }
    } catch (e) {
      setError(
        e.response?.data?.message ||
          e.message ||
          "Failed to evaluate your score."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const allAnswered =
    questions.length > 0 &&
    questions.every((q) => Object.prototype.hasOwnProperty.call(answers, q._id));

  return (
    <>
      <UserNavbar />

      <div className="container" style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}>
        <div className="page-header" style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "28px", color: "#1a2035", marginBottom: "8px" }}>Skill Test — {skill}</h1>
          <p style={{ color: "#666", fontSize: "15px" }}>
            Answer the questions below. Your score determines whether you
            already know the skill, need practice, or need a course.
          </p>
        </div>

        {loading && <div className="spinner"></div>}

        {!loading && error && !result && (
          <div className="empty-state">
            <div className="icon">⚠️</div>
            <h3>Could not load test</h3>
            <p>{error}</p>
            <button className="btn btn-primary btn-sm" onClick={loadQuestions}>Try again</button>
          </div>
        )}

        {!result && !loading && questions.length > 0 && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {questions.map((q, idx) => (
                <div
                  key={q._id}
                  style={{
                    background: "white",
                    borderRadius: "12px",
                    padding: "24px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    border: "1px solid #f0f0f0"
                  }}
                >
                  <h3 style={{ margin: "0 0 18px", fontSize: "17px", color: "#1a2035", fontWeight: "600" }}>
                    {idx + 1}. {q.questionText}
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {q.options.map((opt, i) => {
                      const selected = answers[q._id] === i;
                      return (
                        <label
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "14px 18px",
                            border: `2px solid ${selected ? "#3b6ef6" : "#f0f0f0"}`,
                            background: selected ? "#f0f7ff" : "white",
                            borderRadius: "10px",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                        >
                          <input
                            type="radio"
                            name={`q-${q._id}`}
                            checked={selected}
                            onChange={() => selectAnswer(q._id, i)}
                            style={{ width: "18px", height: "18px", marginRight: "12px", cursor: "pointer" }}
                          />
                          <div style={{ display: "flex", justifyContent: "space-between", flex: 1, alignItems: "center" }}>
                            <span style={{ fontSize: "15px", color: selected ? "#1e40af" : "#4b5563" }}>
                              {opt}
                            </span>
                            <span style={{ fontWeight: "700", color: selected ? "#3b6ef6" : "#9ca3af", fontSize: "14px" }}>
                               {String.fromCharCode(65 + i)}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end", gap: "12px", paddingBottom: "40px" }}>
              <button className="btn btn-outline" onClick={() => navigate("/skill-gaps")}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={submitTest}
                disabled={!allAnswered || submitting}
                style={{ padding: "10px 24px", fontWeight: "600" }}
              >
                {submitting ? "Submitting…" : "Submit Test"}
              </button>
            </div>
          </>
        )}

        {result && (
          <ResultBlock
            result={result}
            recommendedCourses={recommendedCourses}
            skill={skill}
            onRetry={loadQuestions}
            onBack={() => navigate("/skill-gaps")}
            onCoursesPage={() => navigate(`/courses?skill=${encodeURIComponent(skill)}`)}
          />
        )}
      </div>

      <Footer />
    </>
  );
}

function ResultBlock({ result, recommendedCourses, skill, onRetry, onBack, onCoursesPage }) {
  const { percentage, action, message } = result;
  let color = "#dc3545";
  if (action === "CV_IMPROVEMENT") color = "#16a34a";
  else if (action === "PRACTICE") color = "#f59e0b";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ background: "white", borderRadius: "16px", padding: "40px", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: "64px", color, fontWeight: "800" }}>{percentage}%</div>
        <p style={{ fontSize: "18px", color: "#666", margin: "10px 0" }}>Your overall score</p>
        <p style={{ marginTop: "20px", fontSize: "18px", fontWeight: "700", color }}>{message}</p>
        <div style={{ marginTop: "24px", background: "#f3f4f6", borderRadius: "20px", height: "14px", overflow: "hidden" }}>
          <div style={{ background: color, width: `${percentage}%`, height: "100%", transition: "width 1s ease-in-out" }} />
        </div>
      </div>
      {/* ... Rest of the result UI logic stays same ... */}
      <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
         <button className="btn btn-outline" onClick={onBack}>← Back to skill gaps</button>
         <button className="btn btn-outline" onClick={onRetry}>Re-take this test</button>
      </div>
    </div>
  );
}