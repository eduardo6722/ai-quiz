import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req } from "@nestjs/common";
import {
  ApplicationError,
  CreateQuizUseCase,
  GetQuizUseCase,
  StartAttemptUseCase,
} from "@ai-quiz/application";
import { parseCreateQuizRequest } from "@ai-quiz/contracts";
import type { Request } from "express";
import { hashAttemptToken, mintAttemptToken } from "../../attempt/http/attempt-token";
import { CreateQuizLimiter } from "./create-quiz-limiter";

@Controller("v1/quizzes")
export class QuizController {
  constructor(
    private readonly createQuiz: CreateQuizUseCase,
    private readonly getQuiz: GetQuizUseCase,
    private readonly startAttempt: StartAttemptUseCase,
    private readonly limiter: CreateQuizLimiter,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: Request, @Body() body: unknown) {
    const request = parseCreateQuizRequest(body);
    const clientId = req.ip?.trim() || "unknown";
    const gate = this.limiter.tryAcquire(clientId);
    if (gate === "rate") {
      throw new ApplicationError("REQUEST_RATE_LIMITED", "too many quiz creates, try again shortly");
    }
    if (gate === "concurrency") {
      throw new ApplicationError("GENERATION_CONCURRENCY_LIMIT", "generation is busy, try again shortly");
    }
    try {
      return await this.createQuiz.execute(request);
    } finally {
      this.limiter.release();
    }
  }

  @Get(":quizId")
  async get(@Param("quizId") quizId: string) {
    return this.getQuiz.execute(quizId);
  }

  @Post(":quizId/attempts")
  @HttpCode(HttpStatus.CREATED)
  async start(@Param("quizId") quizId: string) {
    const token = mintAttemptToken();
    const { attemptId } = await this.startAttempt.execute({
      quizId,
      tokenHash: hashAttemptToken(token),
    });
    return { attemptId, token };
  }
}
