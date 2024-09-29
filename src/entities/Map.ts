import Dungeoneer from "dungeoneer";
import * as Graphics from "./Graphics";
import Tile, { TileType } from "./Tile";
import { DungeonScene } from "../scenes/DungeonScene";
import Goon from "./Goon";
import Player from "./Player";
import Item, { Armors, ItemData, Weapons } from "./Items";

export default class Map {
    public readonly width: number;
    public readonly height: number;
    public readonly startingX: number;
    public readonly startingY: number;

    private tintingEven = false;

    public readonly tiles: Tile[][];
    public readonly tilemap: Phaser.Tilemaps.Tilemap;

    public readonly groundLayer: Phaser.Tilemaps.TilemapLayer;
    public readonly wallLayer: Phaser.Tilemaps.TilemapLayer;
    public readonly doorLayer: Phaser.Tilemaps.TilemapLayer;

    public readonly rooms: Dungeoneer.Room[];

    public readonly goons: Goon[] = [];
    public readonly items: Item[] = [];

    private readonly scene: DungeonScene;

    constructor(width: number, height: number, scene: DungeonScene) {
        this.width = width;
        this.height = height;
        this.scene = scene;

        // Generate dungeon
        const dungeon = Dungeoneer.build({
            width: width,
            height: height,
        });
        this.rooms = dungeon.rooms;

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
        const roomNumber = Math.floor(Math.random() * dungeon.rooms.length);
        const firstRoom = dungeon.rooms[roomNumber];
        this.startingX = Math.floor(firstRoom.x + firstRoom.width / 2);
        this.startingY = Math.floor(firstRoom.y + firstRoom.height / 2);

        // Load up tilemaps
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

        // Init ground
        const groundLayer = this.tilemap
            .createBlankLayer("Ground", dungeonTiles, 0, 0)
            ?.randomize(
                0,
                0,
                this.width,
                this.height,
                Graphics.environment.indices.floor.outerCorridor
            );
        if (!groundLayer) throw new Error("Failed to init ground layer");
        this.groundLayer = groundLayer;
        this.groundLayer.setDepth(1);

        for (let i = 0; i < dungeon.rooms.length; i++) {
            if (i === roomNumber) continue;
            const room = dungeon.rooms[i];
            // groundLayer.randomize(
            //     room.x - 1,
            //     room.y - 1,
            //     room.width + 2,
            //     room.height + 2,
            //     Graphics.environment.indices.floor.outer
            // );

            if (room.height < 4 || room.width < 4) {
                continue;
            }

            const numGoons = Phaser.Math.Between(1, 3);
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
                    Phaser.Math.Snap.To(this.tilemap.tileToWorldX(y)!, 32) + 4,
                    x,
                    y,
                    scene
                );
                this.goons.push(newGoon);
            }
        }

        this.createItem(Weapons.dagger, roomNumber);
        this.createItem(Armors.tunic, roomNumber);

        // Init walls and doors
        const wallLayer = this.tilemap.createBlankLayer(
            "Wall",
            dungeonTiles,
            0,
            0
        );
        if (!wallLayer) throw new Error("Failed to init wall layer");
        const doorLayer = this.tilemap.createBlankLayer(
            "Door",
            dungeonTiles,
            0,
            0
        );
        if (!doorLayer) throw new Error("Failed to init door layer");

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const tile = this.tiles[y][x];
                if (tile.type === TileType.Wall) {
                    wallLayer.putTileAt(tile.spriteIndex(), x, y);
                } else if (tile.type === TileType.Door) {
                    doorLayer.putTileAt(tile.spriteIndex(), x, y);
                }
            }
        }

        wallLayer.setCollisionBetween(0, 0x7f);
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
                scene.fov!.recalculate();
            },
            this
        );
        this.doorLayer = doorLayer;
        doorLayer.setDepth(3);

        this.wallLayer = wallLayer;
        this.wallLayer.setDepth(2);
    }

    public createItem(item: ItemData, excludeRoom: number) {
        let weaponRoom = excludeRoom;
        while (weaponRoom !== excludeRoom) {
            weaponRoom = Phaser.Math.Between(0, this.rooms.length);
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
        for (const goon of this.goons) {
            if (goon.dead) continue;
            let tile: Tile | null = this.tileAt(
                goon.x + (goon.movingRight ? 1 : -1),
                goon.y
            );
            if (!tile) continue;
            if (tile.collides) {
                goon.movingRight = !goon.movingRight;
                tile = this.tileAt(
                    goon.x + (goon.movingRight ? 1 : -1),
                    goon.y
                );
            }
            if (!tile) continue;
            if (tile.x === player.x && tile.y === player.y) {
                player.health--;
            } else {
                const tweens = goon.updateXY(this.tilemap, tile.x, tile.y);
                for (const tween of tweens) {
                    this.scene.tweens.add(tween);
                }
            }
        }
    }

    public enemyAt(x: number, y: number): Goon | null {
        for (const goon of this.goons) {
            if (!goon.dead && goon.x === x && goon.y === y) {
                return goon;
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

    public toggleTint() {
        this.tintingEven = !this.tintingEven;

        // for (let y = 0; y < this.tiles.length; y++) {
        //     for (let x = 0; x < this.tiles[y].length; x++) {
        //         const tileData = this.tiles[y][x];
        //         if (tileData.type !== TileType.None) continue;
        //         const parity = (y % 2 === 0) === (x % 2 === 0);
        //         const tile = this.tilemap.getTileAt(x, y);
        //         if (!tile) continue;
        //         if (parity === this.tintingEven) {
        //             tile.tint = 0xff0000;
        //         } else {
        //             tile.tint = 0x00ff00;
        //         }
        //     }
        // }

        this.groundLayer.setTint(this.tintingEven ? 0xff0000 : 0x00ff00);
    }
}
