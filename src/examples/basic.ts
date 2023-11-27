import AsyncBatch from "../AsyncBatch";

function getPaginatedUsersFromDatabase(page: number): Promise<number[]> {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(Array.from({ length: 10 }, (_, i) => i + page * 10));
		}, 1000);
	});
}

const simpleAction = async (data: number) => {
	return (data + Math.random() * 4).toString();
};

const asyncBatch = AsyncBatch.create<number, Promise<string>>([], simpleAction, { maxConcurrency: 4, rateLimit: { msTimeRange: 200, maxExecution: 8 } })
	.setFilter(async () => {
		return true;
	})
	.start();

asyncBatch.events.onStarted(() => {
	console.log(asyncBatch.events.EventsEnum.START);
});

asyncBatch.events.onPaused(() => {
	console.log(asyncBatch.events.EventsEnum.PAUSE);
});

asyncBatch.events.onProcessingStart((event) => {
	console.log("processingStart", event.data);
});

asyncBatch.events.onProcessingSuccess(({ data, response }) => {
	console.log("processingSuccess", data, response);
});

asyncBatch.events.onProcessingEnd(({ data, response, error }) => {
	console.log("processingEnd", { data, response, error });
});

asyncBatch.events.onProcessingError(({ error }) => {
	console.log("processingError", { error });
});

let currentPage = 0;
let maxPage = 10;
asyncBatch.events.onWaitingNewDatas(async () => {
	console.log("waiting new datas");

	// Stop the batch if we have reached the max page
	if (currentPage >= maxPage) return;

	const usersId = await getPaginatedUsersFromDatabase(currentPage);
	currentPage++;

	asyncBatch.addMany(usersId);
});
