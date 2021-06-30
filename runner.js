import GlobalErrorRouter from './globalErrorRouter.js';

export default class Runner {

	constructor(deps) {
		deps = deps || {};
		this._logger = deps.logger || console;
		this._setTimeout = deps.setTimeout || setTimeout;
		this._clearTimeout = deps.clearTimeout || clearTimeout;
		this._globalErrorRouter = deps.globalErrorRouter ||
			new GlobalErrorRouter(process);
		this.tests = [];
	}

	test(name, fn) {
		this.tests.push({name, fn});
	}

	async run() {
		let currentRunner;
		this._globalErrorRouter.install(error => {
			currentRunner.handleGlobalError(error);
		});

		for (const test of this.tests) {
			currentRunner = this._makeSingleRunner(test);
			await currentRunner.run();
		}

		this._globalErrorRouter.uninstall();
	}

	_makeSingleRunner(test) {
		return new SingleRunner(test, {
			setTimeout: this._setTimeout,
			clearTimeout: this._clearTimeout,
			logger: this._logger,
		});
	}
}

class SingleRunner {
	constructor(test, deps) {
		this._test = test;
		this._setTimeout = deps.setTimeout;
		this._clearTimeout = deps.clearTimeout;
		this._logger = deps.logger;
	}

	async run() {
		const timeoutToken = {};
		let timeoutId;
		const timeoutPromise = new Promise(resolve => {
			timeoutId = this._setTimeout(function() {
				resolve(timeoutToken);
			}, 1000);
		});
		let token;

		try {
			token = await Promise.race([this._test.fn(), timeoutPromise]);
		} catch (error) {
			this._logger.error(error);
			this._errored = true;
		}

		if (token === timeoutToken) {
			this._logger.log('FAIL: ' + this._test.name + ' (timed out)');
		} else {
			this._clearTimeout(timeoutId);

			if (this._errored) {
				this._logger.log('FAIL: ' + this._test.name);
			} else {
				this._logger.log('PASS: ' + this._test.name);
			}
		}
	}

	handleGlobalError(error) {
		this._logger.error(error);
		this._errored = true;
	}
}
