import createSystem from "createSystem";

//listens to CollectionService events for Instances with the polyEntity tag for cleanup

export = createSystem(() => {
	let cn: RBXScriptConnection | undefined;
	return {
		name: "EntityWatcher",
		onRegistered: (world) => {
			cn = game
				.GetService("CollectionService")
				.GetInstanceRemovedSignal("polyEntity")
				.Connect((instance) => {
					world.removeRef(instance);
				});
		},
		destroy: () => {
			cn?.Disconnect();
		},
	};
});
