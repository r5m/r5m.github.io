//This script should be loaded as early as possible

window.AppData = {
	tplPath 	: "app/", //location of page templates
	defaultView : location.hash ? (location.hash =="#" ? "app-transactions" :location.hash.substr(1,location.hash.length-1)) : "app-transactions", //which template should be loaded in window.onload
	
	appTheme	: (!!localStorage) ? (localStorage.getItem("appTheme") ? localStorage.getItem("appTheme") : 'light') : 'light',
	currency 	: localStorage.getItem("currency") ? localStorage.getItem("currency") : false,
	currentDate	: new Date(),
	currentType	: 'e',
	currentId	: -1,
	timespan 	: (!!localStorage) ? (localStorage.getItem("timespan") ? localStorage.getItem("timespan") : 'last31') : 'last31',
	theme		: (!!localStorage) ? (localStorage.getItem("theme") ? localStorage.getItem("theme") : 'Custom') : 'Custom',
	lang 		: (!!localStorage) ? (localStorage.getItem("lang") ? localStorage.getItem("lang") : 'no_lang') : 'no_lang',
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
	async: true,
	gfxRenderer: "canvas,svg,silverlight,vml,canvasWithEvents",
	locale: localStorage ? (localStorage.getItem('app_locale') ? localStorage.getItem('app_locale') : '' ) : '',
	has: {
		"dojo-firebug": false
	},
	baseUrl: "js/finance-release/",
	
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
	var currency = currency || window.AppData.currency
	return window.AppData.localeCurrency.format(amount, {'currency': currency, 
		symbol : ( (dojo.locale.indexOf('-ru') > -1 && currency == "RUB") ? "руб": ( currency == "RUB" ? "RUB " : undefined ) )
	})// + '<i class="fa-money fa-small fa fa-'+currency+'"></i>'
}

function goToSettings(){
	location.assign('#navigation');
}

function confirmExit(){
	location.hash += "&confirmexit";
	
	var s = document.getElementById('confirm-exit').style
	s.opacity = 0;
	s.display = "block";
	
	( function fadeIn(){ 
		//console.log(document.getElementById('confirm-exit').style.opacity);
		s.opacity =  Number(s.opacity) + .1;
		if( s.opacity <= 1 ) {
			setTimeout(fadeIn,40);
		}
	})();
	
	setTimeout(function(){
		s.opacity = 1; 
		(function fadeOut(){ 
			s.opacity = Number(s.opacity) - .1;
			console.log(Number (s.opacity));
			if ( Number( s.opacity ) < 0.1 ) {
				s.display = "none";
				s.opacity = 0;
			}
			else
				setTimeout( fadeOut, 40 ) 
		})();
	}, 2500)
}
