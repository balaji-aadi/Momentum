let baseUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5003";

// If accessed via a LAN IP (mobile phone / external device on the same network) rather than localhost,
// automatically point the API and Socket to the same LAN host IP where the frontend is being served from.
if (
  typeof window !== "undefined" &&
  window.location.hostname &&
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1" &&
  !window.location.hostname.includes("vercel.app")
) {
  baseUrl = baseUrl.replace("localhost", window.location.hostname).replace("127.0.0.1", window.location.hostname);
}

export const serverUrl = baseUrl;
export const server = `${serverUrl}/api/v1`;