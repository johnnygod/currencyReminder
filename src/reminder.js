import banks from './banks'

const actionTypes = {
	ENABLEREMINDER: 'ENABLEREMINDER',
	SETCURRENCY: 'SETCURRENCY',
	SETTYPE:'SETTYPE',
	SETRATE: 'SETRATE',
	SETRULE: 'SETRULE',
	CONFIRMSETTING: 'CONFIRMSETTING'
}

class Reminder {
	constructor(client, userId){
		this.client = client
		this.userId = userId

		this.bank = banks[1]
		this.currency = null
		this.targetType = null
		this.targetRate = null
		this.rule = null //function

		this.checkFrequency = 1000 * 60

		this.replyToken = null

		this.waitingForMessage = false
		this.actsAfterReceiveMsg = null

		this.checkRate = this.checkRate.bind(this)
	}

	checkRate(currency){
		return this.bank.getExchangeRateData()
				.then(data => {
					const reg = new RegExp(currency, 'i')
					const rateInfo = data.find(item => reg.test(item.currency))

					if(rateInfo == null)
						return

					const message = `現金買入: ${rateInfo.cashBuy}\n現金賣出: ${rateInfo.cashSell}\n即期買入: ${rateInfo.buy}\n即期賣出: ${rateInfo.sell}`
					return this.client.replyMessage(this.replyToken, { type: 'text', text: message })
				})
	}

	init(){
		const enableAct = { type: actionTypes.ENABLEREMINDER, data: true}
		const disableAct = { type: actionTypes.ENABLEREMINDER, data: false}

		return this.client.pushMessage(this.userId, {
			type: 'template',
			altText: 'Initialize Reminder',
			template: {
				type: 'buttons',
				text: '是否要啟用匯率提醒功能?',
				actions: [
					{
						type: 'postback',
						label: '啟用',
						data: JSON.stringify(enableAct)
					},
					{
						type: 'postback',
						label: '停用',
						data: JSON.stringify(disableAct)
					}
				]
			}
		})
	}

	_enableReminder(isEnable){
		this.enable = isEnable

		if(this.enable){
			const usdAct = { type: actionTypes.SETCURRENCY, data: 'USD'}
			const jpyAct = { type: actionTypes.SETCURRENCY, data: 'JPY'}
			const otherAct = { type: actionTypes.SETCURRENCY, data: 'OTHERS'}

			return this.client.pushMessage(this.userId, {
				type: 'template',
				altText: 'Choose currency',
				template: {
					type: 'buttons',
					text: '請選擇幣別:',
					actions: [
						{
							type: 'postback',
							label: '美金(USD)',
							data: JSON.stringify(usdAct)
						},
						{
							type: 'postback',
							label: '日幣(JPY)',
							data: JSON.stringify(jpyAct)
						},
						{
							type: 'postback',
							label: '其他(JPY)',
							data: JSON.stringify(otherAct)
						}
					]
				}
			})
		}
		else
			this.reset()
	}

	_setCurrency(currency){
		if(/others/i.test(currency)){
			this.waitingForMessage = true
			this.actsAfterReceiveMsg = actionTypes.SETCURRENCY
			return this.client.pushMessage(this.userId, { type: 'text', text: '請輸入幣別縮寫\nEX: USD' })
		}
		else{
			this.currency = currency
			this.waitingForMessage = true
			this.actsAfterReceiveMsg  = actionTypes.SETRATE
			

			const spotBuy = {type: actionTypes.SETTYPE, data: 0}
			const spotSell = {type: actionTypes.SETTYPE, data: 1}
			const cashBuy = {type: actionTypes.SETTYPE, data: 2}
			const cashSell = {type: actionTypes.SETTYPE, data: 3}

			return this.client.pushMessage(this.userId, {
				type: 'template',
				altText: 'Set reminder rule',
				template: {
					type: 'buttons',
					text: '請指定要監控的標的',
					actions: [
						{
							type: 'postback',
							label: '即期買入',
							data: JSON.stringify(spotBuy)
						},
						{
							type: 'postback',
							label: '即期賣出',
							data: JSON.stringify(spotSell)
						},
						{
							type: 'postback',
							label: '現金買入',
							data: JSON.stringify(cashBuy)
						},
						{
							type: 'postback',
							label: '現金賣出',
							data: JSON.stringify(cashSell)
						},
					]
				}
			})
		}
	}

	_setType(type){
		this.targetType = type

		return this.client.pushMessage(this.userId, { type: 'text', text: '請輸入目標匯率\nEX: 29.33' })
	}

	_setRate(rate){
		if(!/^[\d\.]*$/.test(rate)){
			this.waitingForMessage = true
			this.actsAfterReceiveMsg  = actionTypes.SETRATE
			return this.client.pushMessage(this.userId, { type: 'text', text: `匯率格式錯誤!\n您輸入的匯率為 ${rate}\n請重新輸入!` })
		}
		else{
			this.targetRate = +rate

			const higherAct = {type: actionTypes.SETRULE, data: 0}
			const lowerAct = {type: actionTypes.SETRULE, data: 1}
			const overAct = {type: actionTypes.SETRULE, data: 2}
			const underAct = {type: actionTypes.SETRULE, data: 3}

			return this.client.pushMessage(this.userId, {
				type: 'template',
				altText: 'Set reminder rule',
				template: {
					type: 'buttons',
					text: '提醒條件',
					actions: [
						{
							type: 'postback',
							label: '當匯率"高於"指定匯率時',
							data: JSON.stringify(higherAct)
						},
						{
							type: 'postback',
							label: '當匯率"低於"指定匯率時',
							data: JSON.stringify(lowerAct)
						},
						{
							type: 'postback',
							label: '當匯率"等於或高於"指定匯率時',
							data: JSON.stringify(overAct)
						},
						{
							type: 'postback',
							label: '當匯率"等於或低於"指定匯率時',
							data: JSON.stringify(underAct)
						},
					]
				}
			})
		}
	}

	_setRule(type){
		const targetRate = this.targetRate

		let ruleMsg
		switch(type){
			case 0:
				this.rule = (rate) => rate > targetRate
				ruleMsg = '"高於"'
				break
			case 1:
				this.rule = (rate) => rate < targetRate
				ruleMsg = '"低於"'
				break
			case 2:
				this.rule = (rate) => rate >= targetRate
				ruleMsg = '"等於或高於"'
				break
			case 3:
				this.rule = (rate) => rate >= targetRate
				ruleMsg = '"等於或低於"'
				break
			default:
				break
		}

		if(!ruleMsg)
			return

		const okAct = {type: actionTypes.CONFIRMSETTING, data: true}
		const cancelAct = {type: actionTypes.CONFIRMSETTING, data: false}

		return this.client.pushMessage(this.userId, {
				type: 'template',
				altText: 'Confirm info',
				template: {
					type: 'confirm',
					text: `您所輸入的設定為\n幣別: ${this.currency}\n目標匯率: ${this.targetRate}\n提醒條件: 當匯率 ${ruleMsg} 目標匯率時\n確定要啟用提醒嗎?`,
					actions: [
						{
							type: 'postback',
							label: '確定',
							data: JSON.stringify(okAct)
						},
						{
							type: 'postback',
							label: '取消',
							data: JSON.stringify(cancelAct)
						}
					]
				}
			})
	}

	_confirmSetting(isConfirm){
		if(!isConfirm)
			this.reset()
		else{
			this.start()
			this.client.pushMessage(this.userId, { type: 'text', text: '成功啟用提醒功能，祝您發大財!!\n(請勿再次點擊之前的按鈕避免造成錯誤!)' })
		}
	}

	reset(){
		this.currency = null
		this.targetType = null
		this.targetRate = null
		this.rule = null //function

		this.waitingForMessage = false
		this.actsAfterReceiveMsg = null
	}

	start(){
		if(this.stopKey != null)
			this.end()

		const currency = this.currency, type = this.targetType, userId = this.userId
		this.stopKey = setInterval(() => {
			console.log(`checking Rate for ${userId}`)
			this.bank.getExchangeRateData()
				.then(data => {
					const reg = new RegExp(currency, 'i')
					const rateInfo = data.find(item => reg.test(item.currency))

					if(rateInfo == null){
						this.end()
					}

					let curRate
					switch(type){
						case 0:
							curRate = rateInfo.buy
							break
						case 1:
							curRate = rateInfo.sell
							break
						case 2:
							curRate = rateInfo.cashBuy
							break
						case 3:
							curRate = rateInfo.cashSell
							break
						default:
							break
					}

					console.log(`current rate is ${curRate}`)

					if(curRate != null)
						if(this.rule(curRate)){
							this.client.pushMessage(this.userId, { type: 'text', text: `目前匯率: ${curRate}，請進場購買!` })
							.then(() => {
								this.end()
							})
						}						
					else{
						this.end()
					}

				})
		}, this.checkFrequency)
	}

	end(){
		clearInterval(this.stopKey)
		this.stopKey = null
	}

	handlePostback(payload){
		const {type, data} = payload

		switch(type){
			case actionTypes.ENABLEREMINDER:
				return this._enableReminder(data)
			case actionTypes.SETCURRENCY:
				return this._setCurrency(data)
			case actionTypes.SETTYPE:
				return this._setType(data)
			case actionTypes.SETRULE:
				return this._setRule(data)
			case actionTypes.CONFIRMSETTING:
				return this._confirmSetting(data)
			default:
				return
		}
	}

	handleMessage(txt){
		if(!this.waitingForMessage)
			return

		this.waitingForMessage = false
		const act = this.actsAfterReceiveMsg
		this.actsAfterReceiveMsg = null
		switch(act){
			case actionTypes.SETCURRENCY:
				return this._setCurrency(txt)
			case actionTypes.SETRATE:
				return this._setRate(txt)
			default:
				return
		}
	}

}

export default Reminder