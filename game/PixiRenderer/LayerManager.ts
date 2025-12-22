
import * as PIXI from 'pixi.js';

export enum LayerType {
    BG = 'bg',
    PARTICLE = 'particle',
    ENEMY = 'enemy',
    BULLET = 'bullet',
    PLAYER = 'player',
    EXPLOSION = 'explosion',
    OVERLAY = 'overlay'
}

export class LayerManager {
    private layers: Map<LayerType, PIXI.Container> = new Map();

    init(stage: PIXI.Container) {
        Object.values(LayerType).forEach(type => {
            const container = new PIXI.Container();
            container.label = type;
            this.layers.set(type as LayerType, container);
            stage.addChild(container);
        });
    }

    getLayer(type: LayerType): PIXI.Container {
        return this.layers.get(type)!;
    }

    clear() {
        this.layers.forEach(l => l.destroy({ children: true }));
        this.layers.clear();
    }
}
