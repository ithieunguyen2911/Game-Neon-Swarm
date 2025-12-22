
import * as PIXI from 'pixi.js';
import { BaseView } from './BaseView';
import { Particle } from '../../entities/Environment';

export class ParticleView extends BaseView {
    private graphics: PIXI.Graphics;

    constructor(entity: Particle) {
        super();
        this.graphics = new PIXI.Graphics();
        this.graphics.circle(0, 0, entity.radius).fill(entity.color);
        this.addChild(this.graphics);
    }

    update(entity: Particle) {
        this.x = entity.position.x;
        this.y = entity.position.y;
        this.alpha = entity.life;
    }
}
