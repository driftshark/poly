import { DeepReadonly } from "@driftshark/table";
import { t } from "@rbxts/t";
import {
	addLayeredComponent,
	LayeredComponentData,
} from "componentUtils/layered";
import defineComponent from "defineComponent";
import { World } from "index";

const enum Operation {
	Add = 0,
	MultiplyBase,
	Multiply,

	Base,
	Min,
	Max,
}

type LayerData = { op: Operation; value: number };

const attributeReducer = (
	valuesToReduce: DeepReadonly<Map<string, LayerData>>
) => {
	let baseValue = 0;
	let min;
	let max;

	const ops = {
		[Operation.Add]: <number[]>[],
		[Operation.MultiplyBase]: <number[]>[],
		[Operation.Multiply]: <number[]>[],
	};

	for (const [_, modifier] of pairs(valuesToReduce)) {
		if (modifier.op === Operation.Base) {
			baseValue = modifier.value;
			continue;
		} else if (modifier.op === Operation.Min) {
			min = modifier.value;
			continue;
		} else if (modifier.op === Operation.Max) {
			max = modifier.value;
			continue;
		}

		if (ops[modifier.op]) {
			ops[modifier.op].push(modifier.value);
		}
	}

	let value = baseValue;
	for (const modifierValue of ops[Operation.Add]) {
		value += modifierValue;
	}

	for (const modifierValue of ops[Operation.MultiplyBase]) {
		value += baseValue * modifierValue;
	}

	for (const modifierValue of ops[Operation.Multiply]) {
		value *= modifierValue;
	}

	if (min !== undefined) {
		value = math.max(min, value);
	}

	if (max !== undefined) {
		value = math.min(max, value);
	}

	return value;
};

const definition = defineComponent({
	name: "attribute",
	data: <LayeredComponentData<number, LayerData>>(<unknown>true),
	refValidator: t.any,
});

declare global {
	interface Components {
		/** The Old Component contains a Map that holds old values of other components */
		Attribute: typeof definition;
	}
}

const world = new World("game");

addLayeredComponent(
	world,
	"",
	"Attribute",
	"layerName",
	{ op: Operation.Add, value: 1 },
	attributeReducer
);
