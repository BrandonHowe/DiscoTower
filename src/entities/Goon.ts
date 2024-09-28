import Phaser from "phaser";
import * as Graphics from "./Graphics";
import { Enemy } from "./Enemy";

export default class Goon implements Enemy {
    public readonly sprite: Phaser.Physics.Arcade.Sprite;
    public readonly body: Phaser.Physics.Arcade.Body;

    public x: number;
    public y: number;
    public health = 1;
    public dead = false;

    public movingRight: boolean = Math.random() > 0.5;

    constructor(x: number, y: number, worldX: number, worldY: number, scene: Phaser.Scene) {
        this.x = worldX;
        this.y = worldY;

        this.sprite = scene.physics.add.sprite(x, y, Graphics.goon.name, 0);
        this.sprite.setSize(8, 8);
        this.sprite.setOffset(8, 16);
        this.sprite.setScale(2);
        this.sprite.anims.play(Graphics.goon.animations.idle.key);
        this.sprite.setDepth(10);

        this.body = <Phaser.Physics.Arcade.Body>this.sprite.body;
        this.body.x = x;
        this.body.y = y;
        this.body.bounce.set(0, 0);
        this.body.setImmovable(true);
    }

    public updateXY(tilemap: Phaser.Tilemaps.Tilemap, x: number, y: number) {
        this.x = x;
        this.y = y;
        this.body.x = tilemap.tileToWorldX(x)!;
        this.body.y = tilemap.tileToWorldY(y)!;
        this.body.x = Phaser.Math.Snap.To(this.body.x, 32);
        this.body.y = Phaser.Math.Snap.To(this.body.y, 32);
    }

    public attack(damage: number) {
        this.health -= damage;
        if (this.health <= 0) {
            this.kill();
        }
    }

    kill() {
        this.sprite.anims.play(Graphics.goon.animations.death.key, false);
        this.sprite.disableBody();
        this.dead = true;
    }
}
