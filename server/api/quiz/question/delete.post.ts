import useAuth from "~/composables/auth";
import prisma from "~~/lib/prisma";

export default defineEventHandler({
  onRequest: [
    cors({ origin: "client", credentials: true }),
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
      const questionId = body.id;
      const quizId = body.quizId;

      await prisma.question.delete({
        where: {
          id: questionId,
          quiz: {
            id: quizId,
            users: {
              some: {
                id: user.id,
              },
            },
          },
        },
      });

      return;
    } catch (e) {
      throw createError({
        statusCode: 500,
        statusMessage: "Internal Server Error",
      });
    }
  },
});
