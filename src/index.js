const line = require('@line/bot-sdk')
import express from 'express'
import Promise from 'bluebird'
import getExchangeRateData from './getExchangeRate'
import Reminder from './reminder'

const config = {
	channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
	channelSecret: process.env.CHANNEL_SECRET,
}

const client = new line.Client(config)

//use to store reminder for each user
const reminders = {}

const app = express()

const handleEvent = (event) => {
	console.log(event)

	if (event.type !== 'message' || event.message.type !== 'text') {
	    // ignore non-text-message event
	    return Promise.resolve(null);
	  }

  	const {userId} = event.source

  	if(!reminders.hasOwnProperty(userId))
		reminders[userId] = new Reminder(client, userId)
	  	
  	const reminder = reminders[userId]

  	reminder.replyToken = event.replyToken

  	const txt = event.message.text

  	console.log(`incoming text: ${txt}`)

  	//check currency
	if(/\$/.test(txt)){
  		const commands = /\$(.*)/.exec(txt)[1].split(' ')
  		const currency = commands[0]

  		return reminder.checkRate(currency)
	}
	else if(/--/.test(txt)){
		const commands = /--(.*)/.exec(txt)[1]

		console.log(commands)

		if(reminder[commands] != null)
			return reminder[commands]()
	}
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
