
import { Player, Enemy, Boss, Particle, PowerUp, BackgroundEntity, Explosion, Projectile, EggBlasterBullet, PhotonLaser, FeatherShotgunBullet, HelixDNAProjectile, RoosterRocket } from './Entities';
import { GameState, GameMode, InputState, Vector2, ZoneType, WeaponType, PowerUpType, MapPhase, EnemyType, EnemyState, PlayerState } from '../types';
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, MAX_WEAPON_LEVEL, MAP_PROGRESSION, PLAYER_SIZE
} from '../constants';
import { audio } from '../services/AudioSynthesizer';
import { WeaponSystem } from './WeaponSystem';
import { SpawnController, WaveData } from './SpawnController';

export class GameEngine {
  gameState: GameState = GameState.MENU;
  gameMode: GameMode = GameMode.OFFLINE_SOLO;
  currentMapIndex: number = 0;
  currentPhase: MapPhase = MapPhase.NORMAL;
  score: number = 0;
  highScore: number = 0;
  
  worldScale: number = 1.0;
  targetScale: number = 1.0;

  players: Map<string, Player> = new Map();
  localPlayerIds: string[] = [];
  bullets: Projectile[] = [];
  enemies: Enemy[] = [];
  boss: Boss | null = null;
  particles: Particle[] = [];
  powerups: PowerUp[] = [];
  explosions: Explosion[] = [];
  backgroundEntities: BackgroundEntity[] = [];

  fireTimer: Map<string, number> = new Map();
  phaseTimer: number = 0;
  screenShake: number = 0;
  comboCount: number = 0;
  comboTimer: number = 0;

  private spawnController: SpawnController | null = null;
  private waveDelayTimer: number = 0;
  private nextWaveData: WaveData | null = null;
  private isHinting: boolean = false;

  p1Colors = { primary: COLORS.p1Primary, glow: COLORS.p1Glow };
  p2Colors = { primary: COLORS.p2Primary, glow: COLORS.p2Glow };

  constructor() {
    this.localPlayerIds = ['p1'];
    const saved = localStorage.getItem('neon_swarm_highscore');
    if (saved) this.highScore = parseInt(saved, 10);
  }

  togglePause() {
    if (this.gameState === GameState.PLAYING) this.gameState = GameState.PAUSED;
    else if (this.gameState === GameState.PAUSED) this.gameState = GameState.PLAYING;
  }

  startGame(mode: GameMode = GameMode.OFFLINE_SOLO, mapIndex: number = 0, p1Config?: any, p2Config?: any) {
    if (p1Config) this.p1Colors = p1Config;
    if (p2Config) this.p2Colors = p2Config;
    this.gameState = GameState.PLAYING;
    this.currentMapIndex = mapIndex;
    this.currentPhase = MapPhase.NORMAL;
    this.phaseTimer = 0;
    this.score = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.updateTargetScale();
    this.worldScale = this.targetScale; 
    this.setupPlayers(mode);
    this.setupMap();
    audio.init();
  }

  private updateTargetScale() {
    this.targetScale = 1.0 / (1.0 + this.currentMapIndex * 0.12);
  }

  dispose() {
    this.gameState = GameState.MENU;
    this.bullets = []; this.enemies = []; this.particles = [];
    this.powerups = []; this.explosions = []; this.backgroundEntities = [];
    this.players.clear(); this.fireTimer.clear();
    this.boss = null; this.score = 0; this.screenShake = 0;
    this.spawnController = null; this.nextWaveData = null; this.isHinting = false;
  }

  private setupMap() {
    this.updateTargetScale();
    this.initEnvironment();
    const map = MAP_PROGRESSION[this.currentMapIndex];
    this.spawnController = new SpawnController(map.zone, this.currentMapIndex);
    this.waveDelayTimer = 1.5;
    this.nextWaveData = null;
    this.isHinting = false;
    this.players.forEach(p => {
        p.radius = PLAYER_SIZE * this.targetScale;
        p.invulnerableTime = 2.0; 
    });
  }

  private setupPlayers(mode: GameMode) {
    this.gameMode = mode;
    this.players.clear();
    this.localPlayerIds = mode === GameMode.OFFLINE_COOP ? ['p1', 'p2'] : ['p1'];
    this.localPlayerIds.forEach((id, idx) => {
      const x = mode === GameMode.OFFLINE_COOP ? (idx === 0 ? CANVAS_WIDTH/3 : 2*CANVAS_WIDTH/3) : CANVAS_WIDTH/2;
      const config = id === 'p1' ? this.p1Colors : this.p2Colors;
      const p = new Player(x, CANVAS_HEIGHT - 100, id, config.primary, config.glow);
      p.radius = PLAYER_SIZE * this.worldScale;
      this.players.set(id, p);
      this.fireTimer.set(id, 0);
    });
  }

  initEnvironment() {
    this.backgroundEntities = [];
    const map = MAP_PROGRESSION[this.currentMapIndex];
    const density = 60 + this.currentMapIndex * 20; 
    for(let i=0; i<density; i++) {
        let color = '#ffffff22';
        if (map.zone === ZoneType.VOLCANO) color = '#f9731644';
        if (map.zone === ZoneType.CYBER) color = '#22d3ee33';
        if (map.zone === ZoneType.ICE) color = '#ffffff55';
        
        this.backgroundEntities.push(new BackgroundEntity(
            {x: Math.random() * CANVAS_WIDTH, y: Math.random() * CANVAS_HEIGHT},
            {x: 0, y: (80 + Math.random() * 250)}, 
            (1 + Math.random() * 3) / this.worldScale, 
            color
        ));
    }
  }

  update(dt: number, input: InputState) {
    if (this.gameState !== GameState.PLAYING) return;

    if (Math.abs(this.worldScale - this.targetScale) > 0.001) {
        this.worldScale += (this.targetScale - this.worldScale) * dt * 2;
    }

    this.phaseTimer += dt;
    this.updatePhases();

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.comboCount = 0;
    }

    this.localPlayerIds.forEach(id => {
        const p = this.players.get(id);
        const pInput = id === 'p2' ? input.p2 : input.p1;
        if (p && p.state !== PlayerState.DEAD) {
            p.radius = PLAYER_SIZE * this.worldScale; 
            p.handleInput(dt, pInput, MAP_PROGRESSION[this.currentMapIndex].zone);
            p.update(dt);
            if (p.state === PlayerState.ALIVE) this.handleShooting(p, dt, pInput);
        }
    });

    if (this.currentPhase !== MapPhase.BOSS && this.spawnController) {
      if (this.enemies.length === 0) {
        if (!this.nextWaveData) {
            this.nextWaveData = this.spawnController.prepareNextWave(this.worldScale);
            this.waveDelayTimer = 1.8;
            this.isHinting = true;
        } else {
            this.waveDelayTimer -= dt;
            if (this.waveDelayTimer <= 0) {
                this.enemies = this.spawnController.spawnEnemiesFromSlots(this.nextWaveData.slots, this.worldScale);
                this.nextWaveData = null;
                this.isHinting = false;
            }
        }
      }
    } else if (this.boss) {
        this.updateBossLogic(dt);
    }

    this.bullets.forEach(b => {
        if (b instanceof RoosterRocket) (b as RoosterRocket).updateWithEngine(dt, this);
        else b.update(dt);
    });

    this.explosions.forEach(exp => exp.update(dt));
    this.enemies.forEach(e => {
        e.update(dt);
        if (e.state !== EnemyState.ENTRY && e.shootTimer <= 0) {
            const bullet = new EggBlasterBullet({x: e.position.x, y: e.position.y + 20}, {x: 0, y: 550}, 1, 'enemy', true);
            bullet.radius *= this.worldScale;
            this.bullets.push(bullet);
            e.shootTimer = 4 + Math.random() * 8;
        }
    });
    this.boss?.update(dt);
    this.particles.forEach(p => p.update(dt));
    this.powerups.forEach(p => p.update(dt));
    this.backgroundEntities.forEach(b => {
        b.update(dt);
        if (b.position.y > CANVAS_HEIGHT) b.position.y = -20;
    });

    this.checkCollisions(dt);
    this.cullEntities();

    if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 40);
    if (this.localPlayerIds.every(id => this.players.get(id)?.state === PlayerState.DEAD)) {
        this.gameState = GameState.GAME_OVER;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('neon_swarm_highscore', this.highScore.toString());
        }
    }
  }

  private updatePhases() {
      if (this.currentPhase === MapPhase.NORMAL && this.phaseTimer > 120) this.currentPhase = MapPhase.ELITE;
      else if (this.currentPhase === MapPhase.ELITE && this.phaseTimer > 240) {
          this.currentPhase = MapPhase.BOSS;
          this.spawnBoss();
      }
  }

  private spawnBoss() {
      const map = MAP_PROGRESSION[this.currentMapIndex];
      
      // Xác định màu sắc và vũ khí dựa trên theme của Map
      const themeColors = ['#22d3ee', '#f97316', '#22c55e', '#ffffff', '#a855f7', '#10b981', '#fb7185', '#fbbf24', '#f87171', '#ffffff'];
      const bossWeapons = [WeaponType.BLASTER, WeaponType.SHOTGUN, WeaponType.HELIX, WeaponType.ROCKET, WeaponType.LASER, WeaponType.BLASTER, WeaponType.SHOTGUN, WeaponType.HELIX, WeaponType.ROCKET, WeaponType.LASER];
      
      const themeColor = themeColors[this.currentMapIndex % themeColors.length];
      const weapon = bossWeapons[this.currentMapIndex % bossWeapons.length];

      this.boss = new Boss(
        { x: CANVAS_WIDTH / 2, y: -400 }, 
        1000 * Math.pow(1.7, this.currentMapIndex), 
        map.bossName, 
        map.zone,
        themeColor
      );
      
      this.boss.bossWeapon = weapon;
      this.boss.radius *= this.worldScale * 1.6; 
      audio.playPowerup();
  }

  private updateBossLogic(dt: number) {
      if (!this.boss) return;
      
      // Logic Vulnerability tùy Map để tạo độ khó khác nhau
      switch(this.currentMapIndex) {
          case 0: this.boss.isVulnerable = this.boss.shootTimer > 3.0; break;
          case 1: this.boss.isVulnerable = Math.abs(this.boss.position.x - CANVAS_WIDTH/2) > (CANVAS_WIDTH * 0.3); break;
          case 2: this.boss.isVulnerable = Math.sin(this.phaseTimer * 2) > 0.5; break;
          default: this.boss.isVulnerable = Math.floor(this.phaseTimer) % 4 === 0; break;
      }

      if (this.boss.shootTimer <= 0) {
          this.fireBossWeapon();
          this.boss.shootTimer = 4.5 + Math.random() * 1.5; 
          audio.playShoot();
      }
  }

  private fireBossWeapon() {
    if (!this.boss) return;
    const px = this.boss.position.x;
    const py = this.boss.position.y + 120;
    
    // Boss dùng WeaponSystem với level tăng dần theo Map
    const bossLevel = 4 + this.currentMapIndex * 2;
    const projectiles = WeaponSystem.fire(px, py, this.boss.bossWeapon, bossLevel, 'enemy', this.boss.themeColor);
    
    projectiles.forEach(proj => {
        proj.isEnemy = true;
        proj.velocity.y *= -1.3; // Đạn bắn ngược xuống dưới
        proj.velocity.x *= 1.3;
        proj.radius *= this.worldScale * 1.6; // Đạn boss uy lực hơn
        this.bullets.push(proj);
    });
  }

  private handleShooting(p: Player, dt: number, input: any) {
    let timer = this.fireTimer.get(p.id) || 0;
    timer -= dt;
    if (input.shooting && timer <= 0) {
      const newProjectiles = WeaponSystem.fire(p.position.x, p.position.y, p.weaponType, p.weaponLevel, p.id, p.primaryColor);
      newProjectiles.forEach(proj => {
          proj.radius *= this.worldScale; 
          if (proj instanceof EggBlasterBullet && this.comboCount >= 3) proj.isPoweredUp = true;
      });
      this.bullets.push(...newProjectiles);
      audio.playShoot();
      timer = WeaponSystem.getFireRate(p.weaponType, p.weaponLevel);
    }
    this.fireTimer.set(p.id, timer);
  }

  private checkCollisions(dt: number) {
    this.bullets.forEach(b => {
      if (!b.isEnemy) {
        this.enemies.forEach(e => {
          if (e.state !== EnemyState.ENTRY && !e.isDead && this.isColliding(b, e)) {
            b.onImpact(this, e.position); 
            let finalDamage = b.damage;
            if (e.type === EnemyType.ARMORED) finalDamage *= 0.8;
            e.hp -= finalDamage; e.hit();
            if (e.hp <= 0) { e.isDead = true; this.killEnemy(e); }
          }
        });
        if (this.boss && this.isColliding(b, this.boss)) {
            b.onImpact(this, b.position);
            if (this.boss.isVulnerable) {
                this.boss.hp -= b.damage; this.boss.hit();
                if (this.boss.hp <= 0) this.winMap();
            } else {
                this.spawnParticles(b.position, this.boss.themeColor, 5); audio.playHit();
            }
        }
      } else {
        this.players.forEach(p => {
          if (p.state === PlayerState.ALIVE && p.invulnerableTime <= 0 && this.isColliding(b, p)) {
            b.onImpact(this, p.position); this.playerHit(p);
          }
        });
      }
    });

    this.players.forEach(p => {
        if (p.state === PlayerState.ALIVE && p.invulnerableTime <= 0) {
            this.enemies.forEach(e => {
                if (e.state !== EnemyState.ENTRY && !e.isDead && this.isColliding(p, e)) {
                    this.playerHit(p);
                    e.hp = 0; e.isDead = true; this.killEnemy(e);
                }
            });
            if (this.boss && !this.boss.isDead && this.isColliding(p, this.boss)) {
                this.playerHit(p);
                p.position.y += 100;
                p.velocity.y = 800;
            }
        }
    });

    this.explosions.forEach(exp => {
        this.enemies.forEach(e => {
            if (e.state !== EnemyState.ENTRY && !e.isDead && this.isColliding(exp, e)) {
                if (exp.isBurning) { e.hp -= exp.damage * dt; if (Math.random() < 0.1) e.hit(); }
                else if (!exp.damagedEnemies.has(e)) { e.hp -= exp.damage; e.hit(); exp.damagedEnemies.add(e); }
                if (e.hp <= 0) { e.isDead = true; this.killEnemy(e); }
            }
        });
    });

    this.powerups.forEach(pu => {
      this.players.forEach(p => {
        if (p.state === PlayerState.ALIVE && !pu.isDead && this.isColliding(p, pu)) {
          pu.isDead = true; this.collectPowerup(p, pu);
        }
      });
    });
  }

  public createExplosion(pos: Vector2, damage: number, radius: number) {
      this.explosions.push(new Explosion({...pos}, radius * this.worldScale, damage));
      this.screenShake = Math.max(this.screenShake, 30);
      audio.playExplosion();
      this.spawnParticles(pos, '#f97316', 20, 2.0);
  }

  public createRocketExplosion(pos: Vector2, damage: number) {
      const impact = new Explosion({...pos}, 220 * this.worldScale, damage, '#ffffff');
      impact.maxLife = 0.4; impact.life = 0.4;
      this.explosions.push(impact);
      const burn = new Explosion({...pos}, 200 * this.worldScale, damage * 0.25, '#f97316');
      burn.isBurning = true; burn.maxLife = 1.5; burn.life = 1.5;
      this.explosions.push(burn);
      audio.playExplosion();
      this.spawnParticles(pos, '#64748b', 30, 0.8);
  }

  public spawnPiercingRing(pos: Vector2, color: string) {
      const ring = new Explosion({...pos}, 100 * this.worldScale, 0, color);
      ring.maxLife = 0.2; ring.life = 0.2;
      this.explosions.push(ring);
  }

  public triggerChainResonance(pos: Vector2, damage: number, color: string) {
      const radius = 220 * this.worldScale; let target: Enemy | null = null; let minDist = radius;
      this.enemies.forEach(e => {
          if (e.isDead) return;
          const d = Math.hypot(e.position.x - pos.x, e.position.y - pos.y);
          if (d < minDist) { minDist = d; target = e; }
      });
      if (target) { target.hp -= damage; target.hit(); this.spawnParticles(target.position, color, 3, 5.0); audio.playHit(); }
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
    this.score += e.scoreValue; this.comboCount++; this.comboTimer = 1.2;
    // Đã xóa hiệu ứng screenShake ở đây để giữ màn hình ổn định khi tiêu diệt quái thường
    audio.playExplosion();
    this.spawnParticles(e.position, e.color, 25, 2.5);
    
    if (Math.random() < 0.25) {
        const r = Math.random();
        let kind = PowerUpType.WEAPON;
        if (r < 0.25) kind = PowerUpType.HEART; 
        else if (r < 0.5) kind = PowerUpType.POWER_BOOST; 
        const pu = new PowerUp({...e.position}, kind);
        pu.radius *= this.worldScale;
        this.powerups.push(pu);
    }
  }

  private playerHit(p: Player) {
      p.lives--; this.screenShake = 60; audio.playExplosion();
      this.spawnParticles(p.position, p.glowColor, 60, 2.0);
      this.spawnParticles(p.position, '#ffffff', 20, 3.0);
      p.applyDeathPenalty();
      if (p.lives > 0) this.respawnPlayer(p);
      else p.state = PlayerState.DEAD;
  }

  private respawnPlayer(p: Player) {
      p.state = PlayerState.RESPAWNING;
      p.respawnTimer = 1.5; 
      p.position.x = CANVAS_WIDTH / 2;
      p.position.y = CANVAS_HEIGHT + 150;
      p.velocity.x = 0; p.velocity.y = 0;
      p.invulnerableTime = 3.0; 
  }

  private collectPowerup(p: Player, pu: PowerUp) {
    audio.playPowerup();
    if (pu.kind === PowerUpType.HEART) p.lives++; 
    else if (pu.kind === PowerUpType.POWER_BOOST) p.weaponLevel = Math.min(MAX_WEAPON_LEVEL, p.weaponLevel + 1);
    else {
        if (p.weaponType === pu.weaponType) p.weaponLevel = Math.min(MAX_WEAPON_LEVEL, p.weaponLevel + 1);
        else p.weaponType = pu.weaponType;
    }
  }

  spawnParticles(pos: Vector2, color: string, count: number, decay: number = 2.5) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 400;
      const particle = new Particle({...pos}, { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed }, color, 5.0 * this.worldScale, decay);
      this.particles.push(particle);
    }
  }

  spawnVortexParticles(pos: Vector2, color: string, count: number) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 100 + Math.random() * 200;
        const p = new Particle({...pos}, { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed }, color, 3.5 * this.worldScale, 3.5);
        p.velocity.x += Math.sin(angle) * 120; p.velocity.y += Math.cos(angle) * 120;
        this.particles.push(p);
    }
  }

  cullEntities() {
    this.bullets = this.bullets.filter(b => !b.isDead && b.position.y > -250 && b.position.y < CANVAS_HEIGHT + 250);
    this.enemies = this.enemies.filter(e => !e.isDead && e.position.y < CANVAS_HEIGHT + 350);
    this.explosions = this.explosions.filter(exp => !exp.isDead);
    this.particles = this.particles.filter(p => !p.isDead);
    this.powerups = this.powerups.filter(p => !p.isDead);
  }

  stopGame() { this.gameState = GameState.MENU; }

  draw(ctx: CanvasRenderingContext2D) {
    const map = MAP_PROGRESSION[this.currentMapIndex];
    ctx.fillStyle = map.bgColor; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.drawZoneAtmosphere(ctx, map.zone, true);
    ctx.save();
    if (this.screenShake > 0) ctx.translate((Math.random()-0.5)*this.screenShake, (Math.random()-0.5)*this.screenShake);
    if (this.isHinting && this.nextWaveData) this.drawFormationHint(ctx, this.nextWaveData.slots);
    this.backgroundEntities.forEach(b => b.draw(ctx));
    this.powerups.forEach(p => p.draw(ctx));
    this.enemies.forEach(e => e.draw(ctx));
    this.boss?.draw(ctx);
    this.bullets.forEach(b => b.draw(ctx));
    this.explosions.forEach(exp => exp.draw(ctx));
    this.players.forEach(p => p.draw(ctx));
    ctx.restore();
    this.drawZoneAtmosphere(ctx, map.zone, false);
  }

  private drawZoneAtmosphere(ctx: CanvasRenderingContext2D, zone: ZoneType, isBottom: boolean) {
      if (isBottom) {
          if (zone === ZoneType.CYBER) {
              ctx.strokeStyle = 'rgba(34, 211, 238, 0.1)';
              ctx.lineWidth = 1;
              const spacing = 100 * this.worldScale;
              for (let x = 0; x < CANVAS_WIDTH; x += spacing) {
                  ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
              }
              for (let y = 0; y < CANVAS_HEIGHT; y += spacing) {
                  ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke();
              }
          }
      } else {
          if (zone === ZoneType.VOLCANO) {
              ctx.fillStyle = 'rgba(239, 68, 68, 0.08)'; 
              ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
              if (Math.random() < 0.05) this.spawnParticles({x: Math.random() * CANVAS_WIDTH, y: CANVAS_HEIGHT}, '#f97316', 1, 0.5);
          } else if (zone === ZoneType.ICE) {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; 
              ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
              if (Math.random() < 0.1) this.spawnParticles({x: Math.random() * CANVAS_WIDTH, y: 0}, '#ffffff', 1, 1.5);
          }
      }
  }

  private drawFormationHint(ctx: CanvasRenderingContext2D, slots: Vector2[]) {
      ctx.save();
      const pulse = 0.2 + Math.abs(Math.sin(Date.now() / 200)) * 0.3;
      ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
      ctx.strokeStyle = `rgba(34, 211, 238, ${pulse})`;
      ctx.lineWidth = 2;
      slots.forEach(slot => {
          ctx.beginPath();
          ctx.arc(slot.x, slot.y, 15 * this.worldScale, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
      });
      ctx.restore();
  }
}
