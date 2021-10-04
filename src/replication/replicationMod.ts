import { t } from "@rbxts/t";
import { ComponentDefinition } from "Component";
import { ReplicationType } from "replication";

/** Add replication to the definition
 *
 * Note that using `ReplicationType.Attribute` for multiple values with the same key has undefined behavior.
 */
export default <
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
	}
>(
	definition: TDefinition,
	replicate: TReturnType["replicate"]
): TReturnType => {
	(<TReturnType>definition).replicate = replicate;

	return <TReturnType>definition;
};
