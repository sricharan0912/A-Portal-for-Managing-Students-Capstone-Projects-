import { useState } from "react";
import { createUserWithEmailAndPassword, getIdToken, deleteUser } from "firebase/auth";
import { auth } from "../firebaseConfig";
import Navbar from "../components/Navbar";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5050";

export default function SignupPage() {
  const [role, setRole] = useState("Student");
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ STEP 1: Validate form data
      if (formData.password !== formData.confirmPassword) {
        alert("Passwords do not match!");
        setLoading(false);
        return;
      }

      // ✅ STEP 2: Check if email already exists in database BEFORE creating Firebase user
      const checkEmailResponse = await fetch(
        `${API_BASE_URL}/check-email?email=${encodeURIComponent(formData.email)}`
      );
      
      if (!checkEmailResponse.ok) {
        const errorData = await checkEmailResponse.json();
        alert(errorData.error || "Email already registered");
        setLoading(false);
        return;
      }

      // ✅ STEP 3: Email is available, create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      
      // ✅ STEP 4: Get Firebase ID token
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

      // ✅ STEP 5: Send data to backend
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
          // Only delete if error is not from Firebase auth
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

              {/* Passwords */}
              <div className="grid grid-cols-2 gap-6">
                <input
                  type="password"
                  name="password"
                  placeholder="Password *"
                  className="border rounded-md p-3 w-full"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm password *"
                  className="border rounded-md p-3 w-full"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Role */}
              <select
                className="border rounded-md p-3 w-full"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option>Student</option>
                <option>Instructor</option>
                <option>Client</option>
              </select>

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
                disabled={loading}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-3 rounded-md transition disabled:opacity-50"
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

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