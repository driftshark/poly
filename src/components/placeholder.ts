/*
this must be done because if there are no layered components in the package, TypeScript will compile

src/componentUtils/layered.ts
	ExtractKeys<
		Components,
		{ data: LayeredComponentData<unknown> }
	>
to never

additionally, if only one definition is in Components, TypeScript will compile the aforementioned type to just the literal of the name of that one Component
*/

import { t } from "@rbxts/t";
import { LayeredComponentData } from "componentUtils/layered";
import defineComponent from "../../src/defineComponent";

const layeredPlaceholderDefinition = defineComponent({
	name: "_lp",
	data: <LayeredComponentData<true>>(<unknown>true),

	refValidator: t.any,
});

const layeredPlaceholderDefinition2 = defineComponent({
	name: "_lp2",
	data: <LayeredComponentData<true, true>>(<unknown>true),

	refValidator: t.any,
});

declare global {
	interface Components {
		_lp: typeof layeredPlaceholderDefinition;
		_lp2: typeof layeredPlaceholderDefinition2;
	}
}
