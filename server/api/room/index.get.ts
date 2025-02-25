import type { Game, GameParticipant } from "@prisma/client";
import type { User } from "better-auth";
import consola from "consola";
import random from "randomstring";
import useAuth from "~/composables/auth";
import prisma from "~~/lib/prisma";

const codeStore = new Map<string, string>(); // code -> gameId

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

            // Create game
            const game = await prisma.game.create({
              data: {
                quiz: {
                  connect: {
                    id: quizId,
                  },
                },
                host: {
                  connect: {
                    id: user.id,
                  },
                },
              },
            });

            // Create code
            const code = random.generate({
              length: 8,
              charset: "alphanumeric",
              capitalization: "uppercase",
            });

            // Store information
            codeStore.set(code, game.id);
            peer.context.code = code;
            peer.context.admin = true;

            peer.subscribe(`room:${game.id}`);
            peer.send({ action: "meta:code", code });
          }
          break;

        case "meta:join":
          {
            const code = data.code;
            if (!code) throw new Error("Missing code");

            const { username, image } = data;
            if (!username) throw new Error("Missing username");

            const gameId = codeStore.get(code);
            if (!gameId) throw new Error("Invalid code");

            if (peer.context.participant) throw new Error("Already joined");

            // Create participant game
            const participant = await prisma.gameParticipant.create({
              data: {
                game: {
                  connect: {
                    id: gameId,
                  },
                },
                user: user
                  ? {
                      connect: {
                        id: user.id,
                      },
                    }
                  : undefined,
                username,
                image,
              },
              select: {
                id: true,
                username: true,
                image: true,
              },
            });
            peer.context.participant = participant;
            peer.context.code = code;

            const participants = await prisma.gameParticipant.findMany({
              where: {
                gameId,
              },
              select: {
                id: true,
                username: true,
                image: true,
              },
            });

            peer.send({ action: "members:all", members: participants });
            peer.publish(`room:${gameId}`, {
              action: "members:join",
              member: participant,
            });
            peer.subscribe(`room:${gameId}`);
          }
          break;

        case "game:start":
          {
            // const code = data.code; // TODO: Validate code
            // if (!code)
            //   throw new MalformedPayloadError(
            //     "Action 'game:start' requires a 'code'"
            //   );
            // const room = await roomController.getRoom(code);
            // if (!room) return;
            // const admin = await roomController.getAdmin(code);
            // if (!admin || admin.id !== peer.id) return;
            // const game = room.game;
            // await game.start();
            // peer.publish(`room:${code}`, {
            //   action: "game:start",
            // });
            // consola.info(`[Room] ${peer.id} started game in ${code}`);
            // console.log(game.currentQuestion);
            // await game.nextQuestion();
            // console.log(game.currentQuestion);
            // break;
            // const { title, choices } = game.currentQuestion;
            // peer.publish(`room:${code}`, {
            //   action: "game:question:start",
            //   question: title,
            //   options: choices,
            // });
            // setTimeout(async () => {
            //   peer.publish(`room:${code}`, {
            //     action: "game:question:stop",
            //   });
            // }, game.delayMs);
          }
          break;

        case "interact:emote":
          {
            const code = data.code;
            if (!code) throw new Error("Missing code");

            const emote = data.emote;
            if (!emote) throw new Error("Missing emote");

            const gameId = codeStore.get(code);
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

      const gameId = codeStore.get(code);

      const isAdmin = peer.context.admin as boolean | undefined;
      if (isAdmin) {
        codeStore.delete(code);
        peer.unsubscribe(`room:${gameId}`);
        peer.publish(`room:${gameId}`, {
          action: "meta:close",
        });

        const game = await prisma.game.findUnique({
          where: {
            id: gameId,
          },
        });
        if (game?.status === "idle") {
          await prisma.game.delete({
            where: {
              id: gameId,
            },
          });
        }

        return;
      }

      const participant = peer.context.participant as
        | GameParticipant
        | undefined;
      if (!participant) return;

      peer.unsubscribe(`room:${gameId}`);
      peer.publish(`room:${gameId}`, {
        action: "members:leave",
        member: {
          id: participant.id,
          username: participant.username,
          image: participant.image,
        },
      });

      await prisma.gameParticipant
        .delete({
          where: {
            id: participant.id,
          },
        })
        .catch((e: any) => {
          if (e.code === "P2025" || e.code === "P2016") return;
          throw e;
        });
    } catch (error) {
      consola.error(error);
    }
  },
});
