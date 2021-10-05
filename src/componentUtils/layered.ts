import { t } from "@rbxts/t";
import { named } from "util/symbol";
import { merge } from "util/tableUtil";
import { World } from "world";

/** Component with layers that reduce into pure data
 *
 * ### snippet
 * ```ts
 * const data = {
 * 		reduced: {
 * 			layered: true,
 * 			data: true
 * 		},
 * 		layers: {
 * 			layer1: { layered: true },
 * 			layer2: { data: true },
 * 		}
 * 	}
 * ```
 */
export const addLayeredComponent = <
	TRef extends t.static<Components[TComponentName]["refValidator"]>,
	TComponentName extends keyof ExtractMembers<
		Components,
		{ data: LayeredComponentData<unknown> }
	>,
	TData extends Components[TComponentName] extends defined
		? Components[TComponentName]["data"]
		: LayeredComponentData<unknown, unknown>
>(
	world: World,
	ref: TRef,
	componentName: TComponentName,
	layerName: string,
	value: TData extends LayeredComponentData<infer T, infer LayerT>
		? LayerT extends defined
			? LayerT
			: T
		: never,
	reducer: (layers: DeepReadonly<TData["layers"]>) => TData["reduced"]
) => {
	let existingComponent = world.getComponent(ref, componentName) as
		| TData
		| undefined;

	const layers = merge(
		existingComponent ? existingComponent.layers : new Map(),
		new Map([[layerName, value ?? named("None")]])
	);
	const reduced = reducer(layers as DeepReadonly<TData["layers"]>);

	const data = { reduced, layers };
	world.addComponent(
		ref,
		componentName,
		data as Components[TComponentName]["data"]
	);
	return data;
};

export type LayeredComponentData<T, LayerT = void> = {
	reduced: T;
	layers: Map<string, LayerT extends defined ? LayerT : T>;
};
