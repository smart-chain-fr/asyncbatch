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
	 * @description Configure the Rate Limit in a Specified Time Range
	 * @default null
	 */
	rateLimit: {
		/**
		 * The number of maximum executions in the specified time range, Zero will disable the rate limit
		 */
		msTimeRange: number;
		/**
		 * The time range in milliseconds, Zero will disable the rate limit
		 */
		maxExecution: number;

		/**
		 * If true, the rate limit will be calculated until the end of the each execution instead of the start only
		 * Not implemented yet
		 * @default false
		 */
		//untilEnd?: boolean;
	} | null;
};

export default ICreateOptions;
