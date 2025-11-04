import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

// Public Pages
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";

// Dashboards
import StudentDashboard from "./student/StudentDashboard";
import InstructorDashboard from "./Instructor/InstructorDashboard";
import ClientDashboard from "./client/ClientDashboard";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Dashboard Routes */}
        <Route path="/student-dashboard/*" element={<StudentDashboard />} />
        <Route path="/instructor-dashboard/*" element={<InstructorDashboard />} />
        <Route path="/client-dashboard/*" element={<ClientDashboard />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);