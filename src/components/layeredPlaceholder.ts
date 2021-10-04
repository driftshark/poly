//this file is here so that the layered component util can compile

import { t } from "@rbxts/t";
import { LayeredComponentData } from "componentUtils/layered";
import { defineComponent } from "../../src";

const definition = defineComponent({
	name: "LayeredPlaceholder",
	data: <LayeredComponentData<true>>(<unknown>true),

	refValidator: t.any,
});

declare global {
	interface Components {
		LayeredPlaceholder: typeof definition;
	}
}

export = definition;
