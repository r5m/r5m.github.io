require({cache:{
'url:money/views/details.html':"<div class=\"mblBackground\">\n\t<div data-dojo-type=\"money/WheelScrollableView\" data-dojo-props=\"threshold:window.AppData.treshold\">\n\t\t<div data-dojo-type=\"dojox/mobile/Heading\" class=\"title\"\n\t\tdata-dojo-props=\"fixed: 'top'\">\n\t\t<button data-dojo-type=\"money/TouchableToolBarButton\"\n\t\t\t\tdata-dojo-attach-point=\"backButton\"\n\t\t\t\tdata-dojo-props=\"arrow: 'left', target: window.AppData.isInitiallySmall ? 'list' : 'navigation+list', transitionDir: -1, transitionOptions: { params: { id: window.AppData.currentDate }}, onClick: function(){console.log(this)}\"\n\t\t\t\tclass=\"left-button\"\n\t\t\t\tclass=\"backButton\">${nls.daily}</button>\n\n\t\t${nls.details}\n\n\t\t<button data-dojo-type=\"money/TouchableToolBarButton\"\n\t\t\t\tdata-dojo-attach-point=\"editButton\"\n\t\t\t\tclass=\"right-button mblRedButton\"\n\t\t\t\tdata-dojo-props=\"transitionOptions: { params: { id: window.AppData.currentDate }}\"></button>\n\t\t\t\t\n\t</div>\n\t<div data-dojo-type=\"dojox/mobile/FormLayout\"\n         data-dojo-attach-point=\"formLayout\">\n        <div>\n\t\t\t<label for=\"type\">${nls.type}</label>\n\t\t\t<ul data-dojo-type=\"dojox/mobile/TabBar\" data-dojo-props=\"barType: 'segmentedControl'\" class=\"no-background\" id = \"type\">\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/TabBarButton\" id='det-is-e'\n\t\t\t\tdata-dojo-props=\"selected:true, onClick:this.setTypeE\">${nls.expence}</li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/TabBarButton\" id='det-is-i'\n\t\t\t\tdata-dojo-props=\"onClick:this.setTypeI\">${nls.income}</li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/TabBarButton\" id='det-is-t'\n\t\t\t\tdata-dojo-props=\"onClick:this.setTypeT\">${nls.transfer}</li>\n\t\t\t</ul>\n        </div>\n        \n        <div>\n            <label for=\"amount\">${nls.date}</label>\n            <fieldset>\n                <div id=\"date\" name=\"date\"\n                        data-dojo-type=\"dojox/mobile/ToolBarButton\"\n                        data-dojo-attach-point=\"date\"\n                        data-dojo-props=\"'class':'mblGreyButton mblButton',onClick: function(){\n\t\t\t\t\t\t\t\t//window.BTN = this\n\t\t\t\t\t\t\t\tdijit.registry.byId('transactionDateOverlay').show('date', ['below-centered','above-centered','after','before'])\n\t\t\t\t\t\t\t}\"></div>\n\t\t\t\t\t\t\t<div id=\"datePicker\" \n\t\t\t\tdata-dojo-type=\"dojox/mobile/SpinWheelDatePicker\"\n\t\t\t\tdata-dojo-attach-point=\"datePicker\">\t\t\t\t\n\t\t\t</div>\n            </fieldset>\n        </div>\n        \n        <div>\n            <label for=\"account\">${nls.account}</label>\n            <fieldset>\n                <button id=\"account\" name=\"account\"\n                        data-dojo-type=\"dojox/mobile/ToolBarButton\"\n                        data-dojo-attach-point=\"account\"\n                        data-dojo-props=\"'class':'mblGreyButton mblButton', onClick: function(){\n\t\t\t\t\t\t\twindow.dFinance.transitionToView(this.domNode, {\n\t\t\t\t\t\t\t\ttarget: window.AppData.isInitiallySmall ? 'accountpicker' : 'accountpicker' , transitionDir: 1,\n\t\t\t\t\t\t\t\tparams: {'id': window.AppData.details.params.id, doNotReload: true}\n\t\t\t\t\t\t\t});\n\t\t\t\t\t\t\t//dijit.registry.byId('transactionAccountOverlay').show('account', ['below-centered','above-centered','after','before'])\n\t\t\t\t\t\t\n\t\t\t\t\t\t}\"></button>\n            </fieldset>\n        </div>\n        \n        <div>\n            <label for=\"amount\">${nls.amount}</label>\n            <fieldset>\n                <button id=\"currency\" name=\"currency\"\n                        data-dojo-type=\"dojox/mobile/ToolBarButton\"\n                        data-dojo-attach-point=\"currency\"\n                        data-dojo-props=\"'class':'mblBlueButton mblButton two-two'\"></button>                \n                <button id=\"amount\" name=\"amount\"\n                        data-dojo-type=\"dojox/mobile/ToolBarButton\"\n                        data-dojo-attach-point=\"amount\"\n                        data-dojo-props=\"'class':'mblGreyButton mblButton one-two',onClick: function(){window.AppData.numberPicker.show()}\"></button>\n                \n            </fieldset>\n        </div>\n        \n        <div id=\"accountTo-container\">\n            <label for=\"accountTo\">${nls.accountTo}</label>\n            <fieldset>\n                <button id=\"accountTo\" name=\"accountTo\"\n                        data-dojo-type=\"dojox/mobile/ToolBarButton\"\n                        data-dojo-attach-point=\"accountTo\"\n                        data-dojo-props=\"'class':'mblGreyButton mblButton',onClick: function(){\n\t\t\t\t\t\t\twindow.dFinance.transitionToView(this.domNode, {\n\t\t\t\t\t\t\t\ttarget: window.AppData.isInitiallySmall ? 'accountpicker' : 'accountpicker' , transitionDir: 1,\n\t\t\t\t\t\t\t\tparams: {'id': window.AppData.details.params.id, doNotReload: true, mode: 'to'}\n\t\t\t\t\t\t\t});\n\t\t\t\t\t\t}\"></button>\n            </fieldset>\n        </div>\n        <div>\n            <label for=\"tags\">${nls.categories}</label>\n            <fieldset>\n                <button id=\"tags\" name=\"tags\"\n                        data-dojo-type=\"dojox/mobile/ToolBarButton\"\n                        \n                        data-dojo-props=\"'class':'mblGreyButton mblButton',onClick:function(){\n\t\t\t\t\t\t\twindow.dFinance.transitionToView(this.domNode, {\n\t\t\t\t\t\t\t\ttarget: window.AppData.isInitiallySmall ? 'tagspicker' : 'tagspicker' , transitionDir: 1,\n\t\t\t\t\t\t\t\tparams: {'id': window.AppData.details.params.id, doNotReload: true}\n\t\t\t\t\t\t\t});\n\t\t\t\t\t\t}\"\n                        data-dojo-attach-point=\"tags\"></button>\n            </fieldset>\n        </div>\n        <div>\n            <label for=\"descr\">${nls.description}</label>\n            <fieldset class=\"text\">\n                <textarea id=\"descr\" name=\"descr\"\n                        data-dojo-type=\"dojox/mobile/ExpandingTextArea\"\n                        data-dojo-attach-point=\"descr\"></textarea>\n            </fieldset>\n        </div>\n\t</div>\n    \n</div>\n\t<div data-dojo-type=\"dojox/mobile/Heading\" class=\"bottom\"\n        data-dojo-props=\"fixed: 'bottom'\">\n        <div data-dojo-type=\"dojox/mobile/ToolBarButton\" data-dojo-props=\"disabled: true\"\n                    data-dojo-attach-point=\"deleteButton\"\n                    data-dojo-attach-event=\"onClick: deleteContact\"\n                    class=\"left-button\">\n                <i class=\"fa fa-trash-o\"></i> ${nls.remove}\n            </div>\n\t</div> \n\t\n\t<div id=\"transactionDateOverlay\" data-dojo-type=\"dojox/mobile/SimpleDialog\" class=\"overlay date-overlay\">\n\t\t<div class=\"wrapper1\">\n\t\t\t<h2 style=\"margin: 0px; line-height: 45px;\">\n\t\t\t\t<div data-dojo-type=\"dojox/mobile/ToolBarButton\"\n\t\t\t\t\tlabel=\"${nls.done}\"\n\t\t\t\t\tclass=\"mblColorBlue\"\n\t\t\t\t\tstyle=\"width:45px;float:right;\" \n\t\t\t\t\tonClick=\"window.AppData.objDet.date()\"\n\t\t\t\t\tdata-dojo-attach-point=\"okButton\"\t\t\t\t\n\t\t\t\t></div>\n\t\t\t\t<div data-dojo-type=\"dojox/mobile/ToolBarButton\"\n\t\t\t\t\tlabel=\"${nls.today}\"\n\t\t\t\t\tclass=\"mblColorBlue\"\n\t\t\t\t\tstyle=\"width:45px;float:right;\" \n\t\t\t\t\tonClick = \"window.AppData.details.datePicker.reset()\"\n\t\t\t\t\tdata-dojo-attach-point=\"resetDateButton\"\t\t\t\t\n\t\t\t\t></div> ${nls.pickDate}\n\t\t\t\t<div id=\"datepickernode\"></div>\n\t\t\t</h2>\t\t\t\n\t\t</div>\n\t</div>\n\t\n\t<div id=\"deleteOverlay\" data-dojo-type=\"dojox/mobile/SimpleDialog\" data-dojo-attach-point=\"deleteOverlay\">\n\t\t<h1 data-dojo-type=\"dojox/mobile/Heading\" data-dojo-props=\"\" style=\"margin-bottom: 8px;\">\n\t\t\t${nls.sure}\n\t\t</h1>\n\t\t<button data-dojo-type=\"money/TouchableButton\" label=\"${nls.yes}\" class=\"mblRedButton\" style=\"\" \n\t\t\tdata-dojo-attach-event=\"onClick: _deleteContact\"></button>\n\t\t<button data-dojo-type=\"money/TouchableButton\" label=\"${nls.no}\" class=\"mblBlueButton\" style=\"\"\n\t\t\tdata-dojo-attach-event=\"onClick: _hideDelete\"></button>\t\t\t\t\n\t</div>\n</div>\n"}});
define("money/views/details", [
	//dojo base
	"dojo/_base/array", 
	"dojo/_base/lang",
	"dojo/Deferred", "dojo/date/locale", "dojo/has", "dojo/when",
	"money/dialog",
 
	//dom manipulation
	"dojo/dom", "dojo/query", "dojo/on",  "dojo/dom-class", "dojo/dom-style", 
    
    //widgets
     "dijit/registry","dojox/mobile/SpinWheelDatePicker" , 'dojo/text!money/views/details.html'
    ],
    function(
		array, lang, Deferred, locale, has, when,Dialog,
		dom,query, on, domClass, domStyle,
		registry, SpinDatePicker){ 
    
    return window.AppData.objDet = {
		
		beforeActivate: function(){
			// in case we are still under saving previous
			// modifications, let's wait for the operation
			// to be completed and use the resulting
			// contact as input
			var self = this
			
			var callback = function(){
			
				window.AppData.numberPicker.mode = "t"
				var view = window.dFinance.children.dFinance_details;
				if(view.datePicker){
					view.datePicker.placeAt('datepickernode')
				}
			
				if(this.params.proceed2)
					this.saver(window.AppData.details)
				else if(this.params.proceed){
					if(window.AppData.details.transaction.type != "t")
						this.saver(window.AppData.details)
					else {
						var self = this;
						this.dlg.show(false, self.nls.newAccount1 + " \"" + self.accountTo.get('label') + "\" " +
							self.nls.newAccount2, self.nls.newAccountTitle, self.nls.process, function(){
							window.dFinance.transitionToView(self.domNode,{
								target: window.AppData.isInitiallySmall ? 'currencypicker' : "currencypicker",//'navigation+list', 
								transitionDir: 1,
								params : {backTo : 'details', proceed: true, currency: view.params.currency, transaction: window.AppData.details.params.id ? window.AppData.details.params.id : undefined}
							})
							//saver();
						})
					}
				}
				if(!this.params.doNotReload){
					this.transaction = null
					when(view._savePromise, function(contact){
						view._savePromise = null;
						view._beforeActivate();
					});
				
				
				}
			}
			setTimeout(function(){
				callback.call(self)
			},0)
        },
        _beforeActivate: function(){
            // get the id of the displayed contact from the params if
            // we don't have a contact or from the contact if we have
            // one
            
			var id = this.params.id, edit = true. self = this//this.params.edit;
 
			// are we in create mode
			var create = (typeof id === "undefined");
			// change widgets readonly value based on that
			query("input", this.domNode).forEach(function(node){
                registry.byNode(node).set("readOnly", !edit);
            });
            // in edit mode change the label and params of the
            // edit button
            this.editButton.set("label", this.nls.ok);
            // put a listener to save the form when we are editing if
            // there is not one already
            this._onHandler = this.editButton.on("click",
				lang.hitch(this, this._saveForm));
            
            
            // hide back button in edit mode
            if(edit){
                //domClass.add(this.backButton.domNode, "hidden");
                domClass.remove(this.formLayout.domNode,
                    "mblFormLayoutReadOnly");
            }
            
            // cancel button must be shown in edit mode only,
            // same for delete button if we are not creating a
            // new contact
            //this.cancelButton.domNode.style.display = edit?"":"none";
			this.deleteButton.domNode.style.display =
				(edit&&(typeof id !== "undefined"))?"":"none";
 
            // let's fill the form with the currently selected contact
            // if nothing selected skip that part
            var view = window.AppData.details;
            var promise = null;
            view.deleteButton.set('disabled',!!create)
			if(!create){
				id = id.toString();
				// get the transaction on the store
				promise = view.loadedStores.transactions.getItem(id);                
			}else{
				promise = view.transaction = view._createContact();
			}
			var store = view.loadedStores.transactions
			var defaultAccount = store.getAccounts()[0] ? store.getAccounts()[0].label : view.nls.defaultAccount
			var secondDefaultAccount = (store.getAccounts().length > 1) ? store.getAccounts()[1].label : view.nls.defaultAccount2
            
            when(promise, function(transaction){
                view.transaction = {
					date	: (transaction && transaction.date) ? transaction.date : new Date,
					amount	: (transaction && transaction.amount) ? transaction.amount : 0,
					tags	: (transaction && transaction.tags) ? transaction.tags : [],
					descr	: (transaction && transaction.descr) ? transaction.descr : "",
					type 	: (transaction && transaction.type) ? transaction.type : 'e',
					account : (transaction && transaction.account) ? transaction.account : defaultAccount
				}
				
				registry.byId('det-is-'+view.transaction.type).set('selected',true)
				if(view.transaction.type=="t"){
					view.transaction.accountTo = (transaction && transaction.accountTo) ? transaction.accountTo : secondDefaultAccount
					view.accountTo.set("label",
						(transaction && transaction.accountTo) ? store.getAccount(transaction.accountTo).label : secondDefaultAccount);
				
				}
				domStyle.set("accountTo-container", "display", (view.transaction.type == "t") ? "": "none")
            
				view.account.set("label",
					(transaction && transaction.account) ? store.getAccount(transaction.account).label : defaultAccount);
				
				var a = window.AppData.accountStore.query({'label': view.account.get('label')})
					view.currency.set('label',a[0] ? ( a[0].currency + '...') : (window.AppData.currency + '...'));
					view.transaction.currency = a[0]?a[0].currency:window.AppData.currency
				
				view.amount.set("label",
					getNumber(view.transaction.amount))
				
					
				view.date.set("label",
					getDateStringHr(view.transaction.date,locale))
				
				/* set value of datepicker */
				var val = getDateString(view.transaction.date,locale)
				
				//view.datePicker.reset()
				view.datePicker.set('value',val)
				/* end of datepicker */
				var tags = ""
				if(transaction && transaction.tags)
				for (var i in transaction.tags){
					if(tags != "") tags+=", "
					tags += store.getTag(transaction.tags[i]).label
				}
				view.tags.set("label", tags);
				view.descr.set("value",
					(transaction && transaction.descr) ? transaction.descr : "");
                    // hide empty fields when not in edit mode
				if(!edit){
					view._hideEmptyFields(view);
				}
			});
		},
		_saveForm: function(){
            var view = window.AppData.details, transaction;
            var id = view.params.id;
            var self = this;
            view._savePromise = new Deferred();
            view._savePromise.then(function(){
				window.dFinance.transitionToView(self.domNode,{
					target: window.AppData.isInitiallySmall ? 'list' : 'navigation+list', 
					transitionDir: -1,
					params: window.AppData.details.editButton.transitionOptions.params
				})
			})
            if(typeof id === "undefined"){
				transaction = view.transaction
            }
			// get the contact on the store
			var handler = function(transaction){
				self.saver = function(view){
					var transaction = view.transaction
					view._saveContact(transaction)
					when(view.loadedStores.transactions.putItem(transaction),
						function(savedContact){
							var def = savedContact.def
							var _handler = function(state){
								if(state == "e" && window.AppData.dialogWindow)
									window.AppData.dialogWindow.show( false,
										self.nls.saveErrorD,
										self.nls.saveErrorT,
										self.nls.close, function(){
											location.reload();
										}
									);
								else view._savePromise.resolve(savedContact.id)
							}
							if(def.then && lang.isFunction(def.then))
								def.then(_handler)
							else _handler()
						}
					);
				}
				if(!window.AppData.accountStore.query({'label':self.account.get('label')})[0]){
					self.dlg.show(false, self.nls.newAccount1 +" \"" + self.account.get('label') + "\" " +self.nls.newAccount2,
						self.nls.newAccountTitle, self.nls.process, function(){
						window.dFinance.transitionToView(self.domNode,{
							target: window.AppData.isInitiallySmall ? 'currencypicker' : "currencypicker",//'navigation+list', 
							transitionDir: 1,
							params : {backTo : 'details', transaction: window.AppData.details.params.id ? window.AppData.details.params.id : true}
						})
					})
				}else if(view.transaction.type=="t" && !window.AppData.accountStore.query({'label':self.accountTo.get('label')})[0]){
					self.dlg.show(false,
						self.nls.newAccount1 + " \"" + self.accountTo.get('label') + "\" " +
							self.nls.newAccount2, self.nls.newAccountTitle, self.nls.process, function(){
						window.dFinance.transitionToView(self.domNode,{
							target: window.AppData.isInitiallySmall ? 'currencypicker' : "currencypicker",//'navigation+list', 
							transitionDir: 1,
							params : {backTo : 'details', proceed: true, transaction: window.AppData.details.params.id ? window.AppData.details.params.id : undefined}
						})
					})
				}else{
					self.saver(window.AppData.details);
				}
			}
			
			if(id){
				var promise =
					view.loadedStores.transactions.getItem(id.toString());
				when(promise, handler)
			}else handler(transaction)
		},
        _createContact: function(){
            return {
                "tags"	: "",
                "amount": parseFloat('0').toFixed(2),
                "type"	: "e",
                "date"	: new Date,
                "descr" : ""
            };
            var view = window.AppData.details;
            view._saveContact(contact);
            when(view.loadedStores.transactions.add(contact),
                function(savedContact){
                    // some store do return a contact some other an ID
                    view._savePromise.resolve(savedContact.id);
                }
            );
        },
        _saveContact: function(transaction){
				var value, keys, self = this;
				/*
				 * 	Get description
				 */
				if(!transaction.id && self.params.id)
					transaction.id = self.params.id
				value = this.descr.get("value");
				if(typeof value !== "undefined"){
					transaction.descr = value
				}else transaction.descr = ""
				
				value = this.tags.get('label')
				if(typeof value !== "undefined"){
					this.transaction.tags = value
				}else this.transaction.tags = ""
				
				value = this.transaction.date
				window.AppData.details.editButton.transitionOptions.params.id = 
					isValidDate(value) ? getDateString(value, locale) : (value)
				/*
				 * 	Get transaction type ('e', 'i' or 't')
				 */
				transaction.type 	= this.transaction.type
				var store  			= this.loadedStores.transactions
				
				value = this.account.get('label')
				var id  = window.AppData.accountStore.query({'label':value})[0] ?
					window.AppData.accountStore.query({'label':value})[0].id : window.AppData.accountStore.put({
						'label': value, 
						currency: self.params.currency, 
						startAmount: 0, 
						et: new Date().getTime(),
						maincur: self.params.currency
					})
				window.AppData.details.transaction.account = id
				
				transaction.amount 	= fx(Number(this.transaction.amount))
										.from(transaction.currency)
										.to(window.AppData.accountStore.get(id).maincur)
				
				window.AppData.store._setAccounts(window.AppData.accountStore.query())
				
				transaction.account = this.transaction.account //|| (store.getAccounts()[0] ? store.getAccounts()[0].id : 'Cash')
				if(transaction.type == "t"){
					value = this.accountTo.get('label')
					
					var id  = window.AppData.accountStore.query({'label':value})[0] ?
					window.AppData.accountStore.query({'label':value})[0].id : window.AppData.accountStore.put({
						'label': value, 
						currency: self.params.currencyTo, 
						startAmount: 0, 
						et: new Date().getTime(),
						maincur: self.params.currencyTo
					})
					window.AppData.details.transaction.accountTo = id
					
					window.AppData.details.transaction.sumTo = 
						fx(Number(transaction.amount))
							.from(window.AppData.accountStore.get(window.AppData.details.transaction.account).maincur)
							.to(window.AppData.accountStore.get(id).maincur);
					window.AppData.store._setAccounts(window.AppData.accountStore.query())
				}
				transaction.date	= this.transaction.date
				transaction.tags 	= this.transaction.tags.split(',')
				for(var i in transaction.tags){
					transaction.tags[i] = String(transaction.tags[i]).fulltrim()
				}
				transaction.amountHome = 
					fx(Number(transaction.amount))
						.from(window.AppData.accountStore.get(window.AppData.details.transaction.account).maincur)
						.to(window.AppData.currency);
				
				return transaction
			
        },
        
        _hideEmptyFields: function(view){
            query(".readOnlyHidden",
                view.formLayout.domNode).forEach(function(node){
                domClass.remove(node, "readOnlyHidden");
            });
            query("input",
                view.formLayout.domNode).forEach(function(node){
                var val = registry.byNode(node).get("value");
                if(!val && node.parentNode.parentNode &&
                    node.id !== "firstname" &&
                    node.id !== "lastname"){
                        domClass.add(node.parentNode.parentNode,
                            "readOnlyHidden");
                }
            }); 
        },
        deleteContact: function(){
			var view = window.AppData.details;
			view.deleteOverlay.show();			
		},
        _deleteContact: function(){
			var view = window.AppData.details;
			when(view.loadedStores.transactions.removeItem(
				view.params.id.toString()), function(def){
					// we want to be back to list
					view.deleteOverlay.hide();
					setTimeout(function(){
						view.app.transitionToView(view.domNode, {target: "list" , transitionDir: -1});
					}, 500);
				});
        },
        _hideDelete: function(){
			var view = window.AppData.details;
			view.deleteOverlay.hide();
		},
        init: function(){
			//this.nls = nls;
			window.AppData.details = this
			if(!this._isInheritedFromBaseView)
				new window.AppData.BaseViewClass( this );
			
			
            if(has('isInitiallySmall')){
				this.isInitiallySmall = true
				this.constraint = "center"
				domClass.add	(this.domNode, "center");
				domClass.remove	(this.domNode, "left");
			}
			window.AppData.numberPicker._onDoneCallbackRegistry.push({
				scope 	: window.AppData.details,
				fn 		: window.AppData.details.getAmount,
				mode	: "t"
			})
			
			this.currency.onClick = function(){
				window.dFinance.transitionToView(window.AppData.details.domNode,{
					target: "currencypicker",//'navigation+list', 
					transitionDir: 1,
					params : {
						backTo : 'details', 
						'transaction' : window.AppData.details.params.id ? window.AppData.details.params.id : undefined,
						'setCurrency' : true
						}
				})
			}
			this.dlg = window.AppData.dialogWindow ? window.AppData.dialogWindow : (window.AppData.dialogWindow = new Dialog);
		},
		
		getAmount: function(amount){
			this.transaction.amount = parseFloat(amount)
			window.AppData.details.amount.set('label',getNumber(amount))
		},
		tagsShow: function(){
			registry.byId('newTags').set('value', window.AppData.details.tags.get('label'));
			//window.registry = registry
			var tags = window.AppData.details.transaction.tags
			var taglis = window.AppData.details.tagsPicker.getChildren()
			for (var i in taglis)
				taglis[i].set('checked',false)
			for (var i in tags)
				if(registry.byId(String(tags[i]))){
					registry.byId(String(tags[i])).set('checked',true)
				}
			var list = query("#tagsPicker .mblListItem")
			arrayUtil.forEach(list,function(li){
				if(!registry.byId(String(li.id))._onClickSetUp){
					registry.byId(String(li.id)).onClick = function(){
						//alert('handler')
						var val = registry.byId('newTags').get('value');
						var tag = window.AppData.tagsStore.get(this.id)
						var tagl = String(tag.label).toLowerCase(), tagn = String(tag.label)
						//alert('current: '+val+ 'tag: '+tagn)
						if(val.toLowerCase().indexOf(tagl) + 1){
							var end = String(val.substr(val.toLowerCase().indexOf(tagl)+tagl.length,val.length-1)).fulltrim()
							var beg = String(val.substr(0, val.toLowerCase().indexOf(tagl))).fulltrim()
							if(end.substr(0,1)==',') end = end.substr(1, end.length-1)
							else if(beg.substr(-1)==',') beg = beg.substr(0, beg.length-1)
							val =  beg + end;
						//	alert(beg + end)
						}else
							val += (val ? (', ' + tagn) : tagn)
						registry.byId('newTags').set('value', val);
					}
					registry.byId(String(li.id))._onClickSetUp = true
				}
			})
			window.AppData.details.tagsPickerOverlay.show('tags', ['below-centered','above-centered','after','before'])
		},
		tags: function(){
			var val = registry.byId('newTags').get('value');
			window.AppData.details.tags.set('label',val)
			if(typeof val == 'string'){
				val = val.split(',')
				for(var i in val){
					val[i] = String(val[i]).fulltrim()
				}
				window.AppData.details.transaction.tags = val
			}
			//registry.byId('newTags').set('value','');
			//registry.byId('transactionTagsOverlay').hide()			
		},
		date: function(){
			registry.byId('transactionDateOverlay').hide()
			var w = window.AppData.details.datePicker,
			val = w.slots[0].value+ "-" + w.slots[1].value + "-" + w.slots[2].value;
			window.AppData.details.transaction.date = locale.parse(val,{"selector":"date", "datePattern":"yyyy-MMM-dd"})
			window.AppData.details.date.set('label',getDateStringHr(window.AppData.details.transaction.date,locale))
		},
		acc: function(btn){
			var val = registry.byId('newAccount').get('value');
			btn.set('label',val)
		},
		setType : function(type){
			window.AppData.details.transaction.type = type
			window.AppData.details.changeType(type)
		},
		setTypeE: function(){
			window.AppData.objDet.setType('e')
			domStyle.set("accountTo-container", "display", "none")
		},
		setTypeI: function(){
			window.AppData.objDet.setType('i')
			domStyle.set("accountTo-container", "display", "none")
		},
		setTypeT: function(){
			window.AppData.objDet.setType('t')
			domStyle.set("accountTo-container", "display", "")            
		},
		changeType: function(type){
			if (type == "e")
				window.AppData.details.transaction.amount = - Math.abs(window.AppData.details.transaction.amount)
			else if(type == "i" || type == "t")
				window.AppData.details.transaction.amount = Math.abs(window.AppData.details.transaction.amount)
			window.AppData.details.amount.set('label',getNumber(window.AppData.details.transaction.amount))
			
			var store = this.loadedStores.transactions
			var defaultAccount = store.getAccounts()[0] ? store.getAccounts()[0].label : this.nls.defaultAccount
			var secondDefaultAccount = (store.getAccounts().length > 1) ? store.getAccounts()[1].label : this.nls.defaultAccount2
            
			
			var transaction = window.AppData.details.transaction
			if(this.transaction.type=="t"){
				this.transaction.accountTo = (transaction && transaction.accountTo) ? transaction.accountTo : secondDefaultAccount
				this.accountTo.set("label",
					(transaction && transaction.accountTo && store.getAccount(transaction.accountTo)) ? store.getAccount(transaction.accountTo).label : secondDefaultAccount);
				
			}
		}
    }
});
