import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { CVEditorProvider } from "@/contexts/CVEditorContext";
import CVEditorLayout from "@/components/editor/CVEditorLayout";

interface EditorPageProps {
  params: {
    cvId: string;
  };
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { cvId } = await params;
  
  // Validate cvId parameter
  if (!cvId || typeof cvId !== 'string') {
    console.error('Invalid cvId parameter:', cvId);
    redirect("/dashboard");
  }

  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify CV ownership
  const { data: cv, error } = await supabase
    .from('cvs')
    .select('user_id, title')
    .eq('id', cvId)
    .single();

  if (error) {
    console.error('Error fetching CV:', error);
    redirect("/dashboard");
  }

  if (!cv) {
    console.error('CV not found:', cvId);
    redirect("/dashboard");
  }

  // Type assertion to fix TypeScript issue
  const cvData = cv as { user_id: string; title: string };
  
  if (cvData.user_id !== user.id) {
    console.error('User does not own CV:', { cvId, userId: user.id, cvUserId: cvData.user_id });
    redirect("/dashboard");
  }

  return (
    <CVEditorProvider cvId={cvId} userId={user.id}>
      <CVEditorLayout />
    </CVEditorProvider>
  );
}
