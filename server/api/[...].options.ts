export default defineEventHandler({
  onRequest: [cors({ origin: "client", credentials: true })],
  handler: async (event) => {
    return;
  },
});
