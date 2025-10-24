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
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify CV ownership
  const { data: cv, error } = await (supabase as any)
    .from('cvs')
    .select('user_id, title')
    .eq('id', cvId)
    .single();


  if (error) {
    redirect("/dashboard");
  }

  if (!cv || cv.user_id !== user.id) {
    redirect("/dashboard");
  }

  return (
    <CVEditorProvider cvId={cvId} userId={user.id}>
      <CVEditorLayout />
    </CVEditorProvider>
  );
}
