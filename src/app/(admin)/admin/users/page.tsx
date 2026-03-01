import { Suspense } from "react";
import { createClient, createServiceClient } from "@/lib/supabase-server";
import { requirePermission } from "@/lib/admin-auth";
import UsersTable from "@/components/admin/UsersTable";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();
  await requirePermission(service, user.id, "users", "read");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Người dùng</h1>
      <Suspense
        fallback={
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-full max-w-lg"></div>
            <div className="h-64 bg-gray-200 rounded w-full"></div>
          </div>
        }
      >
        <UsersContent />
      </Suspense>
    </div>
  );
}

async function UsersContent() {
  const service = createServiceClient();

  const { data: users } = await service
    .from("user_profiles")
    .select("id, email, full_name, subscription_tier, active, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: groups } = await service
    .from("groups")
    .select("id, name, display_name")
    .order("display_name");

  return <UsersTable initialUsers={users ?? []} groups={groups ?? []} />;
}
