import { t } from "@rbxts/t";
import { ComponentDefinition } from "Component";
import { World } from "index";
import { ReplicationType } from "replication";

/** Add replication to the definition
 *
 * Note that using `ReplicationType.Attribute` for multiple values with the same key has undefined behavior.
 */
export default function <
	TDefinition extends ComponentDefinition,
	TReplicationType extends t.static<
		TDefinition["refValidator"]
	> extends Instance
		? ReplicationType
		: Exclude<ReplicationType, ReplicationType.Attribute>,
	TReturnType extends TDefinition & {
		replicate: TDefinition["data"] extends object
			?
					| TReplicationType
					| {
							[key in keyof Required<TDefinition["data"]>]?: Required<
								TDefinition["data"]
							>[key] extends object
								? TReplicationType
								: Exclude<TReplicationType, ReplicationType.Diff>;
					  }
			: Exclude<TReplicationType, ReplicationType.Diff>;
		consumePayload: //if the function returns false, the client system will assume the payload has not been consumed and will carry out the normal operation
		| ((
					world: World,
					ref: Ref,
					componentName: TDefinition["name"],
					payload: TDefinition["data"]
			  ) => boolean)
			| undefined;
	}
>(
	definition: TDefinition,
	replicate: TReturnType["replicate"],
	consumePayload?: TReturnType["consumePayload"]
): TReturnType {
	(definition as TReturnType).replicate = replicate;
	(definition as TReturnType).consumePayload = consumePayload;

	return definition as TReturnType;
}
