import prisma from "~~/lib/prisma";
import useAuth from "~/composables/auth";

export default defineEventHandler({
  onRequest: [
    cors({ credentials: true }),
    authorization({ guest: "deny", user: "allow" }),
  ],
  handler: async (event) => {
    try {
      const auth = useAuth();
      const session = await auth.api.getSession({
        headers: event.headers,
      });
      if (!session) return;
      const user = session.user;

      const body = await readBody(event);
      const include = (body.include as string[]) || [];

      const quiz = await prisma.quiz.findFirst({
        where: {
          id: body.id,
          users: {
            some: {
              id: user.id,
            },
          },
        },
        include: {
          users: include.includes("users")
            ? {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  email: true,
                },
              }
            : undefined,
          questions: include.includes("questions")
            ? {
                omit: {},
              }
            : undefined,
          games: include.includes("games")
            ? {
                omit: {
                  
                },
              }
            : undefined,
        },
      });

      return quiz;
    } catch {
      throw createError({
        statusCode: 500,
        statusMessage: "Internal Server Error",
      });
    }
  },
});
