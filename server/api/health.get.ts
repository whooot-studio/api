export default defineEventHandler(async (event) => {
  setResponseStatus(event, 200);
  const config = useRuntimeConfig(event);
  const redis = await getRedis();

  return {
    apiVersion: config.apiVersion,

    messageBroker: {
      pub: redis.pub.isOpen && redis.pub.isReady ? "ok" : "error",
      sub: redis.sub.isOpen && redis.sub.isReady ? "ok" : "error",
    },
  };
});
