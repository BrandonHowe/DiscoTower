import Environment from "../assets/environment.png";
import Enemies from "../assets/enemies.png";
import Hearts from "../assets/hearts.png";
import Items from "../assets/items.png";
import PlayerBlue from "../assets/playerblue.png";
import Teleporters from "../assets/teleporters.png";
import Util from "../assets/util.png";

type AnimConfig = {
    key: string;
    frames: Phaser.Types.Animations.GenerateFrameNumbers;
    defaultTextureKey?: string;
    frameRate?: integer;
    duration?: integer;
    skipMissedFrames?: boolean;
    delay?: integer;
    repeat?: integer;
    repeatDelay?: integer;
    yoyo?: boolean;
    showOnStart?: boolean;
    hideOnComplete?: boolean;
};

type GraphicSet = {
    name: string;
    width: number;
    height: number;
    file: string;
    margin?: number;
    spacing?: number;
};

type AnimSet = GraphicSet & {
    animations: { [k: string]: AnimConfig };
};

export const environment = {
    name: "environment",
    width: 32,
    height: 32,
    margin: 0,
    spacing: 0,
    file: Environment,
    indices: {
        doors: {
            vertical: 37 * 5 + 3,
            horizontal: 37 * 4 + 3,
            destroyed: 37 * 4 + 4,
        },
        floor: {
            outer: [0x00],
            outerCorridor: [71, 71, 71, 71, 71, 71, 71, 71, 71, 71, 71, 70, 69],
        },
        walls: {
            alone: 5,
            intersections: {
                n: 37 * 1 + 4,
                e: 37 * 9 + 7,
                s: 37 * 3 + 5,
                w: 37 * 9 + 7,
                n_e: 37 * 10 + 2,
                e_s: 37 * 1 + 1,
                n_w: 37 * 10 + 8,
                s_w: 37 * 1 + 9,
                e_w: 37 * 0 + 5, // confirmed 5
                n_s: 37 * 2 + 1, // confirmed 37
                n_e_s: 37 * 3 + 1,
                n_s_w: 37 * 3 + 9,
                n_e_w: 37 * 5 + 7,
                e_s_w: 37 * 3 + 7,
                n_e_s_w: 37 * 4 + 7,
            },
        },
    },
};

export const player: AnimSet = {
    name: "player",
    width: 32,
    height: 32,
    file: PlayerBlue,
    animations: {
        idle: {
            key: "playerIdle",
            frames: { start: 0x00, end: 0x00 },
            frameRate: 6,
            repeat: -1,
        },
        walk: {
            key: "walk",
            frames: { start: 30, end: 33 },
            frameRate: 6,
            repeat: -1,
        },
    },
};

export const teleporters: AnimSet = {
    name: "teleporters",
    width: 32,
    height: 32,
    file: Teleporters,
    animations: {
        teleporterIdle: {
            key: "teleporterIdle",
            frames: { start: 8, end: 11 },
            frameRate: 2,
            repeat: -1,
        },
        teleporterActive: {
            key: "teleporterActive",
            frames: { start: 0, end: 3 },
            frameRate: 2,
            repeat: -1,
        },
    },
};

export const enemy: AnimSet = {
    name: "enemy",
    width: 32,
    height: 32,
    file: Enemies,
    animations: {
        droneIdle: {
            key: "droneIdle",
            frames: { frames: [0, 1, 2, 3] },
            frameRate: 6,
            repeat: -1,
        },
        droneDeath: {
            key: "droneDeath",
            frames: { start: 30, end: 36 },
            frameRate: 16,
            hideOnComplete: true,
        },
        goonIdle: {
            key: "goonIdle",
            frames: { frames: [120, 122, 123] },
            frameRate: 6,
            repeat: -1,
        },
        goonDeath: {
            key: "goonDeath",
            frames: { start: 150, end: 156 },
            frameRate: 16,
            hideOnComplete: true,
        },
        sentinelIdle: {
            key: "sentinelIdle",
            frames: { frames: [170, 171] },
            frameRate: 2,
            repeat: -1,
        },
        sentinelDeath: {
            key: "sentinelDeath",
            frames: { start: 200, end: 206 },
            frameRate: 16,
            hideOnComplete: true,
        },
        chaserIdle: {
            key: "chaserIdle",
            frames: { start: 340, end: 343 },
            frameRate: 2,
            repeat: -1,
        },
        chaserDeath: {
            key: "chaserDeath",
            frames: { start: 370, end: 373 },
            frameRate: 16,
            hideOnComplete: true,
        },
    },
};

export const hearts = {
    name: "hearts",
    width: 32,
    height: 32,
    margin: 0,
    spacing: 0,
    file: Hearts,
    indices: {
        full: 0x00,
        empty: 0x01,
        scrap: 0x02,
        combo: 0x03,
    },
};

export const items = {
    name: "items",
    width: 32,
    height: 32,
    margin: 0,
    spacing: 0,
    file: Items,
    indices: {
        fist: 0x00,
        dagger: 0x01,
        nothing: 0x10,
        tunic: 0x11,
        scrap: 0x20,
    } as Record<string, number>,
};

export const util = {
    name: "util",
    width: 32,
    height: 32,
    file: Util,
    indices: {
        black: 0x00,
    },
};
