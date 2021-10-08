export = <TEvent extends RemoteEvent>(
	name: string,
	remotesFolder: Instance
): TEvent => {
	const event = new Instance("RemoteEvent");
	event.Name = name;
	event.Parent = remotesFolder;
	return event as TEvent;
};
