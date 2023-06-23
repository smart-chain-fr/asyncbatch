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
export default class Events<TCtx, TData> {
	public constructor(public emitter: Emitter) {}
	public onEachStarted(listener: (event: EventObject<TCtx, TData>) => unknown): TRemoveEvent {
		return this.on(EEvents.eachStarted, listener);
	}

	// @TODO: change data type of some events to add more informations
	public onEachEnded(listener: (event: EventObject<TCtx, TData>) => unknown): TRemoveEvent {
		return this.on(EEvents.eachEnded, listener);
	}

	/**
	 * @description Triggered when the action is succeeds
	 */
	public onEachSuccess(listener: (event: EventObject<TCtx, TData>) => unknown): TRemoveEvent {
		return this.on(EEvents.eachSuccessed, listener);
	}

	/**
	 * @description Triggered when an error is thrown in the action
	 */
	public onEachErrored(listener: (event: EventObject<TCtx, TData>) => unknown): TRemoveEvent {
		return this.on(EEvents.eachErrored, listener);
	}

	/**
	 * @description Triggered when the AsyncBatch will cleared
	 */
	public willCleared(listener: (event: EventObject<TCtx>) => unknown): TRemoveEvent {
		return this.on(EEvents.willCleared, listener);
	}

	/**
	 * @description Triggered when the AsyncBatch is cleared
	 */
	public onCleared(listener: (event: EventObject<TCtx>) => unknown): TRemoveEvent {
		return this.on(EEvents.cleared, listener);
	}

	/**
	 * @description Triggered when the AsyncBatch is started
	 */
	public onStarted(listener: (event: EventObject<TCtx>) => unknown): TRemoveEvent {
		return this.on(EEvents.started, listener);
	}

	/**
	 * @description Triggered when the AsyncBatch is paused
	 */
	public onPaused(listener: (event: EventObject<TCtx>) => unknown): TRemoveEvent {
		return this.on(EEvents.paused, listener);
	}

	/**
	 * @description Triggered when the queue is empty and the AsyncBatch is waiting for new datas
	 */
	public onWaitingNewDatas(listener: (event: EventObject<TCtx>) => unknown): TRemoveEvent {
		return this.on(EEvents.waitingNewDatas, listener);
	}

	/**
	 * @alias onWaitingNewDatas
	 */
	public onEmpty(listener: (event: EventObject<TCtx>) => unknown): TRemoveEvent {
		return this.onWaitingNewDatas(listener);
	}

	public willDestruct(listener: (event: EventObject<TCtx>) => unknown): TRemoveEvent {
		return this.on(EEvents.willDestruct, listener);
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
