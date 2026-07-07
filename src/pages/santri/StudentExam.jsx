import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStudentPortal } from "../../components/useStudentPortal";
import { getExams, getSchedules } from "../../service/examService";

function getExamId(exam) {
  return exam?.ujian_id || exam?.id || exam?.ujian?.ujian_id || "";
}

function getScheduleId(schedule) {
  return schedule?.jadwal_id || schedule?.id || `${getExamId(schedule)}-${schedule?.tanggal || ""}`;
}

function getScheduleExam(schedule, exams) {
  if (schedule?.ujian) return schedule.ujian;
  const examId = schedule?.ujian_id || getExamId(schedule);
  return exams.find((exam) => String(getExamId(exam)) === String(examId)) || null;
}

function parseScheduleDateTime(date, time) {
  if (!date || !time) return null;
  const cleanTime = String(time).slice(0, 5);
  const parsed = new Date(`${date}T${cleanTime}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getScheduleWindow(schedule) {
  const start = parseScheduleDateTime(schedule?.tanggal, schedule?.waktu_mulai);
  const end = parseScheduleDateTime(schedule?.tanggal, schedule?.waktu_selesai);
  const now = new Date();

  if (!start || !end) return { status: "unscheduled", label: "Jadwal belum lengkap", canEnter: false };
  if (now < start) return { status: "upcoming", label: "Belum dimulai", canEnter: false };
  if (now > end) return { status: "finished", label: "Selesai", canEnter: false };
  return { status: "running", label: "Sedang berlangsung", canEnter: true };
}

function formatSchedule(schedule) {
  const date = schedule?.tanggal
    ? new Date(schedule.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
    : "Tanggal belum ditentukan";
  return `${date}, ${String(schedule?.waktu_mulai || "--:--").slice(0, 5)} - ${String(schedule?.waktu_selesai || "--:--").slice(0, 5)}`;
}

function isAccessDeniedError(error) {
  const message = `${error?.message || ""} ${JSON.stringify(error?.data || {})}`.toLowerCase();
  return error?.status === 401 || error?.status === 403 || message.includes("akses ditolak") || message.includes("forbidden");
}

export default function StudentExam() {
  const navigate = useNavigate();
  const { progress, profile, refreshProgress } = useStudentPortal();
  const [backendExams, setBackendExams] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [examError, setExamError] = useState("");
  const [scheduleNotice, setScheduleNotice] = useState("");
  const [completedExamIds] = useState([]);

  useEffect(() => {
    let active = true;

    async function loadExamPage() {
      setLoadingExams(true);
      setExamError("");
      setScheduleNotice("");

      try {
        await refreshProgress?.();
        if (!active) return;

        const examData = await getExams();
        if (!active) return;
        setBackendExams(examData);

        try {
          const scheduleData = await getSchedules();
          if (!active) return;
          setSchedules(scheduleData);
        } catch (scheduleError) {
          if (!active) return;
          setSchedules([]);
          setScheduleNotice(isAccessDeniedError(scheduleError)
            ? "Jadwal rinci belum dapat ditampilkan untuk akun ini. Akses tetap mengikuti jadwal yang tersedia."
            : scheduleError.message || "Jadwal rinci belum dapat dimuat.");
        }
      } catch (error) {
        if (active) setExamError(error.message || "Gagal mengambil data ujian.");
      } finally {
        if (active) setLoadingExams(false);
      }
    }

    loadExamPage();

    return () => {
      active = false;
    };
  }, [refreshProgress]);

  const activeExams = useMemo(
    () => backendExams.filter((exam) => String(exam.status || "").toLowerCase() === "aktif"),
    [backendExams],
  );
  const scheduledExamRows = useMemo(
    () => schedules
      .map((schedule) => {
        const exam = getScheduleExam(schedule, backendExams);
        return {
          schedule,
          exam,
          window: getScheduleWindow(schedule),
        };
      })
      .filter((item) => item.exam || item.schedule?.ujian_id)
      .sort((a, b) => {
        const first = parseScheduleDateTime(a.schedule.tanggal, a.schedule.waktu_mulai)?.getTime() || 0;
        const second = parseScheduleDateTime(b.schedule.tanggal, b.schedule.waktu_mulai)?.getTime() || 0;
        return first - second;
      }),
    [backendExams, schedules],
  );
  const displayExamRows = scheduledExamRows.length
    ? scheduledExamRows
    : activeExams.map((exam) => ({
        schedule: null,
        exam,
        window: { status: "unscheduled", label: "Cek jadwal", canEnter: true },
      }));

  const santriId = profile.santri_id || "";

  const startExam = (exam, scheduleWindow) => {
    if (!progress.examAvailable) {
      alert(santriId
        ? "Ujian belum tersedia. Lengkapi profil, dokumen wajib, dan bukti pembayaran terlebih dahulu."
        : "Belum menjadi peserta ujian.");
      navigate("/santri/dashboard");
      return;
    }

    if (scheduleWindow && scheduleWindow.status !== "unscheduled" && !scheduleWindow.canEnter) {
      alert(`Ruang ujian belum bisa dibuka: ${scheduleWindow.label}.`);
      return;
    }

    const examId = getExamId(exam);
    if (!examId) {
      alert("Ujian belum valid.");
      return;
    }

    navigate(`/santri/ujian/${examId}`, { state: { exam } });
  };

  return (
    <section className="student-page">
      <div className="student-page-title">
        <h1>Ujian Calon Santri</h1>
        <p>Pilih ujian yang tersedia, kerjakan soal pilihan ganda, lalu kirim jawaban.</p>
      </div>

      <article className="student-card exam-status-panel">
        <div>
          <span className={`student-badge${progress.examAvailable ? " student-badge--pink" : ""}`}>
            {santriId ? (progress.examAvailable ? "Siap Ujian" : "Belum Terbuka") : "Belum menjadi peserta ujian"}
          </span>
          <h2>{progress.examAvailable ? "Ujian sudah dapat dikerjakan" : santriId ? "Lengkapi persyaratan terlebih dahulu" : "Belum menjadi peserta ujian"}</h2>
          <p>
            {progress.examAvailable
              ? "Pilih ujian aktif dari daftar di bawah. Sistem akan mengecek jadwal sebelum ruang ujian dibuka."
              : santriId
                ? "Profil, dokumen wajib, dan pembayaran harus selesai sebelum ujian dibuka."
                : "Admin harus menyetujui dokumen sampai data peserta ujian aktif."}
          </p>
        </div>
        <div className="exam-status-panel__stats">
          <span><b>{backendExams.length}</b><small>Total ujian</small></span>
          <span><b>{activeExams.length}</b><small>Ujian aktif</small></span>
          <span><b>{scheduledExamRows.length || activeExams.length}</b><small>{scheduledExamRows.length ? "Terjadwal" : "Ujian aktif"}</small></span>
        </div>
      </article>

      <article className="student-card">
        <div className="student-card__heading">
          <div>
            <h2>Ruang Ujian Terjadwal</h2>
            <p>Page pengerjaan khusus akan terbuka saat jadwal ujian sedang berlangsung.</p>
          </div>
          {loadingExams && <span className="student-badge">Memuat</span>}
        </div>

        {examError && <div className="exam-empty-state">{examError}</div>}
        {scheduleNotice && !examError && <div className="exam-empty-state">{scheduleNotice}</div>}
        {!loadingExams && !examError && !displayExamRows.length && (
          <div className="exam-empty-state">Belum ada ujian aktif untuk akun ini.</div>
        )}

        <div className="student-exam-list">
          {displayExamRows.map(({ schedule, exam, window }) => {
            const examId = getExamId(exam) || schedule?.ujian_id;
            const isActive = String(exam?.status || "").toLowerCase() === "aktif";
            const isCompleted = completedExamIds.includes(String(examId));
            const canEnter = isActive && progress.examAvailable && window.canEnter && !isCompleted;
            const rowKey = schedule ? getScheduleId(schedule) : `exam-${examId}`;
            return (
              <article className="student-exam-row" key={rowKey}>
                <div>
                  <span className={`student-badge${window.status === "running" && !isCompleted ? " student-badge--pink" : ""}`}>
                    {isCompleted ? "Selesai" : window.label}
                  </span>
                  <h3>{exam?.nama_ujian || "Ujian"}</h3>
                  <p>{schedule ? `${formatSchedule(schedule)} - ${schedule.ruang_ujian || "Ruang belum diisi"}` : "Jadwal akan dicek otomatis saat masuk ruang ujian."}</p>
                </div>
                <div className="student-exam-row__meta">
                  <span><b>{exam?.durasi || "-"}</b><small>Menit</small></span>
                  <span><b>{isActive ? "Aktif" : "Tutup"}</b><small>Status ujian</small></span>
                </div>
                <button type="button" disabled={!canEnter} onClick={() => startExam(exam || schedule?.ujian, window)}>
                  {isCompleted ? "Sudah Selesai" : canEnter ? "Mulai Ujian" : window.label}
                </button>
              </article>
            );
          })}
        </div>
      </article>

      <div className="exam-info-grid">
        <article className="rules-panel">
          <h2>Ketentuan Ujian</h2>
          <p>Pastikan koneksi internet stabil selama mengerjakan ujian.</p>
          <p>Jawaban pilihan ganda dinilai otomatis berdasarkan kunci jawaban.</p>
          <p>Periksa kembali semua jawaban sebelum menekan Submit Jawaban.</p>
        </article>
        <article className="quote-panel">
          <strong>Kerjakan ujian dengan jujur, teliti, dan sesuai kemampuan terbaik.</strong>
        </article>
      </div>
    </section>
  );
}
