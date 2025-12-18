
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
