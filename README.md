# AsyncBatch README

AsyncBatch is a JavaScript library designed for performing batched asynchronous tasks while controlling concurrency, all without relying on external dependencies. This README offers an introduction to the library's capabilities and instructions on its efficient usage.

## Installation

You can install the AsyncBatch library using npm or yarn:

```bash
npm install async-batch
# or
yarn add async-batch
```
## Basic Usage
To use the AsyncBatch library, you need to create an instance and configure it as needed. Here's a basic example of how to use it:

```ts
import AsyncBatch from 'async-batch';

// Create an instance of AsyncBatch
const asyncBatch = AsyncBatch.create(datas, simpleAction).start();
```
The code snippet above shows how to create an AsyncBatch instance, define an asynchronous action function, and start processing data. The following sections provide more details on how to use the library.

## Advanced Usage
### Creating an AsyncBatch Instance
To create an AsyncBatch instance, you need to provide the following parameters:

- `dataArray`: An array of data to be processed. Each item in the array will be passed to the action function.
- `asyncAction`: An asynchronous function that will be called for each item in the data array. The function should accept a single parameter, which will be an item from the data array.
- `options`: An optional object that can be used to configure the AsyncBatch instance. See the [Options](#options) section for more details.

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
    maxExecution: 5, // Set a maximum number of tasks to execute within the time range
  };
};

const asyncBatch = AsyncBatch.create(dataArray, asyncAction, options);

```

### Practical Example
#### Asynchronous Batch Processing with PolyScan API

The batch processes an array of data elements, making asynchronous API requests to the PolyScan API using a provided API key. The asyncAction function handles the API fetch logic, while options like concurrency limits and rate limiting control the processing.

```ts
import AsyncBatch from 'async-batch';

// Replace this with your array of data to process
const dataArray = [1, 2, 3, 4, 5];

// Define your options
const options = {
  autoStart: true,
  maxConcurrency: 4, 
  rateLimit: {
    msTimeRange: 1000,
    maxExecution: 5, // Avoid to exceed the API rate limit
  },
};

// Create an instance of AsyncBatch with API fetch as the async action
const asyncBatch = AsyncBatch.create(
  dataArray,
  async (data) => {
    // Replace 'YOUR_API_KEY' with your actual API key
    const apiKey = 'YOUR_API_KEY';
    const apiUrl = `https://api.polyscan.io/v1/endpoint?data=${data}&apiKey=${apiKey}`;
    
    try {
      const response = await fetch(apiUrl);
      if (response.ok) {
        const jsonData = await response.json();
        return jsonData; // Return the fetched data
      } else {
        throw new Error(`Failed to fetch data for ${data}`);
      }
    } catch (error) {
      throw error; // Propagate the error
    }
  },
  options
);

// Start processing the data
asyncBatch.start();
```


### Additional Features

The `AsyncBatch` library offers additional features and methods that can be used to control the batch processing. These features provide flexibility and control over how your asynchronous tasks are executed. Here are some of the key features:

- `add(data)`: Add new data to the batch.
- `addMany(datas)`: Add multiple data items to the batch.
- `updateAction(action)`: Change the action function used for processing data.
- `pause()/stop()`: Pause or stop the batch processing at any time and resume it later using `start()`.
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
  console.log("Succes response:", response);
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

## Sample Code

For more detailed information and examples, please refer to the library's example file located at /src/examples/basic.ts.

## Contributing

Contributions are welcome! Please see the [contributing guide](CONTRIBUTING.md) for more details.

## License

This project is licensed under the terms of the [MIT license](LICENSE).

## Credits

This library was developed by [Smartchain](https://www.smart-chain.fr/).



