import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StudentPortalContext } from "./studentPortalContextValue";
import {
  DOCUMENT_TYPES,
  clearDocumentCache,
  getDocumentsForCurrentUser,
  getDocumentByKey,
} from "../service/documentService";
import { clearPaymentCache, getCurrentUserPayment } from "../service/paymentService";
import { refreshStudentSession } from "../service/authservice";
import { getAuthUser } from "../service/api";

const STORAGE_KEY_PREFIX = "student_portal_frontend_state";
const PROGRESS_REFRESH_INTERVAL_MS = 60000;
const SESSION_REFRESH_INTERVAL_MS = 120000;

const initialState = {
  profile: {},
  session: {
    santri_id: null,
    calon_santri_id: null,
  },
  documents: {},
  paymentProof: null,
  tahfidzRegistered: false,
};

const requiredProfileFields = [
  "namaLengkap",
  "namaPanggilan",
  "tempatLahir",
  "tanggalLahir",
  "jenisKelamin",
  "alamat",
  "nisn",
  "namaSekolah",
  "tahunLulus",
  "alamatSekolah",
  "kotaSekolah",
  "provinsiSekolah",
  "namaAyah",
  "tempatLahirAyah",
  "tanggalLahirAyah",
  "pekerjaanAyah",
  "pendidikanAyah",
  "penghasilanAyah",
  "alamatAyah",
  "desaAyah",
  "kecamatanAyah",
  "kotaAyah",
  "provinsiAyah",
  "hpAyah",
  "namaIbu",
  "tempatLahirIbu",
  "tanggalLahirIbu",
  "pekerjaanIbu",
  "pendidikanIbu",
  "penghasilanIbu",
  "alamatIbu",
  "desaIbu",
  "kecamatanIbu",
  "kotaIbu",
  "provinsiIbu",
  "hpIbu",
];

const requiredDocuments = DOCUMENT_TYPES
  .filter((documentType) => documentType.required)
  .map((documentType) => documentType.key);

function getStudentStorageKey() {
  const user = getAuthUser("student");
  const id = user?.user_id || user?.id || user?.username || "guest";
  return `${STORAGE_KEY_PREFIX}:${id}`;
}

function loadState() {
  try {
    clearDocumentCache();
    clearPaymentCache();
    const saved = localStorage.getItem(getStudentStorageKey());
    const parsed = saved ? { ...initialState, ...JSON.parse(saved) } : initialState;
    return { ...parsed, documents: {}, paymentProof: null };
  } catch {
    return initialState;
  }
}

function getProfileComplete(profile) {
  return requiredProfileFields.every((field) => String(profile[field] || "").trim());
}

function getDocumentsComplete(documents) {
  return requiredDocuments.every((key) => documents[key]?.status === "verified");
}

export function StudentPortalProvider({ children }) {
  const [state, setState] = useState(loadState);
  const [documentsVersion, setDocumentsVersion] = useState(0);
  const [syncing, setSyncing] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const refreshInFlightRef = useRef(false);
  const lastSessionRefreshAtRef = useRef(0);

  const saveState = useCallback((updater) => {
    setState((current) => {
      const nextState = typeof updater === "function" ? updater(current) : updater;
      localStorage.setItem(getStudentStorageKey(), JSON.stringify(nextState));
      return nextState;
    });
  }, []);

  const updateProfile = useCallback((profile) => {
    saveState((current) => ({ ...current, profile: { ...current.profile, ...profile } }));
  }, [saveState]);

  const updateDocument = useCallback((key, file) => {
    if (!file) return;
    saveState((current) => ({
      ...current,
      documents: {
        ...current.documents,
        [key]: {
          name: file.name,
          size: file.size,
          type: file.type || "File",
          status: file.status || "pending",
          uploadedAt: new Date().toISOString(),
        },
      },
    }));
  }, [saveState]);

  const updatePaymentProof = useCallback((file) => {
    if (!file) return;
    saveState((current) => ({
      ...current,
      paymentProof: {
        name: file.name,
        size: file.size,
        type: file.type || "File",
        status: "pending",
        uploadedAt: new Date().toISOString(),
      },
    }));
  }, [saveState]);

  const setPaymentProof = useCallback((paymentProof) => {
    saveState((current) => ({
      ...current,
      paymentProof,
    }));
  }, [saveState]);

  const registerTahfidz = useCallback(() => {
    saveState((current) => ({ ...current, tahfidzRegistered: true }));
  }, [saveState]);

  const resetApplication = useCallback(() => {
    localStorage.removeItem(getStudentStorageKey());
    setState(initialState);
  }, []);

  const refreshProgress = useCallback(async () => {
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;
    setSyncing(true);
    try {
      const now = Date.now();
      const shouldRefreshSession = now - lastSessionRefreshAtRef.current >= SESSION_REFRESH_INTERVAL_MS;
      if (shouldRefreshSession) lastSessionRefreshAtRef.current = now;

      const [backendDocumentsResult, paymentResult, sessionResult] = await Promise.allSettled([
        getDocumentsForCurrentUser(),
        getCurrentUserPayment(),
        shouldRefreshSession ? refreshStudentSession() : Promise.resolve(getAuthUser("student")),
      ]);

      setState((current) => {
        const nextState = { ...current };

        const backendDocuments = backendDocumentsResult.status === "fulfilled"
          ? backendDocumentsResult.value
          : [];
        const allDocuments = backendDocuments;

        nextState.documents = allDocuments.length
          ? DOCUMENT_TYPES.reduce((items, type) => {
              const document = getDocumentByKey(allDocuments, type.key);
              if (!document) return items;
              return {
                ...items,
                [type.key]: {
                  name: document.fileName,
                  size: document.fileSize,
                  type: document.fileType,
                  status: document.status,
                  uploadedAt: document.submittedAt,
                },
              };
            }, {})
          : {};

        if (paymentResult.status === "fulfilled") {
          nextState.paymentProof = paymentResult.value
            ? {
                name: paymentResult.value.fileName,
                size: paymentResult.value.fileSize,
                type: paymentResult.value.fileType,
                status: paymentResult.value.status,
                uploadedAt: paymentResult.value.submittedAt,
              }
            : null;
        } else {
          nextState.paymentProof = null;
        }

        if (sessionResult.status === "fulfilled") {
          const santriId = sessionResult.value?.santri_id || sessionResult.value?.santri?.santri_id || null;
          const calonSantriId = sessionResult.value?.calon_santri_id || null;
          nextState.session = {
            ...(nextState.session || {}),
            santri_id: santriId,
            calon_santri_id: calonSantriId,
          };
          nextState.profile = {
            ...nextState.profile,
            santri_id: santriId,
            calon_santri_id: calonSantriId,
          };
        }

        localStorage.setItem(getStudentStorageKey(), JSON.stringify(nextState));
        return nextState;
      });
      setLastSyncedAt(new Date().toISOString());
    } finally {
      refreshInFlightRef.current = false;
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(refreshProgress);

    const refreshDocumentsProgress = () => {
      setDocumentsVersion((version) => version + 1);
      refreshProgress();
    };
    const refreshOnFocus = () => {
      if (!document.hidden) refreshDocumentsProgress();
    };
    const intervalId = window.setInterval(refreshDocumentsProgress, PROGRESS_REFRESH_INTERVAL_MS);

    window.addEventListener("manual-documents-updated", refreshDocumentsProgress);
    window.addEventListener("manual-payments-updated", refreshDocumentsProgress);
    window.addEventListener("storage", refreshDocumentsProgress);
    window.addEventListener("focus", refreshDocumentsProgress);
    document.addEventListener("visibilitychange", refreshOnFocus);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("manual-documents-updated", refreshDocumentsProgress);
      window.removeEventListener("manual-payments-updated", refreshDocumentsProgress);
      window.removeEventListener("storage", refreshDocumentsProgress);
      window.removeEventListener("focus", refreshDocumentsProgress);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
  }, [refreshProgress]);

  const progress = useMemo(() => {
    void documentsVersion;
    const profileComplete = getProfileComplete(state.profile);
    const documentsComplete = getDocumentsComplete(state.documents);
    const paymentComplete = state.paymentProof?.status === "approved";
    const santriId = state.session?.santri_id || state.profile?.santri_id || null;

    return {
      profileComplete,
      documentsComplete,
      paymentComplete,
      santriId,
      examAvailable: Boolean(santriId) && profileComplete && documentsComplete && paymentComplete,
    };
  }, [state, documentsVersion]);

  const value = {
    ...state,
    progress,
    syncing,
    lastSyncedAt,
    updateProfile,
    updateDocument,
    updatePaymentProof,
    setPaymentProof,
    registerTahfidz,
    resetApplication,
    refreshProgress,
  };

  return (
    <StudentPortalContext.Provider value={value}>
      {children}
    </StudentPortalContext.Provider>
  );
}
