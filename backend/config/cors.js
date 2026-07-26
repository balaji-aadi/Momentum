export const whiteListCors = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://sarthi-dev.vercel.app",
  "http://10.69.46.154:3000",
  "http://10.69.46.154:5173",
  "http://10.52.79.154:3000"
];

// Dynamically check origin so any local network/LAN IP (10.x.x.x, 192.168.x.x, 172.16-31.x.x) on any port is allowed for mobile/dev testing
export const corsOriginHandler = (origin, callback) => {
  if (!origin) return callback(null, true);

  if (whiteListCors.includes(origin)) {
    return callback(null, true);
  }

  const lanRegex = /^http:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/;
  if (lanRegex.test(origin)) {
    return callback(null, true);
  }

  callback(new Error("Not allowed by CORS"));
};
