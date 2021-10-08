import { ReplicationType } from "replication";

type GroupIdToEntity = { [key in string]?: Map<Ref, (keyof Components)[]> };
type GroupIdToSubscribers = { [key in string]?: Map<Player, true> };
type ReplicatedComponents = {
	[key in keyof ExtractMembers<
		Components,
		{ replicate: ReplicationType | object }
	>]?: Components[key]["replicate"];
};
