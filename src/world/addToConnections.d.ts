import type { ComponentEvent } from "../Component";
import type { Ref } from "../index";
import type { ConnectionTypes, World } from ".";

declare function addToConnections<TComponentName extends keyof Components>(
	events: World["events"],
	componentName: TComponentName,
	connectionType: symbol,
	uuid: string,
	callback: ConnectionTypes<
		Components[TComponentName]
	>["BaseConnections"][symbol][string]
): () => void;
declare function addToConnections<
	TComponentName extends keyof Components,
	TEvent extends keyof ComponentEvent<Components[TComponentName]>
>(
	events: World["events"],
	componentName: TComponentName,
	connectionType: TEvent,
	uuid: string,
	callback: Required<
		ConnectionTypes<Components[TComponentName]>["EventConnections"]
	>[TEvent][string]
): () => void;
declare function addToConnections<
	TComponentName extends keyof Components,
	TRef extends Exclude<
		Ref,
		symbol | keyof ComponentEvent<Components[TComponentName]>
	>
>(
	events: World["events"],
	componentName: TComponentName,
	connectionType: TRef,
	uuid: string,
	callback: ConnectionTypes<
		Components[TComponentName]
	>["RefConnections"][any][string]
): () => void;

export = addToConnections;
