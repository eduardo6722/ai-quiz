import { z } from "zod";

const generatedOptionSchema = z.object({
  label: z.string().trim().min(1),
  isCorrect: z.boolean(),
});

const generatedQuestionSchema = z
  .object({
    prompt: z.string().trim().min(1),
    type: z.enum(["single", "multiple"]),
    sourceExcerpt: z.string().min(1),
    options: z.array(generatedOptionSchema).length(4),
  })
  .superRefine((question, context) => {
    const labels = question.options.map((option) => option.label.trim());
    if (new Set(labels).size !== 4) {
      context.addIssue({
        code: "custom",
        message: "option labels must be unique",
      });
    }
  });

export function generatedQuizSchema(count: number) {
  return z.object({
    questions: z.array(generatedQuestionSchema).length(count),
  });
}

export type GeneratedQuizPayload = z.infer<ReturnType<typeof generatedQuizSchema>>;
