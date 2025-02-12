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

      const quizzes = await prisma.quiz.findMany({
        where: {
          users: {
            some: {
              id: user.id,
            },
          },
        },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      return quizzes;
    } catch {
      throw createError({
        statusCode: 500,
        statusMessage: "Internal Server Error",
      });
    }
  },
});
