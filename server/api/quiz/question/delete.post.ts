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

      // Get the quiz to check if the user is in the users
      const quiz = await prisma.quiz.findUnique({
        where: {
          id: quizId,
        },
        include: {
          users: true,
        },
      });
      if (!quiz)
        throw createError({
          statusCode: 404,
          statusMessage: "Not Found",
        });
      if (!quiz.users.some((u) => u.id === user.id))
        throw createError({
          statusCode: 403,
          statusMessage: "Forbidden",
        });

      await prisma.question.delete({
        where: {
          id: questionId,
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
