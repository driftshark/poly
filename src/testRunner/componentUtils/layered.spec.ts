/// <reference types="@rbxts/testez/globals" />

import { addLayeredComponent, World } from "index";
import { deepEquals } from "@driftshark/table";

export = () => {
	const world = new World("world");
	const TEST_REF = "testRef" as never;
	const LAYER_1 = "firstLayer";
	const LAYER_2 = "secondLayer";

	const reducer = (values: Map<string, number>) => {
		let current = 0;
		for (const [_, v] of pairs(values)) {
			current += v;
		}

		return current;
	};

	const getComponent = () => {
		//@ts-ignore
		return world.getComponent(TEST_REF, "PlaceholderComponent");
	};

	it("should create layered component", () => {
		addLayeredComponent(
			world,
			TEST_REF, //@ts-ignore
			"PlaceholderComponent",
			LAYER_1,
			5,
			reducer
		);

		expect(
			//@ts-ignore
			deepEquals(getComponent(), {
				reduced: 5,
				layers: {
					[LAYER_1]: 5,
				},
			})
		).to.equal(true);
	});

	it("should add another layer", () => {
		const existingComponent = getComponent();
		addLayeredComponent(
			world,
			TEST_REF, //@ts-ignore
			"PlaceholderComponent",
			LAYER_2,
			33,
			reducer
		);

		expect(
			//@ts-ignore
			deepEquals(getComponent(), {
				reduced: 38,
				layers: {
					[LAYER_1]: 5,
					[LAYER_2]: 33,
				},
			})
		).to.equal(true);
		expect(existingComponent).to.never.equal(getComponent());
		//@ts-ignore
		expect(existingComponent.layers).to.never.equal(getComponent().layers);
	});

	it("should remove a layer", () => {
		const existingComponent = getComponent();
		addLayeredComponent(
			world,
			TEST_REF, //@ts-ignore
			"PlaceholderComponent",
			LAYER_1,
			undefined,
			reducer
		);

		expect(
			//@ts-ignore
			deepEquals(getComponent(), {
				reduced: 33,
				layers: {
					[LAYER_2]: 33,
				},
			})
		).to.equal(true);
		expect(existingComponent).to.never.equal(getComponent());
		//@ts-ignore
		expect(existingComponent.layers).to.never.equal(getComponent().layers);
	});

	it("should remove last layer", () => {
		const existingComponent = getComponent();
		addLayeredComponent(
			world,
			TEST_REF, //@ts-ignore
			"PlaceholderComponent",
			LAYER_2,
			undefined,
			reducer
		);

		expect(
			//@ts-ignore
			deepEquals(getComponent(), {
				reduced: 0,
				layers: {},
			})
		).to.equal(true);
		expect(existingComponent).to.never.equal(getComponent());
		//@ts-ignore
		expect(existingComponent.layers).to.never.equal(getComponent().layers);
	});
};
