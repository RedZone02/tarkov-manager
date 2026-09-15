import type { NextRequest } from 'next/server';
import { parseGameMode } from '@/lib/game-mode';
import { searchItems } from '@/lib/tarkov/items';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = parseGameMode(params.get('mode'));

  try {
    const items = await searchItems(mode, params.get('q') ?? '', 20);
    return Response.json({ items });
  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Item data from tarkov.dev is unavailable right now.' }, { status: 502 });
  }
}
