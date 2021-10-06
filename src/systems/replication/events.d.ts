import { t } from "@rbxts/t";

export type CreateEvent = RemoteEvent<
	<TComponentName extends keyof Components>(
		ref: t.static<Components[TComponentName]["refValidator"]>,
		componentName: TComponentName,
		data: Components[TComponentName]["data"]
	) => void
>;
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
