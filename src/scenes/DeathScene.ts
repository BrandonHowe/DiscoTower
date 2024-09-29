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
            .rectangle(window.innerWidth / 2, 600, 250, 80, 0xff0000)
            .setInteractive();

        startButton.setDepth(5);

        const text = this.add
            .text(window.innerWidth / 2, 600, "Try Again", { fontSize: "32px" })
            .setOrigin(0.5);
        text.setDepth(5);

        // Set up button click listener
        startButton.on("pointerdown", () => {
            this.scene.start("DungeonScene");
        });

        const loreBox = this.add
            .rectangle(window.innerWidth / 2, 360, 600, 600, 0xcccccc)
            .setInteractive();

        this.add.text(window.innerWidth / 2 - 100, 100, "YOU DIED!", {
            fontSize: "32px",
            color: "#000",
        });

        this.add.text(window.innerWidth / 2 - 290, 150, "You died! Would you like to try again?", {
            fontSize: "28px",
            color: "#000",
            wordWrap: { width: 600 },
        });
    }

    update() {}
}
