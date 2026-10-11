-- CreateEnum
CREATE TYPE "QuizStatus" AS ENUM ('generating', 'ready', 'failed');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('single', 'multiple');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('open', 'scored');

-- CreateTable
CREATE TABLE "SourceDocument" (
    "id" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "resolvedUrl" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "title" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "contentSnapshot" TEXT NOT NULL,

    CONSTRAINT "SourceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" TEXT NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "strategy" TEXT NOT NULL DEFAULT 'balanced',
    "status" "QuizStatus" NOT NULL DEFAULT 'ready',
    "modelId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "type" "QuestionType" NOT NULL,
    "prompt" TEXT NOT NULL,
    "sourceExcerpt" TEXT,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,

    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAttempt" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "publicTokenHash" TEXT NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'open',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "weightedScore" DOUBLE PRECISION,
    "weightedScoreDisplay" DOUBLE PRECISION,
    "percentageDisplay" DOUBLE PRECISION,

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttemptAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "rawScore" INTEGER NOT NULL,

    CONSTRAINT "AttemptAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttemptAnswerSelection" (
    "answerId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,

    CONSTRAINT "AttemptAnswerSelection_pkey" PRIMARY KEY ("answerId","optionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Question_quizId_position_key" ON "Question"("quizId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionOption_questionId_position_key" ON "QuestionOption"("questionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "QuizAttempt_publicTokenHash_key" ON "QuizAttempt"("publicTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "AttemptAnswer_attemptId_questionId_key" ON "AttemptAnswer"("attemptId", "questionId");

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptAnswer" ADD CONSTRAINT "AttemptAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "QuizAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptAnswer" ADD CONSTRAINT "AttemptAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptAnswerSelection" ADD CONSTRAINT "AttemptAnswerSelection_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "AttemptAnswer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttemptAnswerSelection" ADD CONSTRAINT "AttemptAnswerSelection_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "QuestionOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
