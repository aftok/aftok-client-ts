import {
  type ValidateTokenResponse,
  type PasswordResetConfirmResponse,
  apiValidateResetToken,
  apiConfirmPasswordReset,
} from "../api/account";

export interface PasswordResetConfirmCapability {
  validateToken: (token: string) => Promise<ValidateTokenResponse>;
  confirmPasswordReset: (
    token: string,
    newPassword: string,
  ) => Promise<PasswordResetConfirmResponse>;
}

export const apiPasswordResetConfirmCapability: PasswordResetConfirmCapability =
  {
    validateToken: apiValidateResetToken,
    confirmPasswordReset: apiConfirmPasswordReset,
  };

export const mockPasswordResetConfirmCapability: PasswordResetConfirmCapability =
  {
    validateToken: async () => ({ type: "valid" }),
    confirmPasswordReset: async () => ({ type: "ok" }),
  };
