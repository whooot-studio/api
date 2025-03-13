import type { GameParticipant } from "@prisma/client";
import type { User } from "better-auth";
import consola from "consola";
import useAuth from "~/composables/auth";
import { Game as GameClass } from "~~/lib/game";
import prisma from "~~/lib/prisma";

export default defineWebSocketHandler({
  async upgrade(request) {
    const auth = useAuth();
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (session) {
      request.context.session = session.session;
      request.context.user = session.user;
    }
  },
  async open(peer) {
    consola.info(`[Peer] ${peer.id} connected`);
  },
  async message(peer, message) {
    const user = peer.context.user as User | undefined;

    try {
      const data = message.json() as any;

      const action = data.action;
      if (!action) return;

      switch (action) {
        case "meta:setup":
          {
            if (!user) throw new Error("Unauthorized");

            const quizId = data.quiz;
            if (!quizId) return;

            const game = new GameClass({
              quizId,
              adminId: user.id,
            });

            await game.setup();

            peer.context.code = game.code;
            peer.context.admin = true;

            peer.subscribe(`room:${game.id}`);
            peer.send({ action: "meta:code", code: game.code });
          }
          break;

        case "meta:join":
          {
            const code = data.code;
            if (!code) throw new Error("Missing code");

            const { username, image } = data;
            if (!username) throw new Error("Missing username");

            const game = GameClass.findGameByCode(code);
            if (!game) throw new Error("Invalid code");

            if (peer.context.participant) throw new Error("Already joined");

            // Create participant game
            const participant = await game.join({
              userId: user?.id,
              username,
              image: image || (peer.context.user as User | undefined)?.image,
            });
            peer.context.participant = participant;
            peer.context.code = code;

            peer.send({
              action: "members:all",
              members: Array.from(game.participants.values()),
            });
            peer.publish(`room:${game.id}`, {
              action: "members:join",
              member: participant,
            });
            peer.subscribe(`room:${game.id}`);
          }
          break;

        case "game:start":
          {
            const code = peer.context.code as string | undefined;
            if (!code) throw new Error("Missing code");

            consola.info(`[Room] ${peer.id} started game in ${code}`);

            // Ensure peer is admin
            const admin = peer.context.admin as boolean | undefined;
            if (!admin) throw new Error("Unauthorized");

            const game = GameClass.findGameByCode(code);
            if (!game) throw new Error("Game not found");
            if (game.status !== "idle") throw new Error("Game already started");

            await game.start();

            peer.send({
              action: "game:start",
            });
            peer.publish(`room:${game.id}`, {
              action: "game:start",
            });

            peer.send({
              action: "game:quiz",
              questions: game.quiz.questions,
            });

            peer.send({
              action: "game:question",
              question: {
                title: game.current.question.title,
                choices: game.current.question.choices,
              },
              hasPrevious: game.hasPrevious(),
              hasNext: game.hasNext(),
            });
            peer.publish(`room:${game.id}`, {
              action: "game:question",
              question: {
                title: game.current.question.title,
                choices: game.current.question.choices,
              },
            });
          }
          break;

        case "game:next":
          {
            const code = peer.context.code as string | undefined;
            if (!code) throw new Error("Missing code");

            const admin = peer.context.admin as boolean | undefined;
            if (!admin) throw new Error("Unauthorized");

            const game = GameClass.findGameByCode(code);
            if (!game) throw new Error("Game not found");
            if (game.status !== "started") throw new Error("Game not started");

            if (game.hasNext()) {
              await game.next();

              peer.send({
                action: "game:question",
                question: {
                  title: game.current.question.title,
                  choices: game.current.question.choices,
                },
                hasPrevious: game.hasPrevious(),
                hasNext: game.hasNext(),
              });
              peer.publish(`room:${game.id}`, {
                action: "game:question",
                question: {
                  title: game.current.question.title,
                  choices: game.current.question.choices,
                },
              });
            } else {
              await game.end();

              peer.send({
                action: "game:end",
              });
              peer.publish(`room:${game.id}`, {
                action: "game:end",
              });
            }
          }
          break;

        case "game:previous":
          {
            const code = peer.context.code as string | undefined;
            if (!code) throw new Error("Missing code");

            const admin = peer.context.admin as boolean | undefined;
            if (!admin) throw new Error("Unauthorized");

            const game = GameClass.findGameByCode(code);
            if (!game) throw new Error("Game not found");
            if (game.status !== "started") throw new Error("Game not started");

            if (game.hasPrevious()) {
              await game.previous();

              peer.send({
                action: "game:question",
                question: {
                  title: game.current.question.title,
                  choices: game.current.question.choices,
                },
                hasPrevious: game.hasPrevious(),
                hasNext: game.hasNext(),
              });
              peer.publish(`room:${game.id}`, {
                action: "game:question",
                question: {
                  title: game.current.question.title,
                  choices: game.current.question.choices,
                },
              });
            } else {
              throw new Error("No previous question");
            }
          }
          break;

        case "interact:emote":
          {
            const code = peer.context.code as string | undefined;
            if (!code) throw new Error("Missing code");

            const emote = data.emote;
            if (!emote) throw new Error("Missing emote");

            const gameId = GameClass.findIdByCode(code);
            if (!gameId) throw new Error("Invalid code");

            peer.publish(`room:${gameId}`, {
              action: "interact:emote",
              emote,
            });
          }
          break;

        default:
        // throw new MalformedPayloadError(`Unknown action '${action}'`);
      }
    } catch (error) {
      consola.error(error);
      if (!(error instanceof Error)) return;

      peer.send({
        action: "meta:error",
        code: error.name,
        message: error.message,
        stack: error.stack,
      });
    }
  },

  async close(peer) {
    consola.info(`[Peer] ${peer.id} disconnected`);

    try {
      const code = peer.context.code as string | undefined;
      if (!code) return;

      const game = GameClass.findGameByCode(code);
      if (!game) return;

      const isAdmin = peer.context.admin as boolean | undefined;
      if (isAdmin) {
        peer.unsubscribe(`room:${game.id}`);
        peer.publish(`room:${game.id}`, {
          action: "meta:close",
        });

        await game.end();
        return;
      }

      const participant = peer.context.participant as
        | GameParticipant
        | undefined;
      if (!participant) return;

      await game.leave(participant.id);

      peer.unsubscribe(`room:${game.id}`);
      peer.publish(`room:${game.id}`, {
        action: "members:leave",
        member: {
          id: participant.id,
          username: participant.username,
          image: participant.image,
        },
      });
    } catch (error) {
      consola.error(error);
    }
  },
});
