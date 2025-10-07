import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function StudentDashboard() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <Navbar />

      {/* Dashboard Header */}
      <header className="bg-blue-900 text-white py-8 text-center shadow-md">
        <h1 className="text-3xl font-bold">🎓 Student Dashboard</h1>
        <p className="mt-2 text-gray-200">Welcome to your workspace!</p>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-8 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
            <h2 className="text-xl font-semibold text-blue-900">📂 My Projects</h2>
            <p className="text-gray-600 mt-2">View and manage your ongoing capstone projects.</p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
            <h2 className="text-xl font-semibold text-blue-900">📢 Announcements</h2>
            <p className="text-gray-600 mt-2">Stay updated with the latest news from instructors.</p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
            <h2 className="text-xl font-semibold text-blue-900">👩‍🏫 Mentors</h2>
            <p className="text-gray-600 mt-2">Find and connect with your assigned mentors.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
