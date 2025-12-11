import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebaseConfig";
import Navbar from "../components/Navbar";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!email) {
      setMessage({ type: "error", text: "Please enter your email address" });
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage({
        type: "success",
        text: "Password reset link sent! Check your email inbox (and spam folder).",
      });
      setEmail(""); // Clear the form
    } catch (error) {
      console.error("Password reset error:", error);

      if (error.code === "auth/user-not-found") {
        setMessage({
          type: "error",
          text: "No account found with this email address.",
        });
      } else if (error.code === "auth/invalid-email") {
        setMessage({
          type: "error",
          text: "Please enter a valid email address.",
        });
      } else if (error.code === "auth/too-many-requests") {
        setMessage({
          type: "error",
          text: "Too many requests. Please try again later.",
        });
      } else {
        setMessage({
          type: "error",
          text: error.message || "Failed to send reset link. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="bg-blue-900 h-40 w-full"></div>

      {/* Forgot Password Form */}
      <div className="flex-grow flex justify-center -mt-24">
        <div className="w-full max-w-2xl animate-slideUp">
          <div className="bg-white shadow-md rounded-xl p-10">
            <h2 className="text-3xl font-bold text-center mb-4">
              Forgot Password?
            </h2>
            <p className="text-center text-gray-600 mb-6">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            {/* Success/Error Message */}
            {message.text && (
              <div
                className={`mb-6 rounded-lg px-4 py-3 text-sm flex items-center gap-2 ${
                  message.type === "success"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {message.type === "success" ? (
                  <svg
                    className="h-5 w-5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <input
                type="email"
                placeholder="Email *"
                className="border rounded-md p-3 w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-3 rounded-md transition disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <p className="text-center mt-6 text-gray-700">
              Remember your password?{" "}
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