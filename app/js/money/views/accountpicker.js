define(["dijit/registry","dojo/_base/array","dojo/query","dojo/sniff","dojo/dom-class",'dojo/text!money/views/accountpicker.html'],
    function(registry, arrayUtil, query, has, domClass){
 
		return window.AppData.objAcc = {
			
			beforeActivate: function(){
				if(window.AppData.objDet){
					//this.tagsPicker.set('store',window.AppData.tagsStore)
					this.accountPicker.set('store',window.AppData.accountStore)
					this.accountPicker.refresh()
					window.A = this.accountPicker
					this.acc = (this.params.mode == "to" ? window.AppData.details.accountTo : window.AppData.details.account)
					registry.byId('newAccount').set('value', this.acc.get('label'));
					this.initializeList()
				}else{//if details view is not initialized goto details
					this.app.transitionToView(this.domNode, {target: 'details' , transitionDir: 1, params: { 'edit' : true } })
				}
			},
			init: function(){
				//window.AppData.accountPickerOverlay = this
				this.accountPicker.set('store',window.AppData.accountsStore)
				if(has('isInitiallySmall')){
					domClass.remove	(this.domNode, "left");
				}
				var self = this
				this.done.onClick = function(){
					window.AppData.objDet.acc(self.acc);
					var a = window.AppData.accountStore.query({'label': window.AppData.details.account.get('label')})
					window.AppData.details.currency.set('label',a[0]?a[0].currency:"EUR")
					var t = window.AppData.isInitiallySmall ? 'details' : 'navigation+details'
					window.dFinance.transitionToView(this.domNode,{
						target: t , transitionDir: -1,
						params: {'edit' : true, doNotReload : true, 'id': window.AppData.details.params.id}
					})
				}
			},
			initializeList: function(){
				//window.registry = registry
				console.log('initializeng tag list')
				var tags = this.acc.get('label'),q
				console.log(tags, registry.byId(String(tags)))
				var list = this.accountPicker.getChildren()
				for (var i in list)
					list[i].set('checked',false)
				if(registry.byId(String(tags))){
						registry.byId(String(tags)).set('checked',true)
				}else if(q = window.AppData.accountStore.query({label: String(tags)})[0])
					if(registry.byId(String(q.id))){
						registry.byId(String(q.id)).set('checked',true)				
					}
				var list = query("#accountPicker .mblListItem")
				arrayUtil.forEach(list,function(li){
					if(!registry.byId(String(li.id))._onClickSetUp){
						registry.byId(String(li.id)).onClick = function(){
							var account = window.AppData.accountStore.get(this.id)
							registry.byId('newAccount').set('value', account.label);
						}
						registry.byId(String(li.id))._onClickSetUp = true
					}
				})
			}
		}
	}
);
