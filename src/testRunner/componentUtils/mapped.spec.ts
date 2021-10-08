/// <reference types="@rbxts/testez/globals" />

import { addMappedComponent, World } from "index";
import { deepEquals } from "util/tableUtil";

export = () => {
	const world = new World("world");
	const TEST_REF = "testRef";

	it("should create mapped component", () => {
		const add = new Map([["among", "us"]]);
		//@ts-ignore
		addMappedComponent(world, TEST_REF, "Old", "ReplicationGroup", add);

		expect(
			deepEquals(world.getComponent(TEST_REF, "Old"), {
				ReplicationGroup: { among: "us" },
			})
		).to.equal(true);
		expect(add).to.never.equal(world.getComponent(TEST_REF, "Old"));
	});

	it("should add another index", () => {
		const existingComponent = world.getComponent(TEST_REF, "Old");
		const add = new Map([["red", true]]);

		addMappedComponent(world, TEST_REF, "Old", "ReplicationSubscription", add);
		expect(
			deepEquals(world.getComponent(TEST_REF, "Old"), {
				ReplicationGroup: { among: "us" },
				ReplicationSubscription: { red: true },
			})
		).to.equal(true);
		expect(add).to.never.equal(world.getComponent(TEST_REF, "Old"));
		expect(existingComponent).to.never.equal(
			world.getComponent(TEST_REF, "Old")
		);
		expect(existingComponent).to.never.equal(add);
	});

	it("should remove an index", () => {
		const existingComponent = world.getComponent(TEST_REF, "Old");
		addMappedComponent(world, TEST_REF, "Old", "ReplicationGroup", undefined);

		expect(
			deepEquals(world.getComponent(TEST_REF, "Old"), {
				ReplicationSubscription: { red: true },
			})
		).to.equal(true);
		expect(existingComponent).to.never.equal(
			world.getComponent(TEST_REF, "Old")
		);
	});
};
