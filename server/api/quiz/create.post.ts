import prisma from "~~/lib/prisma";
import useAuth from "~/composables/auth";
import { QuizSchema } from "~/schema/quiz.schema";

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

      const {
        data: parsed,
        error,
        success,
      } = QuizSchema.safeParse({
        title: body.title,
        description: body.description,
        image: body.image,
      });
      if (!success)
        throw new Error("422 - Unprocessable Entity: " + error.message);

      const quiz = await prisma.quiz.create({
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
