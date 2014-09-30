define([
	"dojo/_base/declare",
	"dojo/dom",
	"dojo/dom-class","dojo/Deferred", 
	"dojo/sniff","dojo/dom-style","dojo/dom-construct","dojo/date",
	"dojox/charting/Chart", "dojo/_base/array", "dojo/_base/window","dojo/on",
    "dojo/dom-attr","dojo/date/locale",
    // Require the theme of our choosing
    "dojox/charting/themes/Shrooms",
    
    "dojox/charting/plot2d/Pie","dojox/charting/widget/Legend", "dojox/mobile/ListItem", 
    "dojox/charting/axis2d/Default", "dojox/charting/plot2d/ClusteredColumns", "dojox/mobile/Accordion",'dojox/mobile/ContentPane',
    'dojo/text!money/views/charts-bar.html'],
    function(declare,dom,domClass,Deferred,has,domStyle,domConstruct,dojodate, Chart, arrayUtil, win, on,domAttr,locale, theme, PiePlot, Legend, ListItem, Default, BarChart){
    
	return {
		legendTemplate : '<span class="chart-legend-label" onclick="goTo(\'list\',{byTags: \'${tagsId}\', type: \'${type}\'})"><div class="mblListItemRightIcon"><div title="" class="mblDomButtonArrow mblDomButton"><div><div><div><div></div></div></div></div></div></div>'+'</span><span class="chart-label"><span class="chart-label-text">${num} * ${tags}</span>&nbsp;<span class="chart-label-amount">${amount} (${percents}%)</span></span>',
		monthsOnPage: has( 'isInitiallySmall' ) ? 2 : 3,
		_getFormattedChartData: function( data ) {
			var vals = {i: [], e: [] }, axisLabels = [], barChartData = data;
			for(var i in barChartData){						
				for( var j in barChartData[i] ) {
					vals[i].push( barChartData[i][j] )
					var alreadyadded = false
					for(var k=0; k< axisLabels.length; k++)
						if( axisLabels[k].value == barChartData[i][j].x )
							{ alreadyadded = true; break }
					if(!alreadyadded)
						axisLabels.push ({ 
							value: barChartData[i][j].x,
							text: locale.format( locale.parse( j, { selector:"date", datePattern: 'yyyyMM'}),
								{ selector: "date", datePattern: 'MMM yyyy' })
						})
				}
			}
										
			for(var i in vals)
				vals[i].sort( function(a, b) {
					return a.x > b.x ? 1 :-1
				})
					
			axisLabels.sort( function(a, b) {
				return a.value > b.value ? 1 :-1
			})
			
			var months = [], monthsNumbers = {};
			var num = 0;
			//console.log(vals)
			
			for(var i in vals)
				for(var j=0; j< vals[i].length; j++) {
					var flag = false
					for (var k=0; k<months.length; k++)
						if( months[k] == vals[i][j].x ) { flag = true; break ;}
					if(!flag)
						months.push ( vals[i][j].x )
				}
			months.sort();
			for (var k=0; k<months.length; k++)
				monthsNumbers[ months[k] ] = num ++;
			
			for(var i in vals)
				for(var j=0; j< vals[i].length; j++) {
					vals[i][j].x = monthsNumbers[ vals[i][j].x ]
				}
			for(var i=0; i< axisLabels.length; i++)
				axisLabels[i].value = monthsNumbers[ axisLabels[i].value ]
			return {vals : vals, axis: axisLabels}
		},
		_createBarChart : function( data ) {
			var barChartData = data, self = this
			var formattedData = this._getFormattedChartData( data )
			
			var vals = formattedData.vals,axisLabels = formattedData.axis
			
			try{
				self.chart1 = new Chart("simplechart", {
					title: self._displayTotal(),
					titlePos: "top",
					titleGap: 25,
					titleFont: "normal normal normal 17pt Arial",
					titleFontColor: "black"
				})	.setTheme(theme)
					.addPlot("default", {
						type: BarChart, 
						gap: 10,  font: "normal normal 11pt Tahoma",
						labelOffset: 10,
						labelStyle: "default",      // default/columns/rows/auto
						//htmlLabels: true,
						labels: true
					})
					.addAxis("x", {
						labels: axisLabels, 
						font: "normal normal 11pt Tahoma",
						
						ajorTickStep:1,
						minorTickStep: 1,
						microTickStep: 1
					})
					.addAxis("y", { 
						vertical: true, 
						font: "normal normal 11pt Tahoma", 
						includeZero: true
					});
					
				for(var i in vals){
					self.chart1.addSeries(self.nls["series-" + i], vals[i], { 
						fill: i == 'e' ? "red" : 'green',
						stroke: {color: ( i == 'e' ? "red" : 'green' )}
					} );
				}
					
				self.chart1.render();
				if( self.legend )
					self.legend.destroy();
				
				domConstruct.create('div', {id: "legend1"}, 'simplechart','after');
				self.legend = new Legend({ 
						chart: self.chart1, 'horizontal' : false 
					}, 
					'legend1'
					//domConstruct.create("div",{},"legend")
				);
				on(window,'resize', function(){
					self.chart1.resize()
				})	
			} catch (e){
				domStyle.set('chart-bar','display','none')
				console.log('WARN: charts are not supported')
			}					
			
		},
		
		/*
		 * Build new or update exsisting pie chart based on given chartData
		 */
		_buildChart: function(){
			var self = this, deferredResult = new Deferred;
			this._getBarChartData().then(function( barChartData ){
				if( self.chart1 )
					self.chart1.destroy();
				self._createBarChart( barChartData );
				deferredResult.resolve('ok')
			});		
			return deferredResult;
		},
		
		
		getQuery: function( ){
			var res = new this.queryIdb ( this )
			return res;
		},
		
		// does THE item should be queried or not?
		
		queryIdb: function(parent){
			
			this.getDate = function(isFirst){
				var today = window.AppData.chartsBarView.basicDate;
				
				var firstDay = dojodate.add(
					new Date( today.getFullYear(), today.getMonth(), 1),
					'month',
					- (parent.monthsOnPage - 1)
				);
				
				var lastDay = dojodate.add( 
					dojodate.add( 
						firstDay, 'month', parent.monthsOnPage
					), 
					'day', 
					-1
				)
				
				console.log('FDLD',firstDay, lastDay)
				return isFirst ? firstDay : lastDay
			}
			
			this.from = function(){
				return this.getDate( true )
			}
			this.to = function(){
				return this.getDate( false )
			}
			this.type = function(){ 
				return undefined
			}
		},
		/*
		 * Get data for the bar chart
		 */ 
		_getBarChartData: function(){
			var self = this, barChartDataDeferred = new Deferred;
			
			
			
			var barChartData = { i : {}, e: {} }
			var data = window.AppData.store.query( this.getQuery() );
			
			// define tags info rendering
			data.then(function(result){
				arrayUtil.forEach(result.items, function(item){
			
					if( item.type == "e" || item.type == "i"){
						var dateStr = Number( locale.format( item.date, { selector:"date", datePattern: 'yyyyMM'}) );
						barChartData[ item.type ][ dateStr ] = barChartData[ item.type ][ dateStr ] ? 
							{x: dateStr, y: barChartData[ item.type ][ dateStr ].y + Math.abs( item.amountHome )} :
							{x: dateStr, y: Math.abs( item.amountHome )};
					}
				})
				
				var today = window.AppData.chartsBarView.basicDate;
				var firstDay = new Date( today.getFullYear(), today.getMonth(), 1);
				firstDay = dojodate.add( 
					firstDay, 'month', - ( self.monthsOnPage - 1)
				);
				
				for(var i=0; i<self.monthsOnPage;i ++) {
					var dateId = Number( locale.format( dojodate.add(firstDay,'month',i), { selector:"date", datePattern: 'yyyyMM'}) );
					if(!barChartData['e'][ dateId ])
						barChartData['e'][ dateId ] = {x: dateId, y:0}
					if(!barChartData['i'][ dateId ])
						barChartData['i'][ dateId ] = {x: dateId, y:0}
				}
				
				barChartDataDeferred.resolve( barChartData )
			})
			
			
			
			return barChartDataDeferred;
		},	
		
		afterActivate: function(contact){
			// x and y coordinates used for easy understanding of where they should display
			// Data represents website visits over a week period
			var self = this

			this._buildChart().then(function(){
				setTimeout(function(){
					if(self.chart1)
						self.chart1.resize()
				}, 1 )
			})
			
        },
        
        init: function(){
			window.AppData.chartsBarView = this
			window.AppData.chartsBarView.basicDate = new Date;
			if(!this._isInheritedFromBaseView)
				new window.AppData.BaseViewClass( this, 1 /* Do not overwrite existing objects*/ );			
			
			var self = this
			//if(!has('isInitiallySmall'))
			//	domClass.add(this.backButton.domNode,'hideOnMedium hideOnLarge')		
			
			on( this.earlier, 'click', function(){
				window.AppData.chartsBarView.basicDate = 
					dojodate.add( window.AppData.chartsBarView.basicDate, 'month', -self.monthsOnPage );
				self._buildChart();
			})
			on( this.later, 'click', function(){
				
				window.AppData.chartsBarView.basicDate = 
					dojodate.add( window.AppData.chartsBarView.basicDate, 'month', self.monthsOnPage );
				self._buildChart();
			})
        },
        
         _displayTotal: function(titleNodeId) {
			//calculate timespan totals
			var self = this, titleNodeId = titleNodeId || 'bar-chart-ts',
				today = window.AppData.chartsBarView.basicDate,
				firstDay = new Date( today.getFullYear(), today.getMonth(), 1);
				
				firstDay = dojodate.add ( 
					firstDay, 'month', - (self.monthsOnPage - 1) 
				);
				
				var lastDay = dojodate.add ( 
					firstDay, 'month', self.monthsOnPage
				);
				
				firstDay = dojodate.add( 
					firstDay, 
					'second', 
					-1 
				);
				
				lastDay = dojodate.add( 
					lastDay, 
					'second', 
					-1 
				);
				
				firstDay = dojodate.add( new Date( today.getFullYear(), today.getMonth(), 1), 'month', -(self.monthsOnPage - 1) );
			
			tsHeader = locale.format(firstDay, { selector:"date", datePattern: 'd MMM yyyy'}) + ' - ' +locale.format(lastDay, { selector:"date", datePattern: 'd MMM yyyy'})
			return tsHeader;
		}           
    };
});
