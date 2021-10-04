export function merge<T extends object, RestT extends object>(
	tbl: T,
	...rest: RestT[]
): DeepWritable<T> & RestT;

export function copy<T extends object>(tbl: T): DeepWritable<T>;
export function shallow<T extends object>(tbl: T): DeepWritable<T>;

export function deepEquals(a: unknown, b: unknown): boolean;

/** Diffs two tables */
export function diff(
	a: object | Map<unknown, unknown>,
	b: object | Map<unknown, unknown>
): unknown;

export function patch<TA extends object | Map<unknown, unknown>>(
	a: TA,
	b: object | Map<unknown, unknown>
): TA;
