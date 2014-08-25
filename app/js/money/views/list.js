define(["dojo/_base/declare","dojo/on", "dojox/gesture/swipe","dojo/date","dojo/date/locale",
	"dojo/dom-construct", "dojo/dom-style",'dojo/dom-class',
	"dojo/_base/array","dojo/_base/lang", 
	"dijit/registry","dojo/dom","dojo/dom-attr", 
	"dojo/date/locale","dojox/mobile/ListItem",
    "dojox/mobile/EdgeToEdgeStoreList",'dojo/text!money/views/list.html'],
    function(declare, on, swipe, date, locale, domConstruct, domStyle, domClass, arrayUtil,lang, registry, dom, domAttr, locale, ListItem){
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
			registry.byId('list-title').set('label',this._getDate(date))
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
			var total = 0, alltrans = window.AppData.store.query( self.query );
			for(var i = 0; i < alltrans.length; i++ )
				total += alltrans[i].amountHome;
			
			domAttr.set(sumNodeId, 'innerHTML', getMoney( total, window.AppData.currency))						
					
		},
		
		beforeActivate: function(contact){
            var self = this
            
            var callback = function(){
				if(self.params.type)
					window.AppData.currentType = self.params.type
				if( self.params.id)
					window.AppData.currentDate = self.params.id;
				//empty page
				arrayUtil.forEach(registry.byId('daily-list').getChildren(), function(li){
					li.destroyRecursive()
				})
				domConstruct.empty('daily-list')
				//
				self.transactions.refresh()
				self._renderHeader();				
				self._displayTotal();				
				self.reloadPage();
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
		
        query: function(item){
			return (getDateString(item.date,locale) == window.AppData.currentDate) && (item.type == window.AppData.currentType)
		},
		
        listItem: TransactionListItem,

        init: function(){
            //on(this.domNode, swipe, function(e){console.log(e)});
			var self = this;
			
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
			for (var i in item.tags){
				if(tags != "") tags+=", ";
				tags += window.AppData.store.getTag(item.tags[i]).label
			}
			if(tags == "") tags = self.nls.noTags
			itemClone.cats = 
				"<div class='date-header'>" + tags + "</div>" + "<div class='summary'>"+self.substitute(self._accountTemplate, itemClone)+"</div>"+
				(itemClone.descr ? ("<div class='li-descr'><hr/>"+itemClone.descr+"</div>") : "")
			
			//rData.display = (rData.descr ? "display:inline" : "display:none")
			return new this.itemRenderer(
				this._createItemProperties(itemClone)
			);			
		}
    };
});
