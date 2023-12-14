//import Events from "./Events";
import ICreateOptions from "./ICreateOptions";
import Queuer from "./Queuer";
import RateLimiter from "./RateLimiter";
import Task from "./Task";

export default class TaskHandler<TDataType, TResponseType> {
	private readonly tasks: Task<TDataType, TResponseType>[] = [];
	//private readonly events = new Events<AsyncBatch<TDataType, TResponseType>, TDataType, Awaited<TResponseType>>();
	private taskUpdateQueued = Promise.resolve();
	private readonly rateLimiter: RateLimiter;
	/**
	 * Taskes runner
	 */
	private constructor(
		private taskLength: number,
		private readonly queue: Queuer<TDataType>,
		private action: (data: TDataType) => TResponseType,
		private readonly rateLimit: ICreateOptions["rateLimit"],
	) {
		this.rateLimiter = RateLimiter.new(this.rateLimit?.maxExecution ?? 0, this.rateLimit?.msTimeRange ?? 0);
	}

	/**
	 * Creates a new TaskHandler.
	 * @param taskLength The number of tasks to create.
	 * @param queue The queue to use.
	 * @param action The action to execute.
	 */
	public static async create<TDataType, TResponseType>(
		taskLength: number,
		queue: Queuer<TDataType>,
		action: (data: TDataType) => TResponseType,
		rateLimit: ICreateOptions["rateLimit"] = null,
	) {
		const taskHandler = new TaskHandler<TDataType, TResponseType>(taskLength, queue, action, rateLimit);
		await taskHandler.updateTasks(taskLength);
		return taskHandler;
	}

	/**
	 * Updates the action to execute
	 * @param action The new action to execute.
	 */
	public updateAction(action: (data: TDataType) => TResponseType) {
		this.action = action;
	}

	/**
	 * Updates the number of tasks to use.
	 * If we call this method while the previous call is still running, the new call will be queued.
	 * @param taskLength The new number of tasks.
	 */
	public async updateTasks(taskLength: number) {
		this.taskUpdateQueued = this.taskUpdateQueued.then(async () => {
			this.taskLength = taskLength;
			await Promise.all([this.createTasks(), this.cleanTasks()]);
			return Promise.resolve();
		});
	}

	private async createTasks() {
		for (let i = 0; i < this.taskLength; i++) {
			if (this.tasks[i]) continue;
			this.tasks.push(
				new Task({
					queue: this.queue,
					rateLimiter: this.rateLimiter,
					getAction: () => this.action,
					onProcessStart: this.processIsStart.bind(this),
					onProcessSuccess: this.processIsSuccess.bind(this),
					onProcessError: this.processIsError.bind(this),
					onTerminate: this.taskIsTerminated.bind(this),
					autoStart: true,
				}),
			);
		}
	}

	private async cleanTasks() {
		if (!this.shouldCleanTasks()) return;
		const terminated = [];
		for (let i = this.taskLength; i < this.tasks.length; i++) {
			terminated.push(this.tasks[i]!.terminate());
		}

		await Promise.all(terminated);
		/**
		 * We can remove the tasks that are not needed anymore,
		 * but if steel running, they will be terminated after the current task is finished.
		 */
		this.tasks.splice(this.taskLength);
	}

	/**
	 * Returns true if we should clean tasks.
	 */
	private shouldCleanTasks(): boolean {
		return this.tasks.length > this.taskLength;
	}

	private processIsStart(taskId: number, payload: TDataType) {
		// Should emit process start
		console.log("onProcessStart", taskId, payload);
	}

	private processIsSuccess(taskId: number, payload: TDataType, response: TResponseType) {
		// Should emit process end
		console.log("onProcessSuccess", taskId, payload, response);
	}

	private processIsError(taskId: number, payload: TDataType, error: string | Error) {
		// Should emit process error
		console.log("onProcessError", taskId, payload, error);
	}

	private taskIsTerminated(taskId: number) {
		// Should emit terminate
		console.log("onTerminate", taskId);
	}
}
