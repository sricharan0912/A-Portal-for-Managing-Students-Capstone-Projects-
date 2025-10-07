import { useState } from "react";
import Navbar from "../components/Navbar";

export default function SignupPage() {
  const [role, setRole] = useState("Student");
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

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      let url = "";
      let payload = {};

      if (role === "Client") {
        url = "http://localhost:5050/clients/signup";
        payload = {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          password: formData.password,
          organization_name: formData.organization_name,
          website: formData.website || null
        };
      } else {
        // For now, just mock students/instructors
        alert(`${role} signup not yet implemented!`);
        return;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Account created successfully!");
        window.location.href = "/login";
      } else {
        alert(data.error || "Signup failed");
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
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
              Let’s create your account.
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
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-3 rounded-md transition"
              >
                Create account
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
