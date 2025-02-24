-- DropForeignKey
ALTER TABLE "game_answer" DROP CONSTRAINT "game_answer_playerId_fkey";

-- AlterTable
ALTER TABLE "game" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "game_participant" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "image" TEXT,
    "userId" TEXT,

    CONSTRAINT "game_participant_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "game_participant" ADD CONSTRAINT "game_participant_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_participant" ADD CONSTRAINT "game_participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_answer" ADD CONSTRAINT "game_answer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "game_participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
