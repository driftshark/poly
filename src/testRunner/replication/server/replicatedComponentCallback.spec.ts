/// <reference types="@rbxts/testez/globals" />

import { GroupIdToSubscribers } from "replication/cache";
import createServerUtilities from "replication/server/createServerUtilities";
import { deepEquals } from "util/tableUtil";
import libworld, { libReplicatedComponents } from "../lib/libworld";
import mockRemote from "../lib/mockRemote";

export = () => {
	const TEST_REF = "testRef";

	const TEST_PLAYER = "testPlayer" as unknown as Player;
	const TEST_PLAYER_2 = "testPlayer2" as unknown as Player;

	const TEST_REPLICATION_GROUP = "testGroup";

	let fn = (...args: unknown[]) => {};
	const mockEvent = mockRemote((...args: unknown[]) => {
		fn(...args);
	});

	const subscribers: GroupIdToSubscribers = {};

	const { createReplicatedComponentCallback } = createServerUtilities(
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

	const callback = createReplicatedComponentCallback(
		//@ts-ignore
		"KeyedReplicatedComponent"
	);

	it("should do nothing when group id of component is not specified", () => {
		expect(callback("Created", TEST_REF, {})).to.equal(false);

		libworld.addComponent(TEST_REF, "ReplicationGroup", {
			ReplicationSubscription: TEST_REPLICATION_GROUP,
		});

		expect(callback("Created", TEST_REF, {})).to.equal(false);

		libworld.removeRef(TEST_REF);
	});

	it("should do nothing when no subscribers", () => {
		libworld.addComponent(TEST_REF, "ReplicationGroup", {
			//@ts-ignore
			KeyedReplicatedComponent: TEST_REPLICATION_GROUP,
		});

		expect(callback("Created", TEST_REF, {})).to.equal(false);

		libworld.removeRef(TEST_REF);
	});

	it("should notify subscribers on update unless None", () => {
		libworld.addComponent(TEST_REF, "ReplicationGroup", {
			//@ts-ignore
			KeyedReplicatedComponent: TEST_REPLICATION_GROUP,
		});

		subscribers[TEST_REPLICATION_GROUP] = new Map([
			[TEST_PLAYER, true],
			[TEST_PLAYER_2, true],
		]);

		let count = 0;
		fn = (subscriber, ref, componentName, payload) => {
			count += 1;

			expect(
				subscriber === TEST_PLAYER || subscriber === TEST_PLAYER_2
			).to.equal(true);
			expect(ref).to.equal(TEST_REF);
			expect(componentName).to.equal("KeyedReplicatedComponent");
			expect(deepEquals(payload, { among: "they" })).to.equal(true);
		};

		//None
		expect(callback("Updated", TEST_REF, {}, {})).to.equal(undefined);
		expect(count).to.equal(0);

		//actual update
		expect(
			//@ts-ignore
			callback("Updated", TEST_REF, { among: "us" }, { among: "they" })
		).to.equal(undefined);
		expect(count).to.equal(2);

		subscribers[TEST_REPLICATION_GROUP] = undefined;

		libworld.removeRef(TEST_REF);
	});

	it("should notify subscribers on creation", () => {
		libworld.addComponent(TEST_REF, "ReplicationGroup", {
			//@ts-ignore
			KeyedReplicatedComponent: TEST_REPLICATION_GROUP,
		});

		subscribers[TEST_REPLICATION_GROUP] = new Map([
			[TEST_PLAYER, true],
			[TEST_PLAYER_2, true],
		]);

		let count = 0;
		fn = (subscriber, ref, componentName, data) => {
			count += 1;

			expect(
				subscriber === TEST_PLAYER || subscriber === TEST_PLAYER_2
			).to.equal(true);
			expect(ref).to.equal(TEST_REF);
			expect(componentName).to.equal("KeyedReplicatedComponent");
			expect(deepEquals(data, { among: "vent" })).to.equal(true);
		};

		expect(
			//@ts-ignore
			callback("Created", TEST_REF, { among: "vent" })
		).to.equal(undefined);
		expect(count).to.equal(2);

		subscribers[TEST_REPLICATION_GROUP] = undefined;

		libworld.removeRef(TEST_REF);
	});

	it("should notify subscribers on removal", () => {
		libworld.addComponent(TEST_REF, "ReplicationGroup", {
			//@ts-ignore
			KeyedReplicatedComponent: TEST_REPLICATION_GROUP,
		});

		subscribers[TEST_REPLICATION_GROUP] = new Map([
			[TEST_PLAYER, true],
			[TEST_PLAYER_2, true],
		]);

		let count = 0;
		fn = (subscriber, ref, componentName) => {
			count += 1;

			expect(
				subscriber === TEST_PLAYER || subscriber === TEST_PLAYER_2
			).to.equal(true);
			expect(ref).to.equal(TEST_REF);
			expect(componentName).to.equal("KeyedReplicatedComponent");
		};

		expect(
			//@ts-ignore
			callback("Removing", TEST_REF)
		).to.equal(undefined);
		expect(count).to.equal(2);

		subscribers[TEST_REPLICATION_GROUP] = undefined;

		libworld.removeRef(TEST_REF);
	});
};
