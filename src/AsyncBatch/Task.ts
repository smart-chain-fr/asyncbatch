import Queuer from "./Queuer";
import RateLimiter from "./RateLimiter";

type IActionProvider<TDataType, TResponseType> = () => (data: TDataType) => TResponseType;

type ItaskParams<TDataType, TResponseType> = {
	queue: Queuer<TDataType>;
	rateLimiter: RateLimiter;
	getAction: IActionProvider<TDataType, TResponseType>;
	onProcessStart: (id: number, payload: TDataType) => void;
	onProcessSuccess: (id: number, payload: TDataType, response: TResponseType) => void;
	onProcessError: (id: number, payload: TDataType, error: string | Error) => void;
	onTerminate: (id: number) => void;
	autoStart: boolean;
};

/**
 * Executes a task and manages its state.
 */
export default class Task<TDataType, TResponseType> {
	public terminated = false;
	private isAwake = false;
	private static idCounter: number = 0;
	public readonly id: number = ++Task.idCounter;
	private readonly rateLimiter: RateLimiter;

	public constructor(public readonly params: ItaskParams<TDataType, TResponseType>) {
		this.rateLimiter = params.rateLimiter;
		if (this.params.autoStart) this.wakeUp();
	}

	/**
	 * Consumes the queue and calls the action with the data.
	 * @returns A promise that resolves when the queue is empty.
	 */
	public async wakeUp() {
		// terminate() should be called somewhere here

		// If the task is already running, we don't want to run it again
		if (this.isAwake) return;

		this.isAwake = true;

		// We loop until the queue is empty
		while (true) {
			await this.shouldWait();

			const payload = await this.params.queue.pull().next();
			if (payload.done) break;

			await this.shouldWait();

			this.params.onProcessStart(this.id, payload.value);
			try {
				await this.rateLimiter.wait();
				this.rateLimiter.shot();

				const response = await this.params.getAction()(payload.value);

				await this.shouldWait();

				this.params.onProcessSuccess(this.id, payload.value, response);
			} catch (error) {
				this.params.onProcessError(this.id, payload.value, error as string | Error);
			}
		}

		this.isAwake = false;
		// Queue is ended
	}

	/**
	 * Will terminate the task after the current task is finished.
	 */
	public async terminate() {
		// Should add deferred termination
		this.terminated = true;
	}

	public async isTerminated() {
		// Should wait for deferred termination
		return this.terminated;
	}

	private async shouldWait() {
		// Should wait for deferred waiting
		return false;
	}
}
