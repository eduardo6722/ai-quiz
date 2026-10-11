import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Param, Post } from "@nestjs/common";
import { GetQuizResultUseCase, SubmitQuizUseCase } from "@ai-quiz/application";
import { parseSubmitAnswersRequest } from "@ai-quiz/contracts";
import { hashAttemptToken, parseBearerToken } from "./attempt-token";

@Controller("v1/attempts")
export class AttemptController {
  constructor(
    private readonly submitQuiz: SubmitQuizUseCase,
    private readonly getResult: GetQuizResultUseCase,
  ) {}

  @Post(":attemptId/submit")
  @HttpCode(HttpStatus.OK)
  async submit(
    @Param("attemptId") attemptId: string,
    @Headers("authorization") authorization: string | undefined,
    @Body() body: unknown,
  ) {
    const token = parseBearerToken(authorization);
    const payload = parseSubmitAnswersRequest(body);
    return this.submitQuiz.execute({
      attemptId,
      tokenHash: hashAttemptToken(token),
      answers: payload.answers,
    });
  }

  @Get(":attemptId/result")
  async result(
    @Param("attemptId") attemptId: string,
    @Headers("authorization") authorization: string | undefined,
  ) {
    const token = parseBearerToken(authorization);
    return this.getResult.execute({
      attemptId,
      tokenHash: hashAttemptToken(token),
    });
  }
}
