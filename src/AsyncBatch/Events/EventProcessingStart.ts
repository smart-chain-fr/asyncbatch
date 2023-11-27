import EEvents from "./EEvents";
import EventBasicPreventAction from "./EventBasicPreventAction";

/**
 * @description Event object
 */
export default class EventProcessingStart<TCtx = unknown, TData = unknown> extends EventBasicPreventAction<TCtx> {
	public constructor(ctx: TCtx, public readonly data: TData) {
		super(ctx, EEvents.PROCESSING_START);
	}
}
