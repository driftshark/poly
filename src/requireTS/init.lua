return function(caller, instance)
	_G[instance] = _G[caller]
	return require(instance)
end