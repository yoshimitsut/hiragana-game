export type Category = "comida" | "animais" | "casa" | "objetos";

export interface Word {
    id: number;
    tiles: string[];
    romaji: string;
    pt: string;
    category: Category;
    level: 1 | 2 | 3;
    image: string;
}