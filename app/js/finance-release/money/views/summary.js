require({cache:{
'url:money/views/summary.html':"<div \n\tdata-dojo-type=\"dojox/app/widgets/Container\">    \n    <div \n\t\tdata-dojo-type=\"dojox/mobile/Heading\" \n\t\tclass=\"title\"\n        data-dojo-props=\"fixed: 'top'\">        \n\t\t\n\t\t<button \n\t\t\tdata-dojo-type=\"money/TouchableToolBarButton\"\n            data-dojo-attach-point=\"menuButton\"\n            data-dojo-props=\"target:'navigation',transitionDir:-1\"\n            class=\"left-button\"><i class=\"fa fa-bars\"></i> ${nls.menu}</button>\n        \n        ${nls.title}\n        \n        <button\n\t\t\tdata-dojo-type=\"money/TouchableToolBarButton\"\n            class=\"right-button mblRedButton\"\n            data-dojo-props=\"\n\t\t\t\ttarget: 'details',\n\t\t\t\ttransitionOptions: { params: { edit: true } }\"\n            data-dojo-attach-point=\"add\"><i class=\"fa fa-plus\"></i> ${nls.add}</button>\n    </div>\n    \n    <div id=\"summary-sum\">\n\t\t<span id=\"summary-sum-ts\"></span>\n\t\t<span style=\"float:right;margin-right:10px\">\n\t\t\t<span id=\"summary-sum-title\">${nls.total}: </span>\n\t\t\t<span id=\"summary-sum-total\"></span>\n\t\t</span>\n\t</div>\n\t\n\t<div \n\t\tdata-dojo-type=\"money/WheelScrollableView\"\n\t\tdata-dojo-attach-point=\"scrollView\"\n\t\tdata-dojo-props=\"threshold:window.AppData.treshold\">\n\t\t\n\t\t<div id=\"welcome-note\">\n\t\t\t<div \n\t\t\t\tdata-dojo-type=\"dojox/mobile/RoundRectCategory\">\n\t\t\t\t\t${nls.welcome}\n\t\t\t</div>\n\t\t\t<div \n\t\t\t\tdata-dojo-type=\"dojox/mobile/RoundRect\" >\n\t\t\t\t\t${nls.welcome2}\n\t\t\t</div>\n\t\t\t<div \n\t\t\t\tdata-dojo-type=\"dojox/mobile/RoundRectCategory\" >\n\t\t\t\t\t${nls.aboutR5mTitle}\n\t\t\t</div>\n\t\t\t<div \n\t\t\t\tdata-dojo-type=\"dojox/mobile/RoundRect\" \n\t\t\t\t>\n\t\t\t\t\t${nls.aboutR5m}\n\t\t\t</div>\n\t\t\t<div \n\t\t\t\tdata-dojo-type=\"dojox/mobile/RoundRectCategory\">\n\t\t\t\t\t${nls.aboutSyncTitle}\n\t\t\t</div>\n\t\t\t<div\n\t\t\t\tdata-dojo-type=\"dojox/mobile/RoundRect\" \n\t\t\t\t>\n\t\t\t\t\t${nls.aboutSync}\n\t\t\t</div>\n\t\t\t<div \n\t\t\t\tdata-dojo-type=\"dojox/mobile/RoundRectCategory\">\n\t\t\t\t\t${nls.aboutHelpTitle}\n\t\t\t</div>\n\t\t\t<div \n\t\t\t\tdata-dojo-type=\"dojox/mobile/RoundRect\">\n\t\t\t\t\t${nls.aboutHelp}\n\t\t\t</div>\n\t\t\t<div \n\t\t\t\tdata-dojo-type=\"dojox/mobile/RoundRectCategory\">\n\t\t\t\t\t${nls.aboutSettingsTitle}\n\t\t\t</div>\n\t\t\t<div \n\t\t\t\tdata-dojo-type=\"dojox/mobile/RoundRect\" \n\t\t\t\t>\n\t\t\t\t\t${nls.aboutSettings}\n\t\t\t</div>\n\t\t</div>\n\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeStoreList\"\n            data-dojo-attach-point=\"daily\" id=\"summary-list\"\n            data-dojo-props=\"\n\t\t\t\tstore: this.loadedStores.transactions,\n\t\t\t\tquery: this.query, queryOptions:{sort:[{attribute: 'date', descending: true}]},\n\t\t\t\tcreateListItem: this.createListItem,\n\t\t\t\tlabelProperty: 'dateString',\n                itemRenderer: this.listItem\">\n\t\t</div>\t\t\n    </div>    \n    \n    <!-- Bottom tabbar-->\n    <ul data-dojo-type=\"dojox/mobile/TabBar\" data-dojo-attach-point=\"bottomBar\" data-dojo-props=\"fixed: 'bottom'\">\n\t\t<li data-dojo-type=\"dojox/mobile/TabBarButton\" id='sum-is-e'\n\t\t\tdata-dojo-props=\"selected:true,target: 'summary', icon: 'icons/icon_transactions.png', iconPos1:'0,19,19,17',\n\t\t\t\t\ttransitionOptions: { params: { type: 'e', refresh: true } }\">${nls.expences}</li>\n\t\t<li data-dojo-type=\"dojox/mobile/TabBarButton\" id='sum-is-i'\n\t\t\tdata-dojo-props=\"target: 'summary', icon: 'icons/icon_transactions.png', iconPos1:'0,0,19,17',\n                    transitionOptions: { params: { type: 'i', refresh: true } }\">${nls.incomes}</li>\n\t\t<li data-dojo-type=\"dojox/mobile/TabBarButton\" id='sum-is-t'\n\t\t\tdata-dojo-props=\"target: 'summary', icon: 'icons/icon_transactions.png', iconPos1:'0,38,21,17',\n                    transitionOptions: { params: { type: 't', refresh: true } }\">${nls.transfers}</li>\n\t</ul>\n</div>\n"}});
define("money/views/summary", ["dojo/_base/declare", "dojo/_base/array","money/dialog","dojo/date",
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
				i=0
			data.id = "ts-"+getDateString(date, locale)
			
			//we now have transactions for THE month
			this._pushMonth(cl)			
			
			arrayUtil.forEach(data, function(data_i){
				if(data_i.amount != undefined) {
					i++;
					_total += parseFloat(data_i.amount)
					//get transaction account info
					var a = window.AppData.accountStore.query({ id:data_i.account })[0]
					data_i.account = a ? a.label : ''
					data_i.amount = getMoney( data_i.amount, /*a.maincur*/window.AppData.currency )
					
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
		
		beforeDeactivate: function(){
			//window.dFinance.children.dFinance_summary.summary = []				
		},
		
		//render timespan title & sum				
		_displayTotal: function(sumNodeId, titleNodeId) {
			//calculate timespan totals
			var self = this,
				sumNodeId = sumNodeId || 'summary-sum-total',
				titleNodeId = titleNodeId || 'summary-sum-ts',
				total = 0, alltrans = window.AppData.store.query( self.query ),
				daysInMonth = dojodate.getDaysInMonth(new Date),
				from = window.AppData.dateFrom ? window.AppData.dateFrom : (window.AppData.dateFrom = dojodate.add(new Date,"day", -daysInMonth - 1)),
				to = window.AppData.dateTo ? window.AppData.dateTo : (window.AppData.dateTo = dojodate.add(new Date,"day", 1)),
				months = [
				'jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'				
				],
				tsHeader = this.nls.allTheTime;
				
			for(var i = 0; i < alltrans.length; i++ )
				total += alltrans[i].amountHome;
			
			if (window.AppData.timespan == 'last31')
				tsHeader = ( '<span style="text-transform:capitalize">' +
					locale.format( dojodate.add( new Date, "day", -daysInMonth),
						{ selector:"date", datePattern: "d MMM" }) + ' - '  +
					locale.format(new Date, {selector:"date", datePattern: "d MMM"}) +"</span>" );
			else if ( window.AppData.timespan == 'customTimespan' )
				tsHeader = ('<span style="text-transform:capitalize">' + 
					this.nls[ months [ Number( locale.format( dojodate.add(window.AppData.dateFrom, 'day', 1),
						{ selector:"date", datePattern: 'MM'}) ) -1 ] ] +  
					locale.format( dojodate.add(window.AppData.dateFrom, 'day', 1),
						{ selector:"date", datePattern: ' yyyy'}) + "</span>" );
			else if (window.AppData.timespan == 'lastMonth')
				tsHeader =  ( '<span style="text-transform:capitalize">' +
					locale.format(dojodate.add(window.AppData.dateFrom,"day", 1),
						{selector:"date", datePattern: "d MMM"}) + ' - '  +
					locale.format(dojodate.add(window.AppData.dateTo, 'day' ,-1) ,
						{selector:"date", datePattern: "d MMM"}) + "</span>" )
			
			domAttr.set(sumNodeId, 'innerHTML', getMoney( total, window.AppData.currency ))
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
					self.daily.refresh();
					//Scroll to top when view is refreshed
					this.scrollView.scrollTo(0, 0);
				}
				
				//render month names and set up type-selector UI
				
				self._renderHeader()
				self._renderMonth()
				//display transactions total
				self._displayTotal();
				
				//display welcome notes if no transactions this timespan
				self._displayFirstTimeMessage()	

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
			
			if( window.AppData.store.createPromise && !window.AppData.store.createPromise.isResolved() ) {
				var self = this;			
				window.AppData.store.createPromise.then( function(){ self.beforeActivate() });
			}
				
			//this.bottomBar.startup();
			this._enableMenuOnSwipe();

		},
        _onInit: function(){    
			if(!window.AppData.isInitiallySmall){
				domClass.add(this.menuButton.domNode,'hideOnMedium hideOnLarge')
			}
            var self = this
            self.menu = registry.byId('main-nav')
			
			this._renderMonth();					
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
			window.dFinance.children.dFinance_summary.summary = []
			
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
