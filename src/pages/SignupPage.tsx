import { useState, useEffect, useCallback, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { type System } from "../capabilities/system";
import { type SignupCapability } from "../capabilities/signup";
import { type RecoverBy } from "../api/account";

type CommsType = "email" | "zcash";

type SignupField =
  | "username"
  | "password"
  | "confirm"
  | "email"
  | "zaddr"
  | "captcha"
  | "general";

type SignupError = {
  field: SignupField;
  message: string;
};

interface SignupPageProps {
  system: System;
  caps: SignupCapability;
  recaptchaSiteKey: string;
  onSignupComplete: () => void;
}

export function SignupPage({
  system,
  caps,
  recaptchaSiteKey: _recaptchaSiteKey,
  onSignupComplete,
}: SignupPageProps) {
  const [searchParams] = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [channel, setChannel] = useState<CommsType>("email");
  const [email, setEmail] = useState("");
  const [zaddr, setZaddr] = useState("");
  const [invitationCodes, setInvitationCodes] = useState("");
  const [errors, setErrors] = useState<SignupError[]>([]);
  const [usernameStatus, setUsernameStatus] = useState<
    "unchecked" | "available" | "taken"
  >("unchecked");
  const [zaddrStatus, setZaddrStatus] = useState<
    "unchecked" | "valid" | "invalid"
  >("unchecked");

  // Parse invitation code and zaddr from URL query params
  useEffect(() => {
    const invcode = searchParams.get("invcode");
    if (invcode) {
      setInvitationCodes(invcode);
    }
    const zaddrParam = searchParams.get("zaddr");
    if (zaddrParam) {
      setZaddr(zaddrParam);
      setChannel("zcash");
      void checkZAddr(zaddrParam);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkZAddr = useCallback(
    async (addr: string) => {
      if (!addr) return;
      const result = await caps.checkZAddr(addr);
      setZaddrStatus(result.type === "valid" ? "valid" : "invalid");
    },
    [caps],
  );

  function fieldErrors(field: SignupField): string | null {
    const err = errors.find((e) => e.field === field);
    return err ? err.message : null;
  }

  async function handleUsernameChange(value: string) {
    setUsername(value);
    if (value.length > 0) {
      const result = await caps.checkUsername(value);
      setUsernameStatus(
        result.type === "available" ? "available" : "taken",
      );
    } else {
      setUsernameStatus("unchecked");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const newErrors: SignupError[] = [];

    if (!username) {
      newErrors.push({ field: "username", message: "Username is required" });
    } else if (usernameStatus === "taken") {
      newErrors.push({
        field: "username",
        message: "Username is already taken",
      });
    }
    if (!password) {
      newErrors.push({ field: "password", message: "Password is required" });
    }
    if (!passwordConfirm) {
      newErrors.push({
        field: "confirm",
        message: "Confirm your password",
      });
    } else if (password !== passwordConfirm) {
      newErrors.push({
        field: "confirm",
        message: "Passwords do not match",
      });
    }
    if (channel === "email" && !email) {
      newErrors.push({
        field: "email",
        message: "Email address is required",
      });
    }
    if (channel === "zcash" && !zaddr) {
      newErrors.push({
        field: "zaddr",
        message: "Zcash address is required",
      });
    }
    if (channel === "zcash" && zaddrStatus === "invalid") {
      newErrors.push({
        field: "zaddr",
        message: "Not a valid Zcash address",
      });
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    const recoverBy: RecoverBy =
      channel === "email"
        ? { type: "email", email }
        : { type: "zaddr", zaddr };

    const codes = invitationCodes
      .split(/\s*,\s*/)
      .filter((c) => c.length > 0);

    system.log("Sending signup request...");
    const response = await caps.signup({
      username,
      password,
      recoverBy,
      captchaToken: "", // TODO: integrate reCAPTCHA in a later pass
      invitationCodes: codes,
    });

    switch (response.type) {
      case "ok":
        onSignupComplete();
        break;
      case "captchaInvalid":
        setErrors([
          {
            field: "captcha",
            message: "Captcha failed; please try again",
          },
        ]);
        break;
      case "zaddrInvalid":
        setErrors([
          {
            field: "zaddr",
            message: "Not a valid Zcash address",
          },
        ]);
        break;
      case "usernameTaken":
        setErrors([
          {
            field: "username",
            message: "Username is already taken",
          },
        ]);
        break;
      case "error":
        setErrors([
          {
            field: "general",
            message: response.message || "Registration failed",
          },
        ]);
        break;
    }
  }

  function renderFieldError(field: SignupField) {
    const msg = fieldErrors(field);
    if (!msg) return null;
    return (
      <span className="inline-block mt-1 px-2 py-0.5 text-sm text-red-700 bg-red-50 rounded">
        {msg}
      </span>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-2">Sign up</h1>
        <p className="text-center text-gray-500 mb-6">
          You can use either an email address or shielded zcash address for
          account recovery.
        </p>
        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Choose a handle (username)"
                required
                autoFocus
                value={username}
                onChange={(e) => void handleUsernameChange(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {usernameStatus === "taken" && (
                <span className="inline-block mt-1 px-2 py-0.5 text-sm text-red-700 bg-red-50 rounded">
                  Username is already taken
                </span>
              )}
              {renderFieldError("username")}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter a unique password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {renderFieldError("password")}
              <input
                id="passwordConfirm"
                type="password"
                placeholder="Confirm your password"
                required
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {renderFieldError("confirm")}
            </div>
            {/* Recovery channel toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recovery Method
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setChannel("email")}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    channel === "email"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setChannel("zcash")}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    channel === "zcash"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Zcash
                </button>
              </div>
            </div>
            {channel === "email" ? (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Recovery email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {renderFieldError("email")}
              </div>
            ) : (
              <div>
                <label htmlFor="zaddr" className="block text-sm font-medium text-gray-700">
                  Zcash Shielded Address
                </label>
                <input
                  id="zaddr"
                  type="text"
                  placeholder="Zcash shielded address (zs1...)"
                  value={zaddr}
                  onChange={(e) => {
                    setZaddr(e.target.value);
                    if (e.target.value) void checkZAddr(e.target.value);
                  }}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {zaddrStatus === "invalid" && (
                  <span className="inline-block mt-1 px-2 py-0.5 text-sm text-red-700 bg-red-50 rounded">
                    Not a valid Zcash address
                  </span>
                )}
                {renderFieldError("zaddr")}
              </div>
            )}
            <div>
              <label htmlFor="invitationCodes" className="block text-sm font-medium text-gray-700">
                Invitation Codes
              </label>
              <input
                id="invitationCodes"
                type="text"
                placeholder="abcdefgh, ..."
                value={invitationCodes}
                onChange={(e) => setInvitationCodes(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* reCAPTCHA placeholder */}
            <div id="grecaptcha" />
            {renderFieldError("captcha")}
            {renderFieldError("general")}
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Sign up
            </button>
          </form>
          <p className="mt-4 text-sm text-center text-gray-500">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
