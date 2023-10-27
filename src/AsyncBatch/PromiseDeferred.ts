export default class PromiseDeferred<T> {

	public resolve!: (value: T) => void;
	public reject!: (reason?: any) => void;
	public promise: Promise<T>;

	public constructor() {
		this.promise = new Promise((resolve, reject) => {
			this.resolve = resolve;
			this.reject = reject;
		});
	}
}
