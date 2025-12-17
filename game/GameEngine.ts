
import { Player, Bullet, Enemy, Boss, Particle, PowerUp, BackgroundEntity } from './Entities';
import { GameState, GameMode, InputState, Vector2, ZoneType, WeaponType, PowerUpType, MapPhase } from '../types';
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, MAX_WEAPON_LEVEL, ENEMY_SPAWN_RATE_INITIAL,
  ENEMY_BASE_SPEED, ENEMY_SIZE, MAP_PROGRESSION, WEAPON_CONFIGS
} from '../constants';
import { audio } from '../services/AudioSynthesizer';
import { WeaponSystem } from './WeaponSystem';

export class GameEngine {
  gameState: GameState = GameState.MENU;
  gameMode: GameMode = GameMode.OFFLINE_SOLO;
  currentMapIndex: number = 0;
  currentPhase: MapPhase = MapPhase.NORMAL;
  score: number = 0;
  highScore: number = 0;
  
  players: Map<string, Player> = new Map();
  localPlayerIds: string[] = [];

  bullets: Bullet[] = [];
  enemies: Enemy[] = [];
  boss: Boss | null = null;
  particles: Particle[] = [];
  powerups: PowerUp[] = [];
  backgroundEntities: BackgroundEntity[] = [];

  fireTimer: Map<string, number> = new Map();
  enemySpawnTimer: number = 0;
  phaseTimer: number = 0;
  screenShake: number = 0;

  constructor() {
    this.localPlayerIds = ['p1'];
    this.players.set('p1', new Player(CANVAS_WIDTH/2, CANVAS_HEIGHT - 100, 'p1', COLORS.player));
    const saved = localStorage.getItem('neon_swarm_highscore');
    if (saved) this.highScore = parseInt(saved, 10);
  }

  startGame(mode: GameMode = GameMode.OFFLINE_SOLO, mapIndex: number = 0) {
    this.gameState = GameState.PLAYING;
    this.currentMapIndex = mapIndex;
    this.currentPhase = MapPhase.NORMAL;
    this.phaseTimer = 0;
    this.score = 0;
    this.setupPlayers(mode);
    this.setupMap();
    audio.init();
  }

  private setupMap() {
    this.bullets = [];
    this.enemies = [];
    this.boss = null;
    this.powerups = [];
    this.particles = [];
    this.initEnvironment();
  }

  private setupPlayers(mode: GameMode) {
    this.gameMode = mode;
    this.players.clear();
    this.localPlayerIds = mode === GameMode.OFFLINE_COOP ? ['p1', 'p2'] : ['p1'];
    this.localPlayerIds.forEach((id, idx) => {
      const x = mode === GameMode.OFFLINE_COOP ? (idx === 0 ? CANVAS_WIDTH/3 : 2*CANVAS_WIDTH/3) : CANVAS_WIDTH/2;
      this.players.set(id, new Player(x, CANVAS_HEIGHT - 100, id, id === 'p2' ? COLORS.player2 : COLORS.player));
      this.fireTimer.set(id, 0);
    });
  }

  initEnvironment() {
    this.backgroundEntities = [];
    for(let i=0; i<50; i++) {
        this.backgroundEntities.push(new BackgroundEntity(
            {x: Math.random() * CANVAS_WIDTH, y: Math.random() * CANVAS_HEIGHT},
            {x: 0, y: 120 + Math.random() * 250}, 
            1 + Math.random() * 3, '#ffffff22'
        ));
    }
  }

  update(dt: number, input: InputState) {
    if (this.gameState !== GameState.PLAYING) return;

    this.phaseTimer += dt;
    this.updatePhases();

    this.localPlayerIds.forEach(id => {
        const p = this.players.get(id);
        const pInput = id === 'p2' ? input.p2 : input.p1;
        if (p && !p.isDead) {
            p.handleInput(dt, pInput, MAP_PROGRESSION[this.currentMapIndex].zone);
            p.update(dt);
            this.handleShooting(p, dt, pInput);
        }
    });

    if (this.currentPhase !== MapPhase.BOSS) {
        this.enemySpawnTimer -= dt;
        if (this.enemySpawnTimer <= 0) {
            this.spawnEnemy();
            const phaseBonus = this.currentPhase === MapPhase.ELITE ? 0.6 : 1.0;
            this.enemySpawnTimer = (ENEMY_SPAWN_RATE_INITIAL * phaseBonus) / (1 + this.currentMapIndex * 0.25);
        }
    } else if (this.boss) {
        this.updateBossLogic(dt);
    }

    this.bullets.forEach(b => b.update(dt));
    this.enemies.forEach(e => {
        e.update(dt);
        if (e.shootTimer <= 0) {
            this.bullets.push(new Bullet({x: e.position.x, y: e.position.y + 20}, {x: 0, y: 550}, WeaponType.BLASTER, '#ffffff', 1, 'enemy', true));
            e.shootTimer = 1.8 + Math.random() * 4;
        }
    });
    this.boss?.update(dt);
    this.particles.forEach(p => p.update(dt));
    this.powerups.forEach(p => p.update(dt));
    this.backgroundEntities.forEach(b => {
        b.update(dt);
        if (b.position.y > CANVAS_HEIGHT) b.position.y = -20;
    });

    this.checkCollisions();
    this.cullEntities();

    if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 40);
    if (this.localPlayerIds.every(id => this.players.get(id)?.isDead)) {
        this.gameState = GameState.GAME_OVER;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('neon_swarm_highscore', this.highScore.toString());
        }
    }
  }

  private updatePhases() {
      if (this.currentPhase === MapPhase.NORMAL && this.phaseTimer > 90) {
          this.currentPhase = MapPhase.ELITE;
      } else if (this.currentPhase === MapPhase.ELITE && this.phaseTimer > 180) {
          this.currentPhase = MapPhase.BOSS;
          this.spawnBoss();
      }
  }

  private spawnBoss() {
      const map = MAP_PROGRESSION[this.currentMapIndex];
      this.boss = new Boss({ x: CANVAS_WIDTH / 2, y: -400 }, 600 * map.difficultyScale, map.bossName, map.zone);
      audio.playPowerup();
  }

  private updateBossLogic(dt: number) {
      if (!this.boss) return;
      const map = MAP_PROGRESSION[this.currentMapIndex];
      
      switch(this.currentMapIndex) {
          case 0: this.boss.isVulnerable = this.boss.shootTimer > 3.2; break;
          case 1: this.boss.isVulnerable = Math.abs(this.boss.position.x - CANVAS_WIDTH/2) > (CANVAS_WIDTH * 0.32); break;
          default: this.boss.isVulnerable = Math.floor(this.phaseTimer) % 5 === 0; break;
      }

      if (this.boss.shootTimer <= 0) {
          const burst = 12 + this.currentMapIndex * 2;
          for(let i = 0; i < burst; i++) {
              const angle = (Math.PI / (burst-1)) * i;
              this.bullets.push(new Bullet(
                  {x: this.boss.position.x, y: this.boss.position.y + 80},
                  {x: Math.cos(angle - Math.PI) * 550, y: Math.sin(angle) * 550 + 200},
                  WeaponType.BLASTER, '#ffffff', 1, 'enemy', true
              ));
          }
          this.boss.shootTimer = 6.0; 
          audio.playShoot();
      }
  }

  private handleShooting(p: Player, dt: number, input: any) {
    let timer = this.fireTimer.get(p.id) || 0;
    timer -= dt;
    if (input.shooting && timer <= 0) {
      const newBullets = WeaponSystem.fire(p.position.x, p.position.y, p.weaponType, p.weaponLevel, p.id, p.color);
      this.bullets.push(...newBullets);
      audio.playShoot();
      
      // Sử dụng FireRate từ WeaponSystem để khớp với Hz của bảng 20 level
      const interval = WeaponSystem.getFireRate(p.weaponType, p.weaponLevel);
      timer = interval;
    }
    this.fireTimer.set(p.id, timer);
  }

  private spawnEnemy() {
    const x = Math.random() * (CANVAS_WIDTH - 200) + 100;
    const isElite = this.currentPhase === MapPhase.ELITE;
    const hp = (isElite ? 4 : 1) + Math.floor(this.currentMapIndex * 0.8);
    this.enemies.push(new Enemy(
        { x, y: -80 }, 
        { x: (Math.random() - 0.5) * 100, y: ENEMY_BASE_SPEED + (this.currentMapIndex * 25) }, 
        hp, ENEMY_SIZE, MAP_PROGRESSION[this.currentMapIndex].zone
    ));
  }

  private checkCollisions() {
    this.bullets.forEach(b => {
      if (!b.isEnemy) {
        this.enemies.forEach(e => {
          if (!e.isDead && this.isColliding(b, e)) {
            b.isDead = true; e.hp -= b.damage; e.hit();
            if (e.hp <= 0) { e.isDead = true; this.killEnemy(e); }
          }
        });
        if (this.boss && this.isColliding(b, this.boss)) {
            b.isDead = true;
            if (this.boss.isVulnerable) {
                this.boss.hp -= b.damage; this.boss.hit();
                if (this.boss.hp <= 0) this.winMap();
            } else {
                this.spawnParticles(b.position, '#22d3ee', 5);
                audio.playHit();
            }
        }
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
          pu.isDead = true; 
          this.collectPowerup(p, pu);
        }
      });
    });
  }

  private winMap() {
      this.boss = null;
      this.score += 50000 * (this.currentMapIndex + 1);
      audio.playPowerup();
      this.currentMapIndex++;
      if (this.currentMapIndex >= MAP_PROGRESSION.length) {
          this.gameState = GameState.LEVEL_COMPLETE;
      } else {
          this.setupMap();
          this.currentPhase = MapPhase.NORMAL;
          this.phaseTimer = 0;
      }
  }

  private isColliding(a: any, b: any) {
    const dx = a.position.x - b.position.x;
    const dy = a.position.y - b.position.y;
    return Math.sqrt(dx*dx + dy*dy) < (a.radius + b.radius);
  }

  private killEnemy(e: Enemy) {
    this.score += e.scoreValue; this.screenShake = 12; audio.playExplosion();
    this.spawnParticles(e.position, e.color, 20);
    if (Math.random() < 0.2) {
        const isHeart = Math.random() < 0.3;
        this.powerups.push(new PowerUp({...e.position}, isHeart ? PowerUpType.HEART : PowerUpType.WEAPON));
    }
  }

  private playerHit(p: Player) {
      p.lives--; this.screenShake = 45; audio.playExplosion();
      this.spawnParticles(p.position, p.color, 45);
      if (p.lives > 0) p.invulnerableTime = 3.5; else p.isDead = true;
  }

  private collectPowerup(p: Player, pu: PowerUp) {
    audio.playPowerup();
    if (pu.kind === PowerUpType.HEART) {
        p.lives++; 
    } else {
        if (p.weaponType === pu.weaponType) p.weaponLevel = Math.min(MAX_WEAPON_LEVEL, p.weaponLevel + 1);
        else p.weaponType = pu.weaponType;
    }
  }

  spawnParticles(pos: Vector2, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 400;
      this.particles.push(new Particle({...pos}, { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed }, color, 5.0, 2.5));
    }
  }

  cullEntities() {
    this.bullets = this.bullets.filter(b => !b.isDead && b.position.y > -100 && b.position.y < CANVAS_HEIGHT + 100);
    this.enemies = this.enemies.filter(e => !e.isDead && e.position.y < CANVAS_HEIGHT + 250);
    this.particles = this.particles.filter(p => !p.isDead);
    this.powerups = this.powerups.filter(p => !p.isDead);
  }

  stopGame() { this.gameState = GameState.MENU; }

  draw(ctx: CanvasRenderingContext2D) {
    const map = MAP_PROGRESSION[this.currentMapIndex];
    ctx.fillStyle = map.bgColor;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.save();
    if (this.screenShake > 0) ctx.translate((Math.random()-0.5)*this.screenShake, (Math.random()-0.5)*this.screenShake);
    this.backgroundEntities.forEach(b => b.draw(ctx));
    this.powerups.forEach(p => p.draw(ctx));
    this.enemies.forEach(e => e.draw(ctx));
    this.boss?.draw(ctx);
    this.bullets.forEach(b => b.draw(ctx));
    this.players.forEach(p => p.draw(ctx));
    ctx.restore();
  }
}
