/// <reference types="@rbxts/testez/globals" />

import createServerUtilities from "replication/server/createServerUtilities";
import { deepEquals } from "util/tableUtil";
import libworld, { libReplicatedComponents } from "../lib/libworld";

export = () => {
	const TEST_REF = "testRef";
	const TEST_REF_2 = "testRef2";

	const groupIdToEntity = {
		TestGroupId: {
			[TEST_REF]: ["KeyedReplicatedComponent", "ExactReplicatedComponent"],
			[TEST_REF_2]: ["KeyedReplicatedComponent", "ExactReplicatedComponent"],
		},
	};

	//@ts-ignore
	const { compileNewBatchData } = createServerUtilities(
		libworld,
		groupIdToEntity,
		{},
		libReplicatedComponents
	);

	it("should do nothing when no entities", () => {
		const result = compileNewBatchData("NO_EXIST_GROUP");

		expect(result).to.equal(undefined);
	});

	//does nothing when component is undefined
	//does nothing when replicatedData is None
	it("should return batch", () => {
		//@ts-ignore
		libworld.addComponent(TEST_REF, "ExactReplicatedComponent", true);
		//@ts-ignore
		libworld.addComponent(TEST_REF, "KeyedReplicatedComponent", {
			excluded: true,
		});
		//@ts-ignore
		libworld.addComponent(TEST_REF_2, "KeyedReplicatedComponent", {
			among: "us",
		});

		const result = compileNewBatchData("TestGroupId");

		expect(
			deepEquals(result, {
				ExactReplicatedComponent: [[TEST_REF, true]],
				KeyedReplicatedComponent: [[TEST_REF_2, { among: "us" }]],
			})
		).to.equal(true);

		libworld.removeRef(TEST_REF);
		libworld.removeRef(TEST_REF_2);
	});
};
