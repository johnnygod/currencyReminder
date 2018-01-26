'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _superagent = require('superagent');

var _superagent2 = _interopRequireDefault(_superagent);

var _cheerio = require('cheerio');

var _cheerio2 = _interopRequireDefault(_cheerio);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Bank {
	constructor(name, url) {
		this.name = name;
		this.url = url;

		this.getExchangeRateData = this.getExchangeRateData.bind(this);
	}

	getExchangeRateData() {
		return new _bluebird2.default((resolve, reject) => {
			_superagent2.default.get(this.url).end((err, res) => {
				if (err) {
					throw Error(err);
					reject(err);
				}

				resolve(res.text);
			});
		});
	}
}

class TaiwanBank extends Bank {
	constructor() {
		super('台灣銀行', 'http://rate.bot.com.tw/xrt?Lang=en-US');
	}

	getExchangeRateData() {
		return super.getExchangeRateData().then(text => {
			let $ = _cheerio2.default.load(text);

			const exchangeRateData = [];

			$('.table.table-striped.table-bordered.table-condensed.table-hover tbody tr').each(function (i, elem) {
				const _t = $(this);

				let info = {};

				_t.find('td').filter(i => i < 5).each(function (i, elem) {
					const _td = $(this);

					let value;
					switch (i) {
						case 0:
							{
								const currency = _td.children().first().children().eq(3).text();
								const reg = /\((\w*)\)/.exec(currency);
								if (reg) info.currency = reg[1];
								break;
							}
						case 1:
							{
								info.cashBuy = _td.text() == '-' ? null : _td.text();
								break;
							}
						case 2:
							{
								info.cashSell = _td.text() == '-' ? null : _td.text();
								break;
							}
						case 3:
							{
								info.buy = _td.text() == '-' ? null : _td.text();
								break;
							}
						case 4:
							{
								info.sell = _td.text() == '-' ? null : _td.text();
								break;
							}
						default:
							break;
					}
				});

				exchangeRateData.push(info);
			});

			return exchangeRateData;
		});
	}
}

class FirstBank extends Bank {
	constructor() {
		super('第一銀行', 'https://ibank.firstbank.com.tw/NetBank/7/0201.html?sh=none');
	}

	getExchangeRateData() {
		return super.getExchangeRateData().then(text => {
			let $ = _cheerio2.default.load(text);

			const exchangeRateData = [];
			let info = {};

			$('#table1 tr').each(function (i, elem) {
				if (i == 0) return;

				const _t = $(this);

				let isCash = false;

				_t.find('td').filter(i => i < 4).each(function (i, elem) {
					const _td = $(this),
					      value = _td.text();

					switch (i) {
						case 0:
							{
								const reg = /\((\w*)\)/.exec(value);
								if (reg) {
									const currency = reg[1];
									if (!info.currency) info.currency = currency;else if (info.currency != currency) {
										exchangeRateData.push(info);
										info = { currency };
									}
								}
								break;
							}
						case 1:
							{
								isCash = /Cash/.test(value);
								break;
							}
						case 2:
							{
								const rate = /\d*\.\d*/.exec(value)[0];
								if (isCash) info.cashBuy = rate;else info.buy = rate;
								break;
							}
						case 3:
							{
								const rate = /\d*\.\d*/.exec(value)[0];
								if (isCash) info.cashSell = rate;else info.sell = rate;
								break;
							}
						default:
							break;
					}
				});
			});

			exchangeRateData.push(info);

			return exchangeRateData;
		});
	}

}

exports.default = [new TaiwanBank(), new FirstBank()];