/// <reference types="@rbxts/testez/globals" />

import { t } from "@rbxts/t";
import defineComponent from "defineComponent";
import { World } from "index";
import { deepEquals } from "util/tableUtil";

export = () => {
	const world = new World("world");

	it("should register component", () => {
		const definition = defineComponent({
			name: "TestComponent",
			data: true,
			refValidator: t.any,
		});

		world.registerComponent(definition);

		expect(
			deepEquals(world["componentDefinitions"], {
				["TestComponent"]: definition,
			})
		).to.equal(true);
	});

	let count = 0;
	const incCount = () => {
		count += 1;
	};
	const system1 = {
		name: "system1",
		onRegistered: incCount,
		init: incCount,
		update: () => {},
	};
	const system2 = {
		name: "system2",
		priority: 3,
		onRegistered: incCount,
		init: incCount,
		update: () => {},
	};
	const system3 = {
		name: "system3",
		priority: -1,
		onRegistered: incCount,
		init: incCount,
		update: () => {},
	};
	const system4 = {
		name: "system4",
		priority: 3,
		onRegistered: incCount,
		init: incCount,
	};

	it("should register systems", () => {
		world.registerSystems([system1]);

		expect(deepEquals(world["systems"], { system1 })).to.equal(true);
		expect(deepEquals(world["updateSystems"], [system1])).to.equal(true);
		expect(count).to.equal(2);
	});

	it("should not register as update system", () => {
		world.registerSystems([system4]);

		expect(deepEquals(world["systems"], { system1, system4 })).to.equal(true);
		expect(deepEquals(world["updateSystems"], [system1])).to.equal(true);
		expect(count).to.equal(4);
	});

	it("should sort the systems", () => {
		world.registerSystems([system3, system2]);
		expect(
			deepEquals(world["systems"], {
				system1,
				system4,
				system3,
				system2,
			})
		).to.equal(true);
		expect(
			deepEquals(world["updateSystems"], [system2, system1, system3])
		).to.equal(true);
		expect(count).to.equal(8);
	});
};
