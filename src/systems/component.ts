import createSystem from "createSystem";

//listens to CollectionService events for Instances with the Component tag for cleanup

export = createSystem(() => {
	let cn: RBXScriptConnection | undefined;
	return {
		name: "component",
		onRegistered: (world) => {
			cn = game
				.GetService("CollectionService")
				.GetInstanceRemovedSignal("Component")
				.Connect((instance) => {
					world.removeRef(instance);
				});
		},
		destroy: () => {
			cn?.Disconnect();
		},
	};
});
