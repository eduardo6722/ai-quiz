const LEARNER_COPY: Record<string, string> = {
  CREATE_QUIZ_INVALID: "Check the topic, URL, and question count.",
  SOURCE_UNSAFE_DESTINATION: "That address cannot be used as a quiz source.",
  SOURCE_UNSUPPORTED_TYPE: "That source is not usable Markdown.",
  SOURCE_TOO_LARGE: "That source is too large to use.",
  SOURCE_UNUSABLE: "That source is not usable Markdown.",
  SOURCE_TIMEOUT: "Could not read the Markdown source. Try again.",
  SOURCE_FETCH_FAILED: "Could not read the Markdown source. Try again.",
  GENERATION_INVALID: "Could not prepare questions from that source. Try again.",
  GENERATION_RETRIES_EXHAUSTED: "Could not prepare questions from that source. Try again.",
  GENERATION_UPSTREAM_FAILED: "Could not prepare questions from that source. Try again.",
  QUIZ_INVALID: "Could not prepare questions from that source. Try again.",
  QUIZ_NOT_FOUND: "This quiz is not available.",
  QUIZ_NOT_PLAYABLE: "This quiz is not available.",
  ATTEMPT_NOT_FOUND: "This result cannot be shown from this browser sitting.",
  UNAUTHORIZED_ATTEMPT: "This result cannot be shown from this browser sitting.",
  ATTEMPT_NOT_SCORED: "Submit your answers to see the result.",
  SUBMIT_ANSWERS_INVALID: "Check your answers and try submitting again.",
  SELECTION_ILLEGAL: "Check your answers and try submitting again.",
  ATTEMPT_INCOMPLETE: "Answer every question before submitting.",
  REQUEST_RATE_LIMITED: "Too many quizzes right now. Wait a minute and try again.",
  GENERATION_CONCURRENCY_LIMIT: "The quiz service is busy. Try again in a moment.",
  NETWORK: "Could not reach the quiz service. Try again.",
  INTERNAL_ERROR: "Something went wrong. Try again.",
};

export function learnerMessageForCode(code: string): string {
  return LEARNER_COPY[code] ?? "Something went wrong. Try again.";
}
