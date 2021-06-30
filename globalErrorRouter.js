export default class GlobalErrorRouter {
	// eventEmitter should usually be the global process object,
	// except in tests.
	constructor(eventEmitter) {
		this._eventEmitter = eventEmitter;
		this._handlers = [];
		this._listener = event => {
			if (this._handlers.length > 0) {
				this._handlers[this._handlers.length - 1](event);
			}
		};
	}

	install(handler) {
		this._originalListeners = this._eventEmitter.listeners(
			'uncaughtException');
		this._eventEmitter.removeAllListeners('uncaughtException');
		this._handler = handler;
		this._eventEmitter.on('uncaughtException', this._handler);
	}

	uninstall() {
		this._eventEmitter.removeListener('uncaughtException', this._handler);

		for (const listener of this._originalListeners) {
			this._eventEmitter.on('uncaughtException', listener);
		}

		this._originalListeners = [];
	}
}
