import { type LoginResponse, apiLogin, apiCheckLogin, apiLogout } from "../api/account";

export interface LoginCapability {
  login: (username: string, password: string) => Promise<LoginResponse>;
  checkLogin: () => Promise<LoginResponse>;
  logout: () => Promise<void>;
}

export const apiLoginCapability: LoginCapability = {
  login: apiLogin,
  checkLogin: apiCheckLogin,
  logout: apiLogout,
};

export const mockLoginCapability: LoginCapability = {
  login: async () => ({ type: "ok" }),
  checkLogin: async () => ({ type: "ok" }),
  logout: async () => {},
};
