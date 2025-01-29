import consola from "consola";
import roomController, {
  MalformedPayloadError,
} from "~/controllers/room.controller";

const getRoomOfAdminSafe = safe(roomController.getRoomOfAdmin);
const getRoomOfMemberSafe = safe(roomController.getRoomOfMember);

export default defineWebSocketHandler({
  async open(peer) {
    consola.info(`[Peer] ${peer.id} connected`);
  },
  async message(peer, message) {
    try {
      const data = message.json() as any;

      const action = data.action;
      if (!action) return;

      switch (action) {
        case "meta:setup":
          {
            const quizId = data.quiz;
            if (!quizId) return;

            const code = await roomController.createRoom(quizId, 15000);
            await roomController.setAdmin(code, peer.id);

            peer.subscribe(`room:${code}`);

            peer.send({ action: "meta:code", code });
          }
          break;

        case "meta:join":
          {
            const code = data.code; // TODO: Validate code
            if (!code)
              throw new MalformedPayloadError(
                "Action 'meta:join' requires a 'code'"
              );
            let name = data.name;
            if (!name) name = `Guest #${Math.floor(Math.random() * 1000)}`;

            const room = await roomController.getRoom(code);
            if (!room) return;

            const members = await roomController.addMember(code, peer.id, name);
            peer.send({ action: "members:all", members });
            peer.publish(`room:${code}`, {
              action: "members:join",
              member: members.find((member) => member.id === peer.id),
            });
            peer.subscribe(`room:${code}`);
          }
          break;

        case "game:start":
          {
            const code = data.code; // TODO: Validate code
            if (!code)
              throw new MalformedPayloadError(
                "Action 'game:start' requires a 'code'"
              );

            const room = await roomController.getRoom(code);
            if (!room) return;

            const admin = await roomController.getAdmin(code);
            if (!admin || admin.id !== peer.id) return;

            const game = room.game;
            await game.start();
            peer.publish(`room:${code}`, {
              action: "game:start",
            });

            consola.info(`[Room] ${peer.id} started game in ${code}`);

            const { question, options } = game.currentQuestion;
            peer.publish(`room:${code}`, {
              action: "game:question:start",
              question,
              options,
            });

            setTimeout(async () => {
              peer.publish(`room:${code}`, {
                action: "game:question:stop",
              });
            }, game.delayMs);
          }
          break;

        case "interact:emote":
          {
            const emote = data.emote;
            if (!emote)
              throw new MalformedPayloadError(
                "Action 'interact:emote' requires an 'emote'"
              );

            const code = await roomController.getRoomOfMember(peer.id);
            consola.info(`[Room] ${peer.id} emoted ${emote} in ${code}`);

            peer.publish(`room:${code}`, {
              action: "interact:emote",
              emote,
            });
          }
          break;

        default:
          throw new MalformedPayloadError(`Unknown action '${action}'`);
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
      let code = await getRoomOfAdminSafe(peer.id);
      if (code) {
        await roomController.deleteRoom(code);

        peer.unsubscribe(`room:${code}`);
        peer.publish(`room:${code}`, {
          action: "meta:close",
        });

        return;
      }

      code = await getRoomOfMemberSafe(peer.id);
      if (code) {
        await roomController.removeMember(code, peer.id);

        peer.unsubscribe(`room:${code}`);
        peer.publish(`room:${code}`, {
          action: "members:leave",
          member: {
            id: peer.id,
          },
        });
      }
    } catch (error) {
      consola.error(error);
    }
  },
});
