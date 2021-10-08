import createSystem from "createSystem";
import { named } from "util/symbol";
import {
	BulkCreateEvent,
	BulkRemoveEvent,
	BulkRemoveEventComponentToDescription,
	BulkType,
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
import compileNewBatchData from "../../replication/server/compileNewBatchData";
import getReplicableData from "../../replication/server/getReplicableData";
import { getPayload } from "replication/componentUpdatePayload";

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

			const handleNewReplicationSubscription = (
				ref: Player,
				data: DeepReadonly<Components["ReplicationSubscription"]["data"]>
			) => {
				for (const [groupId] of data) {
					if (groupIdToSubscribers[groupId] === undefined) {
						groupIdToSubscribers[groupId] = new Map();
					}

					groupIdToSubscribers[groupId]!.set(ref, true);

					const batchData = compileNewBatchData(
						world,
						groupIdToEntity,
						replicatedComponents,
						groupId
					);
					if (batchData !== undefined) {
						bulkCreateComponentEvent.FireClient(ref, batchData);
					}
				}
			};

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
					(ref, data, oldData) => {
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
											const component = world.getComponent(
												connectedRef,
												componentName
											);
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

								const batchData = compileNewBatchData(
									world,
									groupIdToEntity,
									replicatedComponents,
									groupId
								);
								if (batchData !== undefined) {
									bulkCreateComponentEvent.FireClient(ref, batchData);
								}
							}
						}
					}
				)
			);

			disconnectFns.push(
				world.onComponentEvent(
					"ReplicationSubscription",
					"Removing",
					(ref, data) => {
						for (const [groupId] of data) {
							if (groupIdToSubscribers[groupId] !== undefined) {
								groupIdToSubscribers[groupId]!.delete(ref);

								if (groupIdToSubscribers[groupId]!.isEmpty()) {
									groupIdToSubscribers[groupId] = undefined;
								}
							}
						}
					}
				)
			);

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
									replicatedComponents,
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
					(ref, data, oldData) => {
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
									const subscribersToOldGroupId =
										groupIdToSubscribers[oldData[key]!]!;

									if (subscribers !== undefined) {
										const data = world.getComponent(ref, key);
										if (data !== undefined) {
											const replicatedData = getReplicableData(
												replicatedComponents,
												//@ts-ignore
												componentName,
												data
											);

											if (replicatedData !== None) {
												for (const [subscriber] of subscribersToOldGroupId) {
													if (subscribers.get(subscriber) === undefined) {
														removeComponentEvent.FireClient(
															subscriber,
															ref,
															key
														);
													}
												}

												for (const [subscriber] of subscribers) {
													if (
														subscribersToOldGroupId.get(subscriber) ===
														undefined
													) {
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
											const replicatedData = getReplicableData(
												replicatedComponents,
												//@ts-ignore
												componentName,
												data
											);

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
					}
				)
			);

			disconnectFns.push(
				world.onComponentEvent("ReplicationGroup", "Removing", (ref, data) => {
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
				})
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
