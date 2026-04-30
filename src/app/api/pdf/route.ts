import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// PDF generation happens client-side using html2canvas + jsPDF
// This endpoint validates the request and returns letter data for the admin
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const letterId = searchParams.get('id')

  if (!letterId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const supabase = await createAdminClient()
  const { data: letter, error } = await supabase
    .from('letters')
    .select('*, address:addresses(*), profile:profiles(name, email)')
    .eq('id', letterId)
    .single()

  if (error || !letter) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ letter })
}
