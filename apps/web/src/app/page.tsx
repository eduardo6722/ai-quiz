import { cn, PageShell } from '@ai-quiz/ui';
import { ArrowDown, ArrowUpRight, BookOpen, FileText, ListChecks, Sprout } from 'lucide-react';
import { LearningIllustration } from '../features/quiz/setup/learning-illustration';
import { SetupForm } from '../features/quiz/setup/setup-form';

const steps = [
  {
    number: '01',
    icon: FileText,
    title: 'Bring your curiosity',
    description: 'Pick a topic and link a public Markdown file or README you want to learn from.',
  },
  {
    number: '02',
    icon: BookOpen,
    title: 'Give your knowledge a go',
    description: 'Work through a focused set of questions, at your own pace, one idea at a time.',
  },
  {
    number: '03',
    icon: ListChecks,
    title: 'Find out what stuck',
    description: 'See your score and review your answers. A little reflection goes a long way.',
  },
];

const linkClassName =
  'inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 motion-reduce:transition-none';

export default function HomePage() {
  return (
    <div className="min-h-svh bg-background font-sans text-foreground antialiased">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-xl bg-primary px-6 py-3 text-primary-foreground focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to content
      </a>

      <header className="border-b border-border/70">
        <div className="mx-auto flex max-w-[1150px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <a href="/" aria-label="AI Quiz Generator home" className={cn(linkClassName, 'gap-3')}>
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Sprout className="size-5" aria-hidden="true" />
            </span>
            <span className="text-base font-semibold tracking-tight sm:text-lg">
              AI Quiz Generator
            </span>
          </a>
          <nav aria-label="Main navigation" className="shrink-0">
            <a href="#how-it-works" className={linkClassName}>
              How it works
              <ArrowDown className="hidden size-4 sm:block" aria-hidden="true" />
            </a>
          </nav>
        </div>
      </header>

      <PageShell id="main-content" tabIndex={-1} className="min-h-0">
        <section
          aria-labelledby="hero-title"
          className="grid items-center gap-10 py-4 sm:py-8 lg:grid-cols-[1.08fr_1fr] lg:gap-16 lg:py-10"
        >
          <div className="min-w-0">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-sage px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
              Learn through questions
            </p>
            <h1
              id="hero-title"
              className="max-w-lg font-display text-[40px] font-normal leading-[1.08] tracking-tight sm:text-[52px] lg:text-[60px]"
            >
              Turn what you read into <span className="italic text-leaf">what you know.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              Reading is just the beginning. Turn a README or Markdown document into a thoughtful
              quiz, and make your next learning moment stick.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <FileText className="size-4 text-primary" aria-hidden="true" />
                Your source, your topic
              </span>
              <span className="inline-flex items-center gap-2">
                <ListChecks className="size-4 text-primary" aria-hidden="true" />
                5–8 focused questions
              </span>
            </div>
            <LearningIllustration />
          </div>

          <section id="create-quiz" aria-label="Create a quiz" className="min-w-0 scroll-mt-8">
            <SetupForm />
          </section>
        </section>

        <section
          id="how-it-works"
          aria-labelledby="how-it-works-title"
          className="mt-8 scroll-mt-8 border-t border-border pt-10 pb-4 sm:mt-12 sm:pt-12"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                A small habit. A deeper understanding.
              </p>
              <h2
                id="how-it-works-title"
                className="mt-3 font-display text-[28px] font-normal tracking-tight sm:text-[32px]"
              >
                Make room for a little discovery.
              </h2>
            </div>
            <a href="#create-quiz" className={linkClassName}>
              Start with a topic <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          </div>
          <ol className="mt-8 grid gap-8 md:grid-cols-3 md:gap-6 lg:gap-10">
            {steps.map(({ number, icon: Icon, title, description }) => (
              <li key={number} className="min-w-0">
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-sage text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span
                    className="text-xs font-semibold tracking-[0.12em] text-muted-foreground"
                    aria-hidden="true"
                  >
                    {number}
                  </span>
                </div>
                <h3 className="text-base font-semibold">{title}</h3>
                <p className="mt-2 max-w-sm text-base leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </li>
            ))}
          </ol>
        </section>
      </PageShell>

      <footer className="mx-auto mt-4 flex max-w-[1150px] flex-wrap items-center justify-between gap-3 px-4 pb-6 text-sm text-muted-foreground sm:px-6 sm:pb-8 lg:px-8">
        <p className="inline-flex items-center gap-2">
          <Sprout className="size-4 text-leaf" aria-hidden="true" /> A little learning, a little
          growth.
        </p>
        <p>Made for curious minds.</p>
      </footer>
    </div>
  );
}
