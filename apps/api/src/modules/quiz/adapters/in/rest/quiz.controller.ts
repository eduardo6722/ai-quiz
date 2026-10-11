import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from "@nestjs/common";
import {
  CreateQuizUseCase,
  GetQuizUseCase,
  StartAttemptUseCase,
} from "@ai-quiz/application";
import { parseCreateQuizRequest } from "@ai-quiz/contracts";
import { hashAttemptToken, mintAttemptToken } from "./attempt-token";

@Controller("v1/quizzes")
export class QuizController {
  constructor(
    private readonly createQuiz: CreateQuizUseCase,
    private readonly getQuiz: GetQuizUseCase,
    private readonly startAttempt: StartAttemptUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: unknown) {
    const request = parseCreateQuizRequest(body);
    return this.createQuiz.execute(request);
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
