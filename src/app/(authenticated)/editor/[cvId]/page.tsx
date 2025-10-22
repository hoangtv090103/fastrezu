import { createServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { CVEditorProvider } from "@/contexts/CVEditorContext";
import CVEditorLayout from "@/components/editor/CVEditorLayout";

interface EditorPageProps {
  params: {
    cvId: string;
  };
}

export default async function EditorPage({ params }: EditorPageProps) {
  const supabase = createServerClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Verify CV ownership
  const { data: cv, error } = await supabase
    .from('cvs')
    .select('user_id')
    .eq('id', params.cvId)
    .single();

  if (error || !cv || cv.user_id !== user.id) {
    redirect("/dashboard");
  }

  return (
    <CVEditorProvider cvId={params.cvId}>
      <CVEditorLayout />
    </CVEditorProvider>
  );
}
