import { t } from "@rbxts/t";
import { ComponentEvent } from "Component";
import { World } from "world";

declare function fireEvent<
	TComponentName extends keyof Components,
	TEvent extends keyof ComponentEvent<Components[TComponentName]>
>(
	this: World,
	ref: t.static<Components[TComponentName]["refValidator"]>,
	componentName: TComponentName,
	eventName: TEvent,
	...args: Parameters<ComponentEvent<Components[TComponentName]>[TEvent]>
): void;

export = fireEvent;
