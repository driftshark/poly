/// <reference types="@rbxts/testez/globals" />

import { GroupIdToEntity, GroupIdToSubscribers } from "replication/cache";
import { BulkType } from "replication/events";
import createServerUtilities from "replication/server/createServerUtilities";
import { deepEquals } from "util/tableUtil";
import libworld, { libReplicatedComponents } from "../lib/libworld";
import mockRemote from "../lib/mockRemote";

export = () => {
	const TEST_REF = "testRef";
	const TEST_REF_2 = "testRef2";

	const TEST_PLAYER = "testPlayer" as unknown as Player;
	const TEST_PLAYER_2 = "testPlayer2" as unknown as Player;

	const NO_CHANGE_GROUP = "noChange";
	const ADD_TO_EXISTING_GROUP = "addToExisting";
	const EMPTY_GROUP = "emptyGroup";
	const REMOVE_FROM_EXISTING_GROUP = "removeExistingGroup";
	const REMOVE_FROM_EMPTY_GROUP = "removeEmptyGroup";
	const REMOVE_GROUP_WITH_NO_ENTITIES = "removeNoEntities";
	const REMOVE_GROUP_WITH_ENTITIES = "removeWithEntities";

	let bulkRemoveFn = (...args: unknown[]) => {};
	const mockBulkRemoveEvent = mockRemote((...args: unknown[]) => {
		bulkRemoveFn(...args);
	});

	let bulkCreateFn = (...args: unknown[]) => {};
	const mockBulkCreateEvent = mockRemote((...args: unknown[]) => {
		bulkCreateFn(...args);
	});

	const subscribers: GroupIdToSubscribers = {
		[NO_CHANGE_GROUP]: new Map([
			[TEST_PLAYER, true],
			[TEST_PLAYER_2, true],
		]),
		[ADD_TO_EXISTING_GROUP]: new Map([[TEST_PLAYER_2, true]]),
		[REMOVE_FROM_EXISTING_GROUP]: new Map([
			[TEST_PLAYER, true],
			[TEST_PLAYER_2, true],
		]),
		[REMOVE_FROM_EMPTY_GROUP]: new Map([[TEST_PLAYER, true]]),
		[REMOVE_GROUP_WITH_NO_ENTITIES]: new Map([[TEST_PLAYER, true]]),
		[REMOVE_GROUP_WITH_ENTITIES]: new Map([[TEST_PLAYER, true]]),
	};
	const entities: GroupIdToEntity = {
		[ADD_TO_EXISTING_GROUP]: new Map(),
		//@ts-ignore
		[REMOVE_GROUP_WITH_ENTITIES]: new Map([
			[
				TEST_REF,
				["ExactReplicatedComponentObject", "ExactReplicatedComponent"],
			],
			[
				TEST_REF_2,
				["ExactReplicatedComponent", "ExactReplicatedComponentObject"],
			],
		]),
	};

	const { handleUpdatedReplicationSubscription } = createServerUtilities(
		libworld,
		entities,
		subscribers,
		libReplicatedComponents, //@ts-ignore
		undefined,
		mockBulkCreateEvent,
		undefined,
		undefined,
		mockBulkRemoveEvent
	);

	it("should update replication subscription", () => {
		let createCount = 0;
		bulkCreateFn = (subscriber, batchData) => {
			createCount += 1;
			expect(subscriber).to.equal(TEST_PLAYER);
		};

		let removeCount = 0;
		bulkRemoveFn = (subscriber, bulkType, batchData) => {
			removeCount += 1;
			expect(subscriber).to.equal(TEST_PLAYER);
			expect(bulkType).to.equal(BulkType.ComponentToDescription);

			expect(
				deepEquals(batchData, {
					ExactReplicatedComponent: [TEST_REF_2, TEST_REF],
					ExactReplicatedComponentObject: [TEST_REF_2],
				})
			).to.equal(true);
		};

		//@ts-ignore
		libworld.addComponent(TEST_REF, "ExactReplicatedComponent", true);

		//@ts-ignore
		libworld.addComponent(TEST_REF_2, "ExactReplicatedComponent", true);

		//@ts-ignore
		libworld.addComponent(TEST_REF_2, "ExactReplicatedComponentObject", true);

		handleUpdatedReplicationSubscription(
			TEST_PLAYER,
			new Map([
				[NO_CHANGE_GROUP, true],
				[EMPTY_GROUP, true],
				[ADD_TO_EXISTING_GROUP, true],
			]),
			new Map([
				[REMOVE_GROUP_WITH_NO_ENTITIES, true],
				[NO_CHANGE_GROUP, true],
				[REMOVE_FROM_EXISTING_GROUP, true],
				[REMOVE_FROM_EMPTY_GROUP, true],
				[REMOVE_GROUP_WITH_ENTITIES, true],
			])
		);

		expect(
			deepEquals(subscribers, {
				[NO_CHANGE_GROUP]: new Map([
					[TEST_PLAYER, true],
					[TEST_PLAYER_2, true],
				]),
				[EMPTY_GROUP]: new Map([[TEST_PLAYER, true]]),
				[ADD_TO_EXISTING_GROUP]: new Map([
					[TEST_PLAYER, true],
					[TEST_PLAYER_2, true],
				]),
				[REMOVE_FROM_EXISTING_GROUP]: new Map([[TEST_PLAYER_2, true]]),
			})
		).to.equal(true);
		expect(createCount).to.equal(1);
		expect(removeCount).to.equal(1);

		libworld.removeRef(TEST_REF);
		libworld.removeRef(TEST_REF_2);
	});
};
