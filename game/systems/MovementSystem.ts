
import { WorldContext } from '../WorldContext';
import { GameSystem } from './GameSystem';
import { InputState } from '../../types';
import { RoosterRocket } from '../entities/projectiles/RoosterRocket';

export class MovementSystem implements GameSystem {
    update(engine: any, dt: number, input: InputState) {
        const ctx: WorldContext = engine.ctx;
        const map = ctx.currentVersion.maps[ctx.currentMapIndex];
        
        ctx.players.forEach(p => {
            p.handleInput(dt, p.id === 'p1' ? input.p1 : input.p2, map.ambientEffect === 'CYBER_STATIC' ? 'CYBER' : 'SKY' as any);
            p.update(dt);
        });

        ctx.enemies.forEach(e => e.update(dt));
        if (ctx.boss) ctx.boss.updateWithEngine(dt, engine);
        
        ctx.bullets.forEach(b => {
            if (b instanceof RoosterRocket) (b as RoosterRocket).updateWithEngine(dt, engine);
            else b.update(dt);
        });

        ctx.powerups.forEach(p => p.update(dt));
        ctx.obstacles.forEach(ob => ob.update(dt, 200, map.orientation));
        ctx.backgroundEntities.forEach(b => b.update(dt));
        ctx.particles.forEach(p => p.update(dt));
        ctx.explosions.forEach(e => e.update(dt));
        ctx.floatingTexts.forEach(ft => ft.update(dt));
    }
}
