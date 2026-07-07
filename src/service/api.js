const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

export const TOKEN_KEY = "token";
export const USER_KEY = "user";
export const ADMIN_TOKEN_KEY = "admin_token";
export const ADMIN_USER_KEY = "admin_user";
export const STUDENT_TOKEN_KEY = "student_token";
export const STUDENT_USER_KEY = "student_user";

function getScopeFromUser(user) {
  return user?.role === "admin" ? "admin" : "student";
}

function getScopeKeys(scope) {
  if (scope === "admin") return { tokenKey: ADMIN_TOKEN_KEY, userKey: ADMIN_USER_KEY };
  if (scope === "student") return { tokenKey: STUDENT_TOKEN_KEY, userKey: STUDENT_USER_KEY };
  if (window.location.pathname.startsWith("/admin")) return { tokenKey: ADMIN_TOKEN_KEY, userKey: ADMIN_USER_KEY };
  if (window.location.pathname.startsWith("/santri")) return { tokenKey: STUDENT_TOKEN_KEY, userKey: STUDENT_USER_KEY };
  return { tokenKey: TOKEN_KEY, userKey: USER_KEY };
}

export function getAuthToken(scope) {
  const { tokenKey } = getScopeKeys(scope);
  return localStorage.getItem(tokenKey) || (!scope ? localStorage.getItem(TOKEN_KEY) : null);
}

export function getAuthUser(scope) {
  const { userKey } = getScopeKeys(scope);
  try {
    const user = localStorage.getItem(userKey) || (!scope ? localStorage.getItem(USER_KEY) : null);
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function saveAuthSession({ token, user }, scope = getScopeFromUser(user)) {
  const { tokenKey, userKey } = getScopeKeys(scope);
  const currentUser = getAuthUser(scope);
  const sameUser = currentUser?.user_id && user?.user_id && String(currentUser.user_id) === String(user.user_id);
  const nextUser = user && currentUser && sameUser ? { ...currentUser, ...user } : user;
  if (token) localStorage.setItem(tokenKey, token);
  if (nextUser) localStorage.setItem(userKey, JSON.stringify(nextUser));

  if (!scope) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (nextUser) localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }
}

export function clearAuthSession(scope) {
  const { tokenKey, userKey } = getScopeKeys(scope);
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userKey);

  if (!scope) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

export async function apiRequest(path, options = {}) {
  const { authScope, ...fetchOptions } = options;
  const token = authScope === "public" ? null : getAuthToken(authScope);
  const isFormData = options.body instanceof FormData;

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      headers: {
        Accept: "application/json",
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (requestError) {
    const error = new Error(
      `Gagal terhubung ke server (${API_BASE_URL}). Periksa koneksi, domain CORS, atau VITE_API_BASE_URL.`
    );
    error.cause = requestError;
    error.isNetworkError = true;
    throw error;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const validationMessage = data.errors
      ? Object.values(data.errors).flat().join("\n")
      : null;
    const error = new Error(validationMessage || data.message || "Request gagal");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
