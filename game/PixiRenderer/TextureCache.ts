
import * as PIXI from 'pixi.js';
import { EnemyType } from '../../types';
import { ENEMY_VISUAL_CONFIG } from '../entities/Chicken';

export class TextureCache {
    private static _instance: TextureCache;
    private cache: Map<string, PIXI.Texture> = new Map();

    static getInstance() {
        if (!TextureCache._instance) TextureCache._instance = new TextureCache();
        return TextureCache._instance;
    }

    getEnemyTexture(app: PIXI.Application, type: EnemyType): PIXI.Texture {
        const key = `enemy_${type}`;
        if (this.cache.has(key)) return this.cache.get(key)!;

        const g = new PIXI.Graphics();
        const cfg = ENEMY_VISUAL_CONFIG[type];
        
        // Vẽ thân gà
        g.ellipse(0, -28, 15, 13).fill(0xffffff);
        g.moveTo(-13, -18)
         .quadraticCurveTo(-28, -2, -26, 18)
         .quadraticCurveTo(-22, 38, 0, 40)
         .quadraticCurveTo(22, 38, 26, 18)
         .quadraticCurveTo(28, -2, 13, -18)
         .closePath()
         .fill(PIXI.Color.shared.setValue(cfg.bodyColor).toNumber())
         .stroke({ width: 4, color: 0x020617 });

        // Fix cho Pixi v8 generateTexture
        const texture = app.renderer.generateTexture({ target: g });
        this.cache.set(key, texture);
        g.destroy();
        return texture;
    }
}
