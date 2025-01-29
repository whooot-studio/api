//https://nitro.unjs.io/config
export default defineNitroConfig({
  srcDir: "server",
  compatibilityDate: "2024-04-03",

  experimental: {
    websocket: true,
  },

  runtimeConfig: {
    apiVersion: "",
    redis: {
      host: "",
      port: "",
    },
  },

  routeRules: {
    "/api/**": {
      cors: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST",
      },
    },
  },
});
