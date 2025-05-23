// components/AuthDialogBase.tsx
import { useState, ReactNode } from "react";

interface AuthDialogBaseProps {
  onClose: () => void;
  initialTab: "signin" | "signup";
  onSwitchTab: (tab: "signin" | "signup") => void;
  title: string;
  description: string;
  children: ReactNode;
}

export const AuthDialogBase = ({
  onClose,
  initialTab,
  onSwitchTab,
  title,
  description,
  children,
}: AuthDialogBaseProps) => {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">(initialTab);

  const handleTabClick = (tab: "signin" | "signup") => {
    setActiveTab(tab);
    onSwitchTab(tab);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-md shadow-md w-full max-w-md overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => handleTabClick("signin")}
            className={`w-1/2 py-3 text-center font-medium ${
              activeTab === "signin"
                ? "bg-gray-100"
                : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => handleTabClick("signup")}
            className={`w-1/2 py-3 text-center font-medium ${
              activeTab === "signup"
                ? "bg-gray-100"
                : "bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-gray-600 mt-1">{description}</p>
          </div>
          {children} {/* This is where the form content will go */}
        </div>
      </div>
    </div>
  );
};