import { Projectile } from './Projectile';
import { Vector2, WeaponType } from '../../../types';
import { GameEngine } from '../../GameEngine';
import { Enemy } from '../Chicken';

export class RoosterRocket extends Projectile {
    private target: Enemy | null = null;
    private angle: number;
    private speed: number;
    private turnSpeed: number = 2.5; // Tốc độ lượn
    private phase: 'SWERVE' | 'HOMING' | 'BOOST' = 'SWERVE';

    constructor(pos: Vector2, vel: Vector2, damage: number, color: string, ownerId: string) {
        super(pos, vel, 16, color, damage, ownerId, WeaponType.ROCKET);
        this.angle = Math.atan2(vel.y, vel.x);
        this.speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
        
        // Tăng Turn Speed dựa trên Level nếu cần, mặc định 2.5 cho level thấp
    }

    private findTarget(engine: GameEngine) {
        if (engine.boss && !engine.boss.isDead) return engine.boss;
        
        let nearest: Enemy | null = null;
        let minDist = 1000;
        
        engine.enemies.forEach(e => {
            if (e.isDead || e.position.y < -50) return;
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

        // Phase transitions
        if (this.age < 0.35) {
            this.phase = 'SWERVE';
        } else {
            if (!this.target || this.target.isDead) {
                this.target = this.findTarget(engine);
            }
            
            if (this.target) {
                const dist = Math.hypot(this.target.position.x - this.position.x, this.target.position.y - this.position.y);
                this.phase = dist < 150 ? 'BOOST' : 'HOMING';
            } else {
                this.phase = 'HOMING';
            }
        }

        // Movement Logic
        if (this.phase === 'SWERVE') {
            this.angle += Math.sin(this.age * 15) * 0.05;
        } 
        else if (this.phase === 'HOMING' && this.target) {
            const targetAngle = Math.atan2(this.target.position.y - this.position.y, this.target.position.x - this.position.x);
            this.angle = this.lerpAngle(this.angle, targetAngle, this.turnSpeed * dt);
        }
        else if (this.phase === 'BOOST' && this.target) {
            const targetAngle = Math.atan2(this.target.position.y - this.position.y, this.target.position.x - this.position.x);
            this.angle = this.lerpAngle(this.angle, targetAngle, 8 * dt);
            this.speed = Math.min(this.speed * (1 + dt * 2), 1600);
        }

        this.velocity.x = Math.cos(this.angle) * this.speed;
        this.velocity.y = Math.sin(this.angle) * this.speed;

        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;

        // Sinh trail khói lửa
        if (Math.random() < 0.6) {
            engine.spawnParticles(this.position, this.phase === 'BOOST' ? '#fde047' : '#f97316', 1, 1.2);
            engine.spawnParticles(this.position, '#64748b', 1, 0.5);
        }
    }

    // Override update to do nothing, we use updateWithEngine
    update(dt: number) {}

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.angle + Math.PI / 2);

        const w = this.radius * 1.1;
        const h = this.radius * 2.8;

        // Vẽ thân tên lửa (Xám)
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, 6);
        ctx.fill();
        
        // Outline dày đặc trưng
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Vẽ đầu tên lửa (Đỏ)
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(-w / 2, -h / 2 + 5);
        ctx.lineTo(0, -h / 2 - 15);
        ctx.lineTo(w / 2, -h / 2 + 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Logo đầu gà nhỏ (Simplified)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(4, 2); ctx.lineTo(0, 4); ctx.fill();

        // Hiệu ứng lửa phụt
        const flameLen = 15 + Math.random() * 20;
        const grad = ctx.createLinearGradient(0, h/2, 0, h/2 + flameLen);
        grad.addColorStop(0, '#f97316');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(-w/3, h/2); ctx.lineTo(0, h/2 + flameLen); ctx.lineTo(w/3, h/2);
        ctx.fill();

        ctx.restore();
    }

    onImpact(engine: GameEngine, impactPos: Vector2) {
        this.isDead = true;
        // Tạo vụ nổ bạo lực với Burning Zone
        engine.createRocketExplosion(impactPos, this.damage);
    }
}