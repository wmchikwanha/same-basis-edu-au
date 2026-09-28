import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { getMyRole } from "@/lib/admin.functions";
import { setupSandboxSchool } from "@/lib/sandbox.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { isAdmin } = await getMyRole();
    if (!isAdmin) throw redirect({ to: "/dashboard" });
  },
  component: AdminLayout,
});

function AdminLayout() {
  const queryClient = useQueryClient();
  const provisioningStarted = useRef(false);

  useEffect(() => {
    if (provisioningStarted.current) return;
    provisioningStarted.current = true;
    void setupSandboxSchool({ data: { defer: false } })
      .then(() => queryClient.invalidateQueries({ queryKey: ["school"] }))
      .catch((error) => console.error("Sandbox school provisioning failed", error));
  }, [queryClient]);

  return <Outlet />;
}
