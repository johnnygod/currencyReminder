const line = require('@line/bot-sdk')
import express from 'express'
import Promise from 'bluebird'
import getExchangeRateData from './getExchangeRate'

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

	  const txt = event.message.text

	  console.log(`incoming text: ${txt}`)

	  if(!/\$/.test(txt))
	  	return Promise.resolve(null)

	  const commands = /\$(.*)/.exec(txt)[1].split(' ')

	  const currency = commands[0]

	  console.log('call getExchangeRateData')
	  return getExchangeRateData()
	  			.then(data => {
	  				console.log(`results: ${data}`)
	  				const curReg = new RegExp(currency)
	  				const rateInfo = data.find(item => {
	  					return curReg.test(item.currency, 'i')
	  				})

	  				console.log(`rateInfo: ${rateInfo}`)

	  				if(rateInfo == null)
	  					return null

	  				const message = `現金買入: ${rateInfo.cashBuy}\n現金賣出: ${rateInfo.cashSell}\n即期買入: ${rateInfo.buy}\n即期賣出: ${rateInfo.sell}`


	  				return client.replyMessage(event.replyToken, { type: 'text', text: message })
	  			})


	  // create a echoing text message
	  // const echo = { type: 'text', text: event.message.text };

	  // use reply API
	  // return client.replyMessage(event.replyToken, echo);
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
