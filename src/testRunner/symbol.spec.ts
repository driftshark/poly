/// <reference types="@rbxts/testez/globals" />

import { named } from "../util/symbol";

export = () => {
	it("should be the same", () => {
		expect(named("base")).to.equal(named("base"));
	});

	it("should be different", () => {
		expect(named("base")).to.never.equal(named("example"));
	});
};
