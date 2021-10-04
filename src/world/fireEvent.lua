local symbol = require(script.Parent.Parent.util.symbol)
local BASE_SYMBOL = symbol.named("base")

return function(self, componentName, eventName, ref, ...)
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