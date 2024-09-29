import * as Graphics from "../entities/Graphics";
import Phaser from "phaser";
import Player from "../entities/Player";

export default class DeathScene extends Phaser.Scene {
    constructor() {
        super({ key: "DeathScene" });
    }

    preload(): void {}

    create(): void {
        const startButton = this.add
            .rectangle(800, 780, 250, 80, 0xff0000)
            .setInteractive();

        startButton.setDepth(5);

        const text = this.add
            .text(800, 780, "Try Again", { fontSize: "32px" })
            .setOrigin(0.5);
        text.setDepth(5);

        // Set up button click listener
        startButton.on("pointerdown", () => {
            this.scene.start("DungeonScene");
        });

        const loreBox = this.add
            .rectangle(800, 500, 600, 700, 0xcccccc)
            .setInteractive();

        this.add.text(700, 200, "YOU DIED!", {
            fontSize: "32px",
            color: "#000",
        });

        this.add.text(515, 250, "You died! Would you like to try again?", {
            fontSize: "28px",
            color: "#000",
            wordWrap: { width: 600 },
        });
    }

    update() {}
}
