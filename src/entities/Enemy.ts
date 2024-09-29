import * as Graphics from "./Graphics";

type EnemyPreset = {
    key: string;
    deathKey: string;
    health: number;
    depth: number;
};

export const EnemyPresets: Record<string, EnemyPreset> = {
    drone: {
        key: "droneIdle",
        deathKey: "droneDeath",
        health: 1,
        depth: 11,
    },
    goon: {
        key: "goonIdle",
        deathKey: "goonDeath",
        health: 3,
        depth: 12,
    },
    sentinel: {
        key: "sentinelIdle",
        deathKey: "sentinelDeath",
        health: 2,
        depth: 9,
    },
    chaser: {
        key: "chaserIdle",
        deathKey: "chaserDeath",
        health: 1,
        depth: 10,
    },
};

export default class Enemy {
    public readonly sprite: Phaser.GameObjects.Sprite;
    public readonly hearts: Phaser.GameObjects.Sprite[] = [];
    public readonly container: Phaser.GameObjects.Container;

    public x: number;
    public y: number;
    public health: number;
    public maxHealth: number;
    public key: string;
    public deathKey: string;
    public dead = false;

    constructor(
        x: number,
        y: number,
        worldX: number,
        worldY: number,
        preset: (typeof EnemyPresets)["string"],
        scene: Phaser.Scene
    ) {
        this.x = worldX;
        this.y = worldY;

        this.maxHealth = preset.health;
        this.health = preset.health;
        this.key = preset.key;
        this.deathKey = preset.deathKey;

        this.sprite = scene.add.sprite(0, 0, Graphics.enemy.name, 0);
        this.sprite.setSize(8, 8);
        this.sprite.setScale(2);
        this.sprite.anims.play(Graphics.enemy.animations[preset.key].key);
        this.sprite.setDepth(preset.depth);

        this.container = scene.add.container(x, y);
        this.container.add(this.sprite);
        this.container.setDepth(preset.depth);
        for (let i = 0; i < this.maxHealth; i++) {
            const full = this.health >= i + 1;
            const heart = scene.add.sprite(
                (this.maxHealth - 1) * -7.5 + i * 15,
                -20,
                Graphics.hearts.name,
                Graphics.hearts.indices[full ? "full" : "empty"]
            );
            heart.scale = 0.5;
            heart.visible = false;
            this.container.add(heart);
            this.hearts.push(heart);
        }
    }

    public updateXY(
        tilemap: Phaser.Tilemaps.Tilemap,
        x: number,
        y: number
    ): Phaser.Types.Tweens.TweenBuilderConfig[] {
        this.x = x;
        this.y = y;
        const oldX = this.container.x;
        const tempX = tilemap.tileToWorldX(x)!;
        const tempY = tilemap.tileToWorldY(y)!;
        const newX = Phaser.Math.Snap.To(tempX, 32) + 16;
        const newY = Phaser.Math.Snap.To(tempY, 32);

        return [
            {
                targets: [this.container],
                x: (newX + oldX) / 2,
                y: newY - 10,
                duration: 75,
            },
            {
                targets: [this.container],
                x: newX,
                y: newY,
                duration: 75,
                delay: 75,
            },
        ];
    }

    public attack(damage: number): boolean {
        this.health -= damage;
        for (let i = 0; i < this.maxHealth; i++) {
            const full = this.health >= i + 1;
            const heart = this.hearts[i];
            heart.setFrame(
                full
                    ? Graphics.hearts.indices.full
                    : Graphics.hearts.indices.empty
            );
            heart.visible = true;
        }
        if (this.health <= 0) {
            this.kill();
            return true;
        }
        return false;
    }

    kill() {
        this.sprite.anims.play(
            Graphics.enemy.animations[this.deathKey].key,
            false
        );
        this.dead = true;
        for (const heart of this.hearts) {
            heart.destroy();
        }
    }

    destroy() {
        for (const heart of this.hearts) {
            heart.destroy();
        }
        this.sprite.destroy();
    }
}

export class Sentinel extends Enemy {
    constructor(
        x: number,
        y: number,
        worldX: number,
        worldY: number,
        scene: Phaser.Scene
    ) {
        super(x, y, worldX, worldY, EnemyPresets.sentinel, scene);
    }
}

export class Chaser extends Enemy {
    constructor(
        x: number,
        y: number,
        worldX: number,
        worldY: number,
        scene: Phaser.Scene
    ) {
        super(x, y, worldX, worldY, EnemyPresets.chaser, scene);
    }
}

export class Goon extends Enemy {
    constructor(
        x: number,
        y: number,
        worldX: number,
        worldY: number,
        scene: Phaser.Scene
    ) {
        super(x, y, worldX, worldY, EnemyPresets.goon, scene);
    }
}

export class Drone extends Enemy {
    public movingRight: boolean = Math.random() > 0.5;

    constructor(
        x: number,
        y: number,
        worldX: number,
        worldY: number,
        scene: Phaser.Scene
    ) {
        super(x, y, worldX, worldY, EnemyPresets.drone, scene);
    }
}
