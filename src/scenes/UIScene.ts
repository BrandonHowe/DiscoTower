import * as Graphics from "../entities/Graphics";
import Phaser from "phaser";
import Player from "../entities/Player";

export default class UIScene extends Phaser.Scene {
    private player: Player | null = null;

    // public tilemap: Phaser.Tilemaps.Tilemap | null;
    // private heartsLayer: Phaser.Tilemaps.TilemapLayer | null;
    private hearts: Phaser.GameObjects.Sprite[] = [];
    private weapon: Phaser.GameObjects.Sprite | null = null;
    private armor: Phaser.GameObjects.Sprite | null = null;
    private scrapText: Phaser.GameObjects.Text | null = null;

    constructor() {
        super({ key: "UIScene" });
    }

    preload(): void {
        this.load.spritesheet(Graphics.items.name, Graphics.items.file, {
            frameWidth: 32,
            frameHeight: 32,
        });

        this.load.spritesheet(Graphics.hearts.name, Graphics.hearts.file, {
            frameWidth: 32,
            frameHeight: 32,
        });
    }

    create({ player }: { player: Player }): void {
        this.player = player;

        const startX = this.cameras.main.width - 90 * 5 - 120;
        for (let i = 0; i < this.player.maxHealth; i++) {
            const full = this.player.health >= i + 1;
            const heart = this.add.sprite(
                startX + i * 90,
                80,
                Graphics.hearts.name,
                Graphics.hearts.indices[full ? "full" : "empty"]
            );
            heart.scale = 3;
            heart.setScrollFactor(0); // Make sure the hearts are not affected by camera movement
            this.hearts.push(heart);
        }

        const weaponRect = this.add.graphics();
        weaponRect.lineStyle(3, 0xdddddd);
        weaponRect.fillStyle(0x0);
        weaponRect.fillRect(30, 40, 100, 100);
        weaponRect.strokeRect(30, 40, 100, 100);
        this.add.text(30, 20, "Weapon");
        this.weapon = this.add
            .sprite(
                82,
                88,
                Graphics.items.name,
                Graphics.items.indices[
                    player.equippedWeapon.name as "fist" | "dagger"
                ]
            )
            .setScrollFactor(0);
        this.weapon.scale = 4;

        const armorRect = this.add.graphics();
        armorRect.lineStyle(3, 0xdddddd);
        armorRect.fillStyle(0x0);
        armorRect.fillRect(180, 40, 100, 100);
        armorRect.strokeRect(180, 40, 100, 100);
        this.add.text(180, 20, "Armor");
        this.armor = this.add
            .sprite(
                232,
                88,
                Graphics.items.name,
                Graphics.items.indices[player.equippedArmor.name]
            )
            .setScrollFactor(0);
        this.armor.scale = 4;

        const scrap = this.add
            .sprite(
                this.cameras.main.width - 100,
                75,
                Graphics.hearts.name,
                Graphics.hearts.indices.scrap
            )
            .setScrollFactor(0);
        scrap.scale = 3;
        this.scrapText = this.add.text(
            this.cameras.main.width - 55,
            65,
            `x${this.player.scrap}`,
            { fontSize: 24 }
        );
    }

    update() {
        if (!this.player) return;

        if (this.hearts.length) {
            for (let i = 0; i < this.player.maxHealth; i++) {
                const full = this.player.health >= i + 1;
                this.hearts[i].setFrame(
                    Graphics.hearts.indices[full ? "full" : "empty"]
                );
            }
        }

        if (this.weapon) {
            this.weapon.setFrame(
                Graphics.items.indices[this.player.equippedWeapon.key]
            );
        }

        if (this.armor) {
            this.armor.setFrame(
                Graphics.items.indices[this.player.equippedArmor.key]
            );
        }

        if (this.scrapText) {
            this.scrapText.setText(`x${this.player.scrap}`);
        }
    }
}
