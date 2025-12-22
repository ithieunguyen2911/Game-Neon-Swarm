
import { WorldContext } from '../WorldContext';
import { GameSystem } from './GameSystem';
import { Enemy, Projectile } from '../Entities';

export class CullingSystem implements GameSystem {
    update(engine: any, dt: number) {
        const ctx: WorldContext = engine.ctx;
        
        // Culling Floating Texts
        ctx.floatingTexts = ctx.floatingTexts.filter(ft => !ft.isDead);

        // Culling Bullets & Return to Pool
        ctx.bullets.forEach(b => {
            if (b.isDead || b.position.y < -200 || b.position.y > 1280 || b.position.x < -200 || b.position.x > 2120) {
                b.isDead = true;
                ctx.addBulletToPool(b);
            }
        });
        ctx.bullets = ctx.bullets.filter(b => !b.isDead);

        // Culling Powerups
        ctx.powerups = ctx.powerups.filter(p => !p.isDead);

        // Culling Particles
        ctx.particles = ctx.particles.filter(p => !p.isDead);

        // Culling Explosions
        ctx.explosions = ctx.explosions.filter(e => !e.isDead);

        // Culling Enemies & Return to Pool
        ctx.enemies.forEach(e => {
            if (e.isDead) ctx.enemyPool.push(e);
        });
        ctx.enemies = ctx.enemies.filter(e => !e.isDead);

        ctx.obstacles = ctx.obstacles.filter(o => !o.isDead);
        
        if (ctx.screenShake > 0) ctx.screenShake -= 0.8;
    }
}
