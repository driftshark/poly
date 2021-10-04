import { System } from "System";

export default (systemBuilder: () => System) => {
	return systemBuilder;
};
