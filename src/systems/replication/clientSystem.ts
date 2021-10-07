import createSystem from "createSystem";
import { World } from "index";
import { patchPayload } from "replication/componentUpdatePayload";
import promiseChild from "util/promiseChild";
import {
	BulkCreateEvent,
	BulkRemoveEvent,
	CreateEvent,
	RemoveEvent,
	UpdateEvent,
} from "./events";

type ConsumePayloadFunction<TDefinition extends Components[keyof Components]> =
	| ((
			world: World,
			ref: Ref,
			componentName: TDefinition["name"],
			payload: TDefinition["data"]
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
							]["consumePayload"] as ConsumePayloadFunction<
								Components[typeof componentName]
							>;

							if (consumePayload !== undefined) {
								if (consumePayload(world, ref, componentName, data) !== false) {
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
							]["consumePayload"] as ConsumePayloadFunction<
								Components[typeof componentName]
							>;

							if (consumePayload !== undefined) {
								if (
									consumePayload(world, ref, componentName, newData) !== false
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
								for (const description of descriptionArray) {
									world.addComponent(
										description[0],
										componentName,
										description[1]
									);
								}
							}
						})
					);

					cns.push(
						bulkRemoveEvent.OnClientEvent.Connect((descriptions) => {
							for (const [componentName, refArray] of pairs(descriptions)) {
								for (const ref of refArray) {
									world.removeComponent(ref, componentName);
								}
							}
						})
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
