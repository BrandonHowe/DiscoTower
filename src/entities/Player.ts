import * as Graphics from "./Graphics";
import { Armor, Armors, ItemData, Weapon, Weapons } from "./Items";

interface Keys {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;

    leftNeedsUp: boolean;
    rightNeedsUp: boolean;
    upNeedsUp: boolean;
    downNeedsUp: boolean;
}

export enum Direction {
    None,
    Left,
    Up,
    Right,
    Down,
}

export default class Player {
    private attackUntil: number = 0;
    public queuedDirection: Direction = Direction.None;

    public x: number;
    public y: number;
    public health = 5;
    public maxHealth = 5;
    public scrap = 0;
    public combo = 0;

    public level: number = 0;

    public equippedWeapon: Weapon = Weapons.fist;
    public weapons: Weapon[] = [Weapons.fist];

    public equippedArmor: Armor = Armors.bare;
    public armors: Armor[] = [Armors.bare];

    public sprite: Phaser.Physics.Arcade.Sprite;
    private keys: Keys;
    public body: Phaser.Physics.Arcade.Body;

    public readonly scene: Phaser.Scene;

    constructor(
        x: number,
        y: number,
        worldX: number,
        worldY: number,
        scene: Phaser.Scene
    ) {
        this.scene = scene;
        this.sprite = scene.physics.add.sprite(x, y, Graphics.player.name, 0);
        this.x = worldX;
        this.y = worldY;
        this.sprite.setSize(8, 8);
        this.sprite.setScale(2);
        this.sprite.anims.play(Graphics.player.animations.idle.key);
        this.sprite.setDepth(5);

        if (!scene.input.keyboard) throw new Error("No keyboard found");
        this.keys = scene.input.keyboard?.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.UP,
            down: Phaser.Input.Keyboard.KeyCodes.DOWN,
            left: Phaser.Input.Keyboard.KeyCodes.LEFT,
            right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE,
            w: "w",
            a: "a",
            s: "s",
            d: "d",
        }) as Keys;

        this.body = <Phaser.Physics.Arcade.Body>this.sprite.body;
    }

    public heartbeat() {
        const keys = this.keys;
        const left = keys.left.isDown || keys.a.isDown;
        const right = keys.right.isDown || keys.d.isDown;
        const up = keys.up.isDown || keys.w.isDown;
        const down = keys.down.isDown || keys.s.isDown;

        // if (
        //     (left && !keys.leftNeedsUp) ||
        //     (right && !keys.rightNeedsUp) ||
        //     (up && !keys.upNeedsUp) ||
        //     (down && !keys.downNeedsUp)
        // ) {
        //     console.log("Yeah");
        //     this.combo++;
        // } else {
        //     this.combo = 0;
        // }

        if (left) this.keys.leftNeedsUp = true;
        if (right) this.keys.rightNeedsUp = true;
        if (up) this.keys.upNeedsUp = true;
        if (down) this.keys.downNeedsUp = true;
    }

    public update(time: number) {
        const keys = this.keys;

        if (time < this.attackUntil) {
            return;
        }

        this.body.setVelocity(0);

        if (!keys.left.isDown && !keys.a.isDown) keys.leftNeedsUp = false;
        if (!keys.right.isDown && !keys.d.isDown) keys.rightNeedsUp = false;
        if (!keys.up.isDown && !keys.w.isDown) keys.upNeedsUp = false;
        if (!keys.down.isDown && !keys.s.isDown) keys.downNeedsUp = false;

        const left = (keys.left.isDown || keys.a.isDown) && !keys.leftNeedsUp;
        const right =
            (keys.right.isDown || keys.d.isDown) && !keys.rightNeedsUp;
        const up = (keys.up.isDown || keys.w.isDown) && !keys.upNeedsUp;
        const down = (keys.down.isDown || keys.s.isDown) && !keys.downNeedsUp;

        if (left) this.queuedDirection = Direction.Left;
        else if (right) this.queuedDirection = Direction.Right;
        else if (up) this.queuedDirection = Direction.Up;
        else if (down) this.queuedDirection = Direction.Down;
    }

    public updateXY(
        tilemap: Phaser.Tilemaps.Tilemap,
        x: number,
        y: number,
        newLevel: boolean = false
    ): Phaser.Types.Tweens.TweenBuilderConfig[] {
        this.x = x;
        this.y = y;
        const oldX = this.sprite.x;
        const tempX = tilemap.tileToWorldX(x)!;
        const tempY = tilemap.tileToWorldY(y)!;
        const newX = Phaser.Math.Snap.To(tempX, 32) + 16;
        const newY = Phaser.Math.Snap.To(tempY, 32);

        if (newLevel) {
            this.sprite.x = newX;
            this.sprite.y = newY;
            return [];
        }

        return [
            {
                targets: [this.sprite],
                x: (newX + oldX) / 2,
                y: newY - 6,
                duration: 75,
                delay: newLevel ? 500 : 0,
            },
            {
                targets: [this.sprite],
                x: newX,
                y: newY,
                duration: 75,
                delay: newLevel ? 575 : 75,
            },
        ];
    }

    public takeDamage(
        tilemap: Phaser.Tilemaps.Tilemap,
        damage: number
    ): Phaser.Types.Tweens.TweenBuilderConfig[] {
        if (damage <= 0) return [];

        this.health -= damage;
        if (this.health <= 0) {
            this.sprite.anims.play(Graphics.player.animations.playerDeath.key);
        } else {
            this.sprite.anims.play(
                Graphics.player.animations.playerDamaged.key
            );
            console.log(Graphics.player.animations.playerDamaged.key);
            this.sprite.once(
                "animationComplete",
                (animation: { key: string }) => {
                    console.log("we done", animation);
                    if (
                        animation.key ===
                        Graphics.player.animations.playerDamaged.key
                    ) {
                        this.sprite.anims.play(
                            Graphics.player.animations.idle.key
                        );
                    }
                }
            );
        }
        const tweens: Phaser.Types.Tweens.TweenBuilderConfig[] = [];
        const originalX =
            Phaser.Math.Snap.To(tilemap.tileToWorldX(this.x)!, 32) + 16;
        for (let i = 0; i < 5; i++) {
            const offset = i % 2 === 0 ? 10 : -10;
            tweens.push({
                targets: [this.sprite],
                x: originalX + offset,
                y: this.sprite.y,
                duration: 40,
                delay: i * 40,
            });
        }
        tweens.push({
            targets: [this.sprite],
            x: originalX,
            y: this.sprite.y,
            duration: 20,
            delay: 200,
        });
        return tweens;
    }

    public addItem(item: ItemData) {
        if (item.type === "weapon") {
            this.equippedWeapon = item as Weapon;
            this.weapons.push(item);
        }
        if (item.type === "armor") {
            this.equippedArmor = item as Armor;
            this.armors.push(item);
        }
        if (item.type === "currency") {
            if (item.key === "scrap") this.scrap += item.amount;
        }
        if (item.type === "heal") {
            if (this.health < this.maxHealth) this.health += 1;
        }
    }
}
