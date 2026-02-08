import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { type System } from "../capabilities/system";
import { type AcceptInviteCapability } from "../capabilities/acceptInvite";

type PageState =
  | { type: "checking" }
  | { type: "accepting" }
  | { type: "success" }
  | { type: "alreadyAccepted" }
  | { type: "expired" }
  | { type: "notFound" }
  | { type: "missingCode" }
  | { type: "error"; message: string };

interface AcceptInvitePageProps {
  system: System;
  caps: AcceptInviteCapability;
}

export function AcceptInvitePage({ system, caps }: AcceptInvitePageProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<PageState>({ type: "checking" });
  const invCode = searchParams.get("invcode");

  useEffect(() => {
    if (!invCode) {
      setState({ type: "missingCode" });
      return;
    }

    let cancelled = false;

    async function run() {
      // Check if user is logged in
      const loginResult = await caps.checkLogin();
      if (cancelled) return;

      if (loginResult.type !== "ok") {
        // Not logged in — redirect to login with returnTo
        const returnTo = `/accept-invite?invcode=${encodeURIComponent(invCode!)}`;
        navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`, {
          replace: true,
        });
        return;
      }

      // User is authenticated — accept the invitation
      setState({ type: "accepting" });
      system.log(`Accepting invitation ${invCode}...`);
      const result = await caps.acceptInvitation(invCode!);
      if (cancelled) return;

      switch (result.type) {
        case "ok":
          setState({ type: "success" });
          break;
        case "alreadyAccepted":
          setState({ type: "alreadyAccepted" });
          break;
        case "expired":
          setState({ type: "expired" });
          break;
        case "notFound":
          setState({ type: "notFound" });
          break;
        case "error":
          system.error(`Accept invitation error: ${result.message}`);
          setState({ type: "error", message: result.message });
          break;
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [invCode, caps, navigate, system]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {(state.type === "checking" || state.type === "accepting") && (
          <>
            <h1 className="text-2xl font-bold mb-4">Accepting Invitation</h1>
            <p className="text-gray-500">Please wait...</p>
          </>
        )}

        {state.type === "success" && (
          <>
            <h1 className="text-2xl font-bold mb-4 text-green-700">
              You've joined the project!
            </h1>
            <p className="text-gray-600 mb-6">
              The invitation has been accepted. You can now see this project in
              your overview.
            </p>
            <Link
              to="/overview"
              className="inline-block py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Overview
            </Link>
          </>
        )}

        {state.type === "alreadyAccepted" && (
          <>
            <h1 className="text-2xl font-bold mb-4">Already Accepted</h1>
            <p className="text-gray-600 mb-6">
              This invitation has already been used. If you've already joined
              the project, you can find it in your overview.
            </p>
            <Link
              to="/overview"
              className="inline-block py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Overview
            </Link>
          </>
        )}

        {state.type === "expired" && (
          <>
            <h1 className="text-2xl font-bold mb-4 text-red-700">
              Invitation Expired
            </h1>
            <p className="text-gray-600 mb-6">
              This invitation has expired. Please ask the project owner to send
              a new invitation.
            </p>
          </>
        )}

        {state.type === "notFound" && (
          <>
            <h1 className="text-2xl font-bold mb-4 text-red-700">
              Invalid Invitation
            </h1>
            <p className="text-gray-600 mb-6">
              This invitation code was not found. Please check the link and try
              again.
            </p>
          </>
        )}

        {state.type === "missingCode" && (
          <>
            <h1 className="text-2xl font-bold mb-4 text-red-700">
              Missing Invitation Code
            </h1>
            <p className="text-gray-600 mb-6">
              No invitation code was provided. Please use the link from your
              invitation email.
            </p>
          </>
        )}

        {state.type === "error" && (
          <>
            <h1 className="text-2xl font-bold mb-4 text-red-700">Error</h1>
            <p className="text-gray-600 mb-6">
              Something went wrong: {state.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-block py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}
