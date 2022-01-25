import { t } from "@rbxts/t";

interface OldComponent {
	name: "Old";
	data: {
		[key in Exclude<keyof Components, "Old">]?: Components[key]["data"];
	};

	refValidator: t.check<defined>;
}

declare global {
	interface Components {
		/** The Old Component contains a Map that holds old values of other components */
		Old: OldComponent;
	}
}

export = OldComponent;
