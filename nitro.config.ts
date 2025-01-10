//https://nitro.unjs.io/config
export default defineNitroConfig({
  srcDir: "server",
  compatibilityDate: "2024-04-03",

  experimental: {
    websocket: true,
  },
});
