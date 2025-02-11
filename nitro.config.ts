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
    client: {
      host: "",
      port: "",
      protocol: "",
      ssrHost: "",
      ssrPort: "",
      ssrProtocol: "",
      domain: "",
      crossSubDomain: "",
    },
    discord: {
      clientId: "",
      clientSecret: "",
    },
    google: {
      clientId: "",
      clientSecret: "",
    },
    twitch: {
      clientId: "",
      clientSecret: "",
    },
    simplelogin: {
      clientId: "",
      clientSecret: "",
    },
  },
});
