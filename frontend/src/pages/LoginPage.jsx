import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, getIdToken } from "firebase/auth";
import { auth } from "../firebaseConfig";
import Navbar from "../components/Navbar";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Client");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // ✅ Check if user is already logged in - redirect them away from login page
  useEffect(() => {
    const client = localStorage.getItem("client");
    const student = localStorage.getItem("student");
    const instructor = localStorage.getItem("instructor");
    const authToken = localStorage.getItem("authToken");

    if (authToken) {
      if (client) {
        navigate("/client-dashboard", { replace: true });
        return;
      } else if (student) {
        navigate("/student-dashboard", { replace: true });
        return;
      } else if (instructor) {
        navigate("/instructor-dashboard", { replace: true });
        return;
      }
    }
    setCheckingAuth(false);
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !password) {
      alert("Email and password are required");
      setLoading(false);
      return;
    }

    try {
      // Step 1: Sign in with Firebase
      console.log("Signing in with Firebase...");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Firebase sign in successful");
      
      // Step 2: Get Firebase ID token
      const idToken = await getIdToken(userCredential.user);
      console.log("ID token obtained");

      const endpoint =
        role === "Client"
          ? "http://localhost:5050/clients/login"
          : role === "Student"
          ? "http://localhost:5050/students/login"
          : "http://localhost:5050/instructors/login";

      console.log("Sending login request to:", endpoint);

      // Step 3: Send token to backend
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, idToken }),
      });

      const data = await response.json();
      console.log("Backend response:", data);

      if (!response.ok) throw new Error(data.error || "Login failed");

      alert("✅ Login successful!");

      // Save user info and token to localStorage
      // ✅ Use navigate with replace: true to prevent back button returning to login
      if (role === "Client") {
        localStorage.setItem("client", JSON.stringify(data.client));
        localStorage.setItem("authToken", data.token);
        navigate("/client-dashboard", { replace: true });
      } else if (role === "Student") {
        localStorage.setItem("student", JSON.stringify(data.student));
        localStorage.setItem("authToken", data.token);
        navigate("/student-dashboard", { replace: true });
      } else {
        localStorage.setItem("instructor", JSON.stringify(data.instructor));
        localStorage.setItem("authToken", data.token);
        navigate("/instructor-dashboard", { replace: true });
      }
    } catch (err) {
      console.error("Login error:", err);
      
      // Handle Firebase specific errors
      if (err.code === "auth/user-not-found") {
        alert("User not found. Please sign up first.");
      } else if (err.code === "auth/wrong-password") {
        alert("Incorrect password.");
      } else if (err.code === "auth/invalid-credential") {
        alert("Invalid email or password.");
      } else {
        alert(err.message || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking if already authenticated
  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="bg-blue-900 h-40 w-full"></div>

      {/* Login Form */}
      <div className="flex-grow flex justify-center -mt-24">
        <div className="w-full max-w-2xl animate-slideUp">
          <div className="bg-white shadow-md rounded-xl p-10">
            <h2 className="text-3xl font-bold text-center mb-8">Welcome back 👋</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="border rounded-md p-3 w-full"
              >
                <option>Client</option>
                <option>Student</option>
                <option>Instructor</option>
              </select>

              <input
                type="email"
                placeholder="Email *"
                className="border rounded-md p-3 w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password *"
                className="border rounded-md p-3 w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <div className="flex justify-between items-center text-sm">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <a href="/forgot-password" className="text-blue-600 hover:underline">
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md transition disabled:opacity-50"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="text-center mt-6 text-gray-700">
              Don't have an account?{" "}
              <a href="/signup" className="text-blue-600 hover:underline">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}