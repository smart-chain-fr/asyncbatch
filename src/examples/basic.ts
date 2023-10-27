import AsyncBatch from "../AsyncBatch";

const datas = Array.from({ length: 10 }, (_, i) => i);

const simpleAction = (data: number) => {
	return (data + Math.random() * 4).toString();
};

const asyncBatch = AsyncBatch.create(datas, simpleAction, { maxConcurrency: 4, rateLimit: { msTimeRange: 200, maxCalls: 8 } })
	.setFilter(async () => {
		return true;
	})
	.start();

asyncBatch.events.onStarted(() => {
	console.log(asyncBatch.events.EventsEnum.STARTED);
});

asyncBatch.events.onPaused(() => {
	console.log(asyncBatch.events.EventsEnum.PAUSED);
});

asyncBatch.events.onProcessingStart((event) => {
	console.log("processingStart", event.data);
});

asyncBatch.events.onProcessingEnd(({ data, response, error }) => {
	console.log(response);
	console.log("processingEnd", { data, response, error });
});

asyncBatch.events.onProcessingError(({ error }) => {
	console.log("processingError", { error });
});

let i = 0;
asyncBatch.events.onWaitingNewDatas(() => {
	console.log("waitingNewDatas");
	if(i > 1) {
		return;
	};
	i++;
	asyncBatch.addMany(datas);
});
