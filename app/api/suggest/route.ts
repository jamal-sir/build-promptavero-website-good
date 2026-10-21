import { NextResponse, type NextRequest } from 'next/server'
import { searchPrompts } from '@/lib/data/public'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim().slice(0, 100) ?? ''
  if (q.length < 2) return NextResponse.json([])

  try {
    const { items } = await searchPrompts({ q, sort: 'relevance', pageSize: 5 })
    return NextResponse.json(
      items.map((p) => ({ title: p.title, slug: p.slug, category_name: p.category_name })),
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
    )
  } catch {
    return NextResponse.json([])
  }
}
