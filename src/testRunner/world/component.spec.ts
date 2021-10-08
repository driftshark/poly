/// <reference types="@rbxts/testez/globals" />

import { ComponentEvent } from "Component";
import { World } from "index";
import { named } from "util/symbol";
import { deepEquals } from "util/tableUtil";

export = () => {
	const world = new World("world");
	const TEST_REF = "testRef";
	const TEST_REF_2 = "testRef2";

	it("should add component", () => {
		let count = 0;
		const disconnectFn = world.onComponentEvent(
			"ReplicationGroup",
			"Created",
			() => {
				count += 1;
			}
		);

		world.addComponent(
			TEST_REF,
			"ReplicationGroup", //@ts-ignore
			new Map([["among", "us"]])
		);

		expect(
			deepEquals(world["componentToRefs"], {
				ReplicationGroup: {
					[TEST_REF]: { among: "us" },
				},
			})
		).to.equal(true);
		expect(
			deepEquals(world["refToComponents"], {
				[TEST_REF]: {
					ReplicationGroup: true,
				},
			})
		).to.equal(true);
		expect(count).to.equal(1);

		disconnectFn();
	});

	it("should add component when already populated", () => {
		let count = 0;
		const disconnectFn = world.onComponentEvent(
			"ReplicationGroup",
			"Created",
			() => {
				count += 1;
			}
		);

		world.addComponent(
			TEST_REF as unknown as Player,
			"ReplicationSubscription",
			new Map<string, true>([["us", true]])
		);

		world.addComponent(
			TEST_REF_2,
			"ReplicationGroup", //@ts-ignore
			new Map([["us", "among"]])
		);

		expect(
			deepEquals(world["componentToRefs"], {
				ReplicationGroup: {
					[TEST_REF]: { among: "us" },
					[TEST_REF_2]: { us: "among" },
				},
				ReplicationSubscription: { [TEST_REF]: { us: true } },
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
		expect(count).to.equal(1);

		disconnectFn();
	});
	it("should fire updated", () => {
		expect(
			deepEquals(world["componentToRefs"], {
				ReplicationGroup: {
					[TEST_REF]: { among: "us" },
					[TEST_REF_2]: { us: "among" },
				},
				ReplicationSubscription: { [TEST_REF]: { us: true } },
			})
		).to.equal(true);

		let count = 0;
		const disconnectFn = world.onComponentEvent(
			"ReplicationGroup",
			"Updated",
			() => {
				count += 1;
			}
		);

		world.addComponent(
			TEST_REF,
			"ReplicationGroup", //@ts-ignore
			new Map([["amonged", "us"]])
		);

		expect(
			deepEquals(world["componentToRefs"], {
				ReplicationGroup: {
					[TEST_REF]: { amonged: "us" },
					[TEST_REF_2]: { us: "among" },
				},
				ReplicationSubscription: { [TEST_REF]: { us: true } },
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
		expect(count).to.equal(1);

		disconnectFn();
	});

	it("should get component", () => {
		expect(
			deepEquals(world.getComponent(TEST_REF, "ReplicationGroup"), {
				amonged: "us",
			})
		).to.equal(true);
	});

	it("should not get component", () => {
		//@ts-ignore
		expect(world.getComponent({}, "PlaceholderComponent")).to.equal(undefined);
		expect(world.getComponent({}, "ReplicationGroup")).to.equal(undefined);
	});

	it("should not remove component", () => {
		let count = 0;
		const disconnectFn = world.onComponentEvent("Old", "Removing", () => {
			count += 1;
		});

		world.removeComponent(TEST_REF, "Old");

		expect(
			deepEquals(world["componentToRefs"], {
				ReplicationGroup: {
					[TEST_REF]: { amonged: "us" },
					[TEST_REF_2]: { us: "among" },
				},
				ReplicationSubscription: { [TEST_REF]: { us: true } },
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

		expect(count).to.equal(0);

		disconnectFn();
	});

	it("should remove component", () => {
		let count = 0;
		const disconnectFn = world.onComponentEvent(
			"ReplicationSubscription",
			"Removing",
			() => {
				count += 1;
			}
		);

		world.removeComponent(
			TEST_REF as unknown as Player,
			"ReplicationSubscription"
		);

		expect(
			deepEquals(world["componentToRefs"], {
				ReplicationGroup: {
					[TEST_REF]: { amonged: "us" },
					[TEST_REF_2]: { us: "among" },
				},
			})
		).to.equal(true);
		expect(
			deepEquals(world["refToComponents"], {
				[TEST_REF]: {
					ReplicationGroup: true,
				},
				[TEST_REF_2]: {
					ReplicationGroup: true,
				},
			})
		).to.equal(true);
		expect(count).to.equal(1);

		disconnectFn();
	});

	it("should remove component while still populated", () => {
		world.removeComponent(TEST_REF, "ReplicationGroup");

		expect(
			deepEquals(world["componentToRefs"], {
				ReplicationGroup: {
					[TEST_REF_2]: { us: "among" },
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
	});

	it("should remove ref connections on removal", () => {
		let count = 0;
		const fn = (
			componentEvent: ComponentEvent<Components["ReplicationGroup"]>,
			data: object
		) => {
			count += 1;
			expect(componentEvent).to.equal("Removing");
			expect(deepEquals(data, { us: "among" })).to.equal(true);
		};

		world.onRef("ReplicationGroup", TEST_REF_2, fn as any, "uuid");

		expect(
			deepEquals(world["componentToRefs"], {
				ReplicationGroup: {
					[TEST_REF_2]: { us: "among" },
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
				ReplicationGroup: new Map([[TEST_REF_2, { uuid: fn }]]),
			})
		).to.equal(true);

		world.removeComponent(TEST_REF_2, "ReplicationGroup");

		expect(deepEquals(world["componentToRefs"], {})).to.equal(true);
		expect(deepEquals(world["refToComponents"], {})).to.equal(true);
		expect(deepEquals(world["events"], {})).to.equal(true);
		expect(count).to.equal(1);
	});

	it("should remove ref connections with other connections present", () => {
		let count = 0;
		const fn = (
			componentEvent: ComponentEvent<Components["ReplicationGroup"]>,
			data: object
		) => {
			count += 1;
			expect(componentEvent).to.equal("Removing");
			expect(deepEquals(data, { us: "among" })).to.equal(true);
		};

		const fn2 = (
			componentEvent: ComponentEvent<Components["ReplicationGroup"]>,
			ref: any,
			...args: object[]
		) => {
			count += 1;
			expect(componentEvent).to.equal("Removing");
			expect(ref).to.equal(TEST_REF_2);
			expect(deepEquals(args[0], { us: "among" })).to.equal(true);
		};

		world.addComponent(
			TEST_REF_2,
			"ReplicationGroup", //@ts-ignore
			new Map([["us", "among"]])
		);

		world.onRef("ReplicationGroup", TEST_REF_2, fn as any, "uuid");
		const disconnectBase = world.onComponent(
			"ReplicationGroup",
			fn2 as any,
			"uuid"
		);

		expect(
			deepEquals(world["componentToRefs"], {
				ReplicationGroup: {
					[TEST_REF_2]: { us: "among" },
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
				ReplicationGroup: new Map<string | symbol, { uuid: typeof fn }>([
					[TEST_REF_2, { uuid: fn }],
					[named("base"), { uuid: fn2 }],
				]),
			})
		).to.equal(true);

		world.removeComponent(TEST_REF_2, "ReplicationGroup");

		expect(deepEquals(world["componentToRefs"], {})).to.equal(true);
		expect(deepEquals(world["refToComponents"], {})).to.equal(true);
		expect(
			deepEquals(world["events"], {
				ReplicationGroup: new Map([[named("base"), { uuid: fn2 }]]),
			})
		).to.equal(true);
		expect(count).to.equal(2);

		disconnectBase();
	});
};
