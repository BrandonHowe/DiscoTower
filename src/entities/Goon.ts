import Phaser, { Types } from "phaser";
import * as Graphics from "./Graphics";
import { Enemy } from "./Enemy";

export default class Goon implements Enemy {
    public readonly sprite: Phaser.GameObjects.Sprite;

    public x: number;
    public y: number;
    public health = 1;
    public dead = false;

    public movingRight: boolean = Math.random() > 0.5;

    constructor(
        x: number,
        y: number,
        worldX: number,
        worldY: number,
        scene: Phaser.Scene
    ) {
        this.x = worldX;
        this.y = worldY;

        this.sprite = scene.add.sprite(x, y, Graphics.goon.name, 0);
        this.sprite.setSize(8, 8);
        this.sprite.setScale(2);
        this.sprite.anims.play(Graphics.goon.animations.idle.key);
        this.sprite.setDepth(10);
    }

    public updateXY(
        tilemap: Phaser.Tilemaps.Tilemap,
        x: number,
        y: number
    ): Types.Tweens.TweenBuilderConfig[] {
        this.x = x;
        this.y = y;
        const oldX = this.sprite.x;
        const tempX = tilemap.tileToWorldX(x)!;
        const tempY = tilemap.tileToWorldY(y)!;
        const newX = Phaser.Math.Snap.To(tempX, 32) + 16;
        const newY = Phaser.Math.Snap.To(tempY, 32);

        return [
            {
                targets: [this.sprite],
                x: (newX + oldX) / 2,
                y: newY - 10,
                duration: 75,
            },
            {
                targets: [this.sprite],
                x: newX,
                y: newY,
                duration: 75,
                delay: 75,
            },
        ];
    }

    public attack(damage: number): boolean {
        this.health -= damage;
        if (this.health <= 0) {
            this.kill();
            return true;
        }
        return false;
    }

    kill() {
        this.sprite.anims.play(Graphics.goon.animations.death.key, false);
        this.dead = true;
    }
}
