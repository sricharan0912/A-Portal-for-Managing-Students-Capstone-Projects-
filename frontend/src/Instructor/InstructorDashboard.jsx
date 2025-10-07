import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function InstructorDashboard() {
  const students = [
    { id: 1, name: "Alice", project: "AI Chatbot", progress: "50%" },
    { id: 2, name: "Bob", project: "E-commerce Website", progress: "75%" },
    { id: 3, name: "Charlie", project: "Healthcare App", progress: "30%" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="bg-blue-900 h-32 w-full"></div>

      <div className="flex-grow px-6 -mt-16">
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md p-8 animate-slideUp">
          <h1 className="text-2xl font-bold text-blue-900 mb-6">Instructor Dashboard</h1>
          <h2 className="text-lg font-semibold mb-4">Student Progress</h2>
          <div className="space-y-4">
            {students.map((s) => (
              <div
                key={s.id}
                className="bg-gray-50 p-4 rounded-lg shadow hover:shadow-lg transition flex justify-between"
              >
                <div>
                  <h3 className="text-blue-800 font-semibold">{s.name}</h3>
                  <p className="text-gray-600 text-sm">Project: {s.project}</p>
                </div>
                <span className="text-cyan-600 font-bold">{s.progress}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
