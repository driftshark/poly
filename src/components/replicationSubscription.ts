import { t } from "@rbxts/t";
import defineComponent from "../../src/defineComponent";

const definition = defineComponent({
	name: "ReplicationSubscription",
	data: <Map<string, boolean>>(<unknown>true),

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
