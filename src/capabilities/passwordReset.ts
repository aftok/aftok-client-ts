import {
  type PasswordResetRequestBody,
  type PasswordResetRequestResponse,
  apiRequestPasswordReset,
} from "../api/account";

export interface PasswordResetCapability {
  requestPasswordReset: (
    req: PasswordResetRequestBody,
  ) => Promise<PasswordResetRequestResponse>;
}

export const apiPasswordResetCapability: PasswordResetCapability = {
  requestPasswordReset: apiRequestPasswordReset,
};

export const mockPasswordResetCapability: PasswordResetCapability = {
  requestPasswordReset: async () => ({ type: "sent" }),
};
