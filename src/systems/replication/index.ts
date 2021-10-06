export = game.GetService("RunService").IsServer()
	? import("./serverSystem").await()[1]
	: import("./clientSystem").await()[1];
