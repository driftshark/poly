return function(events, componentName, connectionType, uuid, callback)
	if events[componentName] == nil then
		events[componentName] = {};
	end

	if events[componentName][connectionType] == nil then
		events[componentName][connectionType] = {};
	end
	
	events[componentName][connectionType][uuid] = callback;

	return function()
		if events[componentName] and events[componentName][connectionType] then
			events[componentName][connectionType][uuid] = nil;

			if next(events[componentName][connectionType]) == nil then
				events[componentName][connectionType] = nil;

				if next(events[componentName]) == nil then
					events[componentName] = nil;
				end
			end
		end
	end
end