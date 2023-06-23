import AsyncBatch from "../AsyncBatch";

const datas = Array.from({ length: 20000 }, (_, i) => i);

const simpleAction = (data: number) => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(data + Math.random() * 4);
		}, 500);
	});
};

const asyncBatch = AsyncBatch.create(datas, simpleAction, { rateLimit: { msTimeRange: 10000, maxCalls: 10 } })
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
asyncBatch.events.onEachStarted(() => {
	//console.log("eachStarted", event.data);
});

asyncBatch.events.onEachEnded(({}) => {
	//console.log("eachEnded", { data, response });
});

asyncBatch.events.onEachErrored(({}) => {
	//console.log("eachErrored", { error });
});

asyncBatch.events.onWaitingNewDatas(() => {
	console.log("waitingNewDatas");
});
