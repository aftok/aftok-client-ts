import {
  type SignupRequest,
  type SignupResponse,
  type UsernameCheckResponse,
  type ZAddrCheckResponse,
  apiSignup,
  apiCheckUsername,
  apiCheckZAddr,
} from "../api/account";

export interface SignupCapability {
  checkUsername: (username: string) => Promise<UsernameCheckResponse>;
  checkZAddr: (zaddr: string) => Promise<ZAddrCheckResponse>;
  signup: (req: SignupRequest) => Promise<SignupResponse>;
}

export const apiSignupCapability: SignupCapability = {
  checkUsername: apiCheckUsername,
  checkZAddr: apiCheckZAddr,
  signup: apiSignup,
};

export const mockSignupCapability: SignupCapability = {
  checkUsername: async () => ({ type: "available" }),
  checkZAddr: async () => ({ type: "valid" }),
  signup: async () => ({ type: "ok" }),
};
