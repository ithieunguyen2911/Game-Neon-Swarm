
import { Entity, Player, Enemy, Boss, PowerUp, Particle, Explosion, Projectile, BackgroundEntity } from '../Entities';
import { BaseView } from './views/BaseView';
import { PlayerView } from './views/PlayerView';
import { EnemyView } from './views/EnemyView';
import { BossView } from './views/BossView';
import { PowerUpView } from './views/PowerUpView';
import { BulletView } from './views/BulletView';
import { ParticleView } from './views/ParticleView';
import { ExplosionView } from './views/ExplosionView';
import { BgView } from './views/BgView';

export class ViewFactory {
    static create(entity: Entity): BaseView {
        if (entity instanceof Player) return new PlayerView();
        // Fix: Pass entity as an argument to BossView constructor.
        if (entity instanceof Boss) return new BossView(entity);
        if (entity instanceof Enemy) return new EnemyView(entity);
        if (entity instanceof PowerUp) return new PowerUpView(entity);
        if (entity instanceof Projectile) return new BulletView(entity);
        if (entity instanceof Particle) return new ParticleView(entity);
        if (entity instanceof Explosion) return new ExplosionView();
        if (entity instanceof BackgroundEntity) return new BgView(entity);
        throw new Error("Unknown entity type for view creation");
    }
}
