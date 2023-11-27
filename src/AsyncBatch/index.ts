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

/**
 * @todo Add timeout by action, or maybe by batch
 * @example /src/examples/basic.ts
 */
export default class AsyncBatch<TDataType, TResponseType> {
	private _isStarted = false;
	private _isWaitingNewDatas = false;
	private currentConcurrency: number = 0;
	private waitingDatasDeferred = this.createDeferred();
	private startDeferred = this.createDeferred();
	private filter: ((data: TDataType) => boolean) | ((data: TDataType) => Promise<boolean>) | null = null;

	private readonly queue: TDataType[] = [];
	private readonly options: ICreateOptions;
	private readonly emitter = new Emitter();
	private readonly _events: Events<AsyncBatch<TDataType, TResponseType>, TDataType, Awaited<TResponseType>>;

	private constructor(private action: (data: TDataType) => TResponseType, options: Partial<ICreateOptions>) {
		this._events = new Events<AsyncBatch<TDataType, TResponseType>, TDataType, Awaited<TResponseType>>(this.emitter);
		this.options = {
			autoStart: options.autoStart ?? false,
			maxConcurrency: options.maxConcurrency ?? 4,
			rateLimit: options.rateLimit ?? null,
		};

		this._isStarted = this.options.autoStart;
	}

	public static create<TDataType, TResponseType>(
		datas: TDataType[],
		action: (data: TDataType) => TResponseType,
		options: Partial<ICreateOptions> = {},
	): AsyncBatch<TDataType, TResponseType> {
		const asyncBatch = new this(action, options).addMany([...datas]);
		setImmediate(() => asyncBatch.handleQueue());
		return asyncBatch;
	}

	public add = (() => {
		let clearImmediateId: ReturnType<typeof setImmediate>;
		return (...data: TDataType[]): AsyncBatch<TDataType, TResponseType> => {
			this.queue.push(...data);

			if (this.isWaitingNewDatas) {
				clearImmediate(clearImmediateId);
				clearImmediateId = setImmediate(() => this.waitingDatasDeferred.resolve(undefined));
			}
			return this;
		};
	})();

	public addMany(datas: TDataType[]): AsyncBatch<TDataType, TResponseType> {
		this.add(...datas);
		return this;
	}

	public updateAction(action: NonNullable<typeof this.action>): AsyncBatch<TDataType, TResponseType> {
		this.action = action;
		return this;
	}

	public get events(): Events<AsyncBatch<TDataType, TResponseType>, TDataType, Awaited<TResponseType>> {
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

	public start(): AsyncBatch<TDataType, TResponseType> {
		if (this._isStarted) return this;
		this._isStarted = true;
		setImmediate(() => this.startDeferred.resolve(undefined));
		return this;
	}

	/**
	 * @alias !start
	 */
	public requestPause(): AsyncBatch<TDataType, TResponseType> {
		if (!this._isStarted) return this;
		this._isStarted = false;
		return this;
	}

	/**
	 * @alias pause
	 */
	public stop(): AsyncBatch<TDataType, TResponseType> {
		return this.requestPause();
	}

	public getCurrentConcurrency(): number {
		return this.currentConcurrency;
	}

	public updateMaxConcurrency(maxConcurrency: number): AsyncBatch<TDataType, TResponseType> {
		this.options.maxConcurrency = maxConcurrency;
		return this;
	}

	public setFilter(filter: typeof this.filter): AsyncBatch<TDataType, TResponseType> {
		this.filter = filter;
		return this;
	}

	public clear(): AsyncBatch<TDataType, TResponseType> {
		const eventBeforeCleare = new EventBeforeCleare(this);
		this.emit(eventBeforeCleare);

		if (eventBeforeCleare.preventedAction === true) return this;

		this.queue.splice(0);

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
		 * @description terminate each loop step to let the next one start
		 */
		const endLoopStep = (data: TDataType, responseStored?: TResponseType, errorStored?: string | Error) => {
			this.currentConcurrency--;
			this.emit(new EventProcessingEnd(this, data, responseStored, errorStored));
			deferredQueue.resolve(undefined);
			deferredQueue = this.createDeferred();
			this.mayEmitWaitingDatas(this.currentConcurrency);
		};

		/**
		 * @description Loop on the queue and call the action on each data
		 */
		const loopOnConcurrency = async (): Promise<void> => {
			const data = this.queue.shift() as TDataType;

			if (!(await this.shouldPreserveData(data))) return endLoopStep(data);
			if (!this.emitProcessStarted(data)) return endLoopStep(data);

			try {
				const responseStored = await this.callAction(data);
				const eventObject = new EventProcessingSuccess(this, data, responseStored);

				this.emit(eventObject);
				endLoopStep(data, responseStored);
				return;
			} catch (error) {
				const errorStored = error as string | Error;
				const eventObject = new EventProcessingError(this, data, errorStored);

				this.emit(eventObject);
				endLoopStep(data, undefined, errorStored);
				return;
			}
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
			let isMaxCalls = callNumber >= (this.options.rateLimit?.maxExecution ?? 0);
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
		const eventPausedObject = new EventPaused(this);
		if (!isAlreadyPaused) this.emit(eventPausedObject);
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
		this.emit(new EventWaitNewDatas(this));
		return true;
	}

	/**
	 * @description Handle the waiting of new datas
	 */
	private async forWaitingNewDatas(currentConcurrency: number): Promise<boolean> {
		if (this.queue.length === 0) {
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
