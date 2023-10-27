# AsyncBatch README

AsyncBatch is a JavaScript library for executing asynchronous tasks in batches with concurrency control. This README provides an overview of the library's features and how to use it effectively.

## Installation

You can install the AsyncBatch library using npm or yarn:

```bash
npm install async-batch
# or
yarn add async-batch
```
## Usage
To use the AsyncBatch library, you need to create an instance and configure it as needed. Here's a basic example of how to use it:

```ts
import AsyncBatch from 'async-batch';

// Define your action function
function asyncAction(data) {
  // Your asynchronous task logic here
}

// Create an instance of AsyncBatch
const asyncBatch = AsyncBatch.create(dataArray, asyncAction, options);

// Start processing the data
asyncBatch.start();
```
The code snippet above shows how to create an AsyncBatch instance, define an asynchronous action function, and start processing data. The following sections provide more details on how to use the library.

### Creating an AsyncBatch Instance
To create an AsyncBatch instance, you need to provide the following parameters:

- `dataArray`: An array of data to be processed. Each item in the array will be passed to the action function.
- `asyncAction`: An asynchronous function that will be called for each item in the data array. The function should accept a single parameter, which will be an item from the data array.
- `options`: An optional object that can be used to configure the AsyncBatch instance. See the [Options](#options) section for more details.

Here's an example of how to create an AsyncBatch instance:

```ts
const asyncBatch = AsyncBatch.create(dataArray, asyncAction, options);
```

### Starting the Batch
Once you've created an AsyncBatch instance, you can start processing the data by calling the `start()` method:

```ts
asyncBatch.start();
```

### Options
The AsyncBatch constructor accepts an optional `options` parameter that can be used to configure the instance. The following options are available:

- `concurrency`: The maximum number of concurrent tasks to run. Defaults to `4`.
- `autoStart`: (default: false): Whether the batch processing should start automatically.
- `rateLimit`: (default: null): Rate-limiting options for controlling task execution 

Here's how to pass options when creating an AsyncBatch instance:

```ts
const options = {
  autoStart: true, // Automatically start processing
  maxConcurrency: 10, // Set a higher concurrency limit
  rateLimit: {
    msTimeRange: 1000, // Set a time range for rate limiting
    maxCalls: 5, // Limit the number of calls within the time range
  };
};

const asyncBatch = AsyncBatch.create(dataArray, asyncAction, options);

```

### Additional Features

The `AsyncBatch` library offers additional features and methods that can be used to control the batch processing. These features provide flexibility and control over how your asynchronous tasks are executed. Here are some of the key features:

- `add(data)`: Add data to the batch for processing.
- `updateAction(action)`: Change the action function used for processing data.
- `pause()`: Pause the batch processing.
- `stop()`: Stop the batch processing (alias for pause).
- `getCurrentConcurrency()`: Get the current number of concurrent tasks.
- `updateMaxConcurrency(maxConcurrency)`: Update the maximum concurrency limit.
- `setFilter(filter)`: Set a filter function to determine whether data should be processed.
- `clear()`: Clear the batch queue.

### Handling Events
The AsyncBatch library provides an event emitter that can be used to handle events. Here's a detailed breakdown of how to handle specific events using the provided example:

#### Batch Start and Pause Events

```ts
asyncBatch.events.onStarted(() => {
  console.log("Batch processing started");
});

asyncBatch.events.onPaused(() => {
  console.log("Batch processing paused");
});
```
These events notify you when the batch processing starts and when it's paused.

#### Processing Events

```ts
asyncBatch.events.onProcessingStart((event) => {
  console.log("Processing started for data:", event.data);
});

asyncBatch.events.onProcessingEnd(({ data, response, error }) => {
  console.log("Processing ended for data:", data);
  console.log("Response:", response);
  console.log("Error:", error);
});

asyncBatch.events.onProcessingError(({ error }) => {
  console.log("Error during processing:", error);
});
```
These events notify you when processing starts for an item in the data array, when processing ends, and when an error occurs during processing.

#### Waiting for New Data

```ts
let i = 0;
asyncBatch.events.onWaitingNewDatas(() => {
  console.log("Waiting for new datas");
  if (i > 1) {
    return;
  }
  i++;
  asyncBatch.addMany(datas);
});
```
This event is triggered when the batch is waiting for new data, and it demonstrates how to add more data dynamically to the batch.

For more detailed information and examples, please refer to the library's documentation or the example file located at /src/examples/basic.ts.

## Contributing

Contributions are welcome! Please see the [contributing guide](CONTRIBUTING.md) for more details.

## License

This project is licensed under the terms of the [MIT license](LICENSE).

## Credits

This library was created by [Team SmartChain]



