require({cache:{
'url:money/views/timespan.html':"<div class=\"mblBackground\">\n    <div data-dojo-type=\"dojox/mobile/Heading\"\n        data-dojo-props=\"fixed: 'top'\">\n        <button data-dojo-type=\"dojox/mobile/ToolBarButton\"\n            data-dojo-attach-point=\"backButton\"\n            data-dojo-props=\"arrow: 'left', target: 'navigation', transitionDir: -1, transitionOptions: { params: { id: window.AppData.currentDate }}\"\n            style=\"float: left\"\n            class=\"backButton\">${nls.menu}</button>\n    </button>\n    ${nls.title} \n    </div>\n    <div data-dojo-type=\"money/WheelScrollableView\">\n\t\t<div>\n\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t\t${nls.title}\n\t\t\t\t</div><div data-dojo-type=\"dojox/mobile/Pane\">\n\t\t\t\t${nls.help}\n\t\t\t</div>\n\t\t\n\t\t\t<div>\n\t\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t\t${nls.selectTimespan}\n\t\t\t\t</div>\n\t\t\t\t<ul data-dojo-type=\"dojox/mobile/EdgeToEdgeList\" data-dojo-props=\"select:'single'\">\n\t\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"\n\t\t\t\t\t\tdata-dojo-attach-point=\"last31\"\n\t\t\t\t\t\tdata-dojo-props='clickable:true, label:\"${nls.last31}\"'>\n\t\t\t\t\t</li>\n\t\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"\n\t\t\t\t\t\tdata-dojo-attach-point=\"customTimespan\"\n\t\t\t\t\t\tdata-dojo-props='clickable:true, label:\"${nls.customTimespan}\"'>\n\t\t\t\t\t</li>\n\t\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"\n\t\t\t\t\t\tdata-dojo-attach-point=\"lastMonth\"\n\t\t\t\t\t\tdata-dojo-props='clickable:true, label:\"${nls.lastMonth}\"'>\n\t\t\t\t\t</li>\n\t\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"\n\t\t\t\t\t\tdata-dojo-attach-point=\"noneTimespan\"\n\t\t\t\t\t\tdata-dojo-props='clickable:true, label:\"${nls.allTimespan}\"'>\n\t\t\t\t\t</li>\n\t\t\t\t</ul>\n\t\t\t\t<div data-dojo-attach-point=\"timespanOverlay\" data-dojo-type=\"dojox/mobile/SimpleDialog\" class=\"overlay date-overlay\">\n\t\t\t\t\t<div class=\"wrapper1\">\n\t\t\t\t\t\t<h2 style=\"margin: 0px; line-height: 45px;\">\n\t\t\t\t\t\t\t<div data-dojo-type=\"dojox/mobile/ToolBarButton\" label=\"${nls.done}\" class=\"mblColorBlue\" style=\"width:45px;float:right;\" \t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\tdata-dojo-attach-point=\"okButton\"\t\t\t\t\n\t\t\t\t\t\t\t></div>\n\t\t\t\t\t\t\t${nls.selectDate}\n\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t<div id=\"timespanPicker\" style=\"margin-top: 10px;\"></div>\n\t\t\t\t\t\t</h2>\n\t\t\t\t\t\t\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n    </div>\n</div>\n"}});
define("money/views/timespan", [
	"dojo/json","dijit/registry","dojo/on","dojo/dom-style","dojo/dom-class",'dojo/date',
	"dojo/sniff","dojox/mobile/ProgressIndicator","dojo/_base/array",
	"dojox/mobile/Button", "dojo/date/locale","money/dialog","dojox/mobile/SimpleDialog", "dojox/mobile/SpinWheelDatePicker",'dojox/mobile/ToolBarButton','dojo/text!money/views/timespan.html'
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
			this['lastMonth'].set( 'rightText', '' );	
			this['customTimespan'].set( 'rightText', '' );	
			
			window.AppData.timespan = 'last31'
			var daysInMonth = dojodate.getDaysInMonth(new Date);
			window.AppData.dateFrom		 = undefined;
			window.AppData.dateTo		 = undefined;
			localStorage.setItem( 'timespan', 'last31' )			
			
		},
		applyTsMonth:function(){
			console.log('Month')
			this['lastMonth'].set( 'rightText', '' );	
			this['customTimespan'].set( 'rightText', '' );	
			
			window.AppData.timespan = 'lastMonth'
			localStorage.setItem('timespan','lastMonth')
		},
		applyTsCustom:function(){
			this['lastMonth'].set( 'rightText', '' );	
			this['customTimespan'].set( 'rightText', '' );	
			
			window.AppData.timespan = 'customTimespan'
			
			localStorage.setItem('timespan','customTimespan')
			console.log('custom')
		},
		applyTsNone:function(){
			
			this['lastMonth'].set( 'rightText', '' );	
			this['customTimespan'].set( 'rightText', '' );	
			window.AppData.timespan = 'noneTimespan'
			
			localStorage.setItem('timespan','noneTimespan')
			console.log('none')
		}
		
	};
});
