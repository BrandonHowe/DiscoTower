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
        y: number
    ): Phaser.Types.Tweens.TweenBuilderConfig[] {
        this.x = x;
        this.y = y;
        const oldX = this.sprite.x;
        const tempX = tilemap.tileToWorldX(x)!;
        const tempY = tilemap.tileToWorldY(y)!;
        const newX = Phaser.Math.Snap.To(tempX, 32) + 16;
        const newY = Phaser.Math.Snap.To(tempY, 32);

        return [
            {
                targets: [this.sprite],
                x: (newX + oldX) / 2,
                y: newY - 6,
                duration: 75,
            },
            {
                targets: [this.sprite],
                x: newX,
                y: newY,
                duration: 75,
                delay: 75,
            },
        ];
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
            if (item.key === "scrap") this.scrap++;
        }
    }
}
