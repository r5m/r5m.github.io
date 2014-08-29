require({cache:{
'url:money/views/currencypicker.html':"<div data-dojo-type=\"dojox/app/widgets/Container\" >\n\t<h1 data-dojo-type=\"dojox/mobile/Heading\" data-dojo-props=\"fixed:'top',label:'${nls.title}'\">\n\t\t\t<div data-dojo-type=\"money/TouchableToolBarButton\" label=\"${nls.done}\" class=\"mblRedButton right-button\"\n\t\t\t\tdata-dojo-attach-point = \"done\"\n\t\t\t></div>\n\t\t</h1>\n\t\t<div data-dojo-type=\"dojox/mobile/Heading\" data-dojo-props=\"fixed:'top'\" class=\"mblSecondHeading\" style=\"height:auto\">\n\t\t\t\t<div style=\"padding: 5px 20px;\">\n\t\t\t\t\t<div class=\"view-help\">${nls.selectCurrency}</div>\n\t\t\t\t\t<input type=\"text\" data-dojo-type=\"dojox/mobile/TextBox\" id=\"currencyInput\" \n\t\t\t\t\t\tdata-dojo-props=\"placeHolder:'Euro (EUR)', readOnly: true\"/>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t<div data-dojo-type=\"money/WheelScrollableView\" data-dojo-props=\"threshold:window.AppData.treshold\">\n\t\t\t\n\t\t\t<div id=\"currencyPicker\" \n\t\t\t\tdata-dojo-type=\"dojox/mobile/RoundRectStoreList\"\n                data-dojo-mixins=\"dojox/mobile/LongListMixin\"\n\t\t\t\tdata-dojo-attach-point=\"currencyPicker\"\n\t\t\t\tdata-dojo-props=\"maxPages:3, pageSize:10,  stateful:true, store: window.AppData.currencyStore, select:'single'\">\n\t\t\t</div>\n\t\t</div>\n\t\n</div>\t\n"}});
define("money/views/currencypicker", ["dijit/registry","dojo/_base/array","dojo/query", 'dojo/on', "dojo/sniff","dojo/dom-class", "dojox/mobile/LongListMixin", "money/WheelScrollableView", 'dojo/text!money/views/currencypicker.html'],
    function(registry, arrayUtil, query, on, has, domClass){
 
		return window.AppData.objCur = {
			
			beforeActivate: function(){
				var self = this;
				var cur = (self.params.id ? (window.AppData.accountStore.get(self.params.id).maincur 
					? window.AppData.accountStore.get(self.params.id).maincur : "EUR") : ( window.AppData.currency ? window.AppData.currency : "EUR" ));
				var label = cur
				arrayUtil.forEach(self.currencyPicker.getChildren(),function(_cur){				
						
					_cur.set('checked', ( _cur.id == cur ) ? ( label=_cur.get('label'), true ) : false)
					
				});
				
				registry.byId('currencyInput').set('placeHolder', label)
			},
			init: function(){
				var self = this
				console.log(self.params)
				arrayUtil.forEach(self.currencyPicker.getChildren(),function(_cur){
					on (_cur, 'click', function(){
						registry.byId('currencyInput').set('value', _cur.get('label'))
					})
				})
				
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
