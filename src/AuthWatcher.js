import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthWatcher() {
  const navigate = useNavigate();

  useEffect(() => {
    function handleStorageChange(e) {
      if (e.key === "token" && !e.newValue) {
        navigate("/login", { replace: true });
      }
    }
    window.addEventListener("storage", handleStorageChange);

    const interval = setInterval(() => {
      if (!localStorage.getItem("token")) {
        navigate("/login", { replace: true });
      }
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [navigate]);

  return null;
} 