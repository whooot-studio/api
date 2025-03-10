import prisma from "~~/lib/prisma";
import { Quiz, Question, GameAnswer, User } from "@prisma/client";

/**
 * Game class
 */
export class Game {
  private _quiz: Quiz & {
    questions: Question[];
    users: User[];
  };
  private _startedAt?: Date;
  private _endedAt?: Date;
  private _currentQuestionId?: number;
  private _questions: Map<number, Question> = new Map();
  private _answers: Map<[string, number], GameAnswer> = new Map();

  constructor(
    public readonly quizId: string,
    public readonly delayMs: number
  ) {}

  public async setup() {
    console.log("Setting up game for", this.quizId);
    const quiz = await prisma.quiz.findUnique({
      where: { id: this.quizId },
      include: {
        questions: true,
        users: true,
      },
    });
    if (!quiz) throw new Error("Quiz not found");

    this._quiz = quiz;
  }

  public get quiz() {
    return this._quiz;
  }

  public get startedAt() {
    return this.startedAt;
  }

  public get endedAt() {
    return this._endedAt;
  }

  public get currentQuestionId() {
    return this._currentQuestionId;
  }

  public get currentQuestion() {
    if (this._currentQuestionId === undefined)
      throw new Error("Game not started");
    return this._quiz.questions[this._currentQuestionId];
  }

  public get questions() {
    return this._questions;
  }

  public getQuestion(questionId: number) {
    return this._questions.get(questionId);
  }

  public get answers() {
    return this._answers;
  }

  public getAnswer(userId: string, questionId: number) {
    return this._answers.get([userId, questionId]);
  }

  public async start() {
    this._startedAt = new Date();
    this._currentQuestionId = 0;
  }

  public async end() {
    this._endedAt = new Date();
  }

  public async nextQuestion() {
    if (this._currentQuestionId === undefined)
      throw new Error("Game not started");
    this._currentQuestionId++;
  }

  public async answer(userId: string, questionId: number, answer: string) {
    if (this._currentQuestionId === undefined)
      throw new Error("Game not started");

    const question = this.getQuestion(questionId);
    if (!question) throw new Error("Impossible");

    // Check if the question has been closed
    // const now = new Date();
    // if (now.getTime() - question.questionedAt.getTime() > this.delayMs)
    //   throw new Error("Question closed");

    this._answers.set([userId, questionId], {
      answer,
      questionId: questionId.toString(),
      playerId: userId,
    } as GameAnswer);
  }

  public async getScore(userId: string) {
    let score = 0;

    // for (const [key_user_question, value_answer] of this._answers) {
    //   const [userId, questionId] = key_user_question;
    //   const question = this._questions.get(questionId);
    //   if (!question) throw new Error("Impossible");

    //   const { answer } = this._quiz.questions[questionId];

    //   if (value_answer.answer === answer)
    //     score += Math.max(
    //       this.delayMs -
    //         (value_answer.answeredAt.getTime() -
    //           question.questionedAt.getTime()),
    //       0
    //     );
    // }

    return score;
  }
}

export default {
  Game,
};
