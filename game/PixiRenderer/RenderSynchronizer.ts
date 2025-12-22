
import * as PIXI from 'pixi.js';
import { GameEngine } from '../GameEngine';
import { EntityViewRegistry } from './EntityViewRegistry';
import { ViewFactory } from './ViewFactory';
import { LayerManager, LayerType } from './LayerManager';
import { Entity } from '../Entities';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../constants';

export class RenderSynchronizer {
    constructor(
        private registry: EntityViewRegistry,
        private layers: LayerManager
    ) {}

    sync(engine: GameEngine, stage: PIXI.Container) {
        stage.scale.set(engine.worldScale);
        stage.x = (CANVAS_WIDTH * (1 - engine.worldScale)) / 2;
        stage.y = (CANVAS_HEIGHT * (1 - engine.worldScale)) / 2;

        const activeEntities = new Set<Entity>();
        
        // Collect all active entities
        engine.backgroundEntities.forEach(e => activeEntities.add(e));
        engine.enemies.forEach(e => activeEntities.add(e));
        if (engine.boss) activeEntities.add(engine.boss);
        engine.bullets.forEach(e => activeEntities.add(e));
        engine.players.forEach(e => activeEntities.add(e));
        engine.powerups.forEach(e => activeEntities.add(e));
        engine.particles.forEach(e => activeEntities.add(e));
        engine.explosions.forEach(e => activeEntities.add(e as any));

        // Remove dead/inactive
        for (const [entity, view] of this.registry.entries()) {
            if (!activeEntities.has(entity) || entity.isDead) {
                view.destroy({ children: true });
                this.registry.unregister(entity);
            }
        }

        // Sync groups
        this.syncEntities(engine.backgroundEntities, LayerType.BG);
        this.syncEntities(engine.enemies, LayerType.ENEMY);
        if (engine.boss) this.syncEntities([engine.boss], LayerType.ENEMY);
        this.syncEntities(engine.bullets, LayerType.BULLET);
        this.syncEntities(Array.from(engine.players.values()), LayerType.PLAYER);
        this.syncEntities(engine.powerups, LayerType.ENEMY); 
        this.syncEntities(engine.particles, LayerType.PARTICLE);
        this.syncEntities(engine.explosions as any, LayerType.EXPLOSION);

        if (engine.screenShake > 0) {
            stage.x += (Math.random() - 0.5) * engine.screenShake;
            stage.y += (Math.random() - 0.5) * engine.screenShake;
        }
    }

    private syncEntities(entities: Entity[], layerType: LayerType) {
        entities.forEach(entity => {
            if (entity.isDead) return;
            let view = this.registry.get(entity);
            if (!view) {
                view = ViewFactory.create(entity);
                this.registry.register(entity, view);
                this.layers.getLayer(layerType).addChild(view);
            }
            view.update(entity);
        });
    }
}
