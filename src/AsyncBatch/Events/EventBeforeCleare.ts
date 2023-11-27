import EEvents from "./EEvents";
import EventBasicPreventAction from "./EventBasicPreventAction";

/**
 * @description Event object
 */
export default class EventBeforeCleare<TCtx = unknown> extends EventBasicPreventAction<TCtx> {
	public constructor(ctx: TCtx) {
		super(ctx, EEvents.BEFORE_CLEARE);
	}
}
