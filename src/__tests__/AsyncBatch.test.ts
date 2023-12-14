import AsyncBatch from "../AsyncBatch";

describe("AsyncBatch", () => {
	test("Instance of AsyncBatch", async () => {
		const datas = Array.from({ length: 7 }, (_, i) => i);
		const asyncBatch = AsyncBatch.create(datas, (data) => data.toString(), {
			maxConcurrency: 3,
			autoStart: true,
		});

		await asyncBatch.events.onEmptyPromise();
		expect(asyncBatch).toBeInstanceOf(AsyncBatch);
	});
});
