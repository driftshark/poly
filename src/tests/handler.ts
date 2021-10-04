//require(game:GetService("ServerScriptService").poly.tests.handler)()

import { TestBootstrap } from "@rbxts/testez";

export = async () => {
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

	const result = await Promise.race([
		Promise.delay(5),
		new Promise((resolve, reject) => {
			TestBootstrap.run(tests);
			resolve(true);
		}),
	]);

	tests.forEach((file) => {
		file.Destroy();
	});
	tests = [];

	if (typeIs(result, "number")) {
		warn("Tests took more than 5 seconds!");
	} else {
		warn("Tests ran!");
	}
};
