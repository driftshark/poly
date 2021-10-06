import createSystem from "createSystem";
import { patchPayload } from "replication/componentUpdatePayload";
import promiseChild from "util/promiseChild";
import { CreateEvent, RemoveEvent, UpdateEvent } from "./events";

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
					]);
				})
				.then((remotes) => {
					const createEvent = remotes[0] as CreateEvent;
					const updateEvent = remotes[1] as UpdateEvent;
					const removeEvent = remotes[2] as RemoveEvent;

					cns.push(
						createEvent.OnClientEvent.Connect((ref, componentName, data) => {
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
