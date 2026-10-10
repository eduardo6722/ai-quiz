# Tailwind + shadcn/ui Recipes

> Implementation examples for the AI Quiz Generator. Source of truth for palette/type/layout is `../SKILL.md`. These snippets are **templates to adapt**, not claims that the project files already exist.

## 1. Semantic Tailwind v4 theme

Set up shared color tokens once, then map them to Tailwind utilities. If shadcn/ui has already generated `globals.css`, **merge** this carefully with its tokens rather than adding another competing theme.

```css
/* apps/web/src/app/globals.css */
@import "tailwindcss";

:root {
  --background: #f7fbf7;
  --foreground: #173f32;
  --card: #ffffff;
  --card-foreground: #173f32;
  --popover: #ffffff;
  --popover-foreground: #173f32;
  --primary: #23624b;
  --primary-foreground: #ffffff;
  --secondary: #eaf3e9;
  --secondary-foreground: #173f32;
  --muted: #eaf3e9;
  --muted-foreground: #53695d;
  --accent: #dff2e4;
  --accent-foreground: #173f32;
  --destructive: #a53d33;
  --border: #d4e6d8;
  --input: #d4e6d8;
  --ring: #388568;
  --cream: #fbf8f1;
  --mint: #dff2e4;
  --sage: #eaf3e9;
  --leaf: #567d58;
  --success: #27734e;
  --warning: #a66518;
  --radius: 0.875rem;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-cream: var(--cream);
  --color-mint: var(--mint);
  --color-sage: var(--sage);
  --color-leaf: var(--leaf);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --radius-lg: var(--radius);
  --font-sans: "Avenir Next", "Segoe UI", Arial, sans-serif;
  --font-display: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
}
```

Note: shadcn/ui may generate more semantic/radius tokens. Preserve required ones, configure source scanning for workspace UI packages, and align any dark-mode implementation to the same semantic names (a dark theme is **not** required for the first release).

## 2. Page shell and editorial heading

```tsx
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-svh bg-background font-sans text-foreground antialiased">
      <div className="mx-auto w-full max-w-[1150px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {children}
      </div>
    </main>
  );
}

export function SectionHeading() {
  return (
    <div className="max-w-2xl space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
        Learn through questions
      </p>
      <h1 className="font-display text-[34px] font-normal leading-[1.15] tracking-tight sm:text-[40px] lg:text-[46px]">
        Turn what you read into <span className="italic text-leaf">what you know.</span>
      </h1>
      <p className="text-base leading-relaxed text-muted-foreground">
        Enter a topic and a Markdown source to generate a focused quiz.
      </p>
    </div>
  );
}
```

## 3. Warm content card and icon tile

```tsx
<Card className="rounded-2xl border border-border bg-card p-4 shadow-none sm:p-6">
  <CardHeader className="flex flex-row items-center gap-3 p-0 pb-5">
    <span className="grid size-10 place-items-center rounded-xl bg-sage text-primary" aria-hidden="true">
      <BookOpen className="size-5" />
    </span>
    <div>
      <CardTitle className="text-lg font-semibold">Quiz settings</CardTitle>
      <CardDescription className="text-sm text-muted-foreground">
        Choose the source and topic.
      </CardDescription>
    </div>
  </CardHeader>
  <CardContent className="space-y-5 p-0">{/* form */}</CardContent>
</Card>
```

Use Lucide icons already shipped with shadcn/ui. Do not add another icon library just to show botanical icons.

## 4. Quiz setup form (React Hook Form + Zod)

Use `zodResolver(schema)` in the form hook and shadcn field primitives where available. Set `noValidate` if custom validation controls the message flow; keep `aria-invalid`, descriptions and errors connected. Simplified presentation pattern:

```tsx
<form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
  <div className="space-y-2">
    <Label htmlFor="topic" className="text-sm font-medium text-foreground">Topic</Label>
    <Input
      id="topic"
      {...form.register("topic")}
      aria-invalid={!!form.formState.errors.topic}
      aria-describedby={form.formState.errors.topic ? "topic-error" : undefined}
      placeholder="e.g. Node.js architecture"
      className="min-h-11 rounded-xl border-border bg-card text-base focus-visible:ring-ring"
    />
    {form.formState.errors.topic?.message && (
      <p id="topic-error" role="alert" className="text-sm text-destructive">
        {form.formState.errors.topic.message}
      </p>
    )}
  </div>
  {/* Provide a similarly labeled sourceUrl field */}
  <Button type="submit" className="min-h-11 w-full rounded-xl bg-primary px-6 text-base text-primary-foreground hover:bg-primary/90 sm:w-auto">
    Generate quiz
  </Button>
</form>
```

`min-h-11` equals 44px with standard Tailwind spacing. Avoid shrinking interactive controls on phones.

## 5. Single/multiple option card

For a **single** choice, prefer a true radio group. For **multiple** choices, use actual checkboxes with labels. The component below illustrates only the visual wrapper; preserve native accessible input semantics via `RadioGroupItem` / `Checkbox` and their labels.

```tsx
const optionBase =
  "flex min-h-14 w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-base leading-relaxed transition-colors motion-reduce:transition-none";

const optionState = {
  selected: "border-primary bg-mint text-foreground",
  idle: "border-border bg-card text-foreground hover:border-primary/50 hover:bg-sage",
  disabled: "cursor-not-allowed opacity-60",
} as const;

<div className={cn(optionBase, optionState[selected ? "selected" : "idle"])}>
  {/* Accessible RadioGroupItem / Checkbox, associated Label, and option text */}
</div>
```

Do not use `onClick` on a bare `div` to simulate a radio button; the input/control and label must remain keyboard-accessible. Do not label the selected option as correct until the attempt is submitted.

## 6. Progress, step label and actions

```tsx
<div className="space-y-3" aria-label={`Question ${index + 1} of ${total}`}>
  <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
    <p>Question {index + 1} of {total}</p>
    <p>{Math.round(((index + 1) / total) * 100)}% complete</p>
  </div>
  <Progress value={((index + 1) / total) * 100} className="h-2 bg-sage" />
</div>
```

Progress percentage describes the current step; it is **not** quiz correctness or weighted score.

## 7. Results hero

```tsx
<section className="rounded-2xl border border-border bg-cream p-6 text-center sm:p-10">
  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Quiz complete</p>
  <h1 className="mt-3 font-display text-[34px] font-normal tracking-tight sm:text-[40px]">
    Nice work. Here's your result.
  </h1>
  <p className="mt-5 text-5xl font-semibold tabular-nums text-primary" aria-label={`${score.toFixed(2)} out of 4`}>
    {score.toFixed(2)} <span className="text-2xl text-muted-foreground">/ 4.00</span>
  </p>
  <p className="mt-2 text-sm text-muted-foreground">Weighted quiz score</p>
</section>
```

Only show `score` after the server has persisted and returned the result; never compute the authoritative score in the browser.

## 8. Composition / code-review checklist

- [ ] Palette comes from semantic tokens, not hardcoded hex in JSX.
- [ ] Existing shared UI component or variant used before inventing another copy.
- [ ] All inputs and quiz choices have semantic controls and associated labels.
- [ ] No option correctness leak before submission.
- [ ] Text fits in responsive cards; very long URLs and choices wrap safely.
- [ ] Loading, invalid, disabled and success states exist and are accessible.
- [ ] Keyboard, contrast and reduced-motion behavior checked.
- [ ] ESLint, TypeScript and relevant Jest tests pass.
