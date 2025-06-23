// src/App.js
import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import LiveOrder from "./pages/LiveOrder";
import PendingPayments from "./pages/PendingPayments";
import TextToPay from "./pages/TextToPay";
import Menu from "./pages/Menu";
import Checkout from "./pages/Checkout";
import { useDispatch } from "react-redux";
import { initializeMenu } from "./redux/slices/menuSlice";
import { useEffect } from "react";
import Login from "./pages/Login";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Load initial state when app mounts
    const savedState = JSON.parse(localStorage.getItem("reduxState")) || {};
    if (savedState.menu?.categories) {
      dispatch(initializeMenu(savedState.menu.categories));
    }
  }, [dispatch]);
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <PrivateRoute>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/live-order" element={<LiveOrder />} />
              <Route path="/pending-payments" element={<PendingPayments />} />
              <Route path="/text-to-pay" element={<TextToPay />} />
              <Route path="/checkout" element={<Checkout />} />
            </Routes>
          </PrivateRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
