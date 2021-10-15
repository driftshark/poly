/// <reference types="@rbxts/testez/globals" />

import createServerUtilities from "replication/server/createServerUtilities";
import { named } from "@driftshark/symbol";
import { deepEquals } from "@driftshark/table";
import libworld, { libReplicatedComponents } from "../lib/libworld";

export = () => {
	//@ts-ignore
	const { getReplicableData } = createServerUtilities(
		libworld,
		{},
		{},
		libReplicatedComponents
	);

	it("should return exact data", () => {
		//@ts-ignore
		const result = getReplicableData("ExactReplicatedComponent", true);
		expect(result).to.equal(true);

		const data = {
			among: "we",
		};

		//@ts-ignore
		const result = getReplicableData("ExactReplicatedComponentObject", data);
		expect(result).to.equal(data);
	});

	it("should return None", () => {
		//@ts-ignore
		const result = getReplicableData("KeyedReplicatedComponent", {});
		expect(result).to.equal(named("None"));

		//@ts-ignore
		const result = getReplicableData("KeyedReplicatedComponent", {
			excluded: true,
		});
		expect(result).to.equal(named("None"));
	});

	it("should return specified key values", () => {
		const data = {
			among: "us",
			us: false,
			excluded: true,
		};

		//@ts-ignore
		const result = getReplicableData("KeyedReplicatedComponent", data);

		expect(result).to.never.equal(data);
		expect(
			deepEquals(result, {
				among: "us",
				us: false,
			})
		).to.equal(true);
	});
};
