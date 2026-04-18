import { Building2, LineChart, ShieldCheck } from "lucide-react";
import type { PropsWithChildren, ReactNode } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AuthShellProps = PropsWithChildren<{
  title: string;
  description: string;
  footer?: ReactNode;
}>;

export const AuthShell = ({ title, description, footer, children }: AuthShellProps) => {
  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-slate-950 px-8 py-10 text-white lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(249,115,22,0.45),transparent_42%),radial-gradient(circle_at_90%_10%,rgba(14,165,233,0.4),transparent_38%)]" />
        <div className="relative z-10 mx-auto flex h-full max-w-xl flex-col justify-between">
          <div className="space-y-4">
            <p className="inline-flex items-center rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-wide text-white/80">
              Real Estate CRM
            </p>
            <h1 className="font-display text-4xl font-bold leading-tight">
              Convert leads faster and manage every property interaction from one intelligent pipeline.
            </h1>
            <p className="max-w-md text-sm text-white/80">
              Built for high-performance sales teams with role-based access, secure authentication, and analytics-first workflows.
            </p>
          </div>

          <div className="grid gap-3 text-sm text-white/90">
            <div className="flex items-center gap-3 rounded-lg border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <ShieldCheck className="h-4 w-4" />
              JWT sessions with secure refresh rotation
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <Building2 className="h-4 w-4" />
              Built for lead, property, and deal workflows
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <LineChart className="h-4 w-4" />
              Analytics-ready architecture from day one
            </div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center p-4 sm:p-8">
        <Card className="w-full max-w-md animate-fade-up border-white/60 bg-white/90 shadow-xl backdrop-blur">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">{children}</div>
            {footer ? <div className="mt-6 border-t pt-4 text-sm text-muted-foreground">{footer}</div> : null}
          </CardContent>
        </Card>
      </section>
    </main>
  );
};
