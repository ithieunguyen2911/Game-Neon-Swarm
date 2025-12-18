
import * as PIXI from 'pixi.js';
import { GameEngine } from './GameEngine';
import { Entity, Player, Enemy, Boss, PowerUp, Particle, Explosion, Projectile, EggBlasterBullet, FeatherShotgunBullet, HelixDNAProjectile, RoosterRocket, PhotonLaser } from './Entities';
import { ENEMY_VISUAL_CONFIG } from './entities/Chicken';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
import { PowerUpType, WeaponType, ZoneType, PlayerState, EnemyState } from '../types';

let globalApp: PIXI.Application | null = null;
let globalInitPromise: Promise<void> | null = null;

export class PixiRenderer {
    private static _instance: PixiRenderer | null = null;
    private entityMap: Map<Entity, PIXI.Container> = new Map();
    
    private explosionLayer!: PIXI.Container;
    private bulletLayer!: PIXI.Container;
    private enemyLayer!: PIXI.Container;
    private playerLayer!: PIXI.Container;
    private bgLayer!: PIXI.Container;
    private particleLayer!: PIXI.Container;
    private overlayLayer!: PIXI.Container;

    private constructor() {}

    public static getInstance(): PixiRenderer {
        if (!PixiRenderer._instance) PixiRenderer._instance = new PixiRenderer();
        return PixiRenderer._instance;
    }

    public get app(): PIXI.Application | null {
        return globalApp;
    }

    async init() {
        if (globalApp) return; 
        if (globalInitPromise) return globalInitPromise;

        globalInitPromise = (async () => {
            try {
                const app = new PIXI.Application();
                await app.init({
                    width: CANVAS_WIDTH,
                    height: CANVAS_HEIGHT,
                    backgroundAlpha: 0,
                    antialias: true,
                    resolution: window.devicePixelRatio || 1,
                    autoDensity: true,
                });
                globalApp = app;
                this.bgLayer = new PIXI.Container();
                this.particleLayer = new PIXI.Container();
                this.enemyLayer = new PIXI.Container();
                this.bulletLayer = new PIXI.Container();
                this.playerLayer = new PIXI.Container();
                this.explosionLayer = new PIXI.Container();
                this.overlayLayer = new PIXI.Container();
                app.stage.addChild(this.bgLayer, this.particleLayer, this.enemyLayer, this.bulletLayer, this.playerLayer, this.explosionLayer, this.overlayLayer);
            } catch (err) {
                console.error("PixiJS Init Failed:", err);
                globalInitPromise = null; throw err;
            } finally {
                globalInitPromise = null;
            }
        })();
        return globalInitPromise;
    }

    reset() {
        this.entityMap.clear();
        if (globalApp) {
            globalApp.stage.destroy({ children: true, texture: true });
            globalApp.destroy({ removeView: true });
            globalApp = null;
        }
    }

    sync(engine: GameEngine) {
        if (!globalApp || !globalApp.renderer) return;
        globalApp.stage.scale.set(engine.worldScale);
        globalApp.stage.x = (CANVAS_WIDTH * (1 - engine.worldScale)) / 2;
        globalApp.stage.y = (CANVAS_HEIGHT * (1 - engine.worldScale)) / 2;
        const activeEntities = new Set<Entity>();
        engine.backgroundEntities.forEach(e => activeEntities.add(e));
        engine.enemies.forEach(e => activeEntities.add(e));
        if (engine.boss) activeEntities.add(engine.boss);
        engine.bullets.forEach(e => activeEntities.add(e));
        engine.players.forEach(e => activeEntities.add(e));
        engine.powerups.forEach(e => activeEntities.add(e));
        engine.particles.forEach(e => activeEntities.add(e));
        engine.explosions.forEach(e => activeEntities.add(e as any));

        for (const [entity, container] of this.entityMap.entries()) {
            if (!activeEntities.has(entity) || entity.isDead) {
                container.destroy({ children: true });
                this.entityMap.delete(entity);
            }
        }
        this.syncGroup(engine.backgroundEntities, this.bgLayer, 'bg');
        const enemyList: Entity[] = [...engine.enemies];
        if (engine.boss) enemyList.push(engine.boss);
        this.syncGroup(enemyList, this.enemyLayer, 'enemy');
        this.syncGroup(engine.bullets, this.bulletLayer, 'bullet');
        this.syncGroup(Array.from(engine.players.values()), this.playerLayer, 'player');
        this.syncGroup(engine.powerups, this.enemyLayer, 'powerup');
        this.syncGroup(engine.particles, this.particleLayer, 'particle');
        this.syncGroup(engine.explosions as any, this.explosionLayer, 'explosion');
        if (engine.screenShake > 0) {
            globalApp.stage.x += (Math.random() - 0.5) * engine.screenShake;
            globalApp.stage.y += (Math.random() - 0.5) * engine.screenShake;
        }
    }

    private syncGroup(entities: Entity[], layer: PIXI.Container, type: string) {
        entities.forEach(entity => {
            if (entity.isDead) return;
            let container = this.entityMap.get(entity);
            if (!container) {
                container = this.createView(entity, type);
                this.entityMap.set(entity, container);
                layer.addChild(container);
            }
            
            if (entity instanceof Player) {
                const p = entity as Player;
                container.x = p.position.x;
                container.y = p.position.y;
                container.rotation = p.tilt;
                container.scale.set(1.1 + p.tier * 0.1);
                if (p.state === PlayerState.RESPAWNING) {
                    container.alpha = 0.5 + Math.sin(Date.now() / 50) * 0.3;
                } else {
                    container.alpha = (p.invulnerableTime > 0 && Math.floor(Date.now() / 80) % 2 === 0) ? 0.3 : 1;
                }
                const shipGfx = container.getChildByName('ship') as PIXI.Graphics;
                if (shipGfx) this.drawPlayerGraphics(shipGfx, p);
            } 
            else if (entity instanceof Enemy || entity instanceof Boss) {
                const e = entity as Enemy;
                const cfg = ENEMY_VISUAL_CONFIG[e.type];
                const isFlashing = e.flashFrame > 0;
                const isHint = e.state === EnemyState.ENTRY;
                
                // Animation sinh học: Bobbing & Squash/Stretch
                const bobY = Math.sin(e.stateTimer * 4) * 3;
                const squash = 1 + Math.sin(e.stateTimer * 8) * 0.02;
                const stretch = 1 - Math.sin(e.stateTimer * 8) * 0.01;

                container.x = e.position.x;
                container.y = e.position.y + bobY;
                const baseScale = entity instanceof Boss ? 6 : 1.15;
                container.scale.set(stretch * baseScale, squash * baseScale);
                container.alpha = e.opacity;

                // Cánh đập lệch pha
                const flap = Math.sin(e.wingFlap);
                const combWobble = Math.sin(e.stateTimer * 6) * 0.15;

                const leftWing = container.getChildByName('leftWing') as PIXI.Container;
                const rightWing = container.getChildByName('rightWing') as PIXI.Container;
                const comb = container.getChildByName('comb') as PIXI.Graphics;
                const body = container.getChildByName('body') as PIXI.Graphics;

                if (leftWing) {
                    leftWing.getChildByName('primary')!.rotation = -(flap * 1.1);
                    leftWing.getChildByName('secondary')!.rotation = -(flap * 0.7);
                    leftWing.getChildByName('coverts')!.rotation = -(flap * 0.4);
                }
                if (rightWing) {
                    rightWing.getChildByName('primary')!.rotation = (flap * 1.1);
                    rightWing.getChildByName('secondary')!.rotation = (flap * 0.7);
                    rightWing.getChildByName('coverts')!.rotation = (flap * 0.4);
                }
                if (comb) {
                    comb.rotation = combWobble;
                    comb.visible = !isHint;
                }
                if (body) {
                    const baseColor = isHint ? 0x94a3b8 : PIXI.Color.shared.setValue(cfg.bodyColor).toNumber();
                    body.tint = isFlashing ? 0xffffff : baseColor;
                }
                
                const hpBar = container.getChildByName('hpBar') as PIXI.Container;
                if (hpBar) {
                    hpBar.visible = !isHint && e.hp < e.maxHp;
                    const fill = hpBar.getChildByName('fill') as PIXI.Graphics;
                    if (fill) {
                        const ratio = Math.max(0, e.hp / e.maxHp);
                        fill.scale.x = ratio;
                        fill.tint = ratio < 0.3 ? 0xef4444 : (ratio < 0.6 ? 0xf59e0b : 0x22c55e);
                    }
                }
            } else {
                container.x = entity.position.x;
                container.y = entity.position.y;
                if (entity instanceof Particle) { container.alpha = (entity as any).life; }
                else if (entity instanceof Explosion) {
                    const graphics = container.children[0] as PIXI.Graphics;
                    const alpha = (entity as any).life / (entity as any).maxLife;
                    const color = (entity as any).isBurning ? 0xf97316 : 0xffaa00;
                    graphics.clear().circle(0, 0, (entity as any).radius).fill({ color, alpha });
                }
            }
        });
    }

    private drawPlayerGraphics(g: PIXI.Graphics, p: Player) {
        const tier = p.tier;
        const flash = p.flashFrame > 0;
        const color = flash ? 0xffffff : PIXI.Color.shared.setValue(p.primaryColor).toNumber();
        g.clear();
        g.circle(-12, 32, 7).circle(12, 32, 7).fill(0xf97316);
        g.roundRect(-40, 0, 80, 26, 8).fill(color).stroke({ width: 3, color: 0x000000 });
        g.ellipse(0, -6, 26, 38).fill(color).stroke({ width: 4, color: 0x020617 });
        g.ellipse(0, -20, 14, 18).fill(0xCBD5E1).stroke({ width: 2, color: 0x020617 });
        g.circle(0, 5, 6 + p.weaponLevel * 0.5).fill(p.glowColor).stroke({ width: 2, color: 0xffffff });
    }

    private createView(entity: Entity, type: string): PIXI.Container {
        const container = new PIXI.Container();
        if (type === 'player') {
            const upgrade = new PIXI.Graphics(); upgrade.name = 'upgradeFx'; upgrade.alpha = 0; container.addChild(upgrade);
            const g = new PIXI.Graphics(); g.name = 'ship'; container.addChild(g);
        } 
        else if (type === 'enemy' || type === 'boss') {
            // Wings
            const leftWing = this.createThreeLayerPixiWing('left');
            const rightWing = this.createThreeLayerPixiWing('right');
            leftWing.name = 'leftWing'; rightWing.name = 'rightWing';
            leftWing.position.set(-10, 0); rightWing.position.set(10, 0);
            container.addChild(leftWing, rightWing);

            // Teardrop Body (Non-circle)
            const body = new PIXI.Graphics(); body.name = 'body'; 
            // Head
            body.ellipse(0, -28, 15, 13).fill(0xffffff); 
            // Neck to Belly Path
            body.moveTo(-13, -18)
                .quadraticCurveTo(-28, -2, -26, 18)
                .quadraticCurveTo(-22, 38, 0, 40)
                .quadraticCurveTo(22, 38, 26, 18)
                .quadraticCurveTo(28, -2, 13, -18)
                .closePath()
                .fill(0xffffff)
                .stroke({ width: 4, color: 0x020617 });
            container.addChild(body);

            // Advanced Comb (Mào gà)
            const comb = new PIXI.Graphics(); comb.name = 'comb';
            comb.y = -32;
            comb.moveTo(-12, 0)
                .quadraticCurveTo(-10, -22, -4, -14)
                .quadraticCurveTo(0, -30, 6, -18)
                .quadraticCurveTo(14, -28, 18, -10)
                .quadraticCurveTo(12, 0, 0, 2)
                .closePath()
                .fill(0xef4444).stroke({ width: 3, color: 0x020617 });
            container.addChild(comb);

            // Face (Eyes, Beak)
            const face = new PIXI.Graphics();
            face.circle(-14, -6, 12).circle(14, -6, 12).fill(0xffffff).stroke({ width: 3, color: 0x020617 });
            face.circle(-12, -4, 5).circle(12, -4, 5).fill(0x020617);
            face.moveTo(-10, 8).quadraticCurveTo(0, 22, 10, 8).quadraticCurveTo(0, 4, -10, 8).fill(0xfacc15).stroke({ width: 2, color: 0x020617 });
            container.addChild(face);

            // HP Bar
            const hpBar = new PIXI.Container(); hpBar.name = 'hpBar'; hpBar.y = -65;
            const bg = new PIXI.Graphics(); bg.roundRect(-35, 0, 70, 8, 4).fill(0x020617);
            const fill = new PIXI.Graphics(); fill.name = 'fill'; fill.roundRect(-35, 0, 70, 8, 4).fill(0x22c55e);
            hpBar.addChild(bg, fill); hpBar.visible = false;
            container.addChild(hpBar);
        }
        else if (type === 'bullet') {
            const g = new PIXI.Graphics();
            const b = entity as Projectile;
            if (b.type === WeaponType.BLASTER) {
                g.ellipse(0, 0, b.radius, b.radius * 1.4).fill(0xfefce8).stroke({width: 2.5, color: 0x020617});
                const core = new PIXI.Graphics(); core.name = 'core'; core.ellipse(0, 0, b.radius * 0.45, b.radius * 0.7).fill(0x22d3ee);
                container.addChild(g, core);
            } else if (b.type === WeaponType.LASER) {
                const w = (b as PhotonLaser).currentBeamWidth;
                g.roundRect(-w/2, 0, w, 180, 6).fill(0xffffff).stroke({ width: 1, color: 0x22c55e });
                container.addChild(g);
            } else {
                g.circle(0, 0, b.radius).fill(b.color); container.addChild(g);
            }
        }
        else if (type === 'bg') {
            const g = new PIXI.Graphics(); g.circle(0, 0, entity.radius).fill(0xffffff); container.alpha = 0.2; container.addChild(g);
        }
        return container;
    }

    private createThreeLayerPixiWing(side: 'left' | 'right'): PIXI.Container {
        const dir = side === 'left' ? -1 : 1;
        const wing = new PIXI.Container();
        
        // Layer 1: Primary feathers (Tầng dài nhất)
        const primary = new PIXI.Graphics(); primary.name = 'primary';
        primary.moveTo(dir * 4, 0)
            .quadraticCurveTo(dir * 40, 10, dir * 55, 26)
            .quadraticCurveTo(dir * 35, 30, dir * 14, 20)
            .closePath()
            .fill(0xffffff).stroke({ width: 3, color: 0x020617 });
            
        // Layer 2: Secondary feathers (Tầng giữa)
        const secondary = new PIXI.Graphics(); secondary.name = 'secondary';
        secondary.moveTo(dir * 6, 4)
            .quadraticCurveTo(dir * 30, 16, dir * 38, 30)
            .quadraticCurveTo(dir * 24, 26, dir * 12, 18)
            .closePath()
            .fill(0xf1f5f9).stroke({ width: 2.5, color: 0x020617 });
            
        // Layer 3: Coverts (Gốc cánh)
        const coverts = new PIXI.Graphics(); coverts.name = 'coverts';
        coverts.ellipse(dir * 8, 6, 14, 10).fill(0xf8fafc).stroke({ width: 2, color: 0x020617 });

        wing.addChild(primary, secondary, coverts);
        return wing;
    }
}
