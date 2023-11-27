import EEvents from "./EEvents";
import EventBasic from "./EventBasic";

/**
 * @description Event object
 */
export default class EventProcessingEnd<TCtx = unknown, TData = unknown, TRes = unknown> extends EventBasic<TCtx> {
	public constructor(
		ctx: TCtx,
		public readonly data: TData,
		public readonly response: TRes | undefined,
		public readonly error: Error | string | undefined) {
		super(ctx, EEvents.PROCESSING_END);
	}
}
