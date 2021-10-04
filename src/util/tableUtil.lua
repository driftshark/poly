local symbol = require(script.Parent.symbol)
local None = symbol.named("None")

local function shallow(tbl)
	if typeof(tbl) ~= "table" then
		return tbl
	end

	local tblCopy = {}
	for i,v in pairs(tbl) do
		tblCopy[i] = v
	end

	return tblCopy
end

local function merge(...)
	local new = {}

	for dictionaryIndex = 1, select('#', ...) do
		local dictionary = select(dictionaryIndex, ...)

		if dictionary ~= nil then
			for key, value in pairs(dictionary) do
				if value == None then
					new[key] = nil
				else
					new[key] = value
				end
			end
		end
	end

	return new
end

local function copy(tbl)
	if typeof(tbl) ~= "table" then
		return tbl
	end

	local tblCopy = {}
	for i,v in pairs(tbl) do
		if typeof(v) == "table" then
			tblCopy[i] = copy(v)
		else
			tblCopy[i] = v
		end
	end

	return tblCopy
end

local function deepEquals(a, b)
	if a == b then
		return true
	end

	for k in pairs(a) do
		local av = a[k]
		local bv = b[k]
		if type(av) == "table" and type(bv) == "table" then
			local result = deepEquals(av, bv)
			if not result then
				return false
			end
		elseif av ~= bv then
			return false
		end
	end

	-- extra keys in b
	for k in pairs(b) do
		if a[k] == nil then
			return false
		end
	end

	return true
end

local SerializedNone = "_N"

local function diff(a, b)
	local diffed = {}

	for k, v in pairs(b) do
		if a[k] == v then
			continue
		end

		if typeof(v) ~= typeof(a[k]) or typeof(v) ~= "table" then
			diffed[k] = v
		else
			diffed[k] = diff(a[k], v)
		end
	end

	for k, v in pairs(a) do
		if b[k] == nil then
			diffed[k] = SerializedNone
		end
	end

	return diffed
end

local function patch(a, diff)
	local new = shallow(a)

	for k, v in pairs(diff) do
		if typeof(v) ~= typeof(new[k]) or typeof(v) ~= "table" then
			if v == SerializedNone then
				new[k] = nil
			else
				new[k] = v
			end
		else
			--both are tables
			new[k] = patch(new[k], v)
		end
	end

	return new
end

return {
	merge = merge,
	copy = copy,
	deepEquals = deepEquals,
	shallow = shallow,
	diff = diff,
	patch = patch,
}