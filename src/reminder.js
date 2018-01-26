class Reminder {
	constructor(client){
		this.client = client
		this.bank = null
		this.targetRate = null
		this.checkFrequency = 1000 * 60
	}
}