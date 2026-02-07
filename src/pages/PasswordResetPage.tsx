import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { type System } from "../capabilities/system";
import { type PasswordResetCapability } from "../capabilities/passwordReset";

type ResetState =
  | { type: "form"; email: string; error: string | null }
  | { type: "success" };

interface PasswordResetPageProps {
  system: System;
  caps: PasswordResetCapability;
}

export function PasswordResetPage({ system, caps }: PasswordResetPageProps) {
  const [state, setState] = useState<ResetState>({
    type: "form",
    email: "",
    error: null,
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (state.type !== "form") return;

    system.log("Sending password reset request...");
    const response = await caps.requestPasswordReset({
      type: "email",
      email: state.email,
    });

    switch (response.type) {
      case "sent":
        setState({ type: "success" });
        break;
      case "error":
        setState({ ...state, error: response.message });
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
                Reset Password
              </h2>
              <p className="text-center text-gray-500 mb-6">
                Enter your email address and we'll send you a link to reset
                your password.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="sr-only">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Email address"
                    required
                    autoFocus
                    value={state.email}
                    onChange={(e) =>
                      setState({ ...state, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  Send Reset Link
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-center mb-4">
                Check Your Email
              </h2>
              <div className="text-center space-y-3">
                <p className="text-gray-500">
                  If an account with that email exists, we've sent you a
                  password reset link.
                </p>
                <p className="text-gray-500">
                  Please check your inbox and follow the instructions to reset
                  your password.
                </p>
                <p className="text-gray-400 text-sm mt-4">
                  Didn't receive the email? Check your spam folder or try
                  again.
                </p>
              </div>
            </>
          )}
          <p className="mt-4 text-sm text-center text-gray-500">
            Remember your password?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
