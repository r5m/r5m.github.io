require({cache:{
'url:money/views/list.html':"<div data-dojo-type=\"dojox/app/widgets/Container\">\n    <div data-dojo-type=\"dojox/mobile/Heading\"\n        data-dojo-props=\"fixed: 'top'\" id=\"list-title\" class=\"title\">\n\n        <button data-dojo-type=\"money/TouchableToolBarButton\"\n            data-dojo-attach-point=\"backButton\"\n            data-dojo-props=\"arrow: 'left', target: 'summary', transitionDir: -1, transitionOptions: { params: { id: window.AppData.currentDate }}\"\n            class=\"left-button backButton\"\n            >${nls.summary}</button>       \n\t\t</button>\n\n\t\t${nls.title}\n\n\t\t<button data-dojo-type=\"money/TouchableToolBarButton\"\n\t\t\tclass=\"right-button mblRedButton\"\n\t\t\tdata-dojo-props=\"target: 'details',\n\t\t\t\ttransitionOptions: { params: { edit: true } }\"\n\t\t\tdata-dojo-attach-point=\"add\"><i class=\"fa fa-plus\"></i> ${nls.add}</button>\n\t\t\n    </div>\n    \n    <div id=\"list-sum\">\n\t\t<span id=\"list-sum-ts\">${nls.total}: </span>\n\t\t<span style=\"float:right;margin-right:10px\">\n\t\t\t<span id=\"list-sum-title\"></span>\n\t\t\t<span id=\"list-sum-total\"></span>\n\t\t</span>\n\t</div>\n\t\n    <ul data-dojo-type=\"dojox/mobile/TabBar\" data-dojo-props=\"fixed:'bottom'\">\n\t\t<li data-dojo-type=\"dojox/mobile/TabBarButton\" id='list-is-e'\n\t\t\tdata-dojo-props=\"target: 'list', icon: 'icons/icon_transactions.png', iconPos1:'0,19,19,17',\n                    transitionOptions: { params: { type: 'e', id : this.params.id } }\">${nls.expences}</li>\n\t\t<li data-dojo-type=\"dojox/mobile/TabBarButton\" id='list-is-i'\n\t\t\tdata-dojo-props=\"target: 'list',icon: 'icons/icon_transactions.png', iconPos1:'0,0,19,17',\n                    transitionOptions: { params: { type: 'i', id : this.params.id } }\">${nls.incomes}</li>\n\t\t<li data-dojo-type=\"dojox/mobile/TabBarButton\" id='list-is-t'\n\t\t\tdata-dojo-props=\"target: 'list', icon: 'icons/icon_transactions.png', iconPos1:'0,38,21,17',\n                    transitionOptions: { params: { type: 't', id : this.params.id } }\">${nls.transfers}</li>\n\t</ul>\n\t\n    <div data-dojo-type=\"money/WheelScrollableView\"\n\t\tdata-dojo-props=\"threshold:window.AppData.treshold\">\n\t\t\n\t\t<div \n\t\t\tdata-dojo-type=\"dojox/mobile/RoundRectCategory\" \n\t\t\tdata-dojo-attach-point=\"emptyMsgTitle\">\n\t\t\t\t${nls.noExpences}\n\t\t</div>\n\t\t<div \n\t\t\tdata-dojo-attach-point=\"emptyMsg\"\n\t\t\tdata-dojo-type=\"dojox/mobile/RoundRect\" \n\t\t\tdata-dojo-props='shadow:true'>\n\t\t\t\t${nls.tapAdd}\n\t\t</div>\n\n\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeStoreList\"\n            data-dojo-attach-point=\"transactions\" id=\"daily-list\"\n            data-dojo-props=\"store: this.loadedStores.transactions,\n\t\t\t\t\t\t\tquery: this.query,syncWithViews: true,\n                            createListItem: this.createListItem,\n\t\t\t\t\t\t\tlabelProperty: 'cats',append:false,\n                            itemRenderer: this.listItem\">\n\t\t</div>\n    </div>\n</div>\n"}});
define("money/views/list", ["dojo/_base/declare","dojo/on", "dojox/gesture/swipe","dojo/date","dojo/date/locale",
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
