import EEvents from "./EEvents";
import Emitter from "./Emitter";
import EventObject from "./EventObject";

/**
 * @description Call it to remove the listener
 */
type TRemoveEvent = () => void;

/**
 * @description Events of AsyncBatch
 */
export default class Events<TCtx, TData, TRes = unknown> {
	public static EventsEnum = EEvents;
	public EventsEnum = EEvents;
	public constructor(public emitter: Emitter) {}
	public onProcessingStart(listener: (event: EventObject<TCtx, TData, TRes>) => unknown): TRemoveEvent {
		return this.on(EEvents.PROCESSING_STARTED, listener);
	}

	// @TODO: change data type of some events to add more informations
	public onProcessingEnd(listener: (event: EventObject<TCtx, TData, TRes>) => unknown): TRemoveEvent {
		return this.on(EEvents.PROCESSING_ENDED, listener);
	}

	/**
	 * @description Triggered when the action is succeeds
	 */
	public onProcessingSuccess(listener: (event: EventObject<TCtx, TData, TRes>) => unknown): TRemoveEvent {
		return this.on(EEvents.PROCESSING_SUCCESSED, listener);
	}

	/**
	 * @description Triggered when an error is thrown in the action
	 */
	public onProcessingError(listener: (event: EventObject<TCtx, TData, TRes>) => unknown): TRemoveEvent {
		return this.on(EEvents.PROCESSING_ERRORED, listener);
	}

	/**
	 * @description Triggered when the AsyncBatch will cleared
	 */
	public willCleared(listener: (event: EventObject<TCtx>) => unknown): TRemoveEvent {
		return this.on(EEvents.WILL_CLEARED, listener);
	}

	/**
	 * @description Triggered when the AsyncBatch is cleared
	 */
	public onCleared(listener: (event: EventObject<TCtx>) => unknown): TRemoveEvent {
		return this.on(EEvents.CLEARED, listener);
	}

	/**
	 * @description Triggered when the AsyncBatch is started
	 */
	public onStarted(listener: (event: EventObject<TCtx>) => unknown): TRemoveEvent {
		return this.on(EEvents.STARTED, listener);
	}

	/**
	 * @description Triggered when the AsyncBatch is paused
	 */
	public onPaused(listener: (event: EventObject<TCtx>) => unknown): TRemoveEvent {
		return this.on(EEvents.PAUSED, listener);
	}

	/**
	 * @description Triggered when the queue is empty and the AsyncBatch is waiting for new datas
	 */
	public onWaitingNewDatas(listener: (event: EventObject<TCtx>) => unknown): TRemoveEvent {
		return this.on(EEvents.WAITING_NEW_DATAS, listener);
	}

	/**
	 * @alias onWaitingNewDatas
	 */
	public onEmpty(listener: (event: EventObject<TCtx>) => unknown): TRemoveEvent {
		return this.onWaitingNewDatas(listener);
	}

	public on<TEvt>(eventName: EEvents, listener: (event: TEvt) => unknown): TRemoveEvent {
		this.emitter.on(eventName, listener);
		return () => {
			this.emitter.off(eventName, listener);
		};
	}

	public removeAllListeners() {
		this.emitter.removeAllListeners();
	}
}
