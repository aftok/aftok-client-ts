import { useState, useEffect, useCallback } from "react";
import { type System } from "../capabilities/system";
import { type AccountSettingsCapability } from "../capabilities/accountSettings";
import { type AccountSettings } from "../types/domain";

interface AccountSettingsPageProps {
  system: System;
  caps: AccountSettingsCapability;
}

type Feedback = { type: "success" | "error"; message: string } | null;

const GITHUB_LOAD_TIMEOUT_MS = 10_000;

export function AccountSettingsPage({
  system,
  caps,
}: AccountSettingsPageProps) {
  const [settings, setSettings] = useState<AccountSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const [validating, setValidating] = useState(false);
  const [addressValid, setAddressValid] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [paymentFeedback, setPaymentFeedback] = useState<Feedback>(null);
  const [gitHubFeedback, setGitHubFeedback] = useState<Feedback>(null);
  const [gitHubUsername, setGitHubUsername] = useState<string | null>(null);
  const [gitHubLoading, setGitHubLoading] = useState(true);
  const [gitHubLinking, setGitHubLinking] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    const result = await caps.getSettings();
    if (result.type === "right") {
      setSettings(result.value);
    } else {
      system.error("Failed to load account settings");
    }
    setLoading(false);
  }, [caps, system]);

  // Fetches the linked GitHub username with timeout + abort support.
  // Returns the username (or null) on success, or undefined if the request
  // failed or was aborted.
  const fetchGitHubUsername = useCallback(
    async (signal: AbortSignal): Promise<string | null | undefined> => {
      setGitHubLoading(true);
      const result = await caps.getGitHubUsername(signal);
      if (signal.aborted) {
        return undefined;
      }
      setGitHubLoading(false);
      if (result.type === "right") {
        setGitHubUsername(result.value);
        return result.value;
      }
      return undefined;
    },
    [caps],
  );

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  // Initial GitHub username load with 10s timeout and unmount cancellation.
  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
      setGitHubLoading(false);
      setGitHubFeedback({
        type: "error",
        message:
          "Couldn't load GitHub link status — try again later.",
      });
    }, GITHUB_LOAD_TIMEOUT_MS);

    void (async () => {
      const result = await caps.getGitHubUsername(controller.signal);
      if (controller.signal.aborted) {
        return;
      }
      window.clearTimeout(timeoutId);
      setGitHubLoading(false);
      if (result.type === "right") {
        setGitHubUsername(result.value);
      } else {
        setGitHubFeedback({
          type: "error",
          message:
            "Couldn't load GitHub link status — try again later.",
        });
      }
    })();

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [caps]);

  // Check URL params for OAuth callback result. For "linked", trust the
  // refetch result rather than the URL param.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const githubStatus = params.get("github");
    if (githubStatus !== "linked" && githubStatus !== "error") {
      return;
    }
    window.history.replaceState({}, "", window.location.pathname);

    if (githubStatus === "error") {
      const reason = params.get("reason") ?? "unknown";
      setGitHubFeedback({
        type: "error",
        message: `Failed to link GitHub account: ${reason}`,
      });
      return;
    }

    // githubStatus === "linked": verify via refetch before reporting success.
    const controller = new AbortController();
    void (async () => {
      const username = await fetchGitHubUsername(controller.signal);
      if (controller.signal.aborted) return;
      if (typeof username === "string" && username.length > 0) {
        setGitHubFeedback({
          type: "success",
          message: "GitHub account linked successfully.",
        });
      } else {
        setGitHubFeedback({
          type: "error",
          message:
            "GitHub link did not complete. Please try linking again.",
        });
      }
    })();
  }, [fetchGitHubUsername]);

  const handleLinkGitHub = async () => {
    setGitHubLinking(true);
    setGitHubFeedback(null);
    const result = await caps.initGitHubOAuth();
    if (result.type === "right") {
      const authUrl = result.value.authUrl;
      if (authUrl.startsWith("https://github.com/")) {
        window.location.href = authUrl;
        return;
      }
      setGitHubFeedback({
        type: "error",
        message: "Server returned an invalid GitHub authorization URL.",
      });
      setGitHubLinking(false);
      return;
    }
    const message =
      result.value.type === "error" && result.value.status === 501
        ? "GitHub OAuth is not configured on this server."
        : "Failed to start GitHub linking.";
    setGitHubFeedback({ type: "error", message });
    setGitHubLinking(false);
  };

  const handleUnlinkGitHub = async () => {
    const confirmed = window.confirm(
      "Unlink your GitHub account? You'll need to redo the OAuth flow to relink.",
    );
    if (!confirmed) return;

    setGitHubFeedback(null);
    const result = await caps.unlinkGitHub();
    if (result.type === "right") {
      setGitHubUsername(null);
      setGitHubFeedback({
        type: "success",
        message: "GitHub account unlinked.",
      });
    } else {
      setGitHubFeedback({
        type: "error",
        message: "Failed to unlink GitHub account.",
      });
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setAddressInput(settings?.zcashAddress ?? "");
    setAddressValid(null);
    setPaymentFeedback(null);
  };

  const handleCancel = () => {
    setEditing(false);
    setAddressInput("");
    setAddressValid(null);
  };

  useEffect(() => {
    if (!editing || addressInput.trim() === "") {
      setAddressValid(null);
      return;
    }
    const timer = setTimeout(async () => {
      setValidating(true);
      const result = await caps.checkZAddr(addressInput.trim());
      setAddressValid(result.type === "valid");
      setValidating(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [addressInput, editing, caps]);

  const handleSave = async () => {
    if (!addressValid) return;
    setSaving(true);
    setPaymentFeedback(null);
    const result = await caps.setPaymentAddress(addressInput.trim());
    if (result.type === "right") {
      setPaymentFeedback({
        type: "success",
        message: "Payment address saved.",
      });
      setEditing(false);
      await loadSettings();
    } else {
      setPaymentFeedback({
        type: "error",
        message: "Failed to save address. Please try again.",
      });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-gray-500">Loading settings...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <p className="text-red-600">Failed to load settings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h1>

      {/* Username */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-500 mb-1">
          Username
        </label>
        <p className="text-gray-900">{settings.username}</p>
      </div>

      {/* Zcash Payment Address */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-500 mb-1">
          Zcash Payment Address
        </label>
        {!editing ? (
          <div className="flex items-center gap-4">
            <p className="text-gray-900 font-mono text-sm break-all">
              {settings.zcashAddress ?? (
                <span className="text-gray-400 italic">Not configured</span>
              )}
            </p>
            <button
              onClick={handleEdit}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              {settings.zcashAddress ? "Edit" : "Set Address"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Enter your Zcash address"
              className="w-full px-3 py-2 bg-white text-gray-900 rounded border border-gray-300 focus:border-blue-500 focus:outline-none font-mono text-sm"
            />
            {validating && (
              <p className="text-sm text-gray-500">Validating address...</p>
            )}
            {!validating && addressValid === true && (
              <p className="text-sm text-green-600">Valid address</p>
            )}
            {!validating && addressValid === false && (
              <p className="text-sm text-red-600">Invalid Zcash address</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={!addressValid || saving}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {paymentFeedback && (
          <div
            className={`mt-3 p-3 rounded text-sm ${
              paymentFeedback.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {paymentFeedback.message}
          </div>
        )}
      </div>

      {/* GitHub Account */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-500 mb-1">
          GitHub Account
        </label>
        {gitHubLoading ? (
          <p className="text-gray-500">Loading...</p>
        ) : gitHubUsername ? (
          <div className="flex items-center gap-4">
            <p className="text-gray-900">@{gitHubUsername}</p>
            <button
              onClick={handleUnlinkGitHub}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Unlink
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <p className="text-gray-400 italic">Not linked</p>
            <button
              onClick={handleLinkGitHub}
              disabled={gitHubLinking}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {gitHubLinking ? "Redirecting..." : "Link GitHub Account"}
            </button>
          </div>
        )}
        {gitHubFeedback && (
          <div
            className={`mt-3 p-3 rounded text-sm ${
              gitHubFeedback.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {gitHubFeedback.message}
          </div>
        )}
      </div>
    </div>
  );
}
