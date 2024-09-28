import Environment from "../assets/environment.png";
import Enemies from "../assets/enemies.png";
import PlayerBlue from "../assets/playerblue.png";
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
            vertical: 0x06,
            horizontal: 0x06,
            destroyed: 0x06
        },
        floor: {
            outer: [0x00],
            outerCorridor: [71, 71, 71, 71, 71, 71, 71, 71, 71, 71, 71, 70, 69]
        },
        walls: {
            alone: 5,
            intersections: {
                n: 0x05,
                e: 0x05,
                s: 0x05,
                w: 0x05,
                n_e: 37 * 10 + 2,
                e_s: 37 * 1 + 1,
                n_w: 5,
                s_w: 0x05,
                e_w: 5, // confirmed 5
                n_s: 37 * 2 + 1, // confirmed 37
                n_e_s: 0x05,
                n_s_w: 0x05,
                n_e_w: 362,
                e_s_w: 6, // confirmed 6
                n_e_s_w: 0x05,
                e_door: 0x05,
                w_door: 0x05
            }
        }
    }
}

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
            repeat: -1
        },
        walk: {
            key: "walk",
            frames: { start: 30, end: 33 },
            frameRate: 6,
            repeat: -1
        }
    }
}

export const goon: AnimSet = {
    name: "goon",
    width: 32,
    height: 32,
    file: Enemies,
    animations: {
        idle: {
            key: "idle",
            frames: { frames: [ 120, 122, 123 ] },
            frameRate: 6,
            repeat: -1
        },
        death: {
            key: "death",
            frames: { start: 150, end: 155 },
            frameRate: 16,
            hideOnComplete: true
        }
    }
}

export const util = {
    name: "util",
    width: 32,
    height: 32,
    file: Util,
    indices: {
        black: 0x00
    }
}