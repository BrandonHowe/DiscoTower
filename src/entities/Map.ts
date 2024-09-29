import Dungeoneer, { Tile as DungeoneerTile } from "dungeoneer";
import * as Graphics from "./Graphics";
import Tile, { TileType } from "./Tile";
import { DungeonScene } from "../scenes/DungeonScene";
import Player from "./Player";
import Item, { Armors, ItemData, Weapons } from "./Items";
import Portal from "./Portal";
import Enemy, { Boss, Chaser, Drone, Goon, Sentinel } from "./Enemy";

export default class Map {
    public readonly width: number;
    public readonly height: number;
    public startingX!: number;
    public startingY!: number;

    public portalX!: number;
    public portalY!: number;
    public portalSprite!: Phaser.GameObjects.Sprite;

    private tintingEven = false;

    public tiles!: Tile[][];
    public tilemap!: Phaser.Tilemaps.Tilemap;

    public groundLayer!: Phaser.Tilemaps.TilemapLayer;
    public wallLayer!: Phaser.Tilemaps.TilemapLayer;
    public doorLayer!: Phaser.Tilemaps.TilemapLayer;

    public rooms!: Dungeoneer.Room[];

    public enemies: Enemy[] = [];
    public items: Item[] = [];
    public portals: Portal[] = [];

    private readonly scene: DungeonScene;
    private dungeonTiles: Phaser.Tilemaps.Tileset;

    constructor(width: number, height: number, scene: DungeonScene) {
        this.width = width;
        this.height = height;
        this.scene = scene;

        this.tilemap = scene.make.tilemap({
            tileWidth: 32,
            tileHeight: 32,
            width,
            height,
        });
        const dungeonTiles = this.tilemap.addTilesetImage(
            Graphics.environment.name,
            Graphics.environment.name,
            Graphics.environment.width,
            Graphics.environment.height,
            Graphics.environment.margin,
            Graphics.environment.spacing
        );
        if (dungeonTiles === null)
            throw new Error("Failed to load dungeon tiles");
        this.dungeonTiles = dungeonTiles;

        this.regenerateDungeon(0);
    }

    public regenerateDungeon(level: number) {
        const width = this.width;
        const height = this.height;

        // Generate dungeon
        let dungeon = Dungeoneer.build({
            width: width - 2,
            height: height - 2,
        });
        while (dungeon.rooms.length <= 2) {
            dungeon = Dungeoneer.build({
                width: width - 2,
                height: height - 2,
            });
        }
        this.rooms = dungeon.rooms;
        for (const room of this.rooms) {
            room.x++;
            room.y++;
        }
        for (let i = 0; i < dungeon.tiles.length; i++) {
            const row = dungeon.tiles[i];
            for (const el of row) {
                el.x++;
                el.y++;
            }
            row.push({
                type: "wall",
                x: row.length + 1,
                y: i + 1,
            } as DungeoneerTile);
            row.unshift({ type: "wall", x: 0, y: i + 1 } as DungeoneerTile);
        }
        const topRow: DungeoneerTile[] = [];
        for (let i = 0; i < dungeon.tiles[0].length; i++) {
            topRow.push({ type: "wall", x: i, y: 0 } as DungeoneerTile);
        }
        const bottomRow: DungeoneerTile[] = [];
        for (let i = 0; i < dungeon.tiles[0].length; i++) {
            bottomRow.push({
                type: "wall",
                x: i,
                y: dungeon.tiles.length,
            } as DungeoneerTile);
        }
        dungeon.tiles.unshift(topRow);
        dungeon.tiles.push(bottomRow);

        // Create tiles from dungeon
        this.tiles = [];
        for (let y = 0; y < height; y++) {
            this.tiles.push([]);
            for (let x = 0; x < width; x++) {
                const tileType = Tile.tileTypeFor(dungeon.tiles[x][y].type);
                this.tiles[y][x] = new Tile(tileType, x, y, this);
            }
        }

        // We don't want any solid chunks of wall, just replace them with air
        const toReset = [];
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const tile = this.tiles[y][x];
                if (tile.type === TileType.Wall && tile.isEnclosed()) {
                    toReset.push({ y: y, x: x });
                }
            }
        }
        for (const tile of toReset) {
            this.tiles[tile.y][tile.x] = new Tile(
                TileType.None,
                tile.x,
                tile.y,
                this
            );
        }

        // Starting position of the player
        const firstRoom = this.rooms.reduce((acc, cur) =>
            acc.width * acc.height < cur.width * cur.height ? acc : cur
        );
        const startingRoomNum = this.rooms.indexOf(firstRoom);
        this.startingX = Math.floor(firstRoom.x + firstRoom.width / 2);
        this.startingY = Math.floor(firstRoom.y + firstRoom.height / 2);

        // Init ground
        let groundLayer: Phaser.Tilemaps.TilemapLayer | null | undefined =
            this.tilemap.getLayer("Ground")?.tilemapLayer;
        if (!groundLayer) {
            groundLayer = this.tilemap.createBlankLayer(
                "Ground",
                this.dungeonTiles,
                0,
                0
            );
        }
        if (!groundLayer) throw new Error("Failed to init ground layer");
        this.groundLayer = groundLayer.randomize(
            0,
            0,
            this.width,
            this.height,
            Graphics.environment.indices.floor.outerCorridor
        );
        this.groundLayer.setDepth(1);

        for (const enemy of this.enemies) {
            enemy.destroy();
        }
        this.enemies = [];
        for (let i = 0; i < dungeon.rooms.length; i++) {
            if (i === startingRoomNum) continue;
            const room = dungeon.rooms[i];

            if (room.height < 4 || room.width < 4) {
                continue;
            }

            const numDrones = Phaser.Math.Between(0, level + 2);
            for (let i = 0; i < numDrones; i++) {
                const x = Phaser.Math.Between(
                    room.x + 1,
                    room.x + room.width - 1
                );
                const y = Phaser.Math.Between(
                    room.y + 1,
                    room.y + room.height - 1
                );
                const newDrone = new Drone(
                    Phaser.Math.Snap.To(this.tilemap.tileToWorldX(x)!, 32),
                    Phaser.Math.Snap.To(this.tilemap.tileToWorldX(y)!, 32) + 4,
                    x,
                    y,
                    this.scene
                );
                this.enemies.push(newDrone);
            }

            const numChasers = Phaser.Math.Between(0, level + 1);
            for (let i = 0; i < numChasers; i++) {
                const x = Phaser.Math.Between(
                    room.x + 1,
                    room.x + room.width - 1
                );
                const y = Phaser.Math.Between(
                    room.y + 1,
                    room.y + room.height - 1
                );
                const newChaser = new Chaser(
                    Phaser.Math.Snap.To(this.tilemap.tileToWorldX(x)!, 32),
                    Phaser.Math.Snap.To(this.tilemap.tileToWorldX(y)!, 32) + 4,
                    x,
                    y,
                    this.scene
                );
                this.enemies.push(newChaser);
            }

            if (level >= 2) {
                const numGoons = Phaser.Math.Between(0, 1);
                for (let i = 0; i < numGoons; i++) {
                    const x = Phaser.Math.Between(
                        room.x + 1,
                        room.x + room.width - 1
                    );
                    const y = Phaser.Math.Between(
                        room.y + 1,
                        room.y + room.height - 1
                    );
                    const newGoon = new Goon(
                        Phaser.Math.Snap.To(this.tilemap.tileToWorldX(x)!, 32),
                        Phaser.Math.Snap.To(this.tilemap.tileToWorldX(y)!, 32) +
                            4,
                        x,
                        y,
                        this.scene
                    );
                    this.enemies.push(newGoon);
                }
            }

            const numSentinels = Phaser.Math.Between(1, 3);
            for (let i = 0; i < numSentinels; i++) {
                const x = Phaser.Math.Between(
                    room.x + 1,
                    room.x + room.width - 1
                );
                const y = Phaser.Math.Between(
                    room.y + 1,
                    room.y + room.height - 1
                );
                const newSentinel = new Sentinel(
                    Phaser.Math.Snap.To(this.tilemap.tileToWorldX(x)!, 32) + 16,
                    Phaser.Math.Snap.To(this.tilemap.tileToWorldX(y)!, 32) + 8,
                    x,
                    y,
                    this.scene
                );
                this.enemies.push(newSentinel);
            }
        }

        for (const item of this.items) {
            item.destroy();
        }
        this.items = [];
        this.createItem(Weapons.dagger, startingRoomNum);
        this.createItem(Armors.tunic, startingRoomNum);

        // Init walls and doors
        let wallLayer = this.tilemap.getLayer("Wall")?.tilemapLayer;
        if (!wallLayer) {
            const newWallLayer = this.tilemap.createBlankLayer(
                "Wall",
                this.dungeonTiles,
                0,
                0
            );
            if (!newWallLayer) throw new Error("Failed to init wall layer");
            wallLayer = newWallLayer;
        }

        let doorLayer = this.tilemap.getLayer("Door")?.tilemapLayer;
        if (!doorLayer) {
            const newDoorLayer = this.tilemap.createBlankLayer(
                "Door",
                this.dungeonTiles,
                0,
                0
            );
            if (!newDoorLayer) throw new Error("Failed to init door layer");
            doorLayer = newDoorLayer;
        }

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const tile = this.tiles[y][x];
                if (tile.type === TileType.Wall) {
                    wallLayer.putTileAt(tile.spriteIndex(), x, y);
                    doorLayer.removeTileAt(x, y);
                } else if (tile.type === TileType.Door) {
                    doorLayer.putTileAt(tile.spriteIndex(), x, y);
                    wallLayer.removeTileAt(x, y);
                } else {
                    wallLayer.removeTileAt(x, y);
                    doorLayer.removeTileAt(x, y);
                }
            }
        }

        const collidableDoors = [
            Graphics.environment.indices.doors.horizontal,
            Graphics.environment.indices.doors.vertical,
        ];
        doorLayer.setCollision(collidableDoors);

        doorLayer.setTileIndexCallback(
            collidableDoors,
            (_: unknown, tile: Phaser.Tilemaps.Tile) => {
                const data = this.tiles[tile.y][tile.x];
                const horiz =
                    data.spriteIndex() ===
                    Graphics.environment.indices.doors.horizontal;
                if (horiz) {
                    this.doorLayer.putTileAt(
                        Graphics.environment.indices.doors.destroyed,
                        tile.x,
                        tile.y
                    );
                }
                // this.tileAt(tile.x, tile.y)!.open();
                this.scene.fov!.recalculate();
            },
            this
        );
        this.doorLayer = doorLayer;
        doorLayer.setDepth(3);

        this.wallLayer = wallLayer;
        this.wallLayer.setDepth(2);

        // Boss
        if (level === 2) {
            const largestRoom = this.rooms.reduce((acc, cur) =>
                acc.width * acc.height > cur.width * cur.height ? acc : cur
            );
            const x = Phaser.Math.Between(
                largestRoom.x + 1,
                largestRoom.x + largestRoom.width - 1
            );
            const y = Phaser.Math.Between(
                largestRoom.y + 1,
                largestRoom.y + largestRoom.height - 1
            );
            const boss = new Boss(
                Phaser.Math.Snap.To(this.tilemap.tileToWorldX(x)!, 32) + 16,
                Phaser.Math.Snap.To(this.tilemap.tileToWorldX(y)!, 32) + 8,
                x,
                y,
                this.scene
            );
            this.enemies.push(boss);
        }

        for (const portal of this.portals) {
            portal.destroy();
        }
        this.portals = [];
        // Ending position
        if (level < 2) {
            let portalRoomNum = startingRoomNum;
            while (portalRoomNum === startingRoomNum) {
                portalRoomNum = Phaser.Math.Between(0, this.rooms.length - 1);
            }
            console.log("starting at ", startingRoomNum, portalRoomNum);
            const portalRoom = this.rooms[portalRoomNum];
            this.portalX = Phaser.Math.Between(
                portalRoom.x + 1,
                portalRoom.x + portalRoom.width - 1
            );
            this.portalY = Phaser.Math.Between(
                portalRoom.y + 1,
                portalRoom.y + portalRoom.height - 1
            );
            const newPortal = new Portal(
                Phaser.Math.Snap.To(
                    this.tilemap.tileToWorldX(this.portalX)!,
                    32
                ) + 18,
                Phaser.Math.Snap.To(
                    this.tilemap.tileToWorldX(this.portalY)!,
                    32
                ),
                this.portalX,
                this.portalY,
                this.scene
            );
            this.portals.push(newPortal);

            if (!this.portalSprite) {
                this.portalSprite = this.scene.add.sprite(
                    Phaser.Math.Snap.To(
                        this.tilemap.tileToWorldX(this.portalX)!,
                        32
                    ) + 18,
                    Phaser.Math.Snap.To(
                        this.tilemap.tileToWorldX(this.portalY)!,
                        32
                    ),
                    Graphics.teleporters.name,
                    5
                );
                this.portalSprite.setScale(2);
                this.portalSprite.setDepth(10);
                // this.portalSprite.anims.play(
                //     Graphics.teleporters.animations.teleporterIdle.key
                // );
            } else {
                this.portalSprite.x = Phaser.Math.Snap.To(
                    this.tilemap.tileToWorldX(this.portalX)!,
                    32
                );
                this.portalSprite.y = Phaser.Math.Snap.To(
                    this.tilemap.tileToWorldX(this.portalY)!,
                    32
                );
            }

            for (let i = 0; i < level + 1; i++) {
                const x = Phaser.Math.Between(
                    portalRoom.x + 1,
                    portalRoom.x + portalRoom.width - 1
                );
                const y = Phaser.Math.Between(
                    portalRoom.y + 1,
                    portalRoom.y + portalRoom.height - 1
                );
                const newGoon = new Goon(
                    Phaser.Math.Snap.To(this.tilemap.tileToWorldX(x)!, 32),
                    Phaser.Math.Snap.To(this.tilemap.tileToWorldX(y)!, 32) + 4,
                    x,
                    y,
                    this.scene
                );
                this.enemies.push(newGoon);
            }
        }
    }

    public createItem(item: ItemData, excludeRoom: number) {
        let weaponRoom = excludeRoom;
        while (weaponRoom === excludeRoom) {
            weaponRoom = Phaser.Math.Between(0, this.rooms.length - 1);
        }
        const room = this.rooms[weaponRoom];
        const x = Phaser.Math.Between(room.x + 1, room.x + room.width - 1);
        const y = Phaser.Math.Between(room.y + 1, room.y + room.height - 1);
        const newItem = new Item(
            Phaser.Math.Snap.To(this.tilemap.tileToWorldX(x)!, 32),
            Phaser.Math.Snap.To(this.tilemap.tileToWorldX(y)!, 32),
            x,
            y,
            item,
            this.scene
        );
        this.items.push(newItem);
    }

    public placeItem(item: ItemData, x: number, y: number) {
        const newItem = new Item(
            Phaser.Math.Snap.To(this.tilemap.tileToWorldX(x)!, 32),
            Phaser.Math.Snap.To(this.tilemap.tileToWorldX(y)!, 32),
            x,
            y,
            item,
            this.scene
        );
        this.items.push(newItem);
    }

    public tileAt(x: number, y: number): Tile | null {
        if (y < 0 || y >= this.height || x < 0 || x >= this.width) {
            return null;
        }
        return this.tiles[y][x];
    }

    public withinRoom(x: number, y: number): boolean {
        return (
            this.rooms.find((r) => {
                const { top, left, right, bottom } = r.getBoundingBox();
                return (
                    y >= top - 1 &&
                    y <= bottom + 1 &&
                    x >= left - 1 &&
                    x <= right + 1
                );
            }) !== undefined
        );
    }

    public moveEnemies(player: Player) {
        let tookDamage = false;
        for (const enemy of this.enemies) {
            if (enemy.dead) continue;
            let tile: Tile | null = null;
            if (enemy.key === "goonIdle") {
                const goon = enemy as Goon;
                const dir = Math.floor(Math.random() * 4);
                tile = this.tileAt(
                    goon.x + (dir === 1 ? 1 : dir === 3 ? -1 : 0),
                    goon.y + (dir === 0 ? 1 : dir === 2 ? -1 : 0)
                );
                if (!tile || tile.collides) continue;
            } else if (enemy.key === "droneIdle") {
                const drone = enemy as Drone;
                tile = this.tileAt(
                    drone.x + (drone.movingRight ? 1 : -1),
                    drone.y
                );
                if (!tile) continue;
                if (tile.collides) {
                    drone.movingRight = !drone.movingRight;
                    tile = this.tileAt(
                        drone.x + (drone.movingRight ? 1 : -1),
                        drone.y
                    );
                }
            } else if (enemy.key === "chaserIdle") {
                const drone = enemy as Chaser;
                let dir = 0;
                if (player.y < drone.y) dir = 2;
                else if (player.y > drone.y) dir = 0;
                else if (player.x > drone.x) dir = 1;
                else if (player.x < drone.x) dir = 3;
                tile = this.tileAt(
                    drone.x + (dir === 1 ? 1 : dir === 3 ? -1 : 0),
                    drone.y + (dir === 0 ? 1 : dir === 2 ? -1 : 0)
                );
                if (!tile || tile.collides) continue;
            } else if (enemy.key === "bossIdle") {
                const drone = enemy as Boss;
                if (drone.turnTimer === 0) {
                    drone.turnTimer++;
                    continue;
                }
                drone.turnTimer = 0;
                let distX = player.x - drone.x;
                let distY = player.y - drone.y;
                if (Math.abs(distY) > Math.abs(distX)) {
                    distX = 0;
                } else {
                    distY = 0;
                }
                let inBetweenTile = this.tileAt(
                    drone.x + (distX > 0 ? 1 : distX < 0 ? -1 : 0),
                    drone.y + (distY > 0 ? 1 : distY < 0 ? -1 : 0)
                );
                // let doubleTile = this.tileAt(
                //     drone.x + (distX > 0 ? 2 : distX < 0 ? -2 : 0),
                //     drone.y + (distY > 0 ? 2 : distY < 0 ? -2 : 0)
                // );
                // console.log(inBetweenTile, doubleTile);
                if (!inBetweenTile || inBetweenTile.collides) continue;
                tile = inBetweenTile;
                // if (inBetweenTile.collides && !doubleTile.collides) {
                //     tile = inBetweenTile;
                // } else if (!doubleTile.collides) {
                //     tile = doubleTile;
                // }
            }
            if (!tile) continue;
            if (tile.x === player.x && tile.y === player.y && !tookDamage) {
                player.health -=
                    enemy.attackStrength - player.equippedArmor.defense;
                tookDamage = true;
            } else {
                const tweens = enemy.updateXY(this.tilemap, tile.x, tile.y);
                for (const tween of tweens) {
                    this.scene.tweens.add(tween);
                }
            }
        }
    }

    public enemyAt(x: number, y: number): Enemy | null {
        for (const enemy of this.enemies) {
            if (!enemy.dead && enemy.x === x && enemy.y === y) {
                return enemy;
            }
        }
        return null;
    }

    public itemAt(x: number, y: number): Item | null {
        for (const item of this.items) {
            if (item.x === x && item.y === y) {
                return item;
            }
        }
        return null;
    }

    public portalAt(x: number, y: number): Portal | null {
        for (const portal of this.portals) {
            if (portal.x === x && portal.y === y) {
                return portal;
            }
        }
        return null;
    }

    public toggleTint(level: number) {
        this.tintingEven = !this.tintingEven;

        const presets = [
            [0xff0000, 0xffffff],
            [0x0000ff, 0xffd700],
            [0xffc0cb, 0x00ff00],
        ];

        const currentTint =
            presets[level % presets.length][Number(this.tintingEven)];

        this.groundLayer.setTint(currentTint);
    }
}
