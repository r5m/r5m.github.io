require({cache:{
'url:money/views/currencypicker.html':"<div data-dojo-type=\"dojox/app/widgets/Container\" >\n\t<h1 data-dojo-type=\"dojox/mobile/Heading\" data-dojo-props=\"fixed:'top',label:'${nls.title}'\">\n\t\t\t<div data-dojo-type=\"money/TouchableToolBarButton\" label=\"${nls.done}\" class=\"mblRedButton right-button\"\n\t\t\t\tdata-dojo-attach-point = \"done\"\n\t\t\t></div>\n\t\t</h1>\n\t\t<div data-dojo-type=\"dojox/mobile/Heading\" data-dojo-props=\"fixed:'top'\" class=\"mblSecondHeading\" style=\"height:auto\">\n\t\t\t\t<div style=\"padding: 5px 20px;\">\n\t\t\t\t\t<div class=\"view-help\">${nls.selectCurrency}</div>\n\t\t\t\t\t<input type=\"text\" data-dojo-type=\"dojox/mobile/TextBox\" id=\"currencyInput\" \n\t\t\t\t\t\tdata-dojo-props=\"placeHolder:'Euro (EUR)', readOnly: true\"/>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t<div class=\"heading-button-wrapper\"><button \n\t\t\t\tdata-dojo-type=\"money/TouchableButton\" \n\t\t\t\tclass=\"mblBlueButton\" \n\t\t\t\tdata-dojo-attach-point=\"more\"\n\t\t\t\tstyle=\"width: 100%;\">\n\t\t\t\t${nls.more}\n\t\t\t</button>\n\t\t</div>\n\t\t<div \n\t\t\tdata-dojo-attach-point=\"scrollView\"\n\t\t\tdata-dojo-type=\"money/WheelScrollableView\" \n\t\t\tdata-dojo-props=\"threshold:window.AppData.treshold\">\n\t\t\t\n\t\t\t<div id=\"currencyPicker\" \n\t\t\t\tdata-dojo-type=\"dojox/mobile/RoundRectStoreList\"\n                data-dojo-mixins=\"dojox/mobile/LongListMixin\"\n\t\t\t\tdata-dojo-attach-point=\"currencyPicker\"\n\t\t\t\tdata-dojo-props=\"\n\t\t\t\t\tmaxPages:3, \n\t\t\t\t\tpageSize:10, \n\t\t\t\t\tquery: this.query, \n\t\t\t\t\tqueryOptions: {sort: [{attribute:'label', descending: false}] },\n\t\t\t\t\tstateful:true, \n\t\t\t\t\tstore: window.AppData.currencyStore, \n\t\t\t\t\tselect:'single'\">\n\t\t\t</div>\n\t\t\t\n\t\t</div>\n\t\t\n</div>\t\n"}});
define("money/views/currencypicker", ["dijit/registry","dojo/_base/array","dojo/query", 'dojo/on', "dojo/sniff","dojo/dom-class", "dojox/mobile/LongListMixin", "money/WheelScrollableView", 'dojo/text!money/views/currencypicker.html'],
    function(registry, arrayUtil, query, on, has, domClass){
 
		return window.AppData.objCur = {
			
			beforeDeactivate: function(){
				this._moreEnabled = false
			},
			beforeActivate: function(){
				var self = this;
				var cur = (self.params.id ? (window.AppData.accountStore.get(self.params.id).maincur 
					? window.AppData.accountStore.get(self.params.id).maincur : "EUR") : ( window.AppData.currency ? window.AppData.currency : "EUR" ));
				var label = cur
				
				arrayUtil.forEach(self.currencyPicker.getChildren(),function(_cur){				
					_cur.set('checked', ( _cur.id == cur ) ? ( label=_cur.get('label'), true ) : false)
				});
				
				registry.byId('currencyInput').set('placeHolder', label)
				console.log(self._moreEnabled)
				
				arrayUtil.forEach(self.currencyPicker.getChildren(),function(_cur){
					_cur.onClick = function(){
						registry.byId('currencyInput').set('value', _cur.get('label'))
					}
				})
				
			},
			
			query: function( item ) {
				if(dFinance.views.currencypicker._moreEnabled)
					return true;
					
				var curList = ['chf', 'aud', 'cad', 'brl', 'jpy', 'rub', 'usd', 'gbp', 'inr', 'eur', 'zar', window.AppData.currency], 
					presented = false,
					accs = window.AppData.accountStore.query();
				for( var i=0; i < accs.length; i++ ) {
					curList.push( accs[i].currency );
					curList.push( accs[i].maincur );
				}
				for(	 i=0; i < curList.length; i++ )
					if( String( curList[i] ).toLowerCase() == String( item.id ).toLowerCase() )
						{ presented = true; break; }
				
				return presented;
			},
			
			init: function(){
				var self = this;
				dFinance.views.currencypicker._moreEnabled = false
				this.more.onClick = function(){
					dFinance.views.currencypicker._moreEnabled = !dFinance.views.currencypicker._moreEnabled;
					self.more.set('label', self.nls[ (dFinance.views.currencypicker._moreEnabled ? 'less' : 'more') ])
					self.scrollView.scrollTo(0, 0);
					self.currencyPicker.refresh();
					
					var cur = (self.params.id ? (window.AppData.accountStore.get(self.params.id).maincur 
						? window.AppData.accountStore.get(self.params.id).maincur : "EUR") : ( window.AppData.currency ? window.AppData.currency : "EUR" ));
					var label = cur
				
					arrayUtil.forEach(self.currencyPicker.getChildren(),function(_cur){				
						_cur.set('checked', ( _cur.id == cur ) ? ( label=_cur.get('label'), true ) : false)
					});
				
					registry.byId('currencyInput').set('placeHolder', label)
					registry.byId('currencyInput').set('value', '')
					
					arrayUtil.forEach(self.currencyPicker.getChildren(),function(_cur){
						_cur.onClick = function(){
							registry.byId('currencyInput').set('value', _cur.get('label'))
						}
					})
				
				}
				console.log(self.params)
				
				
				this.done.on('click', function(){
					var cur = "", transitionOptions = {}
					if(self.params.id){
						window.AppData.objAccounts.account =
							window.AppData.accountStore.get(self.params.id)
					}
					
					arrayUtil.forEach(self.currencyPicker.getChildren(),function(_cur){
						if(_cur.get('checked'))
							{cur = _cur.id; return}
					})	
					
					
					//if choosing home currency
					if(self.params.backTo == "summary"){
						transitionOptions = {
							params: {
								currency: cur
							}
						}
					
					//if adding new / modifying account
					}else if(self.params.backTo == "accounts"){
						if( self.params.id ) {
							window.AppData.objAccounts.account.currency = cur;
							registry.byId("mb-"+self.params.id).set('label',cur)
							window.AppData.objAccounts.save()
						} else {
							window.dFinance.transitionToView( this.domNode, {
								"target": self.params.backTo , "transitionDir": -1, params: { currency: cur, create: 1 } 
							});
							return;
						}					
					//if adding new transaction
					}else if(self.params.backTo == "details"){
						
						//set transaction amount currency
						if(self.params.setCurrency){
							window.AppData.details.currency.set( 'label', cur + '...' )
							window.AppData.details.transaction.currency = cur
							
							var view = window.AppData.details;
							view.transaction.account =
								window.AppData.accountStore.get( view.params.id )
							
							cur = cur.toLowerCase();	
							if(cur && view.zeroCounts[cur] != undefined )
								view.zeros = view.zeroCounts[cur];
							else view.zeros = 2;				
							
							view.amount.set("label",
								getNumber( view.transaction.amount, view.zeros ))
							transitionOptions = {
								params: {
									doNotReload: true,
									id: self.params.transaction
								}
							}
						//set new account-to currency
						}else if(self.params.proceed)
							transitionOptions = {
								params: {
									currency: self.params.currency ? self.params.currency : "", 
									doNotReload: true,
									proceed: true,
									proceed2: true,
									currencyTo : cur
								}
							}
						//set new account currency
						else
							transitionOptions = {
								params: {
									currency: cur, 
									doNotReload: true,
									proceed: true
								}
							}
					}
					window.dFinance.transitionToView(self.domNode, {
						"target"		: self.params.backTo , 
						"transitionDir"	: -1 ,
						"params"		: transitionOptions.params
					})
					
				}
			)
		}
	}
});
