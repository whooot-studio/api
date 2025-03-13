import { describe, it, expect, vi } from "vitest";
import { Game } from "../../lib/game";
import prisma from "../../lib/__mocks__/prisma";
import type * as Prisma from "@prisma/client";

vi.mock("../../lib/prisma");

const fixtures = {
  stage__init: {
    id: "game-1",
    status: "idle",
    quiz: {
      id: "quiz-1",
      questions: [
        {
          id: "question-1",
          title: "Question 1",
          type: "SNG",
          choices: ["answer-1", "answer-2", "answer-3"],
          answer: "answer-1",
        },
        {
          id: "question-2",
          title: "Question 2",
          type: "MUL",
          choices: ["answer-1", "answer-2", "answer-3"],
          answer: "answer-1",
        },
        {
          id: "question-3",
          title: "Question 3",
          type: "BOL",
          choices: ["True", "False"],
          answer: "True",
        },
      ],
    },
  } as Partial<Prisma.Game & { questions: Partial<Prisma.Question>[] }> as any,

  stage__started: {
    ...(this as any).stage__init,
    status: "started",
  } as Partial<Prisma.Game> & { questions: Partial<Prisma.Question>[] } as any,

  stage__ended: {
    ...(this as any).stage__started,
    status: "ended",
  } as Partial<Prisma.Game> & { questions: Partial<Prisma.Question>[] } as any,
};

describe("Game", () => {
  it("can be found by code (id)", async () => {
    prisma.game.create.mockResolvedValue(fixtures.stage__init);

    const game = new Game({
      quizId: "game-1",
      adminId: "user-1",
    });

    await game.setup();

    expect(Game.findIdByCode(game.code)).toBe("game-1");
    expect(Game.findIdByCode("UNKNOWN0")).toBeNull();
  });

  it("can be removed by code (id)", async () => {
    prisma.game.create.mockResolvedValue(fixtures.stage__init);

    const game = new Game({
      quizId: "game-1",
      adminId: "user-1",
    });

    await game.setup();

    Game.removeIdByCode(game.code);
    expect(Game.findIdByCode(game.code)).toBeNull();
  });

  it("can be found by code (game)", async () => {
    prisma.game.create.mockResolvedValue(fixtures.stage__init);

    const game = new Game({
      quizId: "game-1",
      adminId: "user-1",
    });

    await game.setup();

    expect(Game.findGameByCode(game.code)).toBe(game);
    expect(Game.findGameByCode("UNKNOWN1")).toBeNull();
  });

  it("can be removed by code (game)", async () => {
    prisma.game.create.mockResolvedValue(fixtures.stage__init);

    const game = new Game({
      quizId: "game-1",
      adminId: "user-1",
    });

    await game.setup();

    Game.removeGameByCode(game.code);
    expect(Game.findGameByCode(game.code)).toBeNull();
  });

  /* ------------------ */

  it("should create a game with valid quizId and adminId", async () => {
    prisma.game.create.mockResolvedValue(fixtures.stage__init);

    const game = new Game({
      quizId: "game-1",
      adminId: "user-1",
    });

    await game.setup();

    expect(game.id).toBe("game-1");
  });

  it("should fail to create a game with unknown quiz", async () => {
    prisma.game.create.mockRejectedValue("quiz-not-found");

    const game = new Game({
      quizId: "quiz-not-found",
      adminId: "user-1",
    });

    await expect(game.setup()).rejects.toThrowError("quiz-not-found");
  });

  it("should fail to create a game with unknown admin", async () => {
    prisma.game.create.mockRejectedValue("user-not-found");

    const game = new Game({
      quizId: "game-1",
      adminId: "user-not-found",
    });

    await expect(game.setup()).rejects.toThrowError("user-not-found");
  });

  it("should have a short code after setup", async () => {
    prisma.game.create.mockResolvedValue(fixtures.stage__init);

    const game = new Game({
      quizId: "game-1",
      adminId: "user-1",
    });

    await game.setup();

    expect(game.code).toHaveLength(8);
    expect(Game.findIdByCode(game.code)).toBe("game-1");
  });

  it("should contain quiz data and questions after setup", async () => {
    prisma.game.create.mockResolvedValue(fixtures.stage__init);

    const game = new Game({
      quizId: "game-1",
      adminId: "user-1",
    });

    await game.setup();

    expect(game.quiz.questions).toHaveLength(3);
  });

  it("should start the game", async () => {
    prisma.game.create.mockResolvedValue(fixtures.stage__init);
    prisma.game.update.mockResolvedValue(fixtures.stage__started);

    const game = new Game({
      quizId: "game-1",
      adminId: "user-1",
    });

    await game.setup();
    expect(game.status).toBe("idle");

    expect(game.current.id).toBeUndefined();
    expect(game.current.question).toBeUndefined();

    await game.start();
    expect(game.status).toBe("started");

    expect(game.current.id).toBe(0);
    expect(game.current.question.id).toBe("question-1");
  });

  it("should fail to start the game without setup", async () => {
    prisma.game.update.mockResolvedValue(fixtures.stage__started);

    const game = new Game({
      quizId: "game-1",
      adminId: "user-1",
    });

    await expect(game.start()).rejects.toThrow("Game not setup");
  });

  it("should fail to start the game twice", async () => {
    prisma.game.create.mockResolvedValue(fixtures.stage__init);
    prisma.game.update.mockResolvedValue(fixtures.stage__started);

    const game = new Game({
      quizId: "game-1",
      adminId: "user-1",
    });

    await game.setup();
    await game.start();

    await expect(game.start()).rejects.toThrow("Game already started");
  });

  it("should keep track of current question", async () => {
    prisma.game.create.mockResolvedValue(fixtures.stage__init);
    prisma.game.update.mockResolvedValue(fixtures.stage__started);

    const game = new Game({
      quizId: "game-1",
      adminId: "user-1",
    });

    await game.setup();
    await game.start();

    expect(game.current.id).toBe(0);
    expect(game.current.question.id).toBe("question-1");
    expect(game.hasNext()).toBe(true);
    expect(game.hasPrevious()).toBe(false);
    expect(() => game.previous()).toThrow("No previous question");

    game.next();
    expect(game.current.id).toBe(1);
    expect(game.current.question.id).toBe("question-2");
    expect(game.hasNext()).toBe(true);
    expect(game.hasPrevious()).toBe(true);

    game.next();
    expect(game.current.id).toBe(2);
    expect(game.current.question.id).toBe("question-3");
    expect(game.hasNext()).toBe(false);
    expect(game.hasPrevious()).toBe(true);
    expect(() => game.next()).toThrow("No more questions");

    game.previous();
    expect(game.current.id).toBe(1);
    expect(game.current.question.id).toBe("question-2");
    expect(game.hasNext()).toBe(true);
    expect(game.hasPrevious()).toBe(true);
  });

  it("should delete the game if not started", async () => {
    prisma.game.create.mockResolvedValue(fixtures.stage__init);
    prisma.game.delete.mockResolvedValue(fixtures.stage__init);

    const game = new Game({
      quizId: "game-1",
      adminId: "user-1",
    });

    await game.setup();
    await game.end();

    expect(Game.findIdByCode(game.code)).toBeNull();
  });

  it("should end the game", async () => {
    prisma.game.create.mockResolvedValue(fixtures.stage__init);
    prisma.game.update.mockResolvedValueOnce(fixtures.stage__started);
    prisma.game.update.mockResolvedValueOnce(fixtures.stage__ended);

    const game = new Game({
      quizId: "game-1",
      adminId: "user-1",
    });

    await game.setup();
    await game.start();
    await game.end();

    expect(game.status).toBe("ended");
  });

  it("should fail to end the game without setup", async () => {
    prisma.game.create.mockResolvedValue(fixtures.stage__init);
    prisma.game.update.mockResolvedValueOnce(fixtures.stage__started);
    prisma.game.update.mockResolvedValueOnce(fixtures.stage__ended);

    const game = new Game({
      quizId: "game-1",
      adminId: "user-1",
    });

    await expect(game.end()).rejects.toThrow("Game not setup");
  });

  it("should fail to end the game twice", async () => {
    prisma.game.create.mockResolvedValue(fixtures.stage__init);
    prisma.game.update.mockResolvedValueOnce(fixtures.stage__started);
    prisma.game.update.mockResolvedValueOnce(fixtures.stage__ended);

    const game = new Game({
      quizId: "game-1",
      adminId: "user-1",
    });

    await game.setup();
    await game.start();
    await game.end();

    await expect(game.end()).rejects.toThrow("Game already ended");
  });

  /* ------------------ */

  it("should add a participant", async () => {
    prisma.game.create.mockResolvedValue(fixtures.stage__init);
    prisma.gameParticipant.create.mockResolvedValue({
      id: "participant-1",
      username: "user-1",
      image: null,
    } as any);

    const game = new Game({
      quizId: "game-1",
      adminId: "user-1",
    });

    await game.setup();
    const participant = await game.join({
      userId: "participant-1",
      username: "user-1",
      image: undefined,
    });

    expect(participant.id).toBe("participant-1");
    expect(participant.username).toBe("user-1");
    expect(participant.image).toBeNull();

    expect(game.participants.size).toBe(1);
    expect(game.participants.get("participant-1")).toBe(participant);
  });

  it("should fail to add a participant without setup", async () => {
    prisma.gameParticipant.create.mockResolvedValue({
      id: "participant-1",
      username: "user-1",
      image: null,
    } as any);

    const game = new Game({
      quizId: "game-1",
      adminId: "user-1",
    });

    await expect(
      game.join({
        username: "user-1",
        image: undefined,
      })
    ).rejects.toThrow("Game not setup");
  });

  it("should fail to add a participant with the same id", async () => {
    prisma.game.create.mockResolvedValue(fixtures.stage__init);
    prisma.gameParticipant.create.mockResolvedValue({
      id: "participant-1",
      username: "user-1",
      image: null,
      userId: "user-1",
    } as any);

    const game = new Game({
      quizId: "game-1",
      adminId: "user-1",
    });

    await game.setup();

    await game.join({
      userId: "participant-1",
      username: "user-1",
      image: undefined,
    });

    await expect(
      game.join({
        userId: "user-1",
        username: "user-1",
        image: undefined,
      })
    ).rejects.toThrow("Player already joined");
  });

  it("should fail to add a participant without username", async () => {
    prisma.game.create.mockResolvedValue(fixtures.stage__init);
    prisma.gameParticipant.create.mockResolvedValue({
      id: "participant-1",
      username: "user-1",
      image: null,
    } as any);

    const game = new Game({
      quizId: "game-1",
      adminId: "user-1",
    });

    await game.setup();

    await expect(
      game.join({
        username: "",
        image: undefined,
      })
    ).rejects.toThrow("Missing username");
  });

  it("should remove a participant", async () => {
    prisma.game.create.mockResolvedValue(fixtures.stage__init);
    prisma.gameParticipant.create.mockResolvedValue({
      id: "participant-1",
      username: "user-1",
      image: null,
    } as any);
    prisma.gameParticipant.delete.mockResolvedValue({
      id: "participant-1",
      username: "user-1",
      image: null,
    } as any);

    const game = new Game({
      quizId: "game-1",
      adminId: "user-1",
    });

    await game.setup();
    const participant = await game.join({
      username: "user-1",
      image: undefined,
    });

    expect(game.participants.size).toBe(1);
    expect(game.participants.get("participant-1")).toBe(participant);

    await game.leave(participant.id);

    expect(game.participants.size).toBe(0);
    expect(game.participants.get("participant-1")).toBeUndefined();
  });

  it("should fail to remove a participant without setup", async () => {
    prisma.gameParticipant.delete.mockResolvedValue({
      id: "participant-1",
      username: "user-1",
      image: null,
    } as any);

    const game = new Game({
      quizId: "game-1",
      adminId: "user-1",
    });

    await expect(game.leave("participant-1")).rejects.toThrow("Game not setup");
  });

  it("should fail to remove a participant not found", async () => {
    prisma.game.create.mockResolvedValue(fixtures.stage__init);
    prisma.gameParticipant.delete.mockResolvedValue({
      id: "participant-1",
      username: "user-1",
      image: null,
    } as any);

    const game = new Game({
      quizId: "game-1",
      adminId: "user-1",
    });

    await game.setup();

    await expect(game.leave("participant-1")).rejects.toThrow(
      "Player not found"
    );
  });
});
