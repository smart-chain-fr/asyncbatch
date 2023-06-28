import timeoutPromise from "./timeoutPromise";

export default class Countdown {
	private _isStared: boolean = false;
	private timeAt: number = 0;
	public constructor(private countdownMs: number) {}

	public static new(countdownMs: number = 0): Countdown {
		return new this(countdownMs);
	}

	public get isStarted(): boolean {
		return this._isStared;
	}

	public start(): void {
		if (this._isStared) return;
		this._isStared = true;
		this.timeAt = new Date().getTime() + this.countdownMs;
	}

	public reload(): void {
		this._isStared = false;
		this.start();
	}

	public willWait(): number {
		let toTime = this.timeAt - new Date().getTime();
		if (toTime > 0) return toTime;
		return 0;
	}

	public async wait(): Promise<void> {
		const waitingTime = this.willWait();
		if (waitingTime === 0) return;
		await timeoutPromise(waitingTime);
	}
}
