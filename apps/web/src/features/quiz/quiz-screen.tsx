import type { ReactNode } from 'react';
import { Alert, Button, Card, PageShell, Skeleton } from '@ai-quiz/ui';
import { ArrowLeft, BookOpen, Sprout } from 'lucide-react';

export function QuizScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-background font-sans text-foreground antialiased">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-xl bg-primary px-6 py-3 text-primary-foreground focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to content
      </a>
      <header className="border-b border-border/70">
        <div className="mx-auto flex max-w-[1150px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <a
            href="/"
            aria-label="AI Quiz Generator home"
            className="inline-flex min-h-11 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Sprout className="size-5" aria-hidden="true" />
            </span>
            <span className="text-base font-semibold tracking-tight sm:text-lg">
              AI Quiz Generator
            </span>
          </a>
          <a
            href="/"
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 motion-reduce:transition-none"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> Home
          </a>
        </div>
      </header>
      <PageShell id="main-content" tabIndex={-1} className="min-h-0 flex-1 [&>div]:py-5">
        {children}
      </PageShell>
      <footer className="mx-auto flex w-full max-w-[1150px] flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:px-6 lg:px-8">
        <p className="inline-flex items-center gap-2">
          <Sprout className="size-4 text-leaf" aria-hidden="true" /> A little learning, a little
          growth.
        </p>
        <p>Made for curious minds.</p>
      </footer>
    </div>
  );
}

export function QuizLoading({ result = false }: { result?: boolean }) {
  return (
    <div className="mx-auto w-full max-w-[720px] space-y-8 py-4 sm:py-6">
      <p role="status" className="flex items-center gap-3 text-base text-muted-foreground">
        <BookOpen className="size-5 text-primary" aria-hidden="true" />
        {result ? 'Loading result…' : 'Loading quiz…'}
      </p>
      <div aria-hidden="true" className="space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-2 w-full" />
        <Card className="space-y-4 rounded-3xl p-5 sm:p-8">
          <Skeleton className="mb-8 h-14 w-5/6" />
          {[0, 1, 2, 3].map((row) => (
            <Skeleton key={row} className="h-16 w-full" />
          ))}
        </Card>
      </div>
    </div>
  );
}

export function QuizErrorState({ message }: { message: string }) {
  return (
    <Card className="mx-auto my-8 w-full max-w-[720px] space-y-6 rounded-3xl p-6 sm:p-10">
      <span className="grid size-12 place-items-center rounded-2xl bg-sage text-primary">
        <BookOpen className="size-6" aria-hidden="true" />
      </span>
      <h1 className="font-display text-[32px] font-normal leading-tight tracking-tight sm:text-[38px]">
        Let’s get you back to learning.
      </h1>
      <Alert variant="destructive">{message}</Alert>
      <Button href="/" className="w-full sm:w-auto">
        Create another quiz
      </Button>
    </Card>
  );
}
