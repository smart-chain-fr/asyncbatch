type ICreateOptions = {
	/**
	 * @description If true, the queue will be started when the first data is added
	 * @default false
	 */
	autoStart: boolean;

	/**
	 * @description The maximum number of concurrent executions
	 * @default 4
	 */
	maxConcurrency: number;

	/**
	 * @description If true, the instance will be destructed when the queue is empty
	 * @default true
	 */
	autoDestruct: boolean;
};

export default ICreateOptions;