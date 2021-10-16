type DeepReadonly<T> = T extends Map<infer K, infer V>
	? ReadonlyMap<K, DeepReadonly<V>>
	: T extends Array<infer E>
	? ReadonlyArray<DeepReadonly<E>>
	: T extends object
	? {
			readonly [P in keyof T]: DeepReadonly<T[P]>;
	  }
	: T;

type DeepWritable<T> = T extends ReadonlyMap<infer K, infer V>
	? Map<K, DeepWritable<V>>
	: T extends ReadonlyArray<infer E>
	? Array<DeepWritable<E>>
	: T extends object
	? keyof T extends never
		? T
		: {
				-readonly [P in keyof T]: DeepWritable<T[P]>;
		  }
	: T;

type DisconnectFunction = () => void;
type Ref = any;
