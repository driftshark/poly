import createSystem from "createSystem";
import { World } from "index";
import { patchPayload } from "replication/componentUpdatePayload";
import promiseChild from "util/promiseChild";
import {
	BulkCreateEvent,
	BulkRemoveEvent,
	BulkRemoveEventComponentToDescription,
	BulkType,
	CreateEvent,
	RemoveEvent,
	UpdateEvent,
} from "../../replication/events";

type ConsumePayloadFunction =
	| ((
			world: World,
			ref: Ref,
			componentName: Components[keyof Components]["name"],
			payload: Components[keyof Components]["data"]
	  ) => boolean)
	| undefined;

export = createSystem(() => {
	let cns: RBXScriptConnection[] = [];
	let getPromise: Promise<unknown> | undefined = undefined;
	return {
		name: "Replication",
		init: (world) => {
			getPromise = promiseChild(
				game.GetService("ReplicatedStorage"),
				"ReplicationRemotes",
				math.huge
			)
				.then((value) => {
					return Promise.all([
						promiseChild(value!, `Create_${world.name}`, math.huge),
						promiseChild(value!, `Update_${world.name}`, math.huge),
						promiseChild(value!, `Remove_${world.name}`, math.huge),
						promiseChild(value!, `BulkCreate_${world.name}`, math.huge),
						promiseChild(value!, `BulkRemove_${world.name}`, math.huge),
					]);
				})
				.then((remotes) => {
					const createEvent = remotes[0] as CreateEvent;
					const updateEvent = remotes[1] as UpdateEvent;
					const removeEvent = remotes[2] as RemoveEvent;
					const bulkCreateEvent = remotes[3] as BulkCreateEvent;
					const bulkRemoveEvent = remotes[4] as BulkRemoveEvent;

					cns.push(
						createEvent.OnClientEvent.Connect((ref, componentName, data) => {
							//@ts-ignore
							const consumePayload = world["componentDefinitions"][
								componentName
							]["consumePayload"] as ConsumePayloadFunction;

							if (consumePayload !== undefined) {
								if (consumePayload(world, ref, componentName, data) === true) {
									return;
								}
							}

							world.addComponent(ref, componentName, data);
						})
					);

					cns.push(
						updateEvent.OnClientEvent.Connect((ref, componentName, payload) => {
							type ComponentData = Components[typeof componentName]["data"];

							const oldValue = world.getComponent(ref, componentName) as
								| DeepWritable<ComponentData>
								| undefined;

							const newData = patchPayload(
								world,
								componentName,
								oldValue,
								payload
							);

							//@ts-ignore
							const consumePayload = world["componentDefinitions"][
								componentName
							]["consumePayload"] as ConsumePayloadFunction;

							if (consumePayload !== undefined) {
								if (
									consumePayload(world, ref, componentName, newData) === true
								) {
									return;
								}
							}

							world.addComponent(ref, componentName, newData);
							world.fireEvent(
								ref,
								componentName,
								"Replicated",
								newData as DeepReadonly<ComponentData>,
								oldValue as DeepReadonly<typeof oldValue>
							);
						})
					);

					cns.push(
						removeEvent.OnClientEvent.Connect((ref, componentName) => {
							world.removeComponent(ref, componentName);
						})
					);

					cns.push(
						bulkCreateEvent.OnClientEvent.Connect((descriptions) => {
							for (const [componentName, descriptionArray] of pairs(
								descriptions
							)) {
								//@ts-ignore
								const consumePayload = world["componentDefinitions"][
									componentName
								]["consumePayload"] as ConsumePayloadFunction;

								if (consumePayload !== undefined) {
									for (const description of descriptionArray) {
										if (
											consumePayload(
												world,
												description[0],
												componentName,
												description[1]
											) === true
										) {
											continue;
										}

										world.addComponent(
											description[0],
											componentName,
											description[1]
										);
									}
								} else {
									for (const description of descriptionArray) {
										world.addComponent(
											description[0],
											componentName,
											description[1]
										);
									}
								}
							}
						})
					);

					cns.push(
						bulkRemoveEvent.OnClientEvent.Connect(
							(bulkType, descriptions, ref) => {
								if (bulkType === BulkType.RefToComponents) {
									for (const componentName of descriptions) {
										world.removeComponent(ref, componentName);
									}
								} else if (bulkType === BulkType.ComponentToDescription) {
									for (const [componentName, refArray] of pairs(
										descriptions as Parameters<BulkRemoveEventComponentToDescription>[1]
									)) {
										for (const ref of refArray) {
											world.removeComponent(ref, componentName);
										}
									}
								}
							}
						)
					);
				});
		},
		destroy: () => {
			for (const v of cns) {
				v.Disconnect();
			}

			getPromise?.cancel();
		},
	};
});
