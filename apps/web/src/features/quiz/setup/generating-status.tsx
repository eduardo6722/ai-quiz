import { Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@ai-quiz/ui';
import { Sparkles } from 'lucide-react';

export function GeneratingStatus({ topic }: { topic?: string }) {
  return (
    <Card className="flex min-h-[590px] flex-col justify-center rounded-3xl p-5 shadow-sm sm:p-8">
      <CardHeader className="gap-3 pb-6">
        <span className="mb-2 grid size-11 place-items-center rounded-xl bg-mint text-primary">
          <Sparkles className="size-5" aria-hidden="true" />
        </span>
        <CardTitle className="text-2xl tracking-tight">Preparing your quiz</CardTitle>
        <CardDescription className="break-words text-base">
          {topic ? `Topic: ${topic}` : 'Reading the source and writing questions.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p role="status" className="text-base font-medium text-primary">
          Preparing your questions…
        </p>
        <p className="pb-3 text-sm leading-relaxed text-muted-foreground">
          We’re turning your source into a focused quiz. This may take a moment.
        </p>
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-5/6" />
      </CardContent>
    </Card>
  );
}
