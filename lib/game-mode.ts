export type GameMode = 'regular' | 'pve';

export const GAME_MODE_COOKIE = 'tm_mode';

export function parseGameMode(value: string | null | undefined): GameMode {
  return value === 'pve' ? 'pve' : 'regular';
}
