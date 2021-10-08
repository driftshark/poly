import { GroupIdToSubscribers } from "../cache";
import {
	BulkCreateEvent,
	BulkRemoveEvent,
	CreateEvent,
	RemoveEvent,
	UpdateEvent,
} from "../events";

declare function notifySubscribers<
	TEvent extends
		| CreateEvent
		| UpdateEvent
		| RemoveEvent
		| BulkCreateEvent
		| BulkRemoveEvent,
	TParameters extends TEvent extends RemoteEvent<infer Callback>
		? Parameters<Callback>
		: never
>(
	subMap: NonNullable<GroupIdToSubscribers[keyof GroupIdToSubscribers]>,
	eventInstance: TEvent,
	...args: TParameters
): void;
