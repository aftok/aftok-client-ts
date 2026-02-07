/** Zatoshi — smallest unit of ZEC. 1 ZEC = 100,000,000 zatoshi. */
export type Zatoshi = bigint;

const ZATOSHI_PER_ZEC = 100_000_000n;

/** Convert zatoshi to a ZEC decimal string (8 decimal places). */
export function zecString(z: Zatoshi): string {
  const whole = z / ZATOSHI_PER_ZEC;
  const frac = z % ZATOSHI_PER_ZEC;
  const fracStr = String(frac < 0n ? -frac : frac).padStart(8, "0");
  const sign = z < 0n && whole === 0n ? "-" : "";
  return `${sign}${whole}.${fracStr}`;
}

/** Parse a ZEC decimal string to zatoshi. Returns null on invalid input. */
export function parseZec(s: string): Zatoshi | null {
  const trimmed = s.trim();
  if (trimmed === "") return null;

  const match = /^(-?)(\d+)(?:\.(\d{0,8}))?$/.exec(trimmed);
  if (!match) return null;

  const neg = match[1] === "-";
  const whole = BigInt(match[2] ?? "0");
  const fracStr = (match[3] ?? "").padEnd(8, "0");
  const frac = BigInt(fracStr);
  const result = whole * ZATOSHI_PER_ZEC + frac;
  return neg ? -result : result;
}

/** Format zatoshi as a human-readable ZEC string with unit suffix. */
export function formatZec(z: Zatoshi): string {
  return `${zecString(z)} ZEC`;
}
