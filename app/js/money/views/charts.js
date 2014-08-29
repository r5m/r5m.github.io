define(["dojo/_base/declare","dojo/dom","dojo/dom-class", "dojo/sniff","dojo/dom-style","dojo/date",
	"dojox/charting/Chart", "dojo/_base/array", "dojo/_base/window","dojo/on",
    "dojo/dom-attr",
    // Require the theme of our choosing
    "dojox/charting/themes/Shrooms","dojox/charting/plot2d/Pie","dojox/charting/widget/Legend", "dojox/mobile/ListItem", 'dojo/text!money/views/charts.html'],
    function(declare,dom,domClass,has,domStyle,dojodate, Chart, arrayUtil, win, on,domAttr, theme, PiePlot, Legend, ListItem){
    
	return window.AppData.objChart = {
		legendTemplate : '<span class="chart-legend-label" onclick="goTo(\'list\',{byTags: \'${tagsId}\', type: \'${type}\'})"><div class="mblListItemRightIcon"><div title="" class="mblDomButtonArrow mblDomButton"><div><div><div><div></div></div></div></div></div></div>'+'</span><span class="chart-label"><span class="chart-label-text">${num} * ${tags}</span>&nbsp;<span class="chart-label-amount">${amount} (${percents}%)</span></span>',
		/*
		 * Build new or update exsisting pie chart based on given chartData
		 */
		_buildChart: function(chartData){
			domStyle.set('no-transactions-chart', 'display', !chartData.length? 'block':'none')
			domStyle.set('pie-chart', 'display', chartData.length? 'block':'none')
			chartData.sort( function(a, b) {
				return a.y < b.y ? 1 : -1
			})
			
			if(!this.pieChart){
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
					domStyle.set('chart-main','display','none')
					console.log('WARN: charts are not supported')
				}
			}else {
				this.pieChart
					.updateSeries('tags',chartData)
					.render()
				this.legend.refresh()
			}
		},
		
		/*
		 * Get data for the bar chart
		 */ 
		_getBarChartData: function(){
			
		},
		
		/*
		 * 	get data (of given type) for the piechart
		 */ 
		_getData:function(type){
			var _t = window.AppData.currentType;
			var self = this
			window.AppData.currentType = type || "e"
			
			// all the transation of given type
			var data = window.AppData.store.query(this.query);
			window.AppData.currentType = _t
			
			var chartData = [], chartKeys = {}, sum = 0
			
			// transfers doesn't affect sums
			arrayUtil.forEach(data, function(item){
				sum += ( item.type != "t" ) ? parseFloat( item.amountHome ) : 0;
			})
			
			// define tags info rendering
			arrayUtil.forEach(data, function(item){
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
			return chartData
		},
		
		// does THE item should be queried or not?
		query: function(item){
			var allData = window.AppData.chartsView.allData || false
			var from = window.AppData.dateFrom ? window.AppData.dateFrom : (window.AppData.dateFrom = dojodate.add(new Date,"day",-32));
			var to = window.AppData.dateTo ? window.AppData.dateTo : (window.AppData.dateTo = dojodate.add(new Date,"day", 1));
			
			return (allData || item.type==window.AppData.currentType) && 
				(window.AppData.timespan == 'noneTimespan' || (dojodate.difference(item.date, from, "second") < 0) && (dojodate.difference(item.date, to, "second") > 0))
		},
		
		_buildSummary: function(){
			window.AppData.chartsView.allData = true //type-independant query mode
			
			//data - is data of current type
			//data2 - all data in store
			var data = window.AppData.store.query(this.query), e = 0, i = 0, t = 0,			
				data2 = window.AppData.store.query()
			
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
			arrayUtil.forEach(data, function(item){
				if (item.type == "e") e += parseFloat(item.amountHome);
				else if (item.type == "i") i += parseFloat(item.amountHome);
				else if (item.type == "t") t += Math.abs(parseFloat(item.amountHome));
			})
			
			var cashed = 0;
			arrayUtil.forEach(data2, function(item){
				var amount = item.type=="t" ? -Number(item.amount) : Number(item.amount)
				
				cashed += item.account == '0.2997778154166041' ? amount : 0
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
			console.log('ALL TR:', cashed)
			//render transaction types summary
			this.sumE.set('rightText',getMoney(e,window.AppData.currency))
			this.sumI.set('rightText',getMoney(i,window.AppData.currency))
			this.sumT.set('rightText',getMoney(t,window.AppData.currency))
			
			arrayUtil.forEach(this.sumAcc.getChildren(), function(acc){
				acc.destroyRecursive();
			})
			
			var sumAll = 0;
			for (var i in accs){
				sumAll += fx( Number(accs[i]) )
					.from( window.AppData.accountStore.get(i).maincur )
					.to( window.AppData.currency );
				
				this.sumAcc.addChild( new ListItem({
					label		: window.AppData.accountStore.get(i).label,
					rightText	: getMoney(accs[i], window.AppData.accountStore.get(i).maincur)
				}))
			}
			domAttr.set('acc-sum','innerHTML',getMoney(sumAll,window.AppData.currency))
		},
		
		afterActivate: function(contact){
			// x and y coordinates used for easy understanding of where they should display
			// Data represents website visits over a week period
			
			var chartData = this._getData()
			this._buildChart(chartData)
			this._buildSummary()
			var self = this
			setTimeout(function(){
				self.pieChart.resize()
			},1)
        },
        
        init: function(){
			window.AppData.chartsView = this

			if(!this._isInheritedFromBaseView)
				new window.AppData.BaseViewClass( this, 1 /* Do not overwrite existing objects*/ );			
			
			var self = this
			if(!has('isInitiallySmall'))
				domClass.add(this.backButton.domNode,'hideOnMedium hideOnLarge')
			
			
			//rebuild pie chart on transaction type change 
			this.expChart.onClick = function(){
				var chartData = self._getData()
				self._buildChart(chartData)
			}
			this.incChart.onClick = function(){
				var chartData = self._getData("i")
				self._buildChart(chartData)
			}
			this.transfChart.onClick = function(){
				var chartData = self._getData("t")
				self._buildChart(chartData)
			}
        }        
    };
});
