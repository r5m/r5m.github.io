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
}

dojoConfig = {
	async		: true,
	gfxRenderer	: "canvas,svg,silverlight,vml,canvasWithEvents",
	locale		: localStorage ? (localStorage.getItem('app_locale') ? localStorage.getItem('app_locale') : '' ) : '',
	has	: {
		"dojo-firebug": false
	},
	mblUserAgent: window.AppData.theme,
	//baseUrl: "js/finance-release/",
	baseUrl		: "js/",
	tlmSiblingOfDojo: false,
	packages	: [
		{ name: "dojo",  location: "dojo" },
		{ name: "dijit", location: "dijit" },
		{ name: "dojox", location: "dojox" },
		{ name: "money", location: "money", main: "common" },
		{ name: "etc", 	 location: "etc", 	main: "money-exchange.min" }
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
function getNumber(f){
	return Number(f).toFixed(2)
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


loadExchangeRates = function( json ) {
			require(["dojo/request"], function(request){
				request("currencies.json").then(function(data){
					window.AppData.updated = json.parse( data ).updated
					window.AppData.currencies = json.parse( data ).currencies
					if(!!localStorage) {
						localStorage.setItem( 'currencies', json.stringify(window.AppData.currencies) )
						localStorage.setItem( 'updated', json.stringify(window.AppData.updated) )
					}
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

					console.log(fx.rates, fx.base)
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
			
			require(["dojo/request"], function(request){
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
