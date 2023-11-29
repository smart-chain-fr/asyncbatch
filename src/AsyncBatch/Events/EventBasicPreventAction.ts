import EEvents from "./EEvents";
import EventBasic from "./EventBasic";

/**
 * @description Event object
 */
export default abstract class EventBasicPreventAction<TCtx = unknown> extends EventBasic<TCtx> {
	protected _preventedAction: boolean = false;

	public constructor(ctx: TCtx, type: EEvents) {
		super(ctx, type);
		this.preventAction = this.preventAction.bind(this);
	}

	public get preventedAction(): boolean {
		return this._preventedAction;
	}

	public preventAction() {
		return (this._preventedAction = true);
	}
}
