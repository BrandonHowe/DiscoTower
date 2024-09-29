import BackgroundShader from "url:../assets/background.txt";
import Balatro from "url:../assets/balatro.png";
import LifeWillChange from "url:../assets/LifeWillChange.mp3";
import Oof from "url:../assets/oof.mp3";
import Clang from "url:../assets/clang.mp3";
import PowerUp from "url:../assets/powerup.mp3";
import PowerDown from "url:../assets/powerdown.mp3";
import Heal from "url:../assets/heal.mp3";
import Enemy from "../entities/Enemy";
import FOVLayer from "../entities/FOV";
import * as Graphics from "../entities/Graphics";
import { Currencies, Currency } from "../entities/Items";
import Map from "../entities/Map";
import Player, { Direction } from "../entities/Player";
import Tile, { TileType } from "../entities/Tile";

const worldTileHeight = 20;
const worldTileWidth = 20;

type PhaserSound =
    | Phaser.Sound.NoAudioSound
    | Phaser.Sound.HTML5AudioSound
    | Phaser.Sound.WebAudioSound;

export class DungeonScene extends Phaser.Scene {
    private map: Map | null = null;
    private tilemap: Phaser.Tilemaps.Tilemap | null = null;
    private player: Player | null = null;
    public fov: FOVLayer | null = null;

    public enemies: Enemy[] = [];

    private leftLines: Phaser.GameObjects.Graphics[] = [];
    private rightLines: Phaser.GameObjects.Graphics[] = [];

    public clang: PhaserSound | null = null;
    public oof: PhaserSound | null = null;
    public powerUp: PhaserSound | null = null;
    public powerDown: PhaserSound | null = null;
    public heal: PhaserSound | null = null;

    private background: Phaser.GameObjects.TileSprite | null = null;

    private bpm = 128;
    private msPerBeat = 60000 / this.bpm;

    constructor() {
        super("DungeonScene");
    }

    public get attack(): number {
        if (!this.player) return 1;
        const weaponDamage = this.player.equippedWeapon?.attack || 1;
        const comboMultiplier = this.player.combo >= 30 ? 2 : 1;
        return weaponDamage * comboMultiplier;
    }

    preload(): void {
        // this.load.text("BackgroundShaderText", BackgroundShader);
        this.load.glsl("BackgroundShader", BackgroundShader);
        this.load.audio("LifeWillChange", LifeWillChange);
        this.load.audio("Clang", Clang);
        this.load.audio("Oof", Oof);
        this.load.audio("PowerUp", PowerUp);
        this.load.audio("PowerDown", PowerDown);
        this.load.audio("Heal", Heal);
        this.load.image("Balatro", Balatro);
        this.load.image(Graphics.environment.name, Graphics.environment.file);
        this.load.image(Graphics.util.name, Graphics.util.file);
        this.load.spritesheet(Graphics.hearts.name, Graphics.hearts.file, {
            frameWidth: 32,
            frameHeight: 32,
        });
        this.load.spritesheet(Graphics.player.name, Graphics.player.file, {
            frameHeight: Graphics.player.height,
            frameWidth: Graphics.player.width,
        });
        this.load.spritesheet(Graphics.enemy.name, Graphics.enemy.file, {
            frameHeight: Graphics.enemy.height,
            frameWidth: Graphics.enemy.width,
        });
        this.load.spritesheet(Graphics.items.name, Graphics.items.file, {
            frameWidth: Graphics.items.width,
            frameHeight: Graphics.items.height,
        });
        this.load.spritesheet(
            Graphics.teleporters.name,
            Graphics.teleporters.file,
            {
                frameWidth: Graphics.teleporters.height,
                frameHeight: Graphics.teleporters.height,
            }
        );
    }

    create(): void {
        const music = this.sound.add("LifeWillChange");
        this.clang = this.sound.add("Clang");
        this.oof = this.sound.add("Oof");
        this.powerUp = this.sound.add("PowerUp");
        this.powerDown = this.sound.add("PowerDown");
        this.heal = this.sound.add("Heal");
        music.play({
            loop: true, // Set to true to loop the music
        });

        Object.values(Graphics.player.animations).forEach((anim) => {
            if (!this.anims.get(anim.key)) {
                this.anims.create({
                    ...anim,
                    frames: this.anims.generateFrameNumbers(
                        Graphics.player.name,
                        anim.frames
                    ),
                });
            }
        });
        Object.values(Graphics.teleporters.animations).forEach((anim) => {
            if (!this.anims.get(anim.key)) {
                this.anims.create({
                    ...anim,
                    frames: this.anims.generateFrameNumbers(
                        Graphics.teleporters.name,
                        anim.frames
                    ),
                });
            }
        });
        Object.values(Graphics.enemy.animations).forEach((anim) => {
            if (!this.anims.get(anim.key)) {
                this.anims.create({
                    ...anim,
                    frames: this.anims.generateFrameNumbers(
                        Graphics.enemy.name,
                        anim.frames
                    ),
                });
            }
        });

        // Init map and player
        this.initLevel();

        this.cameras.main.setRoundPixels(true);
        this.cameras.main.setZoom(2);
        // this.cameras.main.setBounds(
        //     0,
        //     0,
        //     worldTileWidth * Graphics.environment.width,
        //     worldTileHeight * Graphics.environment.height
        // );
        this.cameras.main.startFollow(this.player!.sprite);

        // Create a full-screen image
        this.background = this.add
            .tileSprite(
                0,
                0,
                this.cameras.main.width,
                this.cameras.main.height,
                "Balatro"
            )
            .setOrigin(0, 0);
        this.background.setScrollFactor(0);

        this.scene.run("UIScene", { player: this.player });

        this.input.keyboard!.on("keydown-F", () => {
            this.fov!.layer.setVisible(!this.fov!.layer.visible);
            this.fov!.setEnabled(!this.fov!.enabled);
        });

        for (const line of this.leftLines) line.destroy();
        for (const line of this.rightLines) line.destroy();
        this.leftLines = [];
        this.rightLines = [];
        // Create multiple graphics objects for vertical lines spaced 50 pixels apart
        for (let i = window.innerWidth - 100; i > 0; i -= 100) {
            const leftLine = this.add.graphics();
            leftLine.x = i; // Set each line's initial position
            this.drawLine(leftLine, 0);
            this.leftLines.push(leftLine);
            leftLine.setScrollFactor(0);

            const rightLine = this.add.graphics();
            rightLine.x = window.innerWidth - i; // Set each line's initial position
            this.drawLine(rightLine, 0);
            this.rightLines.push(rightLine);
            rightLine.setScrollFactor(0);
        }
    }

    update(time: number, delta: number): void {
        this.player!.update(time);

        const camera = this.cameras.main;

        if (this.background) {
            this.background.tilePositionX += 0.03;
        }

        if (!this.tilemap) return;

        this.tryHeartbeat(time);

        const player = new Phaser.Math.Vector2({
            x: this.tilemap!.worldToTileX(
                this.player!.sprite.body!.x
            ) as number,
            y:
                (this.tilemap!.worldToTileY(
                    this.player!.sprite.body!.y
                ) as number) + 1,
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
            const dist = timeToNextHeartbeat / 5 + (this.msPerBeat * i) / 5;
            left.x = window.innerWidth / 2 - dist;
            right.x = window.innerWidth / 2 + dist;
            this.drawLine(left, time);
            this.drawLine(right, time);
        }
    }

    private initLevel() {
        const map = new Map(worldTileWidth, worldTileHeight, this);
        this.map = map;
        this.tilemap = map.tilemap;
        this.fov = new FOVLayer(map);

        this.player = new Player(
            Phaser.Math.Snap.To(this.tilemap.tileToWorldX(map.startingX)!, 32) +
                16,
            Phaser.Math.Snap.To(this.tilemap.tileToWorldY(map.startingY)!, 32) -
                4,
            map.startingX,
            map.startingY,
            this
        );

        this.enemies = this.map.enemies;
    }

    private nextHeartbeat = 0;
    public tryHeartbeat(time: number) {
        if (!this.player || !this.map) return;
        if (time > this.nextHeartbeat) {
            console.log("Heartbeat!");
            this.nextHeartbeat += this.msPerBeat;

            this.map?.toggleTint(this.player.level);
            this.player.heartbeat();

            let queueMove = false;
            let queueAttack = false;
            let enemy: Enemy | null | undefined = null;
            let tile: Tile | null | undefined = null;

            if (this.player.queuedDirection !== Direction.None) {
                this.player.combo++;
                if (this.player.combo === 15 || this.player.combo === 30) {
                    this.powerUp?.play();
                }
            } else {
                if (this.player.combo > 15) {
                    this.powerDown?.play();
                }
                this.player.combo = 0;
            }

            switch (this.player?.queuedDirection) {
                case Direction.Left: {
                    enemy = this.map?.enemyAt(this.player.x - 1, this.player.y);
                    if (enemy) {
                        queueAttack = true;
                        break;
                    }
                    queueMove = true;
                    tile = this.map?.tileAt(this.player.x - 1, this.player.y);
                    break;
                }
                case Direction.Right: {
                    enemy = this.map?.enemyAt(this.player.x + 1, this.player.y);
                    if (enemy) {
                        queueAttack = true;
                        break;
                    }
                    queueMove = true;
                    tile = this.map?.tileAt(this.player.x + 1, this.player.y);
                    break;
                }
                case Direction.Up: {
                    enemy = this.map?.enemyAt(this.player.x, this.player.y - 1);
                    if (enemy) {
                        queueAttack = true;
                        break;
                    }
                    queueMove = true;
                    tile = this.map?.tileAt(this.player.x, this.player.y - 1);
                    break;
                }
                case Direction.Down: {
                    enemy = this.map?.enemyAt(this.player.x, this.player.y + 1);
                    if (enemy) {
                        queueAttack = true;
                        break;
                    }
                    queueMove = true;
                    tile = this.map?.tileAt(this.player.x, this.player.y + 1);
                    break;
                }
            }
            if (tile) {
                let move = true;
                if (tile?.collides) {
                    if (tile.type == TileType.Door) {
                        const horiz =
                            tile.spriteIndex() ===
                            Graphics.environment.indices.doors.horizontal;
                        if (horiz) {
                            this.map?.doorLayer.putTileAt(
                                Graphics.environment.indices.doors.destroyed,
                                tile.x,
                                tile.y
                            );
                        }
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
            if (queueAttack && enemy) {
                const res = enemy.attack(
                    this.tilemap!,
                    this.player.equippedWeapon.attack
                );
                this.clang?.play();

                if (res.killed && this.map) {
                    const scrap = this.map.placeItem(
                        Currencies.scrap,
                        enemy.x,
                        enemy.y
                    );
                    (scrap.data as Currency).amount =
                        this.player.combo > 10 ? 2 : 1;
                }
                for (const tween of res.tweens) {
                    this.tweens.add(tween);
                }
                this.player.queuedDirection = Direction.None;
            }
            if (queueMove) {
                this.player.queuedDirection = Direction.None;
                const tweens = this.player.updateXY(
                    this.tilemap!,
                    this.player.x,
                    this.player.y
                );
                for (const tween of tweens) this.tweens.add(tween);

                if (!this.map) return;

                const portal = this.map.portalAt(this.player.x, this.player.y);
                if (portal) {
                    portal.enter();
                    const self = this;
                    setTimeout(() => {
                        self.map!.regenerateDungeon(self.player!.level + 1);
                        const tweens = self.player!.updateXY(
                            self.tilemap!,
                            self.map!.startingX,
                            self.map!.startingY,
                            true
                        );
                        for (const tween of tweens) this.tweens.add(tween);
                        self.player!.level++;
                        self.fov?.newLevel();
                    }, 2000);
                    return;
                }

                let item = this.map.itemAt(this.player.x, this.player.y);
                while (item) {
                    this.map.items.splice(this.map.items.indexOf(item), 1);
                    this.player.addItem(item.data);
                    if (item.data.key === "singleHeal") {
                        this.heal?.play();
                    }
                    item.destroy();
                    item = this.map.itemAt(this.player.x, this.player.y);
                }
            }

            this.map?.moveEnemies(this.player);

            if (this.player.health <= 0) {
                this.scene.stop();
                this.scene.stop("UIScene");
                this.sound.stopAll();

                this.scene.start("DeathScene");
            }
        }
    }

    public drawLine(line: Phaser.GameObjects.Graphics, time: number) {
        line.setDepth(1000);
        // Clear the previous line drawing
        line.clear();

        // Set line style (color: white, thickness: 5)
        line.lineStyle(5, 0x00ffff);

        // Draw a vertical line from the top to the bottom of the screen
        line.beginPath();
        const timeToNextHeartbeat = this.nextHeartbeat - time;
        const start = timeToNextHeartbeat < 100 ? 52 : 50;
        const end = timeToNextHeartbeat < 100 ? 23 : 25;
        line.moveTo(0, (window.innerHeight * 3) / 4 - start);
        line.lineTo(0, (window.innerHeight * 3) / 4 - end);
        line.strokePath();
    }
}
