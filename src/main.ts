import Phaser from "phaser";
import { DungeonScene } from "./scenes/DungeonScene";
import UIScene from "./scenes/UIScene";
import TitleScene from "./scenes/TitleScene";
import DeathScene from "./scenes/DeathScene";

export default new Phaser.Game({
    type: Phaser.WEBGL,
    width: window.innerWidth,
    height: window.innerHeight,
    render: { pixelArt: true },
    physics: {
        default: "arcade",
        arcade: { debug: false, gravity: { x: 0, y: 0 } },
    },
    scene: [TitleScene, DungeonScene, UIScene, DeathScene],
    scale: {
        mode: Phaser.Scale.RESIZE,
    },
    // plugins: {
    //   global: [{ key: "SceneWatcher", plugin: SceneWatcherPlugin, start: true }]
    // }
});
