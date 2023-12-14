/*
Here is an example of pagination with AsyncBatch.
	
The goal is to mock a database with a function that return a paginated list of users id.

We create an AsyncBatch instance with empty datas and a simple action
We set the max concurrency to 4 and the rate limit to 8 executions per 200ms, it means that the batch will process max 8 datas every 200ms.
Because we start without datas, the batch will trigger immediately the onWaitingNewDatas event.
In this event we fetch the paginated users id and add them to the batch.

This use case is useful when you want to process a lot of datas but you don't want to overload your memory by fetching all the datas at once
Use can also use generators as datas to do the same thing, see the generators.ts example but with more elegant code.
*/

import AsyncBatch from "../AsyncBatch";

// We mock a pagination with a simple counter
let currentPage = 0;
// We set the max page to 10
let maxPage = 10;

/**
 * Here we mock a database with a function that return a paginated list of users id
 */
function getPaginatedUsersFromDatabase(page: number): Promise<number[]> {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(Array.from({ length: 10 }, (_, i) => i + page * 10));
		}, 1000);
	});
}

/**
 * This is the simple method that will be executed on each data
 * For our example we just add a random number to the data and return it as a string
 * Obviously in a real use case you will do something more useful and return what ever you want
 */
const simpleAction = async (data: number) => {
	return new Promise<string>((resolve) => {
		setTimeout(() => {
			resolve((data + Math.random() * 4).toString());
		}, 100);
	});
};

/**
 * Here is the AsyncBatch instantiation, we used a create method to give us more control
 * We set the max concurrency to 4
 * We set the rate limit to 8 executions per 200ms
 */
const asyncBatch = AsyncBatch.create<number, Promise<string>>([], simpleAction, {
	maxConcurrency: 4,
	rateLimit: { msTimeRange: 200, maxExecution: 8 },
}).start();

/**
 * Here we listen the onWaitingNewDatas event
 * This event is triggered when the queue is empty and the AsyncBatch is waiting for new datas, this give you the opportunity to add a new set of datas (like pagination for example)
 */
asyncBatch.events.onWaitingNewDatas(async () => {
	console.log("waiting new datas");

	// Stop the batch if we have reached the max page
	if (currentPage >= maxPage) return;

	const usersId = await getPaginatedUsersFromDatabase(currentPage);
	currentPage++;

	asyncBatch.addMany(usersId);
});

// All events are automatically garbage collected when the AsyncBatch is also garbage collected

/**
 * There is an example of how to listen start event
 * Triggered when the AsyncBatch is started (with the start method or with autoStart option)
 * Any event can be (optionaly) removed with his returned value: TRemoveEvent function
 */
asyncBatch.events.onStarted(() => {
	console.log(asyncBatch.events.EventsEnum.START);
});

/**
 * There is an example of how to listen pause event
 * Triggered when the AsyncBatch is paused (with the pause method)
 * Any event can be (optionaly) removed with his returned value: TRemoveEvent function
 */
asyncBatch.events.onPaused(() => {
	console.log(asyncBatch.events.EventsEnum.PAUSE);
});

/**
 * There is an example of how to listen processingStart event
 * Triggered when the AsyncBatch start to process a data
 */
asyncBatch.events.onProcessingStart(({ type, data }) => {
	console.log(type, { data });
});

/**
 * There is an example of how to listen processingSuccess event
 * Triggered when the AsyncBatch successfully processed a data
 */
asyncBatch.events.onProcessingSuccess(({ type, data, response }) => {
	console.log(type, { data, response });
});

/**
 * There is an example of how to listen processingEnd event
 * Triggered when the AsyncBatch finished to process a data
 * Doesn't matter if the processing was a success or a failure this event will be triggered
 */
asyncBatch.events.onProcessingEnd(({ data, response, error }) => {
	console.log("processingEnd", { data, response, error });
});

/**
 * There is an example of how to listen processingError event
 * Triggered when the action throw an error or reject a promise
 */
asyncBatch.events.onProcessingError(({ type, error }) => {
	console.log(type, { error });
});
