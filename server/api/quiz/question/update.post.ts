import useAuth from "~/composables/auth";
import { QuestionSchema } from "~/schema/question.schema";
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

      const {
        data: parsed,
        error,
        success,
      } = QuestionSchema.safeParse({
        type: body.type,
        title: body.title,
        choices: body.choices,
        points: body.points,
        answer: body.answer,
      });
      if (!success)
        throw new Error("422 - Unprocessable Entity: " + error.message);

      let processedAnswer;
      switch (parsed.type) {
        case "SNG": {
          if (Array.isArray(parsed.answer))
            throw new Error(
              "422 - Unprocessable Entity: Answer must be a string"
            );

          if (!parsed.choices.includes(parsed.answer))
            throw new Error(
              "422 - Unprocessable Entity: Answer must be one of the choices"
            );
          processedAnswer = parsed.answer;
          break;
        }
        case "MUL": {
          if (!Array.isArray(parsed.answer))
            throw new Error(
              "422 - Unprocessable Entity: Answer must be an array"
            );

          if (!parsed.answer.every((a) => parsed.choices.includes(a)))
            throw new Error(
              "422 - Unprocessable Entity: Answer must be an array of choices"
            );

          processedAnswer = JSON.stringify(parsed.answer);
          break;
        }
        case "BOL": {
          if (parsed.answer !== "Yes" && parsed.answer !== "No")
            throw new Error(
              "422 - Unprocessable Entity: Answer must be Yes or No"
            );

          processedAnswer = parsed.answer;
          break;
        }
        default:
          throw new Error(
            "422 - Unprocessable Entity: Type must be SNG, MUL, or BOL"
          );
      }

      if (questionId)
        return await prisma.question.update({
          where: {
            id: questionId,
          },
          data: {
            type: parsed.type,
            title: parsed.title,
            choices: parsed.choices,
            points: parsed.points,
            answer: processedAnswer,
          },
        });

      const question = await prisma.question.create({
        data: {
          type: parsed.type,
          title: parsed.title,
          choices: parsed.choices,
          points: parsed.points,
          answer: processedAnswer,
          quiz: {
            connect: {
              id: quizId,
            },
          },
        },
      });

      if (!question) throw new Error("Internal Server Error");

      return question;
    } catch (e) {
      throw createError({
        statusCode: 500,
        statusMessage: "Internal Server Error",
      });
    }
  },
});
