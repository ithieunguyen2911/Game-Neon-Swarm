
import { Projectile } from './Projectile';
import { Vector2, WeaponType } from '../../../types';
import { GameEngine } from '../../GameEngine';
import { Enemy } from '../Chicken';

export class RoosterRocket extends Projectile {
    private target: Enemy | null = null;
    private angle: number;
    private speed: number;
    private turnSpeed: number = 2.8; // Tăng nhẹ tốc độ lượn để mượt hơn
    private phase: 'SWERVE' | 'HOMING' | 'BOOST' = 'SWERVE';
    
    // Hệ thống đuôi (Trail)
    private trail: Vector2[] = [];
    private maxTrailLength: number = 15; // Độ dài dải đuôi

    constructor(pos: Vector2, vel: Vector2, damage: number, color: string, ownerId: string) {
        super(pos, vel, 16, color, damage, ownerId, WeaponType.ROCKET);
        this.angle = Math.atan2(vel.y, vel.x);
        this.speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
    }

    private findTarget(engine: GameEngine) {
        if (engine.boss && !engine.boss.isDead) return engine.boss;
        
        let nearest: Enemy | null = null;
        let minDist = 1200;
        
        engine.enemies.forEach(e => {
            if (e.isDead || e.position.y < -100) return;
            const d = Math.hypot(e.position.x - this.position.x, e.position.y - this.position.y);
            if (d < minDist) {
                minDist = d;
                nearest = e;
            }
        });
        return nearest;
    }

    private lerpAngle(a: number, b: number, t: number) {
        const delta = ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        return a + delta * t;
    }

    updateWithEngine(dt: number, engine: GameEngine) {
        this.age += dt;

        // Lưu vị trí vào đuôi
        this.trail.unshift({ ...this.position });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.pop();
        }

        // Phase transitions
        if (this.age < 0.4) {
            this.phase = 'SWERVE';
        } else {
            if (!this.target || this.target.isDead) {
                this.target = this.findTarget(engine);
            }
            
            if (this.target) {
                const dist = Math.hypot(this.target.position.x - this.position.x, this.target.position.y - this.position.y);
                this.phase = dist < 200 ? 'BOOST' : 'HOMING';
            } else {
                this.phase = 'HOMING';
            }
        }

        // Movement Logic
        if (this.phase === 'SWERVE') {
            this.angle += Math.sin(this.age * 20) * 0.08;
        } 
        else if (this.phase === 'HOMING' && this.target) {
            const targetAngle = Math.atan2(this.target.position.y - this.position.y, this.target.position.x - this.position.x);
            this.angle = this.lerpAngle(this.angle, targetAngle, this.turnSpeed * dt);
        }
        else if (this.phase === 'BOOST' && this.target) {
            const targetAngle = Math.atan2(this.target.position.y - this.position.y, this.target.position.x - this.position.x);
            this.angle = this.lerpAngle(this.angle, targetAngle, 10 * dt);
            this.speed = Math.min(this.speed * (1 + dt * 2.5), 1800);
        }

        this.velocity.x = Math.cos(this.angle) * this.speed;
        this.velocity.y = Math.sin(this.angle) * this.speed;

        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;

        // Sinh hạt từ đuôi
        if (Math.random() < 0.8) {
            const spawnColor = this.phase === 'BOOST' ? '#fde047' : '#f97316';
            engine.spawnParticles(this.position, spawnColor, 1, 1.5);
            if (this.phase === 'BOOST') {
                engine.spawnParticles(this.position, '#ffffff', 1, 2.0);
            }
            if (Math.random() < 0.3) {
                engine.spawnParticles(this.position, '#475569', 1, 0.4); // Khói xám
            }
        }
    }

    update(dt: number) {}

    draw(ctx: CanvasRenderingContext2D) {
        // 1. Vẽ đuôi Ribbon Trail (Dải lụa mượt mà bám theo quỹ đạo)
        this.drawRibbonTrail(ctx);

        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle + Math.PI / 2);

        const w = this.radius * 1.15;
        const h = this.radius * 2.8;

        // 2. Hiệu ứng lửa phản lực đa tầng (Phun ra từ đít tên lửa)
        this.drawJetFire(ctx, w, h);

        // 3. Vẽ thân tên lửa
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, 6);
        ctx.fill();
        
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 4;
        ctx.stroke();

        // 4. Vẽ đầu tên lửa
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(-w / 2, -h / 2 + 5);
        ctx.lineTo(0, -h / 2 - 18);
        ctx.lineTo(w / 2, -h / 2 + 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 5. Cánh tên lửa nhỏ bên hông
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.moveTo(-w/2, 0); ctx.lineTo(-w/2 - 8, 12); ctx.lineTo(-w/2, 18); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(w/2, 0); ctx.lineTo(w/2 + 8, 12); ctx.lineTo(w/2, 18); ctx.fill();

        // 6. Điểm sáng trên kính tên lửa
        ctx.fillStyle = 'white';
        ctx.beginPath(); ctx.arc(0, -5, 4, 0, Math.PI * 2); ctx.fill();

        ctx.restore();
    }

    private drawRibbonTrail(ctx: CanvasRenderingContext2D) {
        if (this.trail.length < 2) return;

        ctx.save();
        const baseColor = this.phase === 'BOOST' ? '#fde047' : '#f97316';
        
        // Vẽ dải đuôi mờ dần
        for (let i = 0; i < this.trail.length - 1; i++) {
            const p1 = this.trail[i];
            const p2 = this.trail[i + 1];
            const alpha = (1 - i / this.trail.length) * 0.6;
            const width = this.radius * (1 - i / this.trail.length) * 1.2;

            ctx.beginPath();
            ctx.strokeStyle = baseColor;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            // Lõi trắng ở giữa dải đuôi
            ctx.beginPath();
            ctx.strokeStyle = '#ffffff';
            ctx.globalAlpha = alpha * 0.5;
            ctx.lineWidth = width * 0.3;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }
        ctx.restore();
    }

    private drawJetFire(ctx: CanvasRenderingContext2D, w: number, h: number) {
        const isBoost = this.phase === 'BOOST';
        const fireLen = (isBoost ? 45 : 25) + Math.random() * 20;
        const fireWidth = w * (isBoost ? 1.2 : 0.8);

        // Lớp lửa ngoài (Cam)
        const gradOuter = ctx.createLinearGradient(0, h/2, 0, h/2 + fireLen);
        gradOuter.addColorStop(0, '#f97316');
        gradOuter.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradOuter;
        ctx.beginPath();
        ctx.moveTo(-fireWidth/2, h/2);
        ctx.quadraticCurveTo(0, h/2 + fireLen * 1.2, fireWidth/2, h/2);
        ctx.fill();

        // Lớp lửa lõi (Vàng/Trắng)
        const gradInner = ctx.createLinearGradient(0, h/2, 0, h/2 + fireLen * 0.6);
        gradInner.addColorStop(0, '#ffffff');
        gradInner.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradInner;
        ctx.beginPath();
        ctx.moveTo(-fireWidth/4, h/2);
        ctx.quadraticCurveTo(0, h/2 + fireLen * 0.7, fireWidth/4, h/2);
        ctx.fill();
        
        // Hiệu ứng "Shock Diamonds" (Các vòng tròn nhiệt nhỏ nếu đang boost)
        if (isBoost) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            for (let i = 1; i <= 3; i++) {
                ctx.beginPath();
                ctx.arc(0, h/2 + i * 10, fireWidth/(2*i), 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }

    onImpact(engine: GameEngine, impactPos: Vector2) {
        this.isDead = true;
        engine.createRocketExplosion(impactPos, this.damage);
    }
}
