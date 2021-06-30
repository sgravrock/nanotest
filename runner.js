export default class Runner {

	constructor(logger) {
		this.logger = logger || console;
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
		try {
			await test.fn();
		} catch (e) {
			this.logger.log('FAIL: ' + test.name);
			this.logger.error(e);
			return;
		}

		this.logger.log('PASS: ' + test.name);
	}
}
