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
	const TEST_PLAYER_2 = "testPlayer2" as unknown as Player;

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
	const GROUP_SUB_BUT_NOT_TEST_PLAYER = "testNoTestPlayer";

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
		[GROUP_SUB_BUT_NOT_TEST_PLAYER]: new Map([[TEST_PLAYER_2, true]]),
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

	it("should not change anything", () => {
		expect(deepEquals(entities, {})).to.equal(true);

		handleUpdatedReplicationGroup(
			TEST_REF,
			{
				//@ts-ignore
				[COMPONENT_NO_CHANGE]: GROUP_NO_CHANGE,
			},
			{ [COMPONENT_NO_CHANGE]: GROUP_NO_CHANGE }
		);

		expect(deepEquals(entities, {})).to.equal(true);
	});

	it("should remove all for old subs when no new subs", () => {
		const oldReplicationGroupData = {
			[COMPONENT_CHANGE_1]: OLD_SUB,
		};

		const newReplicationGroupData = {
			[COMPONENT_CHANGE_1]: GROUP_NEW_NO_SUB,
		};

		let removeCount = 0;
		removeFn = (subscriber, ref, componentName) => {
			removeCount += 1;

			expect(subscriber).to.equal(TEST_PLAYER);
			expect(ref).to.equal(TEST_REF);
			expect(componentName).to.equal(COMPONENT_CHANGE_1);
		};

		let createCount = 0;
		createFn = (subscriber, ref, key, replicatedData) => {
			createCount += 1;
		};

		handleUpdatedReplicationGroup(
			TEST_REF, //@ts-ignore
			newReplicationGroupData,
			oldReplicationGroupData
		);

		expect(
			deepEquals(entities, {
				[GROUP_NEW_NO_SUB]: new Map([[TEST_REF, [COMPONENT_CHANGE_1]]]),
			})
		).to.equal(true);
		expect(removeCount).to.equal(1);
		expect(createCount).to.equal(0);

		for (const [i] of pairs(entities)) {
			entities[i] = undefined;
		}
	});

	it("should remove if old sub is not subbed to new", () => {
		const oldReplicationGroupData = {
			[COMPONENT_CHANGE_1]: OLD_SUB,
		};

		const newReplicationGroupData = {
			[COMPONENT_CHANGE_1]: GROUP_SUB_BUT_NOT_TEST_PLAYER,
		};

		//@ts-ignore
		libReplicatedComponents[COMPONENT_CHANGE_1] = ReplicationType.Exact;
		//@ts-ignore
		libworld.addComponent(TEST_REF, COMPONENT_CHANGE_1, true);

		let removeCount = 0;
		removeFn = (subscriber, ref, componentName) => {
			removeCount += 1;

			expect(subscriber).to.equal(TEST_PLAYER);
			expect(ref).to.equal(TEST_REF);
			expect(componentName).to.equal(COMPONENT_CHANGE_1);
		};

		let createCount = 0;
		createFn = (subscriber, ref, key, replicatedData) => {
			createCount += 1;

			expect(subscriber).to.equal(TEST_PLAYER_2);
			expect(ref).to.equal(TEST_REF);
			expect(key).to.equal(COMPONENT_CHANGE_1);
			expect(replicatedData).to.equal(true);
		};

		handleUpdatedReplicationGroup(
			TEST_REF, //@ts-ignore
			newReplicationGroupData,
			oldReplicationGroupData
		);

		expect(
			deepEquals(entities, {
				[GROUP_SUB_BUT_NOT_TEST_PLAYER]: new Map([
					[TEST_REF, [COMPONENT_CHANGE_1]],
				]),
			})
		).to.equal(true);
		expect(removeCount).to.equal(1);
		expect(createCount).to.equal(1);

		for (const [i] of pairs(entities)) {
			entities[i] = undefined;
		}
		libworld.removeRef(TEST_REF);
	});

	it("should remove all for old subscribers when replicatedData is none", () => {
		const oldReplicationGroupData = {
			[COMPONENT_CHANGE_1]: OLD_SUB,
		};

		const newReplicationGroupData = {
			[COMPONENT_CHANGE_1]: GROUP_CHANGE_SUCCESS,
		};

		//@ts-ignore
		libReplicatedComponents[COMPONENT_CHANGE_1] = {
			among: ReplicationType.Exact,
		};
		//@ts-ignore
		libworld.addComponent(TEST_REF, COMPONENT_CHANGE_1, { us: true });

		let removeCount = 0;
		removeFn = (subscriber, ref, componentName) => {
			removeCount += 1;

			expect(subscriber).to.equal(TEST_PLAYER);
			expect(ref).to.equal(TEST_REF);
			expect(componentName).to.equal(COMPONENT_CHANGE_1);
		};

		let createCount = 0;
		createFn = (subscriber, ref, key, replicatedData) => {
			createCount += 1;
		};

		handleUpdatedReplicationGroup(
			TEST_REF, //@ts-ignore
			newReplicationGroupData,
			oldReplicationGroupData
		);

		expect(
			deepEquals(entities, {
				[GROUP_CHANGE_SUCCESS]: new Map([[TEST_REF, [COMPONENT_CHANGE_1]]]),
			})
		).to.equal(true);
		expect(removeCount).to.equal(1);
		expect(createCount).to.equal(0);

		for (const [i] of pairs(entities)) {
			entities[i] = undefined;
		}
		libworld.removeRef(TEST_REF);
	});

	it("should not remove or create when subscriber is subscribed to both group ids", () => {});

	it("should add if sub is not subbed to old", () => {});

	it("should add all for new subs when no old subs", () => {});
};
