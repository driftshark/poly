/// <reference types="@rbxts/testez/globals" />

import { World } from "index";

export = () => {
	it("should fire events", () => {
		const world = new World("world");
		const TEST_REF = "testRef";
		let count = 0;

		const disconnect1 = world.onComponent(
			"ReplicationGroup",
			(componentEvent, ref, ...args) => {
				count += 1;
				expect(componentEvent).to.equal("Created");
				expect(ref).to.equal(TEST_REF);
				expect(typeOf(args[0])).to.equal("table");
			}
		);

		const disconnect2 = world.onComponentEvent(
			"ReplicationGroup",
			"Created",
			(ref, data) => {
				count += 1;
				expect(ref).to.equal(TEST_REF);
				expect(typeOf(data)).to.equal("table");
			}
		);

		const disconnect3 = world.onRef(
			"ReplicationGroup",
			TEST_REF,
			(componentEvent, ...args) => {
				count += 1;
				expect(componentEvent).to.equal("Created");
				expect(typeOf(args[0])).to.equal("table");
			}
		);

		world.addComponent(TEST_REF, "ReplicationGroup", new Map());

		expect(count).to.equal(3);

		disconnect1();
		disconnect2();
		disconnect3();
	});
};
