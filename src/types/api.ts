export type APIError =
  | { type: "forbidden" }
  | { type: "parseFailure"; message: string }
  | { type: "error"; status: number; message: string };

export type CommsType = "email" | "zcash";

export type CommsAddress =
  | { type: "email"; email: string }
  | { type: "zcash"; zaddr: string };

export type Zip321Request = string;
