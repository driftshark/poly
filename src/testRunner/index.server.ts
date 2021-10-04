import { TestBootstrap } from "@rbxts/testez";

const RuntimeLib = require(game
	.GetService("ReplicatedStorage")
	.WaitForChild("rbxts_include")
	.WaitForChild("RuntimeLib") as ModuleScript) as {
	import: (caller: LuaSourceContainer, module: Instance) => {};
};

let tests: ModuleScript[] = [];

const directories: Instance[] = [script.Parent!.Parent!];

for (const v of directories) {
	for (const file of v.GetDescendants()) {
		if (file.Name.sub(-5) === ".spec" && file.IsA("ModuleScript")) {
			const newFile = file.Clone();
			newFile.Parent = file.Parent;

			RuntimeLib.import(script, newFile);

			tests.push(newFile);
		}
	}
}

TestBootstrap.run(tests);

tests.forEach((file) => {
	file.Destroy();
});
tests = [];
