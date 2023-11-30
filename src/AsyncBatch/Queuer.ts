enum IStoreType {
	SINGLE = "SINGLE",
	MANY = "MANY",
}

type TDataTypes<TDataType> = TDataType | TDataType[] | Generator<TDataType>;

class Store<TDataType> {
	constructor(public value: TDataTypes<TDataType>, public type: IStoreType) {}
}

export default class Queuer<TDataType> {
	private store: Store<TDataType>[] = [];
	private _hasDatas = false;
	private _generator: Generator<TDataType> | null = null;
	public push(...datas: TDataType[]) {
		this.store.push(
			...datas.map((data) => {
				return new Store(data, IStoreType.SINGLE);
			}),
		);
	}

	public unshift(...datas: TDataType[]) {
		this.store.unshift(
			...datas.map((data) => {
				return new Store(data, IStoreType.SINGLE);
			}),
		);
	}

	public pushMany(datas: TDataType[] | Generator<TDataType>) {
		this.store.push(new Store(datas, IStoreType.MANY));
	}

	private *generator() {
		while (this.store.length > 0) {
			const store = this.store.shift()!;
			switch (store.type) {
				case IStoreType.SINGLE:
					yield store.value as TDataType;
					break;
				case IStoreType.MANY:
					for (const data of store.value as TDataType[]) {
						yield data;
					}
					break;
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
		this.store.splice(0);
		this._generator = null;
	}
}
