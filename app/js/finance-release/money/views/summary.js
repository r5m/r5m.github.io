define("money/views/summary", ["dojo/_base/declare", "dojo/_base/array","money/dialog","dojo/date",
	"dojo/_base/fx","dojo/on","dojox/gesture/swipe","dojo/_base/lang","dijit/registry", 
	"dojo/dom", "dojo/date/locale", "dojo/query", "dojo/dom-construct", "dojo/dom-style", "dojo/dom-class","dojo/dom-attr",
	"dojox/mobile/ListItem", "dojox/mobile/EdgeToEdgeCategory","dojox/mobile/EdgeToEdgeStoreList"
    ],
    function(declare, arrayUtil,Dialog, dojodate, fx,on,swipe, lang, registry, dom, locale, query, domConstruct, domStyle, domClass, domAttr, ListItem, ListCategory){
    var TransactionListItem = declare(ListItem, {
        target: "list",
        onClick: function(){
			window.AppData.currentDate = this.id.substr( 3, this.id.length-1 )
		},
        clickable: true,
        postMixInProperties: function(){
            this.inherited(arguments);
            this.transitionOptions = {
                params: {
                    "id" : this.id.substr(3,this.id.length-1)
                }
            }            
        }
    });
	
	
    return window.AppData.objSum = {
		afterActivate: function(){
			//alert('after activate')
			window.hideProgress()
		},
		
		/*
		 * array of monthes <yyyy-MM> presented on view
		 * used to render month headers in right order
		*/
		_monthsOnPage:[],
		
		/*
		 * Template for right text of list item
		 */ 
		_accountTemplate:
			'<div><span class="transaction-amount">${amount}</span><span class="transaction-account">${account}</span></div>',
		
		/*
		 *  Substitute ${var} in template with data[var]
		 */
		substitute: function(template, data) {
			var self = this
			return template.replace(/\$\{([^\s\:\}]+)(?:\:([^\s\:\}]+))?\}/g, function(match, key){
				if(data[key]!=undefined || (key.substr(0,1) == "!" && data[key.substr(1)]))
					return (key.substr(0,1)=="!" ? self.capitalize(data[key.substr(1)]):data[key])
				return ""			
			});
		},
		
		/*
		 * make str[0] bigger :-)
		 */ 
		capitalize: function(str){
			return str.substr(0,1).toUpperCase() + str.substr(1,str.length-1)//.toLowerCase()
		},
		//-----------PRIVATE----------------//
		
		/*
		* Return array with transactions summary for each account
		* ['yyyy-MM-dd' => [{account: <account id>, amount: <amount>},...]]
		* */
		_parseTransaction: function(s, trans){
			var summary = lang.clone(s)
			console.log('!!!', summary)
			
			var dateString = (isValidDate(trans.date)) ? locale.format(trans.date, {selector:"date", datePattern:window.AppData.widgetDateFormat}) : trans.date
			if(parseFloat(trans.amount)!=NaN){
				if(summary[dateString]){
					var flag = false
					arrayUtil.forEach(summary[dateString], function(dateSum){
						if(dateSum.account == trans.account){
							dateSum.amount += parseFloat(trans.amountHome)
							flag = true
						}
					})					
					if(!flag)
						summary[dateString][summary[dateString].length] = {account: trans.account, amount: parseFloat(trans.amountHome)}
				}else{
					summary[dateString] = [{account: trans.account, amount: parseFloat(trans.amountHome)}]
				}
				summary[dateString].total = summary[dateString].total ? (summary[dateString].total + parseFloat(trans.amountHome)) : parseFloat(trans.amountHome)
			}
			return summary
		},
		
		/*
		 *	push <yyyy-MM> into _monthsOnPage if thie month hasn't been already added 
		 */
		_pushMonth: function(id){
			var monthPresent = false
			for(var i in this._monthsOnPage)
				if(this._monthsOnPage[i] == id){
					monthPresent = true; break;
				}
			if(!monthPresent)
				this._monthsOnPage.push(id)
		},
		
		/*
		 * select tab that corresponds to current transactions type
		 */ 
		_renderHeader: function(){
			var t = ['e','i','t']
			for (var i in t)
				registry.byId('sum-is-'+t[i]).set('selected',false)
			registry.byId('sum-is-'+window.AppData.currentType).set('selected',true)
		},
		
		/*
		 * Apply(!) months titles as ul's children
		 */
		_renderMonth: function(){
			var months = query('#summary-list .mblEdgeToEdgeCategory');
				for(var i=0; i< months.length; i++)
					registry.byId(months[i].id).destroy();
				
			
			for(var i in this._monthsOnPage){
				//console.log(this._monthsOnPage[i],query("."+this._monthsOnPage[i])[0])
				var date = locale.parse(this._monthsOnPage[i], {"selector":"date", "datePattern":'yyyy-MM'})
				var h = new ListCategory({
					label: this.capitalize(locale.format(date, {selector:"date", datePattern:'MMM yyyy'}))
				},domConstruct.create('h2',{},query("."+this._monthsOnPage[i])[0],'before'))
				
			}
		},
		
		/*
		 * Returns single day record
		 * 	@d - [{account: <account id>, amount: <amount>},...]
		 * 	@month - what date do the transactions refers to
		 */
		_renderRecord: function(d, month){				
			var data = lang.clone( d ),
				date = locale.parse( month, { "selector":"date", "datePattern":window.AppData.widgetDateFormat }),
				cl	 = locale.format( date, { selector:"date",datePattern:"yyyy-MM" }),
				content = '', 	//single record content
				_total = 0, 	//day transactions sum
				i=0
			data.id = "ts-"+getDateString(date, locale)
			
			//we now have transactions for THE month
			this._pushMonth(cl)			
			
			arrayUtil.forEach(data, function(data_i){
				i++;
				_total += parseFloat(data_i.amount)
				//get transaction account info
				var a = window.AppData.accountStore.query({ id:data_i.account })[0]
				data_i.account = a.label
				data_i.amount = getMoney( data_i.amount, /*a.maincur*/window.AppData.currency )
				content += this.substitute(this._accountTemplate, data_i)
			},this)
			
			data.dateString = "<div class='date-header'>" + 
					data.dateString + 
				"</div>" + 
				"<div class='summary " + 
					(( i > 1 ) ? "sub-sum":"") +
				"'>"+
					content + 
					((i > 1 && window.AppData.currentType!="t") ? 
						('<div class=\"li-total\"><span>' + 
							getMoney(_total, window.AppData.currency) +
						'</span></div> </div>') : 
					'</div>');
					
			data['class'] = cl
			return data
		},
		
		afterDeactivate: function(){
			window.dFinance.children.dFinance_summary.summary = []
		},
		
		//render timespan title & sum				
		_displayTotal: function(sumNodeId, titleNodeId) {
			//calculate timespan totals
			var self = this;
			var sumNodeId = sumNodeId || 'summary-sum-total'
			var titleNodeId = titleNodeId || 'summary-sum-ts'
			var total = 0, alltrans = window.AppData.store.query( self.query );
			for(var i = 0; i < alltrans.length; i++ )
				total += alltrans[i].amountHome;
			
			var tsHeader = 
				(window.AppData.timespan != 'noneTimespan') ? 
					(window.AppData.timespan == 'last31') ? this.nls.lastMonth : 
						( ( window.AppData.timespan == 'lastMonth' ||  window.AppData.timespan == 'customTimespan' )? 
							('<span style="text-transform:capitalize">' + locale.format(dojodate.add(window.AppData.dateFrom, 'day', 1), {selector:"date", datePattern: "MMM yyyy"}) +"</span>") : 
						this.nls.thisMonth) :
					this.nls.allTheTime
			
			domAttr.set(sumNodeId, 'innerHTML', getMoney( total, window.AppData.currency))			
			domAttr.set(titleNodeId,'innerHTML',tsHeader)				
					
		},
		
		_displayFirstTimeMessage: function() {
			var self = this
			domStyle.set(this.emptyMsgTitle.domNode,"display",self.daily.getChildren().length ? "none" : "")
			domStyle.set(this.emptyMsg.domNode,"display",self.daily.getChildren().length ? "none" : "")
			domClass[self.daily.getChildren().length ? "remove" : "add"](self.daily.domNode, 'empty')
		},
		
		_initializeHomeCurrency: function() {
			var self = this;
			if(!window.AppData.currency){
				if(!this.params.currency){
					this.dlg = window.AppData.dialogWindow = new Dialog
					this.dlg.show(false, this.nls.currencySelectNote, this.nls.currencySelectTitle, this.nls.currencySelectButton, function(){
						window.dFinance.transitionToView(self.domNode,{
							target	: 'currencypicker',
							transitionDir	: 1,
							params : {backTo : 'summary'}
						})
					})
				}else{
					window.AppData.currency = this.params.currency;
					localStorage.setItem('currency', this.params.currency)
				}
			}
		},
		//---------------PUBLIC--------------------------//
		/*
		 * Called when view gets focus
		 */
		beforeActivate: function(){
			var self = this
						
			var callback = function(){
				
				//if this is the first run of the app, set up main currency
				self._initializeHomeCurrency();
				
				//set up type of transactions to be displayed
				if(this.params.type)
					window.AppData.currentType = this.params.type
				
				if(this.params.refresh)
					self.daily.refresh();
				
				//render month names and set up type-selector UI
				window.AppData.objSum._renderHeader()
				window.AppData.objSum._renderMonth()
			
				//display transactions total
				self._displayTotal();
				
				//display welcome notes if no transactions this timespan
				self._displayFirstTimeMessage()				
			};
			
			//do not wait for callback before showing view.
			setTimeout(function(){
				callback.call(self)
			},0)
		},
		
		
		/*
		*	query function for listitem store
		*/ 
        query: function(item){
			var daysInMonth = dojodate.getDaysInMonth(new Date); 
			
			var from = window.AppData.dateFrom ? window.AppData.dateFrom : (window.AppData.dateFrom = dojodate.add(new Date,"day", -daysInMonth - 1));
			var to = window.AppData.dateTo ? window.AppData.dateTo : (window.AppData.dateTo = dojodate.add(new Date,"day", 1));
			return (item.type==window.AppData.currentType) && 
				( (window.AppData.timespan == 'noneTimespan' && !window.AppData.useDateImportant) || ( dojodate.difference(item.date, from, "second") < 0 ) && ( dojodate.difference(item.date, to, "second") > 0) )
		},
        
        /*
         * class used to create list item objects
         */ 
        listItem: TransactionListItem,
        
        _enableMenuOnSwipe: function() {
			var self = this;
			if(window.AppData.isInitiallySmall)
				on(this.domNode, swipe.end, function(e){
					if(Math.abs(e.dy) < 30){
						if(e.dx>50){
							window.dFinance.transitionToView(self.domNode,{
								"target": "navigation" , "transitionDir": -1
							})
						}
					}
				});
		},
        
        init: function(){
			registry.byId('summary-list').onUpdate = this.onListUpdate;
			registry.byId('summary-list').onDelete = this.onListUpdate;
			registry.byId('summary-list').onAdd = this.onListUpdate;
			domStyle.set(this.scrollView.containerNode,'paddingBottom','20px')
			
			this._onInit();
			
			
			if( window.AppData.store.createPromise && !window.AppData.store.createPromise.isResolved() ) {
				var self = this;			
				window.AppData.store.createPromise.then( function(){ self.beforeActivate() });
			}
				
			this.bottomBar.startup();
			this._enableMenuOnSwipe();
			
		},
        _onInit: function(){    
			if(!window.AppData.isInitiallySmall){
				domClass.add(this.menuButton.domNode,'hideOnMedium hideOnLarge')
			}
            var self = this
            self.menu = registry.byId('main-nav')
			
			this._renderMonth()
					
        },
        summary: [],
        
        /*
         * rebuild summary for the whole day corresponding to The transaction Item
         * @item - modified store record
         */ 
        onListUpdate: function(item){
			//save dateFrom & dateTo to restore after operation is complete
			var dateFrom = window.AppData.dateFrom;
			var dateTo 	 = window.AppData.dateTo;
			
			window.AppData.dateFrom = dojodate.add(item.date, 'day', -1);
			window.AppData.dateTo = dojodate.add(item.date, 'day', 1)
			window.AppData.useDateImportant = true;
			
			//all items, that needed to be recalculated
			var modifiedItems = this.store.query( this.query );
			
			//if there are no any transactions that day, just remove entry from summary
			var dateId = locale.format(item.date, {"selector":"date", "datePattern":'yyyy-MM-dd'});
			if(modifiedItems.length == 0 && registry.byId( 'ts-' +  dateId)){
				registry.byId( 'ts-' +  dateId).destroyRecursive();	
				return;
			}
			
			//else place new entry into correspondent position
			var allExistingItems = registry.byId('summary-list').getChildren();
			var inserted = false
			for(var i=0; i<allExistingItems.length; i++) {
				var _singleItem = allExistingItems[i], _siDate = _singleItem.id.substr(3, _singleItem.id.length-1)
				if(_siDate.length == 10) {
					var _siDateAsDate =  locale.parse(_siDate, {"selector":"date", "datePattern":'yyyy-MM-dd'})
					if(dojodate.difference(_siDateAsDate, item.date, 'day') >= 0){
						for(var k = 0; k < modifiedItems.length; k++) {
							var li = this.createListItem( modifiedItems[k] );
							this.addChild( li,  i);
						}
						inserted = true
						break;
					}
				}
			}
			if(!inserted)
				for(var k = 0; k < modifiedItems.length; k++) {
					var li = this.createListItem( modifiedItems[k] );
					this.addChild( li );
				}
				
			
			window.AppData.useDateImportant = false;	
			window.AppData.dateFrom = dateFrom;
			window.AppData.dateTo = dateTo;
			
		},
		
		createListItem: function(/*Object*/item){
			
			// summary:
			//		Creates a list item widget.
			var itemClone = lang.clone(item), self = window.dFinance.children.dFinance_summary
			var id = getDateString(itemClone.date, locale)
			
			var did = "ts-" + id
			if(item.type == "t"){
				itemClone.amount 		*= -1
				itemClone.amountHome 	*= -1
				itemClone.sumTo 		*= 1
			}
			self.summary = self._parseTransaction(self.summary, itemClone)
			self.summary[id].id = id
			self.summary[id].dateString = getDateStringHr(itemClone.date, locale) //get human readable date string
			
			if(item.type == "t" && item.accountTo) {
				var trans2 = lang.clone(itemClone); 
					trans2.amount 		= trans2.sumTo; 
					trans2.amountHome 	= -trans2.amountHome; 
					trans2.account 		= trans2.accountTo
				self.summary = self._parseTransaction(self.summary, trans2)
			}
			
			//replace existing list entry with new one
			if(!registry.byId(did)){			
				return new this.itemRenderer(
					this._createItemProperties( self._renderRecord(self.summary[id],id) )
				);
			}else {
				registry.byId(did).destroyRecursive()
				//return registry.byId(itemClone.id)
				return new this.itemRenderer(
					this._createItemProperties( self._renderRecord(self.summary[id],id) )
				);
			}
		}
    };
});
