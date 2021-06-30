export default class Runner {

	constructor(logger) {
		this.logger = logger || console;
		this.tests = [];
	}

	test(name, fn) {
		this.tests.push({name, fn});
	}

	run() {
		for (const test of this.tests) {
			try {
				test.fn();
			} catch (e) {
				this.logger.log('FAIL: ' + test.name);
				this.logger.error(e);
			}

			this.logger.log('PASS: ' + test.name);
		}
	}
}
