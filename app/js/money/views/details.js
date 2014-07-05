define([
	//dojo base
	"dojo/_base/array", 
	"dojo/_base/lang",
	"dojo/Deferred", "dojo/date/locale", "dojo/has", "dojo/when",
	"money/dialog",
 
	//dom manipulation
	"dojo/dom", "dojo/query", "dojo/on",  "dojo/dom-class", "dojo/dom-style", 
    
    //widgets
     "dijit/registry","dojox/mobile/SpinWheelDatePicker"    
    ],
    function(
		array, lang, Deferred, locale, has, when,Dialog,
		dom,query, on, domClass, domStyle,
		registry, SpinDatePicker){ 
    
    return window.AppData.objDet = {
		afterActivate: function(){
			window.hideProgress()
		},
		beforeActivate: function(){
			//alert('called before activate')
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
					console.log(view.datePicker)
			
				if(this.params.proceed2)
					this.saver(window.AppData.details)
				else if(this.params.proceed){
					if(window.AppData.details.transaction.type != "t")
						this.saver(window.AppData.details)
					else {
						var self = this;
						this.dlg.show(false, "New accountTo will be created. Please, choose main currency for it","Creating account","Process", function(){
							window.dFinance.transitionToView(self.domNode,{
								target: window.AppData.isInitiallySmall ? 'currencypicker' : "currencypicker",//'navigation+list', 
								transitionDir: 1,
								params : {backTo : 'details', proceed: true, currency: view.params.currency, transaction: window.AppData.details.params.id ? window.AppData.details.params.id : true}
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
            //console.log(create, contact)
            view.deleteButton.set('disabled',!!create)
			if(!create){
				id = id.toString();
				// get the transaction on the store
				promise = view.loadedStores.transactions.getItem(id);                
			}else{
				promise = view.transaction = view._createContact();
			}
			var store = view.loadedStores.transactions
			var defaultAccount = store.getAccounts()[0] ? store.getAccounts()[0].label : 'Cash'
			var secondDefaultAccount = (store.getAccounts().length > 1) ? store.getAccounts()[1].label : 'Debit card'
            
            when(promise, function(transaction){
                console.log('transaction from store',transaction)
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
					view.currency.set('label',a[0]?a[0].currency:window.AppData.currency);
					view.transaction.currency = a[0]?a[0].currency:window.AppData.currency
				
				view.amount.set("label",
					getNumber(view.transaction.amount))
				
					
				view.date.set("label",
					getDateStringHr(view.transaction.date,locale))
				
				/* set value of datepicker */
				var val = getDateString(view.transaction.date,locale)
				//var valarray = val.split('-')
				console.log(view.datePicker)
				//view.datePicker.reset()
				view.datePicker.set('value',val)
				/* end of datepicker */
				console.log('here we are')
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
							var _handler = function(){
								view._savePromise.resolve(savedContact.id)
							}
							if(def.then && lang.isFunction(def.then))
								def.then(_handler)
							else _handler()
						}
					);
				}
				if(!window.AppData.accountStore.query({'label':self.account.get('label')})[0]){
					self.dlg.show(false, "New account will be created. Please, choose main currency for it","Creating new account","Process", function(){
						console.log(window.dFinance.transitionToView.toString())
						window.dFinance.transitionToView(self.domNode,{
							target: window.AppData.isInitiallySmall ? 'currencypicker' : "currencypicker",//'navigation+list', 
							transitionDir: 1,
							params : {backTo : 'details', transaction: window.AppData.details.params.id ? window.AppData.details.params.id : true}
						})
						//saver();
					})
				}else if(view.transaction.type=="t" && !window.AppData.accountStore.query({'label':self.accountTo.get('label')})[0]){
					self.dlg.show(false, "New accountTo will be created. Please, choose main currency for it","Creating new account","Process", function(){
						window.dFinance.transitionToView(self.domNode,{
							target: window.AppData.isInitiallySmall ? 'currencypicker' : "currencypicker",//'navigation+list', 
							transitionDir: 1,
							params : {backTo : 'details', proceed: true, transaction: window.AppData.details.params.id ? window.AppData.details.params.id : true}
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
            // set back the values on the contact object
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
				console.log(window.AppData.details.transaction.account,window.AppData.accountStore.get(window.AppData.details.transaction.account).maincur,window.AppData.accountStore.get(id).maincur,id)
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
            
            console.log(transaction)
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
			window.AppData.details = this
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
						'transaction' : window.AppData.details.params.id ? window.AppData.details.params.id : true,
						'setCurrency' : true
						}
				})
			}
			this.dlg = window.AppData.dialogWindow ? window.AppData.dialogWindow : (window.AppData.dialogWindow = new Dialog);
		},
		
		getAmount: function(amount){
			this.transaction.amount = parseFloat(amount)
			console.log("AMOUNT IS",this.transaction.amount)
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
					console.log(val[i])}
				window.AppData.details.transaction.tags = val
				console.log(window.AppData.details.transaction.tags)
			}
			//registry.byId('newTags').set('value','');
			//registry.byId('transactionTagsOverlay').hide()			
		},
		date: function(){
			registry.byId('transactionDateOverlay').hide()
			var w = window.AppData.details.datePicker,
			val = w.slots[0].value+ "-" + w.slots[1].value + "-" + w.slots[2].value;
			console.log(val)
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
		}
    }
});
