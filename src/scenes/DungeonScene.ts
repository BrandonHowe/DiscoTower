import LifeWillChange from "url:../assets/LifeWillChange.mp3";
import FOVLayer from "../entities/FOV";
import Goon from "../entities/Goon";
import * as Graphics from "../entities/Graphics";
import Map from "../entities/Map";
import Player, { Direction } from "../entities/Player";
import Tile, { TileType } from "../entities/Tile";

const worldTileHeight = 81;
const worldTileWidth = 81;

export class DungeonScene extends Phaser.Scene {
    private map: Map | null = null;
    private tilemap: Phaser.Tilemaps.Tilemap | null = null;
    private player: Player | null = null;
    public fov: FOVLayer | null = null;

    public goons: Goon[] = [];
    public goonGroup: Phaser.GameObjects.Group | null = null;

    private leftLines: Phaser.GameObjects.Graphics[] = [];
    private rightLines: Phaser.GameObjects.Graphics[] = [];

    private bpm = 128;
    private msPerBeat = 60000 / this.bpm;

    constructor() {
        super("DungeonScene");
    }

    preload(): void {
        this.load.image(Graphics.environment.name, Graphics.environment.file);
        this.load.image(Graphics.util.name, Graphics.util.file);
        this.load.spritesheet(Graphics.player.name, Graphics.player.file, {
            frameHeight: Graphics.player.height,
            frameWidth: Graphics.player.width
        });
        this.load.spritesheet(Graphics.goon.name, Graphics.goon.file, {
            frameHeight: Graphics.goon.height,
            frameWidth: Graphics.goon.width
        });
        this.load.audio("LifeWillChange", LifeWillChange);
    }

    create(): void {
        const music = this.sound.add("LifeWillChange");
        music.play({
            loop: true // Set to true to loop the music
        });

        Object.values(Graphics.player.animations).forEach(anim => {
            if (!this.anims.get(anim.key)) {
                this.anims.create({
                    ...anim,
                    frames: this.anims.generateFrameNumbers(
                        Graphics.player.name,
                        anim.frames
                    )
                });
            }
        });
        Object.values(Graphics.goon.animations).forEach(anim => {
            if (!this.anims.get(anim.key)) {
                this.anims.create({
                    ...anim,
                    frames: this.anims.generateFrameNumbers(
                        Graphics.goon.name,
                        anim.frames
                    )
                });
            }
        });

        // Init map and player
        const map = new Map(worldTileWidth, worldTileHeight, this);
        this.map = map;
        this.tilemap = map.tilemap;
        this.fov = new FOVLayer(map);

        this.cameras.main.setRoundPixels(true);
        this.cameras.main.setZoom(1);
        this.cameras.main.setBounds(
            0,
            0,
            map.width * Graphics.environment.width,
            map.height * Graphics.environment.height
        );

        this.player = new Player(
            Phaser.Math.Snap.To(this.tilemap.tileToWorldX(map.startingX)!, 32) + 16,
            Phaser.Math.Snap.To(this.tilemap.tileToWorldY(map.startingY)!, 32) - 4,
            map.startingX,
            map.startingY,
            this
        );
        
        this.cameras.main.startFollow(this.player.sprite);

        this.goons = this.map.goons;
        this.goonGroup = this.physics.add.group(this.goons.map(s => s.sprite));

        this.input.keyboard!.on("keydown-F", () => {
            this.fov!.layer.setVisible(!this.fov!.layer.visible);
        });

        // Create multiple graphics objects for vertical lines spaced 50 pixels apart
        for (let i = window.innerWidth - 100; i > 0; i -= 100) {
            const leftLine = this.add.graphics();
            leftLine.x = i; // Set each line's initial position
            this.drawLine(leftLine);
            this.leftLines.push(leftLine);
            leftLine.setScrollFactor(0);

            const rightLine = this.add.graphics();
            rightLine.x = window.innerWidth - i; // Set each line's initial position
            this.drawLine(rightLine);
            this.rightLines.push(rightLine);
            rightLine.setScrollFactor(0);
        }
    }

    update(time: number, delta: number): void {
        this.player!.update(time);

        const camera = this.cameras.main;

        if (!this.tilemap) return;

        this.tryHeartbeat(time);

        const player = new Phaser.Math.Vector2({
            x: this.tilemap!.worldToTileX(this.player!.sprite.body!.x) as number,
            y: this.tilemap!.worldToTileY(this.player!.sprite.body!.y) as number
        });
  
        const bounds = new Phaser.Geom.Rectangle(
            this.tilemap!.worldToTileX(camera.worldView.x)! - 1,
            this.tilemap!.worldToTileY(camera.worldView.y)! - 1,
            this.tilemap!.worldToTileX(camera.worldView.width)! + 2,
            this.tilemap!.worldToTileX(camera.worldView.height)! + 2
        );

        this.fov!.update(player, bounds, delta);

        const timeToNextHeartbeat = this.nextHeartbeat - time;
        for (let i = 0; i < this.leftLines.length; i++) {
            const left = this.leftLines[i];
            const right = this.rightLines[i];
            const dist = (timeToNextHeartbeat / 5) + (this.msPerBeat * i / 5);
            left.x = (window.innerWidth / 2) - dist;
            right.x = (window.innerWidth / 2) + dist;
        }
    }
    
    private nextHeartbeat = 0;
    public tryHeartbeat(time: number) {
        if (!this.player) return;
        if (time > this.nextHeartbeat) {
            console.log("Heartbeat!");
            this.nextHeartbeat += this.msPerBeat;

            this.map?.toggleTint();
            this.player.heartbeat();

            let queueMove = false;
            let queueAttack = false;
            let enemy: Goon | null | undefined = null;
            let tile: Tile | null | undefined = null;
            switch (this.player?.queuedDirection) {
                case Direction.Left: {
                    enemy = this.map?.enemyAt(this.player.x - 1, this.player.y);
                    if (enemy) { queueAttack = true; break; }
                    queueMove = true;
                    tile = this.map?.tileAt(this.player.x - 1, this.player.y);
                    break;
                }
                case Direction.Right: {
                    enemy = this.map?.enemyAt(this.player.x + 1, this.player.y);
                    if (enemy) { queueAttack = true; break; }
                    queueMove = true;
                    tile = this.map?.tileAt(this.player.x + 1, this.player.y);
                    break;
                }
                case Direction.Up: {
                    enemy = this.map?.enemyAt(this.player.x, this.player.y - 1);
                    if (enemy) { queueAttack = true; break; }
                    queueMove = true;
                    tile = this.map?.tileAt(this.player.x, this.player.y - 1);
                    break;
                }
                case Direction.Down: {
                    enemy = this.map?.enemyAt(this.player.x, this.player.y + 1);
                    if (enemy) { queueAttack = true; break; }
                    queueMove = true;
                    tile = this.map?.tileAt(this.player.x, this.player.y + 1);
                    break;
                }
            }
            if (tile) {
                let move = true;
                if (tile?.collides) {
                    if (tile.type == TileType.Door) {
                        this.map?.doorLayer.putTileAt(
                            Graphics.environment.indices.doors.destroyed,
                            tile.x,
                            tile.y
                        );
                        this.map!.tileAt(tile.x, tile.y)!.open();
                        this.fov!.recalculate();
                    } else {
                        move = false;
                    }
                }
                if (move) {
                    this.player.x = tile.x;
                    this.player.y = tile.y;
                }
            }
            if (queueAttack) {
                enemy?.attack(1);
                this.player.queuedDirection = Direction.None;
            }
            if (queueMove) {
                this.player.queuedDirection = Direction.None;
                this.player.body.x = this.tilemap!.tileToWorldX(this.player.x)!;
                this.player.body.y = this.tilemap!.tileToWorldY(this.player.y)!;
                this.player.body.x = Phaser.Math.Snap.To(this.player.body.x, 32);
                this.player.body.y = Phaser.Math.Snap.To(this.player.body.y, 32);
            }

            this.map?.moveEnemies(this.player);
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
        line.moveTo(0, window.innerHeight - 100);
        line.lineTo(0, window.innerHeight - 50);
        line.strokePath();
    }
}