/// <reference types="@rbxts/testez/globals" />

import { GroupIdToSubscribers } from "replication/cache";
import createServerUtilities from "replication/server/createServerUtilities";
import { deepEquals } from "util/tableUtil";
import libworld, { libReplicatedComponents } from "../lib/libworld";
import mockRemote from "../lib/mockRemote";

export = () => {
	const TEST_PLAYER = "testPlayer" as unknown as Player;
	const TEST_PLAYER_2 = "testPlayer2" as unknown as Player;

	const TEST_REPLICATION_GROUP = "testGroup";
	const TEST_REPLICATION_GROUP_2 = "testGroup2";

	let fn = (...args: unknown[]) => {};
	const mockEvent = mockRemote((...args: unknown[]) => {
		fn(...args);
	});

	const subscribers: GroupIdToSubscribers = {};

	const { handleNewReplicationSubscription } = createServerUtilities(
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

	it("should replicate group ids, add to subscriber list, and replicate batch", () => {
		subscribers[TEST_REPLICATION_GROUP_2] = new Map([[TEST_PLAYER_2, true]]);

		let count = 0;
		fn = (ref, batchData) => {
			count += 1;
			expect(ref).to.equal(TEST_PLAYER);
		};

		handleNewReplicationSubscription(
			TEST_PLAYER,
			new Map([
				[TEST_REPLICATION_GROUP, true],
				[TEST_REPLICATION_GROUP_2, true],
			])
		);
		expect(
			deepEquals(subscribers, {
				[TEST_REPLICATION_GROUP]: new Map([[TEST_PLAYER, true]]),
				[TEST_REPLICATION_GROUP_2]: new Map([
					[TEST_PLAYER, true],
					[TEST_PLAYER_2, true],
				]),
			})
		).to.equal(true);
		expect(count).to.equal(2);
	});
};
