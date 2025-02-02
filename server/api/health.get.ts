export default defineEventHandler({
  onRequest: [cors()],
  handler: async (event) => {
    setResponseStatus(event, 200);
    const config = useRuntimeConfig(event);
    const redis = await getRedis();

    return {
      apiVersion: config.apiVersion,

      messageBroker: {
        pub:
          redis?.pub && redis.pub.isOpen && redis.pub.isReady ? "ok" : "error",
        sub:
          redis?.sub && redis.sub.isOpen && redis.sub.isReady ? "ok" : "error",
      },
    };
  },
});
