/// <reference types="@rbxts/testez/globals" />

import { World } from "index";
import { deepEquals } from "util/tableUtil";

export = () => {
	const world = new World("world");

	const TEST_REF = "testRef";

	world.addComponent(TEST_REF, "ReplicationGroup", new Map([["among", "us"]]));

	it("should get refs with component", () => {
		expect(
			deepEquals(world.refsWith("ReplicationGroup"), {
				[TEST_REF]: { among: "us" },
			})
		).to.equal(true);
	});

	it("should get components of ref", () => {
		print(world.componentsOf(TEST_REF));
		expect(
			deepEquals(world.componentsOf(TEST_REF), {
				ReplicationGroup: true,
			})
		).to.equal(true);
	});
};
