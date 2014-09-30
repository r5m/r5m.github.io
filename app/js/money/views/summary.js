/*
*   Transactions journal module
* 	rebuilt to work in async mode
* 
*   v. 0.9
* 	21/09/2014
*   
* 	Mikhael Milikhin
* 
*/

define(["dojo/_base/declare", "dojo/_base/array","money/dialog","dojo/date",
	"dojo/_base/fx","dojo/on","dojox/gesture/swipe","dojo/_base/lang","dijit/registry", 
	"dojo/dom", "dojo/date/locale", "dojo/query", "dojo/dom-construct", "dojo/dom-style", "dojo/dom-class","dojo/dom-attr",
	"dojox/mobile/ListItem", "dojox/mobile/EdgeToEdgeCategory","dojox/mobile/EdgeToEdgeStoreList",'dojo/text!money/views/summary.html'
    ],
    function(declare, arrayUtil,Dialog, dojodate, fx,on,swipe, lang, registry, dom, locale, query, domConstruct, domStyle, domClass, domAttr, ListItem, ListCategory){
    /*
     * Class used for transaction-list's single records
     */
    var TransactionListItem = declare(ListItem, {
        target: "list",
        onClick: function() {
			window.AppData.currentDate = this.id.substr( 3, this.id.length-1 )
		},
        clickable: true,
        postMixInProperties: function() {
            this.inherited( arguments );
            this.transitionOptions = {
                params: {
                    "id" : this.id.substr( 3, this.id.length-1 )
                }
            }            
        }
    });
	
	
    return {
		
		/*
		 * array of monthes <yyyy-MM> presented on view
		 * used to render month headers in right order
		*/
		_monthsOnPage:[],
				
		//-----------PRIVATE----------------//
		
		/*
		* Return array with transactions summary for each account
		* ['yyyy-MM-dd' => [{account: <account id>, amount: <amount>},...]]
		* */
		_parseTransaction: function(s, trans){
			var summary = lang.clone(s)
			
			var dateString = ( isValidDate( trans.date ) ) ? getDateString( trans.date, locale ) : trans.date
			
			if( parseFloat( trans.amount ) != NaN){
				if(summary[dateString]){
					var flag = false
					arrayUtil.forEach( summary[dateString], function( dateSum ){
						if( dateSum.account == trans.account ){
							dateSum.amount = parseFloat( dateSum.amount ) + parseFloat( trans.amountHome )
							flag = true
						}
					})					
					if(!flag)
						summary[ dateString ][ summary[dateString].length ] = {
							account: trans.account, amount: parseFloat(trans.amountHome)
						};
				}else{
					summary[ dateString ] =	[{
						account: trans.account, amount: parseFloat(trans.amountHome)
					}];
				}
				summary[dateString].total = summary[dateString].total ?
					( summary[dateString].total + parseFloat(trans.amountHome) ) : parseFloat(trans.amountHome);
			}
			return summary;
		},
		
		/*
		 *	push <yyyy-MM> into _monthsOnPage if this month hasn't been already added 
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
			var t = ['e' /* expence */, 'i' /* income */, 't' /* transfer */]
			for (var i in t)
				registry.byId( 'sum-is-' + t[i] ).set( 'selected', false )
			registry.byId( 'sum-is-' + window.AppData.currentType ).set( 'selected', true )
		},
		
		/*
		 * Apply(!) months titles as ul's children
		 */
		_renderMonth: function(){
			//destroy all added months...
			var months = query('#summary-list .mblEdgeToEdgeCategory');
				for(var i=0; i< months.length; i++)
					registry.byId(months[i].id).destroy();
			
			var months = [
				'jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'				
			]
			
			//...than add all months
			for(var i in this._monthsOnPage){
				//console.log(this._monthsOnPage[i],query("."+this._monthsOnPage[i])[0])
				var date = locale.parse(this._monthsOnPage[i], {"selector":"date", "datePattern":'yyyy-MM'})
				var h = new ListCategory({
					label: this.capitalize( 
						this.nls[ months [ Number( locale.format( date, { selector:"date", datePattern: 'MM'}) ) -1 ] ]+ 
						locale.format( date, { selector:"date", datePattern: ' yyyy'}) 
					)
				},domConstruct.create( 'h2', {}, query("."+this._monthsOnPage[i])[0],'before'))
				
			}
		},
		
		/*
		 * Returns single day record
		 * 	@d - [{account: <account id>, amount: <amount>},...]
		 * 	@month - what date do the transactions refers to
		 */
		_renderRecord: function(d, month){				
			var data = lang.clone( d ),
				date = locale.parse( month, { "selector": "date", "datePattern": window.AppData.widgetDateFormat }),
				cl	 = locale.format( date, { "selector": "date", datePattern: "yyyy-MM" }),
				content = '', 	//single record content
				_total = 0, 	//day transactions sum
				i = 0;
			data.id = "ts-"+getDateString(date, locale)
			
			//we now have transactions for THE month
			this._pushMonth(cl)			
			
			arrayUtil.forEach(data, function(data_i){
				if(data_i.amount != undefined) {
					i++;
					_total += parseFloat(data_i.amount)
					//get transaction account info
					var a = window.AppData.accountStore.query({ 
						id: data_i.account 
					})[0]
					
					data_i.account = a ? a.label : ''
					data_i.amount = getMoney( 
						data_i.amount, 
						//a.maincur /*
						window.AppData.currency
						//*/
					)
					
					content += this.substitute(this._accountTemplate, data_i)
				}
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
		
		//render timespan title & sum				
		_displayTotal: function(sumNodeId, titleNodeId) {
			//calculate timespan totals
			var self = this,
				sumNodeId = sumNodeId || 'summary-sum-total',
				titleNodeId = titleNodeId || 'summary-sum-ts',
				total = 0, alltrans = window.AppData.store.query( self.getQuery() ),
				daysInMonth = dojodate.getDaysInMonth(new Date),
				months = [
				'jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'				
				],
				tsHeader = this.nls.allTheTime;
			
			alltrans.then(function(data){
				total = 0;
				var items = data.items
				for(var i = 0; i < items.length; i++ )
					total += items[i].amountHome;
				domAttr.set(sumNodeId, 'innerHTML', getMoney( total, window.AppData.currency ))
			
			})	
			
			
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
			
			domAttr.set(titleNodeId,'innerHTML',tsHeader)					
		},
		
		
		_displayFirstTimeMessage: function() {
			var self = this
			domStyle.set('welcome-note',"display",self.daily.getChildren().length ? "none" : "")
			domClass[self.daily.getChildren().length ? "remove" : "add"](self.daily.domNode, 'empty')
		},

		/*
		 *	if home cuurency is not setup - select it.
		 */ 
		_initializeHomeCurrency: function() {
			var self = this;
			if(!window.AppData.currency){
				if(!this.params.currency){
					
					this.dlg = window.AppData.dialogWindow;
					this.dlg.show(false, this.nls.currencySelectNote, this.nls.currencySelectTitle, this.nls.currencySelectButton, function(){
						self.dlg.hide();
						window.dFinance.transitionToView( self.domNode, {
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
		
		displayAll: function(){
			var self = this
			//render month names and set up type-selector UI
			self._renderHeader()
			self._renderMonth()
			//display transactions total
			self._displayTotal();
			//display welcome notes if no transactions this timespan
			self._displayFirstTimeMessage()
						
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
				
				if(this.params.refresh) {
					window.dFinance.children.dFinance_summary.summary = []
					self.daily.refresh().then( function(){
						self.displayAll();
						//Scroll to top when view is refreshed
						self.scrollView.scrollTo(0, 0);
					} );
					
				}
				
				
				if(window.AppData.defaultHash.indexOf('backup') > -1 && window.AppData.currency){
					window.dFinance.transitionToView( self.domNode, {
						"target": 'backup' , "transitionDir": 1
					});					
				}
				window.AppData.defaultHash = '';
				
			};
			
			//do not wait for callback before showing view.
			setTimeout(function(){
				callback.call(self)
			},0)
		},
		
		getQuery: function( date ){
			return new this.queryIdb( date );
		},
		/*
		*	filter params for listitem store
		*/        
        queryIdb: function(date){
			var from;
			
			this.date = date || undefined;
			this.from = function(){
				if( this.date )
					return this.date;
					
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
				if( window.AppData.timespan == 'noneTimespan' && 
				!window.AppData.useDateImportant)
					return undefined;
				return window.AppData.dateFrom ? 
					window.AppData.dateFrom : (
						window.AppData.dateFrom = 
							dojodate.add(new Date,"day", -dojodate.getDaysInMonth(new Date) )
					)
			}
			this.to = function(){
				if( this.date )
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
				if( window.AppData.timespan == 'noneTimespan' && 
				!window.AppData.useDateImportant)
					return undefined;
				return window.AppData.dateTo ? 
					window.AppData.dateTo : (
						window.AppData.dateTo = new Date//dojodate.add(new Date,"day", 1)
					)
			}
			this.type = function(){ 
				//if( this.date )
				//	return undefined;
				return window.AppData.currentType
			}
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
							window.dFinance.transitionToView( self.domNode, {
								"target": "navigation" , "transitionDir": -1
							})
						}
					}
				});
		},
        
        init: function(){
			window.dFinance.children.dFinance_summary.summary = []

			if(!this._isInheritedFromBaseView)
				new window.AppData.BaseViewClass( this );			
			
			//we have a single handler for all CRUD events
			registry.byId('summary-list').onUpdate = this.onListUpdate;
			registry.byId('summary-list').onDelete = this.onListUpdate;
			registry.byId('summary-list').onAdd = this.onListUpdate;
			
			domStyle.set(this.scrollView.containerNode,'paddingBottom','20px')
			
			this._onInit();			
			
			/*if( window.AppData.store.createPromise && 
			!window.AppData.store.createPromise.isResolved() ) {
				var self = this;			
				window.AppData.store.createPromise.then( function(){ 
					self.beforeActivate() 
				});
			}*/
				
			this._enableMenuOnSwipe();
		},
		
        _onInit: function(){    
			if(!window.AppData.isInitiallySmall){
				domClass.add(this.menuButton.domNode,'hideOnMedium hideOnLarge')
			}
            
            var self = this
            on(this.daily, 'complete', function(){
				self.displayAll();
			})
			
        },
        
        summary: [],
        
        /*
         * rebuild summary for the whole day corresponding to The transaction Item
         * @item - modified store record
         */ 
        onListUpdate: function( item, oldDate ){
			//save dateFrom & dateTo to restore after operation is complete
			console.log('LIST UPDATE CALLBACK')
			var dontCalculate = dontCalculate || false;
			window.AppData.useDateImportant = true;
			var self = this
			//all items, that needed to be recalculated
			
			var updateCallback = function( date ){
				var q = window.dFinance.children.dFinance_summary.getQuery( date )
				self.store.query( q ).then (
					function( data ) {
						window.dFinance.children.dFinance_summary.summary = []
						var modifiedItems = data.items
						console.log('MI',modifiedItems.length)
						//if there are no any transactions that day, just remove entry from summary
						var dateId = locale.format(date, {"selector":"date", "datePattern":'yyyy-MM-dd'});
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
										console.log('CREATING LI for ', modifiedItems[k], dontCalculate)
										var li = self.createListItem( modifiedItems[k] );
										self.addChild( li,  i);
									}
									inserted = true
									break;
								}
							}
						}
						if(!inserted)
							for(var k = 0; k < modifiedItems.length; k++) {
								var li = self.createListItem( modifiedItems[k] );
								self.addChild( li );
							}				
						
						window.dFinance.children.dFinance_summary.displayAll();
						window.AppData.useDateImportant = false;	
						
					}
				);
			}
			updateCallback ( item.date );
			//console.log(getDate ( oldDate locale ) !=  item.date)
			if( oldDate && oldDate != locale.format( item.date, {"selector":"date", "datePattern":'yyyy-MM-dd'}) ){
				updateCallback (
					//window.dFinance.children.dFinance_summary.getQuery( getDate ( oldDate, locale ), oldDate )
					getDate ( oldDate, locale )
				);
			}
			
			
			
		},
		
		createListItem: function(/*Object*/item){
			// summary:
			//		Creates a list item widget.
			
			
			var itemClone = lang.clone(item),
				self = window.dFinance.children.dFinance_summary,
				id = getDateString(itemClone.date, locale),
				did = "ts-" + id;

			if(!this._isInheritedFromBaseView)
				new window.AppData.BaseViewClass( self );			
			
			if(item.type == "t"){
				itemClone.amount 		*= -1
				itemClone.amountHome 	*= -1
				itemClone.sumTo 		*= 1
			}
			//console.log('!SUMMARY', self.summary)
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
				registry.byId(did).destroyRecursive();
				return new this.itemRenderer(
					this._createItemProperties( self._renderRecord(self.summary[id],id) )
				);
			}
			
			
		}
    };
});
