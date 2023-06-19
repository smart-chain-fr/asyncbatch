import ICreateOptions from "./ICreateOptions";
import EEvents from "./EEvents";
import Deferred from "promise-deferred";
import Events, { TArgEvent } from "./Events";
import Emitter from "./Emitter";
/**
 * @example
 * const datas = [1, 2, 3];
 * const asyncBatch = AsyncBatch.create(datas, action, { maxConcurrency: 4, autoStart: false, autoDestruct: false })
 * .add(4, 5, 6).add([7, 8]).addMany([10, 11])
 * .updateAction(async (data)=>{ console.log(data);})
 * .filter((data)=> data > 1)
 * .updateMaxConcurrency(3)
 * .start().clear().destruct();
 *
 * const removeOnEachStarted = asyncBatch.onEachStarted((event) => {});
 * removeOnEachStarted();
 * asyncBatch.onEachEnded((event) => {});
 * asyncBatch.onEachSuccessed((event) => {});
 * asyncBatch.onEachErrored((event) => {});
 * asyncBatch.onCleared((event)=>{});
 * asyncBatch.onStarted((event)=>{});
 * asyncBatch.onWaitingNewDatas((event)=>{});
 * asyncBatch.on("EventName", (event) => {});
 * asyncBatch.onDestruct((event) => {});
 *
 * setTimeout(() => asyncBatch.pause(), 3000); // Alias of stop
 * setTimeout(() => asyncBatch.stop(), 4000);
 */
export default class AsyncBatch<T> {
	private _isDestructed = false;
	private _isStarted = false;
	private _isWaitingNewDatas = false;
	private waitingDatasDeferred = this.createDeferred();
	private startDeferred = this.createDeferred();
	private isStartedQueue: boolean = false;
	private currentConcurrency: number = 0;

	private readonly queue: T[] = [];
	private readonly options: ICreateOptions;
	private readonly emitter = new Emitter();
	private readonly _events: Events<AsyncBatch<T>, T>;

	private constructor(private action: (data: T) => unknown, options: Partial<ICreateOptions>) {
		this._events = new Events<AsyncBatch<T>, T>(this.emitter);
		this.options = {
			autoStart: options.autoStart ?? false,
			maxConcurrency: options.maxConcurrency ?? 4,
			autoDestruct: options.autoDestruct ?? true,
		};

		this._isStarted = this.options.autoStart;

		this.handleAutoDestruction();
	}

	public static create<T>(datas: T[], action: (data: T) => unknown, options: Partial<ICreateOptions>): AsyncBatch<T> {
		const asyncBatch = new this(action, options).addMany([...datas]);
		setImmediate(() => asyncBatch.handleQueue());
		return asyncBatch;
	}

	public add = (() => {
		let clearImmediateId: ReturnType<typeof setImmediate>;
		return (...data: T[]): AsyncBatch<T> => {
			this.queue.push(...data);

			if (this.isWaitingNewDatas) {
				clearImmediate(clearImmediateId);
				clearImmediateId = setImmediate(() => this.waitingDatasDeferred.resolve(undefined));
			}
			return this;
		};
	})();

	public addMany(datas: T[]): AsyncBatch<T> {
		this.add(...datas);
		return this;
	}

	public filter(): AsyncBatch<T> {
		return this;
	}

	public updateAction(action: NonNullable<AsyncBatch<T>["action"]>): AsyncBatch<T> {
		this.action = action;
		return this;
	}

	public get events(): Events<AsyncBatch<T>, T> {
		return this._events;
	}

	public get isPaused(): boolean {
		return !this._isStarted;
	}

	public get isStarted(): boolean {
		return this._isStarted;
	}

	public get isDestructed(): boolean {
		return this._isDestructed;
	}

	public get isWaitingNewDatas(): boolean {
		return this._isWaitingNewDatas;
	}

	public start(): AsyncBatch<T> {
		if (this._isStarted) return this;
		this._isStarted = true;
		this.startDeferred.resolve(undefined);
		this.startDeferred = this.createDeferred();
		this.emit(EEvents.started, {
			ctx: this,
		});
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
		this.queue.splice(0);
		this.emit(EEvents.cleared, {
			ctx: this,
		});
		return this;
	}

	public destruct(): void {
		if (this._isDestructed) return;
		this.emit(EEvents.willDestruct, {
			ctx: this,
		});

		this.stop();
		this.clear();
		this.events.removeAllListeners();
		this._isDestructed = true;
	}

	private emit(eventName: EEvents, data: TArgEvent<AsyncBatch<T> | T>): void {
		this.emitter.emit(eventName, data);
	}

	private async handleQueue(): Promise<void> {
		if (this.isStartedQueue) return;
		this.isStartedQueue = true;

		let queueDeferred = this.createDeferred();

		let isPreviouslyPaused = true;
		while (true) {
			if (this.isPaused) {
				this.emit(EEvents.paused, { ctx: this });
				await this.startDeferred.promise;
				this.startDeferred = this.createDeferred();
				isPreviouslyPaused = true;
			}

			if (!this.queue.length) {
				this._isWaitingNewDatas = true;
				if (!this.currentConcurrency) this.emit(EEvents.waitingNewDatas, { ctx: this });
				await this.waitingDatasDeferred.promise;
				this.waitingDatasDeferred = this.createDeferred();
			}

			this._isWaitingNewDatas = false;

			/**
			 * Emit start only once after pause
			 */
			if (this.isStarted && isPreviouslyPaused) {
				isPreviouslyPaused = false;
				this.emit(EEvents.started, { ctx: this });
			}

			const data = this.queue.shift() as T;
			this.emit(EEvents.eachStarted, { ctx: this, data });

			this.currentConcurrency++;

			const actionPromised = this.callAction(data);
			const evtResponse: TArgEvent<AsyncBatch<T> | T> = { ctx: this, data };

			actionPromised
				.then((response) => {
					this.emit(EEvents.eachSuccessed, { ...Object.assign(evtResponse, { response }) });
				})
				.catch((error) => {
					this.emit(EEvents.eachErrored, { ...Object.assign(evtResponse, { error }) });
				})
				.finally(() => {
					this.emit(EEvents.eachEnded, { ...evtResponse });
					if (this.currentConcurrency === this.options.maxConcurrency) {
						this.currentConcurrency--;
						queueDeferred.resolve(undefined);
						return;
					}
					this.currentConcurrency--;

					if (this._isWaitingNewDatas) {
						this.emit(EEvents.waitingNewDatas, { ctx: this });
					}
				});

			if (this.currentConcurrency === this.options.maxConcurrency) {
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

	private handleAutoDestruction() {
		this.events.onWaitingNewDatas(() => {
			if (this.options.autoDestruct) this.destruct();
		});
	}
}
