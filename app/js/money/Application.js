// we use 'define' and not 'require' to workaround Dojo build system
// limitation that prevents from making of this file a layer if it
// using 'require'
define([
	"dojo/sniff",
	"dojo/_base/declare",
	"dojo/json",
	"dojo/dom-class",
	"dojo/currency",
	"dojo/text!./conf.json", 'dojo/date/locale','dojo/date',
	
	 "dojox/app/main", "dojo/hash","dojox/mobile/SimpleDialog",'money/numberpicker',"money/dialog",
	 "dojox/mobile/Button","dojox/mobile/Pane","dojox/mobile/GridLayout","dojox/mobile/ToolBarButton","dojo/_base/declare","dijit/registry",
	],
	function(has, declare, json, domClass, currency, config, locale, dojodate, Application, hash, Dlg, NumberPicker, Dialog){
		
		hash("");

		window.AppData.BaseViewClass = declare(null, {

			hideProgress : function(){
				console.log('hide progress')
				require(["dojo/dom-style","dojo/_base/fx"], function(domStyle, fx){
					fx.fadeOut({
						node: 'main-progress-bar',
						duration: 500
					}).play();
					setTimeout(function(){
						domStyle.set('main-progress-bar','display','none')
					}, 500)
				})
			},

			showProgress : function(){
				console.log('show progress')
				require(["dojo/dom-style","dojo/_base/fx"], function(domStyle, fx){
					domStyle.set('main-progress-bar','display','block')
					fx.fadeIn({
						node: 'main-progress-bar',
						duration: 200
					}).play()
				})
			},
			
			//if this view is loaded when application starts
			afterActivate: function(){
				this.hideProgress ? this.hideProgress() : this._baseView.hideProgress();
			},

			/*
			 * Template for right text of list item
			 */ 
			_accountTemplate:
				'<div>'+
					'<span class="transaction-amount">${amount}</span>'+
					'<span class="transaction-account">${account}</span>'+
				'</div>',

			_getDate : function(date, to, pattern){
				var to = to || "EEE dd MMM yyyy"
				var pattern = pattern || window.AppData.widgetDateFormat
				var date2 = isValidDate(date) ? date : locale.parse(date, {selector:"date", datePattern:pattern})
				return this.capitalize(locale.format(date2, {selector:"date", datePattern:to}))
			},
			
			/*
			 *  Substitute ${var} in template with data[var]
			 * 	Substitute ${!var} with capitalized version of data[var]
			 */
			substitute: function(template, data) {
				var self = this
				return template.replace(/\$\{([^\s\:\}]+)(?:\:([^\s\:\}]+))?\}/g, function(match, key){
					if(data[key]!=undefined || (key.substr(0,1) == "!" && data[key.substr(1)]))
						return (key.substr(0,1)=="!" ? self.capitalize(data[key.substr(1)]):data[key])
					return "";	
				});
			},
			
			/*
			 * make str[0] bigger :-)
			 */ 
			capitalize: function(str){
				return str.substr(0,1).toUpperCase() + str.substr(1,str.length-1)//.toLowerCase()
			},

			constructor: function( parent ){
				var predefined = ['capitalize','substitute','_getDate','_accountTemplate','afterActivate']
				parent._isInheritedFromBaseView = true;
				parent._baseView = this;
				for(var i = 0; i < predefined.length; i ++) {
					if(!parent[ predefined[i] ] || predefined[i] == 'afterActivate') {
						parent[ predefined[i] ] = this [ predefined[i] ]
					}
				}				
			}
		});
		
		window.AppData.localeCurrency = currency;	
		window.AppData.dialogWindow = new Dialog;
		
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
