import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { type System } from "../capabilities/system";
import { type PasswordResetConfirmCapability } from "../capabilities/passwordResetConfirm";

type ResetState =
  | {
      type: "form";
      password: string;
      confirmPassword: string;
      error: string | null;
    }
  | { type: "success" };

interface PasswordResetConfirmPageProps {
  system: System;
  caps: PasswordResetConfirmCapability;
}

export function PasswordResetConfirmPage({
  system,
  caps,
}: PasswordResetConfirmPageProps) {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<ResetState>({
    type: "form",
    password: "",
    confirmPassword: "",
    error: null,
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (state.type !== "form" || !token) return;

    if (state.password !== state.confirmPassword) {
      setState({ ...state, error: "Passwords do not match." });
      return;
    }
    if (state.password.length < 8) {
      setState({
        ...state,
        error: "Password must be at least 8 characters long.",
      });
      return;
    }

    system.log("Sending password reset confirmation...");
    const response = await caps.confirmPasswordReset(token, state.password);

    switch (response.type) {
      case "ok":
        setState({ type: "success" });
        break;
      case "invalidToken":
        setState({
          ...state,
          error:
            "This password reset link is invalid or has expired. Please request a new one.",
        });
        break;
      case "error":
        setState({
          ...state,
          error: `An error occurred: ${response.message}`,
        });
        break;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-8">
          {state.type === "form" ? (
            <>
              <h2 className="text-2xl font-bold text-center mb-2">
                Set New Password
              </h2>
              <p className="text-center text-gray-500 mb-6">
                Please enter your new password below.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    required
                    autoFocus
                    value={state.password}
                    onChange={(e) =>
                      setState({ ...state, password: e.target.value })
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    required
                    value={state.confirmPassword}
                    onChange={(e) =>
                      setState({ ...state, confirmPassword: e.target.value })
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {state.error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {state.error}
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Reset Password
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-center mb-4">
                Password Reset Complete
              </h2>
              <div className="text-center space-y-3">
                <p className="text-gray-500">
                  Your password has been successfully reset.
                </p>
                <Link
                  to="/login"
                  className="inline-block mt-3 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
