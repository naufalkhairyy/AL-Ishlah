import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../service/authservice";
import { useAppPopup } from "../../components/AppPopup";
import "../../styles/login.css";
import logo from "../../assets/logo.png";

function Login({ goSignup, goHome, adminOnly = false }) {
  const navigate = useNavigate();
  const { showPopup } = useAppPopup();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event?.preventDefault();

    if (!username.trim() || !password.trim()) {
      showPopup("Data belum lengkap", "Username dan password wajib diisi.", "warning");
      return;
    }

    setLoading(true);

    try {
      const result = await loginUser(username.trim(), password, adminOnly ? "admin" : "");
      const user = result.data?.user;
      showPopup("Login berhasil", result.message || "Anda berhasil masuk.", "success");

      if (adminOnly || user?.role === "admin") {
        navigate("/admin/dashboard");
      } else if (goHome) {
        goHome();
      } else {
        navigate("/santri/dashboard");
      }
    } catch (error) {
      showPopup("Login gagal", error.message || "Periksa username dan password Anda.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-left"></div>

      <div className="login-right">
        <form className="login-box" onSubmit={handleLogin}>
          <img src={logo} className="login-logo" alt="Logo Al Ishlah Al Islamy" />

          <h2>{adminOnly ? "Login Admin" : "Login into your account"}</h2>

          <div className="form-group">
            <label>Username :</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <div className="forgot">
            <button type="button" onClick={() => showPopup("Reset password", "Silakan hubungi admin pesantren untuk reset password.", "info")}>
              Forgot password?
            </button>
          </div>

          <button
            className="btn-login"
            disabled={loading}
            type="submit"
          >
            {loading ? "Loading..." : "Login now"}
          </button>

          {!adminOnly && <div className="divider">OR</div>}

          {!adminOnly && (
            <button className="btn-signup" type="button" onClick={goSignup || (() => navigate("/signup"))}>
              Signup now
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default Login;
