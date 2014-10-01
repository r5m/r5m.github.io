//This script should be loaded as early as possible

window.AppData = {
	tplPath 	: "app/", //location of page templates
	defaultView : location.hash ? (location.hash =="#" ? "app-transactions" :location.hash.substr(1,location.hash.length-1)) : "app-transactions", //which template should be loaded in window.onload
	
	currency 	: localStorage.getItem("currency") ? localStorage.getItem("currency") : false,
	currentDate	: new Date(),
	currentType	: 'e',
	currentId	: -1,
	timespan 	: (!!localStorage) ? (localStorage.getItem("timespan") ? localStorage.getItem("timespan") : 'last31') : 'last31',
	theme		: (!!localStorage) ? (localStorage.getItem("theme") ? localStorage.getItem("theme") : 'ios7') : 'ios7',
	lang 		: (!!localStorage) ? (localStorage.getItem("app_locale") ? localStorage.getItem("app_locale") : 'no_lang') : 'no_lang',
	showWeather	: false,
	_theme		: "a",
	_themePanel	: "b",
	//theme		: 'holo_light'
	iconStyle	: 'light',
	treshold	: 30,
				
	widgetDateFormat	: "yyyy-MM-dd",
	displayDateFormat	: "d MMMM (EEE)",
	zeroCounts: {
				byr : 0,
				bhd: 3,
				bif :0,
				clp :0,
				djf :0,
				gnf: 0,
				iqd: 3,
				isk: 0,
				jod :3,
				jpy: 0,
				kmf :0,
				krw: 0,
				kwd: 3,
				lyd: 3,
				omr: 3,
				pyg: 0,
				rwf: 0,
				tnd: 3,
				vuv : 0,
				xaf: 0,
				xdr: 5,
				xof: 0,
				xpf: 0
			},
	"updated" : "2014-08-28", "currencies" : {
	"AED": "United Arab Emirates Dirham",
	"AFN": "Afghan Afghani",
	"ALL": "Albanian Lek",
	"AMD": "Armenian Dram",
	"ANG": "Netherlands Antillean Guilder",
	"AOA": "Angolan Kwanza",
	"ARS": "Argentine Peso",
	"AUD": "Australian Dollar",
	"AWG": "Aruban Florin", 
	"AZN": "Azerbaijani Manat",
	"BAM": "Bosnia-Herzegovina Convertible Mark",
	"BBD": "Barbadian Dollar",
	"BDT": "Bangladeshi Taka",
	"BGN": "Bulgarian Lev",
	"BHD": "Bahraini Dinar",
	"BIF": "Burundian Franc",
	"BMD": "Bermudan Dollar",
	"BND": "Brunei Dollar",
	"BOB": "Bolivian Boliviano",
	"BRL": "Brazilian Real",
	"BSD": "Bahamian Dollar",
	"BTC": "Bitcoin",
	"BTN": "Bhutanese Ngultrum",
	"BWP": "Botswanan Pula",
	"BYR": "Belarusian Ruble",
	"BZD": "Belize Dollar",
	"CAD": "Canadian Dollar",
	"CDF": "Congolese Franc",
	"CHF": "Swiss Franc",
	"CLF": "Chilean Unit of Account (UF)",
	"CLP": "Chilean Peso",
	"CNY": "Chinese Yuan",
	"COP": "Colombian Peso",
	"CRC": "Costa Rican Colón",
	"CUP": "Cuban Peso",
	"CVE": "Cape Verdean Escudo",
	"CZK": "Czech Republic Koruna",
	"DJF": "Djiboutian Franc",
	"DKK": "Danish Krone",
	"DOP": "Dominican Peso",
	"DZD": "Algerian Dinar",
	"EEK": "Estonian Kroon",
	"EGP": "Egyptian Pound",
	"ERN": "Eritrean Nakfa",
	"ETB": "Ethiopian Birr",
	"EUR": "Euro",
	"FJD": "Fijian Dollar",
	"FKP": "Falkland Islands Pound",
	"GBP": "British Pound Sterling",
	"GEL": "Georgian Lari",
	"GGP": "Guernsey Pound",
	"GHS": "Ghanaian Cedi",
	"GIP": "Gibraltar Pound",
	"GMD": "Gambian Dalasi",
	"GNF": "Guinean Franc",
	"GTQ": "Guatemalan Quetzal",
	"GYD": "Guyanaese Dollar",
	"HKD": "Hong Kong Dollar",
	"HNL": "Honduran Lempira",
	"HRK": "Croatian Kuna",
	"HTG": "Haitian Gourde",
	"HUF": "Hungarian Forint",
	"IDR": "Indonesian Rupiah",
	"ILS": "Israeli New Sheqel",
	"IMP": "Manx pound",
	"INR": "Indian Rupee",
	"IQD": "Iraqi Dinar",
	"IRR": "Iranian Rial",
	"ISK": "Icelandic Króna",
	"JEP": "Jersey Pound",
	"JMD": "Jamaican Dollar",
	"JOD": "Jordanian Dinar",
	"JPY": "Japanese Yen",
	"KES": "Kenyan Shilling",
	"KGS": "Kyrgystani Som",
	"KHR": "Cambodian Riel",
	"KMF": "Comorian Franc",
	"KPW": "North Korean Won",
	"KRW": "South Korean Won",
	"KWD": "Kuwaiti Dinar",
	"KYD": "Cayman Islands Dollar",
	"KZT": "Kazakhstani Tenge",
	"LAK": "Laotian Kip",
	"LBP": "Lebanese Pound",
	"LKR": "Sri Lankan Rupee",
	"LRD": "Liberian Dollar",
	"LSL": "Lesotho Loti",
	"LTL": "Lithuanian Litas",
	"LVL": "Latvian Lats",
	"LYD": "Libyan Dinar",
	"MAD": "Moroccan Dirham",
	"MDL": "Moldovan Leu",
	"MGA": "Malagasy Ariary",
	"MKD": "Macedonian Denar",
	"MMK": "Myanma Kyat",
	"MNT": "Mongolian Tugrik",
	"MOP": "Macanese Pataca",
	"MRO": "Mauritanian Ouguiya",
	"MTL": "Maltese Lira",
	"MUR": "Mauritian Rupee",
	"MVR": "Maldivian Rufiyaa",
	"MWK": "Malawian Kwacha",
	"MXN": "Mexican Peso",
	"MYR": "Malaysian Ringgit",
	"MZN": "Mozambican Metical",
	"NAD": "Namibian Dollar",
	"NGN": "Nigerian Naira",
	"NIO": "Nicaraguan Córdoba",
	"NOK": "Norwegian Krone",
	"NPR": "Nepalese Rupee",
	"NZD": "New Zealand Dollar",
	"OMR": "Omani Rial",
	"PAB": "Panamanian Balboa",
	"PEN": "Peruvian Nuevo Sol",
	"PGK": "Papua New Guinean Kina",
	"PHP": "Philippine Peso",
	"PKR": "Pakistani Rupee",
	"PLN": "Polish Zloty",
	"PYG": "Paraguayan Guarani",
	"QAR": "Qatari Rial",
	"RON": "Romanian Leu",
	"RSD": "Serbian Dinar",
	"RUB": "Russian Ruble",
	"RWF": "Rwandan Franc",
	"SAR": "Saudi Riyal",
	"SBD": "Solomon Islands Dollar",
	"SCR": "Seychellois Rupee",
	"SDG": "Sudanese Pound",
	"SEK": "Swedish Krona",
	"SGD": "Singapore Dollar",
	"SHP": "Saint Helena Pound",
	"SLL": "Sierra Leonean Leone",
	"SOS": "Somali Shilling",
	"SRD": "Surinamese Dollar",
	"STD": "São Tomé and Príncipe Dobra",
	"SVC": "Salvadoran Colón",
	"SYP": "Syrian Pound",
	"SZL": "Swazi Lilangeni",
	"THB": "Thai Baht",
	"TJS": "Tajikistani Somoni",
	"TMT": "Turkmenistani Manat",
	"TND": "Tunisian Dinar",
	"TOP": "Tongan Paʻanga",
	"TRY": "Turkish Lira",
	"TTD": "Trinidad and Tobago Dollar",
	"TWD": "New Taiwan Dollar",
	"TZS": "Tanzanian Shilling",
	"UAH": "Ukrainian Hryvnia",
	"UGX": "Ugandan Shilling",
	"USD": "United States Dollar",
	"UYU": "Uruguayan Peso",
	"UZS": "Uzbekistan Som",
	"VEF": "Venezuelan Bolívar Fuerte",
	"VND": "Vietnamese Dong",
	"VUV": "Vanuatu Vatu",
	"WST": "Samoan Tala",
	"XAF": "CFA Franc BEAC",
	"XAG": "Silver (troy ounce)",
	"XAU": "Gold (troy ounce)",
	"XCD": "East Caribbean Dollar",
	"XDR": "Special Drawing Rights",
	"XOF": "CFA Franc BCEAO",
	"XPF": "CFP Franc",
	"YER": "Yemeni Rial",
	"ZAR": "South African Rand",
	"ZMK": "Zambian Kwacha (pre-2013)",
	"ZMW": "Zambian Kwacha",
	"ZWL": "Zimbabwean Dollar"
	},

	 "rates" : {
  "disclaimer": "Exchange rates are provided for informational purposes only, and do not constitute financial advice of any kind. Although every attempt is made to ensure quality, NO guarantees are given whatsoever of accuracy, validity, availability, or fitness for any purpose - please use at your own risk. All usage is subject to your acceptance of the Terms and Conditions of Service, available at: https://openexchangerates.org/terms/",
  "license": "Data sourced from various providers with public-facing APIs; copyright may apply; resale is prohibited; no warranties given of any kind. Bitcoin data provided by http://coindesk.com. All usage is subject to your acceptance of the License Agreement available at: https://openexchangerates.org/license/",
  "timestamp": 1409212845,
  "base": "USD",
  "rates": {
    "AED": 3.672978,
    "AFN": 56.215025,
    "ALL": 105.578399,
    "AMD": 413.214002,
    "ANG": 1.78712,
    "AOA": 97.59955,
    "ARS": 8.402669,
    "AUD": 1.069008,
    "AWG": 1.7875,
    "AZN": 0.783967,
    "BAM": 1.482504,
    "BBD": 2,
    "BDT": 77.42372,
    "BGN": 1.481566,
    "BHD": 0.376987,
    "BIF": 1549.656667,
    "BMD": 1,
    "BND": 1.247356,
    "BOB": 6.906574,
    "BRL": 2.249762,
    "BSD": 1,
    "BTC": 0.0019499305,
    "BTN": 60.460613,
    "BWP": 8.880836,
    "BYR": 10427.433333,
    "BZD": 1.997392,
    "CAD": 1.086658,
    "CDF": 922.933329,
    "CHF": 0.914285,
    "CLF": 0.02446,
    "CLP": 589.732301,
    "CNY": 6.146079,
    "COP": 1914.38,
    "CRC": 540.065505,
    "CUP": 0.999228,
    "CVE": 83.169074,
    "CZK": 20.9935,
    "DJF": 178.280119,
    "DKK": 5.646654,
    "DOP": 43.38471,
    "DZD": 80.27575,
    "EEK": 11.859725,
    "EGP": 7.151735,
    "ERN": 15.062575,
    "ETB": 19.85484,
    "EUR": 0.757307,
    "FJD": 1.851845,
    "FKP": 0.602828,
    "GBP": 0.602828,
    "GEL": 1.74745,
    "GGP": 0.602828,
    "GHS": 3.795454,
    "GIP": 0.602828,
    "GMD": 39.763,
    "GNF": 6924.883333,
    "GTQ": 7.772858,
    "GYD": 204.503749,
    "HKD": 7.749921,
    "HNL": 21.04554,
    "HRK": 5.780833,
    "HTG": 44.8831,
    "HUF": 237.222899,
    "IDR": 11708.983333,
    "ILS": 3.559836,
    "IMP": 0.602828,
    "INR": 60.46453,
    "IQD": 1177.495067,
    "IRR": 26408.666667,
    "ISK": 116.611999,
    "JEP": 0.602828,
    "JMD": 112.510901,
    "JOD": 0.708448,
    "JPY": 103.8186,
    "KES": 88.3948,
    "KGS": 52.689,
    "KHR": 4066.4331,
    "KMF": 371.432934,
    "KPW": 900,
    "KRW": 1014.906664,
    "KWD": 0.284482,
    "KYD": 0.826512,
    "KZT": 181.951299,
    "LAK": 8053.141667,
    "LBP": 1511.773333,
    "LKR": 130.2093,
    "LRD": 91.50915,
    "LSL": 10.64616,
    "LTL": 2.615468,
    "LVL": 0.532142,
    "LYD": 1.227869,
    "MAD": 8.446568,
    "MDL": 13.88779,
    "MGA": 2540.283333,
    "MKD": 46.65397,
    "MMK": 971.5014,
    "MNT": 1820.333333,
    "MOP": 7.984986,
    "MRO": 293.41664,
    "MTL": 0.683738,
    "MUR": 30.87668,
    "MVR": 15.36198,
    "MWK": 395.551798,
    "MXN": 13.09403,
    "MYR": 3.149992,
    "MZN": 30.413025,
    "NAD": 10.6357,
    "NGN": 162.011201,
    "NIO": 26.14555,
    "NOK": 6.175818,
    "NPR": 96.83633,
    "NZD": 1.192104,
    "OMR": 0.384997,
    "PAB": 1,
    "PEN": 2.837857,
    "PGK": 2.46108,
    "PHP": 43.71384,
    "PKR": 101.6797,
    "PLN": 3.183847,
    "PYG": 4275.005026,
    "QAR": 3.641389,
    "RON": 3.330302,
    "RSD": 89.206421,
    "RUB": 36.36599,
    "RWF": 689.8978,
    "SAR": 3.750136,
    "SBD": 7.25624,
    "SCR": 12.87201,
    "SDG": 5.69826,
    "SEK": 6.948494,
    "SGD": 1.247512,
    "SHP": 0.602828,
    "SLL": 4383.333333,
    "SOS": 840.333333,
    "SRD": 3.275,
    "STD": 18583.7,
    "SVC": 8.745592,
    "SYP": 152.271176,
    "SZL": 10.63948,
    "THB": 31.91653,
    "TJS": 4.97435,
    "TMT": 2.8501,
    "TND": 1.734998,
    "TOP": 1.88242,
    "TRY": 2.160934,
    "TTD": 6.343262,
    "TWD": 29.89941,
    "TZS": 1667.866667,
    "UAH": 13.753925,
    "UGX": 2613.14,
    "USD": 1,
    "UYU": 24.08361,
    "UZS": 2348.020007,
    "VEF": 6.29095,
    "VND": 21196.25,
    "VUV": 94.732501,
    "WST": 2.320439,
    "XAF": 497.470972,
    "XAG": 0.05113998,
    "XAU": 0.00077593,
    "XCD": 2.70162,
    "XDR": 0.658463,
    "XOF": 497.86642,
    "XPF": 90.543739,
    "YER": 214.937,
    "ZAR": 10.64123,
    "ZMK": 5252.024745,
    "ZMW": 6.013175,
    "ZWL": 322.355006
  }
} 
}

dojoConfig = {
	async: true,
	gfxRenderer: "canvas,svg,silverlight,vml,canvasWithEvents",
	locale: localStorage ? (localStorage.getItem('app_locale') ? localStorage.getItem('app_locale') : '' ) : '',
	has: {
		"dojo-firebug": false
	},
	baseUrl: "js/finance-release/",
	mblUserAgent: window.AppData.theme,
	
	tlmSiblingOfDojo: false,
	packages: [
		{ name: "dojo",  location: "dojo" },
		{ name: "dijit", location: "dijit" },
		{ name: "dojox", location: "dojox" },
		{ name: "money", location: "money", main: "common" },
		{ name: "etc", location: "etc", main: "money-exchange.min" }
	]
};


/*
*  Trim string
*/
String.prototype.fulltrim=function(){return this.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g,'').replace(/\s+/g,' ');};

if (!Array.isArray) {
  Array.isArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
}
	
function trim( str, charlist ) {
	charlist = !charlist ? ' \s\xA0' : charlist.replace(/([\[\]\(\)\.\?\/\*\{\}\+\$\^\:])/g, '\$1');
	var re = new RegExp('^[' + charlist + ']+|[' + charlist + ']+$', 'g');
	return str.replace(re, '');
}

/*
*	Remove item from array
*/
function remove(obj, from, to) {
	var rest = obj.slice((to || from) + 1 || this.length);
	obj.length = from < 0 ? obj.length + from : from;
	return obj.push.apply(obj, rest);
};

/*
*	true if argument is [object Date]
*/
function isValidDate(d) {
	if ( Object.prototype.toString.call(d) !== "[object Date]" )
		return false;
	return !isNaN(d.getTime());
}
		
/*
 * 	Get formatted float number
 */ 
function getNumber(f, dec){
	return Number(f).toFixed( dec != undefined ? dec : 2 )
}
/*
 * Returns formatted machine-readable date as string.
 * Used for id's
 * 
 * Returns d if d is not date
 */ 
function getDateString(d, locale){
	return (isValidDate(d)) ? locale.format(d, { selector:"date", datePattern: window.AppData.widgetDateFormat }) : d
}

/*
 * Returns formatted HUMAN-readable date as string.
 * Used for labels
 * 
 * Returns d if d is not date
 */ 
function getDateStringHr(d, locale){
	return (isValidDate(d)) ? locale.format(d, { selector:"date", datePattern: window.AppData.displayDateFormat }) : d
}
function getDateStringHrWithoutYear(d, locale){
	return (isValidDate(d)) ? locale.format(d, { selector:"date", datePattern: 'd MMM' }) : d
}

function getDateStringHrWithYear(d, locale){
	return (isValidDate(d)) ? locale.format(d, { selector:"date", datePattern: 'd MMM yyyy' }) : d
}

/*
 * parses date from machine-readable date string
 */ 
function getDate(ds, locale){
	return locale.parse(ds, {selector:"date", datePattern: window.AppData.widgetDateFormat})
}

/*
 * returns formatted human-readable money string
 * params:
 *		@amount		: amount of money )
 * 		@currency 	: ISO 3-letteres currency
 * TODO : window.AppData.localeCurrency ??
 */ 
function getMoney(amount, currency){
	var currency = currency || window.AppData.currency, symbol
	//var symbol = ( (dojo.locale.indexOf('-ru') > -1 && currency == "RUB") ? "руб": ( currency == "RUB" ? "RUB " : undefined ) );
	var curList = ['btc','jpy','rub', 'usd', 'gbp', 'krw', 'try', 'inr','eur']
	
	for(var i=0; i< curList.length; i++)
		if (currency && currency.toLowerCase() == curList [i]) {
			symbol = '<i class="fa-money fa-small fa fa-' + currency.toLowerCase() + '"></i>';
			break;
		}
	
	var amount = getNumber( amount, ( window.AppData.zeroCounts [currency] ? window.AppData.zeroCounts [currency] : 2) );
	if (symbol)
		return window.AppData.localeCurrency.format(amount, {'currency': currency, 
			symbol : symbol
		})
	else
		return window.AppData.localeCurrency.format(amount, {'currency': currency});
	
}


function goToSummary(){
	goTo('summary');
}

function goTo(where, whereExactly) {
	window.dFinance.transitionToView(window.dFinance.selectedChildren.center.domNode,{
		target: where,
		transitionDir: 1,
		params : whereExactly
	})	
}

function goToSettings(){
	window.dFinance.transitionToView(window.dFinance.selectedChildren.center.domNode,{
		target: window.AppData.isInitiallySmall ? 'navigation' : "navigation",
		transitionDir: -1,
		params : {}
	})	
}

function confirmExit(){
	document.getElementById('confirm-exit').innerHTML = dojo.locale.indexOf('-ru') > -1 ? '<p><span>Нажмите <b>"Назад"</b> еще раз для выхода</span></p>' : '<p><span>Tap <b>back</b> button once more to exit</span></p>'
	location.hash += "&confirmexit";
	
	var s = document.getElementById('confirm-exit').style
	var opacityIn = 0
	s.opacity = opacityIn;
	s.display = "block";
	
	( function fadeIn(){ 
		s.opacity =  ( opacityIn += .1);
		if( opacityIn <= 1 ) {
			setTimeout(fadeIn,40);
		}
	})();
	
	var opacity = 1
	setTimeout(function(){
		s.opacity = opacity; 
		(function fadeOut(){ 
			s.opacity = ( opacity -= .1) ;
			if ( opacity < 0.1 ) {
				s.display = "none";
				s.opacity = 0;
			}
			else
				setTimeout( fadeOut, 40 ) ;
		})();
	}, 2500)
}

function loadGa(){
	//GOogLe Analytics
	if( location.toString().indexOf('r5m.github.io') > -1 && location.protocol.indexOf("https") >-1 ) {
		(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
			(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
			m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
			})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

		ga('create', 'UA-39804194-5', 'auto');
		ga('send', 'pageview');
		 
	}
}

loadExchangeRates = function( json ) {
			require(["dojo/request/xhr"], function(request){
				request("currencies.json").then(function(data){
					window.AppData.updated = json.parse( data ).updated
					window.AppData.currencies = json.parse( data ).currencies
					if(!!localStorage) {
						localStorage.setItem( 'currencies', json.stringify(window.AppData.currencies) )
						localStorage.setItem( 'updated', json.stringify(window.AppData.updated) )
					}
					//if(!window.ga)
						//loadGa();
					// do something with handled data
				}, function(err){
					
				// handle an error condition
				}, function(evt){
				// handle a progress event
				});
			});

			var setupExchangeRates = function() {
				if ( typeof fx !== "undefined" && fx.rates ) {
					fx.rates = window.AppData.rates ? window.AppData.rates.rates : json.parse( localStorage.getItem( 'rates' ) ).rates;
					fx.base = window.AppData.rates ? window.AppData.rates.base : json.parse( localStorage.getItem( 'rates' ) ).base;
				} else {
					// If not, apply to fxSetup global:
					fxSetup = {
						rates : window.AppData.rates.rates,
						base : window.AppData.rates.base
					}
				}
			}
			if(!!window.AppData.rates || !!localStorage.getItem( 'rates' ))
				setupExchangeRates();
			
			require(["dojo/request/xhr"], function(request){
				request("rates.json").then(function(data){				
					window.AppData.rates = json.parse( data ).rates;
					if(!!localStorage) {
						localStorage.setItem( 'rates', json.stringify(window.AppData.rates) )
					}
					setupExchangeRates();
					// do something with handled data
				}, function(err){
					
				// handle an error condition
				}, function(evt){
				// handle a progress event
				});
			});
		}

function errorInitialization() {
	if(window.AppData.dialogWindow)
		window.AppData.dialogWindow.show(false,
			'Your browser is not supported. Application won\'t work, because HTML5 local storage is not available',
			'Unsupported device', 'Close');			
	if(window.AppData.lang)
		document.getElementById('app-state').innerHTML =
			( window.AppData.lang.indexOf('ru') > -1 || navigator.language.indexOf('ru')) ? "Ошибка инициализации" : "Initialization error"
}

 function openNewWindow(e){
                e.stopPropagation()
                if (e.preventDefault) {  // если метод существует
                    e.preventDefault();
                } else { // вариант IE<9:
                    e.returnValue = false;
                }
                console.log(e)
                window.open(e.currentTarget.href, "_blank")
            }




