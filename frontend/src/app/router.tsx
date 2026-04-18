import { useEffect, useState } from "react";
import { Navigate, Outlet, RouterProvider, createBrowserRouter } from "react-router-dom";

import { AppShell } from "@/components/layout/app-shell";
import { authApi } from "@/features/auth/api/auth.api";
import { LoginPage } from "@/features/auth/pages/login-page";
import { RegisterPage } from "@/features/auth/pages/register-page";
import { ClientsPage } from "@/features/clients/pages/clients-page";
import { CommunicationsPage } from "@/features/communications/pages/communications-page";
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page";
import { DealsPage } from "@/features/deals/pages/deals-page";
import { IntegrationsPage } from "@/features/integrations/pages/integrations-page";
import { LeadsPage } from "@/features/leads/pages/leads-page";
import { PropertiesPage } from "@/features/properties/pages/properties-page";
import { ReportsPage } from "@/features/reports/pages/reports-page";
import { UsersPage } from "@/features/users/pages/users-page";
import { useAuthStore } from "@/store/auth.store";
import { AppProviders } from "./providers";

const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => Boolean(state.user && state.accessToken));
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const PublicOnlyRoute = () => {
  const isAuthenticated = useAuthStore((state) => Boolean(state.user && state.accessToken));
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

const RootRedirect = () => {
  const isAuthenticated = useAuthStore((state) => Boolean(state.user && state.accessToken));
  return <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />;
};

const ProtectedLayout = () => {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootRedirect />
  },
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        path: "/login",
        element: <LoginPage />
      },
      {
        path: "/register",
        element: <RegisterPage />
      }
    ]
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <ProtectedLayout />,
        children: [
          {
            path: "/dashboard",
            element: <DashboardPage />
          },
          {
            path: "/clients",
            element: <ClientsPage />
          },
          {
            path: "/deals",
            element: <DealsPage />
          },
          {
            path: "/communications",
            element: <CommunicationsPage />
          },
          {
            path: "/reports",
            element: <ReportsPage />
          },
          {
            path: "/leads",
            element: <LeadsPage />
          },
          {
            path: "/properties",
            element: <PropertiesPage />
          },
          {
            path: "/users",
            element: <UsersPage />
          },
          {
            path: "/integrations",
            element: <IntegrationsPage />
          }
        ]
      }
    ]
  },
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
]);

const BootstrappedRouter = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const bootstrap = async (): Promise<void> => {
      try {
        if (accessToken) {
          try {
            const user = await authApi.me();
            if (active) {
              setSession(user, accessToken);
            }
          } catch {
            const refreshed = await authApi.refresh();
            if (active) {
              setSession(refreshed.user, refreshed.accessToken);
            }
          }
        } else {
          try {
            const refreshed = await authApi.refresh();
            if (active) {
              setSession(refreshed.user, refreshed.accessToken);
            }
          } catch {
            if (active) {
              clearSession();
            }
          }
        }
      } catch {
        if (active) {
          clearSession();
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, [accessToken, clearSession, setSession]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl border bg-card p-6 text-center shadow-sm">
          <p className="font-display text-xl">Preparing workspace</p>
          <p className="mt-1 text-sm text-muted-foreground">Verifying your secure session...</p>
        </div>
      </div>
    );
  }

  return <RouterProvider router={router} />;
};

export const AppRouter = () => {
  return (
    <AppProviders>
      <BootstrappedRouter />
    </AppProviders>
  );
};
