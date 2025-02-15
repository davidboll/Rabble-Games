// Shared utilities and types for Rabble Games

export interface GameCode {
  id: string;
  pointLevel: number;
  used: boolean;
}

export function generateGameCodePath(gameId: string, pointLevel: number, codeType: 'available' | 'fallback'): string {
  return `games/${gameId}/codes/${codeType}/${pointLevel}`;
}
