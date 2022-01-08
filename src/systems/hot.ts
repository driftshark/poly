import createSystem from "createSystem";
import requireTS from "requireTS";
import { UpdateSystem } from "System";

export = createSystem(() => {
	return game.GetService("RunService").IsStudio()
		? {
				name: "Hot",
				onRegistered: (world) => {
					task.defer(() => {
						for (const [trackedSystemInstance, system] of world["systems"]) {
							if (!typeIs(trackedSystemInstance, "Instance")) {
								continue;
							}

							(trackedSystemInstance.Changed as RBXScriptSignal).Connect(() => {
								print(`hmr update - ${system.name}`);

								let thisSystemInstance: ModuleScript | undefined = undefined;
								for (const [k, v] of pairs(world["systems"])) {
									if (v.name === system.name) {
										thisSystemInstance = k as ModuleScript;
										break;
									}
								}

								if (thisSystemInstance !== undefined) {
									const currentSystem =
										world["systems"].get(thisSystemInstance)!;
									if (currentSystem.destroy) currentSystem.destroy(world);

									world["systems"].delete(thisSystemInstance);
									const index = world["updateSystems"].indexOf(
										currentSystem as UpdateSystem
									);
									if (index !== -1) {
										world["updateSystems"].remove(index);
									}

									world.registerSystems(
										[
											(
												requireTS(trackedSystemInstance.Clone()) as ReturnType<
													typeof import("../createSystem").default
												>
											)(),
										],
										true
									);
								}
							});
						}
					});
				},
		  }
		: { name: "Hot" };
});
