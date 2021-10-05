const RuntimeLib = require(game
	.GetService("ReplicatedStorage")
	.WaitForChild("rbxts_include")
	.WaitForChild("RuntimeLib") as ModuleScript) as {
	import: (caller: LuaSourceContainer, module: Instance) => {};
};

RuntimeLib.import(
	script,
	script.Parent!.WaitForChild("handler") as ModuleScript
);

export {};
