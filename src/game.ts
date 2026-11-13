import type { Word } from "./types";

export interface Tile {
    uid: number;
    char: string;
}

export interface RoundState {
    word: Word;
    pool: Tile[];
    slots: (Tile | null)[];
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
    const slots = new Array(word.tiles.length).fill(null);
    return { word, pool: shuffle(tiles), slots };
}

// Coloca uma peça no primeiro slot vago ou no slot especificado
export function placeTileAt(state: RoundState, uid: number, slotIndex?: number): RoundState {
    const tile = state.pool.find(t => t.uid === uid) || state.slots.find(t => t?.uid === uid);
    if (!tile) return state;

    // Se o slotIndex não foi passado, procura o primeiro vago
    let targetIndex = slotIndex;
    if (targetIndex === undefined || targetIndex < 0 || targetIndex >= state.slots.length) {
        targetIndex = state.slots.findIndex(s => s === null);
    }
    if (targetIndex === -1) return state; // sem espaço

    const currentAtTarget = state.slots[targetIndex];

    // Remove a peça da sua localização anterior (pool ou slots)
    const newPool = state.pool.filter(t => t.uid !== uid);
    const newSlots = state.slots.map(s => (s?.uid === uid ? null : s));

    // Se já havia uma peça no slot de destino diferente da que está sendo movida, devolve para a pool
    if (currentAtTarget && currentAtTarget.uid !== uid) {
        newPool.push(currentAtTarget);
    }

    newSlots[targetIndex] = tile;

    return {
        ...state,
        pool: newPool,
        slots: newSlots,
    };
}

export function placeTile(state: RoundState, uid: number): RoundState {
    return placeTileAt(state, uid);
}

// Remove do slot e devolve para o pool
export function removeTileFromSlot(state: RoundState, slotIndex: number): RoundState {
    const tile = state.slots[slotIndex];
    if (!tile) return state;

    const newSlots = [...state.slots];
    newSlots[slotIndex] = null;

    return {
        ...state,
        slots: newSlots,
        pool: [...state.pool, tile],
    };
}

export function removeTile(state: RoundState, uid: number): RoundState {
    const slotIndex = state.slots.findIndex(s => s?.uid === uid);
    if (slotIndex !== -1) {
        return removeTileFromSlot(state, slotIndex);
    }
    return state;
}

export function isComplete(state: RoundState): boolean {
    return state.slots.every(s => s !== null);
}

export function isCorrect(state: RoundState): boolean {
    return isComplete(state) &&
        state.slots.map(t => t?.char ?? "").join("") === state.word.tiles.join("");
}