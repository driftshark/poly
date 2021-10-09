export = <TRemoteEvent extends RemoteEvent>(onFireClient: Callback) => {
	return {
		FireClient(this: {}, player: Player, ...args: unknown[]) {
			onFireClient(player, ...args);
		},
	} as TRemoteEvent;
};
