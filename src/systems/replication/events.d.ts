import { t } from "@rbxts/t";

export type CreateEvent = RemoteEvent<
	<TComponentName extends keyof Components>(
		ref: t.static<Components[TComponentName]["refValidator"]>,
		componentName: TComponentName,
		data: Components[TComponentName]["data"]
	) => void
>;

export type BulkCreateEvent = RemoteEvent<
	(descriptions: {
		[TComponentName in keyof Components]?: [
			t.static<Components[TComponentName]["refValidator"]>,
			Components[TComponentName]["data"]
		][];
	}) => void
>;

export type BulkCreateEventParameters = BulkCreateEvent extends RemoteEvent<
	infer Callback
>
	? Parameters<Callback>
	: never;

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

export type BulkRemoveEvent = RemoteEvent<
	(descriptions: {
		[TComponentName in keyof Components]?: t.static<
			Components[TComponentName]["refValidator"]
		>[];
	}) => void
>;
