import Runner from '../runner.js';

describe('runner', () => {
	describe('#test', () => {
		it('regisers a test', () => {
			const subject = new Runner(new MockLogger());
			function f1() {}
			function f2() {}

			subject.test('f1', f1);
			subject.test('f2', f2);

			expect(subject.tests).toEqual([
				{name: 'f1', fn: f1},
				{name: 'f2', fn: f2},
			]);
		});
	});

	describe('#run', () => {
		it('runs each test', () => {
			const subject = new Runner(new MockLogger());
			let f1Called = false, f2Called = false;
			function f1() { f1Called = true; }
			function f2() { f2Called = true; }
			subject.test('f1', f1);
			subject.test('f2', f2);

			subject.run();

			expect(f1Called).toBe(true);
			expect(f2Called).toBe(true);
		});

		it('reports success when a test does not throw', () => {
			const logger = new MockLogger();
			const subject = new Runner(logger);
			subject.test('a test', () => {});

			subject.run();

			expect(logger.calls.log[0]).toEqual('PASS: a test');
		});

		it('reports failure when a test throws', () => {
			const logger = new MockLogger();
			const subject = new Runner(logger);
			const error = new Error('nope');
			subject.test('a test', () => {throw error;});

			subject.run();

			expect(logger.calls.log[0]).toEqual('FAIL: a test');
			expect(logger.calls.error[0]).toEqual(error);
		});
	});
});


class MockLogger {
	constructor() {
		this.calls = {
			log: [],
			error: []
		};
	}

	log(msg) {
		this.calls.log.push(msg);
	}

	error(e) {
		this.calls.error.push(e);
	}
}
