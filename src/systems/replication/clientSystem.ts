import createSystem from "createSystem";
import createClientUtilities from "replication/client/createClientUtilities";
import promiseChild from "@driftshark/promise-child";
import {
	BulkCreateEvent,
	BulkRemoveEvent,
	CreateEvent,
	RemoveEvent,
	UpdateEvent,
} from "../../replication/events";

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

					const {
						receiveCreateEvent,
						receiveUpdateEvent,
						receiveRemoveEvent,
						receiveBulkCreateEvent,
						receiveBulkRemoveEvent,
					} = createClientUtilities(world);

					cns.push(createEvent.OnClientEvent.Connect(receiveCreateEvent));
					cns.push(updateEvent.OnClientEvent.Connect(receiveUpdateEvent));
					cns.push(removeEvent.OnClientEvent.Connect(receiveRemoveEvent));
					cns.push(
						bulkCreateEvent.OnClientEvent.Connect(receiveBulkCreateEvent)
					);
					cns.push(
						bulkRemoveEvent.OnClientEvent.Connect(receiveBulkRemoveEvent)
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
