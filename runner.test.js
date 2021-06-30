import assert from 'assert';
import EventEmitter from 'events';
import Runner from './runner.js';
import MockLogger from './mockLogger.js';


export default function(outerRunner) {
	outerRunner.test('Runner#test registers a test', () => {
		const subject = makeRunner();
		function f1() {}
		function f2() {}
	
		subject.test('f1', f1);
		subject.test('f2', f2);
	
		assert.deepStrictEqual(subject.tests, [
			{name: 'f1', fn: f1},
			{name: 'f2', fn: f2},
		]);
	});
	
	outerRunner.test('Runner#run runs each test', async () => {
		const subject = makeRunner();
		let f1Called = false, f2Called = false;
		function f1() { f1Called = true; }
		function f2() { f2Called = true; }
		subject.test('f1', f1);
		subject.test('f2', f2);
	
		await subject.run();
	
		assert(f1Called);
		assert(f2Called);
	});
	
	outerRunner.test('Runner#run reports success when a test does not throw', async () => {
		const logger = new MockLogger();
		const subject = makeRunner({logger});
		subject.test('a test', () => {});
	
		await subject.run();
	
		assert.deepStrictEqual(logger.calls.log, ['PASS: a test']);
	});
	
	outerRunner.test('Runner#run reports failure when a test throws', async () => {
		const logger = new MockLogger();
		const subject = makeRunner({logger});
		const error = new Error('nope');
		subject.test('a test', () => {throw error;});
	
		await subject.run();
	
		assert.deepStrictEqual(logger.calls.log, ['FAIL: a test']);
		assert.deepStrictEqual(logger.calls.error, [error]);
	});
	
	outerRunner.test('Runner#run waits for an async test to finish before reporting', async () => {
		const logger = new MockLogger();
		const subject = makeRunner({logger});
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
	
	outerRunner.test('Runner#run waits for an async test to finish before moving on to the next', async () => {
		const logger = new MockLogger();
		const subject = makeRunner({logger});
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

	outerRunner.test('#run fails an async test that does not complete within one second', async () => {
		const logger = new MockLogger();
		const setTimeoutCalls = [];
		const subject = makeRunner({
			logger,
			setTimeout: (fn, delayMs) => {
				setTimeoutCalls.push({fn, delayMs});
			}
		});
		subject.test('f1', function() {return new Promise(() =>{})});
		subject.test('f2', function() {});

		const runPromise = subject.run();
		assert.equal(setTimeoutCalls.length, 1);
		assert.equal(setTimeoutCalls[0].delayMs, 1000);
		assert.deepStrictEqual(logger.calls.log, []);
		assert.deepStrictEqual(logger.calls.error, []);

		assert.equal(setTimeoutCalls.length, 1);
		setTimeoutCalls[0].fn();
		await runPromise;
		assert.deepStrictEqual(logger.calls.log, [
			'FAIL: f1 (timed out)',
			'PASS: f2'
		]);
	});

	outerRunner.test('#run clears the timeout when a test passes', async () => {
		const logger = new MockLogger();
		const setTimeoutCalls = [];
		const clearTimeoutCalls = [];
		let lastTimeoutId = 0;
		const subject = makeRunner({
			logger,
			setTimeout: (fn, delayMs) => {
				const id = ++lastTimeoutId;
				setTimeoutCalls.push({fn, delayMs, id});
				return id;
			},
			clearTimeout: id => {
				clearTimeoutCalls.push(id);
			}
		});
		let resolveF1;
		subject.test('f1', function() {
			return new Promise(resolve => resolveF1 = resolve);
		});

		const runPromise = subject.run();
		assert.deepStrictEqual(clearTimeoutCalls, []);

		resolveF1();
		await runPromise;
		assert.deepStrictEqual(clearTimeoutCalls, [setTimeoutCalls[0].id]);
	});

	outerRunner.test('#run clears the timeout when a test fails', async () => {
		const logger = new MockLogger();
		const setTimeoutCalls = [];
		const clearTimeoutCalls = [];
		let lastTimeoutId = 0;
		const subject = makeRunner({
			logger,
			setTimeout: (fn, delayMs) => {
				const id = ++lastTimeoutId;
				setTimeoutCalls.push({fn, delayMs, id});
				return id;
			},
			clearTimeout: id => {
				clearTimeoutCalls.push(id);
			}
		});
		let rejectF1;
		subject.test('f1', function() {
			return new Promise((resolve, reject) => rejectF1 = reject);
		});

		const runPromise = subject.run();
		assert.deepStrictEqual(clearTimeoutCalls, []);

		rejectF1();
		await runPromise;
		assert.deepStrictEqual(clearTimeoutCalls, [setTimeoutCalls[0].id]);
	});

	outerRunner.test('Runner#run fails the currently running test when there is an unhandled exception', async () => {
		const globalErrorRouter = new MockGlobalErrorRouter();
		const logger = new MockLogger();
		const subject = makeRunner({globalErrorRouter, logger});
		let resolveTest;

		subject.test('test', function() {
			return new Promise(resolve => resolveTest = resolve);

		});

		const runPromise = subject.run();
		assert(!!resolveTest);
		globalErrorRouter.handler('nope');
		resolveTest();
		await runPromise;

		assert.deepStrictEqual(logger.calls.log, ['FAIL: test']);
		assert.deepStrictEqual(logger.calls.error, ['nope']);
	});
}

class MockGlobalErrorRouter {
	install(handler) { this.handler = handler; }

	uninstall() { this.handler = undefined; }
}

function makeRunner(options) {
	const defaults = {
		logger: new MockLogger(),
		setTimeout: function() {},
		clearTimeout: function() {},
		globalErrorRouter: new MockGlobalErrorRouter()
	};
	return new Runner({...defaults, ...options});
}
