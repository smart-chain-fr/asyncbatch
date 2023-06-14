import AsyncBatch from "../AsyncBatch";
test("Instance of AsyncBatch", async () => {
	return new Promise((resolve) => {
		const asyncBatch = AsyncBatch.create(
			Array.from({ length: 7 }, (_, i) => i),
			(d) => {
				console.log(d);
			},
			{ maxConcurrency: 3, autoStart: true },
		)
			.onWaitingNewDatas(() => {
				console.log("onWaitingNewDatas");
				resolve(true);
			})
			.onEachStarted((event) => {
				console.log("onEachStarted", event.data);
			})
			.onStarted((a) => {
				console.log("onStarted", a);
			});
		expect(asyncBatch).toBeInstanceOf(AsyncBatch);
	});
}, 30000);
