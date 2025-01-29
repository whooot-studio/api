import consola from "consola";
import quizController from "~/controllers/quiz.controller";

export default defineEventHandler(async (event) => {
  try {
    const list = await quizController.listQuizzes();

    consola.info(`[Quiz] list ${list.length} quizzes`);
    return list;
  } catch (error) {
    return sendError(event, error);
  }
});
