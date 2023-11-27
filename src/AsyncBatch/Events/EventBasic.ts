import EEvents from "./EEvents";

/**
 * @description Event object
 */
export default abstract class EventBasic<TCtx = unknown> {
	public constructor(public readonly ctx: TCtx, public readonly type: EEvents) {}
}
