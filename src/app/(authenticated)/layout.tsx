import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import AuthenticatedHeader from "@/components/layout/AuthenticatedHeader";
import FeedbackButton from "@/components/ui/FeedbackButton";
import MainLayoutWrapper from "@/components/layout/MainLayoutWrapper";

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
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <AuthenticatedHeader user={user} userProfile={userProfile} />
      <MainLayoutWrapper>{children}</MainLayoutWrapper>
      <FeedbackButton />
    </div>
  );
}
