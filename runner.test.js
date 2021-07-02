import assert from 'assert';
import Runner from './runner.js';

export default function(outerRunner) {
	outerRunner.test('Runner#test regisers a test', () => {
		const subject = new Runner(new MockLogger());
		function f1() {}
		function f2() {}
	
		subject.test('f1', f1);
		subject.test('f2', f2);
	
		assert.deepStrictEqual(subject.tests, [
			{name: 'f1', fn: f1},
			{name: 'f2', fn: f2},
		]);
	});
	
	outerRunner.test('Runner#run runs each test', () => {
		const subject = new Runner(new MockLogger());
		let f1Called = false, f2Called = false;
		function f1() { f1Called = true; }
		function f2() { f2Called = true; }
		subject.test('f1', f1);
		subject.test('f2', f2);
	
		subject.run();
	
		assert(f1Called);
		assert(f2Called);
	});
	
	outerRunner.test('Runner#run reports success when a test does not throw', () => {
		const logger = new MockLogger();
		const subject = new Runner(logger);
		subject.test('a test', () => {});
	
		subject.run();
	
		assert.strictEqual(logger.calls.log[0], 'PASS: a test');
	});
	
	outerRunner.test('Runner#run reports failure when a test throws', () => {
		const logger = new MockLogger();
		const subject = new Runner(logger);
		const error = new Error('nope');
		subject.test('a test', () => {throw error;});
	
		subject.run();
	
		assert.strictEqual(logger.calls.log[0], 'FAIL: a test');
		assert.strictEqual(logger.calls.error[0], error);
	});
}

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
