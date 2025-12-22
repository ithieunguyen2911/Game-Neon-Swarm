
import { WorldContext } from '../WorldContext';
import { GameSystem } from './GameSystem';
import { PlayerState, EnemyType, PowerUpType } from '../../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, MAX_WEAPON_LEVEL, DROP_CHANCE_NORMAL, DROP_CHANCE_ELITE } from '../../constants';
import { audio } from '../../services/AudioSynthesizer';
import { FloatingText } from '../entities/BaseEntity';
import { Explosion } from '../entities/projectiles/Explosion';
import { PowerUp } from '../entities/Environment';

export class CollisionSystem implements GameSystem {
    update(engine: any, dt: number) {
        const ctx: WorldContext = engine.ctx;
        
        // Đạn vs Kẻ thù/Boss
        ctx.bullets.forEach(b => {
            if (!b.isEnemy) {
                ctx.enemies.forEach(e => {
                    if (!e.isDead && this.isColliding(b, e)) {
                        e.hp -= b.damage;
                        e.hit();
                        b.onImpact(engine, b.position);
                    }
                });
                if (ctx.boss && !ctx.boss.isDead && this.isColliding(b, ctx.boss)) {
                    ctx.boss.hp -= b.damage;
                    ctx.boss.hit();
                    b.onImpact(engine, b.position);
                }
            } else {
                ctx.players.forEach(p => {
                    if (p.state === PlayerState.ALIVE && p.invulnerableTime <= 0 && this.isColliding(b, p)) {
                        this.playerHit(p, engine);
                        b.onImpact(engine, b.position);
                    }
                });
            }
        });

        // Người chơi vs Kẻ thù/Boss/Vật cản
        ctx.players.forEach(p => {
            if (p.state !== PlayerState.ALIVE || p.invulnerableTime > 0) return;

            ctx.enemies.forEach(e => {
                if (!e.isDead && this.isColliding(p, e)) this.playerHit(p, engine);
            });
            
            if (ctx.boss && !ctx.boss.isDead && this.isColliding(p, ctx.boss)) this.playerHit(p, engine);
            
            ctx.obstacles.forEach(ob => {
                if (this.isColliding(p, ob)) this.playerHit(p, engine);
            });
        });

        // Người chơi vs Powerup
        ctx.powerups.forEach(pow => {
            ctx.players.forEach(p => {
                if (!pow.isDead && this.isColliding(p, pow)) {
                    this.applyPowerup(p, pow, engine);
                    pow.isDead = true;
                }
            });
        });

        // Xử lý kẻ thù chết
        ctx.enemies.forEach(e => {
            if (e.hp <= 0 && !e.isDead) {
                ctx.addScore(e.scoreValue, e.position);
                engine.spawnParticles(e.position, '#ffffff', 12, 300);
                
                // Tỷ lệ rớt vật phẩm dựa trên hằng số cấu hình
                const powerUpChance = e.type === EnemyType.ELITE ? DROP_CHANCE_ELITE : DROP_CHANCE_NORMAL;
                
                if (Math.random() < powerUpChance) {
                    // Nếu là quái Elite rớt hẳn 2 items cho "phê"
                    const dropCount = e.type === EnemyType.ELITE ? 2 : 1;
                    
                    for (let i = 0; i < dropCount; i++) {
                        const rand = Math.random();
                        let kind = PowerUpType.WEAPON;
                        
                        // Tỷ lệ xuất hiện các loại items: 25% Máu, 20% Booster, 55% Vũ khí
                        if (rand < 0.25) kind = PowerUpType.HEART;
                        else if (rand < 0.45) kind = PowerUpType.POWER_BOOST;

                        const offset = {
                            x: e.position.x + (i > 0 ? (Math.random() - 0.5) * 60 : 0),
                            y: e.position.y + (i > 0 ? (Math.random() - 0.5) * 60 : 0)
                        };
                        ctx.powerups.push(new PowerUp(offset, kind));
                    }
                }
                e.isDead = true;
            }
        });
    }

    private isColliding(a: any, b: any) {
        const dx = a.position.x - b.position.x;
        const dy = a.position.y - b.position.y;
        const minDist = (a.radius || 20) + (b.radius || 20);
        return dx*dx + dy*dy < minDist*minDist;
    }

    private playerHit(p: any, engine: any) {
        const ctx = engine.ctx;
        p.lives--;
        p.applyDeathPenalty();
        ctx.explosions.push(new Explosion({...p.position}, 150, 0));
        audio.playExplosion();
        ctx.screenShake = 20;
        
        if (p.lives <= 0) {
            p.state = PlayerState.DEAD;
        } else {
            p.position.x = CANVAS_WIDTH / 2;
            p.position.y = CANVAS_HEIGHT + 200;
            p.state = PlayerState.RESPAWNING;
            p.respawnTimer = 2;
        }
    }

    private applyPowerup(p: any, pow: any, engine: any) {
        const ctx = engine.ctx;
        audio.playPowerup();
        if (pow.kind === PowerUpType.HEART) {
            p.lives++;
            ctx.floatingTexts.push(new FloatingText(pow.position.x, pow.position.y, "EXTENDED LIFE", "#ef4444", 28));
        } else if (pow.kind === PowerUpType.POWER_BOOST) {
            // Tăng hẳn 3 level khi ăn Power Boost
            p.weaponLevel = Math.min(MAX_WEAPON_LEVEL, p.weaponLevel + 3);
            ctx.floatingTexts.push(new FloatingText(p.position.x, p.position.y, "OVERDRIVE BOOST!!!", "#a855f7", 40));
        } else if (pow.kind === PowerUpType.WEAPON) {
            if (p.weaponType === pow.weaponType) {
                p.weaponLevel = Math.min(MAX_WEAPON_LEVEL, p.weaponLevel + 1);
                ctx.floatingTexts.push(new FloatingText(p.position.x, p.position.y, "UPGRADE!", p.glowColor, 32));
            } else {
                p.weaponType = pow.weaponType;
                p.weaponLevel = Math.max(1, Math.floor(p.weaponLevel * 0.8) + 1);
                ctx.floatingTexts.push(new FloatingText(p.position.x, p.position.y, `${pow.weaponType} LINKED`, p.glowColor, 32));
            }
        }
    }
}
