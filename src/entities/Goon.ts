import Phaser from "phaser";
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

    public updateXY(tilemap: Phaser.Tilemaps.Tilemap, x: number, y: number) {
        this.x = x;
        this.y = y;
        this.sprite.x = tilemap.tileToWorldX(x)!;
        this.sprite.y = tilemap.tileToWorldY(y)!;
        this.sprite.x = Phaser.Math.Snap.To(this.sprite.x, 32) + 16;
        this.sprite.y = Phaser.Math.Snap.To(this.sprite.y, 32);
    }

    public attack(damage: number) {
        this.health -= damage;
        if (this.health <= 0) {
            this.kill();
        }
    }

    kill() {
        this.sprite.anims.play(Graphics.goon.animations.death.key, false);
        this.dead = true;
    }
}
