local TS = _G[script]
local t = TS.import(script, TS.getModule(script, "@rbxts", "t").lib.ts).t
local defineComponent = TS.import(script, script.Parent.Parent, "defineComponent").default
local definition = defineComponent({
	name = "Old",
	data = true,
	refValidator = t.any,
})
return definition
