import { t } from "@rbxts/t";
import { MappedComponentData } from "componentUtils/mapped";
import { defineComponent } from "../../src";

const definition = defineComponent({
	name: "ReplicationSubscription",
	data: <MappedComponentData<boolean, string>>(<unknown>true),

	refValidator: t.instanceIsA("Player"),
});

declare global {
	interface Components {
		/** The ReplicationSubscription Component holds a Map of ReplicationGroupIds that the player is subscribed to
		 *
		 * Data is a Map of ReplicationGroupId to true
		 */
		ReplicationSubscription: typeof definition;
	}
}

export = definition;
