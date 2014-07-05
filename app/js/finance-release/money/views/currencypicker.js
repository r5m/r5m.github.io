define("money/views/currencypicker", ["dijit/registry","dojo/_base/array","dojo/query","dojo/sniff","dojo/dom-class", "dojox/mobile/LongListMixin", "money/WheelScrollableView"],
    function(registry, arrayUtil, query, has, domClass){
 
		return window.AppData.objCur = {
			
			beforeActivate: function(){
				
			},
			init: function(){
				var self = this
				console.log(self.params)
				arrayUtil.forEach(self.currencyPicker.getChildren(),function(_cur){
					_cur.set('checked', _cur.id == 
						(self.params.id ? (window.AppData.accountStore.get(self.params.id).maincur 
							? window.AppData.accountStore.get(self.params.id).maincur : "EUR") : "EUR") 
						? true : false)
				})
				this.done.onClick = function(){
					var cur = "", transitionOptions = {}
					if(self.params.id){
						window.AppData.objAccounts.account =
							window.AppData.accountStore.get(self.params.id)
					}
					arrayUtil.forEach(self.currencyPicker.getChildren(),function(_cur){
						if(_cur.get('checked'))
							{cur = _cur.id; return}
					})	
					if(self.params.backTo == "summary"){
						transitionOptions = {
							params: {
								currency: cur
							}
						}//window.AppData.objAccounts
					}else if(self.params.backTo == "accounts"){
						window.AppData.objAccounts.add(cur);
						window.dFinance.transitionToView(this.domNode,{
							"target": self.params.backTo , "transitionDir": -1
						});
					}else if(self.params.backTo == "details" && self.params.transaction){
						window.AppData.details.currency.set('label',cur)
						window.AppData.details.transaction.currency = cur
						console.log(window.AppData.details.currency)
						if(self.params.setCurrency){
							transitionOptions = {
								params: {
									doNotReload: true,
									id: self.params.transaction
								}
							}
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
						else
							transitionOptions = {
								params: {
									currency: cur, 
									doNotReload: true,
									proceed: true
								}
							}
					}else if(self.params.id){
						window.AppData.objAccounts.account.currency = cur;
						//var t = window.AppData.isInitiallySmall ? 'details' : 'navigation+details'
						registry.byId("mb-"+self.params.id).set('label',cur)
						window.AppData.objAccounts.save()
					}
					window.dFinance.transitionToView(self.domNode,{
						"target": self.params.backTo , "transitionDir": -1,
						"params": transitionOptions.params
					})
					
				}
			}
		}
	}
);
