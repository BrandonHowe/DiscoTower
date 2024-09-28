export interface Enemy {
    health: number;
    dead: boolean;
    attack: (damage: number) => void;
}