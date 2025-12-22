
import * as PIXI from 'pixi.js';
import { BaseView } from './BaseView';
import { PowerUp } from '../../entities/Environment';
import { PowerUpType } from '../../../types';

export class PowerUpView extends BaseView {
    private graphics: PIXI.Graphics;

    constructor(entity: PowerUp) {
        super();
        this.graphics = new PIXI.Graphics();
        if (entity.kind === PowerUpType.HEART) {
            this.graphics.moveTo(0, 16).bezierCurveTo(-22, -2, -22, -22, 0, -22).bezierCurveTo(22, -22, 22, -2, 0, 16).fill(0xff4d4d).stroke({width: 3, color: 0x000});
        } else if (entity.kind === PowerUpType.POWER_BOOST) {
            this.graphics.circle(0, 0, 24).fill(0xa855f7).stroke({width: 3, color: 0x000});
            const bolt = new PIXI.Graphics().moveTo(0, -15).lineTo(-10, 2).lineTo(-2, 2).lineTo(-6, 15).lineTo(10, -2).lineTo(2, -2).closePath().fill(0xfacc15).stroke({width: 1.5, color: 0x000});
            this.graphics.addChild(bolt);
        } else {
            this.graphics.roundRect(-18, -18, 36, 36, 4).fill(PIXI.Color.shared.setValue(entity.color).toNumber()).stroke({width: 3, color: 0x000});
            const txt = new PIXI.Text({ text: entity.weaponType[0], style: { fontSize: 20, fontWeight: 'bold' }});
            txt.anchor.set(0.5); txt.y = -2; this.graphics.addChild(txt);
        }
        this.addChild(this.graphics);
    }

    update(entity: PowerUp) {
        this.x = entity.position.x;
        this.y = entity.position.y;
        const pulse = 1 + Math.sin(Date.now() / 150) * 0.15;
        this.scale.set(pulse, pulse);
    }
}
