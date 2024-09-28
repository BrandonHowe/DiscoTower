import * as Graphics from "./Graphics";

const speed = 125;
const attackSpeed = 500;
const attackDuration = 165;
const staggerDuration = 200;
const staggerSpeed = 100;
const attackCooldown = attackDuration * 2;

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
    private time: number = 0;
    private attacking: boolean = false;
    private attackUntil: number = 0;
    private attackLockedUntil: number = 0;
    public queuedDirection: Direction = Direction.None;

    public x: number;
    public y: number;
    public health = 5;

    private emitter?: Phaser.GameObjects.Particles.ParticleEmitter;
    private flashEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

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
        this.time = time;
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
}
