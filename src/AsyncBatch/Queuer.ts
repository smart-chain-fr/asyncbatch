type TDataTypes<TDataType> = TDataType[] | Generator<TDataType>;

/**
 * Queuer is a simple class that allow you to push datas in a queue and pull them with a generator
 */
export default class Queuer<TDataType> {

	/**
	 * It stores groups of pushed datas
	 * The original array datas are stored and never modified, it keeps the reference and avoid to copy the datas
	 */
	private stores: TDataTypes<TDataType>[] = [];
	private _generator: Generator<TDataType> | null = null;

	/**
	 * Push datas in the queue with one or more arguments
	 */
	public push(...datas: TDataType[]) {
		this.stores.push(datas);
	}

	/**
	 * Push datas in the queue with one or more arguments at the beginning of the queue
	 */
	public unshift(...datas: TDataType[]) {
		this.stores.unshift(datas);
	}

	/**
	 * Push many datas in the queue
	 */
	public pushMany(datas: TDataType[] | Generator<TDataType>) {
		this.stores.push(datas);
	}

	/**
	 * Generator that pull datas from the queue
	 */
	private *generator() {
		while (this.stores.length > 0) {
			const store = this.stores.shift()!;
			for (const data of store) {
				yield data;
			}
		}
		this._generator = null;
	}

	/**
	 * Pull datas from the queue
	 */
	public pull() {
		return (this._generator ??= this.generator());
	}

	/**
	 * Clear the queue
	 */
	public clear() {
		this.stores.splice(0);
		this._generator = null;
	}
}
