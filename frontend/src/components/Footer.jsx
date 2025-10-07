export default function Footer() {
  return (
    <footer className="bg-blue-900 text-gray-200 text-center py-6 mt-10">
      <p>© {new Date().getFullYear()} Capstone Hub. All rights reserved.</p>
      <p>
        Contact:{" "}
        <a href="mailto:support@capstonehub.com" className="underline hover:text-cyan-400">
          support@capstonehub.com
        </a>
      </p>
    </footer>
  );
}
