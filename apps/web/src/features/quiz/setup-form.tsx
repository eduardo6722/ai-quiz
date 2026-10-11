'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField,
  Input,
} from '@ai-quiz/ui';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronDown, Link, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { createQuiz, isQuizApiError } from './api-client';
import { learnerMessageForCode } from './error-copy';
import { GeneratingStatus } from './generating-status';

const setupFormSchema = z.object({
  topic: z
    .string()
    .trim()
    .min(1, 'Enter a topic.')
    .max(200, 'Topic must be at most 200 characters.'),
  sourceUrl: z
    .string()
    .trim()
    .min(1, 'Enter a Markdown URL.')
    .url('Enter a valid URL.')
    .refine((value) => value.startsWith('https://'), 'URL must be https.'),
  questionCount: z.number().int().min(5).max(8),
});

type SetupFormValues = z.infer<typeof setupFormSchema>;

function messageFromUnknown(error: unknown): string {
  if (isQuizApiError(error)) {
    return learnerMessageForCode(error.code);
  }
  return learnerMessageForCode('INTERNAL_ERROR');
}

export function SetupForm() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'generating' | 'failed'>('idle');
  const [banner, setBanner] = useState<string | null>(null);
  const form = useForm<SetupFormValues>({
    resolver: zodResolver(setupFormSchema),
    defaultValues: { topic: '', sourceUrl: '', questionCount: 5 },
  });

  async function onSubmit(values: SetupFormValues): Promise<void> {
    setStatus('generating');
    setBanner(null);
    try {
      const created = await createQuiz({
        topic: values.topic,
        sourceUrl: values.sourceUrl,
        questionCount: values.questionCount,
      });
      router.push(`/quiz/${created.id}`);
    } catch (error) {
      setStatus('failed');
      setBanner(messageFromUnknown(error));
    }
  }

  if (status === 'generating') {
    return <GeneratingStatus topic={form.getValues('topic')} />;
  }

  const topicError = form.formState.errors.topic?.message;
  const urlError = form.formState.errors.sourceUrl?.message;

  return (
    <Card className="overflow-hidden rounded-3xl p-5 shadow-sm sm:p-8">
      <CardHeader className="pb-6">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-mint text-primary">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <div>
            <CardTitle className="text-xl tracking-tight sm:text-2xl">Create your quiz</CardTitle>
            <CardDescription className="mt-1 text-sm">
              A topic, a source, a little curiosity.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          {banner ? (
            <Alert variant="destructive">
              <p>{banner}</p>
              <button
                type="button"
                className="mt-2 min-h-11 rounded-lg text-base font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setBanner(null)}
              >
                Try again
              </button>
            </Alert>
          ) : null}
          <FormField label="Topic" htmlFor="topic" error={topicError}>
            <Input
              id="topic"
              {...form.register('topic')}
              aria-invalid={!!topicError}
              aria-describedby={topicError ? 'topic-hint topic-error' : 'topic-hint'}
              placeholder="e.g. Node.js architecture"
              className="min-h-12 bg-background/50"
            />
            <p id="topic-hint" className="text-sm leading-relaxed text-muted-foreground">
              Choose a concept you’d like to understand better.
            </p>
          </FormField>
          <FormField label="Markdown / README URL" htmlFor="sourceUrl" error={urlError}>
            <div className="relative">
              <Link
                className="pointer-events-none absolute top-4 left-4 size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="sourceUrl"
                type="url"
                autoCapitalize="none"
                spellCheck={false}
                {...form.register('sourceUrl')}
                aria-invalid={!!urlError}
                aria-describedby={urlError ? 'sourceUrl-hint sourceUrl-error' : 'sourceUrl-hint'}
                placeholder="https://github.com/.../README.md"
                className="min-h-12 min-w-0 bg-background/50 pl-11"
              />
            </div>
            <p id="sourceUrl-hint" className="text-sm leading-relaxed text-muted-foreground">
              Paste a public HTTPS link to a Markdown file or GitHub README.
            </p>
          </FormField>
          <div className="rounded-2xl border border-border/70 bg-cream p-4">
            <FormField label="Number of questions" htmlFor="questionCount">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-24 shrink-0">
                  <select
                    id="questionCount"
                    aria-describedby="questionCount-hint"
                    {...form.register('questionCount', { valueAsNumber: true })}
                    className="min-h-11 w-full appearance-none rounded-xl border border-input bg-card pr-9 pl-4 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {[5, 6, 7, 8].map((count) => (
                      <option key={count} value={count}>
                        {count}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute top-3.5 right-3 size-4 text-primary"
                    aria-hidden="true"
                  />
                </div>
                <p id="questionCount-hint" className="text-sm text-muted-foreground">
                  Small session. Fresh perspective.
                </p>
              </div>
            </FormField>
          </div>
          <Button
            type="submit"
            className="min-h-14 w-full gap-3"
            disabled={form.formState.isSubmitting}
          >
            Generate quiz
            <ArrowRight className="size-5" aria-hidden="true" />
          </Button>
          <p className="text-center text-sm leading-relaxed text-muted-foreground">
            Your source. Your pace. Room to grow.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
