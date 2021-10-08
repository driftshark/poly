import { named } from "util/symbol";
import { ReplicatedComponents } from "../cache";

const None = named("None");

export = <
	TReplicatedComponents extends ReplicatedComponents,
	TComponentName extends keyof TReplicatedComponents
>(
	replicatedComponents: TReplicatedComponents,
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
