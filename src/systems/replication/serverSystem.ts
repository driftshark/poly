import createSystem from "createSystem";
import { named } from "util/symbol";
import {
	BulkCreateEvent,
	BulkRemoveEvent,
	CreateEvent,
	RemoveEvent,
	UpdateEvent,
} from "../../replication/events";
import getRemotesFolderServer from "../../replication/server/getRemotesFolderServer";
import createRemoteEvent from "../../replication/server/createRemoteEvent";
import { notifySubscribers } from "../../replication/server/notifySubscribers";
import {
	GroupIdToEntity,
	GroupIdToSubscribers,
	ReplicatedComponents,
} from "../../replication/cache";
import { getPayload } from "replication/componentUpdatePayload";
import createServerUtilities from "replication/server/createServerUtilities";

const None = named("None");

export = createSystem(() => {
	let groupIdToEntity: GroupIdToEntity = {};
	let groupIdToSubscribers: GroupIdToSubscribers = {};
	let replicatedComponents: ReplicatedComponents = {};

	let remotes: RemoteEvent[] = [];
	let disconnectFns: DisconnectFunction[] = [];
	return {
		name: "Replication",
		init: (world) => {
			const remotesFolder = getRemotesFolderServer();

			const createComponentEvent = createRemoteEvent<CreateEvent>(
				`Create_${world.name}`,
				remotesFolder
			);
			const updateComponentEvent = createRemoteEvent<UpdateEvent>(
				`Update_${world.name}`,
				remotesFolder
			);
			const removeComponentEvent = createRemoteEvent<RemoveEvent>(
				`Remove_${world.name}`,
				remotesFolder
			);
			const bulkCreateComponentEvent = createRemoteEvent<BulkCreateEvent>(
				`BulkCreate_${world.name}`,
				remotesFolder
			);
			const bulkRemoveComponentEvent = createRemoteEvent<BulkRemoveEvent>(
				`BulkRemove_${world.name}`,
				remotesFolder
			);

			//...
			const {
				handleNewReplicationSubscription,
				handleRemovingReplicationSubscription,
				handleNewReplicationGroup,
				handleRemovingReplicationGroup,
				handleUpdatedReplicationSubscription,
				handleUpdatedReplicationGroup,
			} = createServerUtilities(
				world,
				groupIdToEntity,
				groupIdToSubscribers,
				replicatedComponents,
				createComponentEvent,
				bulkCreateComponentEvent,
				removeComponentEvent,
				bulkRemoveComponentEvent
			);

			remotes.push(
				createComponentEvent,
				updateComponentEvent,
				removeComponentEvent,
				bulkCreateComponentEvent,
				bulkRemoveComponentEvent
			);

			for (const [componentName, componentDefinition] of pairs(
				world["componentDefinitions"]
			)) {
				if ("replicate" in componentDefinition) {
					//@ts-ignore
					replicatedComponents[componentName] =
						componentDefinition["replicate"];

					disconnectFns.push(
						world.onComponent(componentName, (componentEvent, ref, ...args) => {
							const groupId = world.getComponent(ref, "ReplicationGroup")?.[
								componentName
							];
							if (groupId === undefined) return;

							const subscribers = groupIdToSubscribers[groupId];
							if (subscribers === undefined) return;

							if (componentEvent === "Updated") {
								const payload = getPayload(
									world,
									componentName,
									args[0] as DeepWritable<typeof args[0]>,
									args[1] as DeepWritable<typeof args[1]>
								);

								if (payload !== None) {
									notifySubscribers(
										subscribers,
										updateComponentEvent,
										ref,
										componentName,
										//@ts-ignore
										payload
									);
								}
							} else if (componentEvent === "Created") {
								notifySubscribers(
									subscribers,
									createComponentEvent,
									ref,
									componentName,
									args[0] as DeepWritable<typeof args[0]>
								);
							} else if (componentEvent === "Removing") {
								notifySubscribers(
									subscribers,
									removeComponentEvent,
									ref,
									componentName
								);
							}
						})
					);
				}
			}

			for (const [ref, data] of world.refsWith("ReplicationSubscription")) {
				handleNewReplicationSubscription(ref, data);
			}

			disconnectFns.push(
				world.onComponentEvent(
					"ReplicationSubscription",
					"Created",
					handleNewReplicationSubscription
				)
			);

			disconnectFns.push(
				world.onComponentEvent(
					"ReplicationSubscription",
					"Updated",
					handleUpdatedReplicationSubscription
				)
			);

			disconnectFns.push(
				world.onComponentEvent(
					"ReplicationSubscription",
					"Removing",
					handleRemovingReplicationSubscription
				)
			);

			for (const [ref, data] of world.refsWith("ReplicationGroup")) {
				handleNewReplicationGroup(ref, data);
			}

			disconnectFns.push(
				world.onComponentEvent(
					"ReplicationGroup",
					"Created",
					handleNewReplicationGroup
				)
			);

			disconnectFns.push(
				world.onComponentEvent(
					"ReplicationGroup",
					"Updated",
					handleUpdatedReplicationGroup
				)
			);

			disconnectFns.push(
				world.onComponentEvent(
					"ReplicationGroup",
					"Removing",
					handleRemovingReplicationGroup
				)
			);
		},

		destroy: () => {
			groupIdToEntity = {};
			groupIdToSubscribers = {};
			replicatedComponents = {};

			for (const v of remotes) {
				v.Destroy();
			}

			for (const v of disconnectFns) {
				v();
			}
		},
	};
});
