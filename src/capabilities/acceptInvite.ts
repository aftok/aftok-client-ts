import {
  type AcceptInvitationResponse,
  apiAcceptInvitation,
} from "../api/account";
import { type LoginResponse, apiCheckLogin } from "../api/account";

export interface AcceptInviteCapability {
  checkLogin: () => Promise<LoginResponse>;
  acceptInvitation: (invCode: string) => Promise<AcceptInvitationResponse>;
}

export const apiAcceptInviteCapability: AcceptInviteCapability = {
  checkLogin: apiCheckLogin,
  acceptInvitation: apiAcceptInvitation,
};
