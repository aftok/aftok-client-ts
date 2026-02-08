import { useState, useEffect, useCallback } from "react";
import { type System } from "../capabilities/system";
import { type AccountSettingsCapability } from "../capabilities/accountSettings";
import { type AccountSettings } from "../types/domain";

interface AccountSettingsPageProps {
  system: System;
  caps: AccountSettingsCapability;
}

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
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

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

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handleEdit = () => {
    setEditing(true);
    setAddressInput(settings?.zcashAddress ?? "");
    setAddressValid(null);
    setFeedback(null);
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
    setFeedback(null);
    const result = await caps.setPaymentAddress(addressInput.trim());
    if (result.type === "right") {
      setFeedback({ type: "success", message: "Payment address saved." });
      setEditing(false);
      await loadSettings();
    } else {
      setFeedback({
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
      </div>

      {/* Feedback message */}
      {feedback && (
        <div
          className={`p-3 rounded text-sm ${
            feedback.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {feedback.message}
        </div>
      )}
    </div>
  );
}
