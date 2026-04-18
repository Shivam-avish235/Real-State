import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { usersApi } from "@/features/users/api/users.api";
import { useAuthStore } from "@/store/auth.store";

export const UsersPage = () => {
  const queryClient = useQueryClient();
  const currentRole = useAuthStore((state) => state.user?.role);
  const canManageUsers = currentRole === "ADMIN" || currentRole === "MANAGER";
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["users", search],
    queryFn: () => usersApi.list({ search }),
    enabled: canManageUsers
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "ACTIVE" | "INACTIVE" }) => usersApi.update(id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  });

  if (!canManageUsers) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Team Access</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Only admins and managers can access user administration.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">User Administration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Search users" value={search} onChange={(event) => setSearch(event.target.value)} />

          {isLoading ? <p className="text-sm text-muted-foreground">Loading users...</p> : null}

          <div className="space-y-2">
            {data?.items?.map((user) => {
              const nextStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

              return (
                <div key={user.id} className="rounded-lg border bg-card/70 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email} | {user.role} | {user.status}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatusMutation.mutate({ id: user.id, status: nextStatus })}
                      disabled={updateStatusMutation.isPending}
                    >
                      Set {nextStatus}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
