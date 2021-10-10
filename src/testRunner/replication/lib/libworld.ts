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

const exactReplicatedComponentObject = replicationMod(
	defineComponent({
		name: "ExactReplicatedComponentObject",
		data: <{ among: string }>(<unknown>true),
		refValidator: t.any,
	}),
	ReplicationType.Exact
);

const diffReplicatedComponentObject = replicationMod(
	defineComponent({
		name: "DiffReplicatedComponentObject",
		data: <{ among: string }>(<unknown>true),
		refValidator: t.any,
	}),
	ReplicationType.Diff
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
		data: <
			{
				among: string;
				us: boolean;
				fortnite: number;
				excluded: boolean;
				obj: { among?: "us" };
			}
		>(<unknown>true),
		refValidator: t.any,
	}),
	{
		among: ReplicationType.Exact,
		us: ReplicationType.Exact,
		fortnite: ReplicationType.Exact,
		obj: ReplicationType.Diff,
	}
);

const libworld = new World("test world");

libworld.registerComponent(exactReplicatedComponent);
libworld.registerComponent(exactReplicatedComponentObject);
libworld.registerComponent(diffReplicatedComponentObject);
libworld.registerComponent(exactReplicatedComponentWithConsumer);
libworld.registerComponent(exactReplicatedComponentWithInteract);
libworld.registerComponent(keyedReplicatedComponent);

const libReplicatedComponents = {};
for (const [componentName, componentDefinition] of pairs(
	libworld["componentDefinitions"]
)) {
	if ("replicate" in componentDefinition) {
		//@ts-ignore
		libReplicatedComponents[componentName] = componentDefinition.replicate;
	}
}

export { libReplicatedComponents };
export default libworld;
