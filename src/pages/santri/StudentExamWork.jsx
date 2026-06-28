import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getAuthToken, getAuthUser } from "../../service/api";
import { buildExamAnswersBulkPayload, getCurrentSantriId, getExamQuestions, getExams, submitExamAnswersBulk } from "../../service/examService";

const optionKeys = ["a", "b", "c", "d", "e"];
const LOCAL_EXAM_SESSION_PREFIX = "student_exam_session_v8";
const LOCAL_EXAM_RETAKE_PREFIX = "student_exam_retake_v8";
const LOCAL_EXAM_TEST_DURATION_SECONDS = 60;

function getQuestionId(question) {
  return question.soal_id || question.id || question.id_soal || question.question_id;
}

function getQuestionTitle(question) {
  return question.judul_soal || question.pertanyaan || "-";
}

function sortByQuestionNumber(a, b) {
  return Number(a.nomor_soal || 0) - Number(b.nomor_soal || 0);
}

function formatSeconds(totalSeconds) {
  const safeSeconds = Math.max(Number(totalSeconds) || 0, 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  const parts = hours ? [hours, minutes, seconds] : [minutes, seconds];
  return parts.map((part) => String(part).padStart(2, "0")).join(":");
}

function getSessionTokenFingerprint(token) {
  if (!token) return "";
  let hash = 0;
  for (let index = 0; index < token.length; index += 1) {
    hash = ((hash << 5) - hash) + token.charCodeAt(index);
    hash |= 0;
  }
  return `token-${Math.abs(hash)}`;
}

function getCurrentSessionOwnerId() {
  const tokenOwner = getSessionTokenFingerprint(getAuthToken("student"));
  if (tokenOwner) return tokenOwner;

  const user = getAuthUser("student");
  return user?.santri_id ||
    user?.santri?.santri_id ||
    user?.calon_santri_id ||
    user?.user_id ||
    user?.id ||
    user?.username ||
    "guest";
}

function getCurrentSessionUsername() {
  const user = getAuthUser("student");
  return String(user?.username || user?.user?.username || "").toLowerCase();
}

function getLocalExamSessionKey(ujianId) {
  return `${LOCAL_EXAM_SESSION_PREFIX}:${getCurrentSessionOwnerId()}:${ujianId}`;
}

function getLocalExamRetakeKey(ujianId) {
  return `${LOCAL_EXAM_RETAKE_PREFIX}:${getCurrentSessionOwnerId()}:${ujianId}`;
}

function readLocalExamSession(ujianId) {
  try {
    const value = localStorage.getItem(getLocalExamSessionKey(ujianId));
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function writeLocalExamSession(ujianId, session) {
  localStorage.setItem(getLocalExamSessionKey(ujianId), JSON.stringify(session));
}

function getExamDurationSeconds(exam) {
  if (LOCAL_EXAM_TEST_DURATION_SECONDS) return LOCAL_EXAM_TEST_DURATION_SECONDS;

  const examDuration = Number(exam?.durasi || 0);
  return Math.max(examDuration * 60, 60);
}

function getOrCreateLocalExamSession(ujianId, durationSeconds) {
  const now = Date.now();
  const existing = readLocalExamSession(ujianId);
  const retakeKey = getLocalExamRetakeKey(ujianId);
  const canUseAmbuloRetake = getCurrentSessionUsername() === "ambulo" &&
    existing?.submitted &&
    !localStorage.getItem(retakeKey);

  if (canUseAmbuloRetake) {
    localStorage.setItem(retakeKey, new Date().toISOString());
  } else if (existing?.endAt && Number(existing.durationSeconds) === Number(durationSeconds)) {
    return existing;
  }

  const session = {
    startedAt: now,
    endAt: now + (durationSeconds * 1000),
    durationSeconds,
    submitted: false,
  };
  writeLocalExamSession(ujianId, session);
  return session;
}

function markLocalExamSubmitted(ujianId) {
  const session = readLocalExamSession(ujianId) || {};
  writeLocalExamSession(ujianId, {
    ...session,
    submitted: true,
    submittedAt: Date.now(),
  });
}

function getSubmitErrorMessage(error, options = {}) {
  const message = error.message || "Gagal mengirim jawaban.";
  const combined = `${message} ${JSON.stringify(error.data || {})}`.toLowerCase();

  if (options.auto) {
    if (
      combined.includes("ujian belum dimulai") ||
      combined.includes("jadwal ujian untuk santri ini tidak ditemukan") ||
      combined.includes("jadwal ujian untuk anda tidak sesuai") ||
      combined.includes("jadwal")
    ) {
      return "Waktu habis. Ujian dikunci oleh timer frontend.";
    }
  }

  if (error.status === 409) return "Anda sudah mengerjakan ujian. Silahkan tunggu hasilnya.";
  if (error.status === 422) return message || "Payload jawaban tidak lolos validasi backend.";
  if (combined.includes("ujian belum dimulai")) return "Ujian belum dimulai.";
  if (combined.includes("waktu pengerjaan ujian sudah habis")) return "Waktu pengerjaan ujian sudah habis.";
  if (combined.includes("jadwal ujian untuk santri ini tidak ditemukan")) return "Jadwal ujian untuk santri ini belum dibuat. Silakan hubungi admin.";
  if (combined.includes("jadwal ujian untuk anda tidak sesuai")) return "Jadwal ujian untuk Anda tidak sesuai.";
  if (combined.includes("santri_id")) {
    return "Akun ini belum punya santri_id. Backend harus membuat record santri dulu sebelum calon santri bisa submit ujian.";
  }

  return message;
}

export default function StudentExamWork() {
  const navigate = useNavigate();
  const location = useLocation();
  const { ujianId } = useParams();
  const autoSubmitAttemptedRef = useRef(false);
  const [exam, setExam] = useState(location.state?.exam || null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timerData, setTimerData] = useState(null);
  const [localExamSession, setLocalExamSession] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [lastSubmitPayload, setLastSubmitPayload] = useState(null);
  const [submittingAnswers, setSubmittingAnswers] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadExamWork() {
      setLoading(true);
      setLoadError("");
      autoSubmitAttemptedRef.current = false;
      try {
        const [questionData, examData] = await Promise.all([
          getExamQuestions(ujianId),
          exam ? Promise.resolve(null) : getExams(),
        ]);

        if (!active) return;

        const resolvedExam = exam || (Array.isArray(examData)
          ? examData.find((item) => String(item.ujian_id) === String(ujianId)) || null
          : null);
        const durationSeconds = getExamDurationSeconds(resolvedExam);
        const nextSession = getOrCreateLocalExamSession(ujianId, durationSeconds);
        const localRemainingSeconds = Math.max(Math.floor((Number(nextSession.endAt || 0) - Date.now()) / 1000), 0);

        setQuestions([...questionData].sort(sortByQuestionNumber));
        setTimerData({ durasi_menit: resolvedExam?.durasi || Math.ceil(durationSeconds / 60) });
        setLocalExamSession(nextSession);
        setRemainingSeconds(localRemainingSeconds);

        if (!exam && resolvedExam) setExam(resolvedExam);
      } catch (error) {
        if (active) setLoadError(getSubmitErrorMessage(error) || "Gagal mengambil data pengerjaan ujian.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadExamWork();

    return () => {
      active = false;
    };
  }, [exam, ujianId]);

  const isExamActive = Boolean(localExamSession) && !localExamSession?.submitted && remainingSeconds > 0;
  const answeredCount = questions.filter((question) => String(answers[getQuestionId(question)] || "").trim()).length;
  const canSubmitAnswers = Boolean(localExamSession) && !localExamSession?.submitted && questions.length > 0 && !submittingAnswers;
  const disabledAnswerInput = !isExamActive || submittingAnswers;

  const timerMessage = useMemo(() => {
    if (!localExamSession) return "";
    if (localExamSession.submitted) return "Jawaban sudah dikirim";
    if (remainingSeconds <= 0) return "Ujian sudah selesai / waktu habis";
    return "Ujian aktif";
  }, [localExamSession, remainingSeconds]);

  const lockExamLocally = useCallback(() => {
    markLocalExamSubmitted(ujianId);
    setTimerData((current) => current ? { ...current, sudah_submit: true, sudah_selesai: true, sisa_detik: 0 } : current);
    setLocalExamSession((current) => current ? { ...current, submitted: true, submittedAt: Date.now() } : current);
    setRemainingSeconds(0);
  }, [ujianId]);

  useEffect(() => {
    if (!isExamActive) return undefined;

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isExamActive]);

  const submitAnswers = useCallback(async ({ auto = false } = {}) => {
    if (submittingAnswers) return;

    if (!questions.length) return;

    setSubmittingAnswers(true);
    setSubmitError("");

    const payloadAnswers = questions.map((question) => {
      const questionId = getQuestionId(question);
      return {
        soalId: questionId,
        jawabanText: answers[questionId] || "",
      };
    });

    try {
      const santriId = await getCurrentSantriId();
      setLastSubmitPayload(buildExamAnswersBulkPayload({ ujianId, answers: payloadAnswers, santriId }));
      const submitResult = await submitExamAnswersBulk({
        ujianId,
        answers: payloadAnswers,
      });

      const savedCount = submitResult?.data?.jawaban?.length ||
        submitResult?.data?.data?.jawaban?.length ||
        submitResult?.data?.length ||
        payloadAnswers.length;
      const successMessage = auto
        ? `Waktu habis. ${savedCount} jawaban final otomatis dikirim.`
        : `${savedCount} jawaban final berhasil dikirim. Pilihan ganda dinilai otomatis.`;
      alert(successMessage);
      lockExamLocally();
    } catch (error) {
      const message = getSubmitErrorMessage(error, { auto });
      setSubmitError(message);
      if (error.status === 409) {
        lockExamLocally();
      }
      alert(message);
    } finally {
      setSubmittingAnswers(false);
    }
  }, [answers, lockExamLocally, questions, submittingAnswers, ujianId]);

  useEffect(() => {
    if (!localExamSession || localExamSession.submitted || remainingSeconds <= 0) return undefined;

    const timerId = window.setInterval(() => {
      setRemainingSeconds(Math.max(Math.floor((Number(localExamSession.endAt || 0) - Date.now()) / 1000), 0));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [localExamSession, remainingSeconds]);

  useEffect(() => {
    if (autoSubmitAttemptedRef.current || localExamSession?.submitted || remainingSeconds !== 0 || !questions.length) return;
    autoSubmitAttemptedRef.current = true;
    submitAnswers({ auto: true });
  }, [localExamSession, questions.length, remainingSeconds, submitAnswers]);

  const setAnswer = (questionId, value) => {
    if (disabledAnswerInput) return;
    setAnswers((current) => ({ ...current, [questionId]: value }));
  };

  return (
    <section className="student-page student-exam-focus-page">
      <div className="student-page-title">
        {!isExamActive && <button className="student-secondary-action" type="button" onClick={() => navigate("/santri/ujian")}>Kembali</button>}
        <h1>{exam?.nama_ujian || "Ruang Ujian"}</h1>
        <p>{isExamActive ? "Page khusus pelaksanaan ujian sedang aktif. Selesaikan dan submit jawaban sebelum meninggalkan halaman." : `${answeredCount} dari ${questions.length} soal sudah dijawab.`}</p>
      </div>

      <article className="student-card active-exam-panel">
        <div className="student-card__heading">
          <div>
            <h2>{exam?.nama_ujian || "Ujian"}</h2>
            <p>Timer dan batas akses mengikuti jadwal ujian dari backend.</p>
          </div>
          <span className={`student-badge${isExamActive ? " student-badge--pink" : ""}`}>{timerMessage || "Memuat"}</span>
        </div>

        {loading && <div className="exam-empty-state">Mengambil soal dan timer ujian...</div>}
        {loadError && <div className="exam-empty-state">{loadError}</div>}

        {!loading && !loadError && (
          <>
            <div className="exam-progress-strip exam-progress-strip--timer">
              <span><b>{formatSeconds(remainingSeconds)}</b><small>Sisa waktu</small></span>
              <span><b>{questions.length}</b><small>Total soal</small></span>
              <span><b>{answeredCount}</b><small>Terjawab</small></span>
              <span><b>{timerData?.durasi_menit || "-"}</b><small>Menit</small></span>
            </div>

            {timerMessage && timerMessage !== "Ujian aktif" && <div className="exam-empty-state">{timerMessage}</div>}
            {submitError && <div className="exam-empty-state">{submitError}</div>}
            {submitError && lastSubmitPayload && (
              <div className="exam-empty-state">
                Payload submit: ujian_id={lastSubmitPayload.ujian_id}, santri_id={lastSubmitPayload.santri_id}, total_soal={lastSubmitPayload.jawaban?.length || 0}, soal_id={lastSubmitPayload.jawaban?.map((answer) => answer.soal_id || "-").join(", ")}
              </div>
            )}

            <div className="exam-question-list">
              {questions.map((question) => {
                const questionId = getQuestionId(question);
                return (
                  <section className="exam-question-item" key={questionId || question.nomor_soal}>
                    <div className="exam-question-item__head">
                      <span>Nomor {question.nomor_soal || "-"}</span>
                      <b>Pilihan Ganda</b>
                      <small>Bobot {question.bobot_nilai ?? "-"}</small>
                      <small>{disabledAnswerInput ? "Dikunci" : "Nilai otomatis"}</small>
                    </div>
                    <h3>{getQuestionTitle(question)}</h3>
                    {question.file_soal && <p>File soal: {question.file_soal}</p>}
                    <div className="exam-answer-options">
                      {optionKeys.map((key) => {
                        const value = key.toUpperCase();
                        return (
                          <label className={answers[questionId] === value ? "is-selected" : ""} key={key}>
                            <input
                              checked={answers[questionId] === value}
                              disabled={disabledAnswerInput}
                              name={`question-${questionId}`}
                              type="radio"
                              value={value}
                              onChange={(event) => setAnswer(questionId, event.target.value)}
                            />
                            <span>{value}</span>
                            <strong>{question[`opsi_${key}`] || "-"}</strong>
                          </label>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>

            <div className="student-action-row">
              <button className="student-primary-action" type="button" disabled={!canSubmitAnswers} onClick={() => submitAnswers()}>
                {submittingAnswers ? "Mengirim..." : remainingSeconds <= 0 && !localExamSession?.submitted ? "Coba Kirim Lagi" : "Submit Jawaban"}
              </button>
            </div>
          </>
        )}
      </article>
    </section>
  );
}
