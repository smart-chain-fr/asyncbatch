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

//type EventObjectSuccess<TCtx, TData, TRes> = Omit<EventObject<TCtx, TData, TRes>, "error">;

/**
 * @description Events of AsyncBatch
 */
export default class Events<TCtx, TData, TRes = unknown> {
	public static EventsEnum = EEvents;
	public EventsEnum = EEvents;
	public constructor(public emitter: Emitter) {}
	public onProcessingStart(listener: (event: EventProcessingStart<TCtx, TData>) => unknown): TRemoveEvent {
		return this.on(EEvents.PROCESSING_START, listener);
	}

	// @TODO: change data type of some events to add more informations
	public onProcessingEnd(listener: (event: EventProcessingEnd<TCtx, TData, TRes>) => unknown): TRemoveEvent {
		return this.on(EEvents.PROCESSING_END, listener);
	}

	/**
	 * @description Triggered when the action is succeeds
	 */
	public onProcessingSuccess(listener: (event: EventProcessingSuccess<TCtx, TData, TRes>) => unknown): TRemoveEvent {
		return this.on(EEvents.PROCESSING_SUCCESS, listener);
	}

	/**
	 * @description Triggered when an error is thrown in the action
	 */
	public onProcessingError(listener: (event: EventProcessingError<TCtx, TData>) => unknown): TRemoveEvent {
		return this.on(EEvents.PROCESSING_ERROR, listener);
	}

	/**
	 * @description Triggered when the AsyncBatch will cleared
	 */
	public beforeCleare(listener: (event: EventBasic<TCtx>) => unknown): TRemoveEvent {
		return this.on(EEvents.BEFORE_CLEARE, listener);
	}

	/**
	 * @description Triggered when the AsyncBatch is cleared
	 */
	public onCleared(listener: (event: EventBasic<TCtx>) => unknown): TRemoveEvent {
		return this.on(EEvents.CLEARED, listener);
	}

	/**
	 * @description Triggered when the AsyncBatch is started
	 */
	public onStarted(listener: (event: EventBasic<TCtx>) => unknown): TRemoveEvent {
		return this.on(EEvents.START, listener);
	}

	/**
	 * @description Triggered when the AsyncBatch is paused
	 */
	public onPaused(listener: (event: EventBasic<TCtx>) => unknown): TRemoveEvent {
		return this.on(EEvents.PAUSE, listener);
	}

	/**
	 * @description Triggered when the queue is empty and the AsyncBatch is waiting for new datas
	 */
	public onWaitingNewDatas(listener: (event: EventBasic<TCtx>) => unknown): TRemoveEvent {
		return this.on(EEvents.WAITING_NEW_DATAS, listener);
	}

	/**
	 * @alias onWaitingNewDatas
	 */
	public onEmpty(listener: (event: EventBasic<TCtx>) => unknown): TRemoveEvent {
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

	public removeEventListener<TEvt>(eventName: EEvents, listener: (event: TEvt) => unknown) {
		this.emitter.off(eventName, listener);
	}
}
