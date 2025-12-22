
import * as PIXI from 'pixi.js';
import { BaseView } from './BaseView';
import { Player } from '../../entities/Player';
import { PlayerState } from '../../../types';

export class PlayerView extends BaseView {
    private shipGfx: PIXI.Graphics;
    private engines: PIXI.Graphics;
    private aura: PIXI.Graphics;

    constructor() {
        super();
        this.aura = new PIXI.Graphics();
        this.engines = new PIXI.Graphics();
        this.shipGfx = new PIXI.Graphics();
        
        this.addChild(this.aura, this.engines, this.shipGfx);
    }

    update(entity: Player) {
        this.x = entity.position.x;
        this.y = entity.position.y;
        this.rotation = entity.tilt;
        
        const tierScale = 1.1 + entity.tier * 0.1;
        this.scale.set(tierScale);
        
        if (entity.state === PlayerState.RESPAWNING) {
            this.alpha = 0.5 + Math.sin(Date.now() / 50) * 0.3;
        } else {
            this.alpha = (entity.invulnerableTime > 0 && Math.floor(Date.now() / 80) % 2 === 0) ? 0.3 : 1;
        }

        const flash = entity.flashFrame > 0;
        const color = flash ? 0xffffff : PIXI.Color.shared.setValue(entity.primaryColor).toNumber();
        const glow = PIXI.Color.shared.setValue(entity.glowColor).toNumber();

        // 1. Aura (Hào quang khi Overload)
        this.aura.clear();
        if (entity.overloadValue > 70) {
            const intensity = (entity.overloadValue - 70) / 30;
            this.aura.circle(0, 0, 50 + intensity * 20)
                     .fill({ color: entity.isOverheated ? 0xef4444 : glow, alpha: 0.2 * intensity });
        }

        // 2. Engines (Lửa phản lực)
        this.engines.clear();
        const flicker = Math.random() * 5;
        this.engines.circle(-12, 32, 6 + flicker).circle(12, 32, 6 + flicker).fill(0xf97316);
        this.engines.circle(-12, 32, 3).circle(12, 32, 3).fill(0xffffff);

        // 3. Main Ship
        this.shipGfx.clear();
        // Wings
        this.shipGfx.roundRect(-40, 0, 80, 26, 8).fill(color).stroke({ width: 3, color: 0x000000 });
        // Body
        this.shipGfx.ellipse(0, -6, 26, 38).fill(color).stroke({ width: 4, color: 0x020617 });
        // Cockpit
        this.shipGfx.ellipse(0, -20, 14, 18).fill(0xCBD5E1).stroke({ width: 2, color: 0x020617 });
        
        // Tier Decorations
        if (entity.tier >= 3) {
            this.shipGfx.moveTo(-10, -38).lineTo(-18, -25).lineTo(-10, -15).closePath().fill(0x1e293b).stroke({width: 2, color: 0x000});
            this.shipGfx.moveTo(10, -38).lineTo(18, -25).lineTo(10, -15).closePath().fill(0x1e293b).stroke({width: 2, color: 0x000});
        }

        // Core Glow (Nhịp tim năng lượng)
        const coreSize = 6 + entity.weaponLevel * 0.5 + Math.sin(Date.now() / 100) * 2;
        this.shipGfx.circle(0, 5, coreSize).fill(glow).stroke({ width: 2, color: 0xffffff });
    }
}
