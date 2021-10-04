import { t } from "@rbxts/t";
import { MappedComponentData } from "componentUtils/mapped";
import { defineComponent } from "../../src";

const definition = defineComponent({
	name: "ReplicationGroup",
	data: <MappedComponentData<string, string | symbol>>(<unknown>true),
	refValidator: t.any,
});

declare global {
	interface Components {
		/** The ReplicationGroup Component holds the ReplicationGroups that other Components on this Entity should fall under
		 *
		 * Data is a Map of Component name OR symbol.named("base") to ReplicationGroupId
		 */
		ReplicationGroup: typeof definition;
	}
}

export = definition;
