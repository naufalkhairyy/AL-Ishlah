import { apiRequest, getAuthUser } from "./api";
import { fileToDataUrl } from "./paymentService";

const EXAM_QUESTION_FILES_KEY = "exam_question_files";
const QUESTION_OPTIONS = ["a", "b", "c", "d", "e"];

const fallbackArray = (value) => Array.isArray(value) ? value : [];
const unwrapList = (response) => fallbackArray(response.data?.data ?? response.data?.soal ?? response.data ?? response);

export const getExams = () => apiRequest("/ujian", { authScope: "student" }).then((response) => unwrapList(response));

export const createExam = (exam) => (
  apiRequest("/ujian", {
    method: "POST",
    authScope: "admin",
    body: JSON.stringify({
      nama_ujian: exam.nama_ujian,
      tanggal: exam.tanggal,
      durasi: exam.durasi,
      status: exam.status,
    }),
  }).then((response) => response.data?.data ?? response.data ?? response)
);

export const generateExamSchedules = (schedule) => (
  apiRequest("/jadwal-ujian/generate", {
    method: "POST",
    authScope: "admin",
    body: JSON.stringify({
      ujian_id: schedule.ujian_id,
      ...(schedule.santri_ids?.length ? { santri_ids: schedule.santri_ids } : {}),
      tanggal: schedule.tanggal,
      waktu_mulai: schedule.waktu_mulai,
      waktu_selesai: schedule.waktu_selesai,
      ruang_ujian: schedule.ruang_ujian,
      keterangan: schedule.keterangan,
    }),
  }).then((response) => response.data?.data ?? response.data ?? response)
);

export const updateExamSchedule = (scheduleId, schedule) => (
  apiRequest(`/jadwal-ujian/${scheduleId}`, {
    method: "PUT",
    authScope: "admin",
    body: JSON.stringify({
      ujian_id: schedule.ujian_id,
      santri_id: schedule.santri_id,
      tanggal: schedule.tanggal,
      waktu_mulai: schedule.waktu_mulai,
      waktu_selesai: schedule.waktu_selesai,
      ruang_ujian: schedule.ruang_ujian,
      keterangan: schedule.keterangan,
    }),
  }).then((response) => response.data?.data ?? response.data ?? response)
);

export const getExamQuestions = (ujianId) => (
  apiRequest(`/ujian/${ujianId}/soal`, { authScope: "student" }).then((response) => unwrapList(response))
);

export const getExamTimer = (ujianId) => (
  apiRequest(`/ujian/${ujianId}/timer`, { authScope: "student" }).then((response) => response.data?.data ?? response.data ?? response)
);

export const getAdminExamQuestions = (ujianId) => (
  apiRequest(`/ujian/${ujianId}/soal`, { authScope: "admin" }).then((response) => unwrapList(response))
);

function appendIfPresent(formData, key, value) {
  if (value !== undefined && value !== null && value !== "") formData.append(key, value);
}

export function buildQuestionFormData(question) {
  const formData = new FormData();
  appendIfPresent(formData, "ujian_id", question.ujian_id);
  appendIfPresent(formData, "nomor_soal", question.nomor_soal);
  appendIfPresent(formData, "judul_soal", question.judul_soal || question.pertanyaan);
  appendIfPresent(formData, "pertanyaan", question.pertanyaan || question.judul_soal);
  appendIfPresent(formData, "bobot_nilai", question.bobot_nilai);
  appendIfPresent(formData, "durasi_pengerjaan", question.durasi_pengerjaan);

  QUESTION_OPTIONS.forEach((option) => {
    appendIfPresent(formData, `opsi_${option}`, question[`opsi_${option}`]);
  });

  appendIfPresent(formData, "jawaban_benar", question.jawaban_benar);

  if (question.file_soal instanceof File) formData.append("file_soal", question.file_soal);
  return formData;
}

export function buildQuestionPayload(question) {
  const payload = {
    ujian_id: question.ujian_id,
    nomor_soal: question.nomor_soal,
    judul_soal: question.judul_soal || question.pertanyaan,
    pertanyaan: question.pertanyaan || question.judul_soal,
    bobot_nilai: question.bobot_nilai,
    durasi_pengerjaan: question.durasi_pengerjaan,
    jawaban_benar: question.jawaban_benar || "",
  };

  QUESTION_OPTIONS.forEach((option) => {
    payload[`opsi_${option}`] = question[`opsi_${option}`] || "";
  });

  return payload;
}

export const createExamQuestion = (question) => (
  apiRequest("/soal", {
    method: "POST",
    authScope: "admin",
    body: buildQuestionFormData(question),
  })
);

export const updateExamQuestion = (soalId, question) => (
  question.file_soal instanceof File
    ? apiRequest(`/soal/${soalId}`, {
        method: "POST",
        authScope: "admin",
        body: (() => {
          const formData = buildQuestionFormData(question);
          formData.append("_method", "PUT");
          return formData;
        })(),
      })
    : apiRequest(`/soal/${soalId}`, {
        method: "PUT",
        authScope: "admin",
        body: JSON.stringify(buildQuestionPayload(question)),
      })
);

export const deleteExamQuestion = (soalId) => (
  apiRequest(`/soal/${soalId}`, {
    method: "DELETE",
    authScope: "admin",
  })
);

export const importExamQuestions = (ujianId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return apiRequest(`/ujian/${ujianId}/soal/import`, {
    method: "POST",
    authScope: "admin",
    body: formData,
  });
};

export const submitExamAnswer = ({ soalId, jawabanText }) => (
  apiRequest("/jawaban", {
    method: "POST",
    authScope: "student",
    body: JSON.stringify({
      soal_id: soalId,
      jawaban_text: jawabanText,
    }),
  })
);

export function buildExamAnswersBulkPayload({ ujianId, answers, santriId }) {
  const uniqueAnswers = new Map();

  answers.forEach((answer) => {
    const soalId = Number(answer.soalId);
    if (!soalId || uniqueAnswers.has(soalId)) return;
    uniqueAnswers.set(soalId, {
      soal_id: soalId,
      jawaban_text: answer.jawabanText ?? "",
    });
  });

  return {
    ujian_id: Number(ujianId),
    santri_id: Number(santriId),
    waktu_submit: new Date().toISOString().slice(0, 19).replace("T", " "),
    jawaban: Array.from(uniqueAnswers.values()),
  };
}

export const submitExamAnswersBulk = async ({ ujianId, answers }) => {
  const santriId = await getCurrentSantriId();
  const payload = buildExamAnswersBulkPayload({ ujianId, answers, santriId });

  return apiRequest("/jawaban/bulk", {
    method: "POST",
    authScope: "student",
    body: JSON.stringify(payload),
  });
};

export const deleteExamAnswer = (answerId) => (
  apiRequest(`/jawaban/${answerId}`, {
    method: "DELETE",
    authScope: "admin",
  })
);

export function getCurrentSessionSantriId() {
  const user = getAuthUser("student");
  return user?.santri_id || user?.santri?.santri_id || "";
}

function findFirstValueByKeys(value, keys) {
  if (!value || typeof value !== "object") return "";
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findFirstValueByKeys(item, keys);
      if (found) return found;
    }
    return "";
  }

  for (const key of keys) {
    if (value[key] !== undefined && value[key] !== null && value[key] !== "") return value[key];
  }

  for (const child of Object.values(value)) {
    const found = findFirstValueByKeys(child, keys);
    if (found) return found;
  }

  return "";
}

function getResponseRecord(response) {
  return response?.data?.data || response?.data || response?.santri || response?.calon_santri || response;
}

function extractSantriIdFromRecord(record) {
  return record?.santri_id ||
    record?.santri?.santri_id ||
    findFirstValueByKeys(record, ["santri_id", "santriId"]) ||
    "";
}

function extractCurrentSantriId(response) {
  const record = getResponseRecord(response);
  return extractSantriIdFromRecord(record) || findFirstValueByKeys(response, ["santri_id", "santriId"]) || "";
}

export async function getCurrentSantriId() {
  const sessionSantriId = getCurrentSessionSantriId();
  if (sessionSantriId) return sessionSantriId;

  const endpoints = ["/auth-user", "/santri/saya", "/calon-santri"];

  for (const endpoint of endpoints) {
    try {
      const response = await apiRequest(endpoint, { authScope: "student" });
      const santriId = extractCurrentSantriId(response);
      if (santriId) return santriId;
    } catch (error) {
      if (![401, 403, 404].includes(error.status)) throw error;
    }
  }

  throw new Error("Akun ini belum punya santri_id. Backend harus membuat record santri dulu sebelum calon santri bisa submit ujian.");
}

export const getSchedules = () => (
  apiRequest("/jadwal-ujian", { authScope: "student" }).then((response) => unwrapList(response))
);

function readQuestionFiles() {
  try {
    const value = localStorage.getItem(EXAM_QUESTION_FILES_KEY);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function writeQuestionFiles(files) {
  localStorage.setItem(EXAM_QUESTION_FILES_KEY, JSON.stringify(files));
  window.dispatchEvent(new Event("exam-question-files-updated"));
}

export function getUploadedExamQuestionFiles() {
  return readQuestionFiles();
}

export async function saveExamQuestionFile({ ujianId, examTitle, file }) {
  if (!file) throw new Error("File soal wajib dipilih.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Ukuran file soal maksimal 10MB.");

  const allowedTypes = [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/pdf",
  ];
  const allowedExtensions = [".doc", ".docx", ".pdf"];
  const lowerName = file.name.toLowerCase();
  const isAllowed = allowedTypes.includes(file.type) || allowedExtensions.some((extension) => lowerName.endsWith(extension));

  if (!isAllowed) {
    throw new Error("File soal harus berupa Microsoft Word (.doc/.docx) atau PDF.");
  }

  const fileDataUrl = await fileToDataUrl(file);
  const files = readQuestionFiles();
  const now = new Date().toISOString();
  const questionFile = {
    id: `SOAL-${Date.now()}`,
    ujianId: ujianId || "",
    examTitle: examTitle || "Soal Ujian",
    fileName: file.name,
    fileType: file.type || "File Microsoft Word",
    fileSize: file.size,
    fileDataUrl,
    uploadedAt: now,
  };

  writeQuestionFiles([questionFile, ...files]);
  return questionFile;
}
