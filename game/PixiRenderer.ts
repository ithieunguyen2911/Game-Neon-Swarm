import * as PIXI from 'pixi.js';
import { GameEngine } from './GameEngine';
import { Entity, Player, Bullet, Enemy, Boss, PowerUp, Particle, Explosion } from './Entities';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
import { PowerUpType } from '../types';

// Module-level singleton state to persist through HMR and React re-renders
let globalApp: PIXI.Application | null = null;
let globalInitPromise: Promise<void> | null = null;

export class PixiRenderer {
    private static _instance: PixiRenderer | null = null;
    private entityMap: Map<Entity, PIXI.Container> = new Map();
    
    // Layers
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

    /**
     * Đồng bộ hóa mạnh mẽ: Tự động xóa bất kỳ container nào không còn Entity tương ứng trong engine
     */
    sync(engine: GameEngine) {
        if (!globalApp || !globalApp.renderer) return;

        // Tập hợp tất cả thực thể đang hoạt động từ engine
        const activeEntities = new Set<Entity>();
        
        // Thu thập entities
        engine.backgroundEntities.forEach(e => activeEntities.add(e));
        engine.enemies.forEach(e => activeEntities.add(e));
        if (engine.boss) activeEntities.add(engine.boss);
        engine.bullets.forEach(e => activeEntities.add(e));
        engine.players.forEach(e => activeEntities.add(e));
        engine.powerups.forEach(e => activeEntities.add(e));
        engine.particles.forEach(e => activeEntities.add(e));
        engine.explosions.forEach(e => activeEntities.add(e as any));

        // 1. SWEEP: Xóa các container không còn nằm trong danh sách active hoặc đã chết
        for (const [entity, container] of this.entityMap.entries()) {
            if (!activeEntities.has(entity) || entity.isDead) {
                container.destroy({ children: true });
                this.entityMap.delete(entity);
            }
        }

        // 2. SYNC: Cập nhật hoặc tạo mới các container
        this.syncGroup(engine.backgroundEntities, this.bgLayer, 'bg');
        
        const enemyList: Entity[] = [...engine.enemies];
        if (engine.boss) enemyList.push(engine.boss);
        this.syncGroup(enemyList, this.enemyLayer, 'enemy');

        this.syncGroup(engine.bullets, this.bulletLayer, 'bullet');
        this.syncGroup(Array.from(engine.players.values()), this.playerLayer, 'player');
        this.syncGroup(engine.powerups, this.enemyLayer, 'powerup');
        this.syncGroup(engine.particles, this.particleLayer, 'particle');
        this.syncGroup(engine.explosions as any, this.explosionLayer, 'explosion');

        // Screen Shake
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
                container.rotation = entity.tilt;
                container.pivot.y = -(Math.sin(entity.idleTimer * 4) * 5);
                container.alpha = (entity.invulnerableTime > 0 && Math.floor(Date.now() / 50) % 2 === 0) ? 0.4 : 1;
                // Cập nhật lại màu sắc trong trường hợp đổi màu ở menu
                const graphics = container.children[0] as PIXI.Graphics;
                graphics.clear();
                this.drawPlayerGraphics(graphics, entity as Player);
            } else if (entity instanceof Bullet) {
                container.rotation = Math.atan2(entity.velocity.y, entity.velocity.x) + Math.PI/2;
            } else if (entity instanceof Enemy || entity instanceof Boss) {
                const graphics = container.children[0] as PIXI.Graphics;
                graphics.tint = entity.flashFrame > 0 ? 0xffffff : 0xffffff;
                if (entity.flashFrame > 0) graphics.alpha = 0.5; else graphics.alpha = 1;
            } else if (entity instanceof Particle) {
                container.alpha = (entity as any).life;
            } else if (entity instanceof Explosion) {
                const graphics = container.children[0] as PIXI.Graphics;
                const radius = (entity as any).radius;
                const life = (entity as any).life;
                graphics.clear().circle(0, 0, radius).fill({ color: 0xffaa00, alpha: life });
            }
        });
    }

    private drawPlayerGraphics(g: PIXI.Graphics, p: Player) {
        g.poly([0, -40, -30, 15, -12, 15, -10, 22, 10, 22, 12, 15, 30, 15]);
        g.fill(p.primaryColor);
        g.stroke({ width: 3, color: 0x000000 });
        g.poly([0, -30, -10, 5, 10, 5]);
        g.fill(0x334455);
        g.circle(0, 0, 10);
        g.fill(p.glowColor);
    }

    private createView(entity: Entity, type: string): PIXI.Container {
        const container = new PIXI.Container();
        const g = new PIXI.Graphics();
        container.addChild(g);

        if (type === 'player') {
            this.drawPlayerGraphics(g, entity as Player);
        } 
        else if (type === 'enemy' || type === 'boss') {
            const scale = entity instanceof Boss ? 5 : 1;
            g.ellipse(0, 0, 25, 28).fill(0xffffff).stroke({ width: 2, color: 0x000000 });
            g.circle(0, -28, 8).fill(0xef4444);
            g.circle(-8, -8, 6).fill(0x000000);
            g.circle(8, -8, 6).fill(0x000000);
            g.poly([-6, 8, 0, 18, 6, 8]).fill(0xffcc00);
            container.scale.set(scale);
        }
        else if (type === 'bullet') {
            const b = entity as Bullet;
            g.circle(0, 0, b.radius).fill(b.color);
        }
        else if (type === 'particle') {
            g.circle(0, 0, entity.radius).fill(entity.color);
        }
        else if (type === 'bg') {
            g.circle(0, 0, entity.radius).fill(0xffffff);
            container.alpha = 0.2;
        }
        else if (type === 'powerup') {
            const pu = entity as PowerUp;
            g.rect(-20, -20, 40, 40).fill(pu.color).stroke({ width: 2, color: 0xffffff });
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
