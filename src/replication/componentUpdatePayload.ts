import { World } from "index";
import { ReplicationType } from "replication";
import { named } from "util/symbol";
import { diff, patch, shallow } from "util/tableUtil";

export const getPayload = <
	TComponentName extends keyof Components,
	TKey extends keyof Components[TComponentName]["data"]
>(
	world: World,
	componentName: TComponentName,
	newValue: Components[TComponentName]["data"],
	oldValue: Components[TComponentName]["data"] | undefined
): symbol | Map<unknown, unknown> | Components[TComponentName]["data"] => {
	//@ts-ignore
	const replicateDefinition = world["componentDefinitions"][componentName][
		"replicate"
	] as
		| ReplicationType
		| {
				[key in TKey]?: ReplicationType;
		  };

	if (typeIs(replicateDefinition, "number")) {
		if (replicateDefinition === ReplicationType.Diff) {
			return diff(oldValue ?? {}, newValue);
		} else {
			return newValue;
		}
	} else {
		//check changed fields that are included in the replicateDefinition
		const payload = new Map();

		for (const [key, keyReplicationType] of pairs(replicateDefinition)) {
			if (oldValue && oldValue![key as TKey] === newValue[key as TKey]) {
				continue;
			}

			if (keyReplicationType === ReplicationType.Diff) {
				payload.set(
					key,
					diff(
						((oldValue && oldValue![key as TKey]) || {}) as unknown as object,
						newValue[key as TKey] as unknown as object
					)
				);
			} else {
				if (newValue[key as TKey] === undefined) {
					payload.set(key, "_N");
				} else {
					payload.set(key, newValue[key as TKey]);
				}
			}
		}

		//if payload is empty, return None, as in no changes
		return payload.isEmpty() ? named("None") : payload;
	}
};

export const patchPayload = <
	TComponentName extends keyof Components,
	TKey extends keyof Components[TComponentName]["data"]
>(
	world: World,
	componentName: TComponentName,
	oldValue: Components[TComponentName]["data"] | undefined,
	payload: Components[TComponentName]["data"]
) => {
	//@ts-ignore
	const replicateDefinition = world["componentDefinitions"][componentName][
		"replicate"
	] as
		| ReplicationType
		| {
				[key in TKey]?: ReplicationType;
		  };

	if (typeIs(replicateDefinition, "number")) {
		if (replicateDefinition === ReplicationType.Diff) {
			return patch(oldValue ?? {}, payload);
		} else {
			return payload;
		}
	} else {
		const newValue = shallow(oldValue ?? {});

		for (const [key, value] of pairs(payload)) {
			if (replicateDefinition[key as TKey] === ReplicationType.Diff) {
				//@ts-ignore
				newValue[key] = patch(newValue[key] ?? {}, value);
			} else {
				if (value === "_N") {
					//@ts-ignore
					newValue[key] = undefined;
				} else {
					//@ts-ignore
					newValue[key] = value;
				}
			}
		}

		return newValue;
	}
};
