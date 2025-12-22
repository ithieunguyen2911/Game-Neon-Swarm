
import * as PIXI from 'pixi.js';
import { BaseView } from './BaseView';
import { BackgroundEntity } from '../../entities/Environment';

export class BgView extends BaseView {
    constructor(entity: BackgroundEntity) {
        super();
        const g = new PIXI.Graphics().circle(0, 0, entity.radius).fill(0xffffff);
        this.alpha = 0.2;
        this.addChild(g);
    }

    update(entity: BackgroundEntity) {
        this.x = entity.position.x;
        this.y = entity.position.y;
    }
}
