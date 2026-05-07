// const localUrl = "http://localhost:5003";
// // const localUrl = "http://192.168.1.13:5003";
// const liveUrl = "https://achiever.nablean.com";

// const isLive = false;

// export const serverUrl = isLive ? liveUrl : localUrl;
// export const server = isLive ? `${liveUrl}/api/v1/` : `${localUrl}/api/v1/`;

export const serverUrl = import.meta.env.VITE_SERVER_URL;

export const server = `${serverUrl}/api/v1`;