
import { WorldContext } from '../WorldContext';
import { GameSystem } from './GameSystem';
import { InputState, PlayerState } from '../../types';
import { WeaponSystem } from '../WeaponSystem';
import { audio } from '../../services/AudioSynthesizer';
import { FloatingText } from '../entities/BaseEntity';

export class CombatSystem implements GameSystem {
    update(engine: any, dt: number, input: InputState) {
        const ctx: WorldContext = engine.ctx;
        
        ctx.players.forEach(p => {
            if (p.state !== PlayerState.ALIVE) return;
            const pInput = p.id === 'p1' ? input.p1 : input.p2;
            
            p.fireTimer = (p.fireTimer || 0) - dt;
            if (pInput.shooting && p.fireTimer <= 0 && !p.isOverheated) {
                const projs = WeaponSystem.fire(p.position.x, p.position.y, p.weaponType, p.weaponLevel, p.id, p.primaryColor);
                projs.forEach(proj => ctx.bullets.push(proj));
                audio.playShoot();
                
                p.overloadValue += WeaponSystem.getOverloadPerShot(p.weaponType, p.weaponLevel);
                if (p.overloadValue >= 100) {
                    p.overloadValue = 100;
                    p.isOverheated = true;
                    audio.playExplosion();
                    ctx.floatingTexts.push(new FloatingText(p.position.x, p.position.y, "CRITICAL HEAT", "#ef4444", 30));
                }
                p.fireTimer = WeaponSystem.getFireRate(p.weaponType, p.weaponLevel);
            }
        });
    }
}
