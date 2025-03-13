import random from "randomstring";
import prisma from "./prisma";
import type { Question, Quiz } from "@prisma/client";
import consola from "consola";

interface GameConstructor {
  quizId: string;
  adminId: string;
}

interface GameParticipant {
  id: string;
  username: string;
  image?: string | null;
  userId?: string | null;
}

export class Game {
  private readonly quizId: string;
  private readonly adminId: string;

  constructor(c: GameConstructor) {
    this.quizId = c.quizId;
    this.adminId = c.adminId;
  }

  /* ------------------ */

  private static __mapCodeToGameId: Map<string, string> = new Map();

  static findIdByCode(code: string) {
    const gameId = this.__mapCodeToGameId.get(code);
    if (!gameId) return null;
    return gameId;
  }

  static removeIdByCode(code: string) {
    this.__mapCodeToGameId.delete(code);
  }

  private static __mapGameIdToGame: Map<string, Game> = new Map();

  static findGameByCode(code: string) {
    const gameId = this.__mapCodeToGameId.get(code);
    if (!gameId) return null;
    return this.__mapGameIdToGame.get(gameId);
  }

  static removeGameByCode(code: string) {
    const gameId = this.__mapCodeToGameId.get(code);
    if (!gameId) return;
    this.__mapCodeToGameId.delete(code);
    this.__mapGameIdToGame.delete(gameId);
  }

  /* ------------------ */

  public code: string;
  public id: string;
  public status: "idle" | "started" | "ended" = "idle";
  public quiz: Quiz & { questions: Question[] };
  public readonly current: {
    id: number;
    question: Question;
  } = {} as any;

  public async setup() {
    const game = await prisma.game.create({
      data: {
        quiz: {
          connect: {
            id: this.quizId,
          },
        },
        host: {
          connect: {
            id: this.adminId,
          },
        },
      },
      include: {
        quiz: {
          include: {
            questions: true,
          },
        },
      },
    });

    this.id = game.id;
    this.quiz = game.quiz;
    this.status = game.status as any;

    Object.defineProperty(this.current, "question", {
      get: () => {
        return this.quiz.questions[this.current.id];
      },
    });

    this.code = random.generate({
      length: 8,
      charset: "alphanumeric",
      capitalization: "uppercase",
    });

    Game.__mapCodeToGameId.set(this.code, this.id);
    Game.__mapGameIdToGame.set(this.id, this);
  }

  public async start() {
    if (!this.id) throw new Error("Game not setup");
    if (this.status !== "idle") throw new Error("Game already started");

    const game = await prisma.game.update({
      where: {
        id: this.id,
      },
      data: {
        startedAt: new Date(),
        status: "started",
      },
    });

    this.status = game.status as any;

    consola.info(`[Game] ${this.id} started`);

    this.current.id = 0;
  }

  public async end() {
    if (!this.id) throw new Error("Game not setup");
    if (this.status === "ended") throw new Error("Game already ended");

    if (this.status === "idle") {
      await prisma.game.delete({
        where: {
          id: this.id,
        },
      });

      Game.removeGameByCode(this.code);
      return;
    }

    const game = await prisma.game.update({
      where: {
        id: this.id,
      },
      data: {
        endedAt: new Date(),
        status: "ended",
      },
    });

    this.status = game.status as any;
  }

  public hasNext() {
    return this.current.id < this.quiz.questions.length - 1;
  }

  public next() {
    if (this.current.id >= this.quiz.questions.length - 1)
      throw new Error("No more questions");

    this.current.id++;
  }

  public hasPrevious() {
    return this.current.id > 0;
  }

  public previous() {
    if (this.current.id <= 0) throw new Error("No previous questions");

    this.current.id--;
  }

  /* ------------------ */

  public participants: Map<string, GameParticipant> = new Map<
    string,
    GameParticipant
  >();

  public async join(player: Omit<GameParticipant, "id">) {
    if (!this.id) throw new Error("Game not setup");
    if (this.status === "ended") throw new Error("Game already ended");

    if (player.userId && this.participants.size > 0)
      for (const participant of this.participants.values())
        if (participant.userId === player.userId)
          throw new Error("Player already joined");

    if (!player.username) throw new Error("Missing username");

    const participant = await prisma.gameParticipant.create({
      data: {
        game: {
          connect: {
            id: this.id,
          },
        },
        user: player.userId
          ? {
              connect: {
                id: player.userId,
              },
            }
          : undefined,
        username: player.username,
        image: player.image,
      },
      select: {
        id: true,
        username: true,
        image: true,
        userId: true,
      },
    });

    this.participants.set(participant.id, participant);

    return participant;
  }

  public async leave(playerId: string) {
    if (!this.id) throw new Error("Game not setup");
    if (this.status === "ended") throw new Error("Game already ended");

    if (!this.participants.has(playerId)) throw new Error("Player not found");

    this.participants.delete(playerId);
  }
}
