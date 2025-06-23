import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Navbar = () => {
  const [time, setTime] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      setTime(`${hours}:${minutes} ${ampm}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  if (location.pathname === "/login") {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12 col-lg-8 col-md-8 border-bottom border-end">
          <nav className="d-flex align-items-center justify-content-between px-3 py-3">
            <div className="d-flex gap-2">
              <Link to="/" className="btn btn-outline-dark">
                🏠 Home
              </Link>
              <Link to="/menu" className="btn btn-outline-dark">
                Menu
              </Link>
              <Link to="/live-order" className="btn btn-outline-dark">
                Live Order
              </Link>
              <Link to="/pending-payments" className="btn btn-outline-dark">
                Pending Payments
              </Link>
              <Link to="/text-to-pay" className="btn btn-outline-dark">
                Text to Pay Links
              </Link>
            </div>
            <div className="d-flex align-items-center gap-3">
              <span className="text-muted">
                <i className="bi bi-clock"></i> {time}
              </span>
              <button className="btn btn-outline-danger" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </nav>
        </div>
        <div className="col-12 col-lg-4 col-md-4 border-bottom">
          <div className="d-flex gap-2 flex-wrap my-3">
            <button className="btn btn-light shadow-sm rounded-pill">
              0 All
            </button>
            <button className="btn btn-light shadow-sm rounded-pill">
              0 In-Store
            </button>
            <button className="btn btn-light shadow-sm rounded-pill">
              0 Collection
            </button>
            <button className="btn btn-light shadow-sm rounded-pill">
              0 Delivery
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
