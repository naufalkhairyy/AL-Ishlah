import { useEffect, useMemo, useRef, useState } from "react";
import BackendNotice from "../components/BackendNotice";
import DocumentMock from "../components/DocumentMock";
import { getAdminExamData } from "../../../service/adminService";
import {
  createExam,
  createExamQuestion,
  deleteExamAnswer,
  deleteExamQuestion,
  generateExamSchedules,
  getAdminExamQuestions,
  importExamQuestions,
  updateExamSchedule,
  updateExamQuestion,
} from "../../../service/examService";

const optionKeys = ["a", "b", "c", "d", "e"];
const tableSizeOptions = [10, 15, 20, 30, 50];
const emptyQuestionForm = {
  soal_id: "",
  nomor_soal: "",
  judul_soal: "",
  opsi_a: "",
  opsi_b: "",
  opsi_c: "",
  opsi_d: "",
  opsi_e: "",
  jawaban_benar: "A",
  bobot_nilai: "1",
  durasi_pengerjaan: "",
  file_soal: null,
};
const emptyExamForm = {
  nama_ujian: "",
  tanggal: "",
  durasi: "",
  status: "aktif",
};
const emptyScheduleForm = {
  ujian_id: "",
  santri_id: "",
  tanggal: "",
  waktu_mulai: "",
  waktu_selesai: "",
  ruang_ujian: "",
  keterangan: "",
};

function normalizeImportErrors(result) {
  const errors = result?.errors || result?.data?.errors || result?.validation_errors || [];
  if (Array.isArray(errors)) return errors;
  if (!errors || typeof errors !== "object") return [];
  return Object.entries(errors).map(([row, messages]) => ({
    row,
    messages: Array.isArray(messages) ? messages : [String(messages)],
  }));
}

function getQuestionId(question) {
  return question.soal_id || question.id || question.id_soal || question.question_id;
}

function getQuestionTitle(question) {
  return question.judul_soal || question.pertanyaan || "-";
}

function sortByQuestionNumber(a, b) {
  return Number(a.nomor_soal || 0) - Number(b.nomor_soal || 0);
}

function getScheduleId(schedule) {
  return schedule.jadwal_id || schedule.id || "";
}

function getScheduleExamId(schedule) {
  return schedule.ujian_id || schedule.ujian?.ujian_id || "";
}

function getScheduleStudentId(schedule) {
  return schedule.santri_id || schedule.santri?.santri_id || "";
}

function getStudentDisplayName(student, fallbackId = "") {
  return student?.nama_lengkap ||
    student?.nama ||
    student?.name ||
    student?.full_name ||
    student?.calon_santri?.nama_lengkap ||
    student?.calonSantri?.nama_lengkap ||
    student?.data_calon_santri?.nama_lengkap ||
    student?.dataCalonSantri?.nama_lengkap ||
    student?.calon?.nama_lengkap ||
    student?.user?.nama_lengkap ||
    student?.user?.name ||
    student?.user?.username ||
    (fallbackId ? `Santri #${fallbackId}` : "Santri");
}

function getAnswerExamId(answer) {
  return answer?.ujian_id ||
    answer?.soal?.ujian_id ||
    answer?.soal?.ujian?.ujian_id ||
    "";
}

function getAnswerStudentKey(answer) {
  return answer?.santri_id ||
    answer?.santri?.santri_id ||
    answer?.santri?.user?.username ||
    answer?.santri?.username ||
    "";
}

function getAnswerId(answer) {
  return answer?.jawaban_id || answer?.id || answer?.answer_id || "";
}

function isPassedStatus(value) {
  const status = String(value || "").toLowerCase();
  return ["lulus", "passed", "diterima", "accepted"].includes(status);
}

function formatScheduleDate(date) {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function sortSchedules(a, b) {
  const first = new Date(`${a.tanggal || ""}T${String(a.waktu_mulai || "00:00").slice(0, 5)}:00`).getTime() || 0;
  const second = new Date(`${b.tanggal || ""}T${String(b.waktu_mulai || "00:00").slice(0, 5)}:00`).getTime() || 0;
  return first - second;
}

export default function ExamPage({ openModal, notify }) {
  const [examData, setExamData] = useState({ ujian: [], jadwal: [], jawaban: [], santri: [] });
  const [loading, setLoading] = useState(true);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [questions, setQuestions] = useState([]);
  const [questionForm, setQuestionForm] = useState(emptyQuestionForm);
  const [examForm, setExamForm] = useState(emptyExamForm);
  const [scheduleForm, setScheduleForm] = useState(emptyScheduleForm);
  const [selectedScheduleSantriIds, setSelectedScheduleSantriIds] = useState([]);
  const [editingScheduleId, setEditingScheduleId] = useState("");
  const [importResult, setImportResult] = useState(null);
  const [selectedImportFile, setSelectedImportFile] = useState(null);
  const [questionLimit, setQuestionLimit] = useState(10);
  const [scheduleLimit, setScheduleLimit] = useState(10);
  const [answerLimit, setAnswerLimit] = useState(10);
  const [savingExam, setSavingExam] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const importInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const questionFormRef = useRef(null);
  const scheduleFormRef = useRef(null);

  useEffect(() => {
    let active = true;

    getAdminExamData()
      .then((data) => {
        if (!active) return;
        setExamData(data);
        setSelectedExamId(String(data.ujian[0]?.ujian_id || ""));
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "Gagal mengambil data ujian.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const refreshExamData = async (nextSelectedExamId = selectedExamId) => {
    const data = await getAdminExamData();
    setExamData(data);
    setSelectedExamId(String(nextSelectedExamId || data.ujian[0]?.ujian_id || ""));
    return data;
  };

  const loadQuestions = async (ujianId = selectedExamId) => {
    if (!ujianId) {
      setQuestions([]);
      return;
    }

    setQuestionLoading(true);
    try {
      const data = await getAdminExamQuestions(ujianId);
      setQuestions([...data].sort(sortByQuestionNumber));
    } catch (requestError) {
      notify("Gagal mengambil soal", requestError.message || "Endpoint soal belum merespons.");
    } finally {
      setQuestionLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions(selectedExamId);
    setQuestionForm(emptyQuestionForm);
    setImportResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExamId]);

  const activeSchedules = useMemo(
    () => examData.jadwal.filter((item) => item.ujian?.status === "aktif"),
    [examData.jadwal],
  );
  const sortedSchedules = useMemo(
    () => [...examData.jadwal].sort(sortSchedules),
    [examData.jadwal],
  );

  const gradedAnswers = examData.jawaban.filter((answer) => answer.nilai_jawaban !== null);
  const pendingAnswers = examData.jawaban.filter((answer) => answer.nilai_jawaban === null);
  const passingRate = examData.jawaban.length
    ? Math.round((gradedAnswers.filter((answer) => Number(answer.nilai_jawaban) >= 70).length / examData.jawaban.length) * 100)
    : 0;

  const selectedExam = examData.ujian.find((exam) => String(exam.ujian_id) === String(selectedExamId));
  const importErrors = normalizeImportErrors(importResult);
  const multipleChoiceCount = questions.length;
  const visibleQuestions = questions.slice(0, questionLimit);
  const visibleSchedules = sortedSchedules.slice(0, scheduleLimit);
  const visibleAnswers = examData.jawaban.slice(0, answerLimit);
  const scheduledSantriIds = useMemo(() => {
    const scheduleExamId = scheduleForm.ujian_id || selectedExamId;
    return new Set(examData.jadwal
      .filter((schedule) => String(schedule.ujian_id || schedule.ujian?.ujian_id) === String(scheduleExamId))
      .map((schedule) => String(schedule.santri_id || schedule.santri?.santri_id))
      .filter(Boolean));
  }, [examData.jadwal, scheduleForm.ujian_id, selectedExamId]);
  const schedulableSantri = useMemo(
    () => examData.santri.filter((student) => student.santri_id && !scheduledSantriIds.has(String(student.santri_id))),
    [examData.santri, scheduledSantriIds],
  );
  const getSantriNameById = (santriId) => {
    const student = examData.santri.find((item) => String(item.santri_id) === String(santriId));
    return getStudentDisplayName(student, santriId);
  };
  const getScheduleStudentName = (schedule) => {
    const santriId = getScheduleStudentId(schedule);
    const student = schedule.santri || examData.santri.find((item) => String(item.santri_id) === String(santriId));
    return getStudentDisplayName(student, santriId);
  };
  const passedStudents = useMemo(() => {
    const rows = new Map();

    examData.santri.forEach((student) => {
      const santriId = String(student.santri_id || "");
      const passedByStatus = isPassedStatus(student.status_kelulusan || student.status_lulus || student.kelulusan || student.status);
      if (!santriId || !passedByStatus) return;
      rows.set(santriId, {
        id: santriId,
        name: getStudentDisplayName(student, santriId),
        source: "Status backend",
        score: student.nilai_akhir || student.nilai_total || "-",
        examCount: "-",
      });
    });

    const answerGroups = new Map();
    examData.jawaban.forEach((answer) => {
      const santriKey = String(getAnswerStudentKey(answer) || answer.santri_id || "");
      if (!santriKey) return;
      const current = answerGroups.get(santriKey) || {
        id: santriKey,
        name: getStudentDisplayName(answer.santri, answer.santri_id),
        scores: [],
        exams: new Set(),
      };
      if (answer.nilai_jawaban !== null && answer.nilai_jawaban !== undefined && answer.nilai_jawaban !== "") {
        current.scores.push(Number(answer.nilai_jawaban));
      }
      const examId = getAnswerExamId(answer);
      if (examId) current.exams.add(String(examId));
      answerGroups.set(santriKey, current);
    });

    answerGroups.forEach((group) => {
      if (!group.scores.length || group.scores.some((score) => Number.isNaN(score) || score < 70)) return;
      const average = Math.round(group.scores.reduce((total, score) => total + score, 0) / group.scores.length);
      rows.set(group.id, {
        id: group.id,
        name: group.name,
        source: "Nilai ujian",
        score: average,
        examCount: group.exams.size || group.scores.length,
      });
    });

    return Array.from(rows.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [examData.jawaban, examData.santri]);

  const setFormField = (field, value) => {
    setQuestionForm((current) => ({ ...current, [field]: value }));
  };

  const setExamFormField = (field, value) => {
    setExamForm((current) => ({ ...current, [field]: value }));
  };

  const setScheduleFormField = (field, value) => {
    setScheduleForm((current) => ({ ...current, [field]: value }));
  };

  const toggleScheduleSantri = (santriId) => {
    setSelectedScheduleSantriIds((current) => {
      const value = String(santriId);
      return current.includes(value) ? current.filter((id) => id !== value) : [...current, value];
    });
  };

  const toggleAllScheduleSantri = () => {
    setSelectedScheduleSantriIds((current) => {
      const allIds = schedulableSantri.map((student) => String(student.santri_id));
      return current.length === allIds.length ? [] : allIds;
    });
  };

  const resetForm = () => {
    setQuestionForm(emptyQuestionForm);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleExamSubmit = async (event) => {
    event.preventDefault();
    setSavingExam(true);
    try {
      const savedExam = await createExam(examForm);
      const savedExamId = savedExam?.ujian_id || savedExam?.id || "";
      await refreshExamData(savedExamId);
      setExamForm(emptyExamForm);
      notify("Ujian ditambahkan", `${examForm.nama_ujian} berhasil dibuat.`);
    } catch (requestError) {
      notify("Gagal menambah ujian", requestError.message || "Periksa kembali data ujian.");
    } finally {
      setSavingExam(false);
    }
  };

  const handleScheduleSubmit = async (event) => {
    event.preventDefault();

    setSavingSchedule(true);
    try {
      const payload = {
        ...scheduleForm,
        ujian_id: scheduleForm.ujian_id || selectedExamId,
        santri_ids: selectedScheduleSantriIds.map((id) => Number(id)),
      };

      if (editingScheduleId) {
        await updateExamSchedule(editingScheduleId, payload);
        await refreshExamData(payload.ujian_id);
        setScheduleForm(emptyScheduleForm);
        setSelectedScheduleSantriIds([]);
        setEditingScheduleId("");
        notify("Jadwal diperbarui", "Perubahan jadwal ujian berhasil disimpan.");
        return;
      }

      const result = await generateExamSchedules(payload);
      await refreshExamData(payload.ujian_id);
      setScheduleForm(emptyScheduleForm);
      setSelectedScheduleSantriIds([]);
      notify("Generate jadwal selesai", `${result.created ?? 0} dibuat, ${result.skipped ?? 0} dilewati.`);
    } catch (requestError) {
      notify("Gagal membuat jadwal", requestError.message || "Periksa kembali data jadwal ujian.");
    } finally {
      setSavingSchedule(false);
    }
  };

  const editSchedule = (schedule) => {
    const scheduleId = getScheduleId(schedule);
    if (!scheduleId) {
      notify("Jadwal tidak valid", "ID jadwal ujian tidak ditemukan.");
      return;
    }

    setEditingScheduleId(String(scheduleId));
    setScheduleForm({
      ujian_id: getScheduleExamId(schedule),
      santri_id: getScheduleStudentId(schedule),
      tanggal: schedule.tanggal || "",
      waktu_mulai: String(schedule.waktu_mulai || "").slice(0, 5),
      waktu_selesai: String(schedule.waktu_selesai || "").slice(0, 5),
      ruang_ujian: schedule.ruang_ujian || "",
      keterangan: schedule.keterangan || "",
    });
    setSelectedScheduleSantriIds([]);
    setTimeout(() => {
      scheduleFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const copyExamPageLink = async (schedule) => {
    const examId = getScheduleExamId(schedule);
    if (!examId) {
      notify("Link belum tersedia", "Jadwal ini belum memiliki ujian_id.");
      return;
    }

    const url = `${window.location.origin}/santri/ujian/${examId}`;
    try {
      await navigator.clipboard.writeText(url);
      notify("Link page ujian disalin", url);
    } catch {
      openModal("Page Pelaksanaan Ujian", url);
    }
  };

  const editQuestion = (question) => {
    setQuestionForm({
      ...emptyQuestionForm,
      ...question,
      soal_id: getQuestionId(question),
      judul_soal: getQuestionTitle(question),
      jawaban_benar: (question.jawaban_benar || "A").toUpperCase(),
      bobot_nilai: question.bobot_nilai ?? "1",
      durasi_pengerjaan: question.durasi_pengerjaan ?? "",
      file_soal: null,
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
    setTimeout(() => {
      questionFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleQuestionSubmit = async (event) => {
    event.preventDefault();
    if (!selectedExamId) {
      notify("Pilih ujian", "Soal harus disimpan ke salah satu ujian.");
      return;
    }

    setSavingQuestion(true);
    try {
      const payload = {
        ...questionForm,
        ujian_id: selectedExamId,
        jawaban_benar: questionForm.jawaban_benar ? questionForm.jawaban_benar.toUpperCase() : "",
      };

      if (questionForm.soal_id) {
        await updateExamQuestion(questionForm.soal_id, payload);
        notify("Soal diperbarui", `Nomor ${payload.nomor_soal || "-"} berhasil disimpan.`);
      } else {
        await createExamQuestion(payload);
        notify("Soal ditambahkan", `Nomor ${payload.nomor_soal || "-"} berhasil dibuat.`);
      }
      resetForm();
      loadQuestions();
    } catch (requestError) {
      notify("Gagal menyimpan soal", requestError.message || "Periksa kembali data soal.");
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (question) => {
    const soalId = getQuestionId(question);
    if (!soalId) return;
    const confirmed = window.confirm(`Hapus soal nomor ${question.nomor_soal || "-"}?`);
    if (!confirmed) return;

    try {
      await deleteExamQuestion(soalId);
      notify("Soal dihapus", `Soal nomor ${question.nomor_soal || "-"} sudah dihapus.`);
      loadQuestions();
      if (String(questionForm.soal_id) === String(soalId)) resetForm();
    } catch (requestError) {
      notify("Gagal menghapus soal", requestError.message || "Coba ulangi beberapa saat lagi.");
    }
  };

  const resetStudentExamAnswers = async (answer) => {
    const santriKey = getAnswerStudentKey(answer);
    const examId = getAnswerExamId(answer);
    const studentName = getStudentDisplayName(answer.santri, answer.santri_id);
    const matchingAnswers = examData.jawaban.filter((item) => (
      String(getAnswerStudentKey(item)) === String(santriKey) &&
      String(getAnswerExamId(item) || examId) === String(examId)
    ));
    const answerIds = matchingAnswers.map(getAnswerId).filter(Boolean);

    if (!santriKey || !examId || !answerIds.length) {
      notify("Reset gagal", "Data santri, ujian, atau jawaban tidak lengkap.");
      return;
    }

    const confirmed = window.confirm(`Reset jawaban ${studentName} untuk ujian ini? Peserta bisa mengerjakan satu kali lagi setelah record backend terhapus.`);
    if (!confirmed) return;

    try {
      await Promise.all(answerIds.map((answerId) => deleteExamAnswer(answerId)));
      await refreshExamData(selectedExamId);
      notify("Jawaban direset", `${answerIds.length} jawaban ${studentName} dihapus. Peserta bisa ujian lagi bila jadwal masih terbuka.`);
    } catch (requestError) {
      notify("Reset gagal", requestError.message || "Endpoint hapus jawaban belum tersedia di backend.");
    }
  };

  const handleImport = async (file) => {
    if (!file || !selectedExamId) return;
    setImporting(true);
    setImportResult(null);
    try {
      const result = await importExamQuestions(selectedExamId, file);
      setImportResult(result);
      notify("Import selesai", `${result.total_imported ?? result.imported ?? result.total ?? 0} soal berhasil diproses.`);
      loadQuestions();
    } catch (requestError) {
      setImportResult(requestError.data || { message: requestError.message });
      notify("Import gagal", requestError.message || "File tidak sesuai format.");
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = "";
      setSelectedImportFile(null);
    }
  };

  const downloadTemplate = (path = "/contoh_import_soal.csv") => {
    const link = document.createElement("a");
    link.href = path;
    link.download = path.split("/").pop();
    link.click();
  };

  return (
    <section className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Manajemen Ujian</h1>
          <p>Alur admin: buat atau pilih ujian, susun soal, cek daftar soal, jadwalkan peserta, lalu pantau jawaban.</p>
        </div>
        <button className="admin-primary admin-primary--large" type="button" onClick={() => loadQuestions()}>
          Refresh Data Soal
        </button>
      </div>

      {error && <div className="admin-panel reveal-card">{error}</div>}

      <div className="exam-question-layout">
        <div className="exam-main">
          <article className="admin-panel reveal-card question-step-panel">
            <div className="admin-panel__head">
              <div>
                <span className="question-step">1</span>
                <h2>Pilih Ujian</h2>
                <p>Semua aksi di bawah berlaku untuk ujian yang dipilih di sini.</p>
              </div>
              <label className="exam-select">
                <span>Ujian</span>
                <select value={selectedExamId} onChange={(event) => setSelectedExamId(event.target.value)} disabled={loading}>
                  <option value="">Pilih ujian</option>
                  {examData.ujian.map((exam) => (
                    <option value={exam.ujian_id} key={exam.ujian_id}>{exam.nama_ujian}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="question-summary-grid">
              <span><b>{selectedExam?.nama_ujian || "Belum memilih ujian"}</b><small>Ujian aktif untuk soal dan jadwal</small></span>
              <span><b>{questions.length}</b><small>Total soal</small></span>
              <span><b>{multipleChoiceCount}</b><small>Pilihan ganda</small></span>
            </div>
          </article>

          <article className="admin-panel reveal-card">
            <div className="admin-panel__head">
              <div>
                <span className="question-step">Setup</span>
                <h2>Tambah Ujian Baru</h2>
                <p>Buat data ujian terlebih dahulu sebelum menambahkan soal.</p>
              </div>
            </div>
            <form className="question-form" onSubmit={handleExamSubmit}>
              <label>
                <span>Nama Ujian</span>
                <input value={examForm.nama_ujian} onChange={(event) => setExamFormField("nama_ujian", event.target.value)} required />
              </label>
              <label>
                <span>Tanggal</span>
                <input type="date" value={examForm.tanggal} onChange={(event) => setExamFormField("tanggal", event.target.value)} required />
              </label>
              <label>
                <span>Durasi</span>
                <input type="number" min="1" value={examForm.durasi} onChange={(event) => setExamFormField("durasi", event.target.value)} placeholder="Menit" required />
              </label>
              <label>
                <span>Status</span>
                <select value={examForm.status} onChange={(event) => setExamFormField("status", event.target.value)}>
                  <option value="aktif">Aktif</option>
                  <option value="draft">Draft</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </label>
              <div className="question-form__actions">
                <button className="admin-primary" type="submit" disabled={savingExam}>{savingExam ? "Menyimpan..." : "Tambah Ujian"}</button>
                <button className="admin-outline" type="button" onClick={() => setExamForm(emptyExamForm)}>Reset</button>
              </div>
            </form>
          </article>

          <article className="admin-panel reveal-card" ref={questionFormRef}>
            <div className="admin-panel__head">
              <div>
                <span className="question-step">2</span>
                <h2>{questionForm.soal_id ? `Edit Soal Nomor ${questionForm.nomor_soal || "-"}` : "Tambah Soal"}</h2>
                <p>{questionForm.soal_id ? "Anda sedang mengedit soal dari tabel." : "Isi form ini jika ingin menambah soal satu per satu."}</p>
              </div>
              {questionForm.soal_id && <button type="button" onClick={resetForm}>Batal Edit</button>}
            </div>
            <form className="question-form" onSubmit={handleQuestionSubmit}>
              <label>
                <span>Nomor Soal</span>
                <input type="number" min="1" value={questionForm.nomor_soal} onChange={(event) => setFormField("nomor_soal", event.target.value)} required />
              </label>
              <label className="is-full">
                <span>Pertanyaan / Judul Soal</span>
                <textarea value={questionForm.judul_soal} onChange={(event) => setFormField("judul_soal", event.target.value)} required />
              </label>
              <label>
                <span>Bobot Nilai</span>
                <input type="number" min="0" step="0.01" value={questionForm.bobot_nilai} onChange={(event) => setFormField("bobot_nilai", event.target.value)} required />
              </label>
              <label>
                <span>Durasi Pengerjaan</span>
                <input type="number" min="0" value={questionForm.durasi_pengerjaan} onChange={(event) => setFormField("durasi_pengerjaan", event.target.value)} placeholder="Detik atau menit sesuai backend" />
              </label>
              <label>
                <span>File Soal</span>
                <input
                  accept=".pdf,.doc,.docx,image/*"
                  ref={fileInputRef}
                  type="file"
                  onChange={(event) => setFormField("file_soal", event.target.files?.[0] || null)}
                />
              </label>
             
              {optionKeys.map((key) => (
                <label key={key}>
                  <span>Opsi {key.toUpperCase()}</span>
                  <input value={questionForm[`opsi_${key}`]} onChange={(event) => setFormField(`opsi_${key}`, event.target.value)} required />
                </label>
              ))}
              <label>
                <span>Jawaban Benar</span>
                <select value={questionForm.jawaban_benar} onChange={(event) => setFormField("jawaban_benar", event.target.value)}>
                  {optionKeys.map((key) => <option value={key.toUpperCase()} key={key}>{key.toUpperCase()}</option>)}
                </select>
              </label>
              <div className="question-form__actions">
                <button className="admin-primary" type="submit" disabled={savingQuestion || !selectedExamId}>{savingQuestion ? "Menyimpan..." : "Simpan Soal"}</button>
                <button className="admin-outline" type="button" onClick={resetForm}>Reset</button>
              </div>
            </form>
          </article>

          <article className="admin-panel reveal-card">
            <div className="admin-panel__head">
              <div>
                <span className="question-step">3</span>
                <h2>Import Massal Soal</h2>
                <p>Gunakan template jika ingin mengisi banyak soal sekaligus.</p>
              </div>
            </div>
            <div className="question-import-box">
              <div>
                <strong>1. Download contoh format</strong>
                <p>Pakai file ini sebagai acuan kolom import.</p>
                <div className="question-import-buttons">
                  {/* <button className="admin-outline" type="button" onClick={() => downloadTemplate("/contoh_import_soal.csv")}>CSV Import</button> */}
                  <button className="admin-outline" type="button" onClick={() => downloadTemplate("/contoh_import_soal_excel.csv")}>CSV Rapi Excel</button>
                </div>
              </div>
              <div>
                <strong>2. Pilih file CSV/XLSX</strong>
                <p>{selectedImportFile ? selectedImportFile.name : "Belum ada file dipilih."}</p>
                <button className="admin-outline" type="button" onClick={() => importInputRef.current?.click()} disabled={importing || !selectedExamId}>
                  Pilih File
                </button>
                <input
                  accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
                  className="sr-only-file"
                  ref={importInputRef}
                  type="file"
                  onChange={(event) => setSelectedImportFile(event.target.files?.[0] || null)}
                />
              </div>
              <div>
                <strong>3. Jalankan import</strong>
                <p>Pastikan ujian sudah dipilih sebelum import.</p>
                <button className="admin-primary" type="button" disabled={importing || !selectedImportFile || !selectedExamId} onClick={() => handleImport(selectedImportFile)}>
                  {importing ? "Mengimport..." : "Import Soal"}
                </button>
              </div>
            </div>
            {importResult && (
              <div className="import-result">
                <strong>{importResult.message || "Hasil import"}</strong>
                <span>Total berhasil: {importResult.total_imported ?? importResult.imported ?? importResult.total ?? 0}</span>
                {importErrors.length > 0 && (
                  <div>
                    <b>Error validasi</b>
                    {importErrors.map((item, index) => (
                      <p key={`${item.row || index}`}>Baris {item.row || item.line || index + 1}: {(item.messages || item.errors || [item.message || String(item)]).join(", ")}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </article>

          <article className="admin-panel reveal-card">
            <div className="admin-panel__head">
              <div>
                <span className="question-step">4</span>
                <h2>Daftar Soal</h2>
                <p>Soal otomatis diurutkan berdasarkan nomor soal.</p>
              </div>
              <div className="exam-table-toolbar">
                <label>
                  <span>Tampil</span>
                  <select value={questionLimit} onChange={(event) => setQuestionLimit(Number(event.target.value))}>
                    {tableSizeOptions.map((size) => <option value={size} key={size}>{size}</option>)}
                  </select>
                </label>
                <span className="admin-pill admin-pill--gray">{questionLoading ? "Memuat..." : `${questions.length} soal`}</span>
              </div>
            </div>
            <div className="question-table-wrap question-table-wrap--scroll">
              <table className="question-table">
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Pertanyaan</th>
                    <th>Jenis</th>
                    <th>Opsi A-E</th>
                    <th>Jawaban</th>
                    <th>Bobot</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {questionLoading && <tr><td colSpan="7">Mengambil soal dari backend...</td></tr>}
                  {!questionLoading && visibleQuestions.map((question) => (
                    <tr key={getQuestionId(question) || question.nomor_soal}>
                      <td><strong>{question.nomor_soal || "-"}</strong></td>
                      <td>
                        <strong>{getQuestionTitle(question)}</strong>
                        {question.file_soal && <small>File: {question.file_soal}</small>}
                      </td>
                      <td><span className="admin-pill">PG</span></td>
                      <td>
                        <div className="question-options-mini">
                          {optionKeys.map((key) => (
                            <span key={key}>{key.toUpperCase()}. {question[`opsi_${key}`] || "-"}</span>
                          ))}
                        </div>
                      </td>
                      <td>{question.jawaban_benar || "-"}</td>
                      <td>{question.bobot_nilai ?? "-"}</td>
                      <td>
                        <div className="question-table-actions">
                          <button type="button" onClick={() => editQuestion(question)}>Edit</button>
                          <button className="text-danger" type="button" onClick={() => handleDeleteQuestion(question)}>Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!questionLoading && !questions.length && (
                    <tr><td colSpan="7">{selectedExamId ? "Belum ada soal untuk ujian ini. Tambahkan manual atau import file." : "Pilih ujian terlebih dahulu."}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="admin-panel reveal-card" ref={scheduleFormRef}>
            <div className="admin-panel__head">
              <div>
                <span className="question-step">5</span>
                <h2>{editingScheduleId ? "Edit Jadwal Ujian" : "Generate Jadwal Peserta"}</h2>
                <p>{editingScheduleId ? "Ubah tanggal, waktu, ruang, atau keterangan jadwal yang sudah dibuat." : "Backend akan membuat jadwal untuk santri eligible. Checklist peserta bersifat opsional."}</p>
              </div>
            </div>
            <form className="question-form" onSubmit={handleScheduleSubmit}>
              <label>
                <span>Ujian</span>
                <select value={scheduleForm.ujian_id || selectedExamId} onChange={(event) => setScheduleFormField("ujian_id", event.target.value)} required>
                  <option value="">Pilih ujian</option>
                  {examData.ujian.map((exam) => (
                    <option value={exam.ujian_id} key={exam.ujian_id}>{exam.nama_ujian}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Tanggal</span>
                <input type="date" value={scheduleForm.tanggal} onChange={(event) => setScheduleFormField("tanggal", event.target.value)} required />
              </label>
              <label>
                <span>Waktu Mulai</span>
                <input type="time" value={scheduleForm.waktu_mulai} onChange={(event) => setScheduleFormField("waktu_mulai", event.target.value)} required />
              </label>
              <label>
                <span>Waktu Selesai</span>
                <input type="time" value={scheduleForm.waktu_selesai} onChange={(event) => setScheduleFormField("waktu_selesai", event.target.value)} required />
              </label>
              <label>
                <span>Ruang Ujian</span>
                <input value={scheduleForm.ruang_ujian} onChange={(event) => setScheduleFormField("ruang_ujian", event.target.value)} placeholder="Lab CBT" required />
              </label>
              <label className="is-full">
                <span>Keterangan</span>
                <input value={scheduleForm.keterangan} onChange={(event) => setScheduleFormField("keterangan", event.target.value)} placeholder="Ujian masuk" />
              </label>
              {editingScheduleId && (
                <div className="schedule-student-picker is-full">
                  <div className="schedule-student-picker__head">
                    <div>
                      <strong>Peserta Terjadwal</strong>
                      <small>{getSantriNameById(scheduleForm.santri_id || "-")}</small>
                    </div>
                    <button className="admin-outline" type="button" onClick={() => {
                      setEditingScheduleId("");
                      setScheduleForm(emptyScheduleForm);
                    }}>Batal Edit</button>
                  </div>
                </div>
              )}
              {!editingScheduleId && <div className="schedule-student-picker is-full">
                <div className="schedule-student-picker__head">
                  <div>
                    <strong>Peserta Ujian</strong>
                    <small>{selectedScheduleSantriIds.length ? `${selectedScheduleSantriIds.length} santri dipilih khusus` : "Kosongkan untuk generate semua santri eligible"}</small>
                  </div>
                  <button className="admin-outline" type="button" onClick={toggleAllScheduleSantri} disabled={!schedulableSantri.length}>
                    {selectedScheduleSantriIds.length === schedulableSantri.length && schedulableSantri.length ? "Kosongkan" : "Pilih Semua"}
                  </button>
                </div>
                <div className="schedule-student-list">
                  {schedulableSantri.map((student) => {
                    const santriId = String(student.santri_id);
                    return (
                      <label className="schedule-student-item" key={santriId}>
                        <input
                          checked={selectedScheduleSantriIds.includes(santriId)}
                          type="checkbox"
                          onChange={() => toggleScheduleSantri(santriId)}
                        />
                        <span>
                          <b>{getStudentDisplayName(student, santriId)}</b>
                          <small>ID Santri: {santriId}</small>
                        </span>
                      </label>
                    );
                  })}
                  {!schedulableSantri.length && (
                    <div className="schedule-student-empty">Tidak ada santri belum terjadwal dari daftar frontend. Backend tetap akan memvalidasi eligible saat generate.</div>
                  )}
                </div>
              </div>}
              <div className="question-form__actions">
                <button className="admin-primary" type="submit" disabled={savingSchedule || !(scheduleForm.ujian_id || selectedExamId)}>
                  {savingSchedule ? "Menyimpan..." : editingScheduleId ? "Simpan Perubahan" : "Generate Jadwal"}
                </button>
                <button className="admin-outline" type="button" onClick={() => {
                  setScheduleForm(emptyScheduleForm);
                  setSelectedScheduleSantriIds([]);
                  setEditingScheduleId("");
                }}>Reset</button>
              </div>
            </form>
          </article>

          <article className="admin-panel reveal-card">
            <div className="admin-panel__head">
              <div>
                <span className="question-step">6</span>
                <h2>Daftar Jadwal Ujian</h2>
                <p>Edit jadwal peserta atau salin link page khusus pelaksanaan ujian.</p>
              </div>
              <div className="exam-table-toolbar">
                <label>
                  <span>Tampil</span>
                  <select value={scheduleLimit} onChange={(event) => setScheduleLimit(Number(event.target.value))}>
                    {tableSizeOptions.map((size) => <option value={size} key={size}>{size}</option>)}
                  </select>
                </label>
                <span className="admin-pill admin-pill--gray">{sortedSchedules.length} jadwal</span>
              </div>
            </div>
            <div className="question-table-wrap question-table-wrap--scroll">
              <table className="question-table">
                <thead>
                  <tr>
                    <th>Ujian</th>
                    <th>Peserta</th>
                    <th>Tanggal</th>
                    <th>Waktu</th>
                    <th>Ruang</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleSchedules.map((schedule) => (
                    <tr key={getScheduleId(schedule) || `${getScheduleExamId(schedule)}-${getScheduleStudentId(schedule)}`}>
                      <td>
                        <strong>{schedule.ujian?.nama_ujian || `Ujian #${getScheduleExamId(schedule) || "-"}`}</strong>
                        <small>{schedule.ujian?.status || "status tidak dikirim"}</small>
                      </td>
                      <td>
                        <strong>{getScheduleStudentName(schedule)}</strong>
                        <small>ID Santri: {getScheduleStudentId(schedule) || "-"}</small>
                      </td>
                      <td>{formatScheduleDate(schedule.tanggal)}</td>
                      <td>{String(schedule.waktu_mulai || "--:--").slice(0, 5)} - {String(schedule.waktu_selesai || "--:--").slice(0, 5)}</td>
                      <td>{schedule.ruang_ujian || "-"}</td>
                      <td>
                        <div className="question-table-actions">
                          <button type="button" onClick={() => editSchedule(schedule)}>Edit</button>
                          <button type="button" onClick={() => copyExamPageLink(schedule)}>Link Page</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!sortedSchedules.length && (
                    <tr><td colSpan="6">Belum ada jadwal ujian. Gunakan form generate jadwal di atas.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="admin-panel reveal-card">
            <div className="admin-panel__head">
              <div>
                <span className="question-step">7</span>
                <h2>Ringkasan Jawaban Santri</h2>
                <p>Pantau jawaban masuk dan status penilaian dari peserta.</p>
              </div>
              <div className="exam-table-toolbar">
                <label>
                  <span>Tampil</span>
                  <select value={answerLimit} onChange={(event) => setAnswerLimit(Number(event.target.value))}>
                    {tableSizeOptions.map((size) => <option value={size} key={size}>{size}</option>)}
                  </select>
                </label>
                <button type="button" onClick={() => notify("Records dibuka", "Semua catatan nilai nanti dari backend.")}>Lihat Semua</button>
              </div>
            </div>
            <div className="grading-cards"><span>Pending Review <b>{pendingAnswers.length} Submissions</b></span><span>Finalized <b>{gradedAnswers.length} Students</b></span></div>
            <div className="question-table-wrap question-table-wrap--scroll">
              <table>
                <thead><tr><th>Student Name</th><th>Exam Type</th><th>Score</th><th>Action</th></tr></thead>
                <tbody>
                  {examData.jawaban.length ? visibleAnswers.map((answer) => (
                    <tr key={answer.jawaban_id}>
                      <td><strong>{getStudentDisplayName(answer.santri, answer.santri_id)}</strong></td>
                      <td>{answer.soal?.judul_soal || answer.soal?.pertanyaan || `Soal #${answer.soal_id}`}</td>
                      <td><span className="score-pill">{answer.nilai_jawaban ?? "Review"}</span></td>
                      <td>
                        <div className="question-table-actions">
                          <button type="button" onClick={() => notify("Review nilai", `Jawaban #${getAnswerId(answer)} dibuka.`)}>Review</button>
                          <button className="text-danger" type="button" onClick={() => resetStudentExamAnswers(answer)}>Reset Ujian</button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="4">Belum ada jawaban ujian di database.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="admin-panel reveal-card">
            <div className="admin-panel__head">
              <div>
                <span className="question-step">Lulus</span>
                <h2>Daftar Santri Lulus</h2>
                <p>Menampilkan semua santri yang status backend-nya lulus atau semua nilai ujiannya minimal 70.</p>
              </div>
              <span className="admin-pill">{passedStudents.length} santri</span>
            </div>
            <div className="question-table-wrap question-table-wrap--scroll">
              <table>
                <thead><tr><th>Nama Santri</th><th>Sumber Kelulusan</th><th>Rata-rata / Nilai</th><th>Jumlah Ujian</th></tr></thead>
                <tbody>
                  {passedStudents.length ? passedStudents.map((student) => (
                    <tr key={student.id}>
                      <td><strong>{student.name}</strong><small>ID Santri: {student.id}</small></td>
                      <td>{student.source}</td>
                      <td><span className="score-pill">{student.score}</span></td>
                      <td>{student.examCount}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="4">Belum ada santri yang terdeteksi lulus dari status backend atau nilai ujian.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </div>
        <aside className="exam-side exam-side--compact">
          <article className="admin-panel reveal-card">
            <div className="admin-panel__head"><h2>Upcoming Exams</h2><span className="admin-pill admin-pill--pink">{activeSchedules.length} Active</span></div>
            {loading && <p>Mengambil jadwal ujian dari database...</p>}
            {!loading && activeSchedules.length ? activeSchedules.map((schedule) => (
              <article className="exam-schedule" key={schedule.jadwal_id || schedule.id}>
                <span><strong>{new Date(schedule.tanggal).getDate() || "-"}</strong>{new Date(schedule.tanggal).toLocaleString("id-ID", { month: "short" })}</span>
                <div><h3>{schedule.ujian?.nama_ujian || "Ujian"}</h3><small>{schedule.waktu_mulai} - {schedule.waktu_selesai} - {schedule.ruang_ujian || "Ruang belum diisi"}</small></div>
                <div className="exam-schedule__actions">
                  <b>{getScheduleStudentId(schedule) ? "1" : "0"}<small>Participant</small></b>
                  <button type="button" onClick={() => openModal(schedule.ujian?.nama_ujian || "Jadwal Ujian", `Santri: ${getScheduleStudentName(schedule)}, ruang ${schedule.ruang_ujian || "-"}, pukul ${schedule.waktu_mulai} - ${schedule.waktu_selesai}.`)}>Detail</button>
                  <button type="button" onClick={() => editSchedule(schedule)}>Edit</button>
                </div>
              </article>
            )) : !loading && <p>Belum ada jadwal ujian aktif di database.</p>}
          </article>
          <div className="admin-image-card reveal-card"><DocumentMock compact /><p>Academic Year 2024/2025</p><h2>Registration Statistics Overview</h2></div>
          <div className="admin-panel reveal-card"><p>Passing Rate</p><strong className="big-rate">{passingRate}%</strong><small>{examData.jawaban.length} jawaban dari database</small><div className="rate-bar"><span style={{ width: `${passingRate}%` }} /></div></div>
          <BackendNotice compact />
        </aside>
      </div>
    </section>
  );
}
