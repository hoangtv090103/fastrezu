import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase-server'
import { requirePermission } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const service = createServiceClient()
    await requirePermission(service, user.id, 'users', 'read')

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') ?? ''
    const tier = searchParams.get('tier')
    const status = searchParams.get('status') // 'active' | 'suspended'
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100)
    const offset = parseInt(searchParams.get('offset') ?? '0')

    let query = service
      .from('user_profiles')
      .select('id, email, full_name, subscription_tier, active, deleted_at, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
    }
    if (tier) query = query.eq('subscription_tier', tier)
    if (status === 'active') query = query.eq('active', true)
    if (status === 'suspended') query = query.eq('active', false)

    const { data, count, error } = await query
    if (error) throw error

    return NextResponse.json({ users: data ?? [], total: count ?? 0 })
  } catch (err) {
    if (err instanceof Response) return err
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
