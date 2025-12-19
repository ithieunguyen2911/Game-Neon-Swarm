
import { Boss } from './Boss';
import { GameEngine } from '../../GameEngine';

export interface BossWeaponController {
  update(dt: number, boss: Boss, engine: GameEngine): void;
}
