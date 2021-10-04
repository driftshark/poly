import { t } from "@rbxts/t";
import { World } from "index";

export = <
	TRef extends t.static<Components[TComponentName]["refValidator"]>,
	TComponentName extends keyof Components,
	TKey extends keyof Components[TComponentName]["data"]
>(
	world: World,
	ref: TRef,
	componentName: TComponentName,
	key: TKey,
	value: Components[TComponentName]["data"][TKey]
) => {};
