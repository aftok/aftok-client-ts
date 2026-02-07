import { getWithCredentials, postWithXsrf } from "./http";

// --- Login ---

export type LoginResponse =
  | { type: "ok" }
  | { type: "forbidden" }
  | { type: "error"; status: number | null; message: string };

export async function apiLogin(
  username: string,
  password: string,
): Promise<LoginResponse> {
  try {
    const response = await postWithXsrf(
      "/api/login",
      JSON.stringify({ username, password }),
    );
    switch (response.status) {
      case 200:
      case 204:
        return { type: "ok" };
      case 401:
      case 403:
        return { type: "forbidden" };
      default:
        return {
          type: "error",
          status: response.status,
          message: response.statusText,
        };
    }
  } catch (e) {
    return {
      type: "error",
      status: null,
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function apiCheckLogin(): Promise<LoginResponse> {
  try {
    const response = await getWithCredentials("/api/login/check");
    if (response.status === 200) {
      return { type: "ok" };
    }
    return { type: "forbidden" };
  } catch (e) {
    return {
      type: "error",
      status: null,
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function apiLogout(): Promise<void> {
  await getWithCredentials("/api/logout");
}

// --- Signup ---

export type RecoverBy =
  | { type: "email"; email: string }
  | { type: "zaddr"; zaddr: string };

export interface SignupRequest {
  username: string;
  password: string;
  recoverBy: RecoverBy;
  captchaToken: string;
  invitationCodes: string[];
}

export type SignupResponse =
  | { type: "ok" }
  | { type: "captchaInvalid" }
  | { type: "zaddrInvalid" }
  | { type: "usernameTaken" }
  | { type: "error"; status: number | null; message: string };

export type UsernameCheckResponse =
  | { type: "available" }
  | { type: "taken" };

export type ZAddrCheckResponse =
  | { type: "valid" }
  | { type: "invalid" };

export async function apiCheckUsername(
  username: string,
): Promise<UsernameCheckResponse> {
  try {
    const response = await getWithCredentials(
      `/api/check_username?username=${encodeURIComponent(username)}`,
    );
    if (response.status === 200) {
      const json = (await response.json()) as { usernameAvailable?: boolean };
      if (json.usernameAvailable === true) {
        return { type: "available" };
      }
    }
    return { type: "taken" };
  } catch {
    return { type: "taken" };
  }
}

export async function apiCheckZAddr(
  zaddr: string,
): Promise<ZAddrCheckResponse> {
  try {
    const response = await getWithCredentials(
      `/api/validate_zaddr?zaddr=${encodeURIComponent(zaddr)}`,
    );
    if (response.status === 200) {
      const json = (await response.json()) as { zaddrValid?: boolean };
      if (json.zaddrValid === true) {
        return { type: "valid" };
      }
    }
    return { type: "invalid" };
  } catch {
    return { type: "invalid" };
  }
}

export async function apiSignup(
  req: SignupRequest,
): Promise<SignupResponse> {
  try {
    const body = JSON.stringify({
      username: req.username,
      password: req.password,
      recoveryType: req.recoverBy.type === "email" ? "email" : "zaddr",
      recoveryEmail:
        req.recoverBy.type === "email" ? req.recoverBy.email : null,
      recoveryZAddr:
        req.recoverBy.type === "zaddr" ? req.recoverBy.zaddr : null,
      captchaToken: req.captchaToken,
      invitation_codes: req.invitationCodes,
    });
    const response = await postWithXsrf("/api/register", body);
    switch (response.status) {
      case 200:
        return { type: "ok" };
      case 403:
        return { type: "captchaInvalid" };
      case 400:
        return { type: "zaddrInvalid" };
      default:
        return {
          type: "error",
          status: response.status,
          message: response.statusText,
        };
    }
  } catch (e) {
    return {
      type: "error",
      status: null,
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

// --- Password Reset ---

export type PasswordResetRequestBody =
  | { type: "username"; username: string }
  | { type: "email"; email: string };

export type PasswordResetRequestResponse =
  | { type: "sent" }
  | { type: "error"; status: number | null; message: string };

export type PasswordResetConfirmResponse =
  | { type: "ok" }
  | { type: "invalidToken" }
  | { type: "error"; status: number | null; message: string };

export async function apiRequestPasswordReset(
  req: PasswordResetRequestBody,
): Promise<PasswordResetRequestResponse> {
  try {
    const body = JSON.stringify(
      req.type === "username"
        ? { username: req.username, email: null }
        : { username: null, email: req.email },
    );
    const response = await postWithXsrf(
      "/api/password-reset/request",
      body,
    );
    if (response.status === 200) {
      return { type: "sent" };
    }
    return {
      type: "error",
      status: response.status,
      message: response.statusText,
    };
  } catch (e) {
    return {
      type: "error",
      status: null,
      message: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function apiConfirmPasswordReset(
  token: string,
  newPassword: string,
): Promise<PasswordResetConfirmResponse> {
  try {
    const body = JSON.stringify({ token, newPassword });
    const response = await postWithXsrf(
      "/api/password-reset/reset",
      body,
    );
    switch (response.status) {
      case 200:
      case 204:
        return { type: "ok" };
      case 400:
        return { type: "invalidToken" };
      default:
        return {
          type: "error",
          status: response.status,
          message: response.statusText,
        };
    }
  } catch (e) {
    return {
      type: "error",
      status: null,
      message: e instanceof Error ? e.message : String(e),
    };
  }
}
