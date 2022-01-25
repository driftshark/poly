import { t } from "@rbxts/t";

interface ReplicationGroupComponent {
	name: "ReplicationGroup";
	data: { [key in keyof Components]?: string };

	refValidator: t.check<defined>;
}

declare global {
	interface Components {
		/** The ReplicationGroup Component holds the ReplicationGroups that other Components on this Entity should fall under
		 *
		 * Data is a Map of Component name to ReplicationGroupId
		 */
		ReplicationGroup: ReplicationGroupComponent;
	}
}

export = ReplicationGroupComponent;
