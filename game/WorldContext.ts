
import { GameState, Vector2, MapPhase } from '../types';
import { Player, Enemy, Boss, Projectile, PowerUp, Particle, Explosion, BackgroundEntity, FloatingText } from './Entities';
import { SpaceObstacle } from './world/MapSystem';
import { Version1_1 } from './world/versions/Version1_1';

export class WorldContext {
  gameState: GameState = GameState.MENU;
  currentVersion = Version1_1;
  currentMapIndex: number = 0;
  mapPhase: MapPhase = MapPhase.NORMAL;
  waveCount: number = 0;
  
  players: Map<string, Player> = new Map();
  enemies: Enemy[] = [];
  boss: Boss | null = null;
  bullets: Projectile[] = [];
  powerups: PowerUp[] = [];
  obstacles: SpaceObstacle[] = [];
  
  // Pools
  enemyPool: Enemy[] = [];
  bulletPool: Map<string, Projectile[]> = new Map(); // Pool theo loại đạn

  particles: Particle[] = [];
  explosions: Explosion[] = [];
  backgroundEntities: BackgroundEntity[] = [];
  floatingTexts: FloatingText[] = [];

  score: number = 0;
  displayScore: number = 0;
  highScore: number = 0;
  
  // Hệ thống Combo
  combo: number = 0;
  comboTimer: number = 0;
  readonly COMBO_MAX_TIME = 2.5;

  phaseTimer: number = 0;
  screenShake: number = 0;
  worldScale: number = 1.0;

  constructor() {
    const saved = localStorage.getItem('neon_swarm_highscore');
    if (saved) this.highScore = parseInt(saved, 10);
  }

  reset() {
    this.score = 0;
    this.displayScore = 0;
    this.phaseTimer = 0;
    this.waveCount = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.mapPhase = MapPhase.NORMAL;
    
    // Thu hồi về pool
    this.enemies.forEach(e => { e.isDead = true; this.enemyPool.push(e); });
    this.enemies = [];
    
    this.bullets.forEach(b => { b.isDead = true; this.addBulletToPool(b); });
    this.bullets = [];

    this.particles = [];
    this.powerups = [];
    this.explosions = [];
    this.obstacles = [];
    this.floatingTexts = [];
    this.boss = null;
  }

  addBulletToPool(b: Projectile) {
    const key = b.constructor.name;
    if (!this.bulletPool.has(key)) this.bulletPool.set(key, []);
    this.bulletPool.get(key)!.push(b);
  }

  addScore(amount: number, pos: Vector2) {
      // Bonus theo combo
      const comboBonus = Math.floor(amount * (this.combo * 0.1));
      const total = amount + comboBonus;
      
      this.score += total;
      this.combo++;
      this.comboTimer = this.COMBO_MAX_TIME;

      if (this.score > this.highScore) {
          this.highScore = this.score;
          localStorage.setItem('neon_swarm_highscore', this.highScore.toString());
      }

      const color = this.combo > 10 ? "#facc15" : "#fff";
      this.floatingTexts.push(new FloatingText(pos.x, pos.y, `+${total}`, color, 24 + Math.min(this.combo, 20)));
  }

  updateCombo(dt: number) {
      if (this.comboTimer > 0) {
          this.comboTimer -= dt;
          if (this.comboTimer <= 0) {
              this.combo = 0;
          }
      }
  }
}
