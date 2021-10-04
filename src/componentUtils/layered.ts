import { t } from "@rbxts/t";
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
	>
>(
	world: World,
	ref: TRef,
	componentName: TComponentName,
	layerName: string,
	value: Components[TComponentName]["data"] extends LayeredComponentData<
		infer T,
		infer LayerT
	>
		? LayerT extends defined
			? LayerT
			: T
		: never,
	reducer: (
		layers: DeepReadonly<Components[TComponentName]["data"]>["layers"]
	) => Components[TComponentName]["data"]["reduced"]
) => {
	let existingComponent = world.getComponent(ref, componentName) as
		| DeepReadonly<Components[TComponentName]["data"]>
		| undefined;

	const layers = merge(
		existingComponent
			? existingComponent.layers
			: (new Map() as Components[TComponentName]["data"]["layers"]),
		new Map([[layerName, value]])
	);
	const reduced = reducer(layers);

	const data = { reduced, layers };
	world.addComponent(ref, componentName, data);
	return data;
};

export type LayeredComponentData<T, LayerT = void> = {
	reduced: T;
	layers: Map<string, LayerT extends defined ? LayerT : T>;
};
