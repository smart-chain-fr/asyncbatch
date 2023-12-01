import ICreateOptions from "./ICreateOptions";
import Deferred from "./PromiseDeferred";
import Events from "./Events";
import Emitter from "./Events/Emitter";
import EventBasic from "./Events/EventBasic";
import Countdown from "./Countdown";
import EventProcessingEnd from "./Events/EventProcessingEnd";
import EventProcessingSuccess from "./Events/EventProcessingSuccess";
import EventProcessingError from "./Events/EventProcessingError";
import EventProcessingStart from "./Events/EventProcessingStart";
import EventWaitNewDatas from "./Events/EventWaitNewDatas";
import EventPaused from "./Events/EventPaused";
import EventCleared from "./Events/EventCleared";
import EventBeforeCleare from "./Events/EventBeforeCleare";
import EventStart from "./Events/EventStart";
import Queuer, { TQDataTypes } from "./Queuer";

/**
 * AsyncBatch is a Typescript library designed for performing batched asynchronous tasks while controlling concurrency, all without relying on external dependencies
 * @examples src/examples/basic.ts , src/examples/pagination.ts, src/examples/generators.ts
 */
export default class AsyncBatch<TDataType, TResponseType> {
	private _isStarted = false;
	private _isWaitingNewDatas = false;
	private currentConcurrency: number = 0;
	private waitingDatasDeferred = this.createDeferred();
	private startDeferred = this.createDeferred();
	private filter: ((data: TDataType) => boolean) | ((data: TDataType) => Promise<boolean>) | null = null;

	private readonly queue: Queuer<TDataType> = new Queuer<TDataType>();
	private readonly options: ICreateOptions;
	private readonly emitter = new Emitter();
	private readonly _events: Events<AsyncBatch<TDataType, TResponseType>, TDataType, Awaited<TResponseType>>;

	private constructor(private action: (data: TDataType) => TResponseType, options: Partial<ICreateOptions>) {
		this._events = new Events(this.emitter);
		this.options = {
			autoStart: options.autoStart ?? false,
			maxConcurrency: options.maxConcurrency ?? 4,
			rateLimit: options.rateLimit ?? null,
		};

		this._isStarted = this.options.autoStart;
	}

	/**
	 * @description Create method give you more control, you can listen to events or handle start, pause, stop, add, clear, etc...
	 */
	public static create<TDataType, TResponseType>(
		datas: TQDataTypes<TDataType>,
		action: (data: TDataType) => TResponseType,
		options: Partial<ICreateOptions> = {},
	): AsyncBatch<TDataType, TResponseType> {
		const asyncBatch = new this(action, options).addMany(datas);
		setImmediate(() => asyncBatch.handleQueue());
		return asyncBatch;
	}

	/**
	 * @description This is a lightwight version of create method
	 * @returns Promise<void> resolved when all jobs are done (empty queue)
	 */
	public static async run<TDataType, TResponseType>(
		datas: TQDataTypes<TDataType>,
		action: (data: TDataType) => TResponseType,
		options: Omit<Partial<ICreateOptions>, "autoStart"> = {},
	): Promise<void> {
		const asyncBatch = new this(action, { ...options, autoStart: true }).addMany(datas);
		setImmediate(() => asyncBatch.handleQueue());
		await asyncBatch.events.onEmptyPromise();
	}

	/**
	 * @description Add data to the queue any time
	 */
	public add(...datas: TDataType[]): AsyncBatch<TDataType, TResponseType> {
		return this.addMany(datas);
	}

	/**
	 * @description Add many datas to the queue any time
	 */
	public addMany(datas: TQDataTypes<TDataType>): AsyncBatch<TDataType, TResponseType> {
		this.queue.push(datas);
		this.unWaitNewDatas();
		return this;
	}

	/**
	 * @description Update the action any time
	 */
	public updateAction(action: NonNullable<typeof this.action>): AsyncBatch<TDataType, TResponseType> {
		this.action = action;
		return this;
	}

	/**
	 * @description Events accessor, Ability to listen to many events
	 */
	public get events(): Events<AsyncBatch<TDataType, TResponseType>, TDataType, Awaited<TResponseType>> {
		return this._events;
	}

	/**
	 * @returns boolean true if the queue is paused
	 */
	public get isPaused(): boolean {
		return !this._isStarted;
	}

	/**
	 * @returns boolean true if the queue is started
	 */
	public get isStarted(): boolean {
		return this._isStarted;
	}

	/**
	 * @returns boolean true if the queue is empty or is waiting for new datas
	 */
	public get isWaitingNewDatas(): boolean {
		return this._isWaitingNewDatas;
	}

	/**
	 * @description Start the queue if it's not started yet
	 */
	public start(): AsyncBatch<TDataType, TResponseType> {
		if (this._isStarted) return this;
		this._isStarted = true;
		setImmediate(() => this.startDeferred.resolve(undefined));
		return this;
	}

	/**
	 * @description Request to pause the queue, the queue will pause just after the current action is done
	 * @alias !start
	 */
	public requestPause(): AsyncBatch<TDataType, TResponseType> {
		if (!this._isStarted) return this;
		this._isStarted = false;
		return this;
	}

	/**
	 * @description Stop | Pause the queue, the queue will stop just after the current action is done
	 * @alias pause
	 */
	public stop(): AsyncBatch<TDataType, TResponseType> {
		return this.requestPause();
	}

	/**
	 * @returns The current concurrency index
	 */
	public getCurrentConcurrency(): number {
		return this.currentConcurrency;
	}

	/**
	 * @description Update the max concurrency any time. If you set a lower value than the previous, it will be applied as soon as possible
	 */
	public updateMaxConcurrency(maxConcurrency: number): AsyncBatch<TDataType, TResponseType> {
		this.options.maxConcurrency = maxConcurrency;
		return this;
	}

	/**
	 * @description Add a filter when you need to exclude some datas to be processed
	 */
	public setFilter(filter: typeof this.filter): AsyncBatch<TDataType, TResponseType> {
		this.filter = filter;
		return this;
	}

	/**
	 * @description Clear the queue
	 */
	public clear(): AsyncBatch<TDataType, TResponseType> {
		const eventBeforeCleare = new EventBeforeCleare(this);
		this.emit(eventBeforeCleare);

		if (eventBeforeCleare.preventedAction === true) return this;

		this.queue.clear();

		const eventOnCleared = new EventCleared(this);
		this.emit(eventOnCleared);
		return this;
	}

	private emit(data: EventBasic<AsyncBatch<TDataType, TResponseType> | TDataType>): void {
		this.emitter.emit(data.type, data);
	}

	private async handleQueue(): Promise<void> {
		let isPausedInit = true;
		let deferredQueue = this.createDeferred();
		let isAlreadyPaused = false;
		const countdown = Countdown.new(this.options.rateLimit?.msTimeRange ?? 0);
		let callNumber = 0;

		/**
		 * @description Terminate the process of the current data
		 */
		const processDataEnd = (data: TDataType, responseStored?: TResponseType, errorStored?: string | Error) => {
			this.updateConcurrency(-1);
			this.emit(new EventProcessingEnd(this, data, responseStored, errorStored));
			deferredQueue.resolve(undefined);
			deferredQueue = this.createDeferred();
			this.mayEmitWaitingDatas(this.currentConcurrency);
		};

		/**
		 * @description Process the data
		 */
		const processData = async (data: TDataType): Promise<{ data: TDataType; response?: Awaited<TResponseType>; error?: string | Error }> => {
			if (!(await this.shouldPreserveData(data))) return { data };
			if (!this.emitProcessStarted(data)) return { data };

			try {
				const response = await this.callAction(data);
				this.emit(new EventProcessingSuccess(this, data, response));
				return { data, response };
			} catch (e) {
				const error = e as string | Error;
				this.emit(new EventProcessingError(this, data, error));
				return { data, error };
			}
		};

		let storedValue: TDataType | null = null;
		/**
		 * @description Loop on the queue and call the action on each data
		 */
		while (true) {
			let isPreviouslyPaused = await this.forPause(isAlreadyPaused, (willPause) => {
				isAlreadyPaused = willPause;
			});

			if (!storedValue) storedValue = await this.extractDataWhenReady();

			if (isPreviouslyPaused || isPausedInit) {
				isAlreadyPaused = false;
				this.mayEmitFirstStart();
				isPreviouslyPaused = false;
				isPausedInit = false;
			}

			countdown.start();
			this.updateConcurrency(1);
			const isMaxCalls = callNumber >= (this.options.rateLimit?.maxExecution ?? 0);
			if (isMaxCalls && countdown.willWait()) {
				this.updateConcurrency(-1);
				await countdown.wait();
				countdown.reload();
				callNumber = 0;
				continue;
			}

			callNumber++;

			processData(storedValue).then(({ data, response, error }) => processDataEnd(data, response, error));

			storedValue = null;

			if (this.currentConcurrency === this.options.maxConcurrency) {
				await deferredQueue.promise;
				deferredQueue = this.createDeferred();
			}
		}
	}

	private updateConcurrency(value: 1 | -1): void {
		this.currentConcurrency += value;
	}

	/**
	 * @description Handle the pause of the queue
	 */
	private async forPause(isAlreadyPaused: boolean, willPause: (willPause: boolean) => void): Promise<boolean> {
		if (!this.isPaused) return this.isPaused;
		const eventPausedObject = new EventPaused(this);
		if (!isAlreadyPaused) this.emit(eventPausedObject);
		willPause(true);
		await this.startDeferred.promise;
		if (!isAlreadyPaused) {
			this.startDeferred = this.createDeferred();
		}
		return !this.isPaused;
	}

	private unWaitNewDatas = (() => {
		let clearImmediateId: ReturnType<typeof setImmediate>;
		return (): void => {
			if (!this.isWaitingNewDatas) return;
			clearImmediate(clearImmediateId);
			clearImmediateId = setImmediate(() => this.waitingDatasDeferred.resolve(undefined));
		};
	})();

	/**
	 * @description Emit event when the queue is waiting for datas
	 */
	private mayEmitWaitingDatas(currentConcurrency: number): boolean {
		if (currentConcurrency !== 0 || !this._isWaitingNewDatas) return false;
		this.emit(new EventWaitNewDatas(this));
		return true;
	}

	/**
	 * @description Handle the waiting of new datas
	 */
	private async mayWaitNewDatas(nextData: IteratorResult<TDataType, void>, currentConcurrency: number): Promise<boolean> {
		if (nextData.done) {
			this._isWaitingNewDatas = true;
			const eventWaitingNewDatasObject = new EventWaitNewDatas(this);
			if (currentConcurrency === 0) this.emit(eventWaitingNewDatasObject);
			await this.waitingDatasDeferred.promise;
			this.waitingDatasDeferred = this.createDeferred();
			return true;
		}

		this._isWaitingNewDatas = false;
		return false;
	}

	/**
	 * @description Emit start only once after pause
	 */
	private mayEmitFirstStart() {
		const eventStartedObject = new EventStart(this);
		this.emit(eventStartedObject);
	}

	private async extractDataWhenReady(): Promise<TDataType> {
		let nextData: IteratorResult<TDataType, void>;
		do {
			nextData = await this.queue.pull().next();
		} while (await this.mayWaitNewDatas(nextData, this.currentConcurrency));

		if (nextData.done) throw new Error("Queue should not be empty at this point");

		return nextData.value;
	}

	/**
	 * @description Emit event for each started data
	 */
	private emitProcessStarted(data: TDataType): boolean {
		const eachStartedObject = new EventProcessingStart(this, data);
		this.emit(eachStartedObject);
		return !eachStartedObject.preventedAction;
	}

	/**
	 * @description Call the action with the data
	 */
	private async callAction(data: TDataType): Promise<TResponseType> {
		return await this.action(data);
	}

	/**
	 * @description Check if the data should be preserved when the filter is executed
	 */
	private async shouldPreserveData(data: TDataType): Promise<boolean> {
		try {
			return (await this.filter?.(data)) ?? true;
		} catch (error) {
			return false;
		}
	}

	/**
	 * @description Create a deferred promise
	 */
	private createDeferred(): Deferred<undefined> {
		return new Deferred<undefined>();
	}
}
