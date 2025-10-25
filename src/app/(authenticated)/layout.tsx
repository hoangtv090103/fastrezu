import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import AuthenticatedHeader from "@/components/layout/AuthenticatedHeader";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthenticatedHeader user={user} userProfile={userProfile} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
