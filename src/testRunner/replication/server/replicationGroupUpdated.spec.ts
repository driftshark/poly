/// <reference types="@rbxts/testez/globals" />

import { ReplicationType } from "replication";
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

	const OLD_SUB = "testOldSub";

	const COMPONENT_NO_CHANGE = "nochang";
	const COMPONENT_REMOVAL_1 = "removal1";
	const COMPONENT_REMOVAL_2 = "removal2";
	const COMPONENT_REMOVAL_3 = "removal3";
	const COMPONENT_NEW_1 = "NEW1";
	const COMPONENT_NEW_2 = "NEW2";
	const COMPONENT_NEW_3 = "NEW3";
	const COMPONENT_NEW_4 = "NEW4";

	const COMPONENT_CHANGE_1 = "CHANGE1";
	const COMPONENT_CHANGE_2 = "CHANGE2";
	const COMPONENT_CHANGE_3 = "CHANGE3";
	const COMPONENT_CHANGE_4 = "CHANGE4";

	const GROUP_REMOVE_EXISTING_ARRAY = "testRemoveExisting";
	const GROUP_REMOVE_EXISTING_MAP = "testRemoveEmptyArr";
	const GROUP_REMOVE_EMPTY_MAP = "testRemoveEmptyMap";
	const GROUP_CHANGE_NO_NEW_SUB = "testChangeNoNewSub";
	const GROUP_CHANGE_NO_COMP = "testChangeNoComp";
	const GROUP_CHANGE_NO_REPLICATED = "testChangeNoReplicated";
	const GROUP_CHANGE_SUCCESS = "testChangeSuccess";
	const GROUP_NEW = "testNew";
	const GROUP_NEW_NO_COMP = "testNewNoComp";
	const GROUP_NEW_NO_REPLICATED = "testNewNoReplicated";
	const GROUP_NEW_NO_SUB = "testNewNoSub";
	const GROUP_NO_CHANGE = "testNoChange";

	const oldReplicationGroupData = {
		[COMPONENT_NO_CHANGE]: GROUP_NO_CHANGE,

		[COMPONENT_CHANGE_1]: OLD_SUB,
		[COMPONENT_CHANGE_2]: OLD_SUB,
		[COMPONENT_CHANGE_3]: OLD_SUB,
		[COMPONENT_CHANGE_4]: OLD_SUB,
	};
	const newReplicationGroupData = {
		[COMPONENT_NO_CHANGE]: GROUP_NO_CHANGE,

		[COMPONENT_CHANGE_1]: GROUP_CHANGE_NO_NEW_SUB,
		[COMPONENT_CHANGE_2]: GROUP_CHANGE_NO_COMP,
		[COMPONENT_CHANGE_3]: GROUP_CHANGE_NO_REPLICATED,
		[COMPONENT_CHANGE_4]: GROUP_CHANGE_SUCCESS,
	};

	let fn = (...args: unknown[]) => {};
	const mockEvent = mockRemote((...args: unknown[]) => {
		fn(...args);
	});

	let removeFn = (...args: unknown[]) => {};
	const mockRemoveEvent = mockRemote((...args: unknown[]) => {
		removeFn(...args);
	});

	let createFn = (...args: unknown[]) => {};
	const mockCreateEvent = mockRemote((...args: unknown[]) => {
		createFn(...args);
	});

	const subscribers: GroupIdToSubscribers = {
		[GROUP_NO_CHANGE]: new Map([[TEST_PLAYER, true]]),
		[OLD_SUB]: new Map([[TEST_PLAYER, true]]),
		[GROUP_REMOVE_EXISTING_MAP]: new Map([[TEST_PLAYER, true]]),
		[GROUP_REMOVE_EMPTY_MAP]: new Map([[TEST_PLAYER, true]]),
		[GROUP_NEW]: new Map([[TEST_PLAYER, true]]),
		[GROUP_NEW_NO_COMP]: new Map([[TEST_PLAYER, true]]),
		[GROUP_NEW_NO_REPLICATED]: new Map([[TEST_PLAYER, true]]),

		[GROUP_CHANGE_NO_COMP]: new Map([[TEST_PLAYER, true]]),
		[GROUP_CHANGE_NO_REPLICATED]: new Map([[TEST_PLAYER, true]]),
		[GROUP_CHANGE_SUCCESS]: new Map([[TEST_PLAYER, true]]),
	};
	const entities: GroupIdToEntity = {};

	const { handleUpdatedReplicationGroup } = createServerUtilities(
		libworld,
		entities,
		subscribers,
		libReplicatedComponents,
		mockCreateEvent,
		mockEvent,
		mockEvent,
		mockRemoveEvent,
		mockEvent
	);

	//if old subs, but no new subs, remove all for old subs
	//if component doesn't exist for new, remove all for old subs
	//if replicated data doesn't exist for new, remove all for old subs
	//else, if new subscribers does not have old sub, then remove for that
	//else, if old subs does not have new sub, then add for that

	it("should create group ids", () => {
		const oldReplicationGroupData = {};
		const newReplicationGroupData = {
			[COMPONENT_NEW_1]: GROUP_NEW,
			[COMPONENT_NEW_2]: GROUP_NEW_NO_COMP,
			[COMPONENT_NEW_3]: GROUP_NEW_NO_REPLICATED,
			[COMPONENT_NEW_4]: GROUP_NEW_NO_SUB,
		};

		//@ts-ignore
		libReplicatedComponents[COMPONENT_NEW_1] = ReplicationType.Exact;
		//@ts-ignore
		libReplicatedComponents[COMPONENT_NEW_3] = {
			among: ReplicationType.Exact,
		};
		//@ts-ignore
		libworld.addComponent(TEST_REF, COMPONENT_NEW_1, true);
		//@ts-ignore
		libworld.addComponent(TEST_REF, COMPONENT_NEW_3, { us: true });

		//@ts-ignore
		entities[GROUP_NEW_NO_COMP] = new Map([[TEST_REF, ["dddd"]]]);

		let removeCount = 0;
		removeFn = (subscriber, ref, componentName) => {
			removeCount += 1;
		};

		let createCount = 0;
		createFn = (subscriber, ref, key, replicatedData) => {
			createCount += 1;
			expect(subscriber).to.equal(TEST_PLAYER);
			expect(ref).to.equal(TEST_REF);
			expect(key).to.equal(COMPONENT_NEW_1);
			expect(replicatedData).to.equal(true);
		};

		handleUpdatedReplicationGroup(
			TEST_REF, //@ts-ignore
			newReplicationGroupData,
			oldReplicationGroupData
		);

		expect(
			deepEquals(entities, {
				[GROUP_NEW]: new Map([[TEST_REF, [COMPONENT_NEW_1]]]),
				[GROUP_NEW_NO_COMP]: new Map([[TEST_REF, ["dddd", COMPONENT_NEW_2]]]),
				[GROUP_NEW_NO_REPLICATED]: new Map([[TEST_REF, [COMPONENT_NEW_3]]]),
				[GROUP_NEW_NO_SUB]: new Map([[TEST_REF, [COMPONENT_NEW_4]]]),
			})
		).to.equal(true);

		expect(removeCount).to.equal(0);
		expect(createCount).to.equal(1);

		for (const [i] of pairs(entities)) {
			entities[i] = undefined;
		}
		libworld.removeRef(TEST_REF);
	});

	it("should remove group ids", () => {
		const oldReplicationGroupData = {
			[COMPONENT_REMOVAL_1]: GROUP_REMOVE_EXISTING_ARRAY, //no sub
			[COMPONENT_REMOVAL_2]: GROUP_REMOVE_EXISTING_MAP, //new group
			[COMPONENT_REMOVAL_3]: GROUP_REMOVE_EMPTY_MAP, //should replicate
		};

		const newReplicationGroupData = {
			[COMPONENT_REMOVAL_2]: OLD_SUB,
		};

		//@ts-ignore
		entities[GROUP_REMOVE_EXISTING_ARRAY] = new Map([
			[TEST_REF, [COMPONENT_REMOVAL_1, "sss"]],
		]);
		//@ts-ignore
		entities[GROUP_REMOVE_EXISTING_MAP] = new Map([
			[TEST_REF, [COMPONENT_REMOVAL_2]],
			[TEST_REF_2, [COMPONENT_REMOVAL_2]],
		]);
		//@ts-ignore
		entities[GROUP_REMOVE_EMPTY_MAP] = new Map([
			[TEST_REF, [COMPONENT_REMOVAL_3]],
		]);

		let count = 0;
		removeFn = (subscriber, ref, componentName) => {
			count += 1;
			expect(subscriber).to.equal(TEST_PLAYER);
			expect(ref).to.equal(TEST_REF);
			if (
				componentName !== COMPONENT_REMOVAL_3 &&
				componentName !== COMPONENT_REMOVAL_2
			) {
				expect(0).to.equal(1);
			}
		};

		handleUpdatedReplicationGroup(
			TEST_REF, //@ts-ignore
			newReplicationGroupData,
			oldReplicationGroupData
		);

		expect(
			deepEquals(entities, {
				[GROUP_REMOVE_EXISTING_ARRAY]: new Map([[TEST_REF, ["sss"]]]),
				[GROUP_REMOVE_EXISTING_MAP]: new Map([
					[TEST_REF_2, [COMPONENT_REMOVAL_2]],
				]),
				[OLD_SUB]: new Map([[TEST_REF, [COMPONENT_REMOVAL_2]]]),
			})
		).to.equal(true);

		for (const [i] of pairs(entities)) {
			entities[i] = undefined;
		}

		expect(count).to.equal(2);
	});

	it("should change group ids", () => {});
};
