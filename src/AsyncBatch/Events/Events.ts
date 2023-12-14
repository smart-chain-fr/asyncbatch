import EEvents from "./EEvents";
import Emitter from "./Emitter";
import EventBasic from "./EventBasic";
import EventProcessingEnd from "./EventProcessingEnd";
import EventProcessingError from "./EventProcessingError";
import EventProcessingStart from "./EventProcessingStart";
import EventProcessingSuccess from "./EventProcessingSuccess";

/**
 * @description Call it to remove the listener
 */
type TRemoveEvent = () => void;

/**
 * @description Events of AsyncBatch
 * All that events are automatically garbage collected
 */
export default class Events<TCtx, TData, TRes = unknown> {
	public static readonly EventsEnum = EEvents;
	public readonly EventsEnum = EEvents;
	public readonly emitter = new Emitter();
	public constructor() {}

	/**
	 * @description Triggered for each processing is started
	 * @returns (optionnal) remove listener function
	 */
	public onProcessingStart(listener: (event: EventProcessingStart<TCtx, TData>) => unknown): TRemoveEvent {
		return this.on(EEvents.PROCESSING_START, listener);
	}

	/**
	 * @description As onProcessingStart but uses a promise like syntax
	 */
	public async onProcessingStartPromise() {
		return new Promise<EventProcessingStart<TCtx, TData>>((resolve) => {
			const remove = this.onProcessingStart((event) => {
				resolve(event);
				remove();
			});
		});
	}

	/**
	 * @description Triggered for each processing is ended
	 * @returns (optionnal) remove listener function
	 */
	public onProcessingEnd(listener: (event: EventProcessingEnd<TCtx, TData, TRes>) => unknown): TRemoveEvent {
		return this.on(EEvents.PROCESSING_END, listener);
	}

	/**
	 * @description As onProcessingEnd but uses a promise like syntax
	 */
	public async onProcessingEndPromise() {
		return new Promise<EventProcessingEnd<TCtx, TData, TRes>>((resolve) => {
			const remove = this.onProcessingEnd((event) => {
				resolve(event);
				remove();
			});
		});
	}

	/**
	 * @description Triggered for each processing is ended with success
	 * @returns (optionnal) remove listener function
	 */
	public onProcessingSuccess(listener: (event: EventProcessingSuccess<TCtx, TData, TRes>) => unknown): TRemoveEvent {
		return this.on(EEvents.PROCESSING_SUCCESS, listener);
	}

	/**
	 * @description As onProcessingSuccess but uses a promise like syntax
	 */
	public async onProcessingSuccessPromise() {
		return new Promise<EventProcessingSuccess<TCtx, TData, TRes>>((resolve) => {
			const remove = this.onProcessingSuccess((event) => {
				resolve(event);
				remove();
			});
		});
	}

	/**
	 * @description Triggered for each processing is ended with error or rejected
	 * @returns (optionnal) remove listener function
	 */
	public onProcessingError(listener: (event: EventProcessingError<TCtx, TData>) => unknown): TRemoveEvent {
		return this.on(EEvents.PROCESSING_ERROR, listener);
	}

	/**
	 * @description As onProcessingError but uses a promise like syntax
	 */
	public async onProcessingErrorPromise() {
		return new Promise<EventProcessingError<TCtx, TData>>((resolve) => {
			const remove = this.onProcessingError((event) => {
				resolve(event);
				remove();
			});
		});
	}

	/**
	 * @description Triggered before the AsyncBatch is cleared
	 * @returns (optionnal) remove listener function
	 */
	public beforeCleare(listener: (event: EventBasic<TCtx>) => unknown): TRemoveEvent {
		return this.on(EEvents.BEFORE_CLEARE, listener);
	}

	/**
	 * @description As beforeCleare but uses a promise like syntax
	 */
	public async beforeClearePromise() {
		return new Promise<EventBasic<TCtx>>((resolve) => {
			const remove = this.beforeCleare((event) => {
				resolve(event);
				remove();
			});
		});
	}

	/**
	 * @description Triggered when the AsyncBatch is cleared
	 * @returns (optionnal) remove listener function
	 */
	public onCleared(listener: (event: EventBasic<TCtx>) => unknown): TRemoveEvent {
		return this.on(EEvents.CLEARED, listener);
	}

	/**
	 * @description As onCleared but uses a promise like syntax
	 */
	public async onClearedPromise() {
		return new Promise<EventBasic<TCtx>>((resolve) => {
			const remove = this.onCleared((event) => {
				resolve(event);
				remove();
			});
		});
	}

	/**
	 * @description Triggered when the AsyncBatch is started
	 * @returns (optionnal) remove listener function
	 */
	public onStarted(listener: (event: EventBasic<TCtx>) => unknown): TRemoveEvent {
		return this.on(EEvents.START, listener);
	}

	/**
	 * @description As onStarted but uses a promise like syntax
	 */
	public async onStartedPromise() {
		return new Promise<EventBasic<TCtx>>((resolve) => {
			const remove = this.onStarted((event) => {
				resolve(event);
				remove();
			});
		});
	}

	/**
	 * @description Triggered when the AsyncBatch is paused
	 * @returns (optionnal) remove listener function
	 */
	public onPaused(listener: (event: EventBasic<TCtx>) => unknown): TRemoveEvent {
		return this.on(EEvents.PAUSE, listener);
	}

	/**
	 * @description As onPaused but uses a promise like syntax
	 */
	public async onPausedPromise() {
		return new Promise<EventBasic<TCtx>>((resolve) => {
			const remove = this.onPaused((event) => {
				resolve(event);
				remove();
			});
		});
	}

	/**
	 * @description Triggered when the queue is empty and the AsyncBatch is waiting for new datas, this give you the opportunity to add a new set of datas (like pagination for example)
	 * @returns (optionnal) remove listener function
	 */
	public onWaitingNewDatas(listener: (event: EventBasic<TCtx>) => unknown): TRemoveEvent {
		return this.on(EEvents.WAITING_NEW_DATAS, listener);
	}

	/**
	 * @description Triggered when the queue is empty and the AsyncBatch is waiting for new datas, this give you the opportunity to add a new set of datas (like pagination for example)
	 * @alias onWaitingNewDatas
	 * @returns (optionnal) remove listener function
	 */
	public onEmpty(listener: (event: EventBasic<TCtx>) => unknown): TRemoveEvent {
		return this.onWaitingNewDatas(listener);
	}

	/**
	 * @description As onEmpty but uses a promise like syntax
	 */
	public async onEmptyPromise() {
		return new Promise<EventBasic<TCtx>>((resolve) => {
			const remove = this.onEmpty((event) => {
				resolve(event);
				remove();
			});
		});
	}

	/**
	 * @description generic method to add a listener
	 * @returns a function to remove the listener
	 */
	public on<TEvt>(eventName: EEvents, listener: (event: TEvt) => unknown): TRemoveEvent {
		this.emitter.on(eventName, listener);
		return () => {
			this.emitter.off(eventName, listener);
		};
	}

	public emit(eventName: EEvents, data: EventBasic<TCtx>): void {
		this.emitter.emit(eventName, data);
	}

	/**
	 * @description Remove all listeners
	 */
	public removeAllListeners() {
		this.emitter.removeAllListeners();
	}

	/**
	 * @description Remove a listener
	 */
	public removeEventListener<TEvt>(eventName: EEvents, listener: (event: TEvt) => unknown) {
		this.emitter.off(eventName, listener);
	}
}
