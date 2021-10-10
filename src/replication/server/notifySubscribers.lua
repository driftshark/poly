return function(subMap, eventInstance, ...)
	for subscriber in pairs(subMap) do
		eventInstance:FireClient(subscriber, ...)
	end
end