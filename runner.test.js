import assert from 'assert';
import Runner from './runner.js';

export default function(outerRunner) {
	outerRunner.test('#test regisers a test', () => {
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
	
	outerRunner.test('#run runs each test', async () => {
		const subject = new Runner(new MockLogger());
		let f1Called = false, f2Called = false;
		function f1() { f1Called = true; }
		function f2() { f2Called = true; }
		subject.test('f1', f1);
		subject.test('f2', f2);
	
		await subject.run();
	
		assert(f1Called);
		assert(f2Called);
	});
	
	outerRunner.test('#run reports success when a test does not throw', async () => {
		const logger = new MockLogger();
		const subject = new Runner(logger);
		subject.test('a test', () => {});
	
		await subject.run();
	
		assert.deepStrictEqual(logger.calls.log, ['PASS: a test']);
	});
	
	outerRunner.test('#run reports failure when a test throws', async () => {
		const logger = new MockLogger();
		const subject = new Runner(logger);
		const error = new Error('nope');
		subject.test('a test', () => {throw error;});
	
		await subject.run();
	
		assert.deepStrictEqual(logger.calls.log, ['FAIL: a test']);
		assert.deepStrictEqual(logger.calls.error, [error]);
	});
	
	outerRunner.test('#run waits for an async test to finish before reporting', async () => {
		const logger = new MockLogger();
		const subject = new Runner(logger);
		let testResolve;
		const testPromise = new Promise(res => testResolve = res);
		async function f() {
			await testPromise;
		}
		subject.test('test', f);
	
		subject.run();
		assert.deepStrictEqual(logger.calls.log, []);
	
		testResolve();
		await new Promise(res => setTimeout(res));
		assert.deepStrictEqual(logger.calls.log, ['PASS: test']);
	});
	
	outerRunner.test('#run waits for an async test to finish before moving on to the next', async () => {
		const logger = new MockLogger();
		const subject = new Runner(logger);
		let f1Called = false, f2Called = false;
		let f1Resolve;
		const f1Promise = new Promise(res => f1Resolve = res);
		async function f1() {
			f1Called = true;
			return f1Promise;
		}
		function f2() { f2Called = true; }
		subject.test('f1', f1);
		subject.test('f2', f2);
	
		subject.run();
		assert(f1Called);
		assert(!f2Called);
	
		f1Resolve();
		await new Promise(res => setTimeout(res));
		assert(f2Called);
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
