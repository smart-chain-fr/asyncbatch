import ICreateOptions from "./ICreateOptions";
import EEvents from "./EEvents";
import Deferred from "./PromiseDeferred";
import Events from "./Events";
import Emitter from "./Emitter";
import EventObject from "./EventObject";
import Countdown from "./Countdown";

/**
 * @todo Add timeout by action, or maybe by batch
 * @example /src/examples/basic.ts
 */
export default class AsyncBatch<T, R> {
	private _isStarted = false;
	private _isWaitingNewDatas = false;
	private currentConcurrency: number = 0;
	private waitingDatasDeferred = this.createDeferred();
	private startDeferred = this.createDeferred();
	private filter: ((data: T) => boolean) | ((data: T) => Promise<boolean>) | null = null;

	private readonly queue: T[] = [];
	private readonly options: ICreateOptions;
	private readonly emitter = new Emitter();
	private readonly _events: Events<AsyncBatch<T, R>, T, R>;

	private constructor(private action: (data: T) => R, options: Partial<ICreateOptions>) {
		this._events = new Events<AsyncBatch<T, R>, T, R>(this.emitter);
		this.options = {
			autoStart: options.autoStart ?? false,
			maxConcurrency: options.maxConcurrency ?? 4,
			rateLimit: options.rateLimit ?? null,
		};

		this._isStarted = this.options.autoStart;
	}

	public static create<T, R>(datas: T[], action: (data: T) => R, options: Partial<ICreateOptions> = {}): AsyncBatch<T, R> {
		const asyncBatch = new this(action, options).addMany([...datas]);
		setImmediate(() => asyncBatch.handleQueue());
		return asyncBatch;
	}

	public add = (() => {
		let clearImmediateId: ReturnType<typeof setImmediate>;
		return (...data: T[]): AsyncBatch<T, R> => {
			this.queue.push(...data);

			if (this.isWaitingNewDatas) {
				clearImmediate(clearImmediateId);
				clearImmediateId = setImmediate(() => this.waitingDatasDeferred.resolve(undefined));
			}
			return this;
		};
	})();

	public addMany(datas: T[]): AsyncBatch<T, R> {
		this.add(...datas);
		return this;
	}

	public updateAction(action: NonNullable<typeof this.action>): AsyncBatch<T, R> {
		this.action = action;
		return this;
	}

	public get events(): Events<AsyncBatch<T, R>, T, R> {
		return this._events;
	}

	public get isPaused(): boolean {
		return !this._isStarted;
	}

	public get isStarted(): boolean {
		return this._isStarted;
	}

	public get isWaitingNewDatas(): boolean {
		return this._isWaitingNewDatas;
	}

	public start(): AsyncBatch<T, R> {
		if (this._isStarted) return this;
		this._isStarted = true;
		setImmediate(() => this.startDeferred.resolve(undefined));
		return this;
	}

	/**
	 * @alias !start
	 */
	public requestPause(): AsyncBatch<T, R> {
		if (!this._isStarted) return this;
		this._isStarted = false;
		return this;
	}

	/**
	 * @alias pause
	 */
	public stop(): AsyncBatch<T, R> {
		return this.requestPause();
	}

	public getCurrentConcurrency(): number {
		return this.currentConcurrency;
	}

	public updateMaxConcurrency(maxConcurrency: number): AsyncBatch<T, R> {
		this.options.maxConcurrency = maxConcurrency;
		return this;
	}

	public setFilter(filter: typeof this.filter): AsyncBatch<T, R> {
		this.filter = filter;
		return this;
	}

	public clear(): AsyncBatch<T, R> {
		const eventWillCleared = new EventObject(this, EEvents.WILL_CLEARED, undefined, undefined, undefined, true);
		this.emit(EEvents.WILL_CLEARED, eventWillCleared);

		if (eventWillCleared.preventedAction === true) return this;

		this.queue.splice(0);

		const eventOnCleared = new EventObject(this, EEvents.CLEARED);
		this.emit(EEvents.CLEARED, eventOnCleared);
		return this;
	}

	private emit(eventName: EEvents, data: EventObject<AsyncBatch<T, R> | T, T | unknown, R | unknown>): void {
		this.emitter.emit(eventName, data);
	}

	private async handleQueue(): Promise<void> {
		let isPausedInit = true;
		let deferredQueue = this.createDeferred();
		let isAlreadyPaused = false;
		const countdown = Countdown.new(this.options.rateLimit?.msTimeRange ?? 0);
		let callNumber = 0;
		/**
		 * @description terminate each loop step to let the next one start
		 */
		const endLoopStep = (data: T, responseStored?: R, errorStored?: string | Error) => {
			this.currentConcurrency--;
			this.emit(EEvents.PROCESSING_ENDED, new EventObject(this, EEvents.PROCESSING_ENDED, data, responseStored, errorStored));
			deferredQueue.resolve(undefined);
			deferredQueue = this.createDeferred();
			this.mayEmitWaitingDatas(this.currentConcurrency);
		};

		/**
		 * @description Loop on the queue and call the action on each data
		 */
		const loopOnConcurrency = async (): Promise<void> => {
			const data = this.queue.shift() as T;

			let responseStored: R | undefined = undefined;
			let errorStored: string | Error | undefined = undefined;

			if (!(await this.shouldPreserveData(data))) return endLoopStep(data);
			if (!this.emitEachStarted(data)) return endLoopStep(data);

			let eventObject: EventObject<this, T, R>;

			try {
				responseStored = await this.callAction(data);
				eventObject = new EventObject(this, EEvents.PROCESSING_SUCCESSED, data, responseStored, errorStored);
			} catch (error) {
				errorStored = error as string | Error;
				eventObject = new EventObject(this, EEvents.PROCESSING_ERRORED, data, responseStored, errorStored);
			}

			this.emit(eventObject.type, eventObject);
			endLoopStep(data, responseStored, errorStored);
			return;
		};

		while (true) {
			let isPreviouslyPaused = await this.forPause(isAlreadyPaused, (willPause) => {
				isAlreadyPaused = willPause;
			});

			await this.forWaitingNewDatas(this.currentConcurrency);

			if (isPreviouslyPaused || isPausedInit) {
				isAlreadyPaused = false;
				this.mayEmitFirstStart();
				isPreviouslyPaused = false;
				isPausedInit = false;
			}

			countdown.start();
			this.currentConcurrency++;
			let isMaxCalls = callNumber >= (this.options.rateLimit?.maxCalls ?? 0);
			if (isMaxCalls && countdown.willWait()) {
				this.currentConcurrency--;
				await countdown.wait();
				countdown.reload();
				callNumber = 0;
				continue;
			}

			callNumber++;

			loopOnConcurrency();

			if (this.currentConcurrency === this.options.maxConcurrency) {
				await deferredQueue.promise;
				deferredQueue = this.createDeferred();
			}
		}
	}

	/**
	 * @description Handle the pause of the queue
	 */
	private async forPause(isAlreadyPaused: boolean, willPause: (willPause: boolean) => void): Promise<boolean> {
		if (!this.isPaused) return this.isPaused;
		const eventPausedObject = new EventObject(this, EEvents.PAUSED);
		if (!isAlreadyPaused) {
			this.emit(EEvents.PAUSED, eventPausedObject);
		}
		willPause(true);
		await this.startDeferred.promise;
		if (!isAlreadyPaused) {
			this.startDeferred = this.createDeferred();
		}
		return !this.isPaused;
	}

	/**
	 * @description Emit event when the queue is waiting for datas
	 */
	private mayEmitWaitingDatas(currentConcurrency: number): boolean {
		if (currentConcurrency !== 0 || !this._isWaitingNewDatas) return false;
		this.emit(EEvents.WAITING_NEW_DATAS, new EventObject(this, EEvents.WAITING_NEW_DATAS));
		return true;
	}

	/**
	 * @description Handle the waiting of new datas
	 */
	private async forWaitingNewDatas(currentConcurrency: number): Promise<boolean> {
		if (this.queue.length === 0) {
			this._isWaitingNewDatas = true;
			const eventWaitingNewDatasObject = new EventObject(this, EEvents.WAITING_NEW_DATAS);
			if (currentConcurrency === 0) this.emit(EEvents.WAITING_NEW_DATAS, eventWaitingNewDatasObject);
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
		const eventStartedObject = new EventObject(this, EEvents.STARTED);
		this.emit(EEvents.STARTED, eventStartedObject);
	}

	/**
	 * @description Emit event for each started data
	 */
	private emitEachStarted(data: T): boolean {
		const eachStartedObject = new EventObject(this, EEvents.PROCESSING_STARTED, data, undefined, undefined, true);
		this.emit(EEvents.PROCESSING_STARTED, eachStartedObject);
		return !eachStartedObject.preventedAction;
	}

	/**
	 * @description Call the action with the data
	 */
	private async callAction(data: T): Promise<R> {
		return await this.action(data);
	}

	/**
	 * @description Check if the data should be preserved when the filter is executed
	 */
	private async shouldPreserveData(data: T): Promise<boolean> {
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
