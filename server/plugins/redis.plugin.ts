import consola from "consola";

export default defineNitroPlugin(async () => {
  const redis = await getRedis();

  consola.success(`Connected to Redis (${redis.url})`);
});
