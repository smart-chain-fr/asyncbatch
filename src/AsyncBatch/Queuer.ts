export type TQDataTypes<TDataType> = TDataType[] | Generator<TDataType> | AsyncGenerator<TDataType>;

/**
 * Queuer is a simple class that allow you to push datas in a queue and pull them with a generator
 */
export default class Queuer<TDataType> {
	/**
	 * It stores groups of pushed datas
	 * The original array datas are stored and never modified, it keeps the reference and avoid to copy the datas
	 */
	private stores: TQDataTypes<TDataType>[] = [];
	private _generator: Generator<TDataType> | AsyncGenerator<TDataType> | null = null;

	/**
	 * Push datas in the queue
	 */
	public push(datas: TQDataTypes<TDataType>) {
		this.stores.push(datas);
	}

	/**
	 * Generator that pull datas from the queue
	 */
	private async *generator() {
		while (this.stores.length > 0) {
			const store = this.stores.shift() ?? [];
			for await (const data of store) {
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
