import { t } from "@rbxts/t";
import { Ref } from "util";

export const enum BulkType {
	ComponentToDescription = 0,
	RefToComponents = 1,
}

export type CreateEvent = RemoteEvent<
	<TComponentName extends keyof Components>(
		ref: t.static<Components[TComponentName]["refValidator"]>,
		componentName: TComponentName,
		data: Components[TComponentName]["data"]
	) => void
>;

export type BulkCreateEventCallback = (descriptions: {
	[TComponentName in keyof Components]?: [
		t.static<Components[TComponentName]["refValidator"]>,
		Components[TComponentName]["data"]
	][];
}) => void;

export type BulkCreateEvent = RemoteEvent<BulkCreateEventCallback>;

export type UpdateEvent = RemoteEvent<
	<TComponentName extends keyof Components>(
		ref: t.static<Components[TComponentName]["refValidator"]>,
		componentName: TComponentName,
		payload: Components[TComponentName]["data"]
	) => void
>;

export type RemoveEvent = RemoteEvent<
	<TComponentName extends keyof Components>(
		ref: TComponentName extends keyof Components
			? t.static<Components[TComponentName]["refValidator"]>
			: Ref,
		componentName: TComponentName
	) => void
>;

export type BulkRemoveEventComponentToDescription = (
	bulkType: BulkType.ComponentToDescription,
	descriptions: {
		[TComponentName in keyof Components]?: t.static<
			Components[TComponentName]["refValidator"]
		>[];
	}
) => void;

export type BulkRemoveEventRefToComponents = (
	bulkType: BulkType.RefToComponents,
	descriptions: (keyof Components)[],
	ref: Ref
) => void;

export type BulkRemoveEvent = RemoteEvent<
	BulkRemoveEventComponentToDescription | BulkRemoveEventRefToComponents
>;
