
import { Boss } from './Boss';

export interface BossRenderer {
  draw(ctx: CanvasRenderingContext2D, boss: Boss): void;
}
