import {
  createQuizRequestSchema,
  createQuizResponseSchema,
  errorResponseSchema,
  publicQuizViewSchema,
  publicResultSchema,
  startAttemptResponseSchema,
  type CreateQuizResponse,
  type PublicQuizView,
  type PublicResult,
  type StartAttemptResponse,
  type SubmitAnswersRequest,
} from "@ai-quiz/contracts";
import type { z } from "zod";
import { env } from "../../env";

type CreateQuizBody = z.input<typeof createQuizRequestSchema>;

export class QuizApiError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "QuizApiError";
    this.code = code;
  }
}

export function isQuizApiError(value: unknown): value is QuizApiError {
  return value instanceof QuizApiError;
}

function apiUrl(path: string): string {
  return `${env.NEXT_PUBLIC_API_URL}${path}`;
}

async function readError(response: Response): Promise<QuizApiError> {
  try {
    const body: unknown = await response.json();
    const parsed = errorResponseSchema.safeParse(body);
    if (parsed.success) {
      return new QuizApiError(parsed.data.code, parsed.data.message);
    }
  } catch {
    // fall through
  }
  return new QuizApiError("INTERNAL_ERROR", "Internal server error");
}

async function request(path: string, init: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      ...init,
      credentials: "omit",
      headers: {
        ...(init.body ? { "content-type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new QuizApiError("NETWORK", "Could not reach the quiz service. Try again.");
  }

  if (!response.ok) {
    throw await readError(response);
  }

  return response.json() as Promise<unknown>;
}

function bearer(token: string): { authorization: string } {
  return { authorization: `Bearer ${token}` };
}

export async function createQuiz(input: CreateQuizBody): Promise<CreateQuizResponse> {
  const body = await request("/v1/quizzes", { method: "POST", body: JSON.stringify(input) });
  return createQuizResponseSchema.parse(body);
}

export async function getQuiz(quizId: string): Promise<PublicQuizView> {
  const body = await request(`/v1/quizzes/${quizId}`, { method: "GET" });
  return publicQuizViewSchema.parse(body);
}

export async function startAttempt(quizId: string): Promise<StartAttemptResponse> {
  const body = await request(`/v1/quizzes/${quizId}/attempts`, { method: "POST" });
  return startAttemptResponseSchema.parse(body);
}

export async function submitAttempt(
  attemptId: string,
  token: string,
  payload: SubmitAnswersRequest,
): Promise<PublicResult> {
  const body = await request(`/v1/attempts/${attemptId}/submit`, {
    method: "POST",
    headers: bearer(token),
    body: JSON.stringify(payload),
  });
  return publicResultSchema.parse(body);
}

export async function getResult(attemptId: string, token: string): Promise<PublicResult> {
  const body = await request(`/v1/attempts/${attemptId}/result`, {
    method: "GET",
    headers: bearer(token),
  });
  return publicResultSchema.parse(body);
}
