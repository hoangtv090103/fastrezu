'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import type { Json } from '@/types/database.types';

export type SectionType =
  | 'personal' | 'experience' | 'education' | 'skills' | 'summary'
  | 'projects' | 'certifications'
  | 'awards' | 'volunteering' | 'hobbies' | 'references' | 'publications';

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

/**
 * Upsert vault settings (enabled_sections) for the current user.
 * Saves to vault_settings table (UNIQUE user_id).
 */
export async function upsertVaultSettings(
  enabledSections: string[]
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: 'Unauthorised' };
  }

  const { error } = await supabase
    .from('vault_settings')
    .upsert(
      {
        user_id: user.id,
        enabled_sections: enabledSections,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

  if (error) {
    console.error('[upsertVaultSettings] error:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
