const env = {
  API_URL: import.meta.env.VITE_API_URL as string,
  AI_SERVICE_URL: (import.meta.env.VITE_AI_SERVICE_URL as string) || "http://localhost:9000",
  JITSI_DOMAIN: import.meta.env.VITE_JITSI_DOMAIN as string,
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD,
} as const;

export default env;
