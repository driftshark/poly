/// <reference types="@rbxts/testez/globals" />

import {
	copy,
	deepEquals,
	diff,
	merge,
	patch,
	shallow,
} from "../util/tableUtil";

export = () => {
	it("should deep copy", () => {
		const originalTable = {
			thing: {
				a: 1,
				b: {
					lol: true,
				},
			},
		};

		const deepCopyTable = copy(originalTable);

		expect(originalTable).to.never.equal(deepCopyTable);
		expect(originalTable.thing).to.never.equal(deepCopyTable.thing);
		expect(originalTable.thing.b).to.never.equal(deepCopyTable.thing.b);
		expect(deepEquals(originalTable, deepCopyTable)).to.equal(true);
	});

	it("should shallow copy", () => {
		const originalTable = {
			thing: {
				a: 1,
				b: {
					lol: true,
				},
			},
		};

		const shallowCopyTable = shallow(originalTable);

		expect(originalTable).to.never.equal(shallowCopyTable);
		expect(originalTable.thing).to.equal(shallowCopyTable.thing);
		expect(originalTable.thing.b).to.equal(shallowCopyTable.thing.b);
		expect(deepEquals(originalTable, shallowCopyTable)).to.equal(true);
	});

	it("should merge", () => {
		const original: { lol: number | string; b?: number; c: boolean } = {
			lol: 434,
			c: true,
		};
		const mergeTable = { lol: "a", b: 1 };

		const newTable = merge(original, mergeTable);

		expect(deepEquals(original, { lol: 434, c: true })).to.equal(true);
		expect(deepEquals(mergeTable, { lol: "a", b: 1 })).to.equal(true);
		expect(original).to.never.equal(newTable);
		expect(mergeTable).to.never.equal(newTable);
		expect(deepEquals(newTable, { lol: "a", b: 1, c: true })).to.equal(true);
	});

	it("should deep check table equality", () => {
		const originalTable = {
			thing: {
				a: 1,
				b: {
					lol: true,
				},
			},
		};

		expect(
			deepEquals(originalTable, {
				thing: {
					a: 1,
					b: {
						lol: true,
					},
				},
			})
		).to.equal(true);

		expect(
			deepEquals(originalTable, {
				thing: {
					a: 1,
					b: {
						lol: false,
					},
				},
			})
		).to.equal(false);
	});

	const noChangeObject = { i: "do not change" };
	const noChangeObject1 = { i1: "do not change2" };
	const og = {
		primitiveToSame: "string",
		primitiveToDifferent: "number",
		primitiveToObject: "soon",
		goingToNil: true,
		objectToNil: {},
		objectToDifferentObject: { apples: "red" },
		objectToPrimitive: { caveman: "ooga" },
		noChange: true,
		noChangeObject: noChangeObject,
		nested: {
			primitiveToSame1: "string",
			primitiveToDifferent1: "number",
			primitiveToObject1: "soon",
			goingToNil1: true,
			objectToNil1: {},
			objectToDifferentObject1: { squirtle: "red" },
			objectToPrimitive1: { caveman: "ooga" },
			noChange1: true,
			noChangeObject1: noChangeObject1,
		},
	};

	const newObj = {
		primitiveToSame: "among",
		primitiveToDifferent: 23,
		primitiveToObject: { red: "sus" },
		objectToDifferentObject: { oranges: "orange" },
		objectToPrimitive: "booga",
		noChange: true,
		noChangeObject: noChangeObject,
		newKey: true,
		nested: {
			primitiveToSame1: "us",
			primitiveToDifferent1: 24,
			primitiveToObject1: { soon: "tm" },
			objectToDifferentObject1: { turtles: "green" },
			objectToPrimitive1: "wooga",
			noChange1: true,
			noChangeObject1: noChangeObject1,
			newKey1: true,
		},
	};

	it("should diff", () => {
		const result = diff(og, newObj);

		expect(og).to.never.equal(result);
		expect(og).to.never.equal(newObj);
		expect(newObj).to.never.equal(result);
		expect(og.nested).to.never.equal(newObj.nested);
		expect(og.nested).to.never.equal(result.nested);
		expect(og.objectToDifferentObject).to.never.equal(
			result.objectToDifferentObject
		);
		expect(og.objectToDifferentObject).to.never.equal(
			newObj.objectToDifferentObject
		);
		expect(og.nested.objectToDifferentObject1).to.never.equal(
			result.nested.objectToDifferentObject1
		);
		expect(og.nested.objectToDifferentObject1).to.never.equal(
			newObj.nested.objectToDifferentObject1
		);

		expect(
			deepEquals(result, {
				primitiveToSame: "among",
				primitiveToDifferent: 23,
				primitiveToObject: { red: "sus" },
				goingToNil: "_N",
				objectToNil: "_N",
				objectToDifferentObject: { apples: "_N", oranges: "orange" },
				objectToPrimitive: "booga",
				newKey: true,
				nested: {
					primitiveToSame1: "us",
					primitiveToDifferent1: 24,
					primitiveToObject1: { soon: "tm" },
					goingToNil1: "_N",
					objectToNil1: "_N",
					objectToDifferentObject1: { squirtle: "_N", turtles: "green" },
					objectToPrimitive1: "wooga",
					newKey1: true,
				},
			})
		).to.equal(true);
	});

	it("should patch", () => {
		const diffd = diff(og, newObj);
		const result = patch(og, diffd);

		expect(og).to.never.equal(result);
		expect(og).to.never.equal(diffd);
		expect(diffd).to.never.equal(result);
		expect(og.nested).to.never.equal(diffd.nested);
		expect(og.nested).to.never.equal(result.nested);
		expect(diffd.nested).to.never.equal(result.nested);
		expect(og.objectToDifferentObject).to.never.equal(
			result.objectToDifferentObject
		);
		expect(diffd.objectToDifferentObject).to.never.equal(
			result.objectToDifferentObject
		);
		expect(og.objectToDifferentObject).to.never.equal(
			diffd.objectToDifferentObject
		);
		expect(og.nested.objectToDifferentObject1).to.never.equal(
			result.nested.objectToDifferentObject1
		);
		expect(diffd.nested.objectToDifferentObject1).to.never.equal(
			result.nested.objectToDifferentObject1
		);
		expect(og.nested.objectToDifferentObject1).to.never.equal(
			diffd.nested.objectToDifferentObject1
		);

		expect(
			deepEquals(result, {
				primitiveToSame: "among",
				primitiveToDifferent: 23,
				primitiveToObject: { red: "sus" },
				objectToDifferentObject: { oranges: "orange" },
				objectToPrimitive: "booga",
				noChange: true,
				noChangeObject: noChangeObject,
				newKey: true,
				nested: {
					primitiveToSame1: "us",
					primitiveToDifferent1: 24,
					primitiveToObject1: { soon: "tm" },
					objectToDifferentObject1: { turtles: "green" },
					objectToPrimitive1: "wooga",
					noChange1: true,
					noChangeObject1: noChangeObject1,
					newKey1: true,
				},
			})
		).to.equal(true);
	});
};
