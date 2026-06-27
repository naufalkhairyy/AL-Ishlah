import { useCallback, useMemo, useRef, useState } from "react";
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
  const [syncing, setSyncing] = useState(false);
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

  const applyDocuments = useCallback((backendDocuments) => {
    const documents = backendDocuments.length
      ? DOCUMENT_TYPES.reduce((items, type) => {
          const document = getDocumentByKey(backendDocuments, type.key);
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

    setState((current) => {
      const nextState = { ...current, documents };
      localStorage.setItem(getStudentStorageKey(), JSON.stringify(nextState));
      return nextState;
    });
  }, []);

  const applyPayment = useCallback((payment) => {
    setState((current) => {
      const nextState = {
        ...current,
        paymentProof: payment
          ? {
              name: payment.fileName,
              size: payment.fileSize,
              type: payment.fileType,
              status: payment.status,
              uploadedAt: payment.submittedAt,
            }
          : null,
      };
      localStorage.setItem(getStudentStorageKey(), JSON.stringify(nextState));
      return nextState;
    });
  }, []);

  const applySession = useCallback((user) => {
    if (!user) return;
    setState((current) => {
      const santriId = user?.santri_id || user?.santri?.santri_id || null;
      const calonSantriId = user?.calon_santri_id || null;
      const nextState = {
        ...current,
        session: {
          ...(current.session || {}),
          santri_id: santriId,
          calon_santri_id: calonSantriId,
        },
        profile: {
          ...current.profile,
          santri_id: santriId,
          calon_santri_id: calonSantriId,
        },
      };
      localStorage.setItem(getStudentStorageKey(), JSON.stringify(nextState));
      return nextState;
    });
  }, []);

  const refreshDocuments = useCallback(async () => {
    const backendDocuments = await getDocumentsForCurrentUser();
    applyDocuments(backendDocuments);
    return backendDocuments;
  }, [applyDocuments]);

  const refreshPayment = useCallback(async () => {
    const payment = await getCurrentUserPayment();
    applyPayment(payment);
    return payment;
  }, [applyPayment]);

  const refreshSession = useCallback(async ({ force = false } = {}) => {
    const now = Date.now();
    const shouldRefreshSession = force || now - lastSessionRefreshAtRef.current >= SESSION_REFRESH_INTERVAL_MS;
    if (!shouldRefreshSession) {
      const user = getAuthUser("student");
      applySession(user);
      return user;
    }

    lastSessionRefreshAtRef.current = now;
    const user = await refreshStudentSession();
    applySession(user);
    return user;
  }, [applySession]);

  const refreshProgress = useCallback(async () => {
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;
    setSyncing(true);
    try {
      const [backendDocumentsResult, paymentResult, sessionResult] = await Promise.allSettled([
        getDocumentsForCurrentUser(),
        getCurrentUserPayment(),
        refreshSession(),
      ]);

      setState((current) => {
        const nextState = { ...current };

        const backendDocuments = backendDocumentsResult.status === "fulfilled"
          ? backendDocumentsResult.value
          : [];
        nextState.documents = backendDocuments.length
          ? DOCUMENT_TYPES.reduce((items, type) => {
              const document = getDocumentByKey(backendDocuments, type.key);
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
  }, [refreshSession]);

  const progress = useMemo(() => {
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
  }, [state]);

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
    refreshDocuments,
    refreshPayment,
    refreshSession,
    refreshProgress,
  };

  return (
    <StudentPortalContext.Provider value={value}>
      {children}
    </StudentPortalContext.Provider>
  );
}
