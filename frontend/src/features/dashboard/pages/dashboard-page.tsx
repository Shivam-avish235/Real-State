import { BriefcaseBusiness, Building2, MessageCircleMore, ShieldCheck, UsersRound, WalletCards } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth.store";

export const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const [pulse] = useState(false);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 rounded-xl border bg-card/85 p-6 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Phase 4 workspace is active</p>
            <h1 className="font-display text-3xl font-semibold">Welcome back, {user?.firstName}</h1>
            <p className="text-sm text-muted-foreground">
              Role: <span className="font-semibold text-foreground">{user?.role}</span>
            </p>
          </div>

          <Button asChild variant="outline" className="gap-2">
            <Link to="/integrations">Open Integrations</Link>
          </Button>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <BriefcaseBusiness className="h-5 w-5 text-primary" />
                Lead Operations
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Capture inquiries from manual/API channels and convert qualified leads into clients.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <UsersRound className="h-5 w-5 text-primary" />
                Client Management
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Manage buyer/seller profiles, interaction history, and visited property records.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Building2 className="h-5 w-5 text-primary" />
                Property Inventory
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Publish listings with status tracking, portfolio visibility, and ownership mapping.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <WalletCards className="h-5 w-5 text-secondary" />
                Deal Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Drag and drop deals through Inquiry, Negotiation, Agreement, Closed, and Lost stages.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <MessageCircleMore className="h-5 w-5 text-primary" />
                Communication + Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Timeline logging, reminders, and notification status updates are centralized.
            </CardContent>
          </Card>

          <Card className={pulse ? "animate-pulse" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Integrations + Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              API credentials, webhook endpoints, and reporting exports are ready for operations.
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
};
