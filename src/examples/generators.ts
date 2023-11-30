/**
 * This is an example of how to use AsyncBatch with generators
 * Generators are a great way to process a lot of data without having to load everything in memory
 */
import AsyncBatch from "../AsyncBatch";

function* datas(n: number) {
	// Set the datas to process
	const datas = [0 + n, 1 + n, 2 + n, 3 + n, 4 + n, 5 + n, 6 + n, 7 + n, 8 + n, 9 + n];

	for (const data of datas) {
		yield data;
	}
}

/**
 * This is the simple method that will be executed on each data
 * For our example we just add a random number to the data and return it as a string
 * Obviously in a real use case you will do something more useful and return what ever you want
 */
const simpleAction = (data: number) => {
	return (data + Math.random() * 4).toString();
};

/**
 * Here is the AsyncBatch instantiation, we used a create method to give us more control
 * We set the max concurrency to 4
 * We set the rate limit to 8 executions per 200ms
 */
const asyncBatch = AsyncBatch.create(datas(0), simpleAction, {
	maxConcurrency: 4,
	autoStart: true,
	rateLimit: { msTimeRange: 1000, maxExecution: 4 },
});
console.log("starting with max concurrency of 4 and rate limit of 4 per 1000ms");
// All events are automatically garbage collected when the AsyncBatch is also garbage collected

let done = false;
/**
 * There is an example of how to listen processingSuccess event
 * Triggered when the AsyncBatch successfully processed a data
 */
asyncBatch.events.onProcessingSuccess(({ type, data, response }) => {
	console.log(type, { data, response });
	if (data === 5 && !done) {
		done = true;
		asyncBatch.addMany(datas(10));
	}
});

(async () => {
	await asyncBatch.events.onEmptyPromise();
	asyncBatch.addMany(datas(20));
	console.log("added new datas to the queue after the end of the first batch");
	await asyncBatch.events.onEmptyPromise();
	console.log("end of the second batch");
})();
