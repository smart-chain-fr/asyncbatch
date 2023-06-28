import AsyncBatch from "../AsyncBatch";

const datas = Array.from({ length: 50 }, (_, i) => i);

const simpleAction = (data: number) => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(data + Math.random() * 4);
		}, 500);
	});
};

const asyncBatch = AsyncBatch.create(datas, simpleAction, { maxConcurrency: 4, rateLimit: { msTimeRange: 5000, maxCalls: 8 } })
	.setFilter(async () => {
		return true;
	})
	.start();

asyncBatch.events.onStarted(() => {
	console.log("started");
});

asyncBatch.events.onPaused(() => {
	console.log("paused");
});

asyncBatch.events.onProcessingStart((event) => {
	console.log("processingStart", event.data);
});

asyncBatch.events.onProcessingEnd(({ data, response }) => {
	console.log("processingEnd", { data, response });
});

asyncBatch.events.onProcessingError(({ error }) => {
	console.log("processingError", { error });
});

asyncBatch.events.onWaitingNewDatas(() => {
	console.log("waitingNewDatas");
});
