type TDataTypes<TDataType> = TDataType[] | Generator<TDataType>;

export default class Queuer<TDataType> {
	private stores: TDataTypes<TDataType>[] = [];
	private _hasDatas = false;
	private _generator: Generator<TDataType> | null = null;
	public push(...datas: TDataType[]) {
		this.stores.push(datas);
	}

	public unshift(...datas: TDataType[]) {
		this.stores.unshift(datas);
	}

	public pushMany(datas: TDataType[] | Generator<TDataType>) {
		this.stores.push(datas);
	}

	private *generator() {
		while (this.stores.length > 0) {
			const store = this.stores.shift()!;
			for (const data of store) {
				yield data;
			}
		}
		this._generator = null;
	}

	public pull() {
		return (this._generator ??= this.generator());
	}

	public get hasDatas() {
		return this._hasDatas;
	}

	public clear() {
		this.stores.splice(0);
		this._generator = null;
	}
}
