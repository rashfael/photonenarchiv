class Scheduler {
	constructor () {
		this._queue = []
	}

	queue (func) {
		this._queue.push(func)
		if (this._queue.length === 1) this.run()
	}

	async run () {
		if (this._queue.length === 0) return
		const func = this._queue[0]
		await func()
		this._queue.shift()
		this.run()
	}
}

module.exports = Scheduler
