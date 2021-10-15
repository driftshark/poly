/// <reference types="@rbxts/testez/globals" />

import { GroupIdToEntity, GroupIdToSubscribers } from "replication/cache";
import { BulkType } from "replication/events";
import createServerUtilities from "replication/server/createServerUtilities";
import { deepEquals } from "@driftshark/table";
import libworld, { libReplicatedComponents } from "../lib/libworld";
import mockRemote from "../lib/mockRemote";

export = () => {
	const TEST_REF = "testRef";
	const TEST_REF_2 = "testRef2";

	const TEST_PLAYER = "testPlayer" as unknown as Player;
	const TEST_PLAYER_2 = "testPlayer2" as unknown as Player;

	const REMOVE_FROM_EXISTING_GROUP = "removeExistingGroup";
	const REMOVE_FROM_EMPTY_GROUP = "removeEmptyGroup";
	const REMOVE_FROM_NO_ENTITIES = "removeNoEntities";
	const REMOVE_FROM_NO_SUBS = "removeNoSub";

	let fn = (...args: unknown[]) => {};
	const mockEvent = mockRemote((...args: unknown[]) => {
		fn(...args);
	});

	const subscribers: GroupIdToSubscribers = {
		[REMOVE_FROM_EXISTING_GROUP]: new Map([
			[TEST_PLAYER, true],
			[TEST_PLAYER_2, true],
		]),
		[REMOVE_FROM_EMPTY_GROUP]: new Map([[TEST_PLAYER_2, true]]),
	};
	const entities: GroupIdToEntity = {
		//@ts-ignore
		[REMOVE_FROM_EXISTING_GROUP]: new Map([
			[
				TEST_REF,
				["ExactReplicatedComponentObject", "ExactReplicatedComponent"],
			],
			[
				TEST_REF_2,
				["ExactReplicatedComponent", "ExactReplicatedComponentObject"],
			],
		]), //@ts-ignore
		[REMOVE_FROM_EMPTY_GROUP]: new Map([
			[TEST_REF, ["DiffReplicatedComponentObject"]],
		]), //@ts-ignore
		[REMOVE_FROM_NO_SUBS]: new Map([
			[TEST_REF, ["ExactReplicatedComponentWithConsumer"]],
		]),
	};

	const { handleRemovingReplicationGroup } = createServerUtilities(
		libworld,
		entities,
		subscribers,
		libReplicatedComponents,
		mockEvent,
		mockEvent,
		mockEvent,
		mockEvent,
		mockEvent
	);

	it("should notify subscribers and clear group id map", () => {
		let count = 0;
		fn = (subscriber, bulkType, connectedComponents, ref) => {
			count += 1;

			expect(bulkType).to.equal(BulkType.RefToComponents);
			expect(ref).to.equal(TEST_REF);

			if ((connectedComponents as []).size() > 1) {
				if (subscriber !== TEST_PLAYER && subscriber !== TEST_PLAYER_2) {
					expect(0).to.equal(1);
				}

				expect(
					deepEquals(connectedComponents, [
						"ExactReplicatedComponentObject",
						"ExactReplicatedComponent",
					])
				).to.equal(true);
			} else {
				expect(subscriber).to.equal(TEST_PLAYER_2);
				expect(
					deepEquals(connectedComponents, ["DiffReplicatedComponentObject"])
				).to.equal(true);
			}
		};

		handleRemovingReplicationGroup(TEST_REF, {
			//@ts-ignore
			ExactReplicatedComponent: REMOVE_FROM_EXISTING_GROUP,
			ExactReplicatedComponentObject: REMOVE_FROM_EXISTING_GROUP,
			DiffReplicatedComponentObject: REMOVE_FROM_EMPTY_GROUP,
			ExactReplicatedComponentWithConsumer: REMOVE_FROM_NO_SUBS,
			placeholder: REMOVE_FROM_NO_ENTITIES,
		});

		expect(
			deepEquals(entities, {
				[REMOVE_FROM_EXISTING_GROUP]: new Map([
					[
						TEST_REF_2,
						["ExactReplicatedComponent", "ExactReplicatedComponentObject"],
					],
				]),
			})
		).to.equal(true);

		expect(count).to.equal(3);
	});
};
