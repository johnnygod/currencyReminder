var banks = require('./dist/banks').default

banks[1].getExchangeRateData()
.then(data => {
	console.log(data)
})