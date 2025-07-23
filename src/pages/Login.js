import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BranchSelectorModal from "../components/BranchSelectorModal";
import Alert from "../components/Alert";
import { useDispatch } from "react-redux";
import { setBranch } from "../redux/slices/branchSlice";
import { API_URL } from "../constants/contants";

// Custom inline hook
function useAuth() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")));
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/api/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (data.status && data.result?.data?.token) {
      setUser(data.result.data.user);
      setToken(data.result.data.token);
      localStorage.setItem("user", JSON.stringify(data.result.data.user));
      localStorage.setItem("token", data.result.data.token);
      return { success: true };
    } else {
      throw new Error(data.message || "Login failed");
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const isAuthenticated = !!token;

  return { user, token, login, logout, isAuthenticated };
}

export default function Login() {
  const { login } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alert, setAlert] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        setAlert({ type: "success", message: "Login successful!" });
        setShowBranchModal(true);
      }
    } catch (err) {
      setAlert({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBranch = (branch) => {
    console.log("Branch ", branch);
    dispatch(setBranch(branch));
    localStorage.setItem("selectedBranch", JSON.stringify(branch));
    navigate("/"); // Redirect after selecting branch
  };

  return (
    <>
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="card shadow p-4" style={{ width: "100%", maxWidth: "400px" }}>
          <h3 className="text-center mb-4">Login</h3>
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert({})} />
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email address</label>
              <input
                type="email"
                className="form-control"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter email"
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
              />
            </div>
            <button type="submit" className="btn btn-dark w-100" disabled={loading}>
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              ) : null}
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>

      <BranchSelectorModal
        show={showBranchModal}
        onClose={() => setShowBranchModal(false)}
        onSelect={handleSelectBranch}
      />
    </>
  );
}
