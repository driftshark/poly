/// <reference types="@rbxts/testez/globals" />

import { GroupIdToSubscribers } from "replication/cache";
import createServerUtilities from "replication/server/createServerUtilities";
import { deepEquals } from "@driftshark/table";
import libworld, { libReplicatedComponents } from "../lib/libworld";
import mockRemote from "../lib/mockRemote";

export = () => {
	const TEST_PLAYER = "testPlayer" as unknown as Player;
	const TEST_PLAYER_2 = "testPlayer2" as unknown as Player;

	const TEST_REPLICATION_GROUP = "testGroup";
	const TEST_REPLICATION_GROUP_2 = "testGroup2";
	const TEST_REPLICATION_GROUP_3 = "testGroup3";

	let fn = (...args: unknown[]) => {};
	const mockEvent = mockRemote((...args: unknown[]) => {
		fn(...args);
	});

	const subscribers: GroupIdToSubscribers = {};

	const { handleRemovingReplicationSubscription } = createServerUtilities(
		libworld,
		{},
		subscribers,
		libReplicatedComponents,
		mockEvent,
		mockEvent,
		mockEvent,
		mockEvent,
		mockEvent
	);

	it("should delete ref from group id map and delete group id map if empty", () => {
		subscribers[TEST_REPLICATION_GROUP] = new Map([
			[TEST_PLAYER, true],
			[TEST_PLAYER_2, true],
		]);
		subscribers[TEST_REPLICATION_GROUP_2] = new Map([[TEST_PLAYER_2, true]]);
		subscribers[TEST_REPLICATION_GROUP_3] = new Map([[TEST_PLAYER, true]]);

		expect(
			deepEquals(subscribers, {
				[TEST_REPLICATION_GROUP]: new Map([
					[TEST_PLAYER, true],
					[TEST_PLAYER_2, true],
				]),
				[TEST_REPLICATION_GROUP_2]: new Map([[TEST_PLAYER_2, true]]),
				[TEST_REPLICATION_GROUP_3]: new Map([[TEST_PLAYER, true]]),
			})
		).to.equal(true);

		handleRemovingReplicationSubscription(
			TEST_PLAYER,
			new Map([
				[TEST_REPLICATION_GROUP, true],
				[TEST_REPLICATION_GROUP_2, true],
				[TEST_REPLICATION_GROUP_3, true],
			])
		);

		expect(
			deepEquals(subscribers, {
				[TEST_REPLICATION_GROUP]: new Map([[TEST_PLAYER_2, true]]),
				[TEST_REPLICATION_GROUP_2]: new Map([[TEST_PLAYER_2, true]]),
			})
		).to.equal(true);
	});
};
