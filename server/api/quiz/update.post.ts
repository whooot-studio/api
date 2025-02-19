import prisma from "~~/lib/prisma";
import useAuth from "~/composables/auth";
import { QuizUpdateSchema } from "~/schema/quiz.schema";

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

      const body = await readBody<{
        id?: string;
        title?: string | null;
        description?: string | null;
        image?: string | null;
      }>(event);
      const quizId = body.id;

      const {
        data: parsed,
        error,
        success,
      } = QuizUpdateSchema.safeParse({
        title: body.title,
        description: body.description,
        image: body.image,
      });
      if (!success)
        throw new Error("422 - Unprocessable Entity: " + error.message);

      const quiz = await prisma.quiz.update({
        where: { id: quizId },
        data: {
          title: parsed.title,
          description: parsed.description,
          image: parsed.image,
          users: {
            connect: [{ id: user.id }],
          },
        },
      });

      return quiz;
    } catch (e) {
      throw createError({
        statusCode: 500,
        statusMessage: "Internal Server Error",
      });
    }
  },
});
