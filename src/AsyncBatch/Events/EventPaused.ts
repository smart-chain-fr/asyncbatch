import EEvents from "./EEvents";
import EventBasic from "./EventBasic";

/**
 * @description Event object
 */
export default class EventPaused<TCtx = unknown> extends EventBasic<TCtx> {
	public constructor(ctx: TCtx) {
		super(ctx, EEvents.PAUSE);
	}
}
