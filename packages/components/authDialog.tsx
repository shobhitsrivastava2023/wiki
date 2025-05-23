// components/AuthDialogs.tsx (or wherever you prefer to keep them)
"use client"; // Keep this if these are client components in Next.js

import { useState } from "react";
import { AuthDialogBase } from "./authDialogBase";
 // Adjust path as needed

interface SignInDialogProps {
  onClose: () => void;
  setIsSignUpOpen: (isOpen: boolean) => void;
}

export const SignInDialog = ({ onClose, setIsSignUpOpen }: SignInDialogProps) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle sign-in logic here (e.g., API call)
    console.log("Sign In:", { email, password, rememberMe });
    onClose();
  };

  const handleSwitchTab = (tab: "signin" | "signup") => {
    if (tab === "signup") {
      onClose(); // Close current dialog
      setIsSignUpOpen(true); // Open sign-up dialog
    }
    // No action needed for 'signin' as we are already in sign-in dialog
  };

  return (
    <AuthDialogBase
      onClose={onClose}
      initialTab="signin"
      onSwitchTab={handleSwitchTab}
      title="Sign In"
      description="Enter your email below to login to your account"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-gray-700 font-medium mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="password" className="block text-gray-700 font-medium">
              Password
            </label>
            <a href="#" className="text-sm text-gray-900 hover:underline">
              Forgot your password?
            </a>
          </div>
          <input
            type="password"
            id="password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="remember"
            className="h-4 w-4 text-gray-900 focus:ring-gray-400 border-gray-300 rounded"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <label htmlFor="remember" className="ml-2 block text-gray-700">
            Remember me
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2"
        >
          Login
        </button>
      </form>
    </AuthDialogBase>
  );
};

interface SignUpDialogProps {
  onClose: () => void;
  setIsSignInOpen: (isOpen: boolean) => void;
}

export const SignUpDialog = ({ onClose, setIsSignInOpen }: SignUpDialogProps) => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle sign-up logic here (e.g., API call)
    console.log("Sign Up:", { email, password });
    onClose();
  };

  const handleSwitchTab = (tab: "signin" | "signup") => {
    if (tab === "signin") {
      onClose(); // Close current dialog
      setIsSignInOpen(true); // Open sign-in dialog
    }
    // No action needed for 'signup' as we are already in sign-up dialog
  };

  return (
    <AuthDialogBase
      onClose={onClose}
      initialTab="signup"
      onSwitchTab={handleSwitchTab}
      title="Sign Up"
      description="Create a new account to get started"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-gray-700 font-medium mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-gray-700 font-medium mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
            placeholder="confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2"
        >
          Create Account
        </button>
      </form>
    </AuthDialogBase>
  );
};