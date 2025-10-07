import Navbar from "../components/Navbar";

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="bg-blue-900 h-40 w-full"></div>

      {/* Forgot Password Form */}
      <div className="flex-grow flex justify-center -mt-24">
        <div className="w-full max-w-2xl animate-slideUp">
          <div className="bg-white shadow-md rounded-xl p-10">
            <h2 className="text-3xl font-bold text-center mb-8">
              Forgot Password?
            </h2>
            <p className="text-center text-gray-600 mb-6">
              Enter your email address and we’ll send you a link to reset your password.
            </p>
            <form className="space-y-5">
              <input type="email" placeholder="Email *" className="border rounded-md p-3 w-full" />
              <button className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-3 rounded-md transition">
                Send Reset Link
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
