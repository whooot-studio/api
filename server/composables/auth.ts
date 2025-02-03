import { PrismaClient } from "@prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { genericOAuth } from "better-auth/plugins";
import useClient from "./client";

const prisma = new PrismaClient();
const client = useClient();

export default function useAuth() {
  const config = useRuntimeConfig();

  const auth = betterAuth({
    trustedOrigins: [client.origin],
    database: prismaAdapter(prisma, { provider: "sqlite" }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      autoSignIn: false,
    },

    socialProviders: {
      discord: {
        enabled:
          Boolean(config.discord.clientId) &&
          Boolean(config.discord.clientSecret),
        clientId: config.discord.clientId,
        clientSecret: config.discord.clientSecret,
      },
      google: {
        enabled:
          Boolean(config.google.clientId) &&
          Boolean(config.google.clientSecret),
        clientId: config.google.clientId,
        clientSecret: config.google.clientSecret,
      },
      twitch: {
        enabled:
          Boolean(config.twitch.clientId) &&
          Boolean(config.twitch.clientSecret),
        clientId: config.twitch.clientId,
        clientSecret: config.twitch.clientSecret,
      },
    },

    plugins: [
      genericOAuth({
        config: [
          ...(Boolean(config.simplelogin.clientId) &&
          Boolean(config.simplelogin.clientSecret)
            ? [
                {
                  providerId: "simplelogin",
                  clientId: config.simplelogin.clientId,
                  clientSecret: config.simplelogin.clientSecret,
                  discoveryUrl:
                    "https://app.simplelogin.io/.well-known/openid-configuration",
                  scopes: ["openid", "email"],
                  mapProfileToUser: async (profile) => {
                    profile.id = profile.id.toString();
                    profile.image = profile.avatar_url;
                    return profile;
                  },
                },
              ]
            : ([] as any)),
        ],
      }),
    ],
  });

  return auth;
}
