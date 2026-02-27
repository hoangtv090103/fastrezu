'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import type { Json } from '@/types/database.types';

export type SectionType = 'personal' | 'experience' | 'education' | 'skills' | 'summary' | 'projects' | 'certifications';

export type ActionResult = {
  success: boolean;
  error?: string;
};

/**
 * Upsert a vault section for the current user.
 * Uses ON CONFLICT (user_id, section_type) to update or insert.
 */
export async function upsertVaultSection(
  sectionType: SectionType,
  content: Json
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorised' };
  }

  const { error } = await supabase
    .from('master_profiles')
    .upsert(
      {
        user_id: user.id,
        section_type: sectionType,
        content,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,section_type',
      }
    );

  if (error) {
    console.error('[upsertVaultSection] error:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/vault');
  return { success: true };
}
