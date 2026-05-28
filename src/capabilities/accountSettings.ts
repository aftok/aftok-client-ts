import { type Either, right } from "../types/either";
import { type APIError } from "../types/api";
import { type AccountSettings } from "../types/domain";
import { type ZAddrCheckResponse } from "../api/account";
import { apiGetAccountSettings, apiSetPaymentAddress } from "../api/accountSettings";
import { apiCheckZAddr } from "../api/account";
import {
  type GitHubOAuthInitResponse,
  apiGetGitHubUsername,
  apiInitGitHubOAuth,
  apiUnlinkGitHub,
} from "../api/github";

export interface AccountSettingsCapability {
  getSettings: () => Promise<Either<APIError, AccountSettings>>;
  setPaymentAddress: (zaddr: string) => Promise<Either<APIError, void>>;
  checkZAddr: (zaddr: string) => Promise<ZAddrCheckResponse>;
  getGitHubUsername: (
    signal?: AbortSignal,
  ) => Promise<Either<APIError, string | null>>;
  initGitHubOAuth: () => Promise<Either<APIError, GitHubOAuthInitResponse>>;
  unlinkGitHub: () => Promise<Either<APIError, void>>;
}

export const apiAccountSettingsCapability: AccountSettingsCapability = {
  getSettings: apiGetAccountSettings,
  setPaymentAddress: apiSetPaymentAddress,
  checkZAddr: apiCheckZAddr,
  getGitHubUsername: apiGetGitHubUsername,
  initGitHubOAuth: apiInitGitHubOAuth,
  unlinkGitHub: apiUnlinkGitHub,
};

export const mockAccountSettingsCapability: AccountSettingsCapability = {
  getSettings: async () =>
    right({
      username: "testuser",
      zcashAddress: null,
    }),
  setPaymentAddress: async () => right(undefined),
  checkZAddr: async () => ({ type: "valid" }),
  getGitHubUsername: async () => right(null),
  initGitHubOAuth: async () =>
    right({ authUrl: "https://github.com/login/oauth/authorize?mock=true" }),
  unlinkGitHub: async () => right(undefined),
};
