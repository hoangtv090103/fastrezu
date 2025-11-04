import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import AuthenticatedHeader from "@/components/layout/AuthenticatedHeader";
import FeedbackButton from "@/components/ui/FeedbackButton";

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
    <div className="flex flex-col h-screen bg-gray-50">
      <AuthenticatedHeader user={user} userProfile={userProfile} />
      <main className="flex-1 overflow-auto container mx-auto px-4 py-4">
        {children}
      </main>
      <FeedbackButton />
    </div>
  );
}
