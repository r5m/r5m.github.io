define("money/views/accounts", [
	"dojo/_base/declare","dojox/mobile/TextBox","dojo/_base/array", "dojox/mobile/ListItem",
	"dijit/registry","dojo/dom-attr","dojo/json","dojo/dom-style",
	"dojox/mobile/ToolBarButton","money/dialog"
 ],
    function(declare,TextBox,arrayUtil, ListItem,   registry, domAttr,json, domStyle,Button, Dialog){
    
	return {
		beforeActivate: function(contact){
			window.AppData.numberPicker.mode = "a"
			this.start()
        },
        afterActivate: function(){
			window.hideProgress()
		},
		//l - number of existing accounts
		displayEmptyMsgs: function(l){
			domStyle.set('no-accounts-accounts','display', !l? 'block':'none')
			domStyle.set('accs-list','display', l? 'block':'none')
		},
        init: function(){
			window.AppData.objAccounts = this
			window.AppData.numberPicker._onDoneCallbackRegistry.push({
				scope 	: window.AppData.objAccounts,
				fn 		: window.AppData.objAccounts.getAmount,
				mode	: "a"
			})
			var self = this
			this.addBtn.onClick = function(){
				self.addNew();
			}
			this.dlg = window.AppData.dialogWindow ? window.AppData.dialogWindow : (window.AppData.dialogWindow = new Dialog);
			this.start();
			
		},
		start: function(){
			arrayUtil.forEach(this.accList.getChildren(), function(chWidget){
				chWidget.destroyRecursive()
			})
			
			var accs = window.AppData.store.getAccounts();
			console.log(accs)
			arrayUtil.forEach(accs, function(account){
				this.addExisting(account)
			},this)
			
			this.displayEmptyMsgs(accs.length)
			
		},
		getAmount: function(amount){
			window.AppData.objAccounts.account.startAmount = Math.abs(amount)
			registry.byId('ab-'+window.AppData.objAccounts.account.id).set('label',getMoney(
				window.AppData.objAccounts.account.startAmount
			))
			this.save()
		},
		addNew: function(){
			var self = this
			this.dlg.show(false, self.nls.newAccount + ". " +  self.nls.chooseCurrency, self.nls.createAccount, self.nls.process, function(){
				window.dFinance.transitionToView(self.domNode,{
					target: "currencypicker",
						transitionDir: 1,
						params : {backTo : 'accounts'}
					}
				)
			})
		},
		add: function(currency){
			var item = item || {label:'',startAmount:0, et: new Date().getTime(),'currency':currency, maincur: currency}
			var existing = window.AppData.accountStore.get(
				window.AppData.accountStore.add(item)
			)
			window.AppData.objAccounts.account = existing;
			this.addExisting(existing)
			this.save()
			
			this.displayEmptyMsgs(1) //always present at least one account
			
		},
		addExisting: function(account){
			var self = this
			if(account.startAmount == undefined) 
				account.startAmount = 0;
			deleteAccount = function(e, _this){
				e.preventDefault();
				e.stopPropagation();
				var id = domAttr.get(_this,"data-finance-id")
				if(id){
					var thisAccountItems = window.AppData.store.query({account: id})
					arrayUtil.forEach(thisAccountItems, function(item){
						window.AppData.store.removeItem(item.id)
					})
					thisAccountItems = window.AppData.store.query({accountTo: id})
					arrayUtil.forEach(thisAccountItems, function(item){
						window.AppData.store.removeItem(item.id)
					})
					
					window.AppData.accountStore.remove(id);
					
					self.displayEmptyMsgs(window.AppData.accountStore.query().length)
					
					var deleted = localStorage.getItem('deletedAccounts') ? json.parse(localStorage.getItem('deletedAccounts')) : new Array();
					deleted.push(id);
					localStorage.setItem('deletedAccounts',json.stringify(deleted));
					registry.byId('li'+id).destroyRecursive();
					window.AppData.store._setAccounts(window.AppData.store.getAccounts());
				}
			}
			this.accList.addChild(new ListItem({
				label: '<div ontouchstart="window.AppData.touched = true; deleteAccount(event,this)"'+
				'onclick="if(!window.AppData.touched)  deleteAccount(event,this)" data-finance-id="'+account.id+'" class="domButton mblDomButtonBlueCircleMinus"><div><div><div></div></div></div></div><input type="text" id="a-'+ account.id + '" value="' + account.label +'"/>',
				rightText: '<button id = "ab-'+account.id+'"></button><button id = "mb-'+account.id+'"></button>',
				'class':'button-at-right',
				id: 'li'+account.id
			}))
			var tb = new TextBox({
				onChange: function(value){
					window.AppData.objAccounts.account = account
					window.AppData.objAccounts.account.label = value
					self.save()
				},
				placeHolder: "Account title"
			},"a-"+account.id)
			var aBtn = new Button({
				label: getMoney(account.startAmount,account.maincur),
				_onTouchStart: function(){
					window.AppData.objAccounts.account = account
					window.AppData.numberPicker.show()
				},
				'class': 'mblButton mblGreyButton',
				style: 'margin:0'
			},"ab-"+account.id)
			aBtn.startup()
			
			var mBtn = new Button({
				label: account.currency ? account.currency : "USD",
				_onTouchStart: function(){
					window.dFinance.transitionToView(this.domNode,{
						target: "currencypicker" , transitionDir: 1,
						params: {'id' : account.id, 'backTo':'accounts'}
					})
				},
				'class': 'mblButton mblGreyButton',
				style: 'margin:0 0 0 10px'
			},"mb-"+account.id)
			mBtn.startup()
			
		},
		save: function(){
			var account = window.AppData.objAccounts.account;
			if(account){
				account.et = new Date().getTime()
				window.AppData.accountStore.put(account)
			}
			window.AppData.store._setAccounts(window.AppData.store.getAccounts())
			
		}
    };
});
