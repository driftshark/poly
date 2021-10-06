export default (parent: Instance, childName: string, timeout?: number) => {
	return new Promise<Instance | undefined>((resolve, reject, onCancel) => {
		let child = parent.FindFirstChild(childName);
		if (child) {
			resolve(child);
		} else {
			const offset = timeout ?? 5;
			const startTime = os.clock();
			let cancelled = false;
			const connection: RBXScriptConnection | undefined = parent
				.GetPropertyChangedSignal("Parent")
				.Connect(() => {
					if (!parent.Parent) {
						if (connection) {
							connection.Disconnect();
						}

						cancelled = true;
						return reject(
							`PromiseChild(${parent.GetFullName()}, ${childName}) was cancelled due to the parent being parented to nil.`
						);
					}
				});

			onCancel(() => {
				cancelled = true;
				if (connection) {
					connection.Disconnect();
				}

				return reject(
					`PromiseChild(${parent.GetFullName()}, ${childName}) was cancelled.`
				);
			});

			while (!child && !cancelled && startTime + offset > os.clock()) {
				task.wait(0.03);
				child = parent.FindFirstChild(childName);
			}

			if (connection) {
				connection.Disconnect();
			}

			if (child) {
				resolve(child);
			} else if (timeout === undefined) {
				reject(
					`Infinite yield possible for PromiseChild(${parent.GetFullName()}, ${childName})`
				);
			}
		}
	});
};
