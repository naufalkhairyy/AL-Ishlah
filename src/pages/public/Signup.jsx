import { useState } from "react";
import "../../styles/signup.css";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../../service/authservice";
import { useAppPopup } from "../../components/AppPopup";
import logo from "../../assets/logo.png";

function Signup({ goLogin }) {
  const navigate = useNavigate();
  const { showPopup } = useAppPopup();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!username.trim() || !password.trim()) {
      showPopup("Data belum lengkap", "Username dan password wajib diisi.", "warning");
      return;
    }

    if (password.length < 6) {
      showPopup("Password terlalu pendek", "Password minimal 6 karakter.", "warning");
      return;
    }

    if (password !== confirmPassword) {
      showPopup("Konfirmasi tidak sama", "Konfirmasi password harus sama dengan password.", "warning");
      return;
    }

    setLoading(true);

    try {
      const result = await registerUser(username.trim(), password);
      showPopup("Akun berhasil dibuat", result.message || "Silakan lanjut melengkapi data calon santri.", "success");
      navigate("/santri/dashboard");
    } catch (error) {
      showPopup("Signup gagal", error.message || "Akun gagal dibuat.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-wrapper">
      <div className="signup-left">
        <div className="signup-box">
          <img src={logo} className="signup-logo" alt="Logo Al Ishlah Al Islamy" />
          <h2>Daftar Akun Calon Santri</h2>

          <div className="grid">
            <div>
              <label>Username :</label>
              <input
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>
            <div>
              <input type="hidden" name="role" value="calon_santri" />
            </div>

            <div>
              <label>Password :</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <div>
              <label>Confirm Password :</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>
          </div>

          <button className="btn-signup-main" onClick={handleSignup} disabled={loading}>
            {loading ? "Loading..." : "Sign up"}
          </button>

          <p className="back-login" onClick={goLogin || (() => navigate("/login"))}>
            Kembali ke Login
          </p>
        </div>
      </div>

      <div className="signup-right"></div>
    </div>
  );
}

export default Signup;
