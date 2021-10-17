import { patchPayload } from "replication/componentUpdatePayload";
import {
	BulkCreateEvent,
	BulkRemoveEvent,
	BulkRemoveEventComponentToDescription,
	BulkType,
	CreateEvent,
	RemoveEvent,
	UpdateEvent,
} from "replication/events";
import { DeepReadonly, DeepWritable, Ref } from "../../util";
import type { World } from "world";

type CallbackOf<T extends RemoteEvent> = T extends RemoteEvent<infer C>
	? C
	: never;

type ConsumePayloadFunction =
	| ((
			world: World,
			ref: Ref,
			componentName: Components[keyof Components]["name"],
			payload: Components[keyof Components]["data"],
			isUpdate: boolean
	  ) => boolean)
	| undefined;

export = (world: World) => {
	const componentDefinitions = world["componentDefinitions"];

	const receiveCreateEvent: CallbackOf<CreateEvent> = (
		ref,
		componentName,
		data
	) => {
		//@ts-ignore
		const consumePayload = componentDefinitions[componentName][
			"consumePayload"
		] as ConsumePayloadFunction;

		if (consumePayload !== undefined) {
			if (consumePayload(world, ref, componentName, data, false) === true) {
				return;
			}
		}

		world.addComponent(ref, componentName, data);
	};

	const receiveUpdateEvent: CallbackOf<UpdateEvent> = (
		ref,
		componentName,
		payload
	) => {
		type ComponentData = Components[typeof componentName]["data"];

		//@ts-ignore
		const consumePayload = componentDefinitions[componentName][
			"consumePayload"
		] as ConsumePayloadFunction;

		if (consumePayload !== undefined) {
			if (consumePayload(world, ref, componentName, payload, true) === true) {
				return;
			}
		}

		const oldValue = world.getComponent(ref, componentName) as
			| DeepWritable<ComponentData>
			| undefined;

		const newData = patchPayload(world, componentName, oldValue, payload);

		world.addComponent(ref, componentName, newData);
		world.fireEvent(
			ref,
			componentName,
			"Replicated",
			newData as DeepReadonly<ComponentData>,
			oldValue as DeepReadonly<typeof oldValue>
		);
	};

	const receiveRemoveEvent: CallbackOf<RemoveEvent> = (ref, componentName) => {
		world.removeComponent(ref, componentName);
	};

	const receiveBulkCreateEvent: CallbackOf<BulkCreateEvent> = (
		descriptions
	) => {
		for (const [componentName, descriptionArray] of pairs(descriptions)) {
			//@ts-ignore
			const consumePayload = componentDefinitions[componentName][
				"consumePayload"
			] as ConsumePayloadFunction;

			if (consumePayload !== undefined) {
				for (const description of descriptionArray) {
					if (
						consumePayload(
							world,
							description[0],
							componentName,
							description[1],
							false
						) === true
					) {
						continue;
					}

					world.addComponent(description[0], componentName, description[1]);
				}
			} else {
				for (const description of descriptionArray) {
					world.addComponent(description[0], componentName, description[1]);
				}
			}
		}
	};

	const receiveBulkRemoveEvent: CallbackOf<BulkRemoveEvent> = (
		bulkType,
		descriptions,
		ref
	) => {
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
	};

	return {
		receiveCreateEvent,
		receiveUpdateEvent,
		receiveRemoveEvent,
		receiveBulkCreateEvent,
		receiveBulkRemoveEvent,
	};
};
