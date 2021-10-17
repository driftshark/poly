import { ReplicationType } from "replication";
import { Ref } from "util";

type GroupIdToEntity = { [key in string]?: Map<Ref, (keyof Components)[]> };
type GroupIdToSubscribers = { [key in string]?: Map<Player, true> };
type ReplicatedComponents = {
	[key in keyof ExtractMembers<
		Components,
		{ replicate: ReplicationType | object }
	>]?: Components[key]["replicate"];
};
