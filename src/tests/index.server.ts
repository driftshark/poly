import { TestBootstrap } from "@rbxts/testez";

let tests: ModuleScript[] = [];

const directories: Instance[] = [script.Parent!.Parent!];

for (const v of directories) {
	for (const file of v.GetDescendants()) {
		if (file.Name.sub(-5) === ".spec" && file.IsA("ModuleScript")) {
			const newFile = file.Clone();
			newFile.Parent = file.Parent;

			tests.push(newFile);
		}
	}
}

TestBootstrap.run(tests);

tests.forEach((file) => {
	file.Destroy();
});
tests = [];
