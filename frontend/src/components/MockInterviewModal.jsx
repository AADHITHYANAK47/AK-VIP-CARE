import React, { useState, useEffect } from "react";
import { X, Mic, Send, Award, CheckCircle2, AlertCircle, RefreshCw, MessageSquare } from "lucide-react";
import { api } from "../services/api";

export default function MockInterviewModal({ drive, onClose }) {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState(null);

  useEffect(() => {
    if (drive) {
      loadQuestions();
    }
  }, [drive]);

  async function loadQuestions() {
    try {
      setLoading(true);
      const res = await api.getMockQuestions(drive.title, drive.required_skills);
      setQuestions(res.questions);
    } catch (err) {
      console.error("Failed to load interview questions", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleEvaluate() {
    if (!answer.trim()) return;
    try {
      setEvaluating(true);
      const res = await api.evaluateAnswer(questions[currentIdx].question, answer);
      setEvalResult(res);
    } catch (err) {
      console.error("Evaluation error", err);
    } finally {
      setEvaluating(false);
    }
  }

  const q = questions[currentIdx];

  return (
    <div className="modal-overlay" id="mock-interview-modal">
      <div className="modal-content" style={{ maxWidth: "780px" }}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)", background: "rgba(6, 182, 212, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent-cyan)" }}>
              <Mic size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>AI Interview Readiness Coach</h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Role: {drive.title} ({drive.company_name})
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} id="btn-close-interview-modal">
            <X size={20} />
          </button>
        </div>

        {loading || !q ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            Synthesizing role-tailored technical questions...
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span className="badge badge-cyan">{q.type}</span>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Question {currentIdx + 1} of {questions.length}
              </span>
            </div>

            {/* Question Card */}
            <div style={{ padding: "1.5rem", borderRadius: "var(--radius-md)", background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--border-subtle)", marginBottom: "1.25rem" }}>
              <h4 style={{ fontSize: "1.1rem", fontWeight: 700, lineHeight: 1.5, marginBottom: "0.5rem" }}>
                "{q.question}"
              </h4>
              <p style={{ fontSize: "0.8rem", color: "var(--text-dim)", fontStyle: "italic" }}>
                Evaluation focus: {q.eval_criteria}
              </p>
            </div>

            {/* Answer Input */}
            <div className="form-group">
              <label className="form-label">Your Response / Architecture Solution:</label>
              <textarea
                id="mock-answer-input"
                className="form-textarea"
                rows={5}
                placeholder="Type your structured answer here (e.g. explain core concepts, latency trade-offs, and failure recovery)..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {currentIdx > 0 && (
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => { setCurrentIdx(currentIdx - 1); setEvalResult(null); setAnswer(""); }}
                  >
                    ← Previous
                  </button>
                )}
                {currentIdx < questions.length - 1 && (
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => { setCurrentIdx(currentIdx + 1); setEvalResult(null); setAnswer(""); }}
                  >
                    Next Question →
                  </button>
                )}
              </div>

              <button 
                id="btn-submit-mock-answer"
                className="btn btn-cyan" 
                onClick={handleEvaluate}
                disabled={evaluating || !answer.trim()}
              >
                {evaluating ? "Scoring Response..." : "Evaluate Answer with AI Coach →"}
              </button>
            </div>

            {/* AI Evaluation Result */}
            {evalResult && (
              <div 
                id="mock-eval-result"
                style={{ 
                  marginTop: "1.5rem", 
                  padding: "1.25rem", 
                  borderRadius: "var(--radius-md)", 
                  background: "rgba(16, 185, 129, 0.08)", 
                  border: "1px solid rgba(16, 185, 129, 0.25)" 
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "#34D399" }}>
                    AI Score: {evalResult.score} / 100
                  </span>
                  <span className="badge badge-emerald">Feedback Delivered</span>
                </div>
                <p style={{ fontSize: "0.9rem", color: "#E0E7FF", marginBottom: "0.5rem" }}>
                  {evalResult.feedback}
                </p>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  💡 <strong>Tip:</strong> {evalResult.improvement_areas.join("; ")}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
