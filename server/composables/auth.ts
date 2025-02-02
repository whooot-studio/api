import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import useClient from "./client";

const prisma = new PrismaClient();
const client = useClient();

export default function useAuth() {
  const auth = betterAuth({
    trustedOrigins: [client.origin],
    database: prismaAdapter(prisma, { provider: "sqlite" }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },

    socialProviders: {},
  });

  return auth;
}
