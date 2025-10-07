import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  FaUserGraduate,
  FaChalkboardTeacher,
  FaBuilding,
  FaShieldAlt,
  FaHandshake,
  FaRocket,
  FaLinkedin,
  FaTwitter,
  FaGithub,
} from "react-icons/fa";

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center flex-1 text-center bg-gradient-to-b from-blue-50 via-white to-gray-50 py-20 px-6">
        <h2 className="text-5xl font-extrabold mb-6 text-blue-900 leading-tight animate-slideUp">
          Empowering{" "}
          <span className="text-cyan-600">Capstone Projects</span> <br />
          for Students, Instructors & Clients
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mb-8 animate-slideUp delay-1">
          Collaborate, innovate, and deliver real-world projects with a platform
          built for education and industry.
        </p>
        <div className="flex gap-4 animate-slideUp delay-2">
          <Link to="/signup">
            <button className="bg-cyan-500 hover:bg-cyan-600 text-white text-lg px-8 py-4 rounded-xl shadow-lg transition transform hover:scale-105 hover:shadow-2xl">
              Get Started
            </button>
          </Link>
          <Link to="/about">
            <button className="border-2 border-cyan-500 text-cyan-600 hover:bg-cyan-50 text-lg px-8 py-4 rounded-xl transition">
              Learn More
            </button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          {/* Students */}
          <div className="bg-white rounded-xl shadow-md p-8 transition transform hover:-translate-y-2 hover:scale-105 hover:shadow-2xl animate-slideUp delay-3">
            <FaUserGraduate className="text-cyan-600 text-4xl mb-4" />
            <h3 className="text-xl font-semibold text-blue-800 mb-2">
              Students
            </h3>
            <p className="text-gray-600">
              Work on impactful projects, gain real-world experience, and
              showcase your portfolio.
            </p>
          </div>

          {/* Instructors */}
          <div className="bg-white rounded-xl shadow-md p-8 transition transform hover:-translate-y-2 hover:scale-105 hover:shadow-2xl animate-slideUp delay-4">
            <FaChalkboardTeacher className="text-cyan-600 text-4xl mb-4" />
            <h3 className="text-xl font-semibold text-blue-800 mb-2">
              Instructors
            </h3>
            <p className="text-gray-600">
              Mentor students, monitor their progress, and connect with industry
              professionals.
            </p>
          </div>

          {/* Clients */}
          <div className="bg-white rounded-xl shadow-md p-8 transition transform hover:-translate-y-2 hover:scale-105 hover:shadow-2xl animate-slideUp delay-5">
            <FaBuilding className="text-cyan-600 text-4xl mb-4" />
            <h3 className="text-xl font-semibold text-blue-800 mb-2">Clients</h3>
            <p className="text-gray-600">
              Post projects, collaborate with students, and discover fresh
              solutions.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-blue-900 mb-12">
            Why Choose Capstone Hub?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-lg shadow hover:shadow-lg transition">
              <FaShieldAlt className="text-blue-600 text-4xl mb-4 mx-auto" />
              <h3 className="text-lg font-semibold text-blue-900">
                Secure Platform
              </h3>
              <p className="text-gray-600 mt-2">
                Your data is safe with enterprise-grade security and privacy
                controls.
              </p>
            </div>
            <div className="bg-gray-50 p-8 rounded-lg shadow hover:shadow-lg transition">
              <FaHandshake className="text-blue-600 text-4xl mb-4 mx-auto" />
              <h3 className="text-lg font-semibold text-blue-900">
                Real Collaboration
              </h3>
              <p className="text-gray-600 mt-2">
                Seamless teamwork between students, mentors, and clients.
              </p>
            </div>
            <div className="bg-gray-50 p-8 rounded-lg shadow hover:shadow-lg transition">
              <FaRocket className="text-blue-600 text-4xl mb-4 mx-auto" />
              <h3 className="text-lg font-semibold text-blue-900">
                Career Boost
              </h3>
              <p className="text-gray-600 mt-2">
                Gain real-world exposure and grow your portfolio for future
                opportunities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-gray-200 text-center py-10 mt-10">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          {/* Logo and Copy */}
          <div>
            <h3 className="font-bold text-xl">Capstone Hub</h3>
            <p className="text-sm mt-2">
              © {new Date().getFullYear()} Capstone Hub. All rights reserved.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg">Quick Links</h4>
            <ul className="mt-2 space-y-2">
              <li>
                <Link to="/" className="hover:text-cyan-400">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-cyan-400">
                  About
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-cyan-400">
                  Sign Up
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-cyan-400">
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h4 className="font-semibold text-lg">Follow Us</h4>
            <div className="flex justify-center md:justify-start gap-4 mt-2 text-xl">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-cyan-400"
              >
                <FaLinkedin />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-cyan-400"
              >
                <FaTwitter />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-cyan-400"
              >
                <FaGithub />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
