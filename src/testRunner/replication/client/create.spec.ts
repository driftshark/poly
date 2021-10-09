/// <reference types="@rbxts/testez/globals" />

import createClientUtilities from "replication/client/createClientUtilities";
import { deepEquals } from "util/tableUtil";
import libworld from "../lib/libworld";

export = () => {
	const { receiveBulkCreateEvent, receiveCreateEvent } =
		createClientUtilities(libworld);

	const TEST_REF = "testRef";
	const TEST_REF_2 = "testRef2";

	it("should add component with no consumePayload", () => {
		//@ts-ignore
		receiveCreateEvent(TEST_REF, "ExactReplicatedComponent", false);

		expect(
			//@ts-ignore
			libworld.getComponent(TEST_REF, "ExactReplicatedComponent")
		).to.equal(false);

		libworld.removeRef(TEST_REF);
	});

	it("should interact with payload but not consume", () => {
		//@ts-ignore
		receiveCreateEvent(TEST_REF, "ExactReplicatedComponentWithInteract", true);

		expect(
			//@ts-ignore
			libworld.getComponent(TEST_REF, "ExactReplicatedComponentWithInteract")
		).to.equal(true);

		libworld.removeRef(TEST_REF);
	});

	it("should consume payload", () => {
		//@ts-ignore
		receiveCreateEvent(TEST_REF, "ExactReplicatedComponentWithConsumer", true);
		expect(
			//@ts-ignore
			libworld.getComponent(TEST_REF, "ExactReplicatedComponentWithConsumer")
		).to.equal(undefined);

		libworld.removeRef(TEST_REF);
	});

	//
	//bulk
	//

	it("should bulk add components", () => {
		receiveBulkCreateEvent({
			//@ts-ignore
			ExactReplicatedComponent: [
				[TEST_REF, false],
				[TEST_REF_2, true],
			],
			ExactReplicatedComponentWithInteract: [
				[TEST_REF, false],
				[TEST_REF_2, true],
			],
			ExactReplicatedComponentWithConsumer: [
				[TEST_REF, false],
				[TEST_REF_2, true],
			],
		});

		expect(
			deepEquals(libworld["componentToRefs"], {
				ExactReplicatedComponent: {
					[TEST_REF]: false,
					[TEST_REF_2]: true,
				},
				ExactReplicatedComponentWithInteract: {
					[TEST_REF]: false,
					[TEST_REF_2]: true,
				},
				ExactReplicatedComponentWithConsumer: {
					[TEST_REF]: false,
				},
			})
		).to.equal(true);

		libworld.removeRef(TEST_REF);
		libworld.removeRef(TEST_REF_2);
	});
};
