import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAdminExamData } from "../../../service/adminService";
import {
  createExam,
  deleteExamQuestion,
  generateExamSchedules,
  getAdminExamQuestions,
  importExamQuestions,
  updateExamSchedule,
} from "../../../service/examService";

const optionKeys = ["a", "b", "c", "d", "e"];
const tableSizeOptions = [10, 15, 20, 30, 50];
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
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [questions, setQuestions] = useState([]);
  const [examForm, setExamForm] = useState(emptyExamForm);
  const [scheduleForm, setScheduleForm] = useState(emptyScheduleForm);
  const [selectedScheduleSantriIds, setSelectedScheduleSantriIds] = useState([]);
  const [editingScheduleId, setEditingScheduleId] = useState("");
  const [importResult, setImportResult] = useState(null);
  const [selectedImportFile, setSelectedImportFile] = useState(null);
  const [questionLimit, setQuestionLimit] = useState(10);
  const [scheduleLimit, setScheduleLimit] = useState(10);
  const [scheduleStudentSearch, setScheduleStudentSearch] = useState("");
  const [scheduleSearch, setScheduleSearch] = useState("");
  const [savingExam, setSavingExam] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const importInputRef = useRef(null);
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
      notify("Gagal mengambil soal", requestError.message || "Soal belum dapat dimuat.");
    } finally {
      setQuestionLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions(selectedExamId);
    setImportResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExamId]);

  const sortedSchedules = useMemo(
    () => [...examData.jadwal].sort(sortSchedules),
    [examData.jadwal],
  );

  const selectedExam = examData.ujian.find((exam) => String(exam.ujian_id) === String(selectedExamId));
  const importErrors = normalizeImportErrors(importResult);
  const multipleChoiceCount = questions.length;
  const visibleQuestions = questions.slice(0, questionLimit);
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
  const filteredSchedulableSantri = useMemo(() => {
    const keyword = scheduleStudentSearch.trim().toLowerCase();
    if (!keyword) return schedulableSantri;
    return schedulableSantri.filter((student) => {
      const santriId = String(student.santri_id || "");
      const name = getStudentDisplayName(student, santriId).toLowerCase();
      return name.includes(keyword) || santriId.includes(keyword);
    });
  }, [scheduleStudentSearch, schedulableSantri]);
  const getSantriNameById = (santriId) => {
    const student = examData.santri.find((item) => String(item.santri_id) === String(santriId));
    return getStudentDisplayName(student, santriId);
  };
  const getScheduleStudentName = useCallback((schedule) => {
    const santriId = getScheduleStudentId(schedule);
    const student = schedule.santri || examData.santri.find((item) => String(item.santri_id) === String(santriId));
    return getStudentDisplayName(student, santriId);
  }, [examData.santri]);
  const filteredSchedules = useMemo(() => {
    const keyword = scheduleSearch.trim().toLowerCase();
    if (!keyword) return sortedSchedules;

    return sortedSchedules.filter((schedule) => {
      const santriId = String(getScheduleStudentId(schedule) || "");
      const examId = String(getScheduleExamId(schedule) || "");
      const values = [
        getScheduleStudentName(schedule),
        santriId,
        schedule.ujian?.nama_ujian,
        examId,
        schedule.ujian?.status,
        schedule.tanggal,
        formatScheduleDate(schedule.tanggal),
        schedule.waktu_mulai,
        schedule.waktu_selesai,
        schedule.ruang_ujian,
        schedule.keterangan,
      ];

      return values.some((value) => String(value || "").toLowerCase().includes(keyword));
    });
  }, [getScheduleStudentName, scheduleSearch, sortedSchedules]);
  const visibleSchedules = filteredSchedules.slice(0, scheduleLimit);

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
      const visibleIds = filteredSchedulableSantri.map((student) => String(student.santri_id));
      const allVisibleSelected = visibleIds.length && visibleIds.every((id) => current.includes(id));
      return allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : [...new Set([...current, ...visibleIds])];
    });
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
      setScheduleStudentSearch("");
      notify("Pembuatan jadwal selesai", `${result.created ?? 0} dibuat, ${result.skipped ?? 0} dilewati.`);
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
      notify("Tautan belum tersedia", "Jadwal ini belum memiliki ujian_id.");
      return;
    }

    const url = `${window.location.origin}/santri/ujian/${examId}`;
    try {
      await navigator.clipboard.writeText(url);
      notify("Tautan halaman ujian disalin", url);
    } catch {
      openModal("Halaman Pelaksanaan Ujian", url);
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
    } catch (requestError) {
      notify("Gagal menghapus soal", requestError.message || "Coba ulangi beberapa saat lagi.");
    }
  };

  const handleImport = async (file) => {
    if (!file || !selectedExamId) return;
    setImporting(true);
    setImportResult(null);
    try {
      const result = await importExamQuestions(selectedExamId, file);
      setImportResult(result);
      notify("Impor selesai", `${result.total_imported ?? result.imported ?? result.total ?? 0} soal berhasil diproses.`);
      loadQuestions();
    } catch (requestError) {
      setImportResult(requestError.data || { message: requestError.message });
      notify("Impor gagal", requestError.message || "Berkas tidak sesuai format.");
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
          Segarkan Data Soal
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
                  <option value="draft">Draf</option>
                  <option value="nonaktif">Nonaktif</option>
                </select>
              </label>
              <div className="question-form__actions">
                <button className="admin-primary" type="submit" disabled={savingExam}>{savingExam ? "Menyimpan..." : "Tambah Ujian"}</button>
                <button className="admin-outline" type="button" onClick={() => setExamForm(emptyExamForm)}>Reset</button>
              </div>
            </form>
          </article>

          <article className="admin-panel reveal-card">
            <div className="admin-panel__head">
              <div>
                <span className="question-step">2</span>
                <h2>Impor Massal Soal</h2>
                <p>Gunakan contoh format jika ingin mengisi banyak soal sekaligus.</p>
              </div>
            </div>
            <div className="question-import-box">
              <div>
                <strong>1. Unduh contoh format</strong>
                <p>Pakai berkas ini sebagai acuan kolom impor.</p>
                <div className="question-import-buttons">
                  {/* <button className="admin-outline" type="button" onClick={() => downloadTemplate("/contoh_import_soal.csv")}>CSV Impor</button> */}
                  <button className="admin-outline" type="button" onClick={() => downloadTemplate("/contoh_import_soal_excel.csv")}>CSV Rapi Excel</button>
                </div>
              </div>
              <div>
                <strong>2. Pilih berkas CSV/XLSX</strong>
                <p>{selectedImportFile ? selectedImportFile.name : "Belum ada berkas dipilih."}</p>
                <button className="admin-outline" type="button" onClick={() => importInputRef.current?.click()} disabled={importing || !selectedExamId}>
                  Pilih Berkas
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
                <strong>3. Jalankan impor</strong>
                <p>Pastikan ujian sudah dipilih sebelum impor.</p>
                <button className="admin-primary" type="button" disabled={importing || !selectedImportFile || !selectedExamId} onClick={() => handleImport(selectedImportFile)}>
                  {importing ? "Mengimpor..." : "Impor Soal"}
                </button>
              </div>
            </div>
            {importResult && (
              <div className="import-result">
                <strong>{importResult.message || "Hasil impor"}</strong>
                <span>Total berhasil: {importResult.total_imported ?? importResult.imported ?? importResult.total ?? 0}</span>
                {importErrors.length > 0 && (
                  <div>
                    <b>Kesalahan validasi</b>
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
                <span className="question-step">3</span>
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
                  {questionLoading && <tr><td colSpan="7">Mengambil soal...</td></tr>}
                  {!questionLoading && visibleQuestions.map((question) => (
                    <tr key={getQuestionId(question) || question.nomor_soal}>
                      <td><strong>{question.nomor_soal || "-"}</strong></td>
                      <td>
                        <strong>{getQuestionTitle(question)}</strong>
                        {question.file_soal && <small>Berkas: {question.file_soal}</small>}
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
                          <button className="text-danger" type="button" onClick={() => handleDeleteQuestion(question)}>Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!questionLoading && !questions.length && (
                    <tr><td colSpan="7">{selectedExamId ? "Belum ada soal untuk ujian ini. Tambahkan manual atau impor berkas." : "Pilih ujian terlebih dahulu."}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="admin-panel reveal-card" ref={scheduleFormRef}>
            <div className="admin-panel__head">
              <div>
                <span className="question-step">4</span>
                <h2>{editingScheduleId ? "Edit Jadwal Ujian" : "Buat Jadwal Peserta"}</h2>
                <p>{editingScheduleId ? "Ubah tanggal, waktu, ruang, atau keterangan jadwal yang sudah dibuat." : "Sistem akan membuat jadwal untuk santri yang memenuhi syarat. Centang peserta bersifat opsional."}</p>
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
                    <small>{selectedScheduleSantriIds.length ? `${selectedScheduleSantriIds.length} santri dipilih khusus` : "Kosongkan untuk membuat jadwal semua santri yang memenuhi syarat"}</small>
                  </div>
                  <button className="admin-outline" type="button" onClick={toggleAllScheduleSantri} disabled={!schedulableSantri.length}>
                    {filteredSchedulableSantri.length && filteredSchedulableSantri.every((student) => selectedScheduleSantriIds.includes(String(student.santri_id))) ? "Kosongkan Tampilan" : "Pilih Semua Tampilan"}
                  </button>
                </div>
                <label className="schedule-student-search">
                  <span>Cari Peserta</span>
                  <input
                    type="search"
                    value={scheduleStudentSearch}
                    onChange={(event) => setScheduleStudentSearch(event.target.value)}
                    placeholder="Cari nama atau ID santri..."
                  />
                </label>
                <div className="schedule-student-list">
                  {filteredSchedulableSantri.map((student) => {
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
                  {!filteredSchedulableSantri.length && (
                    <div className="schedule-student-empty">{schedulableSantri.length ? "Tidak ada peserta yang cocok dengan pencarian." : "Tidak ada santri belum terjadwal dari daftar tampilan. Sistem tetap akan memvalidasi peserta yang memenuhi syarat saat jadwal dibuat."}</div>
                  )}
                </div>
              </div>}
              <div className="question-form__actions">
                <button className="admin-primary" type="submit" disabled={savingSchedule || !(scheduleForm.ujian_id || selectedExamId)}>
                  {savingSchedule ? "Menyimpan..." : editingScheduleId ? "Simpan Perubahan" : "Buat Jadwal"}
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
                <span className="question-step">5</span>
                <h2>Daftar Jadwal Ujian</h2>
                <p>Edit jadwal peserta atau salin tautan halaman khusus pelaksanaan ujian.</p>
              </div>
              <div className="exam-table-toolbar">
                <label>
                  <span>Cari Peserta</span>
                  <input
                    type="search"
                    value={scheduleSearch}
                    onChange={(event) => setScheduleSearch(event.target.value)}
                    placeholder="Nama, ID, ujian, ruang..."
                  />
                </label>
                <label>
                  <span>Tampil</span>
                  <select value={scheduleLimit} onChange={(event) => setScheduleLimit(Number(event.target.value))}>
                    {tableSizeOptions.map((size) => <option value={size} key={size}>{size}</option>)}
                  </select>
                </label>
                <span className="admin-pill admin-pill--gray">{filteredSchedules.length} jadwal</span>
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
                        <small>{schedule.ujian?.status || "status belum tersedia"}</small>
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
                          <button type="button" onClick={() => copyExamPageLink(schedule)}>Tautan Halaman</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filteredSchedules.length && (
                    <tr><td colSpan="6">{sortedSchedules.length ? "Tidak ada jadwal yang cocok dengan pencarian." : "Belum ada jadwal ujian. Gunakan form buat jadwal di atas."}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
