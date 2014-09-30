require({cache:{
'url:money/views/charts.html':"<div class=\"mblBackground\">\n    <div data-dojo-type=\"dojox/mobile/Heading\"\n        data-dojo-props=\"fixed: 'top'\">\n        <button data-dojo-type=\"dojox/mobile/ToolBarButton\"\n            data-dojo-attach-point=\"backButton\"\n            data-dojo-props=\"arrow: 'left', target: 'navigation', transitionDir: -1, transitionOptions: { params: { id: window.AppData.currentDate }}\"\n            class=\"left-button\">${nls.menu}</button>\n    </button>\n    ${nls.title}\n    </div>\n    <div data-dojo-type=\"money/WheelScrollableView\">\n\t\t<div id=\"sum-main\">\n\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t<span id=\"acc-sum\" style=\"\"></span>${nls.myAccounts}\n\t\t\t</div>\n\t\t\t<div data-dojo-type=\"dojox/mobile/Pane\" id=\"no-accounts-chart\">\n\t\t\t\t${nls.tap}\n\t\t\t\t<b>${nls.settings}</b> -> <b>${nls.accounts}</b> -> <b>${nls.add}</b> ${nls.navMenu} ${nls.addFirstAccount}\n\t\t\t</div>\n\t\t\t<ul data-dojo-type=\"dojox/mobile/EdgeToEdgeList\" id=\"sum-acc\"\n\t\t\t\tdata-dojo-attach-point=\"sumAcc\">\n\t\t\t</ul>\n\t\t</div>\n\t\t<div id=\"sum-main\">\n\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t${nls.myAchievements}\n\t\t\t</div>\n\t\t\t<ul data-dojo-type=\"dojox/mobile/EdgeToEdgeList\">\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"  id=\"sum-exp\"\n\t\t\t\t\tdata-dojo-attach-point=\"sumE\"\n\t\t\t\t\tdata-dojo-props='rightText:\"0.00\", label:\"${nls.expences}\"'></li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\" id=\"sum-inc\"\n\t\t\t\t\tdata-dojo-attach-point=\"sumI\"\n\t\t\t\t\tdata-dojo-props='rightText:\"0.00\", label:\"${nls.incomes}\"'></li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"  id=\"sum-tr\"\n\t\t\t\t\tdata-dojo-attach-point=\"sumT\"\n\t\t\t\t\tdata-dojo-props='rightText:\"0.00\", label:\"${nls.transfers}\"'></li>\n\t\t\t</ul>\n\t\t</div>\n\t\t<div id=\"chart-main\">\n\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t${nls.moreCharts}\n\t\t\t</div>\n\t\t\t<ul data-dojo-type=\"dojox/mobile/EdgeToEdgeList\">\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\" \n\t\t\t\t\tdata-dojo-props='target: \"chartsPie\", \n\t\t\t\t\t\tlabel: \"${nls.byTags}\",\n\t\t\t\t\t\tclickable: true'></li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\" \n\t\t\t\t\tdata-dojo-props='target: \"chartsBar\", \n\t\t\t\t\t\tlabel: \"${nls.expInc}\",\n\t\t\t\t\t\tclickable: true'></li>\n\t\t\t</ul>\n\t\t</div>\t\t\n    </div>\n</div>\n"}});
define("money/views/charts", ["dojo/_base/declare","dojo/dom","dojo/dom-class", "dojo/sniff","dojo/dom-style","dojo/date",
	"dojox/charting/Chart", "dojo/_base/array", "dojo/_base/window","dojo/on",
    "dojo/dom-attr","dojo/date/locale",
    // Require the theme of our choosing
    "dojox/charting/themes/Shrooms",
    
    "dojox/charting/plot2d/Pie","dojox/charting/widget/Legend", "dojox/mobile/ListItem", 
    "dojox/charting/axis2d/Default", "dojox/charting/plot2d/ClusteredColumns", "dojox/mobile/Accordion",'dojox/mobile/ContentPane',
    'dojo/text!money/views/charts.html'],
    function(declare,dom,domClass,has,domStyle,dojodate, Chart, arrayUtil, win, on,domAttr,locale, theme, PiePlot, Legend, ListItem, Default, BarChart){
    
	return window.AppData.objChart = {
		legendTemplate : '<span class="chart-legend-label" onclick="goTo(\'list\',{byTags: \'${tagsId}\', type: \'${type}\'})"><div class="mblListItemRightIcon"><div title="" class="mblDomButtonArrow mblDomButton"><div><div><div><div></div></div></div></div></div></div>'+'</span><span class="chart-label"><span class="chart-label-text">${num} * ${tags}</span>&nbsp;<span class="chart-label-amount">${amount} (${percents}%)</span></span>',
		
		
		
		getQuery: function( allDataMode ){
			var res = new this.queryIdb
			res.allData = allDataMode;
			return res;
		},
		
		// does THE item should be queried or not?
		
		queryIdb: function(){
			this.allData = false;
			var from;
			this.from = function(){
				console.log( this.allData )
				if( this.allData || 
					window.AppData.timespan == 'noneTimespan' && 
					!window.AppData.useDateImportant)
					return undefined;
				if( window.AppData.timespan == 'lastMonth') {
					console.log( window.AppData.timespanMonth )
					from = getDate( window.AppData.timespanMonth, locale )
					return from
				}
				if( window.AppData.timespan == 'customTimespan') {
					from = new Date;
					from = new Date( from.getFullYear(), from.getMonth(), 1);
					//console.log(from)
					var daysInMonth = dojodate.getDaysInMonth(from) 
					//window.AppData.dateFrom		 = dojodate.add( from, "day", -1);
					return from
					//window.AppData.dateTo 		 = dojodate.add( from, "day", daysInMonth -1 );				
				}
				return window.AppData.dateFrom ? 
					window.AppData.dateFrom : (
						window.AppData.dateFrom = 
							dojodate.add(new Date, "day", -dojodate.getDaysInMonth(new Date))
					)
			}
			this.to = function(){
				if( this.allData || 
					window.AppData.timespan == 'noneTimespan' && 
					!window.AppData.useDateImportant)
					return undefined;
				if( window.AppData.timespan == 'lastMonth') {
					console.log( window.AppData.timespanMonth )
					from = getDate( window.AppData.timespanMonth, locale )
					var daysInMonth = dojodate.getDaysInMonth(from) 
					return dojodate.add( from, "day", daysInMonth -1 );	
				}
				if( window.AppData.timespan == 'customTimespan') {
					from = new Date;
					from = new Date( from.getFullYear(), from.getMonth(), 1);
					console.log(from)
					var daysInMonth = dojodate.getDaysInMonth(from) 
					return dojodate.add( from, "day", daysInMonth -1 );				
				}	
				return window.AppData.dateTo ? 
					window.AppData.dateTo : (
						window.AppData.dateTo = new Date
					)
			}
			this.type = function(){ 
				return undefined //this.allData ? undefined :
					window.AppData.currentType
			}
		},
		
		
		_buildSummary: function(){
			window.AppData.chartsView.allData = true //type-independant query mode
			
			//data - is data of current type
			//data2 - all data in store
			var data = window.AppData.store.query( this.getQuery( false ) ),
				data2 = window.AppData.store.query( this.getQuery( true ) )
				e = 0, i = 0, t = 0, self = this;
			
			window.AppData.chartsView.allData = false //type-dependant query mode
			
			var accData = window.AppData.accountStore.query()
			var accs = {}
			
			domStyle.set('no-accounts-chart','display', !accData.length? 'block':'none')
			domStyle.set('sum-acc','display', accData.length? 'block':'none')
			
			// start accounts sum counting from startAmount
			arrayUtil.forEach(accData, function(account){
				if(account.id){
					accs[account.id] = Number(account.startAmount ? account.startAmount : 0)
				}
			})
			
			console.log(accs)
			// get transaction summary by types
			data.then(function(result){
				arrayUtil.forEach(result.items, function(item){
					if (item.type == "e") e += parseFloat(item.amountHome);
					else if (item.type == "i") i += parseFloat(item.amountHome);
					else if (item.type == "t") t += Math.abs(parseFloat(item.amountHome));
				})
				
				self.sumE.set('rightText',getMoney(e,window.AppData.currency))
				self.sumI.set('rightText',getMoney(i,window.AppData.currency))
				self.sumT.set('rightText',getMoney(t,window.AppData.currency))
			
			})
			
			data2.then( function(result){
				arrayUtil.forEach(result.items, function(item){
					var amount = 
						item.type == "t" ? -Number(item.amount) : Number(item.amount);
					
					//console.log(item.account)
					if(item.account){
						accs[item.account] = 
							(accs[item.account] ? 
								( accs[item.account] + amount ) : amount )
						if( ( item.type=="t" ) && ( item.accountTo ) ) {
							accs[item.accountTo] =
							(accs[item.accountTo] ? 
								( accs[item.accountTo] + Number(item.sumTo) ) : 
								+ Number(item.sumTo));
							
						}
					}
				})
				
				arrayUtil.forEach(self.sumAcc.getChildren(), function(acc){
					acc.destroyRecursive();
				})
				
				var sumAll = 0;
				for (var i in accs){
					sumAll += fx( Number(accs[i]) )
						.from( window.AppData.accountStore.get(i).maincur )
						.to( window.AppData.currency );
					
					self.sumAcc.addChild( new ListItem({
						label		: window.AppData.accountStore.get(i).label,
						rightText	: getMoney(accs[i], window.AppData.accountStore.get(i).maincur)
					}))
				}
				domAttr.set('acc-sum','innerHTML',getMoney(sumAll,window.AppData.currency))
			})	
			
		},
		
		afterActivate: function(contact){
			// x and y coordinates used for easy understanding of where they should display
			// Data represents website visits over a week period
			
			this._buildSummary()
			
        },
        
        init: function(){
			window.AppData.chartsView = this

			if(!this._isInheritedFromBaseView)
				new window.AppData.BaseViewClass( this, 1 /* Do not overwrite existing objects*/ );			
			
			var self = this
			if(!has('isInitiallySmall'))
				domClass.add(this.backButton.domNode,'hideOnMedium hideOnLarge')
			
			
			
        }        
    };
});
