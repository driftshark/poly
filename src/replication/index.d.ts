export const enum ReplicationType {
	/** On every update, replicate the exact data */
	Exact = 0,

	/** On every update, calculate and replicate a diff of the update (only available for objects) */
	Diff = 2,
}
