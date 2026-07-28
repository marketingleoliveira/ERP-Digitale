import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminMesAgentsLayout } from "@/components/admin/mes-agents/layout";

export const Route = createFileRoute("/admin/mes-agents")({
  beforeLoad: async ({ context }) => {
    // Basic RBAC check should happen in the component or a dedicated hook
    // But we can do a high-level redirect if needed.
    // However, the component itself handles permissions based on roles.
  },
  component: AdminMesAgentsPage,
});

function AdminMesAgentsPage() {
  return <AdminMesAgentsLayout />;
}
