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
	TComponentName extends ExtractKeys<
		Components,
		{
			data:
				| MappedComponentData<unknown, unknown>
				| {
						[key in any]?: unknown;
				  };
		}
	>,
	TKey extends Components[TComponentName]["data"] extends ReadonlyMap<
		infer K,
		infer _V
	>
		? K
		: keyof Components[TComponentName]["data"],
	TValue extends Components[TComponentName]["data"] extends ReadonlyMap<
		infer _K,
		infer V
	>
		? V
		: Components[TComponentName]["data"][keyof Components[TComponentName]["data"]]
>(
	world: World,
	ref: TRef,
	componentName: TComponentName,
	key: TKey,
	value: TValue | undefined
) => {
	let existingComponent = world.getComponent(ref, componentName);
	if (existingComponent === undefined) {
		existingComponent = world.addComponent(ref, componentName, {});
	}

	const data = merge(existingComponent!, {
		[key as any]: value ?? named("None"),
	});

	world.addComponent(ref, componentName, data);
	return data;
};

export type MappedComponentData<TKey, T> = Map<TKey, T>;
