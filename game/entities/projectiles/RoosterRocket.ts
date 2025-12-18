
import { Projectile } from './Projectile';
import { Vector2, WeaponType } from '../../../types';
import { GameEngine } from '../../GameEngine';
import { Enemy } from '../Chicken';
import { CANVAS_HEIGHT } from '../../../constants';

export class RoosterRocket extends Projectile {
    private target: Enemy | null = null;
    private angle: number;
    private speed: number;
    private turnSpeed: number = 2.8;
    private phase: 'SWERVE' | 'HOMING' | 'BOOST' = 'SWERVE';
    private targetScanTimer: number = 0;
    private maxLife: number = 1.5; 
    
    private trail: Vector2[] = [];
    private maxTrailLength: number = 30; 

    constructor(pos: Vector2, vel: Vector2, damage: number, color: string, ownerId: string) {
        super(pos, vel, 16, color, damage, ownerId, WeaponType.ROCKET);
        this.angle = Math.atan2(vel.y, vel.x);
        this.speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
        this.targetScanTimer = Math.random() * 0.1;
    }

    private findTarget(engine: GameEngine) {
        if (engine.boss && !engine.boss.isDead) return engine.boss;
        
        let nearest: Enemy | null = null;
        let minDist = 1200;
        
        for (const e of engine.enemies) {
            if (e.isDead || e.position.y < -50 || e.position.y > CANVAS_HEIGHT) continue;
            const d = Math.hypot(e.position.x - this.position.x, e.position.y - this.position.y);
            if (d < minDist) {
                minDist = d;
                nearest = e;
            }
        }
        return nearest;
    }

    private lerpAngle(a: number, b: number, t: number) {
        const delta = ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        return a + delta * t;
    }

    updateWithEngine(dt: number, engine: GameEngine) {
        this.age += dt;
        this.targetScanTimer -= dt;

        if (this.age > this.maxLife) {
            this.onImpact(engine, this.position);
            return;
        }

        this.trail.unshift({ ...this.position });
        if (this.trail.length > this.maxTrailLength) this.trail.pop();

        if (this.age < 0.25) { 
            this.phase = 'SWERVE';
        } else {
            if (this.targetScanTimer <= 0 || !this.target || this.target.isDead) {
                this.target = this.findTarget(engine);
                this.targetScanTimer = 0.15;
            }
            
            if (this.target) {
                const dist = Math.hypot(this.target.position.x - this.position.x, this.target.position.y - this.position.y);
                this.phase = dist < 250 ? 'BOOST' : 'HOMING';
            } else {
                this.phase = 'HOMING';
            }
        }

        if (this.phase === 'SWERVE') {
            this.angle += Math.sin(this.age * 20) * 0.1;
        } 
        else if (this.phase === 'HOMING' && this.target) {
            const targetAngle = Math.atan2(this.target.position.y - this.position.y, this.target.position.x - this.position.x);
            this.angle = this.lerpAngle(this.angle, targetAngle, this.turnSpeed * dt);
        }
        else if (this.phase === 'BOOST' && this.target) {
            const targetAngle = Math.atan2(this.target.position.y - this.position.y, this.target.position.x - this.position.x);
            this.angle = this.lerpAngle(this.angle, targetAngle, 12 * dt);
            this.speed = Math.min(this.speed * (1 + dt * 3.0), 1900);
        }

        this.velocity.x = Math.cos(this.angle) * this.speed;
        this.velocity.y = Math.sin(this.angle) * this.speed;

        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;

        if (Math.random() < 0.3) {
            const spawnColor = this.phase === 'BOOST' ? '#fde047' : '#f97316';
            engine.spawnParticles(this.position, spawnColor, 1, 1.2);
        }
    }

    update(dt: number) {}

    draw(ctx: CanvasRenderingContext2D) {
        this.drawRibbonTrail(ctx);

        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle + Math.PI / 2);

        const w = this.radius * 1.15;
        const h = this.radius * 2.8;

        this.drawJetFire(ctx, w, h);
        
        // --- VẼ CÁNH DƯỚI (Nằm dưới thân) ---
        this.drawSingleFin(ctx, 0, h/2 - 4, 12, 18, 'bottom');

        // --- VẼ CÁNH TRÁI & PHẢI ---
        this.drawSingleFin(ctx, -w/2, h/2 - 8, 22, 20, 'left');
        this.drawSingleFin(ctx, w/2, h/2 - 8, 22, 20, 'right');

        // --- THÂN TÊN LỬA ---
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, 6);
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // Mũi tên lửa
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(-w / 2, -h / 2 + 5);
        ctx.lineTo(0, -h / 2 - 22);
        ctx.lineTo(w / 2, -h / 2 + 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // --- VẼ CÁNH TRÊN (Nằm trên thân) ---
        this.drawSingleFin(ctx, 0, h/2 - 12, 10, 24, 'top');

        // Chi tiết cơ khí trên thân
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1.02;
        ctx.beginPath(); ctx.moveTo(-w/2, 0); ctx.lineTo(w/2, 0); ctx.stroke();
        
        ctx.restore();
    }

    /**
     * Vẽ một cánh đơn (Fin) hình tam giác cụt
     * @param ctx Context
     * @param x Gốc tọa độ X
     * @param y Gốc tọa độ Y
     * @param width Chiều rộng cánh
     * @param height Chiều dài cánh (vươn ra ngoài)
     * @param pos Vị trí: 'left', 'right', 'top', 'bottom'
     */
    private drawSingleFin(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, pos: string) {
        ctx.save();
        ctx.translate(x, y);
        
        const slant = 12; // Độ nghiêng ra sau
        ctx.fillStyle = (pos === 'top' || pos === 'bottom') ? '#64748b' : '#475569';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        if (pos === 'left') {
            ctx.moveTo(0, 0);
            ctx.lineTo(-height, slant);     // Cạnh trên nghiêng
            ctx.lineTo(-height, slant + 10); // Cạnh cụt
            ctx.lineTo(0, 8);               // Gốc dưới
        } else if (pos === 'right') {
            ctx.moveTo(0, 0);
            ctx.lineTo(height, slant);
            ctx.lineTo(height, slant + 10);
            ctx.lineTo(0, 8);
        } else if (pos === 'top') {
            // Cánh dọc (vây lưng) - vẽ như một hình chữ nhật hẹp nghiêng perspective
            ctx.fillStyle = '#94a3b8';
            ctx.moveTo(-2, 0);
            ctx.lineTo(-1, -height);
            ctx.lineTo(1, -height);
            ctx.lineTo(2, 0);
        } else if (pos === 'bottom') {
            // Cánh bụng - khuất một phần
            ctx.fillStyle = '#334155';
            ctx.moveTo(-2, 0);
            ctx.lineTo(-3, height);
            ctx.lineTo(3, height);
            ctx.lineTo(2, 0);
        }
        
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Thêm một chút highlight cho cánh trên
        if (pos === 'top') {
            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -height + 2); ctx.stroke();
        }

        ctx.restore();
    }

    private drawRibbonTrail(ctx: CanvasRenderingContext2D) {
        if (this.trail.length < 2) return;
        ctx.save();
        const baseColor = this.phase === 'BOOST' ? '#fde047' : '#f97316';
        
        for (let i = 0; i < this.trail.length - 1; i++) {
            const ratio = 1 - (i / this.trail.length);
            ctx.beginPath();
            ctx.strokeStyle = baseColor;
            ctx.globalAlpha = ratio * 0.5;
            ctx.lineWidth = this.radius * 0.9 * ratio;
            ctx.lineCap = 'round';
            ctx.moveTo(this.trail[i].x, this.trail[i].y);
            ctx.lineTo(this.trail[i + 1].x, this.trail[i + 1].y);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.strokeStyle = '#ffffff';
            ctx.globalAlpha = ratio * 0.3;
            ctx.lineWidth = ctx.lineWidth * 0.3;
            ctx.moveTo(this.trail[i].x, this.trail[i].y);
            ctx.lineTo(this.trail[i + 1].x, this.trail[i + 1].y);
            ctx.stroke();
        }
        ctx.restore();
    }

    private drawJetFire(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const isBoost = this.phase === 'BOOST';
        const fireLen = (isBoost ? 45 : 22) + Math.random() * 18;
        const fireWidth = w * (isBoost ? 1.1 : 0.75);
        ctx.fillStyle = isBoost ? '#fde047' : '#f97316';
        ctx.beginPath();
        ctx.moveTo(-fireWidth/2, h/2);
        ctx.lineTo(0, h/2 + fireLen);
        ctx.lineTo(fireWidth/2, h/2);
        ctx.fill();
    }

    onImpact(engine: GameEngine, impactPos: Vector2) {
        this.isDead = true;
        engine.createRocketExplosion(impactPos, this.damage);
    }
}
