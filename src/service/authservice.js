import { apiRequest, saveAuthSession, clearAuthSession } from "./api";
import { mapProfileFromApi } from "./registrationService";

function getSessionUser(data) {
  return data?.data?.user || data?.data || data?.user || data;
}

function mergeAuthUserData(user, santri = null) {
  const profile = mapProfileFromApi({ authUser: user, santri });
  return {
    ...user,
    santri_id: user?.santri_id || santri?.santri_id || profile.santri_id || null,
    calon_santri_id: user?.calon_santri_id || profile.calon_santri_id || null,
    santri: santri || user?.santri,
  };
}

export const refreshStudentSession = async () => {
  const authData = await apiRequest("/auth-user", { authScope: "student" });
  const authUser = getSessionUser(authData);
  let santri = null;

  try {
    const santriData = await apiRequest("/santri/saya", { authScope: "student" });
    santri = santriData?.data || santriData?.santri || null;
  } catch (error) {
    if (![401, 403, 404].includes(error.status)) throw error;
  }

  const user = mergeAuthUserData(authUser, santri);
  saveAuthSession({ user }, "student");
  return user;
};

export const loginUser = async (username, password, expectedRole = "") => {
  const data = await apiRequest("/login", {
    authScope: "public",
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  const user = data.data?.user;
  if (expectedRole && user?.role !== expectedRole) {
    throw new Error(expectedRole === "admin"
      ? "Akun ini bukan akun admin."
      : "Akun ini bukan akun calon santri.");
  }

  const scope = user?.role === "admin" ? "admin" : "student";
  saveAuthSession(data.data, scope);
  if (scope === "student") {
    try {
      await refreshStudentSession();
    } catch (error) {
      if (![401, 403, 404].includes(error.status)) throw error;
    }
  }
  return data;
};

export const registerUser = async (username, password) => {
  const data = await apiRequest("/register", {
    authScope: "public",
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  saveAuthSession(data.data, "student");
  try {
    await refreshStudentSession();
  } catch (error) {
    if (![401, 403, 404].includes(error.status)) throw error;
  }
  return data;
};

export const logoutUser = async (scope) => {
  try {
    await apiRequest("/logout", { authScope: scope, method: "POST" });
  } finally {
    clearAuthSession(scope);
  }
};
