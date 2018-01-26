'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _banks = require('./banks');

var _banks2 = _interopRequireDefault(_banks);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Reminder {
	constructor(client, userId) {
		this.client = client;
		this.userId = userId;
		this.bank = _banks2.default[0];
		this.targetRate = null;
		this.checkFrequency = 1000 * 60;

		this.replyToken = null;

		this.checkRate = this.checkRate.bind(this);
	}

	checkRate(currency) {
		return this.bank.getExchangeRateData().then(data => {
			const reg = new RegExp(currency, 'i');
			const rateInfo = data.find(item => reg.test(item.currency));

			if (rateInfo == null) return;

			const message = `現金買入: ${rateInfo.cashBuy}\n現金賣出: ${rateInfo.cashSell}\n即期買入: ${rateInfo.buy}\n即期賣出: ${rateInfo.sell}`;
			return this.client.replyMessage(this.replyToken, { type: 'text', text: message });
		});
	}

	init() {
		return this.client.pushMessage(this.userId, {
			type: 'template',
			altText: 'Initialize Reminder',
			template: {
				type: 'buttons',
				text: '是否要啟用匯率提醒功能?',
				actions: [{
					type: 'postback',
					label: '啟用',
					data: "enableReminder=true"
				}, {
					type: 'postback',
					label: '停用',
					data: "enableReminder=false"
				}]
			}
		}).then(() => {
			console.log('button template send!');
		});
	}
}

exports.default = Reminder;