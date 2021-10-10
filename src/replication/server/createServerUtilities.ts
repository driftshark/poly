import { t } from "@rbxts/t";
import { ComponentEvent } from "Component";
import {
	GroupIdToEntity,
	GroupIdToSubscribers,
	ReplicatedComponents,
} from "replication/cache";
import { getPayload } from "replication/componentUpdatePayload";
import {
	BulkCreateEvent,
	BulkCreateEventCallback,
	BulkRemoveEvent,
	BulkRemoveEventComponentToDescription,
	BulkType,
	CreateEvent,
	RemoveEvent,
	UpdateEvent,
} from "replication/events";
import { named } from "util/symbol";
import type { World } from "world";
import notifySubscribers from "./notifySubscribers";

const None = named("None");

export = <TReplicatedComponents extends ReplicatedComponents>(
	world: World,
	groupIdToEntity: GroupIdToEntity,
	groupIdToSubscribers: GroupIdToSubscribers,
	replicatedComponents: TReplicatedComponents,
	createComponentEvent: CreateEvent,
	bulkCreateComponentEvent: BulkCreateEvent,
	updateComponentEvent: UpdateEvent,
	removeComponentEvent: RemoveEvent,
	bulkRemoveComponentEvent: BulkRemoveEvent
) => {
	const createReplicatedComponentCallback = <
		TComponentName extends keyof Components
	>(
		componentName: TComponentName
	) => {
		return <
			TComponentEvent extends keyof ComponentEvent<Components[TComponentName]>
		>(
			componentEvent: TComponentEvent,
			ref: t.static<Components[TComponentName]["refValidator"]>,
			...args: Parameters<
				ComponentEvent<Components[TComponentName]>[TComponentEvent]
			>
		) => {
			const groupId: string | undefined = world.getComponent(
				ref,
				"ReplicationGroup"
			)?.[componentName];
			if (groupId === undefined) return false;

			const subscribers = groupIdToSubscribers[groupId];
			if (subscribers === undefined) return false;

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
		};
	};

	const getReplicableData = <
		TComponentName extends keyof TReplicatedComponents
	>(
		componentName: TComponentName,
		//@ts-ignore
		data: Components[TComponentName]["data"]
	) => {
		const replicateSpec = replicatedComponents[componentName];

		if (typeIs(replicateSpec, "number")) {
			return data;
		} else {
			const replicatedData = new Map();

			for (const [k] of pairs(replicateSpec as {})) {
				//@ts-ignore
				replicatedData.set(k, data[k]);
			}

			return replicatedData.isEmpty() ? None : replicatedData;
		}
	};

	const compileNewBatchData = (groupId: string) => {
		if (groupIdToEntity[groupId] === undefined) return;

		const batchData: Parameters<BulkCreateEventCallback>[0] = {};

		for (const [ref, connectedComponents] of pairs(groupIdToEntity[groupId]!)) {
			for (const componentName of connectedComponents) {
				const component = world.getComponent(ref, componentName);
				if (component !== undefined) {
					const replicatedData = getReplicableData(
						//@ts-ignore
						componentName,
						component
					);

					if (replicatedData !== None) {
						if (batchData[componentName] === undefined) {
							batchData[componentName] = [];
						}

						//@ts-ignore
						batchData[componentName]!.push([ref, replicatedData]);
					}
				}
			}
		}

		return batchData;
	};

	const handleNewReplicationSubscription = (
		ref: Player,
		data: DeepReadonly<Components["ReplicationSubscription"]["data"]>
	) => {
		for (const [groupId] of data) {
			if (groupIdToSubscribers[groupId] === undefined) {
				groupIdToSubscribers[groupId] = new Map();
			}

			groupIdToSubscribers[groupId]!.set(ref, true);

			const batchData = compileNewBatchData(groupId);
			if (batchData !== undefined) {
				bulkCreateComponentEvent.FireClient(ref, batchData);
			}
		}
	};

	const handleUpdatedReplicationSubscription = (
		ref: Player,
		data: DeepReadonly<Components["ReplicationSubscription"]["data"]>,
		oldData: DeepReadonly<Components["ReplicationSubscription"]["data"]>
	) => {
		for (const [groupId] of oldData) {
			if (data.get(groupId) === undefined) {
				if (groupIdToSubscribers[groupId] !== undefined) {
					groupIdToSubscribers[groupId]!.delete(ref);
					if (groupIdToSubscribers[groupId]!.isEmpty()) {
						groupIdToSubscribers[groupId] = undefined;
					}

					if (groupIdToEntity[groupId] === undefined) continue;

					const batchData: Parameters<BulkRemoveEventComponentToDescription>[1] =
						{};

					for (const [connectedRef, connectedComponents] of pairs(
						groupIdToEntity[groupId]!
					)) {
						for (const componentName of connectedComponents) {
							const component = world.getComponent(connectedRef, componentName);
							if (component !== undefined) {
								if (batchData[componentName] === undefined) {
									batchData[componentName] = [];
								}

								batchData[componentName]!.push(connectedRef);
							}
						}
					}

					bulkRemoveComponentEvent.FireClient(
						ref,
						BulkType.ComponentToDescription,
						batchData
					);
				}
			}
		}

		for (const [groupId] of data) {
			if (oldData.get(groupId) === undefined) {
				if (groupIdToSubscribers[groupId] === undefined) {
					groupIdToSubscribers[groupId] = new Map();
				}

				groupIdToSubscribers[groupId]!.set(ref, true);

				const batchData = compileNewBatchData(groupId);
				if (batchData !== undefined) {
					bulkCreateComponentEvent.FireClient(ref, batchData);
				}
			}
		}
	};

	const handleRemovingReplicationSubscription = (
		ref: Player,
		data: DeepReadonly<Components["ReplicationSubscription"]["data"]>
	) => {
		for (const [groupId] of data) {
			if (groupIdToSubscribers[groupId] !== undefined) {
				groupIdToSubscribers[groupId]!.delete(ref);

				if (groupIdToSubscribers[groupId]!.isEmpty()) {
					groupIdToSubscribers[groupId] = undefined;
				}
			}
		}
	};

	const handleNewReplicationGroup = (
		ref: Ref,
		data: DeepReadonly<Components["ReplicationGroup"]["data"]>
	) => {
		for (const [componentName] of world.componentsOf(ref)) {
			//@ts-ignore
			if (replicatedComponents[componentName] !== undefined) {
				const componentGroupId = data[componentName];
				if (componentGroupId) {
					if (groupIdToEntity[componentGroupId] === undefined) {
						groupIdToEntity[componentGroupId] = new Map();
					}

					const arr = groupIdToEntity[componentGroupId]!.get(ref) ?? [];
					arr.push(componentName);

					groupIdToEntity[componentGroupId]!.set(ref, arr);

					if (groupIdToSubscribers[componentGroupId] !== undefined) {
						const replicatedData = getReplicableData(
							//@ts-ignore
							componentName,
							world.getComponent(ref, componentName)!
						);

						if (replicatedData !== None) {
							notifySubscribers(
								groupIdToSubscribers[componentGroupId]!,
								createComponentEvent,
								ref,
								componentName, //@ts-ignore
								replicatedData
							);
						}
					}
				}
			}
		}
	};

	const handleUpdatedReplicationGroup = (
		ref: Ref,
		data: DeepReadonly<Components["ReplicationGroup"]["data"]>,
		oldData: DeepReadonly<Components["ReplicationGroup"]["data"]>
	) => {
		for (const [componentName, groupId] of pairs(oldData)) {
			if (data[componentName] !== groupId) {
				if (groupIdToEntity[groupId] !== undefined) {
					const arr = groupIdToEntity[groupId]!.get(ref);
					if (arr !== undefined) {
						const index = arr.indexOf(componentName);
						if (index !== -1) {
							arr.unorderedRemove(index);

							if (arr.isEmpty()) {
								groupIdToEntity[groupId]!.delete(ref);
							}
						}
					}
				}

				const subscribers = groupIdToSubscribers[groupId];
				if (subscribers !== undefined) {
					if (data[componentName] === undefined) {
						notifySubscribers(
							subscribers,
							removeComponentEvent,
							ref,
							componentName
						);
					}
				}
			}
		}

		for (const [key, groupId] of pairs(data)) {
			if (oldData[key] !== groupId) {
				if (groupIdToEntity[groupId] === undefined) {
					groupIdToEntity[groupId] = new Map();
				}

				if (groupIdToEntity[groupId]!.get(ref) === undefined) {
					groupIdToEntity[groupId]!.set(ref, []);
				}
				groupIdToEntity[groupId]!.get(ref)!.push(key);

				const subscribers = groupIdToSubscribers[groupId];
				if (
					oldData[key] !== undefined &&
					groupIdToSubscribers[oldData[key]!] !== undefined
				) {
					const subscribersToOldGroupId = groupIdToSubscribers[oldData[key]!]!;

					if (subscribers !== undefined) {
						const data = world.getComponent(ref, key);
						if (data !== undefined) {
							//@ts-ignore
							const replicatedData = getReplicableData(key, data);

							if (replicatedData !== None) {
								for (const [subscriber] of subscribersToOldGroupId) {
									if (subscribers.get(subscriber) === undefined) {
										removeComponentEvent.FireClient(subscriber, ref, key);
									}
								}

								for (const [subscriber] of subscribers) {
									if (subscribersToOldGroupId.get(subscriber) === undefined) {
										createComponentEvent.FireClient(
											subscriber,
											ref,
											key, //@ts-ignore
											replicatedData
										);
									}
								}
							} else {
								notifySubscribers(
									subscribersToOldGroupId,
									removeComponentEvent,
									ref,
									key
								);
							}
						} else {
							notifySubscribers(
								subscribersToOldGroupId,
								removeComponentEvent,
								ref,
								key
							);
						}
					} else {
						notifySubscribers(
							subscribersToOldGroupId,
							removeComponentEvent,
							ref,
							key
						);
					}
				} else {
					if (subscribers !== undefined) {
						const data = world.getComponent(ref, key);
						if (data !== undefined) {
							//@ts-ignore
							const replicatedData = getReplicableData(key, data);

							if (replicatedData !== None) {
								notifySubscribers(
									subscribers,
									createComponentEvent,
									ref,
									key, //@ts-ignore
									replicatedData
								);
							}
						}
					}
				}
			}
		}
	};

	const handleRemovingReplicationGroup = (
		ref: Ref,
		data: DeepReadonly<Components["ReplicationGroup"]["data"]>
	) => {
		for (const [_, groupId] of pairs(data)) {
			if (groupIdToEntity[groupId] !== undefined) {
				const connectedComponents = groupIdToEntity[groupId]!.get(ref);
				if (connectedComponents !== undefined) {
					const subscribers = groupIdToSubscribers[groupId];
					if (subscribers !== undefined) {
						notifySubscribers(
							subscribers,
							bulkRemoveComponentEvent,
							BulkType.RefToComponents,
							connectedComponents,
							ref
						);
					}

					groupIdToEntity[groupId]!.delete(ref);

					if (groupIdToEntity[groupId]!.isEmpty()) {
						groupIdToEntity[groupId] = undefined;
					}
				}
			}
		}
	};

	return {
		createReplicatedComponentCallback,
		compileNewBatchData,
		getReplicableData,
		handleNewReplicationSubscription,
		handleUpdatedReplicationSubscription,
		handleRemovingReplicationSubscription,
		handleNewReplicationGroup,
		handleUpdatedReplicationGroup,
		handleRemovingReplicationGroup,
	};
};
