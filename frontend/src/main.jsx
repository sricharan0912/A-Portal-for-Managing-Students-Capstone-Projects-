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
import StudentDashboard from "./Student/StudentDashboard";
import InstructorDashboard from "./Instructor/InstructorDashboard";
import ClientDashboard from "./Client/ClientDashboard";

// Instructor Nested Views
import ProjectsView from "./Instructor/ProjectsView";
import ProjectDetailsView from "./Instructor/ProjectDetailsView";

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

        {/* Student Dashboard */}
        <Route path="/student-dashboard/*" element={<StudentDashboard />} />

        {/* Instructor Dashboard with nested routes */}
        <Route path="/instructor-dashboard/*" element={<InstructorDashboard />}>
          <Route path="projects" element={<ProjectsView />} />
          <Route path="projects/:projectId" element={<ProjectDetailsView />} />
        </Route>

        {/* Client Dashboard */}
        <Route path="/client-dashboard/*" element={<ClientDashboard />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

