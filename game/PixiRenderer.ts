import * as PIXI from 'pixi.js';
import { GameEngine } from './GameEngine';
import { Entity, Player, Bullet, Enemy, Boss, PowerUp, Particle, Explosion } from './Entities';
import { ENEMY_VISUAL_CONFIG } from './entities/Chicken';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
import { PowerUpType } from '../types';

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

    private constructor() {}

    public static getInstance(): PixiRenderer {
        if (!PixiRenderer._instance) {
            PixiRenderer._instance = new PixiRenderer();
        }
        return PixiRenderer._instance;
    }

    public get app(): PIXI.Application | null {
        return globalApp;
    }

    async init() {
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

                app.stage.addChild(this.bgLayer);
                app.stage.addChild(this.particleLayer);
                app.stage.addChild(this.enemyLayer);
                app.stage.addChild(this.bulletLayer);
                app.stage.addChild(this.playerLayer);
                app.stage.addChild(this.explosionLayer);
            } catch (err) {
                console.error("PixiJS Init Failed:", err);
                globalInitPromise = null; 
                throw err;
            }
        })();

        return globalInitPromise;
    }

    reset() {
        for (const container of this.entityMap.values()) {
            container.destroy({ children: true });
        }
        this.entityMap.clear();

        [this.bgLayer, this.particleLayer, this.enemyLayer, this.bulletLayer, this.playerLayer, this.explosionLayer].forEach(layer => {
            if (layer) {
                while(layer.children.length > 0) {
                    const child = layer.children[0];
                    child.destroy({ children: true });
                }
            }
        });
    }

    sync(engine: GameEngine) {
        if (!globalApp || !globalApp.renderer) return;

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
            globalApp.stage.x = (Math.random() - 0.5) * engine.screenShake;
            globalApp.stage.y = (Math.random() - 0.5) * engine.screenShake;
        } else {
            globalApp.stage.x = 0;
            globalApp.stage.y = 0;
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
            
            container.x = entity.position.x;
            container.y = entity.position.y;
            
            if (entity instanceof Player) {
                const p = entity as Player;
                const tierScale = 1.1 + p.tier * 0.1;

                container.rotation = p.tilt;
                container.scale.set(tierScale);
                container.alpha = (p.invulnerableTime > 0 && Math.floor(Date.now() / 60) % 2 === 0) ? 0.4 : 1;

                const shipGfx = container.getChildByName('ship') as PIXI.Graphics;
                if (shipGfx) {
                    this.drawPlayerGraphics(shipGfx, p);
                }

                const fx = container.getChildByName('upgradeFx') as PIXI.Graphics;
                if (fx) {
                    if (p.flashFrame === 3) { 
                        fx.clear();
                        fx.circle(0, 0, 80)
                          .stroke({ width: 4, color: 0xffffff, alpha: 0.9 });
                        fx.alpha = 1;
                        fx.scale.set(0.3);
                    }
                    if (fx.alpha > 0) {
                        fx.alpha *= 0.92;
                        fx.scale.x += 0.08;
                        fx.scale.y += 0.08;
                    }
                }
            } 
            else if (entity instanceof Bullet) {
                container.rotation = Math.atan2(entity.velocity.y, entity.velocity.x) + Math.PI/2;
            } 
            else if (entity instanceof Enemy || entity instanceof Boss) {
                const cfg = ENEMY_VISUAL_CONFIG[entity.type];
                const isFlashing = entity.flashFrame > 0;
                
                const wings = container.getChildByName('wings') as PIXI.Container;
                if (wings) {
                    const flap = Math.sin(entity.wingFlap) * 0.9;
                    const left = wings.getChildByName('left') as PIXI.Graphics;
                    const right = wings.getChildByName('right') as PIXI.Graphics;
                    left.rotation = -(0.6 + flap);
                    right.rotation = (0.6 + flap);
                    left.tint = isFlashing ? 0xffffff : PIXI.Color.shared.setValue(cfg.wingColor).toNumber();
                    right.tint = isFlashing ? 0xffffff : PIXI.Color.shared.setValue(cfg.wingColor).toNumber();
                }

                const body = container.getChildByName('body') as PIXI.Graphics;
                if (body) {
                    body.tint = isFlashing ? 0xffffff : PIXI.Color.shared.setValue(cfg.bodyColor).toNumber();
                }
                
                const eyes = container.getChildByName('eyes') as PIXI.Container;
                if (eyes) {
                    const glow = cfg.eyeGlow && Math.sin(Date.now() / 120) > 0.6;
                    const lp = eyes.getChildByName('left_pupil') as PIXI.Graphics;
                    const rp = eyes.getChildByName('right_pupil') as PIXI.Graphics;
                    lp.tint = glow ? 0xef4444 : 0x020617;
                    rp.tint = glow ? 0xef4444 : 0x020617;
                }

                const armor = container.getChildByName('armor');
                if (armor) armor.visible = cfg.armor;

                if (entity instanceof Boss) {
                    const shield = container.getChildByName('shield');
                    if (shield) {
                        shield.visible = !entity.isVulnerable;
                        shield.alpha = 0.1 + Math.sin(entity.stateTimer * 5) * 0.05;
                    }
                }
            } 
            else if (entity instanceof Particle) {
                container.alpha = (entity as any).life;
            } 
            else if (entity instanceof Explosion) {
                const graphics = container.children[0] as PIXI.Graphics;
                const radius = (entity as any).radius;
                const life = (entity as any).life;
                graphics.clear().circle(0, 0, radius).fill({ color: 0xffaa00, alpha: life });
            }
        });
    }

    private drawPlayerGraphics(g: PIXI.Graphics, p: Player) {
        const tier = p.tier;
        const flash = p.flashFrame > 0;
        const color = flash ? 0xffffff : PIXI.Color.shared.setValue(p.primaryColor).toNumber();

        g.clear();

        // 1. ENGINE EFFECTS
        g.circle(-12, 32, 7).circle(12, 32, 7).fill(0xf97316);
        if (tier >= 5) {
            g.circle(-45, 20, 10).circle(45, 20, 10).fill(0xfbbf24);
        }

        // 2. EXTRA STRUCTURES (Tier 4-5)
        if (tier >= 4) {
            g.roundRect(-60, 5, 120, 15, 10).fill(color).stroke({ width: 3, color: 0x000000 });
        }

        // 3. MAIN WINGS
        g.roundRect(-40, 0, 80, 26, 8).fill(color).stroke({ width: 3, color: 0x000000 });

        // 4. MAIN BODY
        g.ellipse(0, -6, 26, 38).fill(color).stroke({ width: 4, color: 0x020617 });

        // 5. BOOSTER PODS (Tier 5)
        if (tier >= 5) {
            g.roundRect(-55, -5, 20, 40, 10).fill(color).stroke({ width: 3, color: 0x000000 });
        }

        // 6. COCKPIT
        g.ellipse(0, -20, 14, 18).fill(0xCBD5E1).stroke({ width: 2, color: 0x020617 });

        // 7. WEAPON BARRELS
        const gunColor = 0x1e293b;
        if (tier >= 2) {
            g.rect(-45, 10, 10, 15).rect(35, 10, 10, 15).fill(gunColor).stroke({ width: 1.5, color: 0x000000 });
        }
        if (tier >= 3) {
            g.rect(-6, -42, 4, 10).rect(2, -42, 4, 10).fill(gunColor);
        }
        if (tier >= 5) {
            g.rect(-62, 15, 12, 18).rect(50, 15, 12, 18).fill(gunColor).stroke({ width: 2, color: 0x000000 });
        }

        // 8. CORE
        const coreSize = 6 + p.weaponLevel * 0.5;
        g.circle(0, 5, coreSize).fill(p.glowColor).stroke({ width: 2, color: 0xffffff });
    }

    private createView(entity: Entity, type: string): PIXI.Container {
        const container = new PIXI.Container();

        if (type === 'player') {
            const upgrade = new PIXI.Graphics();
            upgrade.name = 'upgradeFx';
            upgrade.alpha = 0;
            container.addChild(upgrade);

            const g = new PIXI.Graphics();
            g.name = 'ship';
            this.drawPlayerGraphics(g, entity as Player);
            container.addChild(g);
        } 
        else if (type === 'enemy' || type === 'boss') {
            const scale = entity instanceof Boss ? 6 : 1.15;
            
            const armor = new PIXI.Graphics();
            armor.name = 'armor';
            armor.circle(0, 6, 42).stroke({width: 3, color: 0x22d3ee, alpha: 0.6});
            armor.visible = false;
            container.addChild(armor);

            const wings = new PIXI.Container();
            wings.name = 'wings';
            const leftWing = new PIXI.Graphics();
            leftWing.name = 'left';
            leftWing.ellipse(0, 0, 22, 14).fill(0xffffff).stroke({ width: 3, color: 0x000000 });
            leftWing.position.set(-36, 10);
            
            const rightWing = new PIXI.Graphics();
            rightWing.name = 'right';
            rightWing.ellipse(0, 0, 22, 14).fill(0xffffff).stroke({ width: 3, color: 0x000000 });
            rightWing.position.set(36, 10);
            
            wings.addChild(leftWing, rightWing);
            container.addChild(wings);

            const body = new PIXI.Graphics();
            body.name = 'body';
            body.ellipse(0, 6, 34, 38).fill(0xffffff).stroke({ width: 4, color: 0x020617 });
            container.addChild(body);

            const comb = new PIXI.Graphics();
            comb.circle(-10, -34, 7).circle(0, -36, 8).circle(10, -38, 9).fill(0xef4444).stroke({width: 2, color: 0x000000});
            container.addChild(comb);

            const eyes = new PIXI.Container();
            eyes.name = 'eyes';
            const lEye = new PIXI.Graphics().circle(-14, -6, 12).fill(0xffffff).stroke({width: 3, color: 0x000000});
            const rEye = new PIXI.Graphics().circle(14, -6, 12).fill(0xffffff).stroke({width: 3, color: 0x000000});
            const lPupil = new PIXI.Graphics(); lPupil.name = 'left_pupil'; lPupil.circle(-12, -4, 5).fill(0x020617);
            const rPupil = new PIXI.Graphics(); rPupil.name = 'right_pupil'; rPupil.circle(12, -4, 5).fill(0x020617);
            eyes.addChild(lEye, rEye, lPupil, rPupil);
            container.addChild(eyes);

            const beak = new PIXI.Graphics();
            beak.roundRect(-10, 6, 20, 14, 6).fill(0xfacc15).stroke({width: 3, color: 0x000000});
            container.addChild(beak);

            const feet = new PIXI.Graphics();
            feet.roundRect(-16, 40, 10, 5, 3).roundRect(6, 40, 10, 5, 3).fill(0xfacc15).stroke({width: 2, color: 0x000000});
            container.addChild(feet);

            if (entity instanceof Boss) {
                const crown = new PIXI.Graphics();
                crown.poly([-14, -40, -20, -55, -8, -48, 0, -65, 8, -48, 20, -55, 14, -40]).fill(0xfbbf24).stroke({width: 1, color: 0x000000});
                container.addChild(crown);
                
                const shield = new PIXI.Graphics();
                shield.name = 'shield';
                shield.circle(0, 0, 50).fill({color: 0x22d3ee, alpha: 0.1}).stroke({width: 1, color: 0x22d3ee});
                shield.visible = false;
                container.addChildAt(shield, 0);
            }

            container.scale.set(scale);
        }
        else if (type === 'bullet') {
            const b = entity as Bullet;
            const g = new PIXI.Graphics();
            g.circle(0, 0, b.radius).fill(b.color);
            container.addChild(g);
        }
        else if (type === 'particle') {
            const g = new PIXI.Graphics();
            g.circle(0, 0, entity.radius).fill(entity.color);
            container.addChild(g);
        }
        else if (type === 'bg') {
            const g = new PIXI.Graphics();
            g.circle(0, 0, entity.radius).fill(0xffffff);
            container.alpha = 0.2;
            container.addChild(g);
        }
        else if (type === 'powerup') {
            const pu = entity as PowerUp;
            const g = new PIXI.Graphics();
            g.rect(-20, -20, 40, 40).fill(pu.color).stroke({ width: 2, color: 0xffffff });
            container.addChild(g);
            const text = new PIXI.Text({
                text: pu.kind === PowerUpType.HEART ? 'H' : 'W',
                style: { fill: 0xffffff, fontSize: 24, fontWeight: 'bold', stroke: { color: 0x000000, width: 4 } }
            });
            text.anchor.set(0.5);
            container.addChild(text);
        }

        return container;
    }
}
