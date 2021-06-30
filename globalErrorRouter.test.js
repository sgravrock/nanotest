import assert from 'assert';
import EventEmitter from 'events';
import GlobalErrorRouter from './globalErrorRouter.js';

export default function(outerRunner) {
	outerRunner.test('GlobalErrorRouter uninstalls and reinstalls existing listeners', () => {
		const emitter = new EventEmitter();
		const subject = new GlobalErrorRouter(emitter);
		function existingListener() {}
		emitter.on('uncaughtException', existingListener);

		subject.install(function() {});
		assert(!emitter.listeners('uncaughtException').includes(
			existingListener));

		subject.uninstall();
		assert.deepStrictEqual(emitter.listeners('uncaughtException'), [existingListener]);
	});

	outerRunner.test('GlobalErrorRouter routes errors to the installed handler', () => {
		const emitter = new EventEmitter();
		const subject = new GlobalErrorRouter(emitter);
		const errors = [];
		subject.install(e => errors.push(e));
		const error1 = 'error 1';
		emitter.emit('uncaughtException', error1);

		subject.uninstall();
		const error2 = 'error 2';
		emitter.emit('uncaughtException', error2);
		assert.deepStrictEqual(errors, [error1]);
	});
}
