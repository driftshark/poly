import { ComponentDefinition } from "Component";
import { World } from "index";
import { ReplicationType } from "replication";

/** Add replication to the definition */
export default function <
	TDefinition extends ComponentDefinition,
	TReturnType extends TDefinition & {
		replicate: TDefinition["data"] extends object
			?
					| ReplicationType
					| {
							[key in keyof Required<TDefinition["data"]>]?: Required<
								TDefinition["data"]
							>[key] extends object
								? ReplicationType
								: Exclude<ReplicationType, ReplicationType.Diff>;
					  }
			: Exclude<ReplicationType, ReplicationType.Diff>;
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
