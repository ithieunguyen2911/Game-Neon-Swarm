
import { Entity } from '../Entities';
import { BaseView } from './views/BaseView';

export class EntityViewRegistry {
    private registry: Map<Entity, BaseView> = new Map();

    get(entity: Entity) { return this.registry.get(entity); }
    register(entity: Entity, view: BaseView) { this.registry.set(entity, view); }
    unregister(entity: Entity) { this.registry.delete(entity); }
    entries() { return this.registry.entries(); }
    clear() { 
        this.registry.forEach(v => v.destroy({ children: true }));
        this.registry.clear(); 
    }
}
