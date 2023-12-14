import timeoutPromise from "./timeoutPromise";

/**
 * Give ability to limit the number of execution in a time range using a sliding window algorithm
 */
export default class RateLimiter {
	private readonly window: Date[] = [];

	private constructor(private readonly maxShot: number, private readonly msTimeRange: number) {}

	/**
	 * @description Create a new RateLimiter
	 */
	public static new(maxShot: number, msTimeRange: number) {
		return new this(maxShot, msTimeRange);
	}

	/**
	 * Wait until the time range is reached
	 */
	public async wait(): Promise<void> {
		// If the maxShot or the msTimeRange is not defined or === 0, we don't want to run this method
		if (!this.canRun()) return;
		const newDate = new Date();

		// We don't want to keep all the shots, we remove all the shots that are older than the time range
		this.cleanShots(newDate);

		// We wait until the time range is reached
		await this.waitUntilTime();
	}

	/**
	 * Register a new shot (Request) in window
	 * @throws {Error} If the number of shots is greater than the maxShot
	 */
	public shot() {
		if (!this.canRun()) return;

		this.cleanShots(new Date());

		if (this.window.length >= this.maxShot)
			throw new Error("RateLimiter: Too many shots, you should call wait() before adding a new shot");

		this.window.push(new Date());
	}

	/**
	 * Wait until the time range is reached
	 */
	private async waitUntilTime(): Promise<void> {
		while (true) {
			/**
			 * If the number of shots is lower than the maxShot, we break the loop because everything is ok
			 */
			if (this.window.length < this.maxShot) break;

			const firstShotDate = this.window[0]!;
			const lastShotDate = this.window[this.window.length - 1]!;

			/**
			 * We calculate the diff between the first shot and the last shot
			 */
			const diffDate = lastShotDate.getTime() - firstShotDate.getTime();

			if (diffDate >= this.msTimeRange) break;

			/**
			 * We wait the difference between the time range and the diff
			 */
			await timeoutPromise((this.msTimeRange - diffDate) + 0.5);

			this.cleanShots(new Date());
			continue;
		}
	}

	/**
	 * Remove all the shots whose date is older than the time range
	 */
	private cleanShots(newDate: Date): void {
		while (this.window[0] && newDate.getTime() - this.window[0].getTime() >= this.msTimeRange) {
			this.window.shift();
		}
	}

	/**
	 * To avoid useless processing, we check that maxExecution and msTimeRange are defined or !== 0
	 */
	private canRun() {
		return this.maxShot && this.msTimeRange;
	}
}
