import { t } from "@rbxts/t";

export { ComponentDefinition } from "./Component";
export * from "./defineComponent";
export { default as defineComponent } from "./defineComponent";
export { default as createSystem } from "./createSystem";
export { World } from "./world";
import symbol from "@driftshark/symbol";

const None = symbol.named("None");
export { None };

export { ReplicationType } from "./replication";

import replicationMod from "./replication/replicationMod";

export { replicationMod };
export * from "./componentUtils/layered";
export * from "./componentUtils/mapped";

type eRef = Ref;
type RefOf<TComponentName extends keyof Components> = t.static<
	Components[TComponentName]["refValidator"]
>;

export { eRef as Ref, RefOf };
