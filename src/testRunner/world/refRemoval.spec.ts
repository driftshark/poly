/// <reference types="@rbxts/testez/globals" />

import { World } from "index";
import { named } from "util/symbol";
import { deepEquals } from "util/tableUtil";

export = () => {
	const world = new World("world");
	it("should remove ref and its components", () => {
		const TEST_REF = "testRef";
		const TEST_REF_2 = "testRef2";

		world.addComponent(
			TEST_REF,
			"ReplicationGroup",
			new Map([["among", "us"]])
		);

		world.addComponent(
			TEST_REF as unknown as Player,
			"ReplicationSubscription",
			new Map([["among", true]])
		);

		world.addComponent(
			TEST_REF_2,
			"ReplicationGroup",
			new Map([["the", "skeld"]])
		);

		const fn = () => {};
		const disconnects = [];
		disconnects.push(world.onRef("ReplicationGroup", TEST_REF, fn, "uuid"));
		disconnects.push(world.onRef("Old", TEST_REF, fn, "uuid"));
		disconnects.push(world.onComponent("ReplicationGroup", fn, "uuid"));
		disconnects.push(
			world.onComponentEvent("ReplicationGroup", "Created", fn, "uuid")
		);
		disconnects.push(
			world.onComponentEvent("ReplicationSubscription", "Created", fn, "uuid")
		);
		//@ts-ignore
		disconnects.push(world.onRef("PlaceholderComponent", TEST_REF, fn, "uuid"));
		disconnects.push(
			//@ts-ignore
			world.onComponentEvent("PlaceholderComponent", "Created", fn, "uuid")
		);

		expect(
			deepEquals(world["componentToRefs"], {
				ReplicationGroup: {
					[TEST_REF]: { among: "us" },
					[TEST_REF_2]: { the: "skeld" },
				},
				ReplicationSubscription: { [TEST_REF]: { among: true } },
			})
		).to.equal(true);
		expect(
			deepEquals(world["refToComponents"], {
				[TEST_REF]: {
					ReplicationGroup: true,
					ReplicationSubscription: true,
				},
				[TEST_REF_2]: {
					ReplicationGroup: true,
				},
			})
		).to.equal(true);
		expect(
			deepEquals(world["events"], {
				ReplicationGroup: {
					[TEST_REF]: { uuid: fn },
					[named("base")]: { uuid: fn },
					Created: { uuid: fn },
				},
				ReplicationSubscription: {
					Created: { uuid: fn },
				},
				Old: {
					[TEST_REF]: { uuid: fn },
				},
				PlaceholderComponent: {
					[TEST_REF]: { uuid: fn },
					Created: { uuid: fn },
				},
			})
		).to.equal(true);

		world.removeRef(TEST_REF);

		expect(
			deepEquals(world["componentToRefs"], {
				ReplicationGroup: {
					[TEST_REF_2]: { the: "skeld" },
				},
			})
		).to.equal(true);
		expect(
			deepEquals(world["refToComponents"], {
				[TEST_REF_2]: {
					ReplicationGroup: true,
				},
			})
		).to.equal(true);
		expect(
			deepEquals(world["events"], {
				ReplicationGroup: {
					[named("base")]: { uuid: fn },
					Created: { uuid: fn },
				},
				ReplicationSubscription: {
					Created: { uuid: fn },
				},
				PlaceholderComponent: { Created: { uuid: fn } },
			})
		).to.equal(true);

		world.removeRef(TEST_REF_2);

		expect(deepEquals(world["componentToRefs"], {})).to.equal(true);
		expect(deepEquals(world["refToComponents"], {})).to.equal(true);

		expect(
			deepEquals(world["events"], {
				ReplicationGroup: {
					[named("base")]: { uuid: fn },
					Created: { uuid: fn },
				},
				ReplicationSubscription: {
					Created: { uuid: fn },
				},
				PlaceholderComponent: { Created: { uuid: fn } },
			})
		).to.equal(true);

		for (const v of disconnects) {
			v();
		}

		expect(deepEquals(world["events"], {})).to.equal(true);
	});
};
