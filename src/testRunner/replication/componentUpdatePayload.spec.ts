/// <reference types="@rbxts/testez/globals" />

import { t } from "@rbxts/t";
import defineComponent from "defineComponent";
import { replicationMod, World } from "index";
import { ReplicationType } from "replication";
import { getPayload, patchPayload } from "replication/componentUpdatePayload";
import { deepEquals } from "util/tableUtil";
import { named } from "../../util/symbol";

export = () => {
	const world = new World("world");

	const flatExact = replicationMod(
		defineComponent({
			name: "FlatExact",
			data: true,
			refValidator: t.any,
		}),
		ReplicationType.Exact
	);

	const flatDiff = replicationMod(
		defineComponent({
			name: "FlatDiff",
			data: { unchanged: "among us", change: "lol", remove: "bye" },
			refValidator: t.any,
		}),
		ReplicationType.Diff
	);

	const keyedComponent = replicationMod(
		defineComponent({
			name: "KeyedComponent",
			data: {
				removedPrimitive: 1,
				newPrimitive: true,
				changedPrimitive: "us",
				changedObject: { unchanged1: true, red: false, turtle: "green" },
				exactChangedObject: { green: "red" },
				unchanged: { among1: "us1" },
				notTracked: { among2: "us2" },
			},
			refValidator: t.any,
		}),
		{
			removedPrimitive: ReplicationType.Exact,
			newPrimitive: ReplicationType.Exact,
			changedPrimitive: ReplicationType.Exact,
			changedObject: ReplicationType.Diff,
			exactChangedObject: ReplicationType.Exact,
			unchanged: ReplicationType.Exact,
		}
	);

	world.registerComponent(flatExact);
	world.registerComponent(flatDiff);
	world.registerComponent(keyedComponent);

	it("should be exact payload", () => {
		const oldValue = {};
		const newValue = [false];
		//@ts-ignore
		const result = getPayload(world, "FlatExact", oldValue, newValue);
		expect(oldValue).to.never.equal(newValue);
		expect(oldValue).to.never.equal(result);
		expect(result).to.equal(newValue);
	});

	it("should be exact payload without old value", () => {
		const newValue = [false];
		//@ts-ignore
		const result = getPayload(world, "FlatExact", undefined, newValue);
		expect(result).to.equal(newValue);
	});

	it("should be diffed payload", () => {
		const oldValue = { unchanged: "among us", change: "lol", remove: "bye" };
		const newValue = { new: "key", unchanged: "among us", change: 23 };
		//@ts-ignore
		const result = getPayload(world, "FlatDiff", oldValue, newValue);
		expect(oldValue).to.never.equal(newValue);
		expect(oldValue).to.never.equal(result);
		expect(newValue).to.never.equal(result);
		expect(
			deepEquals(result, {
				new: "key",
				change: 23,
				remove: "_N",
			})
		).to.equal(true);
	});

	it("should be diffed payload without old value", () => {
		const newValue = { new: "key", unchanged: "among us", change: 23 };
		//@ts-ignore
		const result = getPayload(world, "FlatDiff", undefined, newValue);
		expect(
			deepEquals(result, {
				new: "key",
				unchanged: "among us",
				change: 23,
			})
		).to.equal(true);
	});

	it("should be None", () => {
		const oldValue = {
			changedPrimitive: "us",
			changedObject: { unchanged1: true, red: false, turtle: "green" },
			exactChangedObject: { green: "red" },
			unchanged: { among1: "us1" },
			notTracked: { among2: "us2" },
		};

		const newValue = {
			changedPrimitive: "us",
			changedObject: oldValue["changedObject"],
			exactChangedObject: oldValue["exactChangedObject"],
			unchanged: oldValue["unchanged"],
			notTracked: { among3: "us3" },
			nowo: true,
		};

		//@ts-ignore
		const result = getPayload(world, "KeyedComponent", oldValue, newValue);
		expect(oldValue).to.never.equal(newValue);
		expect(oldValue).to.never.equal(result);
		expect(newValue).to.never.equal(result);

		expect(result).to.equal(named("None"));
	});

	it("should be non-empty payload and ignore untracked with undefined old value", () => {
		const newValue = {
			newPrimitive: true,
			changedPrimitive: 24,
			changedObject: { unchanged1: [true], red: true, newKey1: true },
			exactChangedObject: { birds: "45" },
			unchanged: { among1: "us1" },
			notTracked: { among3: "us3" },
			newKey: true,
		};

		//@ts-ignore
		const result = getPayload(world, "KeyedComponent", undefined, newValue);
		expect(
			deepEquals(result, {
				removedPrimitive: "_N", //due to how getPayload works (iterating over the replicateDefinition), this is here
				newPrimitive: true,
				changedPrimitive: 24,
				changedObject: { unchanged1: [true], red: true, newKey1: true },
				exactChangedObject: { birds: "45" },
				unchanged: { among1: "us1" },
			})
		).to.equal(true);
	});

	it("should be non-empty payload and ignore untracked", () => {
		const unchang = [true];
		const oldValue = {
			removedPrimitive: 1,
			changedPrimitive: "us",
			changedObject: { unchanged1: unchang, red: false, turtle: "green" },
			exactChangedObject: { green: "red" },
			unchanged: { among1: "us1" },
			notTracked: { among2: "us2" },
		};

		const newValue = {
			newPrimitive: true,
			changedPrimitive: 24,
			changedObject: { unchanged1: unchang, red: true, newKey1: true },
			exactChangedObject: { birds: "45" },
			unchanged: oldValue["unchanged"],
			notTracked: { among3: "us3" },
			newKey: true,
		};

		//@ts-ignore
		const result = getPayload(world, "KeyedComponent", oldValue, newValue);
		expect(oldValue).to.never.equal(newValue);
		expect(oldValue).to.never.equal(result);
		expect(newValue).to.never.equal(result);
		expect(oldValue.changedObject).to.never.equal(newValue.changedObject);
		//@ts-ignore
		expect(oldValue.changedObject).to.never.equal(result.changedObject);
		//@ts-ignore
		expect(newValue.changedObject).to.never.equal(result.changedObject);
		expect(oldValue.exactChangedObject).to.never.equal(
			newValue.exactChangedObject
		);
		expect(oldValue.exactChangedObject).to.never.equal(
			//@ts-ignore
			result.exactChangedObject
		);
		//@ts-ignore
		expect(newValue.exactChangedObject).to.equal(result.exactChangedObject);

		expect(
			deepEquals(result, {
				removedPrimitive: "_N",
				newPrimitive: true,
				changedPrimitive: 24,
				changedObject: { red: true, newKey1: true, turtle: "_N" },
				exactChangedObject: { birds: "45" },
			})
		).to.equal(true);
	});

	//
	//for receive
	//

	it("should patch exact payload", () => {
		const oldValue = {};
		const newValue = [false];
		//@ts-ignore
		const payload = getPayload(world, "FlatExact", oldValue, newValue);

		//@ts-ignore
		const result = patchPayload(world, "FlatExact", oldValue, payload);
		expect(oldValue).to.never.equal(newValue);
		expect(oldValue).to.never.equal(result);
		expect(payload).to.equal(newValue);
		expect(result).to.equal(newValue);
		expect(deepEquals(result, [false])).to.equal(true);
	});

	it("should patch the previous and payload", () => {
		const oldValue = { unchanged: "among us", change: "lol", remove: "bye" };
		const newValue = { new: "key", unchanged: "among us", change: 23 };
		//@ts-ignore
		const payload = getPayload(world, "FlatDiff", oldValue, newValue);

		//@ts-ignore
		const result = patchPayload(world, "FlatDiff", oldValue, payload);
		expect(oldValue).to.never.equal(newValue);
		expect(oldValue).to.never.equal(result);
		expect(oldValue).to.never.equal(payload);
		expect(payload).to.never.equal(newValue);
		expect(result).to.never.equal(newValue);
		expect(result).to.never.equal(payload);
		expect(deepEquals(result, newValue)).to.equal(true);
	});

	it("should patch flat exact with undefined oldValue", () => {
		const oldValue = {};
		const newValue = [false];
		//@ts-ignore
		const payload = getPayload(world, "FlatExact", oldValue, newValue);

		//@ts-ignore
		const result = patchPayload(world, "FlatExact", undefined, payload);
		expect(oldValue).to.never.equal(newValue);
		expect(oldValue).to.never.equal(result);
		expect(payload).to.equal(newValue);
		expect(result).to.equal(newValue);
		expect(deepEquals(result, [false])).to.equal(true);
	});

	it("should patch flat diff with undefined oldValue", () => {
		const oldValue = { unchanged: "among us", change: "lol", remove: "bye" };
		const newValue = { new: "key", unchanged: "among us", change: 23 };
		//@ts-ignore
		const payload = getPayload(world, "FlatDiff", oldValue, newValue);

		//@ts-ignore
		const result = patchPayload(world, "FlatDiff", undefined, payload);
		expect(oldValue).to.never.equal(newValue);
		expect(oldValue).to.never.equal(result);
		expect(oldValue).to.never.equal(payload);
		expect(payload).to.never.equal(newValue);
		expect(result).to.never.equal(newValue);
		expect(result).to.never.equal(payload);
		expect(deepEquals(result, { new: "key", change: 23 })).to.equal(true);
	});

	it("should patch with undefined oldValue", () => {
		const unchang = [true];
		const oldValue = {
			removedPrimitive: 1,
			changedPrimitive: "us",
			changedObject: { unchanged1: unchang, red: false, turtle: "green" },
			exactChangedObject: { green: "red" },
			unchanged: { among1: "us1" },
			notTracked: { among2: "us2" },
			extraField: true,
		};

		const newValue = {
			newPrimitive: true,
			changedPrimitive: 24,
			changedObject: { unchanged1: unchang, red: true, newKey1: true },
			exactChangedObject: { birds: "45" },
			unchanged: oldValue["unchanged"],
			notTracked: { among3: "us3" },
			newKey: false,
		};

		const payload = getPayload(
			world,
			//@ts-ignore
			"KeyedComponent",
			oldValue,
			newValue
		) as typeof newValue;
		const result = patchPayload(
			world,
			//@ts-ignore
			"KeyedComponent",
			undefined,
			payload
		) as typeof newValue;

		expect(
			deepEquals(result, {
				newPrimitive: true,
				changedPrimitive: 24,
				changedObject: { red: true, newKey1: true },
				exactChangedObject: { birds: "45" },
			})
		).to.equal(true);
	});

	//for keyed ReplicationTypes
	it("should patch the included fields", () => {
		const unchang = [true];
		const oldValue = {
			removedPrimitive: 1,
			changedPrimitive: "us",
			changedObject: { unchanged1: unchang, red: false, turtle: "green" },
			exactChangedObject: { green: "red" },
			unchanged: { among1: "us1" },
			notTracked: { among2: "us2" },
			extraField: true,
		};

		const newValue = {
			newPrimitive: true,
			changedPrimitive: 24,
			changedObject: { unchanged1: unchang, red: true, newKey1: true },
			exactChangedObject: { birds: "45" },
			unchanged: oldValue["unchanged"],
			notTracked: { among3: "us3" },
			newKey: false,
		};

		const payload = getPayload(
			world,
			//@ts-ignore
			"KeyedComponent",
			oldValue,
			newValue
		) as typeof newValue;
		const result = patchPayload(
			world,
			//@ts-ignore
			"KeyedComponent",
			oldValue,
			payload
		) as typeof newValue;

		//base shallow equality checks
		expect(oldValue).to.never.equal(newValue);
		expect(oldValue).to.never.equal(result);
		expect(result).to.never.equal(newValue);
		expect(result).to.never.equal(payload);

		//old->new
		expect(oldValue["changedObject"]).to.never.equal(newValue["changedObject"]);
		expect(oldValue["changedObject"]["unchanged1"]).to.equal(
			newValue["changedObject"]["unchanged1"]
		);
		expect(oldValue["exactChangedObject"]).to.never.equal(
			newValue["exactChangedObject"]
		);
		expect(oldValue["unchanged"]).to.equal(newValue["unchanged"]);
		expect(oldValue["notTracked"]).to.never.equal(newValue["notTracked"]);
		//@ts-ignore
		expect(oldValue["extraField"]).to.never.equal(newValue["extraField"]);

		//old->result
		expect(oldValue["changedObject"]).to.never.equal(result["changedObject"]);
		expect(oldValue["changedObject"]["unchanged1"]).to.equal(
			result["changedObject"]["unchanged1"]
		);
		expect(oldValue["exactChangedObject"]).to.never.equal(
			result["exactChangedObject"]
		);
		expect(oldValue["unchanged"]).to.equal(result["unchanged"]);
		expect(oldValue["notTracked"]).to.equal(result["notTracked"]);
		//@ts-ignore
		expect(oldValue["extraField"]).to.equal(result["extraField"]);

		//new->result
		expect(newValue["changedObject"]).to.never.equal(result["changedObject"]);
		expect(newValue["changedObject"]["unchanged1"]).to.equal(
			result["changedObject"]["unchanged1"]
		);
		expect(newValue["exactChangedObject"]).to.equal(
			result["exactChangedObject"]
		);
		expect(newValue["unchanged"]).to.equal(result["unchanged"]);
		expect(newValue["notTracked"]).to.never.equal(result["notTracked"]);

		//payload->result
		expect(payload["changedObject"]).to.never.equal(result["changedObject"]);
		expect(payload["exactChangedObject"]).to.equal(
			result["exactChangedObject"]
		);

		expect(
			deepEquals(result, {
				newPrimitive: true,
				changedPrimitive: 24,
				changedObject: { unchanged1: [true], red: true, newKey1: true },
				exactChangedObject: { birds: "45" },
				unchanged: oldValue["unchanged"],
				notTracked: { among2: "us2" },
				extraField: true,
			})
		).to.equal(true);
	});
};
