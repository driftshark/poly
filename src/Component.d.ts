import { t } from "@rbxts/t";

declare global {
	interface Components {}
}

export interface ComponentDefinition {
	name: string;
	group?: string;

	/** This field is not a validator purely so that data typings can be more advanced (see Old component) */
	data: unknown;
	refValidator: t.check<unknown>;

	dataValidator?: t.check<unknown>;
}

export interface ComponentEvent<TDefinition extends ComponentDefinition> {
	Created: (data: DeepReadonly<TDefinition["data"]>) => void;
	Removing: (data: DeepReadonly<TDefinition["data"]>) => void;
	Updated: (
		data: DeepReadonly<TDefinition["data"]>,
		oldData: DeepReadonly<TDefinition["data"]>
	) => void;
	Replicated: (
		data: DeepReadonly<TDefinition["data"]>,
		oldData: DeepReadonly<TDefinition["data"]>
	) => void;
}
