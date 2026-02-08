import { type Either, right } from "../types/either";
import { type APIError } from "../types/api";
import { type AccountSettings } from "../types/domain";
import { type ZAddrCheckResponse } from "../api/account";
import { apiGetAccountSettings, apiSetPaymentAddress } from "../api/accountSettings";
import { apiCheckZAddr } from "../api/account";

export interface AccountSettingsCapability {
  getSettings: () => Promise<Either<APIError, AccountSettings>>;
  setPaymentAddress: (zaddr: string) => Promise<Either<APIError, void>>;
  checkZAddr: (zaddr: string) => Promise<ZAddrCheckResponse>;
}

export const apiAccountSettingsCapability: AccountSettingsCapability = {
  getSettings: apiGetAccountSettings,
  setPaymentAddress: apiSetPaymentAddress,
  checkZAddr: apiCheckZAddr,
};

export const mockAccountSettingsCapability: AccountSettingsCapability = {
  getSettings: async () =>
    right({
      username: "testuser",
      zcashAddress: null,
    }),
  setPaymentAddress: async () => right(undefined),
  checkZAddr: async () => ({ type: "valid" }),
};
