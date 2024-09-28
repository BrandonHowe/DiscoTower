import Phaser from "phaser";

export default class UIScene extends Phaser.Scene {
    private leftLines: Phaser.GameObjects.Graphics[] = [];
    private rightLines: Phaser.GameObjects.Graphics[] = [];

    constructor() {
        super({ key: "UIScene" });
    }

    preload(): void {
    }

    create({ left, right }: { left: Phaser.GameObjects.Graphics[], right: Phaser.GameObjects.Graphics[] }): void {
        this.leftLines = left;
        this.rightLines = right;
    }

    // private nextHeartbeat = 0;
    // update(time: number, _: number): void {
    //     const timeToNextHeartbeat = this.nextHeartbeat - time;
    //     for (let i = 0; i < this.leftLines.length; i++) {
    //         const line = this.leftLines[i];
    //         line.x = (window.innerWidth / 2) - (100 * i) - (timeToNextHeartbeat / 10);
    //         this.drawLine(line);
    //     }

    //     for (let i = 0; i < this.rightLines.length; i++) {
    //         const line = this.rightLines[i];
    //         line.x = (window.innerWidth / 2) + (100 * i) + (timeToNextHeartbeat / 10);
    //         this.drawLine(line);
    //     }
    // }

    update() {
        for (const line of this.leftLines) {
            this.drawLine(line);
        }
        for (const line of this.rightLines) {
            this.drawLine(line);
        }
    }

    public drawLine(line: Phaser.GameObjects.Graphics) {
        line.setDepth(1000);
        // Clear the previous line drawing
        line.clear();
      
        // Set line style (color: white, thickness: 5)
        line.lineStyle(5, 0x00ffff);
      
        // Draw a vertical line from the top to the bottom of the screen
        line.beginPath();
        line.moveTo(0, 500);
        line.lineTo(0, 600);
        line.strokePath();
    }
}
