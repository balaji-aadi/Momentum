const localUrl = "http://192.168.1.14:5003";
// const localUrl = "http://192.168.1.13:5003";
const liveUrl = "https://achiever.nablean.com";

const isLive = false;

export const serverUrl = isLive ? liveUrl : localUrl;
export const server = isLive ? `${liveUrl}/api/v1/` : `${localUrl}/api/v1/`;
