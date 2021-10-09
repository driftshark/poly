/// <reference types="@rbxts/testez/globals" />

import createClientUtilities from "replication/client/createClientUtilities";
import { BulkType } from "replication/events";
import libworld from "../lib/libworld";

export = () => {
	const { receiveBulkRemoveEvent, receiveRemoveEvent } =
		createClientUtilities(libworld);

	const TEST_REF = "testRef" as unknown as Player;
	const TEST_REF_2 = "testRef2";

	it("should remove", () => {
		libworld.addComponent(TEST_REF, "Old", true);

		expect(libworld.getComponent(TEST_REF, "Old")).to.equal(true);

		receiveRemoveEvent(TEST_REF, "Old");

		expect(libworld.getComponent(TEST_REF, "Old")).to.equal(undefined);

		libworld.removeRef(TEST_REF);
	});

	//
	//bulk
	//

	it("should remove by RefToComponents", () => {
		libworld.addComponent(TEST_REF, "Old", true);
		libworld.addComponent(TEST_REF, "ReplicationGroup", true);

		//@ts-ignore
		libworld.addComponent(TEST_REF, "ReplicationSubscription", true);

		expect(libworld.getComponent(TEST_REF, "Old")).to.equal(true);
		expect(libworld.getComponent(TEST_REF, "ReplicationGroup")).to.equal(true);
		expect(libworld.getComponent(TEST_REF, "ReplicationSubscription")).to.equal(
			true
		);

		receiveBulkRemoveEvent(
			BulkType.RefToComponents,
			["Old", "ReplicationGroup"],
			TEST_REF
		);

		expect(libworld.getComponent(TEST_REF, "Old")).to.equal(undefined);
		expect(libworld.getComponent(TEST_REF, "ReplicationGroup")).to.equal(
			undefined
		);
		expect(libworld.getComponent(TEST_REF, "ReplicationSubscription")).to.equal(
			true
		);

		libworld.removeRef(TEST_REF);
		libworld.removeRef(TEST_REF_2);
	});

	it("should remove by ComponentToDescription", () => {
		libworld.addComponent(TEST_REF, "Old", true);
		libworld.addComponent(TEST_REF, "ReplicationGroup", true);

		//@ts-ignore
		libworld.addComponent(TEST_REF, "ReplicationSubscription", true);

		libworld.addComponent(TEST_REF_2, "Old", true);
		libworld.addComponent(TEST_REF_2, "ReplicationGroup", true);

		//@ts-ignore
		libworld.addComponent(TEST_REF_2, "ReplicationSubscription", true);

		expect(libworld.getComponent(TEST_REF, "Old")).to.equal(true);
		expect(libworld.getComponent(TEST_REF, "ReplicationGroup")).to.equal(true);
		expect(libworld.getComponent(TEST_REF, "ReplicationSubscription")).to.equal(
			true
		);

		expect(libworld.getComponent(TEST_REF_2, "Old")).to.equal(true);
		expect(libworld.getComponent(TEST_REF_2, "ReplicationGroup")).to.equal(
			true
		);
		expect(
			//@ts-ignore
			libworld.getComponent(TEST_REF_2, "ReplicationSubscription")
		).to.equal(true);

		//@ts-ignore
		receiveBulkRemoveEvent(BulkType.ComponentToDescription, {
			Old: [TEST_REF],
			ReplicationGroup: [TEST_REF, TEST_REF_2],
			ReplicationSubscription: [TEST_REF_2],
		});

		expect(libworld.getComponent(TEST_REF, "Old")).to.equal(undefined);
		expect(libworld.getComponent(TEST_REF, "ReplicationGroup")).to.equal(
			undefined
		);
		expect(libworld.getComponent(TEST_REF, "ReplicationSubscription")).to.equal(
			true
		);

		expect(libworld.getComponent(TEST_REF_2, "Old")).to.equal(true);
		expect(libworld.getComponent(TEST_REF_2, "ReplicationGroup")).to.equal(
			undefined
		);
		expect(
			//@ts-ignore
			libworld.getComponent(TEST_REF_2, "ReplicationSubscription")
		).to.equal(undefined);

		libworld.removeRef(TEST_REF);
		libworld.removeRef(TEST_REF_2);
	});
};
