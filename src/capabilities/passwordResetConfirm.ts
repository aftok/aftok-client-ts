import {
  type PasswordResetConfirmResponse,
  apiConfirmPasswordReset,
} from "../api/account";

export interface PasswordResetConfirmCapability {
  confirmPasswordReset: (
    token: string,
    newPassword: string,
  ) => Promise<PasswordResetConfirmResponse>;
}

export const apiPasswordResetConfirmCapability: PasswordResetConfirmCapability =
  {
    confirmPasswordReset: apiConfirmPasswordReset,
  };

export const mockPasswordResetConfirmCapability: PasswordResetConfirmCapability =
  {
    confirmPasswordReset: async () => ({ type: "ok" }),
  };
