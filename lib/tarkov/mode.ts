import { cookies } from 'next/headers';
import { GAME_MODE_COOKIE, parseGameMode, type GameMode } from '@/lib/game-mode';

export async function getGameMode(): Promise<GameMode> {
  const store = await cookies();
  return parseGameMode(store.get(GAME_MODE_COOKIE)?.value);
}
