import createSystem from "createSystem";

//listens to CollectionService events for Instances with the Component tag for cleanup

export = createSystem(() => {
	return {
		name: "component",
		onRegistered: (world) => {
			game
				.GetService("CollectionService")
				.GetInstanceRemovedSignal("Component")
				.Connect((instance) => {
					world.removeRef(instance);
				});
		},
	};
});
