import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  signInWithEmailAndPassword, 
  getIdToken,
  signInWithPopup,
  GoogleAuthProvider 
} from "firebase/auth";
import { auth } from "../firebaseConfig";
import Navbar from "../components/Navbar";

// Use environment variable or production URL as fallback
const API_URL = import.meta.env.VITE_API_URL || "https://a-portal-for-managing-students-capstone-projects-production.up.railway.app";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("Client");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Toast notification state
  const [toast, setToast] = useState({ show: false, type: "", message: "" });

  // Show toast notification
  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    // Auto-hide after 4 seconds for errors, 2 seconds for success
    if (type === "error") {
      setTimeout(() => setToast({ show: false, type: "", message: "" }), 4000);
    }
  };

  // Check if user is already logged in - redirect them away from login page
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

  // Google Sign-In Handler
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Get ID token
      const idToken = await getIdToken(user);

      // Try to login with the selected role
      const endpoint =
        role === "Client"
          ? `${API_URL}/clients/login`
          : role === "Student"
          ? `${API_URL}/students/login`
          : `${API_URL}/instructors/login`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, idToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast("error", `No ${role.toLowerCase()} account found with this email. Please sign up first or select a different role.`);
        return;
      }

      showToast("success", "Login successful! Redirecting...");

      // Save user info and token to localStorage
      setTimeout(() => {
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
      }, 1000);
    } catch (err) {
      console.error("Google login error:", err);
      
      if (err.code === "auth/popup-closed-by-user") {
        // User closed the popup - do nothing
      } else if (err.code === "auth/account-exists-with-different-credential") {
        showToast("error", "An account already exists with this email using a different sign-in method. Try email/password login.");
      } else {
        showToast("error", err.message || "Google login failed. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !password) {
      showToast("error", "Email and password are required");
      setLoading(false);
      return;
    }

    try {
      // Step 1: Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Step 2: Get Firebase ID token
      const idToken = await getIdToken(userCredential.user);

      const endpoint =
        role === "Client"
          ? `${API_URL}/clients/login`
          : role === "Student"
          ? `${API_URL}/students/login`
          : `${API_URL}/instructors/login`;

      // Step 3: Send token to backend
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, idToken }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Login failed");

      showToast("success", "Login successful! Redirecting...");

      // Save user info and token to localStorage with slight delay for UX
      setTimeout(() => {
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
      }, 1000);
    } catch (err) {
      console.error("Login error:", err);
      
      // Handle Firebase specific errors
      if (err.code === "auth/user-not-found") {
        showToast("error", "User not found. Please sign up first.");
      } else if (err.code === "auth/wrong-password") {
        showToast("error", "Incorrect password.");
      } else if (err.code === "auth/invalid-credential") {
        showToast("error", "Invalid email or password.");
      } else {
        showToast("error", err.message || "Login failed. Please try again.");
      }
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

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slideDown">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg ${
            toast.type === "success" 
              ? "bg-green-600 text-white" 
              : "bg-red-600 text-white"
          }`}>
            {toast.type === "success" ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="font-medium">{toast.message}</span>
            <button 
              onClick={() => setToast({ show: false, type: "", message: "" })}
              className="ml-2 hover:opacity-80"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

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

              {/* Password field with show/hide toggle */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password *"
                  className="border rounded-md p-3 w-full pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>

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
                disabled={loading || googleLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md transition disabled:opacity-50"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-md py-3 px-4 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              <span className="text-gray-700 font-medium">
                {googleLoading ? "Signing in..." : "Continue with Google"}
              </span>
            </button>

            <p className="text-center mt-6 text-gray-700">
              Don't have an account?{" "}
              <a href="/signup" className="text-blue-600 hover:underline">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}