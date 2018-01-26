'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _getExchangeRate = require('./getExchangeRate');

var _getExchangeRate2 = _interopRequireDefault(_getExchangeRate);

var _reminder = require('./reminder');

var _reminder2 = _interopRequireDefault(_reminder);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const line = require('@line/bot-sdk');


const config = {
	channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
	channelSecret: process.env.CHANNEL_SECRET
};

const client = new line.Client(config);

//use to store reminder for each user
const reminders = {};

const app = (0, _express2.default)();

const handleEvent = event => {
	console.log(event);

	if (event.type !== 'message' || event.message.type !== 'text') {
		// ignore non-text-message event
		return _bluebird2.default.resolve(null);
	}

	const { userId } = event.source;

	if (!reminders.hasOwnProperty(userId)) reminders[userId] = new _reminder2.default(client, userId);

	const reminder = reminders[userId];

	reminder.replyToken = event.replyToken;

	const txt = event.message.text;

	console.log(`incoming text: ${txt}`);

	//check currency
	if (/\$/.test(txt)) {
		const commands = /\$(.*)/.exec(txt)[1].split(' ');
		const currency = commands[0];

		return reminder.checkRate(currency);
	} else if (/--/.test(txt)) {
		const commands = /--(.*)/.exec(txt)[1];

		return reminder[commands];
	}
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