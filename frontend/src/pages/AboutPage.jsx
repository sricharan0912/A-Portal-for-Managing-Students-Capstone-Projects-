import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function AboutPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Enter a valid email";
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      console.log("Form submitted:", formData);
      alert("Message sent successfully!");
      setIsOpen(false);
      setFormData({ name: "", email: "", message: "" });
    }
  };

  return (
    <div className="flex flex-col min-h-screen page-fade">
      {/* Navbar */}
      <Navbar />

      {/* Blue banner */}
      <div className="bg-blue-900 h-32 w-full"></div>

      {/* About Content */}
      <div className="flex-grow flex flex-col items-center -mt-16 px-6">
        <div className="w-full max-w-5xl bg-white rounded-xl shadow-md p-10 animate-slideUp text-center">
          <h1 className="text-3xl font-bold text-blue-900 mb-6">
            About Capstone Hub
          </h1>
          <p className="text-gray-700 mb-10">
            Capstone Hub is a collaborative platform that connects{" "}
            <span className="font-semibold">students</span>,{" "}
            <span className="font-semibold">instructors</span>, and{" "}
            <span className="font-semibold">clients</span> to work on impactful projects.  
            Our mission is to bridge education with real-world innovation.
          </p>

          {/* Our Story */}
          <div className="bg-gray-50 p-6 rounded-lg shadow mb-12">
            <h3 className="text-xl font-semibold text-blue-900 mb-2">📖 Our Story</h3>
            <p className="text-gray-600">
              This project was born out of our desire to solve a gap: students often
              struggle to find real-world projects, while clients need fresh
              solutions. Capstone Hub was designed to bridge this gap, fostering
              collaboration and innovation in a single platform.
            </p>
          </div>

          {/* Mission and Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-gray-100 p-6 rounded-lg shadow hover:shadow-lg transition">
              <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                🎯 Our Mission
              </h3>
              <p className="text-gray-600 mt-2">
                Empower students by providing them with opportunities to work on
                real-world problems while helping clients discover innovative solutions.
              </p>
            </div>
            <div className="bg-gray-100 p-6 rounded-lg shadow hover:shadow-lg transition">
              <h3 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
                🌍 Our Vision
              </h3>
              <p className="text-gray-600 mt-2">
                To create a thriving ecosystem where education, mentorship, and industry
                collaboration drive meaningful change.
              </p>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="bg-gray-50 p-6 rounded-lg shadow mb-12">
            <h3 className="text-xl font-semibold text-blue-900 mb-2">🛠️ Tech Stack</h3>
            <p className="text-gray-600">
              We built Capstone Hub using modern web technologies:
            </p>
            <ul className="flex flex-wrap justify-center gap-4 mt-4 text-sm font-medium text-gray-700">
              <li className="px-3 py-1 bg-gray-200 rounded-full">React</li>
              <li className="px-3 py-1 bg-gray-200 rounded-full">Vite</li>
              <li className="px-3 py-1 bg-gray-200 rounded-full">Tailwind CSS</li>
              <li className="px-3 py-1 bg-gray-200 rounded-full">Node.js</li>
              <li className="px-3 py-1 bg-gray-200 rounded-full">Express</li>
              <li className="px-3 py-1 bg-gray-200 rounded-full">MongoDB</li>
              <li className="px-3 py-1 bg-gray-200 rounded-full">GitHub</li>
            </ul>
          </div>

          {/* Goals & Outcomes */}
          <div className="bg-gray-50 p-6 rounded-lg shadow mb-12">
            <h3 className="text-xl font-semibold text-blue-900 mb-2">🎓 Project Goals & Outcomes</h3>
            <p className="text-gray-600">
              Our goal was to create a platform for collaboration between students,
              instructors, and clients. We successfully built a system with
              authentication, project posting, and team management, demonstrating
              how real-world problems can be tackled in an academic environment.
            </p>
          </div>

          {/* Future Vision */}
          <div className="bg-gray-50 p-6 rounded-lg shadow mb-12">
            <h3 className="text-xl font-semibold text-blue-900 mb-2">🚀 Future Vision</h3>
            <p className="text-gray-600">
              In the future, we plan to enhance Capstone Hub with features such as AI-based
              project recommendations, real-time chat, and LinkedIn integration to help
              students showcase their work to potential employers.
            </p>
          </div>

          {/* Meet Our Team */}
          <h2 className="text-2xl font-bold text-blue-900 mb-8">👥 Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Member 1 */}
            <div className="bg-gray-50 p-6 rounded-lg shadow hover:shadow-lg transition">
              <h3 className="text-lg font-semibold">Sri Charan Tadiparthi</h3>
              <p className="text-gray-600 mb-3">Full Stack Developer</p>
              <div className="flex justify-center space-x-4">
                <a href="https://github.com/sricharan0912" target="_blank" className="text-blue-600 hover:underline">GitHub</a>
                <a href="https://www.linkedin.com/in/sri-charan-tadiparthi-2a36b1269/" target="_blank" className="text-blue-600 hover:underline">LinkedIn</a>
              </div>
            </div>
            {/* Member 2 */}
            <div className="bg-gray-50 p-6 rounded-lg shadow hover:shadow-lg transition">
              <h3 className="text-lg font-semibold">Lohith Mudipalli</h3>
              <p className="text-gray-600 mb-3">Frontend Developer</p>
              <div className="flex justify-center space-x-4">
                <a href="https://github.com/lohith-mudipalli" target="_blank" className="text-blue-600 hover:underline">GitHub</a>
                <a href="https://linkedin.com/in/yourlinkedin2" target="_blank" className="text-blue-600 hover:underline">LinkedIn</a>
              </div>
            </div>
            {/* Member 3 */}
            <div className="bg-gray-50 p-6 rounded-lg shadow hover:shadow-lg transition">
              <h3 className="text-lg font-semibold">Bharath</h3>
              <p className="text-gray-600 mb-3">Backend Developer</p>
              <div className="flex justify-center space-x-4">
                <a href="https://github.com/bharath021" target="_blank" className="text-blue-600 hover:underline">GitHub</a>
                <a href="https://linkedin.com/in/yourlinkedin3" target="_blank" className="text-blue-600 hover:underline">LinkedIn</a>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="bg-gray-50 p-6 rounded-lg shadow text-center">
            <h3 className="text-lg font-semibold text-blue-900 flex items-center justify-center gap-2">
              ✉️ Get in Touch
            </h3>
            <p className="text-gray-600 mt-2">
              Have questions or want to collaborate with us?
            </p>
            <button
              onClick={() => setIsOpen(true)}
              className="mt-4 bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded transition"
            >
              Contact Us
            </button>
          </div>
        </div>
      </div>

      {/* Modal (Contact Form) */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md animate-slideUp relative"
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-red-500 text-xl"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold mb-4 text-center text-blue-900">
              Get in Touch
            </h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full border p-3 rounded-md ${errors.name ? "border-red-500" : ""}`}
                  placeholder="Enter your name"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full border p-3 rounded-md ${errors.email ? "border-red-500" : ""}`}
                  placeholder="Enter your email"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              <div className="text-left">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full border p-3 rounded-md"
                  placeholder="Type your message"
                  rows="4"
                ></textarea>
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
