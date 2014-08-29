// we use 'define' and not 'require' to workaround Dojo build system
// limitation that prevents from making of this file a layer if it
// using 'require'
define([
	"dojo/sniff",
	"dojo/_base/declare",
	"dojo/json",
	"dojo/dom-class",
	"dojo/currency",
	"dojo/text!./conf.json",
	'dojo/date/locale',
	'dojo/date',
	
	"dojox/app/main",
	"dojo/hash",
	"dojox/mobile/SimpleDialog",
	'money/numberpicker',
	"money/dialog",
	"money/BaseView",
	
],
	function(has, declare, json, domClass, currency, config, locale, dojodate, Application, hash, Dlg, NumberPicker, Dialog, BaseView){

		window.AppData.defaultHash = hash();
		hash("");
		
		window.AppData.BaseViewClass = BaseView		
		window.AppData.dialogWindow = new Dialog;		
		window.AppData.localeCurrency = currency;	

		if(!window.localStorage) {
			errorInitialization();
			return;		
		} 
		
		var small = 560, appConf = json.parse(config);
		// large > 860 medium <= 860  small <= 560 
		var isSmall = function(){				
			var width = window.innerWidth || document.documentElement.clientWidth;
			var height = window.innerHeight || document.documentElement.clientHeight;
			return !(width > small && height > small);
		};

		has.add("isInitiallySmall", isSmall());
		has.add("html5history", !has("ie") || has("ie") > 9);
		
		if(has("isInitiallySmall")){
			window.AppData.isInitiallySmall = true
			for(var i in appConf.views)
				appConf.views[i].constraint 	= "center"
			appConf.defaultView = "summary"
		}
		
		appConf.transition = localStorage.getItem( 'transition' ) ? localStorage.getItem( 'transition' ) : 'slide'
		appConf.defaultTransition = localStorage.getItem( 'transition' ) ? localStorage.getItem( 'transition' ) : 'slide'
		loadExchangeRates( json );

		
		
            
        
        if(localStorage.getItem('dateFrom')){
			window.AppData.dateFrom = getDate( localStorage.getItem('dateFrom'), locale )
			window.AppData.timespanMonth = getDateString(dojodate.add( window.AppData.dateFrom, 'day', 1), locale).substr(0,7) + '-01'
		}
		if(localStorage.getItem('timespan') == "customTimespan"){
			window.AppData.timespanMonth = getDateString(new Date, locale).substr(0,7) + '-01'
			window.AppData.dateFrom = dojodate.add(getDate(window.AppData.timespanMonth, locale), 'day', -1)
			
		}
		if(window.AppData.dateFrom){
			var daysInMonth = dojodate.getDaysInMonth(dojodate.add(window.AppData.dateFrom ,'day', 1));
			window.AppData.dateTo = dojodate.add(window.AppData.dateFrom, 'day', daysInMonth+1)
		}

		Application(appConf);
		var dlg = new Dlg({},'customPicker')
		
		
		
		if(!window.AppData.numberPicker){
			window.AppData.numberPicker = new NumberPicker({},'numberPicker')			
			window.AppData.numberPicker.startup()
		}


		
});
