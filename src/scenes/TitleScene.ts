import * as Graphics from "../entities/Graphics";
import Phaser from "phaser";
import Player from "../entities/Player";

export default class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: "TitleScene" });
    }

    preload(): void {}

    create(): void {
        const startButton = this.add
            .rectangle(800, 780, 250, 80, 0x0000ff)
            .setInteractive();

        startButton.setDepth(5);

        const text = this.add
            .text(800, 780, "Start Game", { fontSize: "32px" })
            .setOrigin(0.5);
        text.setDepth(5);

        // Set up button click listener
        startButton.on("pointerdown", () => {
            this.scene.start("DungeonScene");
        });

        const loreBox = this.add
            .rectangle(800, 500, 600, 700, 0xcccccc)
            .setInteractive();

        this.add.text(700, 200, "DISCO TOWER", {
            fontSize: "32px",
            color: "#000",
        });

        this.add.text(
            515,
            250,
            "The Disco Tower, once a place of music and joy, is now under the control of evil AI robots who want to replace humanity. What was once a glowing beacon of dance and creativity is now a dark, cold fortress filled with machines trying to erase human art. Climb the tower and out-dance the robots to prove the greatness of human creativity and dance moves.",
            { fontSize: "24px", color: "#000", wordWrap: { width: 600 } }
        );

        this.add.text(
            515,
            500,
            "Use arrow keys or WASD to move. You can move one step per beat. Explore the world, collect items, and defeat enemies to try and reconquer the Disco tower!",
            { fontSize: "24px", color: "#000", wordWrap: { width: 600 } }
        );
    }

    update() {}
}
