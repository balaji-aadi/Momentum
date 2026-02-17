import { useEffect, useState } from "react";

const WorkInProgress = () => {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-themeBG px-4">
      <div className="text-center bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">
          Work in Progress{dots}
        </h1>
        <p className="text-gray-600 mt-2">
          We are currently working on something awesome.
        </p>
        <p className="text-gray-500 text-sm mt-1">Stay tuned for updates!</p>
      </div>
    </div>
  );
};

export default WorkInProgress;
