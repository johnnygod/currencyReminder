const line = require('@line/bot-sdk')
import express from 'express'
import Promise from 'bluebird'

const config = {
	channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
	channelSecret: process.env.CHANNEL_SECRET,
}

const client = new line.Client(config)

const app = express()

const handleEvent = (event) => {
	if (event.type !== 'message' || event.message.type !== 'text') {
	    // ignore non-text-message event
	    return Promise.resolve(null);
	  }

	  // create a echoing text message
	  const echo = { type: 'text', text: event.message.text };

	  // use reply API
	  return client.replyMessage(event.replyToken, echo);
}

app.post('/callback', line.middleware(config), (req, res) => {
	Promise.all(req.body.events.map(handleEvent))
			.then(result => res.json(result))
			.catch(err => {
				console.log(err)
				res.end()
			})
})

const port = process.env.PORT || 3000

app.listen(port, () => {
	console.log(`listening on port:${port}`)
})
