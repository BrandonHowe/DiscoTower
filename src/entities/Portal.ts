import Phaser, { Types } from "phaser";
import * as Graphics from "./Graphics";

export default class Portal {
    public readonly sprite: Phaser.GameObjects.Sprite;

    public x: number;
    public y: number;

    constructor(
        x: number,
        y: number,
        worldX: number,
        worldY: number,
        scene: Phaser.Scene
    ) {
        this.x = worldX;
        this.y = worldY;

        this.sprite = scene.add.sprite(x, y, Graphics.teleporters.name, 0);
        this.sprite.setSize(8, 8);
        this.sprite.setScale(2);
        this.sprite.setDepth(10);
        this.sprite.anims.play(
            Graphics.teleporters.animations.teleporterIdle.key
        );
    }

    public enter() {
        this.sprite.anims.play(
            Graphics.teleporters.animations.teleporterActive.key
        );
    }

    destroy() {
        this.sprite.destroy();
    }
}
