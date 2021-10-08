return function(subMap, eventInstance, ...)
	for subscriber in ipairs(subMap) do
		eventInstance:FireClient(subscriber, ...)
	end
end