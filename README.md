# AsyncBatch

AsyncBatch is a TypeScript library designed for performing batched asynchronous tasks while controlling concurrency, all without relying on external dependencies. This README offers an introduction to the library's capabilities and instructions on its efficient usage.

## Installation

You can install the AsyncBatch library using npm or yarn:

```bash
npm install @smart-chain-fr/asyncbatch
# or
yarn add @smart-chain-fr/asyncbatch
```
## Basic Usage
To use the AsyncBatch library, you have two primary approaches: using the create method or the run method. Each method offers different levels of control and simplicity based on your requirements.

### Using the `run` Method

To begin with the run method:

```ts
import { AsyncBatch } from '@smart-chain-fr/asyncbatch';

// Run the batch process
await AsyncBatch.run(datas, simpleAction, options);
```
The `run` method is particularly useful for simpler use cases where you want to quickly set up and start your batch process. It automatically creates and starts the AsyncBatch instance for you. this method offers a convenient and efficient way to execute batch tasks with minimal setup. It's ideal for straightforward use cases.

### Using the `create` Method
Alternatively, you can use the create method to create an AsyncBatch instance and start the batch process:

```ts
import { AsyncBatch } from '@smart-chain-fr/asyncbatch';

// Create an instance of AsyncBatch
const asyncBatch = AsyncBatch.create(datas, simpleAction).start();
```

This example demonstrates creating an AsyncBatch instance, defining an asynchronous action function, and starting the processing of data items. 
the `create` method is ideal for more complex use cases where you need more control over the batch process. It allows you to configure the batch process, start and pause it, and resume it later as needed. It also provides an event listeners that can be used to handle events.
See the [Advanced Usage](#advanced-usage) section for more details.

### Options
The AsyncBatch constructor accepts an optional `options` parameter that can be used to configure the instance. The following options are available:

- `concurrency`: The maximum number of concurrent tasks to run. Defaults to `4`.
- `autoStart`: (default: false): Whether the batch processing should start automatically.
- `rateLimit`: (default: null): Rate-limiting options controls the rate at which tasks are executed to avoid overloading an external API or service. For example, if you're making API calls to an external service like the EtherScan API, it may have rate limits in place to prevent abuse or excessive usage. By configuring rate limiting in the options, you can ensure that your batch processing doesn't exceed these limits.

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

## Advanced Usage
### Creating an AsyncBatch Instance
To create an AsyncBatch instance, you need to provide the following parameters:

- `dataArray`: An array of data or Generator to be processed. Each item in the Iterator will be passed to the action function.
- `asyncAction`: An asynchronous function that will be called for each item in the data array. The function should accept a single parameter, which will be an item from the data array.
- `options`: An optional object that can be used to configure the AsyncBatch instance. See the [Options](#options) section for more details.



### Practical Example
#### Asynchronous Batch Processing with EtherScan API

This code batch processes a list of token IDs by fetching owner addresses from the Bored Ape Yacht Club (BAYC) smart contract on EtherScan. The asyncAction function manages the API requests, while options like concurrency limits and rate limiting ensure efficient and rate-limited data retrieval.

```ts
import { AsyncBatch } from '@smart-chain-fr/asyncbatch';

// Replace this array with the list of token IDs you want to retrieve owner addresses for
const tokenIds = [1, 2, 3, 4, 5];

const options = {
  autoStart: true, // Automatically start processing
  concurrency: 4, // Maximum concurrent tasks
  rateLimit: {
    msTimeRange: 1000, // Limit requests to one per second
    maxExecution: 5, // Allow a maximum of 5 requests within the time range
  },
};

// Create an instance of AsyncBatch with API fetch as the async action
const asyncBatch = AsyncBatch.create(
  tokenIds,
  async (tokenId) => {
    const contractAddress = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D';
    const apiKey = 'YOUR_ETHERSCAN_API_KEY'; // Replace with your Etherscan API key
    
    // Construct the Etherscan API URL to retrieve owner addresses for a specific token ID
    const apiUrl = `https://api.etherscan.io/api?module=token&action=tokeninfo&contractaddress=${contractAddress}&tokenid=${tokenId}&apikey=${apiKey}`;
    
    try {
      const response = await fetch(apiUrl);
      if (response.ok) {
        const jsonData = await response.json();
        // Extract owner addresses from the response
        const ownerAddresses = jsonData.result.TokenAddress;
        return ownerAddresses; // Return the owner addresses
      } else {
        throw new Error(`Failed to fetch owner addresses for token ID ${tokenId}`);
      }
    } catch (error) {
      throw error; // Propagate the error
    }
  },
  options
);

// Start processing the token IDs to retrieve owner addresses
asyncBatch.start();

// Handle processing events and errors using the event emitter provided by AsyncBatch
asyncBatch.events.onProcessingEnd(({ data, response, error }) => {
  console.log(`Owner addresses for token ID ${data}:`, response);
});

asyncBatch.events.onProcessingError(({ error }) => {
  console.log('Error during processing:', error);
});

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
The AsyncBatch library provides a sophisticated event handling mechanism, allowing you to listen to a variety of events that occur during the batch processing. Each event provides specific information relevant to the stage of processing it represents. Here's how you can use these events:

#### Batch Start and Pause Events

> These events notify you when the batch processing starts and when it's paused. They can be used to perform any actions that need to be taken when the batch processing starts or pauses.

```ts
asyncBatch.events.onStarted(() => {
  console.log("Batch processing started");
});

asyncBatch.events.onPaused(() => {
  console.log("Batch processing paused");
});
```


#### Processing Events
##### Processing Start Event

> This event is triggered when the processing of an item starts. The event parameter provides details about the ongoing process.
```ts
asyncBatch.events.onProcessingStart((event) => {
  console.log("Processing started for data:", event.data);
});
```


##### Processing Success Event
> This event is triggered when the processing of an item succeeds or fails. The event parameter provides details about the ongoing process.
```ts
asyncBatch.events.onProcessingSuccess(({ data, response }) => {
  console.log("Processing succeeded for data:", data);
  console.log("Succes response:", response);
});
```


##### Processing End Event
> This event is triggered when the processing of an item ends, providing the data, response, and any error that occurred.
```ts
asyncBatch.events.onProcessingEnd(({ data, response, error }) => {
if(error) {
    console.log("Processing failed for data:", data);
    console.log("Error:", error);
} else {
    console.log("Processing succeeded for data:", data);
    console.log("Succes response:", response);
});
```

##### Processing Error Event

> This event is triggered when error is occured.
```ts
asyncBatch.events.onProcessingError(({ error }) => {
  console.log("Error during processing:", error);
});
```



#### Waiting for New Data
The onWaitingNewDatas event is triggered when the batch processing reaches a point where it has processed all the available data and is waiting for new data to continue. In this specific example, it fetches paginated user data from a database and adds it to the batch for further processing. If the maximum page limit (maxPage) is reached, the batch processing is stopped, ensuring that only a specified amount of data is processed from the database.

```ts

function getPaginatedUsersFromDatabase(page: number): Promise<number[]> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(Array.from({ length: 10 }, (_, i) => i + page * 10));
        }, 1000);
    });
}

let currentPage = 0;
let maxPage = 10;
asyncBatch.events.onWaitingNewDatas(async() => {
    console.log("waiting new datas");

    // Stop the batch if we have reached the max page
    if(currentPage >= maxPage) return;

    const usersId = await getPaginatedUsersFromDatabase(currentPage);
    currentPage++;

    asyncBatch.addMany(usersId);
});
```
This event is triggered when the batch is waiting for new data, and it demonstrates how to add more data dynamically to the batch.

## Code Samples

To demonstrate the practical applications and versatility of the AsyncBatch library, we have provided several example files. These examples cover different scenarios and usage patterns, helping you to understand how to integrate AsyncBatch into your projects effectively.

### Basic Example (`basic.ts`)

This example demonstrates the basic usage of AsyncBatch. It shows how to create an AsyncBatch instance, define an asynchronous action function, and start the processing of data items.

[View the Basic Example](/src/examples/basic.ts)

### Generators Example (`generators.ts`)

This example illustrates how AsyncBatch can be used with generators. Generators are an excellent way to process large amounts of data without loading everything into memory. 

In this example, a generator function is used to produce data, and the AsyncBatch processes each item with a simple action. The example demonstrates adding new data dynamically and listening to various processing events, providing insight into handling large datasets efficiently.

[View the Generators Example](/src/examples/generators.ts)

### Pagination Example (`pagination.ts`)

This example shows how to use AsyncBatch for pagination. It simulates fetching paginated user data from a database and adding it to the batch for processing. 

In this scenario, AsyncBatch starts with an empty data set and awaits new data through the `onWaitingNewDatas` event. As each page of data is retrieved and processed, new pages are fetched and added until the maximum page limit is reached. This approach is particularly useful when dealing with large data sets that cannot be loaded into memory all at once.

[View the Pagination Example](/src/examples/pagination.ts)

These examples are just a starting point to explore the capabilities of AsyncBatch. They demonstrate the library's flexibility in handling various types of data sources and processing requirements. Feel free to dive into these examples for a deeper understanding of how AsyncBatch can be integrated into your specific use case.

## Contributing

Contributions are welcome! Please see the [contributing guide](CONTRIBUTING.md) for more details.

## License

This project is licensed under the terms of the [MIT license](LICENSE).

## Initied by

This library was initied by [Smartchain](https://www.smart-chain.fr/).



