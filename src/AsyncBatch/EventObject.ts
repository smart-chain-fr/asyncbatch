import EEvents from "./EEvents";

/**
 * @description Event object
 */
export default class EventObject<TCtx = unknown, TData = unknown, TRes = unknown> {
	private _preventedAction: boolean = false;

	public constructor(
		public readonly ctx: TCtx,
		public readonly type: EEvents,
		public readonly data?: TData,
		public readonly response?: TRes,
		public readonly error?: Error | string,
		public readonly preventableAction = false,
	) {
		this.preventAction = this.preventAction.bind(this);
	}

	public get preventedAction(): boolean {
		return this._preventedAction;
	}

	public preventAction() {
		if (!this.preventableAction) return false;
		return (this._preventedAction = true);
	}
}
