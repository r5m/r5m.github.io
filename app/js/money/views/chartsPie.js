define(["dojo/_base/declare",
	"dojo/Deferred",
	"dojo/dom","dojo/dom-class", "dojo/sniff","dojo/dom-style","dojo/date",
	"dojox/charting/Chart", "dojo/_base/array", "dojo/_base/window","dojo/on",
    "dojo/dom-attr","dojo/date/locale",
    // Require the theme of our choosing
    "dojox/charting/themes/Shrooms",
    
    "dojox/charting/plot2d/Pie","dojox/charting/widget/Legend", "dojox/mobile/ListItem", 
    "dojox/charting/axis2d/Default", "dojox/charting/plot2d/ClusteredColumns", "dojox/mobile/Accordion",'dojox/mobile/ContentPane',
    'dojo/text!money/views/charts-pie.html'],
    function(declare,Deferred,dom,domClass,has,domStyle,dojodate, Chart, arrayUtil, win, on,domAttr,locale, theme, PiePlot, Legend, ListItem, Default, BarChart){
    
	return {
		legendTemplate : '<span class="chart-legend-label">'+'</span><span class="chart-label"><span class="chart-label-text">${num} * ${tags}</span>&nbsp;<span class="chart-label-amount">${amount} (${percents}%)</span></span>',
		//legendTemplate : '<span class="chart-legend-label" onclick="goTo(\'list\',{byTags: \'${tagsId}\', type: \'${type}\'})"><div class="mblListItemRightIcon"><div title="" class="mblDomButtonArrow mblDomButton"><div><div><div><div></div></div></div></div></div></div>'+'</span><span class="chart-label"><span class="chart-label-text">${num} * ${tags}</span>&nbsp;<span class="chart-label-amount">${amount} (${percents}%)</span></span>',
		
		_createPieChart: function( data ) {
			var chartData = data;
			try{
					this.pieChart = new Chart(dom.byId('chartNode')) 
						.setTheme(theme)
						.addPlot("default", {
							type		: PiePlot, // our plot2d/Pie module reference as type value
							fontColor	: "#333",
							labelWiring	: "#333",
							labelStyle	: "none",
							htmlLabels	: true,
							startAngle	: -10,
							labelOffset	: 20
						})
						.addSeries("tags", chartData)
						.render();
					
					this.legend = new Legend({ chart: this.pieChart,'horizontal' : false }, "legend");
					var self = this
					on(window,'resize', function(){
						self.pieChart.resize()						
					})					
				}catch (e){
					domStyle.set('chart-pie','display','none')
					console.log('WARN: charts are not supported')
				}
		},
		/*
		 * Build new or update exsisting pie chart based on given chartData
		 */
		_buildChart: function(chartData){
			var self = this
			
			domStyle.set('no-transactions-chart', 'display', !chartData.length? 'block':'none')
			domStyle.set('pie-chart', 'display', chartData.length? 'block':'none')
			chartData.sort( function(a, b) {
				return a.y < b.y ? 1 : -1
			})
			this._displayTotal( chartData );
			
			
			if(!this.pieChart){
				this._createPieChart( chartData )
			}else {
				this.pieChart
					.updateSeries('tags',chartData)
					.render()
				this.legend.refresh();
			}
		},
		
		
		
		
		/*
		 * 	get data (of given type) for the piechart
		 */ 
		_getData:function( type ){
			var _t = window.AppData.currentType;
			var self = this
			var chartDataDeferred = new Deferred;
			// all the transation of given type
			var data = window.AppData.store.query(
				this.getQuery(false, type || "e")
			);		
			
			// transfers doesn't affect sums
			data.then( function( result ) {
				var chartData = [], chartKeys = {}, sum = 0;			
				arrayUtil.forEach(result.items, function(item){
					sum += ( item.type != "t" ) ? parseFloat( item.amountHome ) : 0;
				})
				
				arrayUtil.forEach(result.items, function(item){
					
					var tags = (item.tags && item.tags[0]) ? item.tags.join(',') : "noTags", tagsLabels = (item.tags && item.tags[0]) ? "" : self.nls.noTags;
					if(tags){
						for(var i in item.tags){						
							if(window.AppData.tagsStore.get(item.tags[i]))
								tagsLabels += (tagsLabels ? ", " : "") + window.AppData.tagsStore.get(item.tags[i]).label
						}
					};
					if(chartKeys[tags] == undefined){
						chartData.push ({ x:1, y:Math.abs( parseFloat(item.amountHome) ), text: self.substitute( self.legendTemplate, {
								num: 1,
								tags : tagsLabels,
								amount : getMoney( Math.abs(item.amountHome).toFixed(2) ),
								percents: (Math.abs(item.amountHome / (sum != 0 ? sum : 0.001))*100).toFixed(2),
								tagsId: tags != "noTags" ? item.tags : -1,
								type: item.type
							})
						});
						chartKeys[tags] = {i : chartData.length-1, l: 1}
					}else {
						chartKeys[tags].l ++;
						chartData[chartKeys[tags].i].y += Math.abs(parseFloat(item.amountHome)), chartData[chartKeys[tags].i].text = self.substitute( self.legendTemplate, {
							num: chartKeys[tags].l ,
							tags : tagsLabels,
							amount : getMoney( Math.abs( chartData[ chartKeys[tags].i ].y).toFixed(2)),
							percents: (Math.abs( chartData[ chartKeys[tags].i ].y / (sum != 0 ? sum : 0.001) ) * 100 ).toFixed(2),
							tagsId: tags != "noTags" ? item.tags : -1,
							type: item.type
						})					
					}
					
				})
				chartDataDeferred.resolve(chartData)
			})
			
			
			return chartDataDeferred
		},
		
		// does THE item should be queried or not?
		getQuery: function( allDataMode , type){
			var res = new this.queryIdb
			res.allData = allDataMode;
			res.type = type
			return res;
		},
		
		// does THE item should be queried or not?
		
		queryIdb: function(){
			var from;
			this.allData = false
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
							dojodate.add(new Date,"day", -dojodate.getDaysInMonth(new Date))
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
						window.AppData.dateTo = new Date// dojodate.add(new Date,"day", 1)
					)
			}
			this.type = function(){ 
				return undefined //this.allData ? undefined :
					//window.AppData.currentType
			}
		},
		
		afterActivate: function(contact){
			// x and y coordinates used for easy understanding of where they should display
			// Data represents website visits over a week period
			var btns = ['exp','inc','transf'], type = 'e';
			for(var i=0; i<btns.length; i++) {
				this[ btns[i] + 'Chart' ].get('selected') && ( type = btns[i].substr( 0,1 ) );
			}
			var self = this
				
			this._getData( type ).then( function( chartData ){
				self._buildChart(chartData)
				setTimeout(function(){
					if(self.pieChart)
						self.pieChart.resize()				
				},1)
			})
			
        },
        
        init: function(){
			window.AppData.chartsPieView = this;
			window.AppData.chartsPieView.allData = false;
			if(!this._isInheritedFromBaseView)
				new window.AppData.BaseViewClass( this, 1 /* Do not overwrite existing objects*/ );			
			
			var self = this
			//if(!has('isInitiallySmall'))
			//	domClass.add(this.backButton.domNode,'hideOnMedium hideOnLarge')
			
			//rebuild pie chart on transaction type change 
			this.expChart.onClick = function(){
				self._getData().then( function( chartData ){
					self._buildChart(chartData)
				})				
			}
			
			this.incChart.onClick = function(){
				self._getData("i").then( function( chartData ){
					self._buildChart(chartData)
				})		
			}
			
			this.transfChart.onClick = function(){
				self._getData("t").then( function( chartData ){
					self._buildChart(chartData)
				})				
			}
        },
        _displayTotal: function(data, sumNodeId, titleNodeId) {
			//calculate timespan totals
			var self = this,
				sumNodeId = sumNodeId || 'charts-pie-sum-total',
				titleNodeId = titleNodeId || 'charts-pie-sum-ts',
				total = 0, alltrans = data ? data : window.AppData.store.query( self.getQuery() ),
				daysInMonth = dojodate.getDaysInMonth(new Date),
				months = [
				'jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'				
				],
				tsHeader = this.nls.allTheTime;
				
			for(var i = 0; i < alltrans.length; i++ )
				total += alltrans[i].amountHome ? alltrans[i].amountHome : alltrans[i].y;
			
			if (window.AppData.timespan == 'last31')
				tsHeader = ( '<span style="text-transform:capitalize">' +
					locale.format( dojodate.add( new Date, "day", -daysInMonth),
						{ selector:"date", datePattern: "d MMM" }) + ' - '  +
					locale.format(new Date, {selector:"date", datePattern: "d MMM"}) +"</span>" );
			else if ( window.AppData.timespan == 'customTimespan' ){
				var from = new Date;
				from = new Date( from.getFullYear(), from.getMonth(), 1);
					
				tsHeader = ('<span style="text-transform:capitalize">' + 
					this.nls[ months [ Number( locale.format( dojodate.add(from, 'day', 0),
						{ selector:"date", datePattern: 'MM'}) ) -1 ] ] +  
					locale.format( dojodate.add(from, 'day', 0),
						{ selector:"date", datePattern: ' yyyy'}) + "</span>" );
			}
			else if (window.AppData.timespan == 'lastMonth'){
				var from = getDate( window.AppData.timespanMonth, locale )
				var daysInMonth = dojodate.getDaysInMonth(from) 
				var to = dojodate.add( from, "day", daysInMonth -1 );	
				tsHeader =  ( '<span style="text-transform:capitalize">' +
					locale.format(dojodate.add(from,"day", 0),
						{selector:"date", datePattern: "d MMM"}) + ' - '  +
					locale.format(dojodate.add(to, 'day' , 0) ,
						{selector:"date", datePattern: "d MMM"}) + "</span>" )
			}
			
			domAttr.set(sumNodeId, 'innerHTML', getMoney( total, window.AppData.currency ))
			domAttr.set(titleNodeId,'innerHTML',tsHeader)					
		}        
    };
});
