/**
 * This is an example of how to use AsyncBatch with generators
 * Generators are a great way to process a lot of data without having to load everything in memory
 */
import AsyncBatch from "../AsyncBatch";

/**
 * Here we mock a database with a function that return a paginated list of datas
 */
async function getDataFromDatabase(page: number, limit: number = 10) {
	// Create a timoute to simulate a long action like a database request
	await new Promise((resolve) => setTimeout(resolve, 16));
	return Array.from({ length: limit }, (_, i) => i + page * limit);
}

/**
 * Here we create a generator that will fetch datas from the database
 */
async function* generateDatas(fromPage: number = 0, toPage: number = 10) {
	for (let i = fromPage; i < toPage; i++) {
		const datas = await getDataFromDatabase(i, 20);
		for (const data of datas) {
			yield data;
		}
	}
}

/**
 * This is the simple method that will be executed on each data
 * For our example we just add a random number to the data and return it as a string
 * Obviously in a real use case you will do something more useful and return what ever you want
 */
const simpleAction = async (data: number) => {
	// Create a timoute to simulate a long action
	return await new Promise((resolve) => {
		setTimeout(() => {
			resolve((data + Math.random() * 4).toString());
		}, 20);
	});
};

/**
 * Here is the AsyncBatch instantiation, we used a create method to give us more control
 * We set the max concurrency to 4
 * We set the rate limit to 100 executions per 200ms
 */
const asyncBatch = AsyncBatch.create(generateDatas(0, 2), simpleAction, {
	maxConcurrency: 4,
	autoStart: true,
	rateLimit: { msTimeRange: 100, maxExecution: 10 },
});
console.log("starting with max concurrency of 4 and rate limit of 10 per 100ms");
// All events are automatically garbage collected when the AsyncBatch is also garbage collected

let done = false;
/**
 * There is an example of how to listen processingSuccess event
 * Triggered when the AsyncBatch successfully processed a data
 */
asyncBatch.events.onProcessingSuccess(({ type, data, response }) => {
	console.log(type, { data, response });
	if (data === 2 && !done) {
		done = true;
		console.log("added new datas from the processingSuccess event");
		asyncBatch.addMany(generateDatas(2, 4));
	}
});

(async () => {
	await asyncBatch.events.onEmptyPromise();
	asyncBatch.addMany(generateDatas(4, 6));
	console.log("added new datas to the queue after the end of the first batch");
	await asyncBatch.events.onEmptyPromise();
	console.log("end of the second batch");
})();
