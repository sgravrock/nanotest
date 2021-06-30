import Runner from '../runner.js';

describe('runner', () => {
	describe('#test', () => {
		it('regisers a test', () => {
			const subject = new Runner(mockLogger());
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
			const subject = new Runner(mockLogger());
			const f1 = jasmine.createSpy('f1');
			const f2 = jasmine.createSpy('f2');
			subject.test('f1', f1);
			subject.test('f2', f2);

			subject.run();

			expect(f1).toHaveBeenCalled();
			expect(f2).toHaveBeenCalled();
		});

		it('reports success when a test does not throw', () => {
			const logger = mockLogger();
			const subject = new Runner(logger);
			subject.test('a test', () => {});

			subject.run();

			expect(logger.log).toHaveBeenCalledWith('PASS: a test');
		});

		it('reports failure when a test throws', () => {
			const logger = mockLogger();
			const subject = new Runner(logger);
			const error = new Error('nope');
			subject.test('a test', () => {throw error;});

			subject.run();

			expect(logger.log).toHaveBeenCalledWith('FAIL: a test');
			expect(logger.error).toHaveBeenCalledWith(error);
		});
	});
});

function mockLogger() {
	return jasmine.createSpyObj('logger', ['log', 'error']);
}
