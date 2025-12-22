
import * as PIXI from 'pixi.js';
import { BaseView } from './BaseView';
import { Explosion } from '../../entities/Combat';

export class ExplosionView extends BaseView {
    private graphics: PIXI.Graphics;
    private shockwave: PIXI.Graphics;
    private particles: PIXI.Graphics;

    constructor() {
        super();
        this.graphics = new PIXI.Graphics();
        this.shockwave = new PIXI.Graphics();
        this.particles = new PIXI.Graphics();
        this.addChild(this.shockwave, this.graphics, this.particles);
    }

    update(entity: Explosion) {
        this.x = entity.position.x;
        this.y = entity.position.y;
        
        const alpha = entity.life / entity.maxLife;
        const invAlpha = 1 - alpha;
        const color = entity.isBurning ? 0xf97316 : 0xfde047;
        const r = entity.radius;

        this.graphics.clear();
        this.shockwave.clear();
        this.particles.clear();

        // 1. Violent Core Heat
        const coreAlpha = Math.pow(alpha, 0.5);
        this.graphics.circle(0, 0, r * 1.2)
            .fill({ color, alpha: coreAlpha * 0.4 });
        this.graphics.circle(0, 0, r * 0.8)
            .fill({ color: 0xffffff, alpha: coreAlpha * 0.8 });

        // 2. Double Shockwave
        this.shockwave.circle(0, 0, r * (1.1 + invAlpha * 1.5))
            .stroke({ width: 8 * alpha, color: 0xffffff, alpha: alpha * 0.4 });
        this.shockwave.circle(0, 0, r * (1.3 + invAlpha * 0.8))
            .stroke({ width: 4 * alpha, color, alpha: alpha * 0.3 });

        // 3. Energetic Shrapnel Sparks
        if (alpha > 0.3) {
            for (let i = 0; i < 12; i++) {
                const ang = (i / 12) * Math.PI * 2 + invAlpha * 4;
                const len = 40 * alpha + Math.random() * 60;
                const dist = r * (0.4 + invAlpha * 1.2);
                
                this.particles.moveTo(Math.cos(ang) * dist, Math.sin(ang) * dist)
                    .lineTo(Math.cos(ang) * (dist + len), Math.sin(ang) * (dist + len))
                    .stroke({ width: 3 * alpha, color: 0xffffff, alpha: alpha });
            }
        }

        // Camera Shake simulation via Scale
        const pulse = 1 + Math.sin(alpha * 10) * 0.1 * alpha;
        this.scale.set(pulse);
    }
}
