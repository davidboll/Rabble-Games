interface GameCode {
    id: string;
    pointLevel: number;
    used: boolean;
}
declare function generateGameCodePath(gameId: string, pointLevel: number, codeType: 'available' | 'fallback'): string;

export { GameCode, generateGameCodePath };
