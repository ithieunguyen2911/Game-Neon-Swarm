
import { MapDefinition, MapOrientation, ZoneType } from '../../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../constants';

export class MapRenderer {
  private scrollOffset: number = 0;

  draw(ctx: CanvasRenderingContext2D, map: MapDefinition, dt: number) {
    this.scrollOffset += 150 * dt; // Tốc độ cuộn nền
    
    ctx.save();
    // 1. Vẽ Layer nền (Static)
    ctx.fillStyle = map.bgColor;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Vẽ Layer Parallax (Mây/Bụi/Lưới Cyber)
    this.drawParallaxLayer(ctx, map);

    // 3. Vẽ Ambient Effects đặc trưng
    this.drawAmbient(ctx, map);
    
    ctx.restore();
  }

  private drawParallaxLayer(ctx: CanvasRenderingContext2D, map: MapDefinition) {
    ctx.globalAlpha = 0.2;
    const spacing = 120;
    const offset = this.scrollOffset % spacing;

    if (map.ambientEffect === 'CYBER_STATIC') {
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 1;
      for (let x = 0; x < CANVAS_WIDTH; x += spacing) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
      }
      for (let y = offset; y < CANVAS_HEIGHT; y += spacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke();
      }
    } else if (map.ambientEffect === 'WIND') {
        ctx.fillStyle = '#ffffff';
        for(let i=0; i<30; i++) {
            const x = (Math.sin(i) * 0.5 + 0.5) * CANVAS_WIDTH;
            const y = (this.scrollOffset * (1 + (i % 5) * 0.2) + i * 200) % CANVAS_HEIGHT;
            ctx.fillRect(x, y, 2, 40);
        }
    }
  }

  private drawAmbient(ctx: CanvasRenderingContext2D, map: MapDefinition) {
    if (map.ambientEffect === 'ASH') {
      ctx.fillStyle = '#f97316';
      for(let i=0; i<20; i++) {
          ctx.globalAlpha = Math.random() * 0.4;
          const x = (Math.cos(Date.now()/1000 + i) * 0.5 + 0.5) * CANVAS_WIDTH;
          const y = (Date.now()/5 + i * 100) % CANVAS_HEIGHT;
          ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI*2); ctx.fill();
      }
    }
  }
}

export class SpaceObstacle {
  position: {x: number, y: number};
  hp: number;
  radius: number;
  isDead: boolean = false;
  type: 'ROCK' | 'MINE' | 'BARRIER';

  constructor(x: number, y: number, type: 'ROCK' | 'MINE' | 'BARRIER' = 'ROCK') {
    this.position = {x, y};
    this.type = type;
    this.hp = type === 'BARRIER' ? 150 : 40;
    this.radius = type === 'BARRIER' ? 80 : 45;
  }

  update(dt: number, speed: number, orientation: MapOrientation) {
    // Vật cản di chuyển ngược hướng bay
    if (orientation === MapOrientation.UP) this.position.y += speed * dt;
    else if (orientation === MapOrientation.RIGHT) this.position.x -= speed * dt;
    else if (orientation === MapOrientation.LEFT) this.position.x += speed * dt;
    else if (orientation === MapOrientation.DOWN) this.position.y -= speed * dt;

    if (this.position.y > CANVAS_HEIGHT + 200 || this.position.x < -200 || this.position.x > CANVAS_WIDTH + 200) {
        this.isDead = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    
    if (this.type === 'ROCK') {
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-40, -20); ctx.lineTo(0, -45); ctx.lineTo(40, -10);
      ctx.lineTo(30, 35); ctx.lineTo(-30, 35); ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else if (this.type === 'BARRIER') {
      ctx.fillStyle = '#450a0a';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 5;
      ctx.fillRect(-80, -20, 160, 40);
      ctx.strokeRect(-80, -20, 160, 40);
      // Hiệu ứng cảnh báo
      ctx.globalAlpha = 0.5 + Math.sin(Date.now()/100) * 0.3;
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-70, -10, 140, 20);
    }
    
    ctx.restore();
  }
}
