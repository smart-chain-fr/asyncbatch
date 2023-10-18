import AsyncBatch from "../AsyncBatch";
test("Instance of AsyncBatch", async () => {
	return new Promise((resolve) => {
		const datas = Array.from({ length: 7 }, (_, i) => i);
		const asyncBatch = AsyncBatch.create(datas, (data) => console.log(data), { maxConcurrency: 3, autoStart: true });
		asyncBatch.events.onProcessingStart((event) => {
			console.log("onProcessingStarted", event.data);
		});
		asyncBatch.events.onStarted((a) => {
			console.log("onStarted", a);
		});
		asyncBatch.events.onEmpty(() => {
			console.log("onWaitingNewDatas");
			asyncBatch.destruct();
			resolve(true);
		});
		expect(asyncBatch).toBeInstanceOf(AsyncBatch);
	});
}, 30000);
