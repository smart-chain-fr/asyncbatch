import ICreateOptions from "./ICreateOptions";
import EEvents from "./EEvents";
import Emitter from "./Emitter";
import Deferred from "promise-deferred";
/**
 * @example
 * const datas = [1, 2, 3];
 * const asyncBatch = AsyncBatch.create(datas, action, { maxConcurrency: 4, autoStart: false })
 * .start()
 * .add(4, 5, 6).add([7, 8])
 * .addMany([10, 11])
 * .updateAction(async (data)=>{ console.log(data);})
 * .filter((data)=> data > 1)
 * .onEachStarted((data, index, fromDatas) => {})
 * .onEachEnded((data, index, fromDatas) => {})
 * .onEachSuccessed((data, index, fromDatas) => {})
 * .onEachErrored((data, index, fromDatas, error) => {})
 * .updateMaxConcurrency(3)
 * .clear()
 * .onCleared(()=>{})
 * .onStarted(()=>{})
 * .onWaitingNewDatas(()=>{})
 * .on("EventName", () => {})
 * .destruct()
 * .onDestruct(() => {})
 *
 * setTimeout(() => asyncBatch.pause(), 3000); // Alias of stop
 * setTimeout(() => asyncBatch.stop(), 4000);
 */
export default class AsyncBatch<T> {
	private emitter = new Emitter();
	private _isStarted = false;
	private _isWaitingNewDatas = false;
	private waitingDatasDeferred = this.createDeferred();
	private startDeferred = this.createDeferred();
	private isStartedQueue: boolean = false;
	private queue: T[] = [];
	private options: ICreateOptions;
	private currentConcurrencyIndex: number = 0;
	private constructor(private action: (data: T) => unknown, options: Partial<ICreateOptions>) {
		this.options = {
			autoStart: options.autoStart ?? true,
			maxConcurrency: options.maxConcurrency ?? 2,
		};

		this._isStarted = this.options.autoStart;
	}

	public static create<T>(datas: T[], action: (data: T) => unknown, options: ICreateOptions): AsyncBatch<T> {
		const asyncBatch = new this(action, options);

		asyncBatch.addMany([...datas]);

		setImmediate(() => asyncBatch.handleQueue());
		return asyncBatch;
	}

	public add(...data: T[]): AsyncBatch<T> {
		this.queue.push(...data);
		return this;
	}

	public addMany(datas: T[]): AsyncBatch<T> {
		this.add(...datas);

		if(this.isWaitingNewDatas) this.waitingDatasDeferred.resolve(undefined);
		return this;
	}

	public filter(): AsyncBatch<T> {
		return this;
	}

	public updateAction(action: NonNullable<AsyncBatch<T>["action"]>): AsyncBatch<T> {
		this.action = action;
		return this;
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

	public start(): AsyncBatch<T> {
		if (this._isStarted) return this;
		this._isStarted = true;
		this.startDeferred.resolve(undefined);
		this.startDeferred = this.createDeferred();
		this.emit(EEvents.started, this);
		return this;
	}

	/**
	 * @alias !start
	 */
	public pause(): AsyncBatch<T> {
		if (!this._isStarted) return this;
		this._isStarted = false;
		return this;
	}

	/**
	 * @alias pause
	 */
	public stop(): AsyncBatch<T> {
		return this.pause();
	}

	public updateMaxConcurrency(maxConcurrency: number): AsyncBatch<T> {
		this.options.maxConcurrency = maxConcurrency;
		return this;
	}

	public clear(): AsyncBatch<T> {
		this.emit(EEvents.cleared, this);
		return this;
	}

	public destruct(): void {
		this.emit(EEvents.cleared, this);
		this.emitter.removeAllListeners();
	}

	public onEachStarted(listener: (event: { data: T }) => unknown): AsyncBatch<T> {
		this.emitter.on(EEvents.eachStarted, listener);
		return this;
	}

	// @TODO: change data type of some events to add more informations
	public onEachEnded(listener: (event: { data: T; result: unknown }) => unknown): AsyncBatch<T> {
		this.emitter.on(EEvents.eachEnded, listener);
		return this;
	}

	public onEachSuccessed(listener: (event: { data: T }) => unknown): AsyncBatch<T> {
		this.emitter.on(EEvents.eachSuccessed, listener);
		return this;
	}

	public onEachErrored(listener: (event: { data: T }) => unknown): AsyncBatch<T> {
		this.emitter.on(EEvents.eachErrored, listener);
		return this;
	}

	public onCleared(listener: (asyncBatch: AsyncBatch<T>) => unknown): AsyncBatch<T> {
		this.emitter.on(EEvents.cleared, listener);
		return this;
	}

	public onStarted(listener: (asyncBatch: AsyncBatch<T>) => unknown): AsyncBatch<T> {
		this.emitter.on(EEvents.started, listener);
		return this;
	}

	public onPaused(listener: (asyncBatch: AsyncBatch<T>) => unknown): AsyncBatch<T> {
		this.emitter.on(EEvents.paused, listener);
		return this;
	}

	public onWaitingNewDatas(listener: (asyncBatch: AsyncBatch<T>) => unknown): AsyncBatch<T> {
		this.emitter.on(EEvents.waitingNewDatas, listener);
		return this;
	}

	public onDestruct(listener: (asyncBatch: AsyncBatch<T>) => unknown): AsyncBatch<T> {
		this.on(EEvents.destruct, listener);
		return this;
	}

	public on(eventName: EEvents, listener: (data: AsyncBatch<T> | { data: T }) => unknown): AsyncBatch<T> {
		this.emitter.on(eventName, listener);
		return this;
	}

	private emit(eventName: EEvents, data: AsyncBatch<T> | { data: T; result?: unknown }): void {
		this.emitter.emit(eventName, data);
	}

	private async handleQueue(): Promise<void> {
		if (this.isStartedQueue) return;
		this.isStartedQueue = true;

		let queueDeferred = this.createDeferred();

		let isPreviouslyPaused = true;
		while (true) {
			if (this.isPaused) {
				this.emit(EEvents.paused, this);
				await this.startDeferred.promise;
				this.startDeferred = this.createDeferred();
				isPreviouslyPaused = true;
			}

			if (!this.queue.length) {
				this._isWaitingNewDatas = true;
				this.emit(EEvents.waitingNewDatas, this);
				await this.waitingDatasDeferred.promise;
				this.waitingDatasDeferred = this.createDeferred();
			}

			this._isWaitingNewDatas = false;

			/**
			 * Emit start only once after pause
			 */
			if (this.isStarted && isPreviouslyPaused) {
				isPreviouslyPaused = false;
				this.emit(EEvents.started, this);
			}

			const data = this.queue.shift() as T;
			this.emit(EEvents.eachStarted, { data });

			this.currentConcurrencyIndex++;

			const actionPromised = this.callAction(data);
			actionPromised.then((result) => {
				this.emit(EEvents.eachEnded, { data, result });
				if (this.currentConcurrencyIndex === this.options.maxConcurrency) {
					this.currentConcurrencyIndex--;
					queueDeferred.resolve(undefined);
					return;
				}
				this.currentConcurrencyIndex--;
			});

			if (this.currentConcurrencyIndex === this.options.maxConcurrency) {
				await queueDeferred.promise;
				queueDeferred = this.createDeferred();
			}
		}
	}

	private async callAction(data: T): Promise<unknown> {
		return await this.action(data);
	}

	private createDeferred(): Deferred.Deferred<undefined> {
		return new Deferred<undefined>();
	}
}
