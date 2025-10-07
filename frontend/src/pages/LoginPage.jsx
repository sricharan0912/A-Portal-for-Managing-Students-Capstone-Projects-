import { useState } from "react";
import Navbar from "../components/Navbar";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Client");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const endpoint =
      role === "Client"
        ? "http://localhost:5050/clients/login"
        : "http://localhost:5050/students/login"; // future use

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Login failed");

      alert("✅ Login successful!");

      // Save client info to localStorage
      localStorage.setItem("client", JSON.stringify(data.client));

      // Redirect to client dashboard
      window.location.href = "/client-dashboard";
    } catch (err) {
      alert(err.message);
    }
  };

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
              </select>

              <input
                type="email"
                placeholder="Email *"
                className="border rounded-md p-3 w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password *"
                className="border rounded-md p-3 w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-3 rounded-md transition"
              >
                Login
              </button>
            </form>

            <p className="text-center mt-6 text-gray-700">
              Don’t have an account?{" "}
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
