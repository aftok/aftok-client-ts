import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { type System } from "../capabilities/system";
import { type LoginCapability } from "../capabilities/login";

type LoginError = "forbidden" | "serverError";

interface LoginPageProps {
  system: System;
  caps: LoginCapability;
  onLoginComplete: (username: string, returnTo?: string) => void;
}

export function LoginPage({ system, caps, onLoginComplete }: LoginPageProps) {
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<LoginError | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    system.log("Sending login request...");
    const response = await caps.login(username, password);
    switch (response.type) {
      case "ok": {
        const returnTo = searchParams.get("returnTo") ?? undefined;
        onLoginComplete(username, returnTo);
        break;
      }
      case "forbidden":
        setLoginError("forbidden");
        break;
      case "error":
        system.error(`Login error: ${response.message}`);
        setLoginError("serverError");
        break;
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-center mb-6">Sign In</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Username"
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {loginError === "forbidden"
                  ? "Login failed. Check your username and password."
                  : "Login failed due to an internal error. Please contact support."}
              </div>
            )}
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Sign in
            </button>
          </form>
          <p className="mt-4 text-sm text-center text-gray-500">
            Need an account?{" "}
            <Link to="/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>
          <p className="mt-2 text-sm text-center text-gray-500">
            <Link
              to="/password-reset"
              className="text-blue-600 hover:underline"
            >
              Forgot password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
