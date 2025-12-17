
import { Player, Bullet, Enemy, Particle, PowerUp, BackgroundEntity } from './Entities';
import { GameState, GameMode, InputState, Vector2, ZoneType, WeaponType, PowerUpType } from '../types';
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, MAX_WEAPON_LEVEL, ENEMY_SPAWN_RATE_INITIAL,
  ENEMY_BASE_SPEED, ENEMY_SIZE, ZONE_CONFIGS, WEAPON_CONFIGS
} from '../constants';
import { audio } from '../services/AudioSynthesizer';
import { WeaponSystem } from './WeaponSystem';

export class GameEngine {
  gameState: GameState = GameState.MENU;
  gameMode: GameMode = GameMode.OFFLINE_SOLO;
  score: number = 0;
  highScore: number = 0;
  level: number = 1;
  currentZone: ZoneType = ZoneType.SKY;
  
  players: Map<string, Player> = new Map();
  localPlayerIds: string[] = [];

  bullets: Bullet[] = [];
  enemies: Enemy[] = [];
  particles: Particle[] = [];
  powerups: PowerUp[] = [];
  backgroundEntities: BackgroundEntity[] = [];

  fireTimer: Map<string, number> = new Map();
  enemySpawnTimer: number = 0;
  levelTimer: number = 0;
  levelDuration: number = 45; 
  currentSpawnRate: number = ENEMY_SPAWN_RATE_INITIAL;
  screenShake: number = 0;

  constructor() {
    this.localPlayerIds = ['p1'];
    this.players.set('p1', new Player(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 'p1', COLORS.player));
    this.initEnvironment();
    const saved = localStorage.getItem('neon_swarm_highscore');
    if (saved) this.highScore = parseInt(saved, 10);
  }

  startGame(mode: GameMode = GameMode.OFFLINE_SOLO, zone: ZoneType = ZoneType.SKY, resetScore: boolean = true) {
    this.gameState = GameState.PLAYING;
    this.currentZone = zone;
    
    if (resetScore) {
      this.score = 0;
      this.level = 1;
      this.setupPlayers(mode);
    } else {
        const offset = CANVAS_WIDTH / (this.localPlayerIds.length + 1);
        this.localPlayerIds.forEach((id, index) => {
            const p = this.players.get(id);
            if (p) {
                if (p.isDead) { p.isDead = false; p.lives = 1; }
                p.position = { x: offset * (index + 1), y: CANVAS_HEIGHT - 100 };
                p.invulnerableTime = 2;
            }
        });
    }

    this.levelTimer = this.levelDuration;
    this.currentSpawnRate = ENEMY_SPAWN_RATE_INITIAL / (1 + (this.level * 0.1));
    audio.init();
    this.initEnvironment();
  }

  private setupPlayers(mode: GameMode) {
    this.gameMode = mode;
    this.players.clear();
    this.localPlayerIds = mode === GameMode.OFFLINE_COOP ? ['p1', 'p2'] : ['p1'];
    this.localPlayerIds.forEach((id, idx) => {
      const x = mode === GameMode.OFFLINE_COOP ? (idx === 0 ? CANVAS_WIDTH/3 : 2*CANVAS_WIDTH/3) : CANVAS_WIDTH/2;
      const color = id === 'p2' ? COLORS.player2 : COLORS.player;
      this.players.set(id, new Player(x, CANVAS_HEIGHT/2, id, color));
      this.fireTimer.set(id, 0);
    });
  }

  stopGame() {
    this.gameState = GameState.MENU;
    this.bullets = []; this.enemies = []; this.powerups = []; this.particles = [];
  }

  initEnvironment() {
    const config = ZONE_CONFIGS[this.currentZone] || ZONE_CONFIGS.SKY;
    this.backgroundEntities = [];
    for(let i=0; i<8; i++) {
        this.backgroundEntities.push(new BackgroundEntity(
            {x: Math.random() * CANVAS_WIDTH, y: Math.random() * CANVAS_HEIGHT},
            {x: config.physics.wind.x * 0.1, y: 10}, 
            100 + Math.random() * 150, config.colors.secondary + '33', 'CLOUD'
        ));
    }
  }

  update(dt: number, input: InputState) {
    if (this.gameState === GameState.PAUSED || this.gameState !== GameState.PLAYING) return;

    this.levelTimer -= dt;
    if (this.levelTimer <= 0) { this.completeLevel(); return; }

    this.applyEnvironment(dt);

    this.localPlayerIds.forEach(id => {
        const p = this.players.get(id);
        const pInput = (id === 'p2' && this.gameMode === GameMode.OFFLINE_COOP) ? input.p2 : input.p1;
        if (p) {
            this.handleLifeSharing(p, pInput, id);
            if (!p.isDead) {
                p.handleInput(dt, pInput, this.currentZone);
                p.update(dt);
                this.handleShooting(p, dt, pInput);
            }
        }
    });

    this.enemySpawnTimer -= dt;
    if (this.enemySpawnTimer <= 0) {
      this.spawnEnemy();
      this.enemySpawnTimer = this.currentSpawnRate;
    }

    this.bullets.forEach(b => b.update(dt));
    this.enemies.forEach(e => this.updateEnemyAI(e, dt));
    this.particles.forEach(p => p.update(dt));
    this.powerups.forEach(p => p.update(dt));
    this.backgroundEntities.forEach(b => b.update(dt));

    this.checkCollisions();
    this.cullEntities();

    if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 30);
    if (this.localPlayerIds.every(id => this.players.get(id)?.isDead)) this.gameOver();
  }

  private handleLifeSharing(p: Player, input: any, id: string) {
    if (p.isDead && (input.shooting || input.usePointer)) {
        const donorId = this.localPlayerIds.find(pid => pid !== id);
        if (donorId) {
            const donor = this.players.get(donorId);
            if (donor && !donor.isDead && donor.lives > 1) {
                donor.lives--; p.lives = 1; p.isDead = false; p.invulnerableTime = 3;
                p.position = { ...donor.position, y: donor.position.y + 50 };
                audio.playPowerup(); this.spawnParticles(p.position, '#ffffff', 20);
            }
        }
    }
  }

  private handleShooting(p: Player, dt: number, input: any) {
    let timer = this.fireTimer.get(p.id) || 0;
    timer -= dt;
    if ((input.shooting || input.usePointer) && timer <= 0) {
      const newBullets = WeaponSystem.fire(p.position.x, p.position.y, p.weaponType, p.weaponLevel, p.id, p.color);
      this.bullets.push(...newBullets);
      audio.playShoot();
      if (p.weaponType === WeaponType.SHOTGUN) this.screenShake += (1 + p.weaponLevel);
      const levelMod = Math.min(0.1, p.weaponLevel * 0.02);
      timer = Math.max(0.05, WEAPON_CONFIGS[p.weaponType].fireRate - levelMod);
    }
    this.fireTimer.set(p.id, timer);
  }

  private updateEnemyAI(e: Enemy, dt: number) {
    e.update(dt);
    if (e.shootTimer <= 0 && !e.isDead && e.position.y > 50 && e.position.y < CANVAS_HEIGHT - 100) {
        this.bullets.push(new Bullet({x: e.position.x, y: e.position.y + 10}, {x: 0, y: 300}, WeaponType.BLASTER, '#ffffff', 1, 'enemy', true));
        e.shootTimer = 4 + Math.random() * 4;
    }
  }

  private spawnEnemy() {
    const edge = Math.floor(Math.random() * 3); 
    let x, y;
    if (edge === 0) { x = Math.random() * CANVAS_WIDTH; y = -30; }
    else if (edge === 1) { x = -30; y = Math.random() * CANVAS_HEIGHT * 0.5; }
    else { x = CANVAS_WIDTH + 30; y = Math.random() * CANVAS_HEIGHT * 0.5; }

    const angle = Math.atan2(CANVAS_HEIGHT - y, (CANVAS_WIDTH/2) - x);
    const speed = ENEMY_BASE_SPEED * (1 + Math.random() * 0.5); 
    const hp = 1 + Math.floor(this.score / 2000) + (this.level - 1);
    this.enemies.push(new Enemy({ x, y }, { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed }, hp, ENEMY_SIZE + (this.level * 2), this.currentZone));
  }

  private applyEnvironment(dt: number) {
    const config = ZONE_CONFIGS[this.currentZone] || ZONE_CONFIGS.SKY;
    this.players.forEach(p => {
        p.velocity.x += config.physics.wind.x * dt;
        p.velocity.y += config.physics.wind.y * dt;
    });
    if (config.physics.heatCurve > 0) {
        this.bullets.forEach(b => { if (!b.isEnemy) b.velocity.y -= config.physics.heatCurve * dt; });
    }
  }

  private checkCollisions() {
    this.bullets.forEach(b => {
      if (!b.isEnemy) {
        this.enemies.forEach(e => {
          if (!e.isDead && this.isColliding(b, e)) {
            b.isDead = true; e.hp -= b.damage; e.hit(); e.velocity.y -= 100;
            this.spawnParticles(b.position, b.color, 3);
            if (e.hp <= 0) { e.isDead = true; this.killEnemy(e); }
          }
        });
      } else {
        this.players.forEach(p => {
          if (!p.isDead && p.invulnerableTime <= 0 && this.isColliding(b, p)) {
            b.isDead = true; this.playerHit(p);
          }
        });
      }
    });

    this.powerups.forEach(pu => {
      this.players.forEach(p => {
        if (!p.isDead && !pu.isDead && this.isColliding(p, pu)) {
          pu.isDead = true; this.collectPowerup(p, pu);
        }
      });
    });

    this.enemies.forEach(e => {
      if (!e.isDead) {
        this.players.forEach(p => {
          if (!p.isDead && p.invulnerableTime <= 0 && this.isColliding(p, e)) {
            this.playerHit(p); e.hp = 0; e.isDead = true; this.killEnemy(e);
          }
        });
      }
    });
  }

  private isColliding(a: any, b: any) {
    const dx = a.position.x - b.position.x;
    const dy = a.position.y - b.position.y;
    return Math.sqrt(dx*dx + dy*dy) < (a.radius + b.radius);
  }

  private killEnemy(e: Enemy) {
    this.score += e.scoreValue; this.screenShake = 5; audio.playExplosion();
    const zoneColor = ZONE_CONFIGS[this.currentZone].colors.particle;
    this.spawnParticles(e.position, zoneColor, 10);
    this.spawnParticles(e.position, '#ffffff', 5); 
    if (Math.random() < 0.1) this.powerups.push(new PowerUp({...e.position}, Math.random() < 0.15 ? PowerUpType.HEART : PowerUpType.WEAPON));
  }

  private playerHit(p: Player) {
      p.lives--; this.screenShake = 20; audio.playExplosion();
      this.spawnParticles(p.position, p.color, 20);
      if (p.lives > 0) { p.invulnerableTime = 2.0; p.velocity = {x: 0, y: -200}; }
      else p.isDead = true;
  }

  private collectPowerup(p: Player, pu: PowerUp) {
    audio.playPowerup(); this.score += 500;
    if (pu.kind === PowerUpType.HEART) { if (p.lives < 5) p.lives++; this.spawnParticles(p.position, '#ef4444', 10); }
    else {
        if (p.weaponType === pu.weaponType) { if (p.weaponLevel < MAX_WEAPON_LEVEL) p.weaponLevel++; }
        else p.weaponType = pu.weaponType;
        this.spawnParticles(p.position, COLORS.powerup, 10);
    }
  }

  spawnParticles(pos: Vector2, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2; const speed = Math.random() * 150 + 50;
      this.particles.push(new Particle({...pos}, { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed }, color, Math.random() * 4 + 2, Math.random() * 3 + 1));
    }
  }

  cullEntities() {
    this.bullets = this.bullets.filter(b => !b.isDead && b.position.y > -50 && b.position.y < CANVAS_HEIGHT + 50);
    this.enemies = this.enemies.filter(e => !e.isDead && e.position.y < CANVAS_HEIGHT + 100);
    this.particles = this.particles.filter(p => !p.isDead);
    this.powerups = this.powerups.filter(p => !p.isDead);
    this.backgroundEntities = this.backgroundEntities.filter(b => b.position.y < CANVAS_HEIGHT + 200);
  }

  completeLevel() { this.gameState = GameState.LEVEL_COMPLETE; this.level++; this.bullets = []; this.enemies = []; this.powerups = []; }
  gameOver() { this.gameState = GameState.GAME_OVER; if (this.score > this.highScore) { this.highScore = this.score; localStorage.setItem('neon_swarm_highscore', this.highScore.toString()); } }

  draw(ctx: CanvasRenderingContext2D) {
    const config = ZONE_CONFIGS[this.currentZone] || ZONE_CONFIGS.SKY;
    ctx.fillStyle = config.colors.background; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.save();
    if (this.screenShake > 0) ctx.translate((Math.random()-0.5)*this.screenShake, (Math.random()-0.5)*this.screenShake);
    this.backgroundEntities.forEach(b => b.draw(ctx));
    this.powerups.forEach(p => p.draw(ctx));
    this.particles.forEach(p => p.draw(ctx));
    this.enemies.forEach(e => e.draw(ctx));
    this.bullets.forEach(b => b.draw(ctx));
    if (this.gameState !== GameState.GAME_OVER) this.players.forEach(p => p.draw(ctx));
    ctx.restore();
  }
}
