
import { Vector2 } from '../../types';

export const drawOutline = (ctx: CanvasRenderingContext2D, width: number = 2.5, color: string = '#020617') => {
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.stroke();
}

export abstract class Entity {
  position: Vector2;
  velocity: Vector2;
  radius: number;
  isDead: boolean = false;
  color: string;
  flashFrame: number = 0;

  constructor(pos: Vector2, vel: Vector2, radius: number, color: string) {
    this.position = pos;
    this.velocity = vel;
    this.radius = radius;
    this.color = color;
  }

  update(dt: number) {
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    if (this.flashFrame > 0) this.flashFrame--;
  }

  abstract draw(ctx: CanvasRenderingContext2D): void;

  hit() {
    this.flashFrame = 3;
  }
}

export class FloatingText {
    position: Vector2;
    text: string;
    color: string;
    life: number = 1.0;
    fontSize: number;
    isDead: boolean = false;

    constructor(x: number, y: number, text: string, color: string, fontSize: number = 24) {
        this.position = { x, y };
        this.text = text;
        this.color = color;
        this.fontSize = fontSize;
    }

    update(dt: number) {
        this.life -= dt * 1.5;
        this.position.y -= 60 * dt;
        if (this.life <= 0) this.isDead = true;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.font = `black ${this.fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.position.x, this.position.y);
        ctx.restore();
    }
}
