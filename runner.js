export default class Runner {

	constructor(deps) {
		deps = deps || {};
		this._logger = deps.logger || console;
		this._setTimeout = deps.setTimeout || setTimeout;
		this._clearTimeout = deps.clearTimeout || clearTimeout;
		this.tests = [];
	}

	test(name, fn) {
		this.tests.push({name, fn});
	}

	async run() {
		for (const test of this.tests) {
			await this._runOne(test);
		}
	}

	async _runOne(test) {
		const timeoutToken = {};
		let timeoutId;
		const timeoutPromise = new Promise(resolve => {
			timeoutId = this._setTimeout(function() {
				resolve(timeoutToken);
			}, 1000);
		});
		let token;

		try {
			token = await Promise.race([test.fn(), timeoutPromise]);
		} catch (e) {
			this._clearTimeout(timeoutId);
			this._logger.log('FAIL: ' + test.name);
			this._logger.error(e);
			return;
		}

		if (token === timeoutToken) {
			this._logger.log('FAIL: ' + test.name + ' (timed out)');
		} else {
			this._clearTimeout(timeoutId);
			this._logger.log('PASS: ' + test.name);
		}
	}
}
