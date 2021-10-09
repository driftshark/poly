import { t } from "@rbxts/t";
import defineComponent from "defineComponent";
import { replicationMod } from "index";
import { ReplicationType } from "replication";
import { World } from "world";

const exactReplicatedComponent = replicationMod(
	defineComponent({
		name: "ExactReplicatedComponent",
		data: true,
		refValidator: t.any,
	}),
	ReplicationType.Exact
);

const exactReplicatedComponentWithConsumer = replicationMod(
	defineComponent({
		name: "ExactReplicatedComponentWithConsumer",
		data: true,
		refValidator: t.any,
	}),
	ReplicationType.Exact,
	(world, ref, componentName, payload, isUpdate) => {
		if (payload === true) {
			return true;
		}

		return false;
	}
);

const exactReplicatedComponentWithInteract = replicationMod(
	defineComponent({
		name: "ExactReplicatedComponentWithInteract",
		data: true,
		refValidator: t.any,
	}),
	ReplicationType.Exact,
	(world, ref, componentName, payload, isUpdate) => {
		return false;
	}
);

const keyedReplicatedComponent = replicationMod(
	defineComponent({
		name: "KeyedReplicatedComponent",
		data: <{ among: string; us: boolean; fortnite: number; excluded: boolean }>(
			(<unknown>true)
		),
		refValidator: t.any,
	}),
	{
		among: ReplicationType.Exact,
		us: ReplicationType.Exact,
		fortnite: ReplicationType.Exact,
	}
);

const libworld = new World("test world");

libworld.registerComponent(exactReplicatedComponent);
libworld.registerComponent(exactReplicatedComponentWithConsumer);
libworld.registerComponent(exactReplicatedComponentWithInteract);
libworld.registerComponent(keyedReplicatedComponent);

export = libworld;
