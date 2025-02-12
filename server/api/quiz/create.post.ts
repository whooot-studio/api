import prisma from "~~/lib/prisma";
import useAuth from "~/composables/auth";

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

      const quiz = await prisma.quiz.create({
        data: {
          title: body.title,
          description: body.description,
          image: body.image,
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
