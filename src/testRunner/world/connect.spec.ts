/// <reference types="@rbxts/testez/globals" />

import { World } from "index";
import { deepEquals } from "@driftshark/table";
import { named } from "@driftshark/symbol";

export = () => {
	let count = 0;
	const fn = () => {
		count += 1;
	};

	it("should connect to base", () => {
		const world = new World("world");
		const TEST_REF = {};
		const TEST_REF_2 = {};

		count = 0;
		const disconnectFn = world.onComponent("ReplicationGroup", fn, "uuid");

		expect(
			deepEquals(world["events"], {
				ReplicationGroup: {
					[named("base")]: { uuid: fn },
				},
			})
		).to.equal(true);

		world.addComponent(TEST_REF, "ReplicationGroup", {});
		expect(count).to.equal(1);
		disconnectFn();
		world.addComponent(TEST_REF_2, "ReplicationGroup", {});
		expect(count).to.equal(1);

		expect(deepEquals(world["events"], {})).to.equal(true);
	});

	it("should connect to ComponentEvent", () => {
		const world = new World("world");
		const TEST_REF = {};
		const TEST_REF_2 = {};

		count = 0;
		const disconnectFn = world.onComponentEvent(
			"ReplicationGroup",
			"Created",
			fn,
			"uuid"
		);

		expect(
			deepEquals(world["events"], {
				ReplicationGroup: {
					["Created"]: { uuid: fn },
				},
			})
		).to.equal(true);

		world.addComponent(TEST_REF, "ReplicationGroup", {});
		expect(count).to.equal(1);
		disconnectFn();
		world.addComponent(TEST_REF_2, "ReplicationGroup", {});
		expect(count).to.equal(1);

		expect(deepEquals(world["events"], {})).to.equal(true);
	});

	it("should connect to ref", () => {
		const world = new World("world");
		const TEST_REF = {};

		count = 0;
		const disconnectFn = world.onRef("ReplicationGroup", TEST_REF, fn, "uuid");

		expect(
			deepEquals(world["events"], {
				ReplicationGroup: new Map([[TEST_REF, { uuid: fn }]]),
			})
		).to.equal(true);

		world.addComponent(TEST_REF, "ReplicationGroup", {});
		expect(count).to.equal(1);
		disconnectFn();
		world.removeComponent(TEST_REF, "ReplicationGroup");
		world.addComponent(TEST_REF, "ReplicationGroup", {});
		expect(count).to.equal(1);

		expect(deepEquals(world["events"], {})).to.equal(true);
	});
};
