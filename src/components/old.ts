import { t } from "@rbxts/t";
import defineComponent from "../../src/defineComponent";

const definition = defineComponent({
	name: "Old",
	data: <
		{
			[key in Exclude<keyof Components, "Old">]?: Components[key]["data"];
		}
	>true,

	refValidator: t.any,
});

declare global {
	interface Components {
		/** The Old Component contains a Map that holds old values of other components */
		Old: typeof definition;
	}
}

export = definition;
