import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AnalystDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to forms by default
    navigate("/analyst/forms", { replace: true });
  }, [navigate]);

  return null;
};

export default AnalystDashboard;
