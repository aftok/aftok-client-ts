const XSRF_COOKIE_NAME = "XSRF-TOKEN";
const XSRF_HEADER_NAME = "X-XSRF-TOKEN";

function getCookie(name: string): string | null {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="));
  return match
    ? decodeURIComponent(match.substring(match.indexOf("=") + 1))
    : null;
}

export function getXsrfToken(): string | null {
  return getCookie(XSRF_COOKIE_NAME);
}

export function xsrfHeaders(): Record<string, string> {
  const token = getXsrfToken();
  return token ? { [XSRF_HEADER_NAME]: token } : {};
}
