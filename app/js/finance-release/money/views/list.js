define("money/views/list", ["dojo/_base/declare","dojo/on", "dojox/gesture/swipe","dojo/date","dojo/date/locale",
	"dojo/dom-construct", "dojo/dom-style",'dojo/dom-class',
	"dojo/_base/array","dojo/_base/lang", 
	"dijit/registry","dojo/dom","dojo/dom-attr", 
	"dojo/date/locale","dojox/mobile/ListItem",
    "dojox/mobile/EdgeToEdgeStoreList"],
    function(declare, on, swipe, date, locale, domConstruct, domStyle, domClass, arrayUtil,lang, registry, dom, domAttr, locale, ListItem){
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
 
 
    return self = {
		afterActivate: function(){
			window.hideProgress()
			
			
		},
		_accountTemplate:
			'<div><span class="transaction-amount">${amount}</span><span class="transaction-account">${account} </span></div>',
		substitute: function(template, data) {
			var self = this
			return template.replace(/\$\{([^\s\:\}]+)(?:\:([^\s\:\}]+))?\}/g, function(match, key){
				if(data[key]!=undefined || (key.substr(0,1) == "!" && data[key.substr(1)]))
					return (key.substr(0,1)=="!" ? self.capitalize(data[key.substr(1)]):data[key])
				return ""			
			});
		},
		capitalize: function(str){
			return str.substr(0,1).toUpperCase() + str.substr(1,str.length-1).toLowerCase()
		},
		_getDate : function(date, to, pattern){
			var to = to || "EEE dd MMM yyyy"
			var pattern = pattern || window.AppData.widgetDateFormat
			var date2 = isValidDate(date) ? date : locale.parse(date, {selector:"date", datePattern:pattern})
			return this.capitalize(locale.format(date2, {selector:"date", datePattern:to}))
		},
		_renderHeader: function(){
			var date = window.AppData.currentDate
			registry.byId('list-title').set('label',this._getDate(date))
			var t = ['e','i','t']
			for (var i in t)
				registry.byId('list-is-'+t[i]).set('selected',false)
			registry.byId('list-is-'+window.AppData.currentType).set('selected',true)
		},
		beforeActivate: function(contact){
            var self = this
            
            var callback = function(){
				var _self = window.dFinance.children.dFinance_list
				if(_self.params.type)
					window.AppData.currentType = _self.params.type
				if( _self.params.id)
					window.AppData.currentDate = _self.params.id;
				//empty page
				arrayUtil.forEach(registry.byId('daily-list').getChildren(), function(li){
					li.destroyRecursive()
				})
				domConstruct.empty('daily-list')
				//
				_self.transactions.refresh()
				self._renderHeader()
			
				_self.reloadPage();
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
			var self = this
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
			var itemClone = lang.clone(item)
			itemClone.amount = getMoney(item.amount, window.AppData.store.getAccount(item.account).maincur)
			console.log('item is ', item)
			itemClone.account = 
				( itemClone.type!="t" ) ? 
					window.AppData.store.getAccount(item.account).label : 
				( window.AppData.store.getAccount(item.account).label + " -> " + 
					(window.AppData.store.getAccount(item.accountTo) ? window.AppData.store.getAccount(item.accountTo).label : '...'))
			var tags = ""
			for (var i in item.tags){
				if(tags != "") tags+=", "
				tags += window.AppData.store.getTag(item.tags[i]).label
			}
			if(tags == "") tags = "No tags"
			itemClone.cats = 
				"<div class='date-header'>" + tags + "</div>" + "<div class='summary'>"+self.substitute(self._accountTemplate, itemClone)+"</div>"+
				(itemClone.descr ? ("<div class='li-descr'><hr/>"+itemClone.descr+"</div>") : "")
			
			//rData.display = (rData.descr ? "display:inline" : "display:none")
			console.log(itemClone)
			return new this.itemRenderer(
				this._createItemProperties(itemClone)
			);			
		}
    };
});
