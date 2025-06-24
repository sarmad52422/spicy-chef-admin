import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BranchSelectorModal from "../components/BranchSelectorModal";
import { useDispatch } from "react-redux";
import { setBranch } from "../redux/slices/branchSlice";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showBranchModal, setShowBranchModal] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === "admin@example.com" && password === "password") {
      setShowBranchModal(true);
    } else {
      alert("Invalid credentials");
    }
  };

  const handleSelectBranch = (branch) => {
    dispatch(setBranch(branch));
    navigate("/"); // or wherever you want
  };

  return (
    <>
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="card shadow p-4" style={{ width: "100%", maxWidth: "400px" }}>
          <h3 className="text-center mb-4">Login</h3>
          <form onSubmit={handleLogin}>
            <input className="form-control mb-3" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
            <input className="form-control mb-3" placeholder="Password" type="password" onChange={(e) => setPassword(e.target.value)} />
            <button type="submit" className="btn btn-dark w-100">Login</button>
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
};

export default Login;