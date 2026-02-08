import { useState, useEffect, useCallback } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { type System } from "./capabilities/system";
import { type LoginCapability } from "./capabilities/login";
import { liveSystem } from "./capabilities/system.live";
import { apiLoginCapability } from "./capabilities/login";
import { apiSignupCapability } from "./capabilities/signup";
import { apiPasswordResetCapability } from "./capabilities/passwordReset";
import { apiPasswordResetConfirmCapability } from "./capabilities/passwordResetConfirm";
import { apiProjectListCapability } from "./capabilities/project";
import { apiOverviewCapability } from "./capabilities/overview";
import { apiTimelineCapability } from "./capabilities/timeline";
import { apiBillingCapability } from "./capabilities/billing";
import { apiAcceptInviteCapability } from "./capabilities/acceptInvite";
import { apiAccountSettingsCapability } from "./capabilities/accountSettings";
import { type ProjectId } from "./types/domain";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { PasswordResetPage } from "./pages/PasswordResetPage";
import { PasswordResetConfirmPage } from "./pages/PasswordResetConfirmPage";
import { OverviewPage } from "./pages/OverviewPage";
import { TimelinePage } from "./pages/TimelinePage";
import { BillingPage } from "./pages/BillingPage";
import { AcceptInvitePage } from "./pages/AcceptInvitePage";
import { AccountSettingsPage } from "./pages/AccountSettingsPage";
import { LoadingPage } from "./pages/LoadingPage";
import { NavBar } from "./components/NavBar";

// Auth guard: checks login status and redirects to /login if unauthenticated.
// Mirrors the PureScript handleQuery logic at Main.purs:250-265.
function AuthGuard({
  system,
  loginCap,
  username,
  onLogout,
  children,
}: {
  system: System;
  loginCap: LoginCapability;
  username: string | null;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const result = await loginCap.checkLogin();
      if (cancelled) return;
      if (result.type === "ok") {
        setAuthenticated(true);
      } else {
        system.log("Auth check failed, redirecting to login");
        navigate("/login", { replace: true });
      }
      setChecking(false);
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, [loginCap, navigate, system]);

  if (checking) return <LoadingPage />;
  if (!authenticated) return null;

  return (
    <>
      <NavBar username={username ?? ""} onLogout={onLogout} />
      {children}
    </>
  );
}

function AppRoutes({
  system,
  loginCap,
}: {
  system: System;
  loginCap: LoginCapability;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectId | null>(
    null,
  );
  // Default to Google test key; overwritten by server config on mount
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState(
    "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI",
  );

  const signupCap = apiSignupCapability;
  const passwordResetCap = apiPasswordResetCapability;
  const passwordResetConfirmCap = apiPasswordResetConfirmCapability;
  const projectCap = apiProjectListCapability;
  const overviewCap = apiOverviewCapability;
  const timelineCap = apiTimelineCapability;
  const billingCap = apiBillingCapability;
  const acceptInviteCap = apiAcceptInviteCapability;
  const accountSettingsCap = apiAccountSettingsCapability;

  // Fetch config on mount (mirrors PureScript Initialize action)
  useEffect(() => {
    void (async () => {
      const result = await system.fetchConfig();
      if (result.type === "right") {
        setRecaptchaSiteKey(result.value.recaptchaSiteKey);
      }
    })();
  }, [system]);

  const handleLoginComplete = useCallback(
    (user: string, returnTo?: string) => {
      setUsername(user);
      navigate(returnTo ?? "/overview");
    },
    [navigate],
  );

  const handleLogout = useCallback(async () => {
    await loginCap.logout();
    setUsername(null);
    navigate("/login");
  }, [loginCap, navigate]);

  const handleSignupComplete = useCallback(() => {
    navigate("/login");
  }, [navigate]);

  // On initial mount, if we're at the root, check auth and redirect
  useEffect(() => {
    if (location.pathname === "/" || location.pathname === "/app/") {
      void (async () => {
        const result = await loginCap.checkLogin();
        if (result.type === "ok") {
          navigate("/overview", { replace: true });
        } else {
          navigate("/login", { replace: true });
        }
      })();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <LoginPage
            system={system}
            caps={loginCap}
            onLoginComplete={handleLoginComplete}
          />
        }
      />
      <Route
        path="/signup"
        element={
          <SignupPage
            system={system}
            caps={signupCap}
            recaptchaSiteKey={recaptchaSiteKey}
            onSignupComplete={handleSignupComplete}
          />
        }
      />
      <Route
        path="/password-reset"
        element={
          <PasswordResetPage system={system} caps={passwordResetCap} />
        }
      />
      <Route
        path="/reset-confirm/:token"
        element={
          <PasswordResetConfirmPage
            system={system}
            caps={passwordResetConfirmCap}
          />
        }
      />
      <Route
        path="/accept-invite"
        element={
          <AcceptInvitePage
            system={system}
            caps={acceptInviteCap}
          />
        }
      />
      {/* Protected routes */}
      <Route
        path="/overview"
        element={
          <AuthGuard
            system={system}
            loginCap={loginCap}
            username={username}
            onLogout={handleLogout}
          >
            <OverviewPage
              system={system}
              caps={overviewCap}
              projectCaps={projectCap}
              selectedProject={selectedProject}
              onProjectChange={setSelectedProject}
            />
          </AuthGuard>
        }
      />
      <Route
        path="/timeline"
        element={
          <AuthGuard
            system={system}
            loginCap={loginCap}
            username={username}
            onLogout={handleLogout}
          >
            <TimelinePage
              system={system}
              caps={timelineCap}
              projectCaps={projectCap}
              selectedProject={selectedProject}
              onProjectChange={setSelectedProject}
            />
          </AuthGuard>
        }
      />
      <Route
        path="/billing"
        element={
          <AuthGuard
            system={system}
            loginCap={loginCap}
            username={username}
            onLogout={handleLogout}
          >
            <BillingPage
              system={system}
              caps={billingCap}
              projectCaps={projectCap}
              selectedProject={selectedProject}
              onProjectChange={setSelectedProject}
            />
          </AuthGuard>
        }
      />
      <Route
        path="/settings"
        element={
          <AuthGuard
            system={system}
            loginCap={loginCap}
            username={username}
            onLogout={handleLogout}
          >
            <AccountSettingsPage
              system={system}
              caps={accountSettingsCap}
            />
          </AuthGuard>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export function App() {
  const system = liveSystem;
  const loginCap = apiLoginCapability;

  return (
    <BrowserRouter basename="/app">
      <AppRoutes system={system} loginCap={loginCap} />
    </BrowserRouter>
  );
}
