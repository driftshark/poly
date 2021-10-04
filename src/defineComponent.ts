import { t } from "@rbxts/t";
import { ComponentDefinition } from "./Component";

export default function <
	TData,
	TName extends string,
	TGroup extends string,
	TDataValidator extends t.check<unknown>,
	TRefValidator extends t.check<unknown>,
	TDefinition extends {
		name: TName;
		data: TData;
		group?: TGroup;

		refValidator: TRefValidator;
		dataValidator?: TDataValidator;
	} & ComponentDefinition
>(definition: TDefinition): TDefinition {
	return definition;
}

export const defaultMod = <
	TDefinition extends ComponentDefinition,
	TReturnType extends TDefinition & { defaults: TDefinition["data"] }
>(
	definition: TDefinition,
	defaults: TReturnType["defaults"]
): TReturnType => {
	(<TReturnType>definition).defaults = defaults;

	return <TReturnType>definition;
};
