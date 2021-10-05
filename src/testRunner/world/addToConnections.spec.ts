/// <reference types="@rbxts/testez/globals" />

import { named } from "../../util/symbol";
import addToConnections from "../../world/addToConnections";
import { deepEquals } from "../../util/tableUtil";

export = () => {
	it("should add connection to empty events table", () => {
		const events = {};
		const callback = () => {};
		addToConnections(events, "Old", named("base"), "123", callback);
		expect(
			deepEquals(events, {
				Old: {
					[named("base")]: {
						["123"]: callback,
					},
				},
			})
		).to.equal(true);
	});

	it("should add connection to non-empty events table", () => {
		const callback = () => {};

		const events = {
			Old: {
				["Created"]: {
					["123"]: callback,
				},
			},
			ReplicationGroup: {},
		};

		addToConnections(events, "Old", named("base"), "123", callback);
		expect(
			deepEquals(events, {
				Old: {
					[named("base")]: {
						["123"]: callback,
					},
					["Created"]: {
						["123"]: callback,
					},
				},
				ReplicationGroup: {},
			})
		).to.equal(true);
	});

	it("should add connection to empty component type table", () => {
		const callback = () => {};
		const events = {
			Old: {
				[named("base")]: {},
				["Created"]: {
					["123"]: callback,
				},
			},
		};

		addToConnections(events, "Old", named("base"), "123", callback);
		expect(
			deepEquals(events, {
				Old: {
					[named("base")]: {
						["123"]: callback,
					},
					["Created"]: {
						["123"]: callback,
					},
				},
			})
		).to.equal(true);
	});

	it("should add connection to already populated host", () => {
		const callback = () => {};
		const events = {
			Old: {
				[named("base")]: {
					["123"]: callback,
				},
			},
		};

		addToConnections(events, "Old", named("base"), "456", callback);
		expect(
			deepEquals(events, {
				Old: {
					[named("base")]: {
						["123"]: callback,
						["456"]: callback,
					},
				},
			})
		).to.equal(true);
	});

	it("should only remove one connection", () => {
		const events = {};
		const callback = () => {};

		const disconnect = addToConnections(
			events,
			"Old",
			named("base"),
			"123",
			callback
		);
		addToConnections(events, "Old", named("base"), "456", callback);

		expect(
			deepEquals(events, {
				Old: {
					[named("base")]: {
						["123"]: callback,
						["456"]: callback,
					},
				},
			})
		).to.equal(true);

		disconnect();
		expect(
			deepEquals(events, {
				Old: {
					[named("base")]: {
						["456"]: callback,
					},
				},
			})
		).to.equal(true);
	});

	it("should remove component type table when disconnecting", () => {
		const events = {};
		const callback = () => {};

		const disconnect = addToConnections(
			events,
			"Old",
			named("base"),
			"123",
			callback
		);
		addToConnections(events, "Old", "Created", "123", callback);

		expect(
			deepEquals(events, {
				Old: {
					[named("base")]: {
						["123"]: callback,
					},
					["Created"]: {
						["123"]: callback,
					},
				},
			})
		).to.equal(true);

		disconnect();
		expect(
			deepEquals(events, {
				Old: {
					["Created"]: {
						["123"]: callback,
					},
				},
			})
		).to.equal(true);
	});

	it("should not remove every connection", () => {
		const events = {};
		const callback = () => {};
		const disconnect = addToConnections(
			events,
			"Old",
			named("base"),
			"123",
			callback
		);
		addToConnections(
			events,
			"ReplicationGroup",
			named("base"),
			"123",
			callback
		);

		expect(
			deepEquals(events, {
				Old: {
					[named("base")]: {
						["123"]: callback,
					},
				},
				ReplicationGroup: {
					[named("base")]: {
						["123"]: callback,
					},
				},
			})
		).to.equal(true);

		disconnect();
		expect(
			deepEquals(events, {
				ReplicationGroup: {
					[named("base")]: {
						["123"]: callback,
					},
				},
			})
		).to.equal(true);
	});

	it("should remove everything when disconnecting from otherwise empty events table", () => {
		const events = {};
		const callback = () => {};

		const disconnect = addToConnections(
			events,
			"Old",
			named("base"),
			"123",
			callback
		);

		expect(
			deepEquals(events, {
				Old: {
					[named("base")]: {
						["123"]: callback,
					},
				},
			})
		).to.equal(true);

		disconnect();

		expect(deepEquals(events, {})).to.equal(true);
	});
};
