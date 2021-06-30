export default class MockLogger {
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
