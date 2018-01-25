'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _getExchangeRate = require('./getExchangeRate');

var _getExchangeRate2 = _interopRequireDefault(_getExchangeRate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const line = require('@line/bot-sdk');


const config = {
	channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
	channelSecret: process.env.CHANNEL_SECRET
};

const client = new line.Client(config);

const app = (0, _express2.default)();

const handleEvent = event => {
	if (event.type !== 'message' || event.message.type !== 'text') {
		// ignore non-text-message event
		return _bluebird2.default.resolve(null);
	}

	const txt = event.message.text;

	console.log(`incoming text: ${txt}`);

	if (!/\$/.test(txt)) return _bluebird2.default.resolve(null);

	const commands = /\$(.*)/.exec(txt)[1].split(' ');

	const currency = commands[0];

	console.log('call getExchangeRateData');
	return (0, _getExchangeRate2.default)().then(data => {
		const curReg = new RegExp(currency);
		const rateInfo = data.find(item => {
			return curReg.test(item.currency, 'i');
		});

		console.log(`rateInfo: ${rateInfo}`);

		if (rateInfo == null) return null;

		const messages = [];
		messages.push(`現金買入: ${rateInfo.cashBuy}`);
		messages.push(`現金賣出: ${rateInfo.cashSell}`);
		messages.push(`即期買入: ${rateInfo.buy}`);
		messages.push(`即期賣出: ${rateInfo.sell}`);

		return client.replyMessage(event.replyToken, messages.map(item => {
			return { type: 'text', text: item };
		}));
	});

	// create a echoing text message
	// const echo = { type: 'text', text: event.message.text };

	// use reply API
	// return client.replyMessage(event.replyToken, echo);
};

app.post('/callback', line.middleware(config), (req, res) => {
	_bluebird2.default.all(req.body.events.map(handleEvent)).then(result => res.json(result)).catch(err => {
		console.log(err);
		res.end();
	});
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
	console.log(`listening on port:${port}`);
});