/*
  Warnings:

  - A unique constraint covering the columns `[playerId,questionId]` on the table `game_answer` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "game_answer_playerId_questionId_key" ON "game_answer"("playerId", "questionId");
