require({cache:{
'url:money/views/accountpicker.html':"<div class=\"\" data-dojo-type=\"dojox/app/widgets/Container\" >\n\t<h1 data-dojo-type=\"dojox/mobile/Heading\" data-dojo-props=\"fixed:'top',label:'${nls.title}'\">\n\t\t\t<div data-dojo-type=\"dojox/mobile/ToolBarButton\" label=\"${nls.done}\" class=\"mblBlueButton right-button\"\n\t\t\t\tdata-dojo-attach-point = \"done\"\t\t\t\t\n\t\t\t></div>\n\t\t</h1>\n\t\t<div data-dojo-type=\"money/WheelScrollableView\">\n\t\t<div data-dojo-type=\"dojox/mobile/Heading\" data-dojo-props=\"fixed:'top'\" style=\"height:auto\" class=\"mblSecondHeading\">\n\t\t\t<div style=\"padding: 5px 20px;\">\n\t\t\t\t<div class=\"view-help\">${nls.viewHelp}</div>\n\t\t\t\t<input type=\"text\" data-dojo-type=\"dojox/mobile/TextBox\" id=\"newAccount\" \n\t\t\t\t\tdata-dojo-props=\"placeHolder:'Enter account title'\"/>\n\t\t\t</div>\n\t\t</div>\n\t\t<div style=\"padding: 0 10px 10px 10px\">\n\t\t\t<div id=\"accountPicker\" \n\t\t\t\tdata-dojo-type=\"dojox/mobile/RoundRectStoreList\"\n\t\t\t\tdata-dojo-attach-point=\"accountPicker\"\n\t\t\t\tdata-dojo-props=\"stateful:true,store: window.AppData.accountStore, select:'single'\">\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>\t\n"}});
define("money/views/accountpicker", ["dijit/registry","dojo/_base/array","dojo/query","dojo/sniff","dojo/dom-class",'dojo/text!money/views/accountpicker.html'],
    function(registry, arrayUtil, query, has, domClass){
 
		return window.AppData.objAcc = {
			
			beforeActivate: function(){
				if(window.AppData.details){
					//this.tagsPicker.set('store',window.AppData.tagsStore)
					this.accountPicker.set('store',window.AppData.accountStore)
					this.accountPicker.refresh()
					this.acc = (this.params.mode == "to" ? 
						window.AppData.details.accountTo : 
						window.AppData.details.account
					)
					console.log( this.acc )
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
					//window.AppData.objDet.acc(self.acc);
					var view = window.AppData.details;
						view.acc( self.acc )
					
					var a = window.AppData.accountStore.query({'label': window.AppData.details.account.get('label')});
						view.currency.set( 'label', a[0] ? a[0].currency: "EUR" );
						//view.transaction.account =
						//	window.AppData.accountStore.get( a[0].id )
						
						view.transaction.currency = (a[0] ? a[0].currency: "eur" ).toLowerCase();
					
							
						cur = view.transaction.currency;
						if(cur && view.zeroCounts[cur] != undefined )
							view.zeros = view.zeroCounts[cur];
						else view.zeros = 2;
						
						console.log('!!!1',view.zeros, cur)
						
						view.amount.set("label",
							getNumber( view.transaction.amount, view.zeros ))
							
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
