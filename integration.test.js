import assert from 'assert';
import Runner from './runner.js';
import GlobalErrorRouter from './globalErrorRouter.js';
import MockLogger from './mockLogger.js';

export default function(outerRunner) {
	outerRunner.test('integration: handles async errors', async () => {
		const logger = new MockLogger();
		const subject = new Runner({
			logger,
			setTimeout,
			clearTimeout,
			globalErrorRouter: new GlobalErrorRouter(process)
		});
		let thrownError;

		subject.test('async fail', async function() {
			// Go async so that the runner won't be on the stack
			// when the error is raised.
			await Promise.resolve();
			thrownError = new Error('the error');
			throw thrownError;
		});

		await subject.run();
		assert.deepStrictEqual(logger.calls.log, ['FAIL: async fail']);
		assert.deepStrictEqual(logger.calls.error, [thrownError]);
	});
};
