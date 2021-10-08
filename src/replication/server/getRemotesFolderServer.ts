export = () => {
	let remotesFolder = game
		.GetService("ReplicatedStorage")
		.FindFirstChild("ReplicationRemotes");
	if (remotesFolder) return remotesFolder;

	remotesFolder = new Instance("Folder");
	remotesFolder.Name = "ReplicationRemotes";
	remotesFolder.Parent = game.GetService("ReplicatedStorage");

	return remotesFolder;
};
