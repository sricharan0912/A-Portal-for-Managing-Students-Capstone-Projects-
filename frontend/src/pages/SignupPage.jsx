import { useState } from "react";
import { 
  createUserWithEmailAndPassword, 
  getIdToken, 
  deleteUser,
  signInWithPopup,
  GoogleAuthProvider 
} from "firebase/auth";
import { auth } from "../firebaseConfig";
import Navbar from "../components/Navbar";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://a-portal-for-managing-students-capstone-projects-production.up.railway.app";

export default function SignupPage() {
  const [role, setRole] = useState("Student");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirmPassword: false,
  });
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    organization_name: "",
    website: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Google Sign-In Handler
  const handleGoogleSignup = async () => {
    setGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Get ID token
      const idToken = await getIdToken(user);
      
      // Extract name from Google profile
      const displayName = user.displayName || "";
      const nameParts = displayName.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // Check if user already exists
      const checkResponse = await fetch(
        `${API_BASE_URL}/check-email?email=${encodeURIComponent(user.email)}`
      );

      if (!checkResponse.ok) {
        // User exists - redirect to login
        alert("Account already exists! Please login instead.");
        window.location.href = "/login";
        return;
      }

      // Determine endpoint based on role
      let url = "";
      let payload = {};
      let redirectPath = "";

      if (role === "Student") {
        url = `${API_BASE_URL}/students/signup`;
        payload = {
          first_name: firstName,
          last_name: lastName,
          email: user.email,
          idToken: idToken,
        };
        redirectPath = "/student-dashboard";
      } else if (role === "Client") {
        // For clients, we need organization name - show a prompt
        const orgName = prompt("Please enter your organization name:");
        if (!orgName) {
          alert("Organization name is required for client signup");
          await deleteUser(user);
          setGoogleLoading(false);
          return;
        }
        url = `${API_BASE_URL}/clients/signup`;
        payload = {
          name: displayName,
          email: user.email,
          organization_name: orgName,
          website: null,
          idToken: idToken,
        };
        redirectPath = "/login";
      } else if (role === "Instructor") {
        url = `${API_BASE_URL}/instructors/signup`;
        payload = {
          first_name: firstName,
          last_name: lastName,
          email: user.email,
          idToken: idToken,
        };
        redirectPath = "/login";
      }

      // Send to backend
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Account created successfully!");

        if (role === "Student") {
          const studentData = {
            id: data.student.id,
            first_name: firstName,
            last_name: lastName,
            email: user.email,
            token: data.token,
          };
          localStorage.setItem("student", JSON.stringify(studentData));
          localStorage.setItem("authToken", data.token);
        } else {
          localStorage.setItem("authToken", data.token);
        }

        window.location.href = redirectPath;
      } else {
        // Delete Firebase user if backend fails
        await deleteUser(user);
        alert(data.error || "Signup failed");
      }
    } catch (err) {
      console.error("Google signup error:", err);
      
      if (err.code === "auth/popup-closed-by-user") {
        // User closed the popup - do nothing
      } else if (err.code === "auth/account-exists-with-different-credential") {
        alert("An account already exists with this email using a different sign-in method.");
      } else {
        alert(err.message || "Google signup failed. Please try again.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // STEP 1: Validate form data
      if (formData.password !== formData.confirmPassword) {
        alert("Passwords do not match!");
        setLoading(false);
        return;
      }

      // STEP 2: Check if email already exists in database BEFORE creating Firebase user
      const checkEmailResponse = await fetch(
        `${API_BASE_URL}/check-email?email=${encodeURIComponent(formData.email)}`
      );
      
      if (!checkEmailResponse.ok) {
        const errorData = await checkEmailResponse.json();
        alert(errorData.error || "Email already registered");
        setLoading(false);
        return;
      }

      // STEP 3: Email is available, create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      
      // STEP 4: Get Firebase ID token
      const idToken = await getIdToken(userCredential.user);

      let url = "";
      let payload = {};
      let redirectPath = "";

      if (role === "Student") {
        url = `${API_BASE_URL}/students/signup`;
        payload = {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          idToken: idToken,
        };
        redirectPath = "/student-dashboard";
      } else if (role === "Client") {
        url = `${API_BASE_URL}/clients/signup`;
        payload = {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          organization_name: formData.organization_name,
          website: formData.website || null,
          idToken: idToken,
        };
        redirectPath = "/login";
      } else if (role === "Instructor") {
        url = `${API_BASE_URL}/instructors/signup`;
        payload = {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          idToken: idToken,
        };
        redirectPath = "/login";
      } else {
        alert("Invalid role selected!");
        setLoading(false);
        return;
      }

      // STEP 5: Send data to backend
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (response.ok) {
        alert("Account created successfully!");
        
        // Store token and user info
        if (role === "Student") {
          const studentData = {
            id: data.student.id,
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            token: data.token,
          };
          localStorage.setItem("student", JSON.stringify(studentData));
          localStorage.setItem("authToken", data.token);
        } else if (role === "Client") {
          localStorage.setItem("authToken", data.token);
        } else if (role === "Instructor") {
          localStorage.setItem("authToken", data.token);
        }
        
        window.location.href = redirectPath;
      } else {
        // Delete Firebase user if backend signup fails
        try {
          if (userCredential?.user) {
            await deleteUser(userCredential.user);
            console.log("Firebase user deleted due to backend error");
          }
        } catch (deleteErr) {
          console.error("Error deleting Firebase user:", deleteErr);
        }

        alert(data.error || "Signup failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      
      // Delete Firebase user if backend signup fails
      try {
        if (err.code && !err.code.startsWith("auth/")) {
          const user = auth.currentUser;
          if (user) {
            await deleteUser(user);
            console.log("Firebase user deleted due to error");
          }
        }
      } catch (deleteErr) {
        console.error("Error deleting Firebase user:", deleteErr);
      }
      
      // Handle Firebase specific errors
      if (err.code === "auth/email-already-in-use") {
        alert("This email is already registered. Please login or use a different email.");
      } else if (err.code === "auth/weak-password") {
        alert("Password should be at least 6 characters");
      } else {
        alert(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Blue banner */}
      <div className="bg-blue-900 h-40 w-full"></div>

      {/* Signup Form */}
      <div className="flex-grow flex justify-center -mt-24">
        <div className="w-full max-w-2xl animate-slideUp">
          <div className="bg-white shadow-md rounded-xl p-10">
            <h2 className="text-3xl font-bold text-center mb-8">
              Let's create your account.
            </h2>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Role Selection */}
              <select
                className="border rounded-md p-3 w-full"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option>Student</option>
                <option>Instructor</option>
                <option>Client</option>
              </select>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-6">
                <input
                  type="text"
                  name="firstName"
                  placeholder="First name *"
                  className="border rounded-md p-3 w-full"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last name *"
                  className="border rounded-md p-3 w-full"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Email */}
              <input
                type="email"
                name="email"
                placeholder="Email *"
                className="border rounded-md p-3 w-full"
                value={formData.email}
                onChange={handleChange}
                required
              />

              {/* Passwords with show/hide toggles */}
              <div className="grid grid-cols-2 gap-6">
                {/* Password */}
                <div className="relative">
                  <input
                    type={showPasswords.password ? "text" : "password"}
                    name="password"
                    placeholder="Password *"
                    className="border rounded-md p-3 w-full pr-12"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("password")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.password ? (
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

                {/* Confirm Password */}
                <div className="relative">
                  <input
                    type={showPasswords.confirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm password *"
                    className="border rounded-md p-3 w-full pr-12"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("confirmPassword")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirmPassword ? (
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
              </div>

              {/* Extra Fields for Client */}
              {role === "Client" && (
                <>
                  <input
                    type="text"
                    name="organization_name"
                    placeholder="Organization Name *"
                    className="border rounded-md p-3 w-full"
                    value={formData.organization_name}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="text"
                    name="website"
                    placeholder="Website (optional)"
                    className="border rounded-md p-3 w-full"
                    value={formData.website}
                    onChange={handleChange}
                  />
                </>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-3 rounded-md transition disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Create account"}
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
              onClick={handleGoogleSignup}
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
                {googleLoading ? "Signing up..." : "Sign up with Google"}
              </span>
            </button>

            <p className="text-center mt-6 text-gray-700">
              Already have an account?{" "}
              <a href="/login" className="text-blue-600 hover:underline">
                Login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}