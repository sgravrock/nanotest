import fs from 'fs'
import runnerTests from './runner.test.js';

// Run our own tests using a copy of runner.js that hopefully isn't broken.
// It'll be copied from runner.js the first time the tests are run and can
// be manually copied at any appropriate time
if (!fs.existsSync('known-good-runner.js')) {
	fs.copyFileSync('runner.js', 'known-good-runner.js');
}

const KnownGoodRunner = (await import('./known-good-runner.js')).default;
const runner = new KnownGoodRunner();
runnerTests(runner);
runner.run();
