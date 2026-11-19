import type { Metadata } from "next";

/** Shown when no ?code= is given. This site is the fallback for when the origin is down. */
export const DEFAULT_CODE = 521;

const STATUS: Record<number, [string, string]> = {
  400: ["Bad Request", "The server could not understand the request."],
  401: ["Unauthorized", "Authentication is required to view this resource."],
  403: ["Forbidden", "You don't have permission to access this resource."],
  404: ["Not Found", "The requested resource was not found on this server."],
  408: ["Request Timeout", "The server timed out waiting for the request."],
  429: ["Too Many Requests", "Slow down and try again in a moment."],
  500: ["Internal Server Error", "Something went wrong on the server."],
  502: ["Bad Gateway", "The upstream server returned an invalid response."],
  503: ["Service Unavailable", "This service is temporarily offline."],
  504: ["Gateway Timeout", "The upstream server took too long to respond."],
  // Cloudflare's origin errors
  520: ["Web Server Returned an Unknown Error", "The origin server sent back something unexpected."],
  521: ["Web Server Is Down", "The server behind this domain isn't responding right now."],
  522: ["Connection Timed Out", "The origin server didn't answer the connection in time."],
  523: ["Origin Is Unreachable", "The origin server could not be reached."],
  524: ["A Timeout Occurred", "The origin server took too long to respond."],
  525: ["SSL Handshake Failed", "A secure connection to the origin could not be made."],
  526: ["Invalid SSL Certificate", "The origin's SSL certificate could not be validated."],
};

export function describe(code: number): [string, string] {
  return (
    STATUS[code] ??
    (code >= 500
      ? ["Server Error", "The server failed to complete the request."]
      : ["Client Error", "The request could not be completed."])
  );
}

/** Metadata for every page that renders the error screen. */
export function errorMetadata(): Metadata {
  return { title: `${DEFAULT_CODE} ${describe(DEFAULT_CODE)[0]}`, robots: { index: false } };
}
