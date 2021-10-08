import { t } from "@rbxts/t";
import { defineComponent } from "../../src";

const definition = defineComponent({
	name: "ReplicationGroup",
	data: <{ [key in keyof Components]?: string }>(<unknown>true),
	refValidator: t.any,
});

declare global {
	interface Components {
		/** The ReplicationGroup Component holds the ReplicationGroups that other Components on this Entity should fall under
		 *
		 * Data is a Map of Component name to ReplicationGroupId
		 */
		ReplicationGroup: typeof definition;
	}
}

export = definition;
