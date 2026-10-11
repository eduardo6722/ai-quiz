export type TelemetryStageName =
  | "create-quiz"
  | "fetch"
  | "preprocessing"
  | "generation"
  | "validation";

export type TelemetryAttributes = {
  correlationId?: string;
  strategy?: string;
  quizId?: string;
  modelId?: string;
  promptVersion?: string;
  attempt?: number;
  errorCode?: string;
  sourceHash?: string;
  topicChars?: number;
  sourceChars?: number;
  inputTokens?: number;
  outputTokens?: number;
};

export type TelemetryPort = {
  runStage<T>(
    input: { name: TelemetryStageName; attributes?: TelemetryAttributes },
    fn: () => Promise<T>,
  ): Promise<T>;
  recordEvent(input: { name: string; attributes?: TelemetryAttributes }): void;
};
