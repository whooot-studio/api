import consola from "consola";
import { Game } from "~/types/Game";

/**
 * Generate a random 8-character (uppercase) code
 * @returns
 */
function generateRandomCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

export class MalformedPayloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MalformedPayloadError";
  }
}

type User = {
  id: string;
  name?: string;
};

type Room = {
  quiz: string;
  admin?: User;
  members: User[];

  game: Game;
};

const rooms = new Map<string, Room>();

/**
 * Create a new room
 * @param quizId Quiz ID
 * @returns Room code
 */
export async function createRoom(quizId: string, delayMs: number) {
  const code = generateRandomCode();

  const game = new Game(+quizId, delayMs);
  rooms.set(code, {
    quiz: quizId,
    members: [],
    game,
  });

  await game.setup();

  consola.info(`[Room] created ${code} (${quizId})`);

  return code;
}

export class RoomNotFoundError extends Error {
  constructor(code: string) {
    super(`Room ${code} not found`);
    this.name = "RoomNotFoundError";
  }
}

/**
 * Delete a room
 * @param code Room code
 * @throws RoomNotFoundError
 */
export async function deleteRoom(code: string) {
  if (!rooms.has(code)) throw new RoomNotFoundError(code);

  rooms.delete(code);

  consola.info(`[Room] deleted ${code}`);
}

/**
 * Get the room object
 * @param code Room code
 * @returns Room object
 * @throws RoomNotFoundError
 */
export async function getRoom(code: string) {
  if (!rooms.has(code)) throw new RoomNotFoundError(code);

  return rooms.get(code);
}

export class MemberNotFoundError extends Error {
  constructor(member: string) {
    super(`Member ${member} not found`);
    this.name = "MemberNotFoundError";
  }
}

/**
 * Get the room code of a member
 * @param memberId Member ID
 * @returns Room code
 * @throws MemberNotFoundError
 */
export async function getRoomOfMember(memberId: string) {
  for (const [code, room] of rooms) {
    if (room.members.some((member) => member.id === memberId)) return code;
  }

  throw new MemberNotFoundError(memberId);
}

/**
 * Get the room code of an admin
 * @param adminId Admin ID
 * @returns Room code
 * @throws MemberNotFoundError
 */
export async function getRoomOfAdmin(adminId: string) {
  for (const [code, room] of rooms) {
    if (room.admin?.id === adminId) return code;
  }

  throw new MemberNotFoundError(adminId);
}

/**
 * Get the status of a player
 * @param memberId Member ID
 * @returns Status and room code
 * @throws MemberNotFoundError
 */
export async function getStatusAndRoom(memberId: string) {
  for (const [code, room] of rooms) {
    if (room.admin?.id === memberId) return { status: "admin", code };
    if (room.members.some((member) => member.id === memberId))
      return { status: "member", code };
  }

  throw new MemberNotFoundError(memberId);
}

/**
 * Get the list of members in a room
 * @param code Room code
 * @returns List of members
 * @throws RoomNotFoundError
 */
export async function getMembers(code: string) {
  if (!rooms.has(code)) throw new RoomNotFoundError(code);

  const room = rooms.get(code) as Room;
  return room.members;
}

const MAX_MEMBERS = 4;
export class RoomFullError extends Error {
  constructor(code: string) {
    super(`Room ${code} is full`);
    this.name = "RoomFullError";
  }
}

export class MemberAlreadyExistsError extends Error {
  constructor(member: string) {
    super(`Member ${member} already in room`);
    this.name = "MemberAlreadyExistsError";
  }
}

/**
 * Add a member to a room
 * @param code Room code
 * @param memberId Member ID
 * @returns List of members
 * @throws RoomNotFoundError
 * @throws RoomFullError
 * @throws MemberAlreadyExistsError
 */
export async function addMember(code: string, memberId: string, name?: string) {
  if (!rooms.has(code)) throw new RoomNotFoundError(code);

  const room = rooms.get(code) as Room;

  if (room.members.length >= MAX_MEMBERS) {
    consola.info(`[Room] ${code} is full`);
    throw new RoomFullError(code);
  }

  if (room.members.some((member) => member.id === memberId)) {
    consola.info(`[Room] ${memberId} already in ${code}`);
    throw new MemberAlreadyExistsError(memberId);
  }

  room.members.push({
    id: memberId,
    name,
  });
  consola.info(
    `[Room] ${memberId} ${name ? "(" + name + ")" : ""} joined ${code} (${
      room.members.length
    })`
  );

  return room.members;
}

export class MemberNotInRoomError extends Error {
  constructor(memberId: string) {
    super(`Member ${memberId} not in room`);
    this.name = "MemberNotInRoomError";
  }
}

/**
 * Remove a member from a room
 * @param code Room code
 * @param member Member ID
 * @throws RoomNotFoundError
 * @throws MemberNotInRoomError
 */
export async function removeMember(code: string, memberId: string) {
  if (!rooms.has(code)) throw new RoomNotFoundError(code);
  const room = rooms.get(code) as Room;

  const oldLength = room.members.length;
  room.members = room.members.filter((member) => member.id !== memberId);

  if (oldLength === room.members.length) {
    consola.info(`[Room] ${memberId} not in ${code}`);
    throw new MemberNotInRoomError(memberId);
  }

  consola.info(`[Room] ${memberId} left ${code} (${room.members.length})`);

  if (room.members.length === 0 && !room.admin) deleteRoom(code);
}

/**
 * Set the admin of a room
 * @param code Room code
 * @param admin Admin ID
 * @throws RoomNotFoundError
 */
export async function setAdmin(code: string, admin: string) {
  if (!rooms.has(code)) throw new RoomNotFoundError(code);
  const room = rooms.get(code) as Room;

  room.admin = {
    id: admin,
  };

  consola.info(`[Room] ${admin} is now admin of ${code}`);
}

/**
 * Get the admin of a room
 * @param code Room code
 * @returns Admin ID
 * @throws RoomNotFoundError
 */
export async function getAdmin(code: string) {
  if (!rooms.has(code)) throw new RoomNotFoundError(code);
  const room = rooms.get(code) as Room;

  return room.admin;
}

export default {
  createRoom,
  deleteRoom,
  getRoom,
  getRoomOfMember,
  getRoomOfAdmin,
  getStatusAndRoom,
  getMembers,
  addMember,
  removeMember,
  setAdmin,
  getAdmin,

  MAX_MEMBERS,

  MalformedPayloadError,
  RoomNotFoundError,
  RoomFullError,
  MemberAlreadyExistsError,
  MemberNotFoundError,
  MemberNotInRoomError,
};
