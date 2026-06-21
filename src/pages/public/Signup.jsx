import { useState } from "react";
import "../../styles/signup.css";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../../service/authservice";
import logo from "../../assets/logo.png";

function Signup({ goLogin }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!username.trim() || !password.trim()) {
      alert("Username dan password wajib diisi.");
      return;
    }

    if (password.length < 6) {
      alert("Password minimal 6 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Konfirmasi password tidak sama.");
      return;
    }

    setLoading(true);

    try {
      const result = await registerUser(username.trim(), password);
      alert(result.message || "Akun berhasil dibuat.");
      navigate("/santri/dashboard");
    } catch (error) {
      alert(error.message || "Signup gagal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-wrapper">
      <div className="signup-left">
        <div className="signup-box">
          <img src={logo} className="signup-logo" />
          <h2>Sign up into your account</h2>

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
              <label>Role :</label>
              <input type="text" value="calon_santri" disabled />
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
            Back to Login
          </p>
        </div>
      </div>

      <div className="signup-right"></div>
    </div>
  );
}

export default Signup;
