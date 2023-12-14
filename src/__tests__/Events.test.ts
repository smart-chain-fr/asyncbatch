import AsyncBatch from "../AsyncBatch";
import EventProcessingError from "../AsyncBatch/Events/EventProcessingError";

describe("AsyncBatch Events", () => {
	let asyncBatch: AsyncBatch<number, any>;
	const datas = Array.from({ length: 10 }, (_, i) => i);
	const simpleAction = (data: number) => (data + Math.random() * 4).toString();

	beforeEach(() => {
		asyncBatch = AsyncBatch.create(datas, simpleAction, {
			maxConcurrency: 4,
			rateLimit: { msTimeRange: 200, maxExecution: 8 },
		}).setFilter(async () => true);
	});

	test("onStarted event is triggered when batch starts", (done) => {
		asyncBatch.events.onStarted(() => {
			done();
		});

		asyncBatch.start();
	});

	test("onProcessingStart event is triggered at the start of processing", (done) => {
		asyncBatch.events.onProcessingStart(() => {
			done();
		});

		asyncBatch.start();
	});

	test("onProcessingEnd event is triggered at the end of processing", (done) => {
		asyncBatch.events.onProcessingEnd(() => {
			done();
		});

		asyncBatch.start();
	});

	test("onWaitingNewDatas event is triggered when waiting for new data", (done) => {
		let i = 0;
		asyncBatch.events.onWaitingNewDatas(() => {
			if (i > 1) {
				done();
			}
			i++;
			asyncBatch.addMany(datas);
		});

		asyncBatch.start();
	});

	test("Event triggered when batch is empty", (done) => {
		asyncBatch.events.onEmpty(() => {
			done();
		});

		// Assuming the batch can be emptied for the test
		asyncBatch.clear();
		asyncBatch.start();
	});

	test("onCleared event is triggered when batch is cleared", (done) => {
		asyncBatch.events.onCleared(() => {
			done();
		});

		asyncBatch.clear();
		asyncBatch.start();
	});

	test("onPaused event is triggered when batch is paused", (done) => {
		asyncBatch.events.onPaused(() => {
			done();
		});

		asyncBatch.requestPause();
	});

	test("onProcessingSuccess event is triggered when action succeeds", (done) => {
		asyncBatch.events.onProcessingSuccess(() => {
			done();
		});

		asyncBatch.start();
	});

	test("onProcessingError event is triggered when action fails", async () => {
		asyncBatch = AsyncBatch.create(
			[1],
			() => {
				throw new Error("Error");
			},
			{
				maxConcurrency: 4,
				rateLimit: { msTimeRange: 200, maxExecution: 8 },
			},
		).start();

		await new Promise<void>((resolve) => {
			asyncBatch.events.onProcessingErrorPromise().then((error) => {
				expect(error).toBeInstanceOf(EventProcessingError);
				resolve();
			});

			asyncBatch.events.onProcessingSuccessPromise().then(() => {
				expect(true).toBe(false);
				resolve();
			});
		});
	});
});
