import type { World } from "index";
import { named } from "util/symbol";
import { GroupIdToEntity, ReplicatedComponents } from "../cache";
import { BulkCreateEventCallback } from "../events";
import getReplicableData from "./getReplicableData";

const None = named("None");

export = (
	world: World,
	groupIdToEntity: GroupIdToEntity,
	replicatedComponents: ReplicatedComponents,
	groupId: string
) => {
	if (groupIdToEntity[groupId] === undefined) return;

	const batchData: Parameters<BulkCreateEventCallback>[0] = {};

	for (const [ref, connectedComponents] of pairs(groupIdToEntity[groupId]!)) {
		for (const componentName of connectedComponents) {
			const component = world.getComponent(ref, componentName);
			if (component !== undefined) {
				const replicatedData = getReplicableData(
					replicatedComponents,
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
