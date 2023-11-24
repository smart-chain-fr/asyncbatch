import { EventEmitter } from "events";

export default class Emitter extends EventEmitter {
	public constructor() {
		super();
		this.setMaxListeners(0);
	}
}
