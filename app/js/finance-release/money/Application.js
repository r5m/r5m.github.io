require({cache:{
'url:money/conf.json':"{\n    \"id\": \"dFinance\",\n    \"dependencies\": [\n        \"dojox/mobile/Heading\",\n        \"dojox/app/widgets/Container\",\n        \"dojox/mobile/EdgeToEdgeCategory\",\n        \"dojox/mobile/RoundRectCategory\",\n        \"dojox/mobile/EdgeToEdgeList\",\n        \"dojox/mobile/RoundRect\",\n        \"dojox/mobile/ScrollableView\",\n        \"dojox/mobile/ScrollablePane\",\n\t\t\"dojox/app/widgets/Container\",\n        \"dojox/mobile/ToolBarButton\",\n        \"dojox/mobile/Switch\" ,\n        \"money/store\",\n        \"money/WheelScrollableView\",\n        \"dojox/mobile/ExpandingTextArea\",\n        \"dojox/mobile/TextBox\",\n        \"dojox/mobile/Pane\",\n        \"dijit/_WidgetBase\",\n        \"dijit/_WidgetsInTemplateMixin\",\n        \"dojox/mobile/SimpleDialog\",\n        \"dijit/_TemplatedMixin\",\n        \"dojox/mobile/Opener\",\n        \"dojox/mobile/Tooltip\",\n        \"dojox/mobile/FormLayout\",\n        \"dojox/mobile/TabBar\",\n        \"dojox/mobile/TabBarButton\",\n        \"dojox/mobile/GridLayout\",\n        \"dojox/mobile/TextBox\",\n        \"dojox/mobile/SpinWheelDatePicker\",\n        \"dojox/mobile/TextArea\",\n        \"dojox/mobile/Button\",\n        \"dojox/mobile/ContentPane\",\n        \"dojox/mobile/RoundRectStoreList\",        \n        \"dojox/mobile/Icon\"\n    ],\n    \"nls\"\t\t\t\t: \"money/nls/app.nls\",\n\t\"defaultTransition\"\t: \"fade\",\n\t\"transition\"\t\t: \"fade\",\n\t\"defaultView\"\t\t: \"navigation+summary\",\n    \"controllers\"\t\t: [\n        \"dojox/app/controllers/Load\",\n        \"dojox/app/controllers/Transition\",\n        \"dojox/app/controllers/Layout\"\n    ],\n    \"stores\" : {\n\t\t\"transactions\": {\n\t\t\t\"type\": \"money/store\"\n\t\t}\n\t},\n\t\"views\": {    \n        \"navigation\":{\n\t\t\t\"constraint\"\t: \"left\",\n\t\t\t\"template\"\t\t: \"money/views/navigation.html\",\n\t\t\t\"controller\"\t: \"money/views/navigation\",\n\t\t\t\"nls\"\t\t\t: \"money/nls/navigation\"\n\t\t},\n        \"list\": {\n            \"constraint\"\t: \"center\",\n            \"controller\"\t: \"money/views/list\",\n            \"template\"\t\t: \"money/views/list.html\",\n\t\t\t\"nls\"\t\t\t: \"money/nls/daily\"\n        },\n        \"details\": {\n\t\t\t\"constraint\" \t: \"center\",\n\t\t\t\"controller\"\t: \"money/views/details\",\n\t\t\t\"template\"\t\t: \"money/views/details.html\",\n\t\t\t\"nls\"\t\t\t: \"money/nls/details\"\n\t\t},\n\t\t\"summary\": {\n\t\t\t\"constraint\" \t: \"center\",\n\t\t\t\"controller\"\t: \"money/views/summary\",\n\t\t\t\"template\"\t\t: \"money/views/summary.html\",\n\t\t\t\"nls\"       \t: \"money/nls/summary\"\n\t\t},\n\t\t\"about\": {\n\t\t\t\"constraint\"\t: \"center\",\n\t\t\t\"controller\"\t: \"money/views/about\",\n\t\t\t\"template\"\t\t: \"money/views/about.html\",\n\t\t\t\"nls\"       \t: \"money/nls/about\"\n\t\t},\n\t\t\"charts\": {\n\t\t\t\"constraint\" \t: \"center\",\n\t\t\t\"controller\"\t: \"money/views/charts\",\n\t\t\t\"template\"\t\t: \"money/views/charts.html\",\n\t\t\t\"nls\"       \t: \"money/nls/stats\"\n\t\t},\n\t\t\"tagspicker\": {\n\t\t\t\"constraint\" \t: \"left\",\n\t\t\t\"controller\"\t: \"money/views/tagspicker\",\n\t\t\t\"template\"\t\t: \"money/views/tagspicker.html\",\n\t\t\t\"nls\"       \t: \"money/nls/tagspicker\"\n\t\t},\n\t\t\"accountpicker\": {\n\t\t\t\"constraint\" \t: \"left\",\n\t\t\t\"controller\" \t: \"money/views/accountpicker\",\n\t\t\t\"template\"\t \t: \"money/views/accountpicker.html\",\n\t\t\t\"nls\"       \t: \"money/nls/accountpicker\"\n\t\t},\n\t\t\"backup\": {\n\t\t\t\"constraint\" \t: \"center\",\n\t\t\t\"controller\" \t: \"money/views/backup\",\n\t\t\t\"template\"\t \t: \"money/views/backup.html\",\n\t\t\t\"nls\"       \t: \"money/nls/backup\"\n\t\t},\n\t\t\"settings\": {\n\t\t\t\"constraint\" \t: \"center\",\n\t\t\t\"controller\" \t: \"money/views/settings\",\n\t\t\t\"template\"\t \t: \"money/views/settings.html\",\n\t\t\t\"nls\"\t \t\t: \"money/nls/settings\"\n\t\t\t\n\t\t},\n\t\t\"accounts\": {\n\t\t\t\"constraint\" \t: \"center\",\n\t\t\t\"controller\" \t: \"money/views/accounts\",\n\t\t\t\"template\"\t \t: \"money/views/accounts.html\",\n\t\t\t\"nls\"\t \t\t: \"money/nls/accounts\"\n\t\t},\n\t\t\"tags\": {\n\t\t\t\"constraint\" : \"center\",\n\t\t\t\"controller\" : \"money/views/tags\",\n\t\t\t\"template\"\t : \"money/views/tags.html\",\n\t\t\t\"nls\"\t : \"money/nls/tags\"\n\t\t},\n\t\t\"currencypicker\": {\n\t\t\t\"constraint\" : \"center\",\n\t\t\t\"controller\" : \"money/views/currencypicker\",\n\t\t\t\"template\"\t : \"money/views/currencypicker.html\",\n\t\t\t\"nls\"        : \"money/nls/currency\"\n\t\t},\n\t\t\"timespan\": {\n\t\t\t\"constraint\" : \"center\",\n\t\t\t\"controller\" : \"money/views/timespan\",\n\t\t\t\"template\"\t : \"money/views/timespan.html\",\n\t\t\t\"nls\"\t\t : \"money/nls/timespan\"\n\t\t},\n\t\t\"transitione\": {\n\t\t\t\"constraint\" : \"center\",\n\t\t\t\"controller\" : \"money/views/transition\",\n\t\t\t\"template\"\t : \"money/views/transition.html\"\n\t\t},\n\t\t\"language\": {\n\t\t\t\"constraint\" : \"center\",\n\t\t\t\"controller\" : \"money/views/language\",\n\t\t\t\"template\"\t : \"money/views/language.html\",\n\t\t\t\"nls\"\t\t : \"money/nls/language\"\n\t\t}\n    },\n    \"has\": {\n\t\t\"html5history\": {\n\t\t\t\"controllers\": [\n\t\t\t\t\"dojox/app/controllers/History\"\n\t\t\t]\n\t\t},\n\t\t\"!html5history\": {\n\t\t\t\"controllers\": [\n\t\t\t\t\"dojox/app/controllers/HistoryHash\"\n\t\t\t]\n\t\t}\t\t\n\t}\n}\n"}});
// we use 'define' and not 'require' to workaround Dojo build system
// limitation that prevents from making of this file a layer if it
// using 'require'
define("money/Application", [
	"dojo/sniff", "dojo/json", "dojo/dom-class", "dojo/currency",
	"dojo/text!./conf.json", 'dojo/date/locale','dojo/date',
	
	 "dojox/app/main", "dojo/hash","dojox/mobile/SimpleDialog",'money/numberpicker',
	 "dojox/mobile/Button","dojox/mobile/Pane","dojox/mobile/GridLayout","dojox/mobile/ToolBarButton","dojo/_base/declare","dijit/registry",
	],
	function(has, json, domClass, currency, config, locale, dojodate, Application, hash, Dlg, NumberPicker){
		//new legacyNls()
		/*window.addEventListener('load', function() {
			FastClick.attach(document.body);
		}, false);*/
		//console.log(config)
		hash("")
		window.AppData.localeCurrency = currency
		
		
		
		window.hideProgress = function(){
			console.log('hide progress')
			require(["dojo/dom-style","dojo/_base/fx"], function(domStyle, fx){
				fx.fadeOut({
					node: 'main-progress-bar',
					duration: 500
				}).play()
				setTimeout(function(){
					domStyle.set('main-progress-bar','display','none')
				},500)
			})
		}
		window.showProgress = function(){
			console.log('show progress')
			require(["dojo/dom-style","dojo/_base/fx"], function(domStyle, fx){
				domStyle.set('main-progress-bar','display','block')
				fx.fadeIn({
					node: 'main-progress-bar',
					duration: 200
				}).play()
			})
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
		
		appConf.transition = localStorage.getItem( 'transition' ) ? localStorage.getItem( 'transition' ) : 'none'
		appConf.defaultTransition = localStorage.getItem( 'transition' ) ? localStorage.getItem( 'transition' ) : 'none'
		//window.AppData.currencies = json.parse(currencies)
		//window.AppData.rates = json.parse(rates)
		
		 if ( typeof fx !== "undefined" && fx.rates ) {
                fx.rates = window.AppData.rates.rates;
                fx.base = window.AppData.rates.base;
            } else {
                // If not, apply to fxSetup global:
                fxSetup = {
                    rates : window.AppData.rates.rates,
                    base : window.AppData.rates.base
                }
            }
            
        
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
		console.log('DATE', window.AppData.dateFrom, window.AppData.dateTo)
		Application(appConf);
		var dlg = new Dlg({},'customPicker')
		
		
		
		if(!window.AppData.numberPicker){
			window.AppData.numberPicker = new NumberPicker({},'numberPicker')
			
			window.AppData.numberPicker.startup()
		}
});
