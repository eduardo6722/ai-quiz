import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, PageShell } from "@ai-quiz/ui";
import { env } from "../env";

export default function HomePage() {
  return (
    <PageShell>
      <div className="flex max-w-2xl flex-col gap-8">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Local workspace</p>
          <h1 className="font-display text-[34px] font-normal leading-[1.15] tracking-tight sm:text-[40px] lg:text-[46px]">
            AI Quiz Generator is <span className="italic text-leaf">ready to grow.</span>
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            This shell confirms the local platform is running. Quiz setup, play, and results arrive in later
            phases.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>API status</CardTitle>
            <CardDescription>Open the API liveness check to confirm the backend process is up.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button href={`${env.NEXT_PUBLIC_API_URL}/health`}>View API health</Button>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
