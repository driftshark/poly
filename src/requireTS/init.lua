local TS = require(game:GetService("ReplicatedStorage"):WaitForChild("rbxts_include"):WaitForChild("RuntimeLib"))

return function(instance)
	_G[instance] = TS
	return require(instance)
end