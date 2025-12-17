import { Entity, Player, Bullet, Enemy, Particle, PowerUp, BackgroundEntity } from './Entities';
import { GameState, GameMode, InputState, Vector2, ZoneType, WeaponType, PowerUpType, PlayerInput } from '../types';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  PLAYER_SPEED, 
  PLAYER_DRAG, 
  COLORS,
  MAX_WEAPON_LEVEL,
  ENEMY_SPAWN_RATE_INITIAL,
  ENEMY_BASE_SPEED,
  ENEMY_SIZE,
  ZONE_CONFIGS,
  WEAPON_CONFIGS
} from '../constants';
import { audio } from '../services/AudioSynthesizer';
// import { multiplayer } from '../services/MultiplayerService'; // COMMENTED OUT ONLINE

export class GameEngine {
  gameState: GameState = GameState.MENU;
  gameMode: GameMode = GameMode.OFFLINE_SOLO;
  score: number = 0;
  highScore: number = 0;
  level: number = 1;
  currentZone: ZoneType = ZoneType.SKY;
  
  // Players Map (ID -> Player)
  players: Map<string, Player> = new Map();
  localPlayerIds: string[] = []; // Tracks which IDs are controlled locally

  bullets: Bullet[] = [];
  enemies: Enemy[] = [];
  particles: Particle[] = [];
  powerups: PowerUp[] = [];
  backgroundEntities: BackgroundEntity[] = [];

  lastTime: number = 0;
  fireTimer: Map<string, number> = new Map(); // Fire timer per player ID
  enemySpawnTimer: number = 0;
  levelTimer: number = 0;
  levelDuration: number = 45; 
  currentSpawnRate: number = ENEMY_SPAWN_RATE_INITIAL;
  
  screenShake: number = 0;
  
  // Network throttle
  lastBroadcast: number = 0;

  constructor() {
    this.localPlayerIds = ['p1'];
    // CRITICAL FIX: Initialize a player immediately so the draw loop has something to render during MENU state.
    // This prevents the "Black Screen" issue where the map is empty but the loop is running.
    this.players.set('p1', new Player(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 'p1', COLORS.player));
    this.initEnvironment();

    const saved = localStorage.getItem('neon_swarm_highscore');
    if (saved) this.highScore = parseInt(saved, 10);
  }

  // Safe getter for main player to prevent crashes
  get mainPlayer(): Player | undefined {
      if (this.localPlayerIds.length > 0) {
          return this.players.get(this.localPlayerIds[0]);
      }
      return undefined;
  }

  setupGame(mode: GameMode, zone: ZoneType) {
      this.gameMode = mode;
      this.currentZone = zone;
      this.players.clear();
      this.localPlayerIds = [];
      this.bullets = [];
      this.enemies = [];
      this.powerups = [];
      this.particles = [];
      
      // Setup Players based on Mode
      if (mode === GameMode.OFFLINE_SOLO) {
          this.localPlayerIds.push('p1');
          this.players.set('p1', new Player(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 'p1', COLORS.player));
      } else if (mode === GameMode.OFFLINE_COOP) {
          this.localPlayerIds.push('p1');
          this.localPlayerIds.push('p2');
          this.players.set('p1', new Player(CANVAS_WIDTH/3, CANVAS_HEIGHT/2, 'p1', COLORS.player));
          this.players.set('p2', new Player(2*CANVAS_WIDTH/3, CANVAS_HEIGHT/2, 'p2', COLORS.player2)); // Green
      } 
      
      this.fireTimer.clear();
      this.localPlayerIds.forEach(id => this.fireTimer.set(id, 0));
  }

  startGame(mode: GameMode = GameMode.OFFLINE_SOLO, zone: ZoneType = ZoneType.SKY, resetScore: boolean = true) {
    this.gameState = GameState.PLAYING;
    
    if (resetScore) {
      this.score = 0;
      this.level = 1;
      this.setupGame(mode, zone);
    } else {
        // Next Level: Reposition players but KEEP Weapon state and Lives
        this.currentZone = zone;
        const offset = CANVAS_WIDTH / (this.localPlayerIds.length + 1);
        this.localPlayerIds.forEach((id, index) => {
            const p = this.players.get(id);
            if (p) {
                // If they were dead, they respawn with 1 life to play the next level
                if (p.isDead) {
                    p.isDead = false;
                    p.lives = 1; 
                }
                p.position = { x: offset * (index + 1), y: CANVAS_HEIGHT - 100 };
                p.invulnerableTime = 2; // Safety buffer
            }
        });
    }

    this.levelTimer = this.levelDuration;
    this.currentSpawnRate = ENEMY_SPAWN_RATE_INITIAL / (1 + (this.level * 0.1));
    
    audio.init();
    this.backgroundEntities = [];
    this.initEnvironment();
  }

  stopGame() {
    this.gameState = GameState.MENU;
    this.bullets = [];
    this.enemies = [];
    this.powerups = [];
    this.particles = [];
    // Keep environment and players for background visual
  }

  initEnvironment() {
    const config = ZONE_CONFIGS[this.currentZone] || ZONE_CONFIGS.SKY; // Safety fallback
    for(let i=0; i<8; i++) {
        const x = Math.random() * CANVAS_WIDTH;
        const y = Math.random() * CANVAS_HEIGHT;
        const size = 100 + Math.random() * 150;
        this.backgroundEntities.push(new BackgroundEntity(
            {x, y},
            {x: config.physics.wind.x * 0.1, y: 10}, 
            size,
            config.colors.secondary + '33', 
            'CLOUD'
        ));
    }
    for(let i=0; i<30; i++) {
        const x = Math.random() * CANVAS_WIDTH;
        const y = Math.random() * CANVAS_HEIGHT;
        this.spawnBackgroundEntity(x, y);
    }
  }

  spawnBackgroundEntity(x: number, y: number) {
    const config = ZONE_CONFIGS[this.currentZone] || ZONE_CONFIGS.SKY;
    const size = 2 + Math.random() * 2;
    const speedY = 10 + Math.random() * 30; 
    const speedX = config.physics.wind.x * 0.2;

    this.backgroundEntities.push(new BackgroundEntity(
        {x, y},
        {x: speedX, y: speedY},
        size,
        Math.random() > 0.5 ? '#ffffff' : config.colors.particle,
        'EMBER'
    ));
  }

  update(dt: number, input: InputState) {
    // Check Pause
    if (this.gameState === GameState.PAUSED) return;

    if (this.gameState !== GameState.PLAYING) return;

    this.levelTimer -= dt;
    if (this.levelTimer <= 0) {
        this.completeLevel();
        return;
    }

    this.applyEnvironment(dt);

    // Update Local Players & Handle Life Sharing
    this.localPlayerIds.forEach(id => {
        const p = this.players.get(id);
        const pInput = (id === 'p2' && this.gameMode === GameMode.OFFLINE_COOP) ? input.p2 : input.p1;

        if (p) {
            // Life Sharing Logic
            if (p.isDead && (pInput.shooting || pInput.usePointer)) {
                // Find a teammate with spare lives
                const donorId = this.localPlayerIds.find(pid => pid !== id);
                if (donorId) {
                    const donor = this.players.get(donorId);
                    if (donor && !donor.isDead && donor.lives > 1) {
                        donor.lives--;
                        p.lives = 1;
                        p.isDead = false;
                        p.invulnerableTime = 3;
                        p.position = { ...donor.position, y: donor.position.y + 50 }; // Respawn near donor
                        audio.playPowerup(); // Sound for revival
                        this.spawnParticles(p.position, '#ffffff', 20);
                    }
                }
            }

            if (!p.isDead) {
                this.handlePlayerMovement(p, dt, pInput);
                this.handlePlayerShooting(p, dt, pInput);
            }
        }
    });

    // Spawning
    this.enemySpawnTimer -= dt;
    if (this.enemySpawnTimer <= 0) {
      this.spawnEnemy();
      this.enemySpawnTimer = this.currentSpawnRate;
    }

    if (Math.random() < 0.1) { 
        this.spawnBackgroundEntity(Math.random() * CANVAS_WIDTH, -20);
    }

    // Update Entities
    this.bullets.forEach(b => b.update(dt));
    this.enemies.forEach(e => {
        e.update(dt);
        // Enemy Shooting Logic (Egg Laying)
        if (e.shootTimer <= 0 && !e.isDead && e.position.y > 50 && e.position.y < CANVAS_HEIGHT - 100) {
            // Lay egg
            this.bullets.push(new Bullet(
                {x: e.position.x, y: e.position.y + 10},
                {x: 0, y: 300}, // Downwards
                WeaponType.BLASTER, // Generic type for shape
                '#ffffff',
                1,
                'enemy',
                true // IS ENEMY
            ));
            e.shootTimer = 4 + Math.random() * 4; // Reset timer
        }
    });
    this.particles.forEach(p => p.update(dt));
    this.powerups.forEach(p => p.update(dt));
    this.backgroundEntities.forEach(b => b.update(dt));

    this.checkCollisions();
    this.cullEntities();

    if (this.screenShake > 0) {
      this.screenShake -= dt * 30; 
      if (this.screenShake < 0) this.screenShake = 0;
    }

    // Game Over Check: If all local players are dead (lives <= 0)
    const aliveLocal = this.localPlayerIds.filter(id => {
        const p = this.players.get(id);
        return p && !p.isDead;
    });
    if (aliveLocal.length === 0 && this.localPlayerIds.length > 0) {
        this.gameOver();
    }
  }

  applyEnvironment(dt: number) {
    const config = ZONE_CONFIGS[this.currentZone] || ZONE_CONFIGS.SKY;
    if (config.physics.wind.x !== 0 || config.physics.wind.y !== 0) {
        this.players.forEach(p => {
            if (!p.isRemote) {
                p.velocity.x += config.physics.wind.x * dt;
                p.velocity.y += config.physics.wind.y * dt;
            }
        });
        
        this.enemies.forEach(e => {
            e.velocity.x += config.physics.wind.x * dt * 0.5;
            e.velocity.y += config.physics.wind.y * dt * 0.5;
        });
    }

    if (config.physics.heatCurve && config.physics.heatCurve > 0) {
        this.bullets.forEach(b => {
            if (!b.isEnemy) { // Enemy eggs fall down, unaffected by heat updraft usually
                b.velocity.y -= config.physics.heatCurve * dt;
            }
        });
    }
  }

  handlePlayerMovement(p: Player, dt: number, input: PlayerInput) {
    const acc = { x: 0, y: 0 };
    if (input.left) acc.x -= 1;
    if (input.right) acc.x += 1;
    if (input.up) acc.y -= 1;
    if (input.down) acc.y += 1;

    if (input.usePointer && input.pointer) {
      const dx = input.pointer.x - p.position.x;
      const dy = input.pointer.y - p.position.y;
      
      const responseSpeed = 15;
      const targetVelX = dx * responseSpeed;
      const targetVelY = dy * responseSpeed;
      const smoothFactor = 0.4;
      
      p.velocity.x = p.velocity.x * (1 - smoothFactor) + targetVelX * smoothFactor;
      p.velocity.y = p.velocity.y * (1 - smoothFactor) + targetVelY * smoothFactor;
    } else {
        if (acc.x !== 0 || acc.y !== 0) {
          const len = Math.sqrt(acc.x * acc.x + acc.y * acc.y);
          acc.x /= len;
          acc.y /= len;
          
          p.velocity.x += acc.x * PLAYER_SPEED * dt * 10;
          p.velocity.y += acc.y * PLAYER_SPEED * dt * 10;
        }
        const drag = ZONE_CONFIGS[this.currentZone].physics.drag || PLAYER_DRAG;
        p.velocity.x *= drag;
        p.velocity.y *= drag;
    }

    p.update(dt);
    p.position.x = Math.max(p.radius, Math.min(CANVAS_WIDTH - p.radius, p.position.x));
    p.position.y = Math.max(p.radius, Math.min(CANVAS_HEIGHT - p.radius, p.position.y));
  }

  handlePlayerShooting(p: Player, dt: number, input: PlayerInput) {
    let timer = this.fireTimer.get(p.id) || 0;
    timer -= dt;
    
    if ((input.shooting || input.usePointer) && timer <= 0) {
      this.fireBulletForPlayer(p);
      const config = WEAPON_CONFIGS[p.weaponType];
      // Faster fire rate at higher levels
      const levelMod = Math.min(0.1, p.weaponLevel * 0.02);
      timer = Math.max(0.05, config.fireRate - levelMod);
    }
    this.fireTimer.set(p.id, timer);
  }

  fireBulletForPlayer(p: Player) {
    if (!p.isRemote) audio.playShoot(); 
    
    const wConfig = WEAPON_CONFIGS[p.weaponType];
    const level = p.weaponLevel; // 1 to MAX (5)
    const speed = wConfig.speed;
    const bulletColor = p.color === COLORS.player ? wConfig.color : p.color;
    
    // Damage increases slightly per level
    const dmg = wConfig.damage + ((level - 1) * 0.5);
    const shootY = p.position.y - 15; 
    const px = p.position.x;

    if (p.weaponType === WeaponType.BLASTER) {
        // Level 1: 1 stream
        // Level 2: 3 streams (narrow)
        // Level 3: 3 streams (wide)
        // Level 4: 5 streams
        // Level 5: 7 streams (wall of fire)
        const count = level === 1 ? 1 : (level === 2 ? 3 : (level === 3 ? 3 : (level === 4 ? 5 : 7)));
        const spread = level === 2 ? 5 : 10;
        
        // Always have a center one
        this.bullets.push(new Bullet({x: px, y: shootY}, {x: 0, y: -speed}, WeaponType.BLASTER, bulletColor, dmg, p.id));
        
        if (count >= 3) {
            this.bullets.push(new Bullet({x: px - spread, y: shootY + 5}, {x: -20, y: -speed}, WeaponType.BLASTER, bulletColor, dmg, p.id));
            this.bullets.push(new Bullet({x: px + spread, y: shootY + 5}, {x: 20, y: -speed}, WeaponType.BLASTER, bulletColor, dmg, p.id));
        }
        if (count >= 5) {
            this.bullets.push(new Bullet({x: px - spread*2, y: shootY + 10}, {x: -40, y: -speed}, WeaponType.BLASTER, bulletColor, dmg, p.id));
            this.bullets.push(new Bullet({x: px + spread*2, y: shootY + 10}, {x: 40, y: -speed}, WeaponType.BLASTER, bulletColor, dmg, p.id));
        }
        if (count >= 7) {
            this.bullets.push(new Bullet({x: px - spread*3, y: shootY + 15}, {x: -80, y: -speed}, WeaponType.BLASTER, bulletColor, dmg, p.id));
            this.bullets.push(new Bullet({x: px + spread*3, y: shootY + 15}, {x: 80, y: -speed}, WeaponType.BLASTER, bulletColor, dmg, p.id));
        }
    } 
    else if (p.weaponType === WeaponType.SHOTGUN) {
        // Massive spread increase
        const count = 3 + (level * 2); // L1: 5, L2: 7, L3: 9...
        const arc = Math.PI / (3.5 - (level * 0.2)); // Wider arc per level
        
        for(let i=0; i<count; i++) {
            const angle = -Math.PI/2 - (arc/2) + (arc * (i/(count-1)));
            this.bullets.push(new Bullet(
                {x: px, y: shootY},
                {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed},
                WeaponType.SHOTGUN,
                bulletColor,
                dmg,
                p.id
            ));
        }
        if (!p.isRemote) this.screenShake += (1 + level);
    }
    else if (p.weaponType === WeaponType.HELIX) {
        // L1: 2 streams
        // L2: 2 streams + 1 center
        // L3: 4 streams
        // L4: 4 streams + 1 center
        // L5: 6 streams
        
        // Base Helix Pair
        this.bullets.push(new Bullet({x: px - 15, y: shootY}, {x: 0, y: -speed}, WeaponType.HELIX, bulletColor, dmg, p.id));
        this.bullets.push(new Bullet({x: px + 15, y: shootY}, {x: 0, y: -speed}, WeaponType.HELIX, bulletColor, dmg, p.id)); 
        
        if (level === 2 || level === 4 || level >= 5) {
             // Center beam
             this.bullets.push(new Bullet({x: px, y: shootY}, {x: 0, y: -speed*1.2}, WeaponType.BLASTER, '#ffffff', dmg, p.id));
        }
        
        if (level >= 3) {
             // Wide Helix Pair
            this.bullets.push(new Bullet({x: px - 30, y: shootY+10}, {x: 0, y: -speed*0.9}, WeaponType.HELIX, bulletColor, dmg, p.id));
            this.bullets.push(new Bullet({x: px + 30, y: shootY+10}, {x: 0, y: -speed*0.9}, WeaponType.HELIX, bulletColor, dmg, p.id)); 
        }

        if (level >= 5) {
             // Extra Wide
            this.bullets.push(new Bullet({x: px - 45, y: shootY+20}, {x: 0, y: -speed*0.8}, WeaponType.HELIX, bulletColor, dmg, p.id));
            this.bullets.push(new Bullet({x: px + 45, y: shootY+20}, {x: 0, y: -speed*0.8}, WeaponType.HELIX, bulletColor, dmg, p.id)); 
        }
    }
    else if (p.weaponType === WeaponType.ROCKET) {
        // L1: 1
        // L2: 3
        // L3: 3 (homing/stronger)
        // L4: 5
        // L5: 7
        
        // Center Rocket
        this.bullets.push(new Bullet({x: px, y: shootY}, {x: 0, y: -speed * 0.5}, WeaponType.ROCKET, bulletColor, dmg * 2, p.id));
        
        if (level >= 2) {
            this.bullets.push(new Bullet({x: px - 20, y: shootY + 10}, {x: -100, y: -speed * 0.5}, WeaponType.ROCKET, bulletColor, dmg * 2, p.id));
            this.bullets.push(new Bullet({x: px + 20, y: shootY + 10}, {x: 100, y: -speed * 0.5}, WeaponType.ROCKET, bulletColor, dmg * 2, p.id));
        }

        if (level >= 4) {
             this.bullets.push(new Bullet({x: px - 40, y: shootY + 20}, {x: -200, y: -speed * 0.5}, WeaponType.ROCKET, bulletColor, dmg * 2, p.id));
             this.bullets.push(new Bullet({x: px + 40, y: shootY + 20}, {x: 200, y: -speed * 0.5}, WeaponType.ROCKET, bulletColor, dmg * 2, p.id));
        }

        if (level >= 5) {
             // Side firing rockets!
             this.bullets.push(new Bullet({x: px - 40, y: shootY + 20}, {x: -400, y: -speed * 0.3}, WeaponType.ROCKET, bulletColor, dmg * 2, p.id));
             this.bullets.push(new Bullet({x: px + 40, y: shootY + 20}, {x: 400, y: -speed * 0.3}, WeaponType.ROCKET, bulletColor, dmg * 2, p.id));
        }
    }
  }

  spawnEnemy() {
    const edge = Math.floor(Math.random() * 3); 
    let x, y;
    
    if (edge === 0) { x = Math.random() * CANVAS_WIDTH; y = -30; }
    else if (edge === 1) { x = -30; y = Math.random() * CANVAS_HEIGHT * 0.5; }
    else { x = CANVAS_WIDTH + 30; y = Math.random() * CANVAS_HEIGHT * 0.5; }

    const angle = Math.atan2(CANVAS_HEIGHT - y, (CANVAS_WIDTH/2) - x);
    const speed = ENEMY_BASE_SPEED * (1 + Math.random() * 0.5); 
    const hp = 1 + Math.floor(this.score / 2000) + (this.level - 1);

    this.enemies.push(new Enemy(
      { x, y },
      { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      hp,
      ENEMY_SIZE + (this.level * 2), 
      this.currentZone
    ));
  }

  checkCollisions() {
    // Bullets (Player) vs Enemies
    for (const b of this.bullets) {
      if (b.isEnemy) continue; // Skip enemy bullets here

      for (const e of this.enemies) {
        if (this.checkCircleCollision(b, e)) {
          b.isDead = true;
          e.hp -= b.damage;
          e.hit(); 
          e.velocity.y -= 100;
          
          this.spawnParticles(b.position, b.color, 3);

          if (e.hp <= 0) {
            e.isDead = true;
            this.killEnemy(e);
          }
          if (b.type !== WeaponType.HELIX) break; 
          break;
        }
      }
    }

    // Powerups (Any Local Player)
    for (const p of this.powerups) {
      this.localPlayerIds.forEach(id => {
          const player = this.players.get(id);
          if (player && !player.isDead && !p.isDead) {
              if (this.checkCircleCollision(player, p)) {
                  p.isDead = true;
                  this.collectPowerup(player, p);
              }
          }
      });
    }

    // Player vs Enemies & Enemy Bullets
    this.localPlayerIds.forEach(id => {
        const p = this.players.get(id);
        if (p && !p.isDead && p.invulnerableTime <= 0) {
            
            // Vs Enemies (Body Slam)
            for (const e of this.enemies) {
                if (this.checkCircleCollision(p, e)) {
                    this.playerHit(p);
                    e.hp = 0; // Enemy dies on impact
                    e.isDead = true;
                    this.killEnemy(e);
                    break;
                }
            }

            // Vs Enemy Bullets (Eggs)
            for (const b of this.bullets) {
                if (b.isEnemy && !b.isDead) {
                    if (this.checkCircleCollision(p, b)) {
                        b.isDead = true;
                        this.playerHit(p);
                        break;
                    }
                }
            }
        }
    });
  }

  playerHit(p: Player) {
      p.lives--;
      this.screenShake = 20;
      audio.playExplosion();
      this.spawnParticles(p.position, p.color, 20);

      if (p.lives > 0) {
          // Respawn behavior
          p.invulnerableTime = 2.0;
          // Push back to center-ish bottom
          p.velocity = {x: 0, y: -200};
      } else {
          p.isDead = true;
      }
  }

  checkCircleCollision(a: Entity, b: Entity): boolean {
    const dx = a.position.x - b.position.x;
    const dy = a.position.y - b.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < (a.radius + b.radius);
  }

  killEnemy(e: Enemy) {
    this.score += e.scoreValue;
    this.screenShake = 5; 
    audio.playExplosion();
    const zoneColor = ZONE_CONFIGS[this.currentZone].colors.particle;
    this.spawnParticles(e.position, zoneColor, 10);
    this.spawnParticles(e.position, '#ffffff', 5); 

    // Drop logic: 10% chance
    if (Math.random() < 0.1) { 
       // 15% chance for a Heart if lives < 5, else default to weapon
       let type = PowerUpType.WEAPON;
       if (Math.random() < 0.15) {
           type = PowerUpType.HEART;
       }
       this.powerups.push(new PowerUp({ ...e.position }, type));
    }
  }

  collectPowerup(p: Player, powerup: PowerUp) {
    audio.playPowerup();
    this.score += 500;
    
    if (powerup.kind === PowerUpType.HEART) {
        if (p.lives < 5) p.lives++;
        this.spawnParticles(p.position, '#ef4444', 10);
    } else {
        // Weapon Logic:
        // If same type: Level Up
        // If diff type: Switch Type, BUT KEEP LEVEL
        if (p.weaponType === powerup.weaponType) {
            if (p.weaponLevel < MAX_WEAPON_LEVEL) {
                p.weaponLevel++;
            }
        } else {
            p.weaponType = powerup.weaponType;
            // Keep existing p.weaponLevel
        }
        this.spawnParticles(p.position, COLORS.powerup, 10);
    }
  }

  spawnParticles(pos: Vector2, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 150 + 50;
      this.particles.push(new Particle(
        { ...pos },
        { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        color,
        Math.random() * 4 + 2,
        Math.random() * 3 + 1 
      ));
    }
  }

  cullEntities() {
    this.bullets = this.bullets.filter(b => !b.isDead && b.position.y > -50 && b.position.y < CANVAS_HEIGHT + 50 && b.position.x > -50 && b.position.x < CANVAS_WIDTH + 50);
    this.enemies = this.enemies.filter(e => !e.isDead && e.position.y < CANVAS_HEIGHT + 100);
    this.particles = this.particles.filter(p => !p.isDead);
    this.powerups = this.powerups.filter(p => !p.isDead && p.position.y < CANVAS_HEIGHT + 50);
    this.backgroundEntities = this.backgroundEntities.filter(b => {
        const isOut = b.position.x < -200 || b.position.x > CANVAS_WIDTH + 200 || b.position.y < -200 || b.position.y > CANVAS_HEIGHT + 200;
        return !isOut;
    });
  }

  completeLevel() {
    this.gameState = GameState.LEVEL_COMPLETE;
    this.level++;
    this.bullets = [];
    this.enemies = [];
    this.powerups = [];
  }

  gameOver() {
    this.gameState = GameState.GAME_OVER;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('neon_swarm_highscore', this.highScore.toString());
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Safety check for zone config
    const config = ZONE_CONFIGS[this.currentZone] || ZONE_CONFIGS.SKY;

    // Background Color
    ctx.fillStyle = config.colors.background;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Screen Shake
    ctx.save();
    if (this.screenShake > 0) {
      const dx = (Math.random() - 0.5) * this.screenShake;
      const dy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(dx, dy);
    }

    this.backgroundEntities.forEach(b => b.draw(ctx));
    this.powerups.forEach(p => p.draw(ctx));
    this.particles.forEach(p => p.draw(ctx));
    this.enemies.forEach(e => e.draw(ctx));
    this.bullets.forEach(b => b.draw(ctx));
    
    // Draw players
    if (this.gameState !== GameState.GAME_OVER) {
        this.players.forEach(p => {
             p.draw(ctx);
        });
    }

    ctx.restore();
  }
}