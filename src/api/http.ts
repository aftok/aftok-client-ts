import { xsrfHeaders } from "./xsrf";

export async function getWithCredentials(url: string): Promise<Response> {
  return fetch(url, {
    method: "GET",
    credentials: "include",
  });
}

export async function postWithXsrf(
  url: string,
  body?: BodyInit | null,
  contentType: string = "application/json",
): Promise<Response> {
  return fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": contentType,
      ...xsrfHeaders(),
    },
    body,
  });
}

export async function putWithXsrf(
  url: string,
  body?: BodyInit | null,
  contentType: string = "application/json",
): Promise<Response> {
  return fetch(url, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": contentType,
      ...xsrfHeaders(),
    },
    body,
  });
}

export async function deleteWithXsrf(url: string): Promise<Response> {
  return fetch(url, {
    method: "DELETE",
    credentials: "include",
    headers: {
      ...xsrfHeaders(),
    },
  });
}

export async function patchWithXsrf(
  url: string,
  body: BodyInit,
  contentType: string = "application/json",
): Promise<Response> {
  return fetch(url, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": contentType,
      ...xsrfHeaders(),
    },
    body,
  });
}
