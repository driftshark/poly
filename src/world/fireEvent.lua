local TS = _G[script]
local symbol = TS.import(script, TS.getModule(script, "@driftshark", "symbol").out)
local BASE_SYMBOL = symbol.named("base")

return function(self, ref, componentName, eventName, ...)
	local componentListeners = self.events[componentName]
	if componentListeners == nil then
		return
	end

	if componentListeners[BASE_SYMBOL] ~= nil then
		for _, v in pairs(componentListeners[BASE_SYMBOL]) do
			v(eventName, ref, ...)
		end
	end

	if componentListeners[eventName] ~= nil then
		for _, v in pairs(componentListeners[eventName]) do
			v(ref, ...)
		end
	end

	if componentListeners[ref] ~= nil then
		for _, v in pairs(componentListeners[ref]) do
			v(eventName, ...)
		end
	end
end