import {
	GroupIdToEntity,
	GroupIdToSubscribers,
	ReplicatedComponents,
} from "replication/cache";
import { BulkCreateEventCallback } from "replication/events";
import { named } from "util/symbol";
import type { World } from "world";

const None = named("None");

export = <TReplicatedComponents extends ReplicatedComponents>(
	world: World,
	groupIdToEntity: GroupIdToEntity,
	groupIdToSubscribers: GroupIdToSubscribers,
	replicatedComponents: TReplicatedComponents
) => {
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

	return {
		compileNewBatchData,
		getReplicableData,
	};
};
