import EEvents from "./EEvents";
import EventBasic from "./EventBasic";

/**
 * @description Event object
 */
export default class EventProcessingError<TCtx = unknown, TData = unknown> extends EventBasic<TCtx> {
	public constructor(ctx: TCtx, public readonly data: TData, public readonly error: Error | string) {
		super(ctx, EEvents.PROCESSING_ERROR);
	}
}
