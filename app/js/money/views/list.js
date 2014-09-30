/*
*   Transactions list module
* 	rebuilt to work async
* 
*   v. 0.9
* 	21/09/2014
*   
* 	Mikhael Milikhin
* 
*/

define(["dojo/_base/declare","dojo/on", "dojox/gesture/swipe","dojo/date","dojo/date/locale",
	"dojo/dom-construct", "dojo/dom-style",'dojo/dom-class',
	"dojo/_base/array","dojo/_base/lang", 'dojo/date',
	"dijit/registry","dojo/dom","dojo/dom-attr", 
	"dojo/date/locale","dojox/mobile/ListItem",
    "dojox/mobile/EdgeToEdgeStoreList",'dojo/text!money/views/list.html'],
    function(declare, on, swipe, date, locale, domConstruct, domStyle, domClass, arrayUtil,lang,dojodate, registry, dom, domAttr, locale, ListItem){
	/*
    * Class used for transaction-list's single records
    */
    var TransactionListItem = declare(ListItem, {
        target: "details",
        clickable: true,
        postMixInProperties: function(){
            this.inherited(arguments);
            this.transitionOptions = {
                params: {
                    "id" : this.id
                }
            }
        }
    });
 
	
	
    return {
		
		_renderHeader: function(){
			var date = window.AppData.currentDate
			if(!this.params.byTags)
				registry.byId('list-title').set('label',getDateStringHr( getDate(date, locale), locale))
			else {
				var _tagIds = "noTags", _tagsLabels = [this.nls.noTags];
				if( this.params.byTags != -1){
					_tagIds = String(this.params.byTags).split(/%2C|,+/ /* this is comma symbol or encoded comma symbol*/), _tagsLabels = [];
					for(var i=0; i < _tagIds.length; i++){
						_tagsLabels[i] = window.AppData.store.getTag(  Number( _tagIds[i] ) ).label
					}
				}
				registry.byId('list-title').set('label', _tagsLabels.join( ', ' ));
			}
			var t = ['e','i','t']
			for (var i in t)
				registry.byId('list-is-'+t[i]).set('selected',false)
			registry.byId('list-is-'+window.AppData.currentType).set('selected',true)
		},
		
		//render timespan title & sum				
		_displayTotal: function(sumNodeId, titleNodeId) {
			//calculate timespan totals
			var self = this;
			var sumNodeId = sumNodeId || 'list-sum-total'
			var titleNodeId = titleNodeId || 'list-sum-ts'
			var total = 0, alltrans = window.AppData.store.query( self.queryIdb );
			alltrans.then(function(data){
				total = 0;
				var items = data.items
				for(var i = 0; i < items.length; i++ )
					total += items[i].amountHome;
				domAttr.set(sumNodeId, 'innerHTML', getMoney( total, window.AppData.currency ))
			
			})					
		},
		
		beforeDeactivate: function(){
			this._oldParams = this.params
		},
		
		beforeActivate: function(){
            var self = this
            var callback = function(){
				if(self.params.type){
					window.AppData.currentType = self.params.type
				}
				if( self.params.id)
					window.AppData.currentDate = self.params.id;
				
				if( self.params.from == 'details' && self._oldParams 
					&& this._oldParams.byTags) {
					this.params = this._oldParams
				}
				
				//empty page
				arrayUtil.forEach(registry.byId('daily-list').getChildren(), function(li){
					li.destroyRecursive()
				})
				domConstruct.empty('daily-list')
				//
				self.transactions.refresh().then( function(){
					self._renderHeader();				
					self._displayTotal();				
					self.reloadPage();

					var btns = ['e','i','t']
					for(var i=0; i<btns.length; i++) {					

						if( self.params.byTags || self.params.byTags == -1) {
							self.backButton.transitionOptions.target = "chartsPie";
							self.backButton.set( 'label', self.nls.stats);
							registry.byId( 'list-is-' + btns[i] ).transitionOptions.params.id = undefined;
							registry.byId( 'list-is-' + btns[i] ).transitionOptions.params.byTags = self.params.byTags;						
						}else {
							self.backButton.transitionOptions.target = "summary";
							self.backButton.set('label', self.nls.summary);
							registry.byId( 'list-is-' + btns[i] ).transitionOptions.params.id = self.params.id;
							registry.byId( 'list-is-' + btns[i] ).transitionOptions.params.byTags = undefined;
						}
					}
				})
			}
            
            setTimeout(function(){
				callback.call(self)
			},0)
		},
		
		reloadPage: function(){
			var _this = this
			domAttr.set(_this.emptyMsgTitle.domNode,"innerHTML",
				window.AppData.currentType == "e" ? _this.nls.noExpences : (
					window.AppData.currentType == "i" ? _this.nls.noIncomes :
						_this.nls.noTransfers
				)
			)
			domStyle.set(_this.emptyMsgTitle.domNode,"display",_this.transactions.getChildren().length ? "none" : "")
			domStyle.set(_this.emptyMsg.domNode,"display",_this.transactions.getChildren().length ? "none" : "")
			domClass[_this.transactions.getChildren().length ? "remove" : "add"](_this.transactions.domNode, 'empty')
		},
		
		queryIdb: {
			from: function(){ return window.AppData.currentDate},
			type: function(){ return window.AppData.currentType}
		},
        query: function(item){
			if(!window.AppData.detailsView || !window.AppData.detailsView.params.byTags)
				return (getDateString(item.date,locale) == window.AppData.currentDate) && (item.type == window.AppData.currentType)
			else {
				var _tagIds = []; _tagsLabels = []
				if( window.AppData.detailsView.params.byTags != -1){
					_tagIds = window.AppData.detailsView.params.byTags = String(window.AppData.detailsView.params.byTags).split(/%2C|,+/ /* this is comma symbol or encoded comma symbol*/);
					for(var i=0; i < _tagIds.length; i++){
						_tagsLabels[i] = window.AppData.store.getTag(  Number( _tagIds[i] ) ) ?
							window.AppData.store.getTag(  Number( _tagIds[i] ) ).id : _tagIds[i];
					}
				}
				
				var from = window.AppData.dateFrom ? window.AppData.dateFrom : (window.AppData.dateFrom = dojodate.add(new Date,"day", -daysInMonth - 1));
				var to = window.AppData.dateTo ? window.AppData.dateTo : (window.AppData.dateTo = dojodate.add(new Date,"day", 1));
				//return (item.tags == _tagsLabels.join(','))
				return (item.type==window.AppData.currentType) && (item.tags == _tagsLabels.join(',')) &&
					( (window.AppData.timespan == 'noneTimespan' && !window.AppData.useDateImportant) || ( dojodate.difference(item.date, from, "second") < 0 ) && ( dojodate.difference(item.date, to, "second") > 0) )
			}
		},
		
        listItem: TransactionListItem,

        init: function(){
            //on(this.domNode, swipe, function(e){console.log(e)});
			var self = this;
			if(!this._isInheritedFromBaseView)
				new window.AppData.BaseViewClass( this );			
			
			window.AppData.detailsView = this
			on(this.domNode, swipe.end, function(e){
				var id = self.params.id
				var idDate = locale.parse(id,{"selector":"date", "datePattern":"yyyy-MM-dd"})
				if(Math.abs(e.dy) < 30){
					if(Math.abs(e.dx)>50){
						var newDate = date.add(idDate,'day', (e.dx > 0 ? -1 : 1));
						idDate = locale.format(newDate,{"selector":"date", "datePattern":"yyyy-MM-dd"})
						window.dFinance.transitionToView(self.domNode,{
							"target": "list" , "transitionDir": -1,
							"params": {id: idDate, type: self.params.type}
						})
					}
				}
			});
        },
        createListItem: function(/*Object*/item){
			// summary:
			//		Creates a list item widget.
				
			var itemClone = lang.clone(item),
				self = self = window.dFinance.children.dFinance_list

			if(!this._isInheritedFromBaseView)
				new window.AppData.BaseViewClass( self );
			
			itemClone.amount = getMoney(item.amount, window.AppData.store.getAccount(item.account).maincur)
			itemClone.account = 
				( itemClone.type!="t" ) ? 
					window.AppData.store.getAccount(item.account).label : 
				( window.AppData.store.getAccount(item.account).label + " -> " + 
					(window.AppData.store.getAccount(item.accountTo) ? window.AppData.store.getAccount(item.accountTo).label : 'n/a'));

			var tags = "";
			for (var i=0;i < item.tags.length; i++){
				if(tags != "") tags+=", ";
				tags += window.AppData.store.getTag(item.tags[i]).label
			}
			if(tags == "") tags = self.nls.noTags
			itemClone.cats = 
				"<div class='date-header'>" + (self.params.byTags ? getDateStringHr(itemClone.date, locale) : tags) + "</div>" +
				"<div class='summary'>"+self.substitute(self._accountTemplate, itemClone)+"</div>"+
				(itemClone.descr ? ("<div class='li-descr'><hr/>"+itemClone.descr+"</div>") : "")
			
			return new this.itemRenderer(
				this._createItemProperties(itemClone)
			);			
		}
    };
});
