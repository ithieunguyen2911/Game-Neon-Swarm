
import { WorldContext } from './WorldContext';
import { GameSystem, MovementSystem, CombatSystem, CollisionSystem, CullingSystem } from './systems';
import { GameState, GameMode, InputState, ZoneType, PlayerState, MapOrientation, MapDefinition, Vector2, MapPhase, EnemyType } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, MAP_PROGRESSION } from '../constants';
import { audio } from '../services/AudioSynthesizer';
import { Player, BossMother, BossChickenKing, BossMagmaRooster, BackgroundEntity, Particle, Explosion, Enemy } from './Entities';
import { SpawnController } from './SpawnController';
import { MapRenderer } from './world/MapSystem';
import { PixiRenderer } from './PixiRenderer';

export class GameEngine {
  public ctx: WorldContext;
  private systems: GameSystem[] = [];
  private mapRenderer = new MapRenderer();
  private spawnController: SpawnController | null = null;
  private pixiRenderer = PixiRenderer.getInstance();

  constructor() {
    this.ctx = new WorldContext();
    this.systems = [
        new MovementSystem(),
        new CombatSystem(),
        new CollisionSystem(),
        new CullingSystem()
    ];
  }

  get gameState() { return this.ctx.gameState; }
  set gameState(v: GameState) { this.ctx.gameState = v; }
  get score() { return this.ctx.score; }
  get highScore() { return this.ctx.highScore; }
  get currentMapIndex() { return this.ctx.currentMapIndex; }
  get currentVersion() { return this.ctx.currentVersion; }
  get players() { return this.ctx.players; }
  get worldScale() { return this.ctx.worldScale; }
  get backgroundEntities() { return this.ctx.backgroundEntities; }
  get enemies() { return this.ctx.enemies; }
  get boss() { return this.ctx.boss; }
  get bullets() { return this.ctx.bullets; }
  get powerups() { return this.ctx.powerups; }
  get particles() { return this.ctx.particles; }
  get explosions() { return this.ctx.explosions; }
  get screenShake() { return this.ctx.screenShake; }
  set screenShake(v: number) { this.ctx.screenShake = v; }

  async initRenderer() {
    await this.pixiRenderer.init();
  }

  cleanup() {
    this.ctx.reset();
  }

  reset() {
    this.ctx.reset();
  }

  spawnParticles(pos: Vector2, color: string, count: number, speed: number) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const vel = { 
            x: Math.cos(angle) * speed * (0.5 + Math.random()), 
            y: Math.sin(angle) * speed * (0.5 + Math.random()) 
        };
        this.ctx.particles.push(new Particle({...pos}, vel, color, 2 + Math.random() * 3, 1 + Math.random()));
    }
  }

  spawnVortexParticles(pos: Vector2, color: string, count: number) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const vel = { 
            x: Math.cos(angle) * 150, 
            y: Math.sin(angle) * 150 
        };
        this.ctx.particles.push(new Particle({...pos}, vel, color, 4, 2));
    }
  }

  spawnPiercingRing(pos: Vector2, color: string) {
    for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const vel = { 
            x: Math.cos(angle) * 400, 
            y: Math.sin(angle) * 400 
        };
        this.ctx.particles.push(new Particle({...pos}, vel, color, 2, 3));
    }
  }

  createExplosion(pos: Vector2, damage: number, radius: number) {
    const explosion = new Explosion({...pos}, radius, damage);
    this.ctx.explosions.push(explosion);
  }

  startGame(mode: GameMode = GameMode.OFFLINE_SOLO, mapIndex: number = 0) {
    this.ctx.reset();
    this.ctx.gameState = GameState.PLAYING;
    this.ctx.currentMapIndex = mapIndex;
    this.setupPlayers(mode);
    this.setupMap();
    audio.init();
  }

  startNextLevel() {
    this.ctx.currentMapIndex++;
    this.ctx.gameState = GameState.PLAYING;
    this.ctx.mapPhase = MapPhase.NORMAL;
    this.ctx.waveCount = 0;
    this.ctx.phaseTimer = 0;
    
    // Clear entities but KEEP PLAYERS
    this.ctx.enemies = [];
    this.ctx.bullets = [];
    this.ctx.powerups = [];
    this.ctx.particles = [];
    this.ctx.explosions = [];
    this.ctx.boss = null;
    
    // Position players for next level
    const playersArr = Array.from(this.ctx.players.values());
    playersArr.forEach((p, i) => {
        p.position.x = playersArr.length > 1 ? (CANVAS_WIDTH/2 - 100 + i * 200) : CANVAS_WIDTH/2;
        p.position.y = CANVAS_HEIGHT - 150;
        p.state = PlayerState.ALIVE;
        p.invulnerableTime = 2.0;
    });

    this.setupMap();
  }

  private setupMap() {
    const mapCfg = this.ctx.currentVersion.maps[this.ctx.currentMapIndex];
    this.ctx.mapPhase = MapPhase.NORMAL;
    this.ctx.worldScale = mapCfg.orientation !== MapOrientation.UP ? 0.85 : 1.0;
    
    const progression = MAP_PROGRESSION[this.ctx.currentMapIndex] || MAP_PROGRESSION[0];
    this.spawnController = new SpawnController(progression.zone, this.ctx.currentMapIndex);
    
    this.spawnNextWave();
    this.initEnvironment();
  }

  private spawnNextWave() {
    if (!this.spawnController) return;
    
    if (this.ctx.mapPhase === MapPhase.NORMAL) {
        const wave = this.spawnController.prepareNextWave(this.ctx.waveCount, this.ctx.worldScale);
        const newEnemies = this.spawnEnemiesFromSlots(wave.slots, this.ctx.worldScale);
        this.ctx.enemies.push(...newEnemies);
        this.ctx.waveCount++;
    } else if (this.ctx.mapPhase === MapPhase.ELITE) {
        const wave = this.spawnController.prepareNextWave(10, this.ctx.worldScale);
        const newEnemies = this.spawnEnemiesFromSlots(wave.slots, this.ctx.worldScale, EnemyType.ELITE);
        this.ctx.enemies.push(...newEnemies);
    } else if (this.ctx.mapPhase === MapPhase.BOSS) {
        this.spawnBoss();
    }
  }

  private spawnEnemiesFromSlots(slots: Vector2[], scale: number, forcedType?: EnemyType): Enemy[] {
    return slots.map(slot => {
        return this.spawnController!.spawnEnemiesFromSlots([slot], scale, forcedType)[0];
    });
  }

  private spawnBoss() {
      const progression = MAP_PROGRESSION[this.ctx.currentMapIndex];
      const hp = 5000 + (this.ctx.currentMapIndex * 2500);
      const pos = { x: CANVAS_WIDTH / 2, y: -200 };
      
      if (this.ctx.currentMapIndex === 9) {
          this.ctx.boss = new BossMother(pos, hp * 2, progression.bossName, progression.zone, "#a855f7");
      } else if (progression.zone === ZoneType.VOLCANO) {
          this.ctx.boss = new BossMagmaRooster(pos, hp, progression.bossName, progression.zone, "#ef4444");
      } else {
          this.ctx.boss = new BossChickenKing(pos, hp, progression.bossName, progression.zone, "#fbbf24");
      }
  }

  private setupPlayers(mode: GameMode) {
    this.ctx.players.clear();
    const ids = mode === GameMode.OFFLINE_COOP ? ['p1', 'p2'] : ['p1'];
    ids.forEach((id) => {
      const p = new Player(
        id === 'p1' ? CANVAS_WIDTH/2 - 100 : CANVAS_WIDTH/2 + 100, 
        CANVAS_HEIGHT - 150, 
        id, 
        id === 'p1' ? COLORS.p1Primary : COLORS.p2Primary, 
        id === 'p1' ? COLORS.p1Glow : COLORS.p2Glow
      );
      this.ctx.players.set(id, p);
    });
  }

  initEnvironment() {
    this.ctx.backgroundEntities = [];
    for(let i=0; i<60; i++) {
        this.ctx.backgroundEntities.push(new BackgroundEntity(
            {x: Math.random() * CANVAS_WIDTH, y: Math.random() * CANVAS_HEIGHT},
            {x: 0, y: 100 + Math.random() * 200}, 
            Math.random() * 2, 
            'rgba(255,255,255,0.1)'
        ));
    }
  }

  update(dt: number, input: InputState) {
    if (this.ctx.gameState !== GameState.PLAYING) return;

    this.ctx.updateCombo(dt);
    this.ctx.phaseTimer += dt;
    if (this.ctx.displayScore < this.ctx.score) {
        this.ctx.displayScore += Math.ceil((this.ctx.score - this.ctx.displayScore) * 0.15);
    }

    this.systems.forEach(system => system.update(this, dt, input));

    if (this.ctx.enemies.length === 0 && !this.ctx.boss) {
        if (this.ctx.mapPhase === MapPhase.NORMAL) {
            if (this.ctx.waveCount >= 2) {
                this.ctx.mapPhase = MapPhase.ELITE;
                this.spawnNextWave();
            } else {
                this.spawnNextWave();
            }
        } else if (this.ctx.mapPhase === MapPhase.ELITE) {
            this.ctx.mapPhase = MapPhase.BOSS;
            this.spawnNextWave();
        }
    }

    if (this.ctx.mapPhase === MapPhase.BOSS && this.ctx.boss && this.ctx.boss.hp <= 0) {
        this.ctx.addScore(10000 + (this.ctx.currentMapIndex * 5000), this.ctx.boss.position);
        this.ctx.boss = null;
        this.winMap();
    }

    if (Array.from(this.ctx.players.values()).every(pl => pl.lives <= 0)) {
        this.ctx.gameState = GameState.GAME_OVER;
    }
  }

  private winMap() {
    if (this.ctx.currentMapIndex < this.ctx.currentVersion.maps.length - 1) {
      this.ctx.gameState = GameState.LEVEL_COMPLETE;
    } else {
      this.ctx.gameState = GameState.GAME_OVER;
    }
  }

  drawSplit(bgCtx: CanvasRenderingContext2D, hudCtx: CanvasRenderingContext2D) {
    const mapCfg = this.ctx.currentVersion.maps[this.ctx.currentMapIndex];
    this.mapRenderer.draw(bgCtx, mapCfg, 1/60);
    this.pixiRenderer.sync(this);
    this.ctx.floatingTexts.forEach(ft => ft.draw(hudCtx));
    this.drawHUD(hudCtx, mapCfg);
  }

  private drawHUD(ctx: CanvasRenderingContext2D, map: MapDefinition) {
      ctx.save();
      
      // Combo Display
      if (this.ctx.combo > 1) {
          ctx.textAlign = 'center';
          ctx.font = 'italic 900 64px sans-serif';
          ctx.fillStyle = this.ctx.combo > 20 ? '#facc15' : '#fff';
          ctx.shadowBlur = 15;
          ctx.shadowColor = ctx.fillStyle as string;
          ctx.fillText(`${this.ctx.combo}x COMBO`, CANVAS_WIDTH / 2, 250);
          
          const barW = 300;
          const ratio = this.ctx.comboTimer / this.ctx.COMBO_MAX_TIME;
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fillRect(CANVAS_WIDTH/2 - barW/2, 270, barW, 6);
          ctx.fillStyle = ctx.fillStyle;
          ctx.fillRect(CANVAS_WIDTH/2 - barW/2, 270, barW * ratio, 6);
      }

      ctx.textAlign = 'right';
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`WORLD RECORD: ${this.ctx.highScore.toLocaleString()} PTS`, CANVAS_WIDTH - 60, 60);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'italic 900 86px sans-serif';
      ctx.fillText(this.ctx.displayScore.toLocaleString(), CANVAS_WIDTH - 60, 140);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`MISSION SECTOR ${this.ctx.currentMapIndex + 1}/10`, 60, 60);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'italic 900 72px sans-serif';
      ctx.fillText(map.name.toUpperCase(), 60, 130);
      
      ctx.restore();
  }
}
