import { BarChart3, BriefcaseBusiness, Building2, LogOut, MessageCircleMore, Users, WalletCards } from "lucide-react";
import type { PropsWithChildren } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { authApi } from "@/features/auth/api/auth.api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: BriefcaseBusiness },
  { to: "/leads", label: "Leads", icon: BriefcaseBusiness },
  { to: "/clients", label: "Clients", icon: Users },
  { to: "/properties", label: "Properties", icon: Building2 },
  { to: "/deals", label: "Deals", icon: WalletCards },
  { to: "/communications", label: "Communications", icon: MessageCircleMore },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/users", label: "Users", icon: Users },
  { to: "/integrations", label: "Integrations", icon: BriefcaseBusiness }
];

export const AppShell = ({ children }: PropsWithChildren) => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  const handleLogout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold">Real Estate CRM</p>
              <p className="text-xs text-muted-foreground">Phase 4 Workspace</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm font-medium">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{user?.role}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[230px_1fr] lg:gap-6">
        <aside className="rounded-xl border bg-card p-3 lg:h-fit">
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;

              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition",
                      isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </NavLink>
              );
            })}
          </nav>

          <Button variant="outline" className="mt-3 w-full justify-start gap-2" onClick={() => void handleLogout()}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </aside>

        <main className="space-y-4">{children}</main>
      </div>
    </div>
  );
};
