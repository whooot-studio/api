import type {
  RedisClientType,
  RedisFunctions,
  RedisModules,
  RedisScripts,
} from "@redis/client";
import { createClient, type RedisDefaultModules } from "redis";

type RedisAdapter = {
  pub: RedisClientType<
    RedisDefaultModules & RedisModules,
    RedisFunctions,
    RedisScripts
  >;
  sub: RedisClientType<
    RedisDefaultModules & RedisModules,
    RedisFunctions,
    RedisScripts
  >;
  url: string;
};

let redis: RedisAdapter | null = null;

export async function getRedis() {
  if (!redis) {
    const config = useRuntimeConfig();
    redis = {} as RedisAdapter;

    redis.url = `redis://${config.redis.host}:${config.redis.port}`;
    redis.pub = await createClient({ url: redis.url }).connect();
    redis.sub = await createClient({ url: redis.url }).connect();
  }

  return redis;
}
