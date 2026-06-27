import { useState } from "react";
import { apiRequest } from "../../../service/api";

export default function QuickApplicantForm({ notify }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      await apiRequest("/users", {
        authScope: "admin",
        method: "POST",
        body: JSON.stringify({
          username,
          password,
          role: "calon_santri",
        }),
      });
      setUsername("");
      setPassword("");
      notify("Pendaftar ditambahkan", "Akun calon santri berhasil dibuat di backend.");
    } catch (error) {
      notify("Gagal menambahkan", error.message || "Backend menolak data pendaftar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="admin-mini-form" onSubmit={handleSubmit}>
      <input
        placeholder="Username calon santri"
        required
        value={username}
        onChange={(event) => setUsername(event.target.value)}
      />
      <input
        minLength={6}
        placeholder="Password awal"
        required
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <button className="admin-primary" type="submit" disabled={saving}>
        {saving ? "Menyimpan..." : "Simpan Data"}
      </button>
    </form>
  );
}
