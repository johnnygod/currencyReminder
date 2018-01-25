'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

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

	// create a echoing text message
	const echo = { type: 'text', text: event.message.text };

	// use reply API
	return client.replyMessage(event.replyToken, echo);
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