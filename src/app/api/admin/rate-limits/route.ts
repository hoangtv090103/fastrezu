import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase-server'
import { requirePermission } from '@/lib/admin-auth'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    await requirePermission(service, user.id, 'rate_limits', 'read')

    const { data } = await service
      .from('ai_rate_limit_config')
      .select('tier, feature, daily_limit')
      .order('tier')
      .order('feature')

    return NextResponse.json({ configs: data ?? [] })
  } catch (err) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    await requirePermission(service, user.id, 'rate_limits', 'write')

    const body = await request.json() as {
      rows: Array<{ tier: string; feature: string; daily_limit: number }>
    }

    if (!Array.isArray(body.rows) || body.rows.length === 0) {
      return NextResponse.json({ error: 'rows must be a non-empty array' }, { status: 400 })
    }

    const { error } = await service
      .from('ai_rate_limit_config')
      .upsert(body.rows.map((r) => ({
        tier: r.tier,
        feature: r.feature,
        daily_limit: r.daily_limit,
        updated_at: new Date().toISOString(),
      })))
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
