import type { Word } from "./types";

export interface Tile {
    uid: number;
    char: string;
}

export interface RoundState {
    word: Word;
    pool: Tile[];
    answer: Tile[];
}

export function shuffle<T>(items: T[]): T[] {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export function startRound(word: Word): RoundState {
    const tiles = word.tiles.map((char, i) => ({ uid: i, char }));
    return { word, pool: shuffle(tiles), answer: [] }
}

export function placeTile(state: RoundState, uid: number): RoundState {
    const tile = state.pool.find(t => t.uid === uid);
    if (!tile) return state;
    return {
        ...state,
        pool: state.pool.filter(t => t.uid != uid),
        answer: [...state.answer, tile],
    };
}

export function removeTile(state: RoundState, uid: number): RoundState {
    const tile = state.answer.find(t => t.uid === uid);
    if (!tile) return state;
    return {
        ...state,
        answer: state.answer.filter(t => t.uid !== uid),
        pool: [...state.pool, tile],
    };
}

export function isComplete(state: RoundState): boolean {
    return state.pool.length === 0;
}

export function isCorrect(state: RoundState): boolean {
    return isComplete(state) &&
        state.answer.map(t => t.char).join("") === state.word.tiles.join("");
}