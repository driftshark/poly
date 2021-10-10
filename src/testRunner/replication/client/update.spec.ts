/// <reference types="@rbxts/testez/globals" />

import createClientUtilities from "replication/client/createClientUtilities";
import { deepEquals } from "util/tableUtil";
import libworld from "../lib/libworld";

export = () => {
	const { receiveUpdateEvent } = createClientUtilities(libworld);

	const TEST_REF = "testRef";

	it("should update component with no consumePayload and no oldValue", () => {
		let count = 0;
		const disconnect = libworld.onComponentEvent(
			//@ts-ignore
			"KeyedReplicatedComponent",
			"Replicated",
			(ref, data, oldData) => {
				count += 1;
				expect(ref).to.equal(TEST_REF);
				expect(deepEquals(data, { among: "us" })).to.equal(true);
				expect(oldData).to.equal(undefined);
			}
		);

		//@ts-ignore
		receiveUpdateEvent(TEST_REF, "KeyedReplicatedComponent", {
			among: "us",
		});

		expect(
			//@ts-ignore
			deepEquals(libworld.getComponent(TEST_REF, "KeyedReplicatedComponent"), {
				among: "us",
			})
		).to.equal(true);
		expect(count).to.equal(1);

		libworld.removeRef(TEST_REF);
		disconnect();
	});

	it("should update component with no consumePayload with an oldValue", () => {
		const initialData = {
			among: "s",
			us: false,
			obj: { among: "us" },
		};

		//@ts-ignore
		libworld.addComponent(TEST_REF, "KeyedReplicatedComponent", initialData);

		let count = 0;
		const disconnect = libworld.onComponentEvent(
			//@ts-ignore
			"KeyedReplicatedComponent",
			"Replicated",
			(ref, data, oldData) => {
				count += 1;
				expect(ref).to.equal(TEST_REF);
				expect(
					deepEquals(data, {
						among: "_N",
						us: true,
						obj: { us: true },
					})
				).to.equal(true);
				expect(oldData).to.equal(initialData);
			}
		);

		//@ts-ignore
		receiveUpdateEvent(TEST_REF, "KeyedReplicatedComponent", {
			among: "_N",
			us: true,
			obj: { among: "_N", us: true },
		});

		expect(
			//@ts-ignore
			deepEquals(libworld.getComponent(TEST_REF, "KeyedReplicatedComponent"), {
				among: "_N",
				us: true,
				obj: { us: true },
			})
		).to.equal(true);
		expect(count).to.equal(1);

		libworld.removeRef(TEST_REF);
		disconnect();
	});

	it("should interact with update but not consume", () => {
		let count = 0;
		const disconnect = libworld.onComponentEvent(
			//@ts-ignore
			"ExactReplicatedComponentWithInteract",
			"Replicated",
			(ref, data, oldData) => {
				count += 1;
				expect(ref).to.equal(TEST_REF);
				expect(data).to.equal(false);
				expect(oldData).to.equal(undefined);
			}
		);

		//@ts-ignore
		receiveUpdateEvent(TEST_REF, "ExactReplicatedComponentWithInteract", false);

		expect(
			deepEquals(
				//@ts-ignore
				libworld.getComponent(TEST_REF, "ExactReplicatedComponentWithInteract"),
				false
			)
		).to.equal(true);
		expect(count).to.equal(1);

		libworld.removeRef(TEST_REF);
		disconnect();
	});

	it("should consume update", () => {
		let count = 0;
		const disconnect = libworld.onComponentEvent(
			//@ts-ignore
			"ExactReplicatedComponentWithConsumer",
			"Replicated",
			(ref, data, oldData) => {
				count += 1;
			}
		);

		//@ts-ignore
		receiveUpdateEvent(TEST_REF, "ExactReplicatedComponentWithConsumer", true);

		expect(
			//@ts-ignore
			libworld.getComponent(TEST_REF, "ExactReplicatedComponentWithConsumer")
		).to.equal(undefined);
		expect(count).to.equal(0);

		libworld.removeRef(TEST_REF);
		disconnect();
	});
};
