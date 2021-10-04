import { World } from "world";

export interface System {
	/** Priorities are ordered in descending fashion */
	priority?: number;

	onRegistered?: (world: World) => void;

	//lifecycles

	/** Lifecycle update function that is run on every Heartbeat */
	update?: (world: World, dt: number) => void;

	/** Lifecycle init function. Mainly used for hot reloading Systems that listen to component events */
	init?: (world: World) => void;
	/** Lifecycle destroy function. Mainly used for hot reloading Systems that listen to component events */
	destroy?: (world: World) => void;
}

export interface UpdateSystem extends System {
	update: (world: World, dt: number) => void;
}
