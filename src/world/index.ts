import { t } from "@rbxts/t";
import { ComponentDefinition, ComponentEvent } from "Component";
import symbol from "../util/symbol";
import { System, UpdateSystem } from "System";
import addToConnections from "world/addToConnections";
import fireEvent from "./fireEvent";

const HttpService = game.GetService("HttpService");
const RunService = game.GetService("RunService");

const BASE_SYMBOL = symbol.named("base");

export interface ConnectionTypes<TDefinition extends ComponentDefinition> {
	BaseConnections: {
		[symbolKey in symbol]: {
			[key: string]: <TEvent extends keyof ComponentEvent<TDefinition>>(
				componentEvent: TEvent,
				ref: Ref,
				...args: Parameters<ComponentEvent<TDefinition>[TEvent]>
			) => void;
		};
	};
	EventConnections: {
		[eventKey in keyof ComponentEvent<TDefinition>]?: {
			[key: string]: (
				ref: Ref,
				...args: Parameters<ComponentEvent<TDefinition>[eventKey]>
			) => void;
		};
	};
	RefConnections: {
		[refKey in Exclude<Ref, symbol | keyof ComponentEvent<TDefinition>>]: {
			[key: string]: <TEvent extends keyof ComponentEvent<TDefinition>>(
				componentEvent: TEvent,
				...args: Parameters<ComponentEvent<TDefinition>[TEvent]>
			) => void;
		};
	};
}

export class World {
	public name: string;

	private componentDefinitions: {
		[key in keyof Components]: Components[key];
	};

	private systemInstances: ModuleScript[] = [];
	private systems: System[] = [];
	private updateSystems: UpdateSystem[] = [];

	private refToComponents: Map<Ref, Map<keyof Components, true>> = new Map();
	private componentToRefs: {
		[key in keyof Components]?: Map<
			t.static<Components[key]["refValidator"]>,
			DeepReadonly<Components[key]["data"]>
		>;
	} = {};

	private events: {
		[key in keyof Components]?: ConnectionTypes<
			Components[key]
		>["BaseConnections"] &
			ConnectionTypes<Components[key]>["EventConnections"] &
			ConnectionTypes<Components[key]>["RefConnections"];
	} = {};

	constructor(name: string) {
		this.name = name;

		//@ts-ignore
		this.componentDefinitions = {};

		if (RunService.IsRunning()) {
			RunService.Heartbeat.Connect((dt) => {
				for (const v of this.updateSystems) {
					v.update(this, dt);
				}
			});
		}
	}

	public fireEvent = fireEvent;

	public addComponent<
		TRef extends t.static<Components[TComponentName]["refValidator"]>,
		TComponentName extends keyof Components
	>(
		ref: TRef,
		componentName: TComponentName,
		data: Components[TComponentName]["data"]
	): DeepReadonly<Components[TComponentName]["data"]> {
		if (this.refToComponents.get(ref) === undefined) {
			this.refToComponents.set(ref, new Map());
		}

		this.refToComponents.get(ref)!.set(componentName, true);

		if (!this.componentToRefs[componentName]) {
			//@ts-ignore
			this.componentToRefs[componentName] = new Map();
		}

		//@ts-ignore
		const old = this.componentToRefs[componentName][ref]; //@ts-ignore
		this.componentToRefs[componentName][ref] = data;

		if ((old as string) !== undefined) {
			this.fireEvent(
				componentName,
				"Updated",
				ref,
				data as DeepReadonly<typeof data>,
				old
			);
		} else {
			this.fireEvent(
				componentName,
				"Created",
				ref,
				data as DeepReadonly<typeof data>
			);
		}

		return data as DeepReadonly<Components[TComponentName]["data"]>;
	}

	public getComponent<
		TRef extends t.static<Components[TComponentName]["refValidator"]>,
		TComponentName extends keyof Components
	>(
		ref: TRef,
		componentName: TComponentName
	): DeepReadonly<Components[TComponentName]["data"]> | undefined {
		if (this.componentToRefs[componentName] === undefined) return undefined;

		//@ts-ignore
		return this.componentToRefs[componentName][ref];
	}

	public removeComponent<
		TRef extends t.static<Components[TComponentName]["refValidator"]>,
		TComponentName extends keyof Components
	>(ref: TRef, componentName: TComponentName): void {
		if (this.refToComponents.get(ref)) {
			this.refToComponents.get(ref)!.delete(componentName);

			if (this.refToComponents.get(ref)!.isEmpty()) {
				this.refToComponents.delete(ref);
			}
		}

		if (this.componentToRefs[componentName] !== undefined) {
			//@ts-ignore
			const old = this.componentToRefs[componentName][ref] as
				| Components[TComponentName]["data"]
				| undefined;
			if ((old as string) !== undefined) {
				this.fireEvent(
					componentName,
					"Removing",
					ref,
					old as DeepReadonly<NonNullable<typeof old>>
				);
			}

			//@ts-ignore
			this.componentToRefs[componentName][ref] = undefined;

			if (next(this.componentToRefs[componentName]!)[0] === undefined) {
				this.componentToRefs[componentName] = undefined;
			}
		}

		if (
			this.events[componentName] !== undefined &&
			//@ts-ignore
			this.events[componentName]![ref] !== undefined
		) {
			//@ts-ignore
			this.events[componentName][ref] = undefined;

			if (next(this.events[componentName]!)[0] === undefined) {
				this.events[componentName] = undefined;
			}
		}
	}

	public refsWith<TComponentName extends keyof Components>(
		componentName: TComponentName
	): ReadonlyMap<
		t.static<Components[TComponentName]["refValidator"]>,
		DeepReadonly<Components[TComponentName]["data"]>
	> {
		//@ts-ignore
		return this.componentToRefs[componentName] ?? new Map();
	}

	public componentsOf<TRef extends Ref>(
		ref: TRef
	): ReadonlyMap<
		keyof ExtractMembers<Components, { refValidator: t.check<TRef> }>,
		true
	> {
		//@ts-ignore
		return this.refToComponents.get(ref) ?? new Map();
	}

	public removeRef(ref: Ref): void {
		const refComponents = this.componentsOf(ref);

		for (const [i] of refComponents) {
			this.removeComponent(ref, i);
		}

		//manually checking each component is necessary because you can subscribe to a ref's events even if the component is not on the ref
		for (const [i, v] of pairs(this.events)) {
			if (v[ref as any] !== undefined) {
				//@ts-ignore
				v[ref] = undefined;

				if (next(v)[0] === undefined) {
					this.events[i] = undefined;
				}
			}
		}
	}

	/** The given callback is called whenever a ComponentEvent is fired for any of the Components */
	public onComponent<TComponentName extends keyof Components>(
		componentName: TComponentName,
		callback: ConnectionTypes<
			Components[TComponentName]
		>["BaseConnections"][symbol][string],
		uuid?: string
	): DisconnectFunction {
		return addToConnections(
			this.events,
			componentName,
			BASE_SYMBOL,
			uuid ?? HttpService.GenerateGUID(false),
			callback
		);
	}

	public onComponentEvent<
		TComponentName extends keyof Components,
		TEvent extends keyof ComponentEvent<Components[TComponentName]>
	>(
		componentName: TComponentName,
		componentEvent: TEvent,
		callback: Required<
			ConnectionTypes<Components[TComponentName]>["EventConnections"]
		>[TEvent][string],
		uuid?: string
	): DisconnectFunction {
		return addToConnections(
			this.events,
			componentName,
			componentEvent,
			uuid ?? HttpService.GenerateGUID(false),
			callback
		);
	}

	/** !IMPORTANT! Make sure you manually call `removeRef()` or use the cleanup function to clean up  */
	public onRef<TComponentName extends keyof Components>(
		componentName: TComponentName,
		ref: t.static<Components[TComponentName]["refValidator"]>,
		callback: ConnectionTypes<
			Components[TComponentName]
		>["RefConnections"][any][string],
		uuid?: string
	): DisconnectFunction {
		return addToConnections(
			this.events,
			componentName,
			ref,
			uuid ?? HttpService.GenerateGUID(false),
			callback
		);
	}

	public registerComponent(componentDefinition: ComponentDefinition): void {
		//@ts-ignore
		this.componentDefinitions[componentDefinition.name] = componentDefinition;
	}

	public registerSystems(inSystems: (Instance | System)[]): void {
		for (const v of inSystems) {
			if (typeIs(v, "Instance") ? v.IsA("ModuleScript") : typeIs(v, "table")) {
				let system: System;
				if (typeIs(v, "Instance")) {
					system = (
						require(v as ModuleScript) as ReturnType<
							typeof import("../createSystem").default
						>
					)();

					if (RunService.IsStudio()) {
						this.systemInstances.push(v as ModuleScript);
					}
				} else {
					system = v;
				}
				this.systems.push(system);

				if (system.onRegistered) system.onRegistered(this);
				if (system.init) system.init(this);
				if (system.update) this.updateSystems.push(system as UpdateSystem);
			}
		}

		this.updateSystems.sort((a, b) => {
			return (a.priority ?? 0) > (b.priority ?? 0);
		});
	}
}
