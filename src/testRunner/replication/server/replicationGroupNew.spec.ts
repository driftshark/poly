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

	const GROUP_EXISTING_ARRAY = "testAddExisting";
	const GROUP_EMPTY = "testEmpty";
	const GROUP_NO_SUBS = "testNoSub";
	const GROUP_NEVER = "testNever";

	let fn = (...args: unknown[]) => {};
	const mockEvent = mockRemote((...args: unknown[]) => {
		fn(...args);
	});

	const subscribers: GroupIdToSubscribers = {
		[GROUP_EXISTING_ARRAY]: new Map([
			[TEST_PLAYER, true],
			[TEST_PLAYER_2, true],
		]),
		[GROUP_EMPTY]: new Map([[TEST_PLAYER_2, true]]),
	};
	const entities: GroupIdToEntity = {
		//@ts-ignore
		[GROUP_EXISTING_ARRAY]: new Map([
			[
				TEST_REF_2,
				["ExactReplicatedComponent", "ExactReplicatedComponentObject"],
			],
		]),
		//@ts-ignore
		[GROUP_NO_SUBS]: new Map([[TEST_REF, ["O"]]]),
	};

	const { handleNewReplicationGroup } = createServerUtilities(
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

	it("should notify subscribers of component creation", () => {
		let count = 0;
		fn = (subscriber, ref, componentName, replicatedData) => {
			count += 1;

			if (subscriber !== TEST_PLAYER && subscriber !== TEST_PLAYER_2) {
				expect(0).to.equal(1);
			}

			expect(ref).to.equal(TEST_REF);

			if (componentName === "DiffReplicatedComponentObject") {
				expect(subscriber).to.equal(TEST_PLAYER_2);
				expect(deepEquals(replicatedData, { among: "us" })).to.equal(true);
			} else {
				expect(componentName).to.never.equal("KeyedReplicatedComponent");
				expect(componentName).to.equal("ExactReplicatedComponent");
				expect(replicatedData).to.equal(true);
			}
		};

		//@ts-ignore
		libworld.addComponent(TEST_REF, "ExactReplicatedComponent", true);
		//@ts-ignore
		libworld.addComponent(TEST_REF, "KeyedReplicatedComponent", {});
		libworld.addComponent(
			TEST_REF, //@ts-ignore
			"ExactReplicatedComponentWithInteract",
			true
		);
		//@ts-ignore
		libworld.addComponent(TEST_REF, "DiffReplicatedComponentObject", {
			among: "us",
		});
		libworld.addComponent(
			TEST_REF, //@ts-ignore
			"ExactReplicatedComponentWithConsumer",
			false
		);
		libworld.addComponent(TEST_REF, "Old", true);

		handleNewReplicationGroup(TEST_REF, {
			//@ts-ignore
			ExactReplicatedComponent: GROUP_EXISTING_ARRAY,
			KeyedReplicatedComponent: GROUP_EXISTING_ARRAY,
			DiffReplicatedComponentObject: GROUP_EMPTY,
			ExactReplicatedComponentWithConsumer: GROUP_NO_SUBS,
			Old: GROUP_NEVER,
		});

		expect(
			deepEquals(entities, {
				[GROUP_EXISTING_ARRAY]: {
					[TEST_REF]: ["KeyedReplicatedComponent", "ExactReplicatedComponent"],
					[TEST_REF_2]: [
						"ExactReplicatedComponent",
						"ExactReplicatedComponentObject",
					],
				},
				[GROUP_EMPTY]: {
					[TEST_REF]: ["DiffReplicatedComponentObject"],
				},
				[GROUP_NO_SUBS]: {
					[TEST_REF]: ["O", "ExactReplicatedComponentWithConsumer"],
				},
			})
		).to.equal(true);
		expect(count).to.equal(3);

		libworld.removeRef(TEST_REF);
	});
};
