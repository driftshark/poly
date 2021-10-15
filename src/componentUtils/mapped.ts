import { t } from "@rbxts/t";
import { named } from "@driftshark/symbol";
import { merge } from "@driftshark/table";
import { World } from "world";

/** Component that maps keys to data of that component
 *
 * ### snippet
 * ```ts
 * const data = {
 * 		key1: { pure: true, data: true },
 * 		key2: { pure: true, data: true },
 * 	}
 * ```
 */
export const addMappedComponent = <
	TRef extends t.static<Components[TComponentName]["refValidator"]>,
	TComponentName extends keyof ExtractMembers<
		Components,
		{ data: MappedComponentData<unknown> }
	>,
	TKey extends keyof Components[TComponentName]["data"]
>(
	world: World,
	ref: TRef,
	componentName: TComponentName,
	key: TKey,
	value: Components[TComponentName]["data"][TKey] | undefined
) => {
	let existingComponent = world.getComponent(ref, componentName);
	if (existingComponent === undefined) {
		existingComponent = world.addComponent(ref, componentName, {});
	}

	const data = merge(existingComponent!, {
		[key]: value ?? named("None"),
	});

	world.addComponent(ref, componentName, data);
	return data;
};

export type MappedComponentData<T, TKey = void> =
	| {
			[key in any]?: T;
	  }
	| Map<TKey extends void ? any : TKey, T>;
