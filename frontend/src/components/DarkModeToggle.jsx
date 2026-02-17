import { useState, useEffect } from "react";

const DarkModeToggle = () => {
  const [theme, setTheme] = useState(
    typeof window !== "undefined" && localStorage.getItem("theme") === "dark"
      ? "dark"
      : "light"
  );

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative w-12 h-5 flex items-center bg-gray-300 dark:bg-gray-600 rounded-full p-1 transition duration-300"
    >
      <div
        className={`w-3 h-3 dark:bg-yellow-500 relative rounded-full shadow-md transform transition-transform ${
          theme === "dark" ? "translate-x-7" : "translate-x-0"
        }`}
      >
        <span className="absolute -top-2 -left-[0.35rem] text-lg">
          {theme === "light" && "☀️"}
        </span>
      </div>
    </button>
  );
};

export default DarkModeToggle;
