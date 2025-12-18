import { Entity } from '../BaseEntity';
import { Vector2 } from '../../../types';
import { Enemy } from '../Chicken';

export class Explosion extends Entity {
    maxRadius: number;
    life: number = 0.35;
    maxLife: number = 0.35;
    damage: number;
    isBurning: boolean = false;
    damagedEnemies: Set<Enemy> = new Set();

    constructor(pos: Vector2, radius: number, damage: number, color: string = '#f97316') {
        super(pos, {x:0, y:0}, 0, color);
        this.maxRadius = radius;
        this.damage = damage;
    }

    update(dt: number) {
        this.life -= dt;
        if (this.life <= 0) this.isDead = true;
        
        // Nếu không phải burning zone thì nổ to dần, nếu là burning thì giữ nguyên radius lớn
        if (!this.isBurning) {
            this.radius = (1 - (this.life / this.maxLife)) * this.maxRadius;
        } else {
            this.radius = this.maxRadius;
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(this.position.x, this.position.y, 0, this.position.x, this.position.y, this.radius);
        
        if (this.isBurning) {
            grad.addColorStop(0, `rgba(254, 224, 71, ${alpha * 0.8})`); // Lửa vàng
            grad.addColorStop(0.4, `rgba(249, 115, 22, ${alpha * 0.5})`); // Cam
            grad.addColorStop(1, 'transparent');
        } else {
            grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
            grad.addColorStop(0.2, `rgba(251, 191, 36, ${alpha})`);
            grad.addColorStop(0.5, `rgba(249, 115, 22, ${alpha * 0.7})`);
            grad.addColorStop(1, 'transparent');
        }
        
        ctx.fillStyle = grad;
        ctx.fill();
        
        // Thêm hạt lửa bốc lên nếu là burning zone
        if (this.isBurning && Math.random() < 0.3) {
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc((Math.random()-0.5)*this.radius*1.5, (Math.random()-0.5)*this.radius*1.5, 2, 0, Math.PI*2);
            ctx.fill();
        }

        ctx.restore();
    }
}