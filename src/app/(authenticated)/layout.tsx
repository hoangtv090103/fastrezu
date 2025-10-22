import { createServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import AuthenticatedHeader from "@/components/layout/AuthenticatedHeader";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthenticatedHeader user={user} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
