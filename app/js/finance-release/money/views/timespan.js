define("money/views/timespan", [
	"dojo/json","dijit/registry","dojo/on","dojo/dom-style","dojo/dom-class",'dojo/date',
	"dojo/sniff","dojox/mobile/ProgressIndicator","dojo/_base/array",
	"dojox/mobile/Button", "dojo/date/locale","money/dialog","dojox/mobile/SimpleDialog", "dojox/mobile/SpinWheelDatePicker",'dojox/mobile/ToolBarButton'
 ],
    function(json, registry, on, domStyle, domClass, dojodate, has, ProgressIndicator, arrayUtil,Button, locale, Dialog, SD, SpinWheelDatePicker){
    
	return window.AppData.objBackup = {
		beforeActivate: function(){			
			
        },
        afterActivate: function(){
 			
 		},
        init: function(){
			window.AppData.timespanObj = this
			if(!has('isInitiallySmall'))
				domClass.add(this.backButton.domNode,'hideOnMedium hideOnLarge')
			var self = this
			window.AppData.timespan = localStorage.getItem('timespan') ? localStorage.getItem('timespan') : 'last31';
			
			this.last31.set('checked', false)
			this.lastMonth.set('checked', false)
			this.customTimespan.set('checked', false)
			this[window.AppData.timespan].set('checked', true)
			
			this.timespanPicker = new SpinWheelDatePicker( {id:"timespanPicker"}, "timespanPicker");
			
			
			var initialDate = window.AppData.dateFrom ? window.AppData.dateFrom : new Date
			var initialDateString = window.AppData.timespanMonth ? window.AppData.timespanMonth : getDateString(window.AppData.dateFrom ? window.AppData.dateFrom : new Date, locale).substr(0,7) + '-01'
				
			var setMonthTimespan = function(doNotSave) {
				var initialDateString = window.AppData.timespanMonth ? window.AppData.timespanMonth : getDateString(new Date, locale).substr(0,7) + '-01'
				var from = new Date( Number( initialDateString.substr(0,4) ), Number (initialDateString.substr(5,2) ) - 1, Number( initialDateString.substr(8,2) ));
				var daysInMonth = dojodate.getDaysInMonth(from) 
				window.AppData.dateFrom		 = dojodate.add( from, "day", -1);
				window.AppData.dateTo 		 = dojodate.add( from, "day", daysInMonth );				
				self[!doNotSave ? 'lastMonth' : 'customTimespan'].set( 'rightText', getDateStringHr( from, locale ) + ' - ' + getDateStringHr( dojodate.add( from, "day", daysInMonth -1), locale ) + '&nbsp;&nbsp;' )
				self[!doNotSave ? 'customTimespan' : 'lastMonth'].set( 'rightText', '' );
				
				if(!doNotSave)
					localStorage.setItem('dateFrom', getDateString(window.AppData.dateFrom, locale) )
				else
					localStorage.removeItem('dateFrom')
			}
			
			if(window.AppData.timespan == 'lastMonth' || window.AppData.timespan == 'customTimespan')
				setMonthTimespan(window.AppData.timespan == 'customTimespan')
						
			var _applyTimespanToSummaryPage = function() {
				registry.byId('summary-list').refresh();
			}
			on(this.okButton,'click',function(){
				window.AppData.timespanMonth = self.timespanPicker.get('value')
				setMonthTimespan();
				self.timespanOverlay.hide()
				_applyTimespanToSummaryPage();
			})
			
			on(this.last31,'click',function(){
				self.applyTs31()
				localStorage.removeItem('dateFrom')
				_applyTimespanToSummaryPage();
			})
			on(this.lastMonth,'click',function(){
				self.applyTsMonth()				
				self.timespanOverlay.show();
				self.timespanPicker.startup();
				self.timespanPicker.set('value',window.AppData.timespanMonth ? window.AppData.timespanMonth : initialDateString )
			})
			on(this.customTimespan,'click',function(){
				self.applyTsCustom();
				window.AppData.timespanMonth = getDateString(new Date, locale).substr(0,7) + '-01'
				setMonthTimespan(true);
				_applyTimespanToSummaryPage();
			})
			on(this.noneTimespan,'click',function(){
				self.applyTsNone()
				_applyTimespanToSummaryPage();
			})
        },
		applyTs31:function(){
			console.log('31')
			window.AppData.timespan = 'last31'
			var daysInMonth = dojodate.getDaysInMonth(new Date);
			window.AppData.dateFrom		 = undefined;
			window.AppData.dateTo		 = undefined;
			localStorage.setItem( 'timespan', 'last31' )		
		},
		applyTsMonth:function(){
			console.log('Month')
			window.AppData.timespan = 'lastMonth'
			localStorage.setItem('timespan','lastMonth')
		},
		applyTsCustom:function(){
			window.AppData.timespan = 'customTimespan'
			localStorage.setItem('timespan','customTimespan')
			console.log('custom')
		},
		applyTsNone:function(){
			window.AppData.timespan = 'noneTimespan'
			localStorage.setItem('timespan','noneTimespan')
			console.log('none')
		}
		
	};
});
