/*
	Example of a basic usage of AsyncBatch
*/
import AsyncBatch from "../AsyncBatch/index2";

// Set the datas to process
const datas = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * This is the simple method that will be executed on each data
 * For our example we simulate a long action with a timeout and return a random number as a string
 * Obviously in a real use case you will do something more useful and return what ever you want
 */
const simpleAction = async (data: number) => {
	// Create a timoute to simulate a long action
	return await new Promise((resolve) => {
		setTimeout(() => {
			resolve((data + Math.random() * 4).toString());
			console.log("processed", data);
		}, 500);
	});
};

(async () => {
	/**
	 * In this example we used the run method but you can also use the create method to give you more control
	 * Here we use the static run method to run the batch
	 * We set the max concurrency to 4
	 * When you use the run method the AsyncBatch is automatically started
	 * Await the run method to wait for the end of the batch
	 */
	await AsyncBatch.run(datas, simpleAction, { maxConcurrency: 4 });
})();
