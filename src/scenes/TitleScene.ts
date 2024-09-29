import * as Graphics from "../entities/Graphics";
import Phaser from "phaser";
import Player from "../entities/Player";

export default class TitleScene extends Phaser.Scene {
    private layer1: Phaser.GameObjects.Layer | null = null;
    private layer2: Phaser.GameObjects.Layer | null = null;
    private startButton: Phaser.GameObjects.Rectangle | null = null;

    constructor() {
        super({ key: "TitleScene" });
    }

    preload(): void {}

    create(): void {
        const layer1 = this.add.layer();
        const layer2 = this.add.layer();

        this.add.rectangle(0, 0, window.innerWidth, window.innerHeight);
        const squareSize = 50;
        for (let i = 0; i < window.innerHeight / squareSize + 1; i++) {
            for (let j = 0; j < window.innerWidth / squareSize + 1; j++) {
                const color = (i + j) % 2 === 0 ? 0xFF6EC7 : 0x00ffff;
                const square = this.add.rectangle(j * squareSize, i * squareSize, squareSize, squareSize, color);
                if ((i + j) % 2 === 0) {
                    layer1.add(square);
                } else {
                    layer2.add(square);
                }
            }
        }

        layer1.setDepth(1);
        layer2.setDepth(1);
        this.layer1 = layer1;
        this.layer2 = layer2;
        
        const startButton = this.add
            .rectangle(window.innerWidth / 2, 600, 250, 80, 0xFF6EC7)
            .setInteractive();
        this.startButton = startButton;

        startButton.setDepth(6);

        const text = this.add
            .text(window.innerWidth / 2, 600, "Start Game", {
                fontSize: "32px",
                color: "black"
            })
            .setOrigin(0.5);
        text.setDepth(6);

        // Set up button click listener
        startButton.on("pointerdown", () => {
            this.scene.start("DungeonScene");
        });

        const loreBox = this.add
            .rectangle(window.innerWidth / 2, 360, 600, 600, 0xcccccc)
            .setInteractive();

        loreBox.setDepth(5);

        this.add.text(window.innerWidth / 2 - 100, 100, "DISCO TOWER", {
            fontSize: "32px",
            color: "#000",
        }).setDepth(5);

        this.add.text(
            window.innerWidth / 2 - 290,
            150,
            "The Disco Tower, once a place of music and joy, is now under the control of evil AI robots who want to replace humanity. What was once a glowing beacon of dance and creativity is now a dark, cold fortress filled with machines trying to erase human art. Climb the tower and out-dance the robots to prove the greatness of human creativity and dance moves.",
            { fontSize: "24px", color: "#000", wordWrap: { width: 600 } }
        ).setDepth(5);

        this.add.text(
            window.innerWidth / 2 - 290,
            420,
            "Use arrow keys or WASD to move. You can move one step per beat. Explore the world, collect items, and defeat enemies to try and reconquer the Disco tower!",
            { fontSize: "24px", color: "#000", wordWrap: { width: 600 } }
        ).setDepth(5);
    }

    private bpm = 60;
    private msPerBeat = 60000 / this.bpm;
    private nextHeartbeat = 0;
    private heartbeatNum = 0;
    update(time: number) {
        if (time > this.nextHeartbeat) {
            console.log("Heartbeat!");
            this.nextHeartbeat += this.msPerBeat;
            this.heartbeatNum++;

            if (this.heartbeatNum % 2 === 0) {
                this.layer1?.setAlpha(0.1);
                this.layer2?.setAlpha(0.2);
                if (this.startButton) this.startButton.fillColor = 0xFF6EC7;
            } else {
                this.layer1?.setAlpha(0.2);
                this.layer2?.setAlpha(0.1);
                if (this.startButton) this.startButton.fillColor = 0x00cccc;
            }
        }
    }
}
