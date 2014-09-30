require({cache:{
'money/BaseView':function(){
define([
	"dojo/_base/declare", 'dojo/date/locale'	
], function(declare, locale){
	return declare(null, {

			hideProgress : function(){
				console.log('hide progress')
				require(["dojo/dom-style","dojo/_base/fx"], function(domStyle, fx){
					fx.fadeOut({
						node: 'main-progress-bar',
						duration: 500
					}).play();
					setTimeout(function(){
						domStyle.set('main-progress-bar','display','none')
					}, 500)
				})
			},

			showProgress : function(){
				console.log('show progress')
				require(["dojo/dom-style","dojo/_base/fx"], function(domStyle, fx){
					domStyle.set('main-progress-bar','display','block')
					fx.fadeIn({
						node: 'main-progress-bar',
						duration: 200
					}).play()
				})
			},
			
			//if this view is loaded when application starts
			afterActivate: function(){
				this.hideProgress ? this.hideProgress() : this._baseView.hideProgress();
			},

			/*
			 * Template for right text of list item
			 */ 
			_accountTemplate:
				'<div>'+
					'<span class="transaction-amount">${amount}</span>'+
					'<span class="transaction-account">${account}</span>'+
				'</div>',

			_getDate : function(date, to, pattern){
				var to = to || "EEE dd MMM yyyy"
				var pattern = pattern || window.AppData.widgetDateFormat
				var date2 = isValidDate(date) ? date : locale.parse(date, {selector:"date", datePattern:pattern})
				return this.capitalize(locale.format(date2, {selector:"date", datePattern:to}))
			},
			
			/*
			 *  Substitute ${var} in template with data[var]
			 * 	Substitute ${!var} with capitalized version of data[var]
			 */
			substitute: function(template, data) {
				var self = this
				return template.replace(/\$\{([^\s\:\}]+)(?:\:([^\s\:\}]+))?\}/g, function(match, key){
					if(data[key]!=undefined || (key.substr(0,1) == "!" && data[key.substr(1)]))
						return (key.substr(0,1)=="!" ? self.capitalize(data[key.substr(1)]):data[key])
					return "";	
				});
			},
			
			/*
			 * make str[0] bigger :-)
			 */ 
			capitalize: function(str){
				return str.substr(0,1).toUpperCase() + str.substr(1,str.length-1)//.toLowerCase()
			},

			constructor: function( parent , overwriteMode /* undefined || 0 - overwrite, 1 - do not overwrite */){
				var predefined = ['capitalize','substitute','_getDate','_accountTemplate','afterActivate']
				parent._isInheritedFromBaseView = true;
				parent._baseView = this;
				for(var i = 0; i < predefined.length; i ++) {
					if(!parent[ predefined[i] ] || !overwriteMode || overwriteMode == 0) {
						parent[ predefined[i] ] = this [ predefined[i] ]
					}
				}				
			}
		});
});

},
'money/nls/tagspicker':function(){
define({
	root: {
		title	: "Select tags",
	    done	: 'DONE',
	    viewHelp: 'Select one or more tags for your transaction from a list, or enter new tags comma separated',
	    inputHelp: 'Tags, comma separated'

	},
	'ru-ru': true
});

},
'money/nls/ru-ru/tagspicker':function(){
define({
		title	: "Выберите метки (категории)",
	    done	: 'Готово',
	    viewHelp: 'Выберите одну или несколько меток для транзакции из списка или введите названия меток через запятую',
	    inputHelp: 'Метки, через запятую'

});

},
'money/views/language':function(){
define([
	'dojo/dom-construct',
	'dojo/dom-class',
	'dojo/sniff',
	'dijit/registry',
	'dojo/topic',
	'dojo/dom-attr',"dojo/on","dojo/dom-style","dojo/query","dojo/_base/array","dojox/mobile/Pane",'dojo/text!money/views/language.html'], 
	function(domConstruct, domClass, has, registry, topic, domAttr, on, domStyle,query, arrayUtil){
  	return {
		_hasMenu : false,
		_hasBack : 'settings',
		_setupDisplayMode: function(){
		},
		
		langs: ['en-us','ru-ru'],
		//init is triggered when view is created
		init : function(){
			//
			this._setupDisplayMode()
			var self = this
			for(var i =0; i< this.langs.length ; i++){
			    (function(i){
			        self[self.langs[i]].onClick = function(){
			            localStorage.setItem('app_locale', self.langs[i])
			            location.reload();
			           //location.assign('/app');
			        }
			    })(i)
			}
			
			this.systemDefault.onClick = function(){
			    localStorage.removeItem('app_locale')
			    location.reload();
			    //location.assign('/app');
			}
			
		},
		
		//triggered before showing view
		beforeActivate: function(){
			//this.legendButton.set('selected',true)
			
			for(var i =0; i< this.langs.length ; i++){
			    console.log(localStorage.getItem('app_locale'), this.langs[i], localStorage.getItem('app_locale') == this.langs[i])
			    if(localStorage.getItem('app_locale') && localStorage.getItem('app_locale') == this.langs[i])
			        this[this.langs[i]].set('checked', true)
			}
		},
		afterActivate: function(){
			//
		}			
	}
})

},
'money/dialog':function(){
define([
	"dojo/_base/declare",
	"dojo/_base/window", "dojox/mobile/Heading",
	"dojo/on",
	"dojo/dom-construct",
	"dojo/dom-style",
	"dojox/mobile/SimpleDialog",
	"dojox/mobile/ProgressIndicator",
	"money/TouchableButton", "dojo/dom-attr","dojox/mobile/Heading"
], function(declare, win, Heading, on, domConstruct, domStyle, SimpleDialog, ProgressIndicator, Button, domAttr, Heading){
	return declare(null, {
		constructor: function(){
			var self = this
			this.dlg = new SimpleDialog();
			win.body().appendChild(this.dlg.domNode);
			
			var handler = on ( window, 'resize', function() {
				if(self.dlg)
					self.dlg.refresh();
				else handler.remove();
			})
			//create message box
			this.titleBox = new Heading({
				//id: 'dialogHeading'
			}, domConstruct.create('div',{}, this.dlg.domNode) );
			
			//create message box
			this.msgBox = domConstruct.create("div", {
				'class': "mblSimpleDialogText",
				innerHTML: ""
			}, this.dlg.domNode);
			
			//create progress indicator box
			this.piBox = domConstruct.create("div", {
				'class': "mblSimpleDialogText"
			},	this.dlg.domNode);
			
			//create ok/close button
			this.cancelBtn = new Button({
				'class' : "mblSimpleDialogButton mblRedButton",
				innerHTML : ""
			});
			
			this.closeBtn = new Button({
				'class' : "mblSimpleDialogButton mblBlueButton",
				innerHTML : ""
			});
			
			this.handler = on ( this.cancelBtn, 'click',
				function(e){ self.hide() }
			);
			
			on (this.closeBtn, 'click',
				function(e){ self.hide() }
			);
			
			this.cancelBtn.placeAt(this.dlg.domNode);
			this.closeBtn.placeAt(this.dlg.domNode);
			
		},
		show : function(isPi, msgText, titleText, closeText, onOk, undoText){
			
			var self = this
			
			if(isPi){
				this.piIns = ProgressIndicator.getInstance();
				this.piBox.appendChild(this.piIns.domNode);
			}
			
			console.log(this, closeText)
			this.dlg.hide();
			this.dlg.show();
			
			this.titleBox.set('label',titleText ? titleText : "R5M Finance")
			domAttr.set(this.msgBox,'innerHTML',msgText ? msgText : "")
			domAttr.set(this.cancelBtn.domNode,'innerHTML',closeText ? closeText : "")
			domAttr.set(this.closeBtn.domNode,'innerHTML',undoText ? undoText : "")
			domStyle.set(this.closeBtn.domNode,'display',undoText ? "" : "none")
			
			//if(onOk) {
				if(this.handler) 
					this.handler.remove();
				this.handler = on ( this.cancelBtn, 'click', function(){
					self.hide();
					if(onOk) onOk();
				});
			//}
			if(isPi)
				this.piIns.start();
			else if( this.piIns ){
				this.piIns.stop();
			}
			this.isPi = isPi
			
			this.dlg.refresh();			
		},
		hide : function(){
			if(this.isPi)
				this.piIns.stop();
			this.dlg.hide();
		}
	})
});

},
'dojo/currency':function(){
define([
	"./_base/array",
	"./_base/lang",
	/*===== "./_base/declare", =====*/
	"./number",
	"./i18n", "./i18n!./cldr/nls/currency",
	"./cldr/monetary"
], function(darray, lang, /*===== declare, =====*/ dnumber, i18n, nlsCurrency, cldrMonetary){

// module:
//		dojo/currency

var currency = {
	// summary:
	//		localized formatting and parsing routines for currencies
	// description:
	//		extends dojo.number to provide culturally-appropriate formatting of values
	//		in various world currencies, including use of a currency symbol.  The currencies are specified
	//		by a three-letter international symbol in all uppercase, and support for the currencies is
	//		provided by the data in `dojo.cldr`.  The scripts generating dojo.cldr specify which
	//		currency support is included.  A fixed number of decimal places is determined based
	//		on the currency type and is not determined by the 'pattern' argument.  The fractional
	//		portion is optional, by default, and variable length decimals are not supported.
};
lang.setObject("dojo.currency", currency);

currency._mixInDefaults = function(options){
	options = options || {};
	options.type = "currency";

	// Get locale-dependent currency data, like the symbol
	var bundle = i18n.getLocalization("dojo.cldr", "currency", options.locale) || {};

	// Mixin locale-independent currency data, like # of places
	var iso = options.currency;
	var data = cldrMonetary.getData(iso);

	darray.forEach(["displayName","symbol","group","decimal"], function(prop){
		data[prop] = bundle[iso+"_"+prop];
	});

	data.fractional = [true, false];

	// Mixin with provided options
	return lang.mixin(data, options);
};

/*=====
currency.__FormatOptions = declare([dnumber.__FormatOptions], {
	// type: String?
	//		Should not be set.  Value is assumed to be "currency".
	// symbol: String?
	//		localized currency symbol. The default will be looked up in table of supported currencies in `dojo.cldr`
	//		A [ISO4217](http://en.wikipedia.org/wiki/ISO_4217) currency code will be used if not found.
	// currency: String?
	//		an [ISO4217](http://en.wikipedia.org/wiki/ISO_4217) currency code, a three letter sequence like "USD".
	//		For use with dojo.currency only.
	// places: Number?
	//		number of decimal places to show.  Default is defined based on which currency is used.
	type: "",
	symbol: "",
	currency: "",
	places: ""
});
=====*/

currency.format = function(/*Number*/ value, /*__FormatOptions?*/ options){
	// summary:
	//		Format a Number as a currency, using locale-specific settings
	//
	// description:
	//		Create a string from a Number using a known, localized pattern.
	//		[Formatting patterns](http://www.unicode.org/reports/tr35/#Number_Elements)
	//		appropriate to the locale are chosen from the [CLDR](http://unicode.org/cldr)
	//		as well as the appropriate symbols and delimiters and number of decimal places.
	//
	// value:
	//		the number to be formatted.

	return dnumber.format(value, currency._mixInDefaults(options));
};

currency.regexp = function(/*dnumber.__RegexpOptions?*/ options){
	//
	// summary:
	//		Builds the regular needed to parse a currency value
	//
	// description:
	//		Returns regular expression with positive and negative match, group and decimal separators
	//		Note: the options.places default, the number of decimal places to accept, is defined by the currency type.
	return dnumber.regexp(currency._mixInDefaults(options)); // String
};

/*=====
var __ParseOptions = currency.__ParseOptions = declare(dnumber.__ParseOptions, {
	// type: String?
	//		Should not be set.  Value is assumed to be currency.
	// currency: String?
	//		an [ISO4217](http://en.wikipedia.org/wiki/ISO_4217) currency code, a three letter sequence like "USD".
	//		For use with dojo.currency only.
	// symbol: String?
	//		localized currency symbol. The default will be looked up in table of supported currencies in `dojo.cldr`
	//		A [ISO4217](http://en.wikipedia.org/wiki/ISO_4217) currency code will be used if not found.
	// places: Number?
	//		fixed number of decimal places to accept.  The default is determined based on which currency is used.
	// fractional: Boolean|Array?
	//		Whether to include the fractional portion, where the number of decimal places are implied by the currency
	//		or explicit 'places' parameter.  The value [true,false] makes the fractional portion optional.
	//		By default for currencies, it the fractional portion is optional.
});
=====*/

currency.parse = function(/*String*/ expression, /*__ParseOptions?*/ options){
	//
	// summary:
	//		Convert a properly formatted currency string to a primitive Number,
	//		using locale-specific settings.
	// description:
	//		Create a Number from a string using a known, localized pattern.
	//		[Formatting patterns](http://www.unicode.org/reports/tr35/#Number_Format_Patterns)
	//		are chosen appropriate to the locale, as well as the appropriate symbols and delimiters
	//		and number of decimal places.
	// expression:
	//		A string representation of a currency value

	return dnumber.parse(expression, currency._mixInDefaults(options));
};

return currency;
});

},
'money/views/details':function(){
define([
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
		zeroCounts: window.AppData.zeroCounts,
			
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
            var id = this.params.id, 
				edit = true,//this.params.edit; 
				self = this 
 
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
            if(this._onHandler)
				this._onHandler.remove();
            this._onHandler = this.editButton.on("click",
				lang.hitch(this, this._saveForm) 
			);            
            
            /* hide back button in edit mode
            if(edit){
                //domClass.add(this.backButton.domNode, "hidden");
                domClass.remove(this.formLayout.domNode,
                    "mblFormLayoutReadOnly");
            }*/
            
            // cancel button must be shown in edit mode only,
            // same for delete button if we are not creating a
            // new contact
            //this.cancelButton.domNode.style.display = edit?"":"none";
			this.deleteButton.domNode.style.display =
				(edit && (typeof id !== "undefined") )? "" : "none";
 
            // let's fill the form with the currently selected contact
            // if nothing selected skip that part
            var view = window.AppData.details;
            var promise = null;
            view.deleteButton.set('disabled', !!create)
			if( !create ) {
				//id = id.toString();
				// get the transaction on the store
				promise = view.loadedStores.transactions.get(id);                
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
				
				view.backButton.transitionOptions.params.id = 
					isValidDate(view.transaction.date) ? getDateString(view.transaction.date, locale) : (view.transaction.date)
				//alert(view.editButton.transitionOptions.params.id)
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
					view.transaction.currency = a[0] ? a[0].currency:window.AppData.currency
				
				var cur = view.transaction.currency.toLowerCase()
				if(cur && view.zeroCounts[cur] != undefined )
					view.zeros = view.zeroCounts[cur];
				else view.zeros = 2;				
				console.log('ZEROS in details', view.zeros)
				view.amount.set("label",
					getNumber(view.transaction.amount, view.zeros))
				
					
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
				view.saver = function(view){
					var transaction = view.transaction
					view._saveContact(transaction)
					when(view.loadedStores.transactions.put(transaction),
						function(savedContact){
							var def = savedContact.def
							var _handler = function(state){
								if(state == "e" && window.AppData.dialogWindow)
									window.AppData.dialogWindow.show( false,
										view.nls.saveErrorD,
										view.nls.saveErrorT,
										view.nls.close, function(){
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
				console.log( view )
				if(!window.AppData.accountStore.query({'label':view.account.get('label')})[0]){
					view.dlg.show(false, view.nls.newAccount1 +" \"" + view.account.get('label') + "\" " +view.nls.newAccount2,
						view.nls.newAccountTitle, view.nls.process, function(){
						window.dFinance.transitionToView(view.domNode,{
							target: window.AppData.isInitiallySmall ? 'currencypicker' : "currencypicker",//'navigation+list', 
							transitionDir: 1,
							params : {backTo : 'details', transaction: window.AppData.details.params.id ? window.AppData.details.params.id : true}
						})
					})
				}else if(view.transaction.type=="t" && !window.AppData.accountStore.query({'label':view.accountTo.get('label')})[0]){
					view.dlg.show(false,
						view.nls.newAccount1 + " \"" + view.accountTo.get('label') + "\" " +
							view.nls.newAccount2, view.nls.newAccountTitle, view.nls.process, function(){
						window.dFinance.transitionToView(view.domNode,{
							target: window.AppData.isInitiallySmall ? 'currencypicker' : "currencypicker",//'navigation+list', 
							transitionDir: 1,
							params : {backTo : 'details', proceed: true, transaction: window.AppData.details.params.id ? window.AppData.details.params.id : undefined}
						})
					})
				}else{
					view.saver(window.AppData.details);
				}
			}
			
			if(id){
				var promise =
					view.loadedStores.transactions.get(id.toString());
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
				this.editButton.transitionOptions.params.id = 
					isValidDate(value) ? getDateString(value, locale) : (value)
				this.editButton.transitionOptions.params.type = 
					transaction.type
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
				console.log(this.transaction.amount, 'ACCOUNT ID', id ,window.AppData.accountStore.get(id).maincur, transaction.currency)
				
				transaction.amount 	= fx( Number(this.transaction.amount) )
										.from(transaction.currency.toUpperCase())
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
				
				console.log('!!!!!!')
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
			var date = view.transaction.date
			var item = lang.clone ( view.transaction )
			when(view.loadedStores.transactions.remove(
				view.params.id.toString()), function(def){
					// we want to be back to list
					view.deleteOverlay.hide();
					setTimeout(function(){
						view.app.transitionToView(view.domNode, {target: "list" , transitionDir: -1});
						require(['dijit/registry'], function(registry){
							if( registry.byId('summary-list') )
								registry.byId('summary-list').onUpdate(
									item, null
								)
						})
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
			window.AppData.details.amount.set('label',getNumber(amount, this.zeros))
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
		acc: function( btn ){
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

},
'dojox/css3/transit':function(){
define(["dojo/_base/array", "dojo/dom-style", "dojo/promise/all", "dojo/sniff", "./transition"],
	function(darray, domStyle, all, has, transition){
	// module: 
	//		dojox/css3/transit
	
	var transit = function(/*DomNode*/from, /*DomNode*/to, /*Object?*/options){
		// summary:
		//		Performs a transition to hide a node and show another node.
		// description:
		//		This module defines the transit method which is used
		//		to transit the specific region of an application from 
		//		one view/page to another view/page. This module relies 
		//		on utilities provided by dojox/css3/transition for the 
		//		transition effects.
		// options:
		//		The argument to specify the transit effect and direction.
		//		The effect can be specified in options.transition. The
		//		valid values are 'slide', 'flip', 'fade', 'none'.
		//		The direction can be specified in options.reverse. If it
		//		is true, the transit effects will be conducted in the
		//		reverse direction to the default direction. Finally the duration
		//		of the transition can be overridden by setting the duration property.
		var rev = (options && options.reverse) ? -1 : 1;
		if(!options || !options.transition || !transition[options.transition] || (has("ie") && has("ie") < 10)){
			if(from){
				domStyle.set(from,"display","none");
			}
			if(to){
				domStyle.set(to, "display", "");
			}
			if(options.transitionDefs){
				if(options.transitionDefs[from.id]){
					options.transitionDefs[from.id].resolve(from);
				}
				if(options.transitionDefs[to.id]){
					options.transitionDefs[to.id].resolve(to);
				}
			}
			// return any empty promise/all if the options.transition="none"
			return new all([]);
		}else{
			var defs = [];
			var transit = [];
			var duration = 2000;
			if(!options.duration){
				duration = 250;
				if(options.transition === "fade"){
					duration = 600;
				}else if (options.transition === "flip"){
					duration = 200;
				}
			}else{
				duration = options.duration;
			}
			if(from){
				domStyle.set(from, "display", "");
				//create transition to transit "from" out
				var fromTransit = transition[options.transition](from, {
					"in": false,
					direction: rev,
					duration: duration,
					deferred: (options.transitionDefs && options.transitionDefs[from.id]) ? options.transitionDefs[from.id] : null
				});
				defs.push(fromTransit.deferred);//every transition object should have a deferred.
				transit.push(fromTransit);
			}
			if(to){
				domStyle.set(to, "display", "");
				//create transition to transit "to" in
				var toTransit = transition[options.transition](to, {
								direction: rev,
								duration: duration,
								deferred: (options.transitionDefs && options.transitionDefs[to.id]) ? options.transitionDefs[to.id] : null
							});
				defs.push(toTransit.deferred);//every transition object should have a deferred.
				transit.push(toTransit);
			}
			//If it is flip use the chainedPlay, otherwise
			//play fromTransit and toTransit together
			if(options.transition === "flip"){
				transition.chainedPlay(transit);
			}else{
				transition.groupedPlay(transit);
			}

			return all(defs);
		}
	};
	
	return transit;
});

},
'dojox/lang/functional/array':function(){
define(["dojo/_base/kernel", "dojo/_base/lang", "dojo/_base/array", "./lambda"],
	function(kernel, lang, arr, df){

// This module adds high-level functions and related constructs:
//	- array-processing functions similar to standard JS functions

// Notes:
//	- this module provides JS standard methods similar to high-level functions in dojo/_base/array.js:
//		forEach, map, filter, every, some

// Defined methods:
//	- take any valid lambda argument as the functional argument
//	- operate on dense arrays
//	- take a string as the array argument
//	- take an iterator objects as the array argument

	var empty = {};

	lang.mixin(df, {
		// JS 1.6 standard array functions, which can take a lambda as a parameter.
		// Consider using dojo._base.array functions, if you don't need the lambda support.
		filter: function(/*Array|String|Object*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary:
			//		creates a new array with all elements that pass the test
			//		implemented by the provided function.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || kernel.global; f = df.lambda(f);
			var t = [], v, i, n;
			if(lang.isArray(a)){
				// array
				for(i = 0, n = a.length; i < n; ++i){
					v = a[i];
					if(f.call(o, v, i, a)){ t.push(v); }
				}
			}else if(typeof a.hasNext == "function" && typeof a.next == "function"){
				// iterator
				for(i = 0; a.hasNext();){
					v = a.next();
					if(f.call(o, v, i++, a)){ t.push(v); }
				}
			}else{
				// object/dictionary
				for(i in a){
					if(!(i in empty)){
						v = a[i];
						if(f.call(o, v, i, a)){ t.push(v); }
					}
				}
			}
			return t;	// Array
		},
		forEach: function(/*Array|String|Object*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary:
			//		executes a provided function once per array element.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || kernel.global; f = df.lambda(f);
			var i, n;
			if(lang.isArray(a)){
				// array
				for(i = 0, n = a.length; i < n; f.call(o, a[i], i, a), ++i);
			}else if(typeof a.hasNext == "function" && typeof a.next == "function"){
				// iterator
				for(i = 0; a.hasNext(); f.call(o, a.next(), i++, a));
			}else{
				// object/dictionary
				for(i in a){
					if(!(i in empty)){
						f.call(o, a[i], i, a);
					}
				}
			}
			return o;	// Object
		},
		map: function(/*Array|String|Object*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary:
			//		creates a new array with the results of calling
			//		a provided function on every element in this array.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || kernel.global; f = df.lambda(f);
			var t, n, i;
			if(lang.isArray(a)){
				// array
				t = new Array(n = a.length);
				for(i = 0; i < n; t[i] = f.call(o, a[i], i, a), ++i);
			}else if(typeof a.hasNext == "function" && typeof a.next == "function"){
				// iterator
				t = [];
				for(i = 0; a.hasNext(); t.push(f.call(o, a.next(), i++, a)));
			}else{
				// object/dictionary
				t = [];
				for(i in a){
					if(!(i in empty)){
						t.push(f.call(o, a[i], i, a));
					}
				}
			}
			return t;	// Array
		},
		every: function(/*Array|String|Object*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary:
			//		tests whether all elements in the array pass the test
			//		implemented by the provided function.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || kernel.global; f = df.lambda(f);
			var i, n;
			if(lang.isArray(a)){
				// array
				for(i = 0, n = a.length; i < n; ++i){
					if(!f.call(o, a[i], i, a)){
						return false;	// Boolean
					}
				}
			}else if(typeof a.hasNext == "function" && typeof a.next == "function"){
				// iterator
				for(i = 0; a.hasNext();){
					if(!f.call(o, a.next(), i++, a)){
						return false;	// Boolean
					}
				}
			}else{
				// object/dictionary
				for(i in a){
					if(!(i in empty)){
						if(!f.call(o, a[i], i, a)){
							return false;	// Boolean
						}
					}
				}
			}
			return true;	// Boolean
		},
		some: function(/*Array|String|Object*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary:
			//		tests whether some element in the array passes the test
			//		implemented by the provided function.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || kernel.global; f = df.lambda(f);
			var i, n;
			if(lang.isArray(a)){
				// array
				for(i = 0, n = a.length; i < n; ++i){
					if(f.call(o, a[i], i, a)){
						return true;	// Boolean
					}
				}
			}else if(typeof a.hasNext == "function" && typeof a.next == "function"){
				// iterator
				for(i = 0; a.hasNext();){
					if(f.call(o, a.next(), i++, a)){
						return true;	// Boolean
					}
				}
			}else{
				// object/dictionary
				for(i in a){
					if(!(i in empty)){
						if(f.call(o, a[i], i, a)){
							return true;	// Boolean
						}
					}
				}
			}
			return false;	// Boolean
		}
	});
	
	return df;
});

},
'money/nls/navigation':function(){
define({
	root: {
		title			: "R5M Finance",
		transactions 	: "Transactions",
		stats 			: "Statistics & reports",
		settings 		: "Settings",
		timespan 		: "Timespan",
		backup 			: "Backup & Restore",
		about 			: "About R5M Finance"
	},
	'ru-ru': true
});

},
'money/nls/ru-ru/navigation':function(){
define({
	title			: "R5M Finance",
	transactions 	: "Транзакции",
	stats 			: "Статистика и отчеты",
	settings 		: "Настройки",
	timespan 		: "Отрезок времени",
	backup 			: "Синхронизация",
	about 			: "О R5M Finance"
	
});

},
'dojox/charting/Series':function(){
define(["dojo/_base/lang", "dojo/_base/declare", "./Element"], 
	function(lang, declare, Element){ 
	/*=====
	var __SeriesCtorArgs = {
		// summary:
		//		An optional arguments object that can be used in the Series constructor.
		// plot: String?
		//		The plot (by name) that this series belongs to.
	};
	=====*/
	return declare("dojox.charting.Series", Element, {
		// summary:
		//		An object representing a series of data for plotting on a chart.
		constructor: function(chart, data, kwArgs){
			// summary:
			//		Create a new data series object for use within charting.
			// chart: dojox/charting/Chart
			//		The chart that this series belongs to.
			// data: Array|Object
			//		The array of data points (either numbers or objects) that
			//		represents the data to be drawn. Or it can be an object. In
			//		the latter case, it should have a property "data" (an array),
			//		destroy(), and setSeriesObject().
			// kwArgs: __SeriesCtorArgs?
			//		An optional keyword arguments object to set details for this series.
			lang.mixin(this, kwArgs);
			if(typeof this.plot != "string"){ this.plot = "default"; }
			this.update(data);
		},
	
		clear: function(){
			// summary:
			//		Clear the calculated additional parameters set on this series.
			this.dyn = {};
		},
		
		update: function(data){
			// summary:
			//		Set data and make this object dirty, so it can be redrawn.
			// data: Array|Object
			//		The array of data points (either numbers or objects) that
			//		represents the data to be drawn. Or it can be an object. In
			//		the latter case, it should have a property "data" (an array),
			//		destroy(), and setSeriesObject().
			if(lang.isArray(data)){
				this.data = data;
			}else{
				this.source = data;
				this.data = this.source.data;
				if(this.source.setSeriesObject){
					this.source.setSeriesObject(this);
				}
			}
			this.dirty = true;
			this.clear();
		}
	});
});

},
'money/views/timespan':function(){
define([
	"dojo/json","dijit/registry","dojo/on","dojo/dom-style","dojo/dom-class",'dojo/date',
	"dojo/sniff","dojox/mobile/ProgressIndicator","dojo/_base/array",
	"dojox/mobile/Button", "dojo/date/locale","money/dialog","dojox/mobile/SimpleDialog", "dojox/mobile/SpinWheelDatePicker",'dojox/mobile/ToolBarButton','dojo/text!money/views/timespan.html'
 ],
    function(json, registry, on, domStyle, domClass, dojodate, has, ProgressIndicator, arrayUtil,Button, locale, Dialog, SD, SpinWheelDatePicker){
    
	return window.AppData.objBackup = {
		beforeActivate: function(){			
			
        },
        afterActivate: function(){
 			
 		},
        init: function(){
			window.AppData.timespanObj = this
			if(!has('isInitiallySmall'))
				domClass.add(this.backButton.domNode,'hideOnMedium hideOnLarge')
			var self = this
			window.AppData.timespan = localStorage.getItem('timespan') ? localStorage.getItem('timespan') : 'last31';
			
			this.last31.set('checked', false)
			this.lastMonth.set('checked', false)
			this.customTimespan.set('checked', false)
			this[window.AppData.timespan].set('checked', true)
			
			this.timespanPicker = new SpinWheelDatePicker( {id:"timespanPicker"}, "timespanPicker");
			
			
			var initialDate = window.AppData.dateFrom ? window.AppData.dateFrom : new Date
			var initialDateString = window.AppData.timespanMonth ? window.AppData.timespanMonth : getDateString(window.AppData.dateFrom ? window.AppData.dateFrom : new Date, locale).substr(0,7) + '-01'
				
			var setMonthTimespan = function(doNotSave) {
				var initialDateString = 
					window.AppData.timespanMonth ? 
						window.AppData.timespanMonth : 
							getDateString(new Date, locale).substr(0,7) + '-01'
				var from = new Date( 
					Number( initialDateString.substr(0,4) ), 
					Number (initialDateString.substr(5,2) ) - 1, 
					Number( initialDateString.substr(8,2) )
				);
				var daysInMonth = dojodate.getDaysInMonth(from) 
				//window.AppData.dateFrom		 = dojodate.add( from, "day", -1);
				window.AppData.dateTo 		 = dojodate.add( from, "day", daysInMonth -1 );
				self[!doNotSave ? 'lastMonth' : 'customTimespan'].set( 'rightText', 
					getDateStringHrWithoutYear( from, locale ) + ' - ' + 
					getDateStringHrWithoutYear( dojodate.add( from, "day", daysInMonth -1), locale ) + '&nbsp;&nbsp;' )
				self[!doNotSave ? 'customTimespan' : 'lastMonth'].set( 'rightText', '' );
				
				if(!doNotSave)
					localStorage.setItem('dateFrom', getDateString(window.AppData.dateFrom, locale) )
				else
					localStorage.removeItem('dateFrom')
			}
			
			if(window.AppData.timespan == 'lastMonth' || window.AppData.timespan == 'customTimespan')
				setMonthTimespan(window.AppData.timespan == 'customTimespan')
						
			var _applyTimespanToSummaryPage = function() {
				window.dFinance.children.dFinance_summary.summary = []
				registry.byId('summary-list').refresh();
			}
			on(this.okButton,'click',function(){
				window.AppData.timespanMonth = self.timespanPicker.get('value')
				localStorage.setItem('timespanMonth', window.AppData.timespanMonth)
				setMonthTimespan();
				self.timespanOverlay.hide()
				_applyTimespanToSummaryPage();
			})
			
			on(this.last31,'click',function(){
				self.applyTs31()
				localStorage.removeItem('dateFrom')
				_applyTimespanToSummaryPage();
			})
			on(this.lastMonth,'click',function(){
				self.applyTsMonth()				
				self.timespanOverlay.show();
				self.timespanPicker.startup();
				self.timespanPicker.set('value',window.AppData.timespanMonth ? window.AppData.timespanMonth : initialDateString )
			})
			on(this.customTimespan,'click',function(){
				self.applyTsCustom();
				window.AppData.timespanMonth = getDateString(new Date, locale).substr(0,7) + '-01'
				setMonthTimespan(true);
				_applyTimespanToSummaryPage();
			})
			on(this.noneTimespan,'click',function(){
				self.applyTsNone()
				_applyTimespanToSummaryPage();
			})
        },
		applyTs31:function(){
			console.log('31')
			this['lastMonth'].set( 'rightText', '' );	
			this['customTimespan'].set( 'rightText', '' );	
			
			window.AppData.timespan = 'last31'
			var daysInMonth = dojodate.getDaysInMonth(new Date);
			window.AppData.dateFrom		 = undefined;
			window.AppData.dateTo		 = undefined;
			localStorage.setItem( 'timespan', 'last31' )			
			
		},
		applyTsMonth:function(){
			console.log('Month')
			this['lastMonth'].set( 'rightText', '' );	
			this['customTimespan'].set( 'rightText', '' );	
			
			window.AppData.timespan = 'lastMonth'
			localStorage.setItem('timespan','lastMonth')
		},
		applyTsCustom:function(){
			this['lastMonth'].set( 'rightText', '' );	
			this['customTimespan'].set( 'rightText', '' );	
			
			window.AppData.timespan = 'customTimespan'
			
			localStorage.setItem('timespan','customTimespan')
			console.log('custom')
		},
		applyTsNone:function(){
			
			this['lastMonth'].set( 'rightText', '' );	
			this['customTimespan'].set( 'rightText', '' );	
			window.AppData.timespan = 'noneTimespan'
			
			localStorage.setItem('timespan','noneTimespan')
			console.log('none')
		}
		
	};
});

},
'dojox/gfx/svg':function(){
define(["dojo/_base/lang", "dojo/_base/sniff", "dojo/_base/window", "dojo/dom", "dojo/_base/declare", "dojo/_base/array",
  "dojo/dom-geometry", "dojo/dom-attr", "dojo/_base/Color", "./_base", "./shape", "./path"],
function(lang, has, win, dom, declare, arr, domGeom, domAttr, Color, g, gs, pathLib){

	var svg = g.svg = {
		// summary:
		//		This the graphics rendering bridge for browsers compliant with W3C SVG1.0.
		//		This is the preferred renderer to use for interactive and accessible graphics.
	};
	svg.useSvgWeb = (typeof window.svgweb != "undefined");

	// Need to detect iOS in order to workaround bug when
	// touching nodes with text
	var uagent = navigator.userAgent,
		safMobile = has("ios"),
		android = has("android"),
		textRenderingFix = has("chrome") || (android && android>=4) ? "auto" : "optimizeLegibility";// #16099, #16461

	function _createElementNS(ns, nodeType){
		// summary:
		//		Internal helper to deal with creating elements that
		//		are namespaced.  Mainly to get SVG markup output
		//		working on IE.
		if(win.doc.createElementNS){
			return win.doc.createElementNS(ns,nodeType);
		}else{
			return win.doc.createElement(nodeType);
		}
	}
	
	function _setAttributeNS(node, ns, attr, value){
		if(node.setAttributeNS){
			return node.setAttributeNS(ns, attr, value);
		}else{
			return node.setAttribute(attr, value);
		}
	}

	function _createTextNode(text){
		if(svg.useSvgWeb){
			return win.doc.createTextNode(text, true);
		}else{
			return win.doc.createTextNode(text);
		}
	}

	function _createFragment(){
		if(svg.useSvgWeb){
			return win.doc.createDocumentFragment(true);
		}else{
			return win.doc.createDocumentFragment();
		}
	}

	svg.xmlns = {
		xlink: "http://www.w3.org/1999/xlink",
		svg:   "http://www.w3.org/2000/svg"
	};

	svg.getRef = function(name){
		// summary:
		//		looks up a node by its external name
		// name: String
		//		an SVG external reference
		// returns:
		//      returns a DOM Node specified by the name argument or null
		if(!name || name == "none") return null;
		if(name.match(/^url\(#.+\)$/)){
			return dom.byId(name.slice(5, -1));	// Node
		}
		// alternative representation of a reference
		if(name.match(/^#dojoUnique\d+$/)){
			// we assume here that a reference was generated by dojox/gfx
			return dom.byId(name.slice(1));	// Node
		}
		return null;	// Node
	};

	svg.dasharray = {
		solid:				"none",
		shortdash:			[4, 1],
		shortdot:			[1, 1],
		shortdashdot:		[4, 1, 1, 1],
		shortdashdotdot:	[4, 1, 1, 1, 1, 1],
		dot:				[1, 3],
		dash:				[4, 3],
		longdash:			[8, 3],
		dashdot:			[4, 3, 1, 3],
		longdashdot:		[8, 3, 1, 3],
		longdashdotdot:		[8, 3, 1, 3, 1, 3]
	};

	var clipCount = 0;

	svg.Shape = declare("dojox.gfx.svg.Shape", gs.Shape, {
		// summary:
		//		SVG-specific implementation of dojox/gfx/shape.Shape methods

		destroy: function(){
			if(this.fillStyle && "type" in this.fillStyle){
				var fill = this.rawNode.getAttribute("fill"),
					ref  = svg.getRef(fill);
				if(ref){
					ref.parentNode.removeChild(ref);
				}
			}
			if(this.clip){
				var clipPathProp = this.rawNode.getAttribute("clip-path");
				if(clipPathProp){
					var clipNode = dom.byId(clipPathProp.match(/gfx_clip[\d]+/)[0]);
					if(clipNode){ clipNode.parentNode.removeChild(clipNode); }
				}
			}
			gs.Shape.prototype.destroy.apply(this, arguments);
		},

		setFill: function(fill){
			// summary:
			//		sets a fill object (SVG)
			// fill: Object
			//		a fill object
			//		(see dojox/gfx.defaultLinearGradient,
			//		dojox/gfx.defaultRadialGradient,
			//		dojox/gfx.defaultPattern,
			//		or dojo/_base/Color)

			if(!fill){
				// don't fill
				this.fillStyle = null;
				this.rawNode.setAttribute("fill", "none");
				this.rawNode.setAttribute("fill-opacity", 0);
				return this;
			}
			var f;
			// FIXME: slightly magical. We're using the outer scope's "f", but setting it later
			var setter = function(x){
					// we assume that we're executing in the scope of the node to mutate
					this.setAttribute(x, f[x].toFixed(8));
				};
			if(typeof(fill) == "object" && "type" in fill){
				// gradient
				switch(fill.type){
					case "linear":
						f = g.makeParameters(g.defaultLinearGradient, fill);
						var gradient = this._setFillObject(f, "linearGradient");
						arr.forEach(["x1", "y1", "x2", "y2"], setter, gradient);
						break;
					case "radial":
						f = g.makeParameters(g.defaultRadialGradient, fill);
						var grad = this._setFillObject(f, "radialGradient");
						arr.forEach(["cx", "cy", "r"], setter, grad);
						break;
					case "pattern":
						f = g.makeParameters(g.defaultPattern, fill);
						var pattern = this._setFillObject(f, "pattern");
						arr.forEach(["x", "y", "width", "height"], setter, pattern);
						break;
				}
				this.fillStyle = f;
				return this;
			}
			// color object
			f = g.normalizeColor(fill);
			this.fillStyle = f;
			this.rawNode.setAttribute("fill", f.toCss());
			this.rawNode.setAttribute("fill-opacity", f.a);
			this.rawNode.setAttribute("fill-rule", "evenodd");
			return this;	// self
		},

		setStroke: function(stroke){
			// summary:
			//		sets a stroke object (SVG)
			// stroke: Object
			//		a stroke object (see dojox/gfx.defaultStroke)

			var rn = this.rawNode;
			if(!stroke){
				// don't stroke
				this.strokeStyle = null;
				rn.setAttribute("stroke", "none");
				rn.setAttribute("stroke-opacity", 0);
				return this;
			}
			// normalize the stroke
			if(typeof stroke == "string" || lang.isArray(stroke) || stroke instanceof Color){
				stroke = { color: stroke };
			}
			var s = this.strokeStyle = g.makeParameters(g.defaultStroke, stroke);
			s.color = g.normalizeColor(s.color);
			// generate attributes
			if(s){
				rn.setAttribute("stroke", s.color.toCss());
				rn.setAttribute("stroke-opacity", s.color.a);
				rn.setAttribute("stroke-width",   s.width);
				rn.setAttribute("stroke-linecap", s.cap);
				if(typeof s.join == "number"){
					rn.setAttribute("stroke-linejoin",   "miter");
					rn.setAttribute("stroke-miterlimit", s.join);
				}else{
					rn.setAttribute("stroke-linejoin",   s.join);
				}
				var da = s.style.toLowerCase();
				if(da in svg.dasharray){
					da = svg.dasharray[da];
				}
				if(da instanceof Array){
					da = lang._toArray(da);
					var i;
					for(i = 0; i < da.length; ++i){
						da[i] *= s.width;
					}
					if(s.cap != "butt"){
						for(i = 0; i < da.length; i += 2){
							da[i] -= s.width;
							if(da[i] < 1){ da[i] = 1; }
						}
						for(i = 1; i < da.length; i += 2){
							da[i] += s.width;
						}
					}
					da = da.join(",");
				}
				rn.setAttribute("stroke-dasharray", da);
				rn.setAttribute("dojoGfxStrokeStyle", s.style);
			}
			return this;	// self
		},

		_getParentSurface: function(){
			var surface = this.parent;
			for(; surface && !(surface instanceof g.Surface); surface = surface.parent);
			return surface;
		},

		_setFillObject: function(f, nodeType){
			var svgns = svg.xmlns.svg;
			this.fillStyle = f;
			var surface = this._getParentSurface(),
				defs = surface.defNode,
				fill = this.rawNode.getAttribute("fill"),
				ref  = svg.getRef(fill);
			if(ref){
				fill = ref;
				if(fill.tagName.toLowerCase() != nodeType.toLowerCase()){
					var id = fill.id;
					fill.parentNode.removeChild(fill);
					fill = _createElementNS(svgns, nodeType);
					fill.setAttribute("id", id);
					defs.appendChild(fill);
				}else{
					while(fill.childNodes.length){
						fill.removeChild(fill.lastChild);
					}
				}
			}else{
				fill = _createElementNS(svgns, nodeType);
				fill.setAttribute("id", g._base._getUniqueId());
				defs.appendChild(fill);
			}
			if(nodeType == "pattern"){
				fill.setAttribute("patternUnits", "userSpaceOnUse");
				var img = _createElementNS(svgns, "image");
				img.setAttribute("x", 0);
				img.setAttribute("y", 0);
				img.setAttribute("width",  f.width .toFixed(8));
				img.setAttribute("height", f.height.toFixed(8));
				_setAttributeNS(img, svg.xmlns.xlink, "xlink:href", f.src);
				fill.appendChild(img);
			}else{
				fill.setAttribute("gradientUnits", "userSpaceOnUse");
				for(var i = 0; i < f.colors.length; ++i){
					var c = f.colors[i], t = _createElementNS(svgns, "stop"),
						cc = c.color = g.normalizeColor(c.color);
					t.setAttribute("offset",       c.offset.toFixed(8));
					t.setAttribute("stop-color",   cc.toCss());
					t.setAttribute("stop-opacity", cc.a);
					fill.appendChild(t);
				}
			}
			this.rawNode.setAttribute("fill", "url(#" + fill.getAttribute("id") +")");
			this.rawNode.removeAttribute("fill-opacity");
			this.rawNode.setAttribute("fill-rule", "evenodd");
			return fill;
		},

		_applyTransform: function() {
			var matrix = this.matrix;
			if(matrix){
				var tm = this.matrix;
				this.rawNode.setAttribute("transform", "matrix(" +
					tm.xx.toFixed(8) + "," + tm.yx.toFixed(8) + "," +
					tm.xy.toFixed(8) + "," + tm.yy.toFixed(8) + "," +
					tm.dx.toFixed(8) + "," + tm.dy.toFixed(8) + ")");
			}else{
				this.rawNode.removeAttribute("transform");
			}
			return this;
		},

		setRawNode: function(rawNode){
			// summary:
			//		assigns and clears the underlying node that will represent this
			//		shape. Once set, transforms, gradients, etc, can be applied.
			//		(no fill & stroke by default)
			var r = this.rawNode = rawNode;
			if(this.shape.type!="image"){
				r.setAttribute("fill", "none");
			}
			r.setAttribute("fill-opacity", 0);
			r.setAttribute("stroke", "none");
			r.setAttribute("stroke-opacity", 0);
			r.setAttribute("stroke-width", 1);
			r.setAttribute("stroke-linecap", "butt");
			r.setAttribute("stroke-linejoin", "miter");
			r.setAttribute("stroke-miterlimit", 4);
			// Bind GFX object with SVG node for ease of retrieval - that is to
			// save code/performance to keep this association elsewhere
			r.__gfxObject__ = this;
		},

		setShape: function(newShape){
			// summary:
			//		sets a shape object (SVG)
			// newShape: Object
			//		a shape object
			//		(see dojox/gfx.defaultPath,
			//		dojox/gfx.defaultPolyline,
			//		dojox/gfx.defaultRect,
			//		dojox/gfx.defaultEllipse,
			//		dojox/gfx.defaultCircle,
			//		dojox/gfx.defaultLine,
			//		or dojox/gfx.defaultImage)
			this.shape = g.makeParameters(this.shape, newShape);
			for(var i in this.shape){
				if(i != "type"){
					this.rawNode.setAttribute(i, this.shape[i]);
				}
			}
			this.bbox = null;
			return this;	// self
		},

		// move family

		_moveToFront: function(){
			// summary:
			//		moves a shape to front of its parent's list of shapes (SVG)
			this.rawNode.parentNode.appendChild(this.rawNode);
			return this;	// self
		},
		_moveToBack: function(){
			// summary:
			//		moves a shape to back of its parent's list of shapes (SVG)
			this.rawNode.parentNode.insertBefore(this.rawNode, this.rawNode.parentNode.firstChild);
			return this;	// self
		},
		setClip: function(clip){
			// summary:
			//		sets the clipping area of this shape.
			// description:
			//		This method overrides the dojox/gfx/shape.Shape.setClip() method.
			// clip: Object
			//		an object that defines the clipping geometry, or null to remove clip.
			this.inherited(arguments);
			var clipType = clip ? "width" in clip ? "rect" : 
							"cx" in clip ? "ellipse" : 
							"points" in clip ? "polyline" : "d" in clip ? "path" : null : null;
			if(clip && !clipType){
				return this;
			}
			if(clipType === "polyline"){
				clip = lang.clone(clip);
				clip.points = clip.points.join(",");
			}
			var clipNode, clipShape,
				clipPathProp = domAttr.get(this.rawNode, "clip-path");
			if(clipPathProp){
				clipNode = dom.byId(clipPathProp.match(/gfx_clip[\d]+/)[0]);
				if(clipNode){ // may be null if not in the DOM anymore
					clipNode.removeChild(clipNode.childNodes[0]);
				}
			}
			if(clip){
				if(clipNode){
					clipShape = _createElementNS(svg.xmlns.svg, clipType);
					clipNode.appendChild(clipShape);
				}else{
					var idIndex = ++clipCount;
					var clipId = "gfx_clip" + idIndex;
					var clipUrl = "url(#" + clipId + ")";
					this.rawNode.setAttribute("clip-path", clipUrl);
					clipNode = _createElementNS(svg.xmlns.svg, "clipPath");
					clipShape = _createElementNS(svg.xmlns.svg, clipType);
					clipNode.appendChild(clipShape);
					this.rawNode.parentNode.insertBefore(clipNode, this.rawNode);
					domAttr.set(clipNode, "id", clipId);
				}
				domAttr.set(clipShape, clip);
			}else{
				//remove clip-path
				this.rawNode.removeAttribute("clip-path");
				if(clipNode){
					clipNode.parentNode.removeChild(clipNode);
				}
			}
			return this;
		},
		_removeClipNode: function(){
			var clipNode, clipPathProp = domAttr.get(this.rawNode, "clip-path");
			if(clipPathProp){
				clipNode = dom.byId(clipPathProp.match(/gfx_clip[\d]+/)[0]);
				if(clipNode){
					clipNode.parentNode.removeChild(clipNode);
				}
			}
			return clipNode;
		}
	});


	svg.Group = declare("dojox.gfx.svg.Group", svg.Shape, {
		// summary:
		//		a group shape (SVG), which can be used
		//		to logically group shapes (e.g, to propagate matricies)
		constructor: function(){
			gs.Container._init.call(this);
		},
		setRawNode: function(rawNode){
			// summary:
			//		sets a raw SVG node to be used by this shape
			// rawNode: Node
			//		an SVG node
			this.rawNode = rawNode;
			// Bind GFX object with SVG node for ease of retrieval - that is to
			// save code/performance to keep this association elsewhere
			this.rawNode.__gfxObject__ = this;
		},
		destroy: function(){
			// summary:
			//		Releases all internal resources owned by this shape. Once this method has been called,
			//		the instance is considered disposed and should not be used anymore.
			this.clear(true);
			// avoid this.inherited
			svg.Shape.prototype.destroy.apply(this, arguments);
		}
	});
	svg.Group.nodeType = "g";

	svg.Rect = declare("dojox.gfx.svg.Rect", [svg.Shape, gs.Rect], {
		// summary:
		//		a rectangle shape (SVG)
		setShape: function(newShape){
			// summary:
			//		sets a rectangle shape object (SVG)
			// newShape: Object
			//		a rectangle shape object
			this.shape = g.makeParameters(this.shape, newShape);
			this.bbox = null;
			for(var i in this.shape){
				if(i != "type" && i != "r"){
					this.rawNode.setAttribute(i, this.shape[i]);
				}
			}
			if(this.shape.r != null){
				this.rawNode.setAttribute("ry", this.shape.r);
				this.rawNode.setAttribute("rx", this.shape.r);
			}
			return this;	// self
		}
	});
	svg.Rect.nodeType = "rect";

	svg.Ellipse = declare("dojox.gfx.svg.Ellipse", [svg.Shape, gs.Ellipse], {});
	svg.Ellipse.nodeType = "ellipse";

	svg.Circle = declare("dojox.gfx.svg.Circle", [svg.Shape, gs.Circle], {});
	svg.Circle.nodeType = "circle";

	svg.Line = declare("dojox.gfx.svg.Line", [svg.Shape, gs.Line], {});
	svg.Line.nodeType = "line";

	svg.Polyline = declare("dojox.gfx.svg.Polyline", [svg.Shape, gs.Polyline], {
		// summary:
		//		a polyline/polygon shape (SVG)
		setShape: function(points, closed){
			// summary:
			//		sets a polyline/polygon shape object (SVG)
			// points: Object|Array
			//		a polyline/polygon shape object, or an array of points
			if(points && points instanceof Array){
				this.shape = g.makeParameters(this.shape, { points: points });
				if(closed && this.shape.points.length){
					this.shape.points.push(this.shape.points[0]);
				}
			}else{
				this.shape = g.makeParameters(this.shape, points);
			}
			this.bbox = null;
			this._normalizePoints();
			var attr = [], p = this.shape.points;
			for(var i = 0; i < p.length; ++i){
				attr.push(p[i].x.toFixed(8), p[i].y.toFixed(8));
			}
			this.rawNode.setAttribute("points", attr.join(" "));
			return this;	// self
		}
	});
	svg.Polyline.nodeType = "polyline";

	svg.Image = declare("dojox.gfx.svg.Image", [svg.Shape, gs.Image], {
		// summary:
		//		an image (SVG)
		setShape: function(newShape){
			// summary:
			//		sets an image shape object (SVG)
			// newShape: Object
			//		an image shape object
			this.shape = g.makeParameters(this.shape, newShape);
			this.bbox = null;
			var rawNode = this.rawNode;
			for(var i in this.shape){
				if(i != "type" && i != "src"){
					rawNode.setAttribute(i, this.shape[i]);
				}
			}
			rawNode.setAttribute("preserveAspectRatio", "none");
			_setAttributeNS(rawNode, svg.xmlns.xlink, "xlink:href", this.shape.src);
			// Bind GFX object with SVG node for ease of retrieval - that is to
			// save code/performance to keep this association elsewhere
			rawNode.__gfxObject__ = this;
			return this;	// self
		}
	});
	svg.Image.nodeType = "image";

	svg.Text = declare("dojox.gfx.svg.Text", [svg.Shape, gs.Text], {
		// summary:
		//		an anchored text (SVG)
		setShape: function(newShape){
			// summary:
			//		sets a text shape object (SVG)
			// newShape: Object
			//		a text shape object
			this.shape = g.makeParameters(this.shape, newShape);
			this.bbox = null;
			var r = this.rawNode, s = this.shape;
			r.setAttribute("x", s.x);
			r.setAttribute("y", s.y);
			r.setAttribute("text-anchor", s.align);
			r.setAttribute("text-decoration", s.decoration);
			r.setAttribute("rotate", s.rotated ? 90 : 0);
			r.setAttribute("kerning", s.kerning ? "auto" : 0);
			r.setAttribute("text-rendering", textRenderingFix);

			// update the text content
			if(r.firstChild){
				r.firstChild.nodeValue = s.text;
			}else{
				r.appendChild(_createTextNode(s.text));
			}
			return this;	// self
		},
		getTextWidth: function(){
			// summary:
			//		get the text width in pixels
			var rawNode = this.rawNode,
				oldParent = rawNode.parentNode,
				_measurementNode = rawNode.cloneNode(true);
			_measurementNode.style.visibility = "hidden";

			// solution to the "orphan issue" in FF
			var _width = 0, _text = _measurementNode.firstChild.nodeValue;
			oldParent.appendChild(_measurementNode);

			// solution to the "orphan issue" in Opera
			// (nodeValue == "" hangs firefox)
			if(_text!=""){
				while(!_width){
//Yang: work around svgweb bug 417 -- http://code.google.com/p/svgweb/issues/detail?id=417
if (_measurementNode.getBBox)
					_width = parseInt(_measurementNode.getBBox().width);
else
	_width = 68;
				}
			}
			oldParent.removeChild(_measurementNode);
			return _width;
		},
		getBoundingBox: function(){
			var s = this.getShape(), bbox = null;
			if(s.text){
				// try/catch the FF native getBBox error.
				try {
					bbox = this.rawNode.getBBox();
				} catch (e) {
					// under FF when the node is orphan (all other browsers return a 0ed bbox.
					bbox = {x:0, y:0, width:0, height:0};
				}
			}
			return bbox;
		}
	});
	svg.Text.nodeType = "text";

	svg.Path = declare("dojox.gfx.svg.Path", [svg.Shape, pathLib.Path], {
		// summary:
		//		a path shape (SVG)
		_updateWithSegment: function(segment){
			// summary:
			//		updates the bounding box of path with new segment
			// segment: Object
			//		a segment
			this.inherited(arguments);
			if(typeof(this.shape.path) == "string"){
				this.rawNode.setAttribute("d", this.shape.path);
			}
		},
		setShape: function(newShape){
			// summary:
			//		forms a path using a shape (SVG)
			// newShape: Object
			//		an SVG path string or a path object (see dojox/gfx.defaultPath)
			this.inherited(arguments);
			if(this.shape.path){
				this.rawNode.setAttribute("d", this.shape.path);
			}else{
				this.rawNode.removeAttribute("d");
			}
			return this;	// self
		}
	});
	svg.Path.nodeType = "path";

	svg.TextPath = declare("dojox.gfx.svg.TextPath", [svg.Shape, pathLib.TextPath], {
		// summary:
		//		a textpath shape (SVG)
		_updateWithSegment: function(segment){
			// summary:
			//		updates the bounding box of path with new segment
			// segment: Object
			//		a segment
			this.inherited(arguments);
			this._setTextPath();
		},
		setShape: function(newShape){
			// summary:
			//		forms a path using a shape (SVG)
			// newShape: Object
			//		an SVG path string or a path object (see dojox/gfx.defaultPath)
			this.inherited(arguments);
			this._setTextPath();
			return this;	// self
		},
		_setTextPath: function(){
			if(typeof this.shape.path != "string"){ return; }
			var r = this.rawNode;
			if(!r.firstChild){
				var tp = _createElementNS(svg.xmlns.svg, "textPath"),
					tx = _createTextNode("");
				tp.appendChild(tx);
				r.appendChild(tp);
			}
			var ref  = r.firstChild.getAttributeNS(svg.xmlns.xlink, "href"),
				path = ref && svg.getRef(ref);
			if(!path){
				var surface = this._getParentSurface();
				if(surface){
					var defs = surface.defNode;
					path = _createElementNS(svg.xmlns.svg, "path");
					var id = g._base._getUniqueId();
					path.setAttribute("id", id);
					defs.appendChild(path);
					_setAttributeNS(r.firstChild, svg.xmlns.xlink, "xlink:href", "#" + id);
				}
			}
			if(path){
				path.setAttribute("d", this.shape.path);
			}
		},
		_setText: function(){
			var r = this.rawNode;
			if(!r.firstChild){
				var tp = _createElementNS(svg.xmlns.svg, "textPath"),
					tx = _createTextNode("");
				tp.appendChild(tx);
				r.appendChild(tp);
			}
			r = r.firstChild;
			var t = this.text;
			r.setAttribute("alignment-baseline", "middle");
			switch(t.align){
				case "middle":
					r.setAttribute("text-anchor", "middle");
					r.setAttribute("startOffset", "50%");
					break;
				case "end":
					r.setAttribute("text-anchor", "end");
					r.setAttribute("startOffset", "100%");
					break;
				default:
					r.setAttribute("text-anchor", "start");
					r.setAttribute("startOffset", "0%");
					break;
			}
			//r.parentNode.setAttribute("alignment-baseline", "central");
			//r.setAttribute("dominant-baseline", "central");
			r.setAttribute("baseline-shift", "0.5ex");
			r.setAttribute("text-decoration", t.decoration);
			r.setAttribute("rotate", t.rotated ? 90 : 0);
			r.setAttribute("kerning", t.kerning ? "auto" : 0);
			r.firstChild.data = t.text;
		}
	});
	svg.TextPath.nodeType = "text";

	// Fix for setDimension bug:
	// http://bugs.dojotoolkit.org/ticket/16100
	// (https://code.google.com/p/chromium/issues/detail?id=162628)
	var hasSvgSetAttributeBug = (function(){ var matches = /WebKit\/(\d*)/.exec(uagent); return matches ? matches[1] : 0})() > 534;

	svg.Surface = declare("dojox.gfx.svg.Surface", gs.Surface, {
		// summary:
		//		a surface object to be used for drawings (SVG)
		constructor: function(){
			gs.Container._init.call(this);
		},
		destroy: function(){
			// no need to call svg.Container.clear to remove the children raw
			// nodes since the surface raw node will be removed. So, only dispose at gfx level	
			gs.Container.clear.call(this, true); 
			this.defNode = null;	// release the external reference
			this.inherited(arguments);
		},
		setDimensions: function(width, height){
			// summary:
			//		sets the width and height of the rawNode
			// width: String
			//		width of surface, e.g., "100px"
			// height: String
			//		height of surface, e.g., "100px"
			if(!this.rawNode){ return this; }
			this.rawNode.setAttribute("width",  width);
			this.rawNode.setAttribute("height", height);
			if(hasSvgSetAttributeBug){
				this.rawNode.style.width =  width;
				this.rawNode.style.height =  height;
			}
			return this;	// self
		},
		getDimensions: function(){
			// summary:
			//		returns an object with properties "width" and "height"
			var t = this.rawNode ? {
				width:  g.normalizedLength(this.rawNode.getAttribute("width")),
				height: g.normalizedLength(this.rawNode.getAttribute("height"))} : null;
			return t;	// Object
		}
	});

	svg.createSurface = function(parentNode, width, height){
		// summary:
		//		creates a surface (SVG)
		// parentNode: Node
		//		a parent node
		// width: String|Number
		//		width of surface, e.g., "100px" or 100
		// height: String|Number
		//		height of surface, e.g., "100px" or 100
		// returns: dojox/gfx/shape.Surface
		//     newly created surface

		var s = new svg.Surface();
		s.rawNode = _createElementNS(svg.xmlns.svg, "svg");
		s.rawNode.setAttribute("overflow", "hidden");
		if(width){
			s.rawNode.setAttribute("width",  width);
		}
		if(height){
			s.rawNode.setAttribute("height", height);
		}

		var defNode = _createElementNS(svg.xmlns.svg, "defs");
		s.rawNode.appendChild(defNode);
		s.defNode = defNode;

		s._parent = dom.byId(parentNode);
		s._parent.appendChild(s.rawNode);

		g._base._fixMsTouchAction(s);

		return s;	// dojox/gfx.Surface
	};

	// Extenders

	var Font = {
		_setFont: function(){
			// summary:
			//		sets a font object (SVG)
			var f = this.fontStyle;
			// next line doesn't work in Firefox 2 or Opera 9
			//this.rawNode.setAttribute("font", dojox.gfx.makeFontString(this.fontStyle));
			this.rawNode.setAttribute("font-style", f.style);
			this.rawNode.setAttribute("font-variant", f.variant);
			this.rawNode.setAttribute("font-weight", f.weight);
			this.rawNode.setAttribute("font-size", f.size);
			this.rawNode.setAttribute("font-family", f.family);
		}
	};

	var C = gs.Container;
	var Container = svg.Container = {
		openBatch: function() {
			// summary:
			//		starts a new batch, subsequent new child shapes will be held in
			//		the batch instead of appending to the container directly
			if(!this._batch){
				this.fragment = _createFragment();
			}
			++this._batch;
			return this;
		},
		closeBatch: function() {
			// summary:
			//		submits the current batch, append all pending child shapes to DOM
			this._batch = this._batch > 0 ? --this._batch : 0;
			if (this.fragment && !this._batch) {
				this.rawNode.appendChild(this.fragment);
				delete this.fragment;
			}
			return this;
		},
		add: function(shape){
			// summary:
			//		adds a shape to a group/surface
			// shape: dojox/gfx/shape.Shape
			//		an VML shape object
			if(this != shape.getParent()){
				if (this.fragment) {
					this.fragment.appendChild(shape.rawNode);
				} else {
					this.rawNode.appendChild(shape.rawNode);
				}
				C.add.apply(this, arguments);
				// update clipnode with new parent
				shape.setClip(shape.clip);
			}
			return this;	// self
		},
		remove: function(shape, silently){
			// summary:
			//		remove a shape from a group/surface
			// shape: dojox/gfx/shape.Shape
			//		an VML shape object
			// silently: Boolean?
			//		if true, regenerate a picture
			if(this == shape.getParent()){
				if(this.rawNode == shape.rawNode.parentNode){
					this.rawNode.removeChild(shape.rawNode);
				}
				if(this.fragment && this.fragment == shape.rawNode.parentNode){
					this.fragment.removeChild(shape.rawNode);
				}
				// remove clip node from parent 
				shape._removeClipNode();
				C.remove.apply(this, arguments);
			}
			return this;	// self
		},
		clear: function(){
			// summary:
			//		removes all shapes from a group/surface
			var r = this.rawNode;
			while(r.lastChild){
				r.removeChild(r.lastChild);
			}
			var defNode = this.defNode;
			if(defNode){
				while(defNode.lastChild){
					defNode.removeChild(defNode.lastChild);
				}
				r.appendChild(defNode);
			}
			return C.clear.apply(this, arguments);
		},
		getBoundingBox: C.getBoundingBox,
		_moveChildToFront: C._moveChildToFront,
		_moveChildToBack:  C._moveChildToBack
	};

	var Creator = svg.Creator = {
		// summary:
		//		SVG shape creators
		createObject: function(shapeType, rawShape){
			// summary:
			//		creates an instance of the passed shapeType class
			// shapeType: Function
			//		a class constructor to create an instance of
			// rawShape: Object
			//		properties to be passed in to the classes "setShape" method
			if(!this.rawNode){ return null; }
			var shape = new shapeType(),
				node = _createElementNS(svg.xmlns.svg, shapeType.nodeType);

			shape.setRawNode(node);
			shape.setShape(rawShape);
			// rawNode.appendChild() will be done inside this.add(shape) below
			this.add(shape);
			return shape;	// dojox/gfx/shape.Shape
		}
	};

	lang.extend(svg.Text, Font);
	lang.extend(svg.TextPath, Font);

	lang.extend(svg.Group, Container);
	lang.extend(svg.Group, gs.Creator);
	lang.extend(svg.Group, Creator);

	lang.extend(svg.Surface, Container);
	lang.extend(svg.Surface, gs.Creator);
	lang.extend(svg.Surface, Creator);

	// Mouse/Touch event
	svg.fixTarget = function(event, gfxElement) {
		// summary:
		//		Adds the gfxElement to event.gfxTarget if none exists. This new
		//		property will carry the GFX element associated with this event.
		// event: Object
		//		The current input event (MouseEvent or TouchEvent)
		// gfxElement: Object
		//		The GFX target element
		if (!event.gfxTarget) {
			if (safMobile && event.target.wholeText) {
				// Workaround iOS bug when touching text nodes
				event.gfxTarget = event.target.parentElement.__gfxObject__;
			} else {
				event.gfxTarget = event.target.__gfxObject__;
			}
		}
		return true;
	};

	// some specific override for svgweb + flash
	if(svg.useSvgWeb){
		// override createSurface()
		svg.createSurface = function(parentNode, width, height){
			var s = new svg.Surface();

			// ensure width / height
			if(!width || !height){
				var pos = domGeom.position(parentNode);
				width  = width  || pos.w;
				height = height || pos.h;
			}

			// ensure id
			parentNode = dom.byId(parentNode);
			var id = parentNode.id ? parentNode.id+'_svgweb' : g._base._getUniqueId();

			// create dynamic svg root
			var mockSvg = _createElementNS(svg.xmlns.svg, 'svg');
			mockSvg.id = id;
			mockSvg.setAttribute('width', width);
			mockSvg.setAttribute('height', height);
			svgweb.appendChild(mockSvg, parentNode);

			// notice: any call to the raw node before flash init will fail.
			mockSvg.addEventListener('SVGLoad', function(){
				// become loaded
				s.rawNode = this;
				s.isLoaded = true;

				// init defs
				var defNode = _createElementNS(svg.xmlns.svg, "defs");
				s.rawNode.appendChild(defNode);
				s.defNode = defNode;

				// notify application
				if (s.onLoad)
					s.onLoad(s);
			}, false);

			// flash not loaded yet
			s.isLoaded = false;
			return s;
		};

		// override Surface.destroy()
		svg.Surface.extend({
			destroy: function(){
				var mockSvg = this.rawNode;
				svgweb.removeChild(mockSvg, mockSvg.parentNode);
			}
		});

		// override connect() & disconnect() for Shape & Surface event processing
		var _eventsProcessing = {
			connect: function(name, object, method){
				// connect events using the mock addEventListener() provided by svgweb
				if (name.substring(0, 2)==='on') { name = name.substring(2); }
				if (arguments.length == 2) {
					method = object;
				} else {
					method = lang.hitch(object, method);
				}
				this.getEventSource().addEventListener(name, method, false);
				return [this, name, method];
			},
			disconnect: function(token){
				// disconnect events using the mock removeEventListener() provided by svgweb
				this.getEventSource().removeEventListener(token[1], token[2], false);
				delete token[0];
			}
		};

		lang.extend(svg.Shape, _eventsProcessing);
		lang.extend(svg.Surface, _eventsProcessing);
	}

	return svg;
});

},
'money/views/backup':function(){
define([
	"dojo/json","dojo/on",'dojo/when',"dojo/dom-style","dojo/dom-class", 
	"dojo/DeferredList", "dojo/Deferred", "dijit/registry",
	"dojo/sniff","dojox/mobile/ProgressIndicator","dojo/_base/array",
	"money/TouchableButton", "dojo/date/locale","money/dialog",'dojo/text!money/views/backup.html'
 ],
    function(json, on, when, domStyle, domClass, DeferredList, Deferred, registry,has, ProgressIndicator, arrayUtil,Button, locale, Dialog){
    
	return window.AppData.objBackup = {
		//0 - sync, 1 - clear dropbox, 2 - restore from dropbox, 3 - clear transactions, 4 - clear all
		syncMode: {
			SYNC			 : 0,
			CLEAR_DROPBOX	 : 1,
			CLEAR_TRANSACIONS : 3,
			CLEAR_ALL		 : 4
		},
		
		beforeActivate: function(){			
			domStyle.set("online","display",navigator.onLine ? "" : "none")
			domStyle.set("offline","display",navigator.onLine ? "none" : "")
			
			if(this._onLineInt)
				clearInterval( this._onLineInt );
			
			this._onLineInt = setInterval(function(){
				domStyle.set("online","display",navigator.onLine ? "" : "none")
				domStyle.set("offline","display",navigator.onLine ? "none" : "")				
			},1000)
			
			//this.loginBtn.set('label',window.AppData.client.isAuthenticated() ? this.nls.unlinkDropbox : this.nls.linkDropbox)
			if( !window.AppData.client.isAuthenticated() ){
				domStyle.set('dropbox-sync-help',"display",'none');
				domStyle.set(this.loginBtn.domNode,"display",'block');
				domStyle.set(this.logoutBtn.domNode,"display",'none');
				domStyle.set(this.syncBtn.domNode,"display",'none');
				domStyle.set('dr-redir',"display",'block');
			}else {
				domStyle.set('dropbox-sync-help',"display",'block');
				domStyle.set(this.loginBtn.domNode,"display",'none');
				domStyle.set(this.logoutBtn.domNode,"display",'block');
				domStyle.set(this.syncBtn.domNode,"display",'block');
				domStyle.set('dr-redir',"display",'none');
			}
			domStyle.set('backup-download','display',window.AppData.client.isAuthenticated()? "" : "none")
        },
        
        init: function(){
			if(!has('isInitiallySmall'))
				domClass.add(this.backButton.domNode,'hideOnMedium hideOnLarge')
			var self = this
			
			//this.loginBtn = new Button;
			this.loginBtn.onClick = function(){
				if(!window.AppData.client.isAuthenticated()) {
					try{
						self.dlg.show(true, self.nls.pleaseWait, self.nls.signing , self.nls.cancel)
						//throw "";
						window.AppData.client.authenticate();
					}catch(e) {
						self.dlg.hide()
						self.dlg.show(false, self.nls.errorInState , self.nls.error, self.nls.restart, function(){
							location.reload();
						})
						
					}
				} 
			}
			
			this.logoutBtn.onClick = function(){
				try {
					window.AppData.client.signOut();
					localStorage.removeItem('dropboxEnabled')
					domStyle.set('backup-download','display', "none")
					domStyle.set('dropbox-sync-help',"display",'none');
					domStyle.set('dr-redir',"display",'block');
					domStyle.set(self.loginBtn.domNode,"display",'block');
					domStyle.set(self.logoutBtn.domNode,"display",'none');
					domStyle.set(self.syncBtn.domNode,"display",'none');
				}catch(e) {
					console.log( e )
				}
			}
			var self = this
			
			on(this.syncBtn,'click',function(){
				
				self.doSync( self.syncMode.SYNC )
			})
			on(this.clearBtn,'click',function(){
				self.dlg.show(false, 
					self.nls.sureToClear, self.nls.clearRemote , self.nls.yes, function(){
						self.doSync( self.syncMode.CLEAR_DROPBOX )
					}, self.nls.no );					
			})
			/*on(this.clearTransBtn,'click',function(){
				self.doSync(3)
			})*/
			on(this.clearAllBtn,'click',function(){
				self.dlg.show(false, 
					self.nls.sureToClearAll, self.nls.clearLocal , self.nls.yes, function(){
						self.doSync( self.syncMode.CLEAR_ALL )
					}, self.nls.no
				);
			})
			
			this.dlg = window.AppData.dialogWindow ? window.AppData.dialogWindow : (window.AppData.dialogWindow = new Dialog);
				
        },
        
        doSync: function(flag){
			var self = this, client = window.AppData.client;
			
			if( client.isAuthenticated() || flag == self.syncMode.CLEAR_ALL || flag == self.syncMode.CLEAR_TRANSACTIONS ){
				this.dlg.show(true, self.nls.processing, self.nls.syncing , self.nls.cancel)
				
				if( !this.datastore && ( flag != self.syncMode.CLEAR_ALL && flag != self.syncMode.CLEAR_TRANSACTIONS ) ){
					try{
						var datastoreManager = client.getDatastoreManager();
						
					}catch(e){
						self.dlg.hide();
						self.dlg.show( false, self.nls.errorCreatingDatastore, self.nls.backupRestoreTitle ,"Ok" )
						console.log(e)
					}
					datastoreManager.openDefaultDatastore(function (error, datastore) {
						if (error) {
							self.dlg.hide() ;
							self.dlg.show( false, self.nls.errorOpeningDatastore, self.nls.backupRestoreTitle ,"Ok" ) ;
							return ;
						}
						
						// Now you have a datastore. The next few examples can be included here.
						self.datastore = datastore
						var res = self._doSync( self.datastore, flag ) ;
						
						
						var callback = function(){
							if(self.error) return;
							
							self.dlg.hide();
							if( registry.byId('summary-list') ) {
								window.dFinance.children.dFinance_summary.summary = [];
								registry.byId('summary-list'). refresh();
							}
							self.dlg.show( false, self.nls.taskCompleted + (( flag == self.syncMode.CLEAR_ALL || flag == self.syncMode.CLEAR_TRANSACTIONS) ? "<br/>"+ self.nls.applicationWillBeRestarted:""), self.nls.backupRestoreTitle ,"Ok", function(){
								if( flag == self.syncMode.CLEAR_ALL || flag == self.syncMode.CLEAR_TRANSACTIONS )
									location.reload();								
							})
						};
						if(!!res) res.then( callback );
						else callback();
					});
				}else{
					var res = self._doSync(self.datastore ? self.datastore : null, flag)
					var callback = function(){
						if(self.error) return;
						
						self.dlg.hide();
						self.dlg.show(false,  self.nls.taskCompleted + (( flag == self.syncMode.CLEAR_ALL || flag == self.syncMode.CLEAR_TRANSACTIONS ) ? "<br/>"+ self.nls.applicationWillBeRestarted :""), self.nls.backupRestoreTitle  ,"Ok",function(){
							if(  flag == self.syncMode.CLEAR_ALL || flag == self.syncMode.CLEAR_TRANSACTIONS )
								location.reload()
						})
					}
					if(!!res) res.then( callback );
					else callback();
				}
				
			}
		},
		_doSync: function(datastore, flag){
			var self = this
			
			if(!datastore && flag != self.syncMode.CLEAR_ALL && flag != self.syncMode.CLEAR_TRANSACTIONS) {

				self.dlg.hide();
				self.dlg.show( false, self.nls.errorStrange, self.nls.backupRestoreTitle ,"Ok" )				
				this.error = true;
				return ;
			}
			this.error = false;
			var flag = flag || 0; //0 - sync, 1 - clear dropbox, 2 - restore from dropbox, 3 - clear transactions, 4 - clear all
			if( flag != self.syncMode.CLEAR_ALL && flag != self.syncMode.CLEAR_TRANSACTIONS ){
				
				var table = datastore.getTable('settings');
				var currency = table.query({id: 'hc'}).length ? table.query({id: 'hc'})[0].get('value') : false
				
				if(flag == 0){
					if(!currency) 
						table.insert({
							'id' : 'hc',
							'value' : window.AppData.currency
						})
					else if(currency != window.AppData.currency){
						this.dlg.hide();
						this.error = true;
						this.dlg.show(false, self.nls.currenciesDontMatch, "Backup & Restore", "Ok");
						return;
					}
					this.error = false;
				}
			}
				
			this._syncAccounts(datastore, flag);
			this._syncTags(datastore, flag);			
			return this._syncTransactions(datastore, flag);
			
			
		},
		_syncAccounts: function(datastore, flag){
			var deleted = localStorage.getItem('deletedAccounts') ? json.parse(localStorage.getItem('deletedAccounts')) : [];
			
					
			switch (flag)  {
				case 4 :
					arrayUtil.forEach(window.AppData.accountStore.query(),function(item){
						window.AppData.accountStore.remove(item.id);
					})
					localStorage.removeItem('deletedAccounts');
					window.AppData.store._setAccounts(window.AppData.store.getAccounts())
				case 3 :
					break;
				case 1 : 
					var table = datastore.getTable('accounts');
					var table4deleted = datastore.getTable('accountsDel');
					var remoteDeleted = table4deleted.query()
					
					var all = table.query()
					for(var i=0; i<remoteDeleted.length; i++){
						if(table4deleted.query({id: remoteDeleted[i].get('id')}).length)
							table4deleted.query({id: remoteDeleted[i].get('id')})[0].deleteRecord()
					}
					for(var i=0; i<all.length; i++){
						if(table.query({id: all[i].get('id')}).length)
							table.query({id: all[i].get('id')})[0].deleteRecord()
					}
					break;
				case 0 : 
					var table = datastore.getTable('accounts');
					var table4deleted = datastore.getTable('accountsDel');
					var remoteDeleted = table4deleted.query()
					
					for(var i = 0; i<remoteDeleted.length; i++)
						if(window.AppData.store.getAccount(remoteDeleted[i].get('id')))
							window.AppData.store.removeAccount(remoteDeleted[i].get('id'))
			
					for(var i=0; i<deleted.length; i++){
						if(!table4deleted.query({id: deleted[i]}).length)
							table4deleted.insert({id: deleted[i]})
						if(table.query({id: Number(deleted[i])}).length)
							table.query({id: Number(deleted[i])})[0].deleteRecord()
					}
					localStorage.removeItem('deletedAccounts');
					var results = table.query();
			
					for(var i in results){
						record = results[i];
						var localRecord = window.AppData.store.getAccount(record.get('id'))
						if(!localRecord) {
							localRecord = window.AppData.store.putAccount({
								id : record.get('id'),
								et : record.get('et'),
								startAmount: record.get('startAmount'),
								label: record.get('label'),
								currency: record.get('currency'),
								maincur: record.get('maincur')
							}) 
						}else if(record.get('et') < localRecord.et){
							record.set('maincur', localRecord.maincur);
							record.set('label', localRecord.label);
							record.set('startAmount', localRecord.startAmount);
							record.set('et', localRecord.et);					
							record.set('currency', localRecord.currency);
						}else{
							localRecord.label = record.get('label')
							localRecord.maincur = record.get('maincur')
							localRecord.currency = record.get('currency')
							localRecord.startAmount = record.get('startAmount')
							localRecord.et = record.get('et')
							window.AppData.store.putAccount(localRecord)
						}
					}
					//var records = event.affectedRecordsForTable('accounts');
					var accs = window.AppData.store.getAccounts()
					for(var i = 0; i<accs.length; i++ ){
						var localRecord = accs[i]
						if(!table.query({id:localRecord.id}).length){
							table.insert({
								'label': localRecord.label,
								'startAmount': localRecord.startAmount,
								'et': localRecord.et,
								'id': localRecord.id,
								'currency': localRecord.currency,
								'maincur': localRecord.maincur
							})
						}
					}
					window.AppData.store._setAccounts(window.AppData.store.getAccounts())
			}
			
			
		},
		
		_syncTags: function(datastore, flag){
			
			switch (flag)  {
				case 4 :
					arrayUtil.forEach(window.AppData.tagsStore.query(),function(item){
						window.AppData.tagsStore.remove(item.id);
					})
					localStorage.removeItem('deletedTags');
					window.AppData.store._setTags(window.AppData.store.getTags())
					break;
				case 3 : 
					break;
				case 1 : 
					var table = datastore.getTable('tags');
					var table4deleted = datastore.getTable('tagsDel');
					var remoteDeleted = table4deleted.query()
			
					var all = table.query()
					for(var i=0; i<remoteDeleted.length; i++){
						if(table4deleted.query({id: remoteDeleted[i].get('id')}).length)
							table4deleted.query({id: remoteDeleted[i].get('id')})[0].deleteRecord()
					}
					for(var i=0; i<all.length; i++){
						if(table.query({id: all[i].get('id')}).length)
							table.query({id: all[i].get('id')})[0].deleteRecord()
					}
					break;
				case 0 : 
					var table = datastore.getTable('tags');
					var table4deleted = datastore.getTable('tagsDel');
					var remoteDeleted = table4deleted.query()
			
					for(var i = 0; i<remoteDeleted.length; i++)
						if(window.AppData.store.getTag(remoteDeleted[i].get('id')))
							window.AppData.store.removeTag(remoteDeleted[i].get('id'))
							
					var deleted = localStorage.getItem('deletedTags') ? json.parse(localStorage.getItem('deletedTags')) : [];
					for(var i=0; i<deleted.length; i++){
						if(!table4deleted.query({id: deleted[i]}).length)
							table4deleted.insert({id: deleted[i]})
						if(table.query({id: Number(deleted[i])}).length)
							table.query({id: Number(deleted[i])})[0].deleteRecord()
					}
					localStorage.removeItem('deletedTags');
					var results = table.query();
					
					for(var i=0;i<results.length;i++){
						record = results[i];
						var localRecord = window.AppData.store.getTag(record.get('id'))
						if(!localRecord)
							localRecord = window.AppData.store.putTag({
								id : record.get('id'),
								et : record.get('et'),
								label: record.get('label')
							})
						else if(record.get('et') < localRecord.et){
							record.set('label', localRecord.label);
							record.set('et', localRecord.et);					
						}else{
							localRecord.label = record.get('label')
							localRecord.et = record.get('et')
							window.AppData.store.putTag(localRecord)
						}
					}
					var accs = window.AppData.store.getTags()
					
					for(var i = 0; i<accs.length; i++ ){
						var localRecord = accs[i]
						if( !table.query( {id : localRecord.id }).length )
							table.insert({
								'label': localRecord.label,
								'et': localRecord.et,
								'id': localRecord.id
							})
					}
					window.AppData.store._setTags(window.AppData.store.getTags())
					console.log('done with tags')
				}
		},
		
		_syncTransactions: function(datastore, flag){
			var def = [];
			
			console.log('SYNCTRANSACTION ', flag)
			switch (flag)  {
				case 4 : ;
				case 3 :
					var delDeferred = new Deferred;
					var singleDeleteOperations = []
					window.AppData.store.query().then( function(data){
						for(var i=0; i< data.items.length; i++){
							var item = data.items[i];
							
							singleDeleteOperations.push( 
								window.AppData.store.remove(item.id, true) 
							);
						}
						
						new DeferredList( singleDeleteOperations ).then(
							function(){ delDeferred.resolve('ok') }
						);
					})
					
					localStorage.removeItem('deleted');
					localStorage.removeItem('currency');
					
					
					
					return delDeferred;
					
				case 1 : 
					var table = datastore.getTable('trans');
					var settingsTable = datastore.getTable('settings');
					arrayUtil.forEach(settingsTable.query(),function(item){
						item.deleteRecord()
					})
					
					var table4deleted = datastore.getTable('transDel');
					var remoteDeleted = table4deleted.query()
			
					var all = table.query()
					for(var i=0; i<remoteDeleted.length; i++){
						if(table4deleted.query({id: remoteDeleted[i].get('id')}).length)
							table4deleted.query({id: remoteDeleted[i].get('id')})[0].deleteRecord()
					}
					for(var i=0; i<all.length; i++){
						if(table.query({id: all[i].get('id')}).length)
							table.query({id: all[i].get('id')})[0].deleteRecord()
					}
					break;
				case 0 : 
					var table = datastore.getTable('trans');
					/*arrayUtil.forEach(table.query(),function(item){
						item.deleteRecord()
					})*/
					
					var table4deleted = datastore.getTable('transDel');
					
					/*
					 * 	Remove trash from v0.5 - 0.7.5.2
					 */ 
					var remoteDeleted = table4deleted.query()
					for(var i=0; i<remoteDeleted.length; i++){
						if(remoteDeleted[i].get('id') === 'true' && 
							table4deleted.query({id: remoteDeleted[i].get('id')}).length)
								table4deleted.query({id: remoteDeleted[i].get('id')})[0].deleteRecord();
					}
					
					
					var remoteDeleted = table4deleted.query()
					
					for(var i = 0; i<remoteDeleted.length; i++){
						var deferredDeleteOperation = new Deferred;
						(function( ddo, i ){
							window.AppData.store.get(remoteDeleted[i].get('id'))
								.then(function( item ) {
									if( item ) {
										window.AppData.store.remove(remoteDeleted[i].get('id'))
											.then( function(){ console.log('resolved del oper'); ddo.resolve('ok') } )
									} else {
										ddo.resolve('ok');
									}
								})
							}							
						)(deferredDeleteOperation, i);
						def.push( deferredDeleteOperation );
					}
					
					var deleted = localStorage.getItem('deleted') ? json.parse(localStorage.getItem('deleted')) : [];
					for(var i=0; i<deleted.length; i++){
						if(!table4deleted.query({id: deleted[i]}).length)
							table4deleted.insert({id: deleted[i]})
						
						if(table.query({id: Number(deleted[i])}).length)
							table.query({id: Number(deleted[i])})[0].deleteRecord()
					}
					localStorage.removeItem('deleted');
					var results = table.query();
					
					for(var i in results){
						var singleRecord = results[i];
						var defPushChangesOperation = new Deferred;
						def.push( defPushChangesOperation );
						
						(function(record, defPushChangesOperation){
						var lrDef = window.AppData.store.get( record.get('id') )
						when(lrDef, function(localRecord){
							
							if(!localRecord){
								var lr = window.AppData.store.put({
									id 		: record.get('id'),
									et 		: record.get('e'),
									amount 	: record.get('a'),
									amountHome : record.get('z'),
									tags	: record.get('t')._array(),
									type	: record.get('d'),
									descr	: record.get('g') ? record.get('g') : "",
									account : record.get('b'),
									date	: locale.parse(record.get('f'), {selector:"date", datePattern:window.AppData.widgetDateFormat}),
									accountTo : record.get('c')	? record.get('c') : undefined,
									sumTo 	: record.get('s')	? record.get('s') : undefined
								}, true, true)
								if(lr.def)
									lr.def.then( function(){ defPushChangesOperation.resolve('ok') });
								else defPushChangesOperation.resolve('ok');
							}else if(record.get('e') < localRecord.et){
							
								record.set('e',localRecord.et)
								record.set('a',localRecord.amount)
								record.set('z',localRecord.amountHome)
								record.set('t',localRecord.tags)
								record.set('d',localRecord.type)
								record.set('g',localRecord.descr)
								record.set('b',localRecord.account)
								if(localRecord.accountTo) {
									record.set('c',localRecord.accountTo)
									record.set('s',localRecord.sumTo)
								}
								record.set('f',locale.format(localRecord.date, {selector:"date", datePattern:window.AppData.widgetDateFormat}))
								defPushChangesOperation.resolve('ok')
							}else if(record.get('e') < localRecord.et){
								localRecord.et = record.get('e')
								localRecord.amount = record.get('a')
								localRecord.amountHome = record.get('z')
								localRecord.tags = record.get('t')._array()
								localRecord.type = record.get('d')
								localRecord.account = record.get('b')
								localRecord.descr = record.get('g') ? record.get('g') : ""
							
								if(record.get('c')) {
									localRecord.accountTo = record.get('c')
									localRecord.sumTo = record.get('s')
								}
								localRecord.date = locale.parse(record.get('f'), {selector:"date", datePattern:window.AppData.widgetDateFormat})
								var lrDef = window.AppData.store.put(localRecord, true, true).def
									.then( function(){
										defPushChangesOperation.resolve('ok')
									} )
								
							}else {
								defPushChangesOperation.resolve('ok')
							}
						
						
						})	
					})(singleRecord, defPushChangesOperation);
					}
					var queryDef = new Deferred;
					window.AppData.store.query().then( function(data){
						for(var i = 0; i<data.items.length; i++ ){
							var localRecord = data.items[i]
							if(!table.query({id:localRecord.id}).length){
								record = table.insert({
									'e'	: localRecord.et,
									'id': localRecord.id,
									'a'	: localRecord.amount,
									'z'	: localRecord.amountHome,
									't'	: localRecord.tags,
									'd'	: localRecord.type,
									'b'	: localRecord.account,
									'g'	: localRecord.descr,
									'f'	: locale.format(localRecord.date, {selector:"date", datePattern:window.AppData.widgetDateFormat})
								})
								if(localRecord.accountTo){
									record.set('c',localRecord.accountTo)
									record.set('s',localRecord.sumTo)
								}
							}
						}
						queryDef.resolve('ok')
					})
					def.push(queryDef);
					console.log('done with trans');
					return new DeferredList( def );					
			}
			return false
		}
    };
});

},
'dojox/gfx/_base':function(){
define(["dojo/_base/kernel", "dojo/_base/lang", "dojo/_base/Color", "dojo/_base/sniff", "dojo/_base/window",
	    "dojo/_base/array","dojo/dom", "dojo/dom-construct","dojo/dom-geometry"],
function(kernel, lang, Color, has, win, arr, dom, domConstruct, domGeom){
	// module:
	//		dojox/gfx
	// summary:
	//		This module contains common core Graphics API used by different graphics renderers.

	var g = lang.getObject("dojox.gfx", true),
		b = g._base = {};
	
	// candidates for dojox.style (work on VML and SVG nodes)
	g._hasClass = function(/*DomNode*/node, /*String*/classStr){
		// summary:
		//		Returns whether or not the specified classes are a portion of the
		//		class list currently applied to the node.
		
		// return (new RegExp('(^|\\s+)'+classStr+'(\\s+|$)')).test(node.className)	// Boolean
		var cls = node.getAttribute("className");
		return cls && (" " + cls + " ").indexOf(" " + classStr + " ") >= 0;  // Boolean
	};
	g._addClass = function(/*DomNode*/node, /*String*/classStr){
		// summary:
		//		Adds the specified classes to the end of the class list on the
		//		passed node.
		var cls = node.getAttribute("className") || "";
		if(!cls || (" " + cls + " ").indexOf(" " + classStr + " ") < 0){
			node.setAttribute("className", cls + (cls ? " " : "") + classStr);
		}
	};
	g._removeClass = function(/*DomNode*/node, /*String*/classStr){
		// summary:
		//		Removes classes from node.
		var cls = node.getAttribute("className");
		if(cls){
			node.setAttribute(
				"className",
				cls.replace(new RegExp('(^|\\s+)' + classStr + '(\\s+|$)'), "$1$2")
			);
		}
	};

	// candidate for dojox.html.metrics (dynamic font resize handler is not implemented here)

	//		derived from Morris John's emResized measurer
	b._getFontMeasurements = function(){
		// summary:
		//		Returns an object that has pixel equivilents of standard font
		//		size values.
		var heights = {
			'1em': 0, '1ex': 0, '100%': 0, '12pt': 0, '16px': 0, 'xx-small': 0,
			'x-small': 0, 'small': 0, 'medium': 0, 'large': 0, 'x-large': 0,
			'xx-large': 0
		};
		var p, oldStyle;	
		if(has("ie")){
			//	We do a font-size fix if and only if one isn't applied already.
			// NOTE: If someone set the fontSize on the HTML Element, this will kill it.
			oldStyle = win.doc.documentElement.style.fontSize || "";
			if(!oldStyle){
				win.doc.documentElement.style.fontSize="100%";
			}
		}

		//		set up the measuring node.
		var div = domConstruct.create("div", {style: {
				position: "absolute",
				left: "0",
				top: "-100px",
				width: "30px",
				height: "1000em",
				borderWidth: "0",
				margin: "0",
				padding: "0",
				outline: "none",
				lineHeight: "1",
				overflow: "hidden"
			}}, win.body());

		//		do the measurements.
		for(p in heights){
			div.style.fontSize = p;
			heights[p] = Math.round(div.offsetHeight * 12/16) * 16/12 / 1000;
		}

		if(has("ie")){
			// Restore the font to its old style.
			win.doc.documentElement.style.fontSize = oldStyle;
		}
		win.body().removeChild(div);
		return heights; //object
	};

	var fontMeasurements = null;

	b._getCachedFontMeasurements = function(recalculate){
		if(recalculate || !fontMeasurements){
			fontMeasurements = b._getFontMeasurements();
		}
		return fontMeasurements;
	};

	// candidate for dojox.html.metrics

	var measuringNode = null, empty = {};
	b._getTextBox = function(	/*String*/ text,
								/*Object*/ style,
								/*String?*/ className){
		var m, s, al = arguments.length;
		var i, box;
		if(!measuringNode){
			measuringNode = domConstruct.create("div", {style: {
				position: "absolute",
				top: "-10000px",
				left: "0",
				visibility: "hidden"
			}}, win.body());
		}
		m = measuringNode;
		// reset styles
		m.className = "";
		s = m.style;
		s.borderWidth = "0";
		s.margin = "0";
		s.padding = "0";
		s.outline = "0";
		// set new style
		if(al > 1 && style){
			for(i in style){
				if(i in empty){ continue; }
				s[i] = style[i];
			}
		}
		// set classes
		if(al > 2 && className){
			m.className = className;
		}
		// take a measure
		m.innerHTML = text;

		if(m.getBoundingClientRect){
			var bcr = m.getBoundingClientRect();
			box = {l: bcr.left, t: bcr.top, w: bcr.width || (bcr.right - bcr.left), h: bcr.height || (bcr.bottom - bcr.top)};
		}else{
			box = domGeom.getMarginBox(m);
		}
		m.innerHTML = "";
		return box;
	};

	b._computeTextLocation = function(/*g.defaultTextShape*/textShape, /*Number*/width, /*Number*/height, /*Boolean*/fixHeight) {
		var loc = {}, align = textShape.align;
		switch (align) {
			case 'end':
				loc.x = textShape.x - width;
				break;
			case 'middle':
				loc.x = textShape.x - width / 2;
				break;
			default:
				loc.x = textShape.x;
				break;
		}
		var c = fixHeight ? 0.75 : 1;
		loc.y = textShape.y - height*c; // **rough** approximation of the ascent...
		return loc;
	};
	b._computeTextBoundingBox = function(/*shape.Text*/s){
		// summary:
		//		Compute the bbox of the given shape.Text instance. Note that this method returns an
		//		approximation of the bbox, and should be used when the underlying renderer cannot provide precise metrics.
		if(!g._base._isRendered(s)){
			return {x:0, y:0, width:0, height:0};
		}
		var loc, textShape = s.getShape(),
			font = s.getFont() || g.defaultFont,
			w = s.getTextWidth(),
			h = g.normalizedLength(font.size);
		loc = b._computeTextLocation(textShape, w, h, true);
		return {
			x: loc.x,
			y: loc.y,
			width: w,
			height: h
		};
	};
	b._isRendered = function(/*Shape*/s){
		var p = s.parent;
		while(p && p.getParent){
			p = p.parent;
		}
		return p !== null;
	};

	// candidate for dojo.dom

	var uniqueId = 0;
	b._getUniqueId = function(){
		// summary:
		//		returns a unique string for use with any DOM element
		var id;
		do{
			id = kernel._scopeName + "xUnique" + (++uniqueId);
		}while(dom.byId(id));
		return id;
	};

	// IE10

	b._fixMsTouchAction = function(/*dojox/gfx/shape.Surface*/surface){
		var r = surface.rawNode;
		if (typeof r.style.msTouchAction != 'undefined')
			r.style.msTouchAction = "none";
	};

	/*=====
	g.Stroke = {
		// summary:
		//		A stroke defines stylistic properties that are used when drawing a path.

		// color: String
		//		The color of the stroke, default value 'black'.
		color: "black",

		// style: String
		//		The style of the stroke, one of 'solid', ... . Default value 'solid'.
		style: "solid",

		// width: Number
		//		The width of a stroke, default value 1.
		width: 1,

		// cap: String
		//		The endcap style of the path. One of 'butt', 'round', ... . Default value 'butt'.
		cap: "butt",

		// join: Number
		//		The join style to use when combining path segments. Default value 4.
		join: 4
	};
	
	g.Fill = {
		// summary:
		//		Defines how to fill a shape. Four types of fills can be used: solid, linear gradient, radial gradient and pattern.
		//		See dojox/gfx.LinearGradient, dojox/gfx.RadialGradient and dojox/gfx.Pattern respectively for more information about the properties supported by each type.
		
		// type: String?
		//		The type of fill. One of 'linear', 'radial', 'pattern' or undefined. If not specified, a solid fill is assumed.
		type:"",
		
		// color: String|dojo/Color?
		//		The color of a solid fill type.
		color:null,
		
	};
	
	g.LinearGradient = {
		// summary:
		//		An object defining the default stylistic properties used for Linear Gradient fills.
		//		Linear gradients are drawn along a virtual line, which results in appearance of a rotated pattern in a given direction/orientation.

		// type: String
		//		Specifies this object is a Linear Gradient, value 'linear'
		type: "linear",

		// x1: Number
		//		The X coordinate of the start of the virtual line along which the gradient is drawn, default value 0.
		x1: 0,

		// y1: Number
		//		The Y coordinate of the start of the virtual line along which the gradient is drawn, default value 0.
		y1: 0,

		// x2: Number
		//		The X coordinate of the end of the virtual line along which the gradient is drawn, default value 100.
		x2: 100,

		// y2: Number
		//		The Y coordinate of the end of the virtual line along which the gradient is drawn, default value 100.
		y2: 100,

		// colors: Array
		//		An array of colors at given offsets (from the start of the line).  The start of the line is
		//		defined at offest 0 with the end of the line at offset 1.
		//		Default value, [{ offset: 0, color: 'black'},{offset: 1, color: 'white'}], is a gradient from black to white.
		colors: []
	};
	
	g.RadialGradient = {
		// summary:
		//		Specifies the properties for RadialGradients using in fills patterns.

		// type: String
		//		Specifies this is a RadialGradient, value 'radial'
		type: "radial",

		// cx: Number
		//		The X coordinate of the center of the radial gradient, default value 0.
		cx: 0,

		// cy: Number
		//		The Y coordinate of the center of the radial gradient, default value 0.
		cy: 0,

		// r: Number
		//		The radius to the end of the radial gradient, default value 100.
		r: 100,

		// colors: Array
		//		An array of colors at given offsets (from the center of the radial gradient).
		//		The center is defined at offest 0 with the outer edge of the gradient at offset 1.
		//		Default value, [{ offset: 0, color: 'black'},{offset: 1, color: 'white'}], is a gradient from black to white.
		colors: []
	};
	
	g.Pattern = {
		// summary:
		//		An object specifying the default properties for a Pattern using in fill operations.

		// type: String
		//		Specifies this object is a Pattern, value 'pattern'.
		type: "pattern",

		// x: Number
		//		The X coordinate of the position of the pattern, default value is 0.
		x: 0,

		// y: Number
		//		The Y coordinate of the position of the pattern, default value is 0.
		y: 0,

		// width: Number
		//		The width of the pattern image, default value is 0.
		width: 0,

		// height: Number
		//		The height of the pattern image, default value is 0.
		height: 0,

		// src: String
		//		A url specifying the image to use for the pattern.
		src: ""
	};

	g.Text = {
		//	summary:
		//		A keyword argument object defining both the text to be rendered in a VectorText shape,
		//		and specifying position, alignment, and fitting.
		//	text: String
		//		The text to be rendered.
		//	x: Number?
		//		The left coordinate for the text's bounding box.
		//	y: Number?
		//		The top coordinate for the text's bounding box.
		//	width: Number?
		//		The width of the text's bounding box.
		//	height: Number?
		//		The height of the text's bounding box.
		//	align: String?
		//		The alignment of the text, as defined in SVG. Can be "start", "end" or "middle".
		//	fitting: Number?
		//		How the text is to be fitted to the bounding box. Can be 0 (no fitting), 1 (fitting based on
		//		passed width of the bounding box and the size of the font), or 2 (fit text to the bounding box,
		//		and ignore any size parameters).
		//	leading: Number?
		//		The leading to be used between lines in the text.
		//	decoration: String?
		//		Any text decoration to be used.
	};

	g.Font = {
		// summary:
		//		An object specifying the properties for a Font used in text operations.
	
		// type: String
		//		Specifies this object is a Font, value 'font'.
		type: "font",
	
		// style: String
		//		The font style, one of 'normal', 'bold', default value 'normal'.
		style: "normal",
	
		// variant: String
		//		The font variant, one of 'normal', ... , default value 'normal'.
		variant: "normal",
	
		// weight: String
		//		The font weight, one of 'normal', ..., default value 'normal'.
		weight: "normal",
	
		// size: String
		//		The font size (including units), default value '10pt'.
		size: "10pt",
	
		// family: String
		//		The font family, one of 'serif', 'sanserif', ..., default value 'serif'.
		family: "serif"
	};

	=====*/

	lang.mixin(g, {
		// summary:
		//		defines constants, prototypes, and utility functions for the core Graphics API

		// default shapes, which are used to fill in missing parameters
		defaultPath: {
			// summary:
			//		Defines the default Path prototype object.

			// type: String
			//		Specifies this object is a Path, default value 'path'.
			type: "path", 

			// path: String
			//		The path commands. See W32C SVG 1.0 specification.
			//		Defaults to empty string value.
			path: ""
		},
		defaultPolyline: {
			// summary:
			//		Defines the default PolyLine prototype.

			// type: String
			//		Specifies this object is a PolyLine, default value 'polyline'.
			type: "polyline",

			// points: Array
			//		An array of point objects [{x:0,y:0},...] defining the default polyline's line segments. Value is an empty array [].
			points: []
		},
		defaultRect: {
			// summary:
			//		Defines the default Rect prototype.

			// type: String
			//		Specifies this default object is a type of Rect. Value is 'rect'
			type: "rect",

			// x: Number
			//		The X coordinate of the default rectangles position, value 0.
			x: 0,

			// y: Number
			//		The Y coordinate of the default rectangle's position, value 0.
			y: 0,

			// width: Number
			//		The width of the default rectangle, value 100.
			width: 100,

			// height: Number
			//		The height of the default rectangle, value 100.
			height: 100,

			// r: Number
			//		The corner radius for the default rectangle, value 0.
			r: 0
		},
		defaultEllipse: {
			// summary:
			//		Defines the default Ellipse prototype.

			// type: String
			//		Specifies that this object is a type of Ellipse, value is 'ellipse'
			type: "ellipse",

			// cx: Number
			//		The X coordinate of the center of the ellipse, default value 0.
			cx: 0,

			// cy: Number
			//		The Y coordinate of the center of the ellipse, default value 0.
			cy: 0,

			// rx: Number
			//		The radius of the ellipse in the X direction, default value 200.
			rx: 200,

			// ry: Number
			//		The radius of the ellipse in the Y direction, default value 200.
			ry: 100
		},
		defaultCircle: {
			// summary:
			//		An object defining the default Circle prototype.

			// type: String
			//		Specifies this object is a circle, value 'circle'
			type: "circle",

			// cx: Number
			//		The X coordinate of the center of the circle, default value 0.
			cx: 0,
			// cy: Number
			//		The Y coordinate of the center of the circle, default value 0.
			cy: 0,

			// r: Number
			//		The radius, default value 100.
			r: 100
		},
		defaultLine: {
			// summary:
			//		An object defining the default Line prototype.

			// type: String
			//		Specifies this is a Line, value 'line'
			type: "line",

			// x1: Number
			//		The X coordinate of the start of the line, default value 0.
			x1: 0,

			// y1: Number
			//		The Y coordinate of the start of the line, default value 0.
			y1: 0,

			// x2: Number
			//		The X coordinate of the end of the line, default value 100.
			x2: 100,

			// y2: Number
			//		The Y coordinate of the end of the line, default value 100.
			y2: 100
		},
		defaultImage: {
			// summary:
			//		Defines the default Image prototype.

			// type: String
			//		Specifies this object is an image, value 'image'.
			type: "image",

			// x: Number
			//		The X coordinate of the image's position, default value 0.
			x: 0,

			// y: Number
			//		The Y coordinate of the image's position, default value 0.
			y: 0,

			// width: Number
			//		The width of the image, default value 0.
			width: 0,

			// height: Number
			//		The height of the image, default value 0.
			height: 0,

			// src: String
			//		The src url of the image, defaults to empty string.
			src: ""
		},
		defaultText: {
			// summary:
			//		Defines the default Text prototype.

			// type: String
			//		Specifies this is a Text shape, value 'text'.
			type: "text",

			// x: Number
			//		The X coordinate of the text position, default value 0.
			x: 0,

			// y: Number
			//		The Y coordinate of the text position, default value 0.
			y: 0,

			// text: String
			//		The text to be displayed, default value empty string.
			text: "",

			// align:	String
			//		The horizontal text alignment, one of 'start', 'end', 'center'. Default value 'start'.
			align: "start",

			// decoration: String
			//		The text decoration , one of 'none', ... . Default value 'none'.
			decoration: "none",

			// rotated: Boolean
			//		Whether the text is rotated, boolean default value false.
			rotated: false,

			// kerning: Boolean
			//		Whether kerning is used on the text, boolean default value true.
			kerning: true
		},
		defaultTextPath: {
			// summary:
			//		Defines the default TextPath prototype.

			// type: String
			//		Specifies this is a TextPath, value 'textpath'.
			type: "textpath",

			// text: String
			//		The text to be displayed, default value empty string.
			text: "",

			// align: String
			//		The horizontal text alignment, one of 'start', 'end', 'center'. Default value 'start'.
			align: "start",

			// decoration: String
			//		The text decoration , one of 'none', ... . Default value 'none'.
			decoration: "none",

			// rotated: Boolean
			//		Whether the text is rotated, boolean default value false.
			rotated: false,

			// kerning: Boolean
			//		Whether kerning is used on the text, boolean default value true.
			kerning: true
		},

		// default stylistic attributes
		defaultStroke: {
			// summary:
			//		A stroke defines stylistic properties that are used when drawing a path.
			//		This object defines the default Stroke prototype.
			// type: String
			//		Specifies this object is a type of Stroke, value 'stroke'.
			type: "stroke",

			// color: String
			//		The color of the stroke, default value 'black'.
			color: "black",

			// style: String
			//		The style of the stroke, one of 'solid', ... . Default value 'solid'.
			style: "solid",

			// width: Number
			//		The width of a stroke, default value 1.
			width: 1,

			// cap: String
			//		The endcap style of the path. One of 'butt', 'round', ... . Default value 'butt'.
			cap: "butt",

			// join: Number
			//		The join style to use when combining path segments. Default value 4.
			join: 4
		},
		defaultLinearGradient: {
			// summary:
			//		An object defining the default stylistic properties used for Linear Gradient fills.
			//		Linear gradients are drawn along a virtual line, which results in appearance of a rotated pattern in a given direction/orientation.

			// type: String
			//		Specifies this object is a Linear Gradient, value 'linear'
			type: "linear",

			// x1: Number
			//		The X coordinate of the start of the virtual line along which the gradient is drawn, default value 0.
			x1: 0,

			// y1: Number
			//		The Y coordinate of the start of the virtual line along which the gradient is drawn, default value 0.
			y1: 0,

			// x2: Number
			//		The X coordinate of the end of the virtual line along which the gradient is drawn, default value 100.
			x2: 100,

			// y2: Number
			//		The Y coordinate of the end of the virtual line along which the gradient is drawn, default value 100.
			y2: 100,

			// colors: Array
			//		An array of colors at given offsets (from the start of the line).  The start of the line is
			//		defined at offest 0 with the end of the line at offset 1.
			//		Default value, [{ offset: 0, color: 'black'},{offset: 1, color: 'white'}], is a gradient from black to white.
			colors: [
				{ offset: 0, color: "black" }, { offset: 1, color: "white" }
			]
		},
		defaultRadialGradient: {
			// summary:
			//		An object specifying the default properties for RadialGradients using in fills patterns.

			// type: String
			//		Specifies this is a RadialGradient, value 'radial'
			type: "radial",

			// cx: Number
			//		The X coordinate of the center of the radial gradient, default value 0.
			cx: 0,

			// cy: Number
			//		The Y coordinate of the center of the radial gradient, default value 0.
			cy: 0,

			// r: Number
			//		The radius to the end of the radial gradient, default value 100.
			r: 100,

			// colors: Array
			//		An array of colors at given offsets (from the center of the radial gradient).
			//		The center is defined at offest 0 with the outer edge of the gradient at offset 1.
			//		Default value, [{ offset: 0, color: 'black'},{offset: 1, color: 'white'}], is a gradient from black to white.
			colors: [
				{ offset: 0, color: "black" }, { offset: 1, color: "white" }
			]
		},
		defaultPattern: {
			// summary:
			//		An object specifying the default properties for a Pattern using in fill operations.

			// type: String
			//		Specifies this object is a Pattern, value 'pattern'.
			type: "pattern",

			// x: Number
			//		The X coordinate of the position of the pattern, default value is 0.
			x: 0,

			// y: Number
			//		The Y coordinate of the position of the pattern, default value is 0.
			y: 0,

			// width: Number
			//		The width of the pattern image, default value is 0.
			width: 0,

			// height: Number
			//		The height of the pattern image, default value is 0.
			height: 0,

			// src: String
			//		A url specifying the image to use for the pattern.
			src: ""
		},
		defaultFont: {
			// summary:
			//		An object specifying the default properties for a Font used in text operations.

			// type: String
			//		Specifies this object is a Font, value 'font'.
			type: "font",

			// style: String
			//		The font style, one of 'normal', 'bold', default value 'normal'.
			style: "normal",

			// variant: String
			//		The font variant, one of 'normal', ... , default value 'normal'.
			variant: "normal",

			// weight: String
			//		The font weight, one of 'normal', ..., default value 'normal'.
			weight: "normal",

			// size: String
			//		The font size (including units), default value '10pt'.
			size: "10pt",

			// family: String
			//		The font family, one of 'serif', 'sanserif', ..., default value 'serif'.
			family: "serif"
		},

		getDefault: (function(){
			// summary:
			//		Returns a function used to access default memoized prototype objects (see them defined above).
			var typeCtorCache = {};
			// a memoized delegate()
			return function(/*String*/ type){
				var t = typeCtorCache[type];
				if(t){
					return new t();
				}
				t = typeCtorCache[type] = new Function();
				t.prototype = g[ "default" + type ];
				return new t();
			}
		})(),

		normalizeColor: function(/*dojo/Color|Array|string|Object*/ color){
			// summary:
			//		converts any legal color representation to normalized
			//		dojo/Color object
			// color:
			//		A color representation.
			return (color instanceof Color) ? color : new Color(color); // dojo/Color
		},
		normalizeParameters: function(existed, update){
			// summary:
			//		updates an existing object with properties from an 'update'
			//		object
			// existed: Object
			//		the target object to be updated
			// update: Object
			//		the 'update' object, whose properties will be used to update
			//		the existed object
			var x;
			if(update){
				var empty = {};
				for(x in existed){
					if(x in update && !(x in empty)){
						existed[x] = update[x];
					}
				}
			}
			return existed;	// Object
		},
		makeParameters: function(defaults, update){
			// summary:
			//		copies the original object, and all copied properties from the
			//		'update' object
			// defaults: Object
			//		the object to be cloned before updating
			// update: Object
			//		the object, which properties are to be cloned during updating
			// returns: Object
			//      new object with new and default properties
			var i = null;
			if(!update){
				// return dojo.clone(defaults);
				return lang.delegate(defaults);
			}
			var result = {};
			for(i in defaults){
				if(!(i in result)){
					result[i] = lang.clone((i in update) ? update[i] : defaults[i]);
				}
			}
			return result; // Object
		},
		formatNumber: function(x, addSpace){
			// summary:
			//		converts a number to a string using a fixed notation
			// x: Number
			//		number to be converted
			// addSpace: Boolean
			//		whether to add a space before a positive number
			// returns: String
			//      the formatted value
			var val = x.toString();
			if(val.indexOf("e") >= 0){
				val = x.toFixed(4);
			}else{
				var point = val.indexOf(".");
				if(point >= 0 && val.length - point > 5){
					val = x.toFixed(4);
				}
			}
			if(x < 0){
				return val; // String
			}
			return addSpace ? " " + val : val; // String
		},
		// font operations
		makeFontString: function(font){
			// summary:
			//		converts a font object to a CSS font string
			// font: Object
			//		font object (see dojox/gfx.defaultFont)
			return font.style + " " + font.variant + " " + font.weight + " " + font.size + " " + font.family; // Object
		},
		splitFontString: function(str){
			// summary:
			//		converts a CSS font string to a font object
			// description:
			//		Converts a CSS font string to a gfx font object. The CSS font
			//		string components should follow the W3C specified order
			//		(see http://www.w3.org/TR/CSS2/fonts.html#font-shorthand):
			//		style, variant, weight, size, optional line height (will be
			//		ignored), and family. Note that the Font.size attribute is limited to numeric CSS length.
			// str: String
			//		a CSS font string.
			// returns: Object
			//      object in dojox/gfx.defaultFont format
			var font = g.getDefault("Font");
			var t = str.split(/\s+/);
			do{
				if(t.length < 5){ break; }
				font.style   = t[0];
				font.variant = t[1];
				font.weight  = t[2];
				var i = t[3].indexOf("/");
				font.size = i < 0 ? t[3] : t[3].substring(0, i);
				var j = 4;
				if(i < 0){
					if(t[4] == "/"){
						j = 6;
					}else if(t[4].charAt(0) == "/"){
						j = 5;
					}
				}
				if(j < t.length){
					font.family = t.slice(j).join(" ");
				}
			}while(false);
			return font;	// Object
		},
		// length operations

		// cm_in_pt: Number
		//		points per centimeter (constant)
		cm_in_pt: 72 / 2.54,

		// mm_in_pt: Number
		//		points per millimeter (constant)
		mm_in_pt: 7.2 / 2.54,

		px_in_pt: function(){
			// summary:
			//		returns the current number of pixels per point.
			return g._base._getCachedFontMeasurements()["12pt"] / 12;	// Number
		},

		pt2px: function(len){
			// summary:
			//		converts points to pixels
			// len: Number
			//		a value in points
			return len * g.px_in_pt();	// Number
		},

		px2pt: function(len){
			// summary:
			//		converts pixels to points
			// len: Number
			//		a value in pixels
			return len / g.px_in_pt();	// Number
		},

		normalizedLength: function(len) {
			// summary:
			//		converts any length value to pixels
			// len: String
			//		a length, e.g., '12pc'
			// returns: Number
			//      pixels
			if(len.length === 0){ return 0; }
			if(len.length > 2){
				var px_in_pt = g.px_in_pt();
				var val = parseFloat(len);
				switch(len.slice(-2)){
					case "px": return val;
					case "pt": return val * px_in_pt;
					case "in": return val * 72 * px_in_pt;
					case "pc": return val * 12 * px_in_pt;
					case "mm": return val * g.mm_in_pt * px_in_pt;
					case "cm": return val * g.cm_in_pt * px_in_pt;
				}
			}
			return parseFloat(len);	// Number
		},

		// pathVmlRegExp: RegExp
		//		a constant regular expression used to split a SVG/VML path into primitive components
		// tags:
		//		private
		pathVmlRegExp: /([A-Za-z]+)|(\d+(\.\d+)?)|(\.\d+)|(-\d+(\.\d+)?)|(-\.\d+)/g,

		// pathVmlRegExp: RegExp
		//		a constant regular expression used to split a SVG/VML path into primitive components
		// tags:
		//		private
		pathSvgRegExp: /([A-DF-Za-df-z])|([-+]?\d*[.]?\d+(?:[eE][-+]?\d+)?)/g,

		equalSources: function(a, b){
			// summary:
			//		compares event sources, returns true if they are equal
			// a: Object
			//		first event source
			// b: Object
			//		event source to compare against a
			// returns: Boolean
			//      true, if objects are truthy and the same
			return a && b && a === b;
		},

		switchTo: function(/*String|Object*/ renderer){
			// summary:
			//		switch the graphics implementation to the specified renderer.
			// renderer:
			//		Either the string name of a renderer (eg. 'canvas', 'svg, ...) or the renderer
			//		object to switch to.
			var ns = typeof renderer == "string" ? g[renderer] : renderer;
			if(ns){
				// If more options are added, update the docblock at the end of shape.js!
				arr.forEach(["Group", "Rect", "Ellipse", "Circle", "Line",
						"Polyline", "Image", "Text", "Path", "TextPath",
						"Surface", "createSurface", "fixTarget"], function(name){
					g[name] = ns[name];
				});
				if(typeof renderer == "string"){
					g.renderer = renderer;
				}else{
					arr.some(["svg","vml","canvas","canvasWithEvents","silverlight"], function(r){
						return (g.renderer = g[r] && g[r].Surface === g.Surface ? r : null);
					});
				}
			}
		}
	});
	
	/*=====
		g.createSurface = function(parentNode, width, height){
			// summary:
			//		creates a surface
			// parentNode: Node
			//		a parent node
			// width: String|Number
			//		width of surface, e.g., "100px" or 100
			// height: String|Number
			//		height of surface, e.g., "100px" or 100
			// returns: dojox/gfx.Surface
			//     newly created surface
		};
		g.fixTarget = function(){
			// tags:
			//		private
		};
	=====*/
	
	return g; // defaults object api
});

},
'money/views/summary':function(){
/*
*   Transactions journal module
* 	rebuilt to work in async mode
* 
*   v. 0.9
* 	21/09/2014
*   
* 	Mikhael Milikhin
* 
*/

define(["dojo/_base/declare", "dojo/_base/array","money/dialog","dojo/date",
	"dojo/_base/fx","dojo/on","dojox/gesture/swipe","dojo/_base/lang","dijit/registry", 
	"dojo/dom", "dojo/date/locale", "dojo/query", "dojo/dom-construct", "dojo/dom-style", "dojo/dom-class","dojo/dom-attr",
	"dojox/mobile/ListItem", "dojox/mobile/EdgeToEdgeCategory","dojox/mobile/EdgeToEdgeStoreList",'dojo/text!money/views/summary.html'
    ],
    function(declare, arrayUtil,Dialog, dojodate, fx,on,swipe, lang, registry, dom, locale, query, domConstruct, domStyle, domClass, domAttr, ListItem, ListCategory){
    /*
     * Class used for transaction-list's single records
     */
    var TransactionListItem = declare(ListItem, {
        target: "list",
        onClick: function() {
			window.AppData.currentDate = this.id.substr( 3, this.id.length-1 )
		},
        clickable: true,
        postMixInProperties: function() {
            this.inherited( arguments );
            this.transitionOptions = {
                params: {
                    "id" : this.id.substr( 3, this.id.length-1 )
                }
            }            
        }
    });
	
	
    return {
		
		/*
		 * array of monthes <yyyy-MM> presented on view
		 * used to render month headers in right order
		*/
		_monthsOnPage:[],
				
		//-----------PRIVATE----------------//
		
		/*
		* Return array with transactions summary for each account
		* ['yyyy-MM-dd' => [{account: <account id>, amount: <amount>},...]]
		* */
		_parseTransaction: function(s, trans){
			var summary = lang.clone(s)
			
			var dateString = ( isValidDate( trans.date ) ) ? getDateString( trans.date, locale ) : trans.date
			
			if( parseFloat( trans.amount ) != NaN){
				if(summary[dateString]){
					var flag = false
					arrayUtil.forEach( summary[dateString], function( dateSum ){
						if( dateSum.account == trans.account ){
							dateSum.amount = parseFloat( dateSum.amount ) + parseFloat( trans.amountHome )
							flag = true
						}
					})					
					if(!flag)
						summary[ dateString ][ summary[dateString].length ] = {
							account: trans.account, amount: parseFloat(trans.amountHome)
						};
				}else{
					summary[ dateString ] =	[{
						account: trans.account, amount: parseFloat(trans.amountHome)
					}];
				}
				summary[dateString].total = summary[dateString].total ?
					( summary[dateString].total + parseFloat(trans.amountHome) ) : parseFloat(trans.amountHome);
			}
			return summary;
		},
		
		/*
		 *	push <yyyy-MM> into _monthsOnPage if this month hasn't been already added 
		 */
		_pushMonth: function(id){
			var monthPresent = false
			for(var i in this._monthsOnPage)
				if(this._monthsOnPage[i] == id){
					monthPresent = true; break;
				}
			if(!monthPresent)
				this._monthsOnPage.push(id)
		},
		
		/*
		 * select tab that corresponds to current transactions type
		 */ 
		_renderHeader: function(){
			var t = ['e' /* expence */, 'i' /* income */, 't' /* transfer */]
			for (var i in t)
				registry.byId( 'sum-is-' + t[i] ).set( 'selected', false )
			registry.byId( 'sum-is-' + window.AppData.currentType ).set( 'selected', true )
		},
		
		/*
		 * Apply(!) months titles as ul's children
		 */
		_renderMonth: function(){
			//destroy all added months...
			var months = query('#summary-list .mblEdgeToEdgeCategory');
				for(var i=0; i< months.length; i++)
					registry.byId(months[i].id).destroy();
			
			var months = [
				'jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'				
			]
			
			//...than add all months
			for(var i in this._monthsOnPage){
				//console.log(this._monthsOnPage[i],query("."+this._monthsOnPage[i])[0])
				var date = locale.parse(this._monthsOnPage[i], {"selector":"date", "datePattern":'yyyy-MM'})
				var h = new ListCategory({
					label: this.capitalize( 
						this.nls[ months [ Number( locale.format( date, { selector:"date", datePattern: 'MM'}) ) -1 ] ]+ 
						locale.format( date, { selector:"date", datePattern: ' yyyy'}) 
					)
				},domConstruct.create( 'h2', {}, query("."+this._monthsOnPage[i])[0],'before'))
				
			}
		},
		
		/*
		 * Returns single day record
		 * 	@d - [{account: <account id>, amount: <amount>},...]
		 * 	@month - what date do the transactions refers to
		 */
		_renderRecord: function(d, month){				
			var data = lang.clone( d ),
				date = locale.parse( month, { "selector": "date", "datePattern": window.AppData.widgetDateFormat }),
				cl	 = locale.format( date, { "selector": "date", datePattern: "yyyy-MM" }),
				content = '', 	//single record content
				_total = 0, 	//day transactions sum
				i = 0;
			data.id = "ts-"+getDateString(date, locale)
			
			//we now have transactions for THE month
			this._pushMonth(cl)			
			
			arrayUtil.forEach(data, function(data_i){
				if(data_i.amount != undefined) {
					i++;
					_total += parseFloat(data_i.amount)
					//get transaction account info
					var a = window.AppData.accountStore.query({ 
						id: data_i.account 
					})[0]
					
					data_i.account = a ? a.label : ''
					data_i.amount = getMoney( 
						data_i.amount, 
						//a.maincur /*
						window.AppData.currency
						//*/
					)
					
					content += this.substitute(this._accountTemplate, data_i)
				}
			},this)
			
			data.dateString = "<div class='date-header'>" + 
					data.dateString + 
				"</div>" + 
				"<div class='summary " + 
					(( i > 1 ) ? "sub-sum":"") +
				"'>"+
					content + 
					((i > 1 && window.AppData.currentType!="t") ? 
						('<div class=\"li-total\"><span>' + 
							getMoney(_total, window.AppData.currency) +
						'</span></div> </div>') : 
					'</div>');
					
			data['class'] = cl
			return data
		},
		
		//render timespan title & sum				
		_displayTotal: function(sumNodeId, titleNodeId) {
			//calculate timespan totals
			var self = this,
				sumNodeId = sumNodeId || 'summary-sum-total',
				titleNodeId = titleNodeId || 'summary-sum-ts',
				total = 0, alltrans = window.AppData.store.query( self.getQuery() ),
				daysInMonth = dojodate.getDaysInMonth(new Date),
				months = [
				'jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'				
				],
				tsHeader = this.nls.allTheTime;
			
			alltrans.then(function(data){
				total = 0;
				var items = data.items
				for(var i = 0; i < items.length; i++ )
					total += items[i].amountHome;
				domAttr.set(sumNodeId, 'innerHTML', getMoney( total, window.AppData.currency ))
			
			})	
			
			
			if (window.AppData.timespan == 'last31')
				tsHeader = ( '<span style="text-transform:capitalize">' +
					locale.format( dojodate.add( new Date, "day", -daysInMonth),
						{ selector:"date", datePattern: "d MMM" }) + ' - '  +
					locale.format(new Date, {selector:"date", datePattern: "d MMM"}) +"</span>" );
			else if ( window.AppData.timespan == 'customTimespan' ){
				var from = new Date;
				from = new Date( from.getFullYear(), from.getMonth(), 1);
					
				tsHeader = ('<span style="text-transform:capitalize">' + 
					this.nls[ months [ Number( locale.format( dojodate.add(from, 'day', 0),
						{ selector:"date", datePattern: 'MM'}) ) -1 ] ] +  
					locale.format( dojodate.add(from, 'day', 0),
						{ selector:"date", datePattern: ' yyyy'}) + "</span>" );
			}
			else if (window.AppData.timespan == 'lastMonth'){
				var from = getDate( window.AppData.timespanMonth, locale )
				var daysInMonth = dojodate.getDaysInMonth(from) 
				var to = dojodate.add( from, "day", daysInMonth -1 );	
				tsHeader =  ( '<span style="text-transform:capitalize">' +
					locale.format(dojodate.add(from,"day", 0),
						{selector:"date", datePattern: "d MMM"}) + ' - '  +
					locale.format(dojodate.add(to, 'day' , 0) ,
						{selector:"date", datePattern: "d MMM"}) + "</span>" )
			}
			
			domAttr.set(titleNodeId,'innerHTML',tsHeader)					
		},
		
		
		_displayFirstTimeMessage: function() {
			var self = this
			domStyle.set('welcome-note',"display",self.daily.getChildren().length ? "none" : "")
			domClass[self.daily.getChildren().length ? "remove" : "add"](self.daily.domNode, 'empty')
		},

		/*
		 *	if home cuurency is not setup - select it.
		 */ 
		_initializeHomeCurrency: function() {
			var self = this;
			if(!window.AppData.currency){
				if(!this.params.currency){
					
					this.dlg = window.AppData.dialogWindow;
					this.dlg.show(false, this.nls.currencySelectNote, this.nls.currencySelectTitle, this.nls.currencySelectButton, function(){
						self.dlg.hide();
						window.dFinance.transitionToView( self.domNode, {
							target	: 'currencypicker',
							transitionDir	: 1,
							params : {backTo : 'summary'}
						})
					})
				}else{
					window.AppData.currency = this.params.currency;
					localStorage.setItem('currency', this.params.currency)
				}
			}
		},
		
		displayAll: function(){
			var self = this
			//render month names and set up type-selector UI
			self._renderHeader()
			self._renderMonth()
			//display transactions total
			self._displayTotal();
			//display welcome notes if no transactions this timespan
			self._displayFirstTimeMessage()
						
		},
		//---------------PUBLIC--------------------------//
		/*
		 * Called when view gets focus
		 */
		beforeActivate: function(){
			var self = this
						
			var callback = function(){
				
				//if this is the first run of the app, set up main currency
				self._initializeHomeCurrency();
				
				//set up type of transactions to be displayed
				
				if(this.params.type)
					window.AppData.currentType = this.params.type
				
				if(this.params.refresh) {
					window.dFinance.children.dFinance_summary.summary = []
					self.daily.refresh().then( function(){
						self.displayAll();
						//Scroll to top when view is refreshed
						self.scrollView.scrollTo(0, 0);
					} );
					
				}
				
				
				if(window.AppData.defaultHash.indexOf('backup') > -1 && window.AppData.currency){
					window.dFinance.transitionToView( self.domNode, {
						"target": 'backup' , "transitionDir": 1
					});					
				}
				window.AppData.defaultHash = '';
				
			};
			
			//do not wait for callback before showing view.
			setTimeout(function(){
				callback.call(self)
			},0)
		},
		
		getQuery: function( date ){
			return new this.queryIdb( date );
		},
		/*
		*	filter params for listitem store
		*/        
        queryIdb: function(date){
			var from;
			
			this.date = date || undefined;
			this.from = function(){
				if( this.date )
					return this.date;
					
				if( window.AppData.timespan == 'lastMonth') {
					console.log( window.AppData.timespanMonth )
					from = getDate( window.AppData.timespanMonth, locale )
					return from
				}
				if( window.AppData.timespan == 'customTimespan') {
					from = new Date;
					from = new Date( from.getFullYear(), from.getMonth(), 1);
					//console.log(from)
					var daysInMonth = dojodate.getDaysInMonth(from) 
					//window.AppData.dateFrom		 = dojodate.add( from, "day", -1);
					return from
					//window.AppData.dateTo 		 = dojodate.add( from, "day", daysInMonth -1 );				
				}
				if( window.AppData.timespan == 'noneTimespan' && 
				!window.AppData.useDateImportant)
					return undefined;
				return window.AppData.dateFrom ? 
					window.AppData.dateFrom : (
						window.AppData.dateFrom = 
							dojodate.add(new Date,"day", -dojodate.getDaysInMonth(new Date) )
					)
			}
			this.to = function(){
				if( this.date )
					return undefined;
				if( window.AppData.timespan == 'lastMonth') {
					console.log( window.AppData.timespanMonth )
					from = getDate( window.AppData.timespanMonth, locale )
					var daysInMonth = dojodate.getDaysInMonth(from) 
					return dojodate.add( from, "day", daysInMonth -1 );	
				}
				if( window.AppData.timespan == 'customTimespan') {
					from = new Date;
					from = new Date( from.getFullYear(), from.getMonth(), 1);
					console.log(from)
					var daysInMonth = dojodate.getDaysInMonth(from) 
					return dojodate.add( from, "day", daysInMonth -1 );				
				}	
				if( window.AppData.timespan == 'noneTimespan' && 
				!window.AppData.useDateImportant)
					return undefined;
				return window.AppData.dateTo ? 
					window.AppData.dateTo : (
						window.AppData.dateTo = new Date//dojodate.add(new Date,"day", 1)
					)
			}
			this.type = function(){ 
				//if( this.date )
				//	return undefined;
				return window.AppData.currentType
			}
		},
		
        /*
         * class used to create list item objects
         */ 
        listItem: TransactionListItem,
        
        _enableMenuOnSwipe: function() {
			var self = this;
			if(window.AppData.isInitiallySmall)
				on(this.domNode, swipe.end, function(e){
					if(Math.abs(e.dy) < 30){
						if(e.dx>50){
							window.dFinance.transitionToView( self.domNode, {
								"target": "navigation" , "transitionDir": -1
							})
						}
					}
				});
		},
        
        init: function(){
			window.dFinance.children.dFinance_summary.summary = []

			if(!this._isInheritedFromBaseView)
				new window.AppData.BaseViewClass( this );			
			
			//we have a single handler for all CRUD events
			registry.byId('summary-list').onUpdate = this.onListUpdate;
			registry.byId('summary-list').onDelete = this.onListUpdate;
			registry.byId('summary-list').onAdd = this.onListUpdate;
			
			domStyle.set(this.scrollView.containerNode,'paddingBottom','20px')
			
			this._onInit();			
			
			/*if( window.AppData.store.createPromise && 
			!window.AppData.store.createPromise.isResolved() ) {
				var self = this;			
				window.AppData.store.createPromise.then( function(){ 
					self.beforeActivate() 
				});
			}*/
				
			this._enableMenuOnSwipe();
		},
		
        _onInit: function(){    
			if(!window.AppData.isInitiallySmall){
				domClass.add(this.menuButton.domNode,'hideOnMedium hideOnLarge')
			}
            
            var self = this
            on(this.daily, 'complete', function(){
				self.displayAll();
			})
			
        },
        
        summary: [],
        
        /*
         * rebuild summary for the whole day corresponding to The transaction Item
         * @item - modified store record
         */ 
        onListUpdate: function( item, oldDate ){
			//save dateFrom & dateTo to restore after operation is complete
			console.log('LIST UPDATE CALLBACK')
			var dontCalculate = dontCalculate || false;
			window.AppData.useDateImportant = true;
			var self = this
			//all items, that needed to be recalculated
			
			var updateCallback = function( date ){
				var q = window.dFinance.children.dFinance_summary.getQuery( date )
				self.store.query( q ).then (
					function( data ) {
						window.dFinance.children.dFinance_summary.summary = []
						var modifiedItems = data.items
						console.log('MI',modifiedItems.length)
						//if there are no any transactions that day, just remove entry from summary
						var dateId = locale.format(date, {"selector":"date", "datePattern":'yyyy-MM-dd'});
						if(modifiedItems.length == 0 && registry.byId( 'ts-' +  dateId)){
							registry.byId( 'ts-' +  dateId).destroyRecursive();	
							return;
						}
						
						
						//else place new entry into correspondent position
						var allExistingItems = registry.byId('summary-list').getChildren();
						var inserted = false
						for(var i=0; i<allExistingItems.length; i++) {
							var _singleItem = allExistingItems[i], _siDate = _singleItem.id.substr(3, _singleItem.id.length-1)
							if(_siDate.length == 10) {
								var _siDateAsDate =  locale.parse(_siDate, {"selector":"date", "datePattern":'yyyy-MM-dd'})
								if(dojodate.difference(_siDateAsDate, item.date, 'day') >= 0){
									for(var k = 0; k < modifiedItems.length; k++) {
										console.log('CREATING LI for ', modifiedItems[k], dontCalculate)
										var li = self.createListItem( modifiedItems[k] );
										self.addChild( li,  i);
									}
									inserted = true
									break;
								}
							}
						}
						if(!inserted)
							for(var k = 0; k < modifiedItems.length; k++) {
								var li = self.createListItem( modifiedItems[k] );
								self.addChild( li );
							}				
						
						window.dFinance.children.dFinance_summary.displayAll();
						window.AppData.useDateImportant = false;	
						
					}
				);
			}
			updateCallback ( item.date );
			//console.log(getDate ( oldDate locale ) !=  item.date)
			if( oldDate && oldDate != locale.format( item.date, {"selector":"date", "datePattern":'yyyy-MM-dd'}) ){
				updateCallback (
					//window.dFinance.children.dFinance_summary.getQuery( getDate ( oldDate, locale ), oldDate )
					getDate ( oldDate, locale )
				);
			}
			
			
			
		},
		
		createListItem: function(/*Object*/item){
			// summary:
			//		Creates a list item widget.
			
			
			var itemClone = lang.clone(item),
				self = window.dFinance.children.dFinance_summary,
				id = getDateString(itemClone.date, locale),
				did = "ts-" + id;

			if(!this._isInheritedFromBaseView)
				new window.AppData.BaseViewClass( self );			
			
			if(item.type == "t"){
				itemClone.amount 		*= -1
				itemClone.amountHome 	*= -1
				itemClone.sumTo 		*= 1
			}
			//console.log('!SUMMARY', self.summary)
			self.summary = self._parseTransaction(self.summary, itemClone)
			self.summary[id].id = id
			self.summary[id].dateString = getDateStringHr(itemClone.date, locale) //get human readable date string
			
			if(item.type == "t" && item.accountTo) {
				var trans2 = lang.clone(itemClone); 
					trans2.amount 		= trans2.sumTo; 
					trans2.amountHome 	= -trans2.amountHome; 
					trans2.account 		= trans2.accountTo
				self.summary = self._parseTransaction(self.summary, trans2)
			}
			
			//replace existing list entry with new one
			if(!registry.byId(did)){			
				return new this.itemRenderer(
					this._createItemProperties( self._renderRecord(self.summary[id],id) )
				);
			}else {
				registry.byId(did).destroyRecursive();
				return new this.itemRenderer(
					this._createItemProperties( self._renderRecord(self.summary[id],id) )
				);
			}
			
			
		}
    };
});

},
'money/views/tags':function(){
define([
	"dojo/_base/declare","dojox/mobile/TextBox","dojo/_base/array", "dojox/mobile/ListItem",
	"dijit/registry","dojo/dom-attr","dojo/json", "dojo/dom-style",
	"dojox/mobile/Button", 'money/dialog','dojo/text!money/views/tags.html'
 ],
    function(declare,TextBox,arrayUtil, ListItem,   registry, domAttr,json, domStyle,Button,Dialog){
    
	return window.AppData.objTags = {
		beforeActivate: function(contact){
			//window.AppData.numberPicker.mode = "a"
        },
        
        init: function(){
			var self = this
			this.dlg = window.AppData.dialogWindow ? window.AppData.dialogWindow : (window.AppData.dialogWindow = new Dialog);
				
			this.addBtn.onClick = function(){
				self.add();
			}
			var tags = window.AppData.store.getTags();
			arrayUtil.forEach(tags, function(tag){
				this.addExisting(tag)
			},this)
			
			this.displayEmptyMsgs(tags.length)
		},
		//l - number of existing accounts
		displayEmptyMsgs: function(l){
			domStyle.set('no-tags-tags','display', !l? 'block':'none')
			domStyle.set('tags-list','display', l? 'block':'none')
		},        
		add: function(){
			console.log('add')
			var item = {label:'', et: new Date().getTime(), freq: 0}
			var existing = window.AppData.tagsStore.get(
				window.AppData.tagsStore.add(item)
			)
			this.addExisting(existing)
			this.save()
		},
		addExisting: function(tag){
			var self = this
			delTagByMinus = function(e, _this){
				e.stopPropagation();
				
				self.dlg.show(false, "", self.nls.deleteTag + '?', self.nls.yes, function(){
					var id = domAttr.get(_this, 'data-finance-id')
					window.AppData.store.query(function(item){
						var found = false
						for(var i = 0; i< item.tags.length; i++){
							if(item.tags[i] == id){
								remove(item.tags, i)
								window.AppData.store.putItem(item)
							}
						}
						return false
					})
					window.AppData.store.removeTag(id)
					window.AppData.store._setTags(window.AppData.store.getTags())
					
					self.displayEmptyMsgs(window.AppData.store.getTags().length)
					//destroy account list item
					registry.byId('l'+id).destroyRecursive();
					var deleted = localStorage.getItem('deletedTags') ? json.parse(localStorage.getItem('deletedTags')) : new Array();
						deleted.push(id);
					localStorage.setItem('deletedTags',json.stringify(deleted));
				}, self.nls.no)
				//get account id from it's button's tag
				
				//remove all transactions at this account
				
				//remove account itself
				
				
			}
			this.tagList.addChild(new ListItem({
				label: '<div ontouchend="window.AppData.touched = true; delTagByMinus(event, this);"'+
				'onclick="if(!window.AppData.touched) delTagByMinus(event, this);" style="" class="domButton mblDomButtonBlueCircleMinus" data-finance-id="'+tag.id+'"><div><div><div></div></div></div></div>'+
					'<input type="text" id="a-'+ tag.id + '" value="' + tag.label +'"/>',
				//rightText: '<button id = "ab-'+account.id+'"></button>',				
				rightText : tag.freq ? tag.freq : 0,
				id: 'l'+tag.id
			}))
			this.displayEmptyMsgs(1)
			var tb = new TextBox({
				onChange: function(value){
					window.AppData.objTags.tag = tag
					window.AppData.objTags.tag.label = value
					self.save()
				},
				placeHolder: "Category title"
			},"a-"+tag.id)
			
		},
		save: function(){
			var tag = window.AppData.objTags.tag;
			console.log(tag)
			if(tag){
				tag.et = new Date().getTime()
				window.AppData.tagsStore.put(tag)
				window.AppData.store._setTags(window.AppData.store.getTags())
			}
		}
    };
});

},
'dojox/charting/Theme':function(){
define(["dojo/_base/lang", "dojo/_base/declare", "dojo/_base/Color", "./SimpleTheme",
	    "dojox/color/_base", "dojox/color/Palette", "dojox/gfx/gradutils"],
	function(lang, declare, Color, SimpleTheme, colorX, Palette){
	
	var Theme = declare("dojox.charting.Theme", SimpleTheme, {
	// summary:
	//		A Theme is a pre-defined object, primarily JSON-based, that makes up the definitions to
	//		style a chart. It extends SimpleTheme with additional features like color definition by
	//		palettes and gradients definition.
	});

	/*=====
	var __DefineColorArgs = {
		// summary:
		//		The arguments object that can be passed to define colors for a theme.
		// num: Number?
		//		The number of colors to generate.  Defaults to 5.
		// colors: String[]|dojo/_base/Color[]?
		//		A pre-defined set of colors; this is passed through to the Theme directly.
		// hue: Number?
		//		A hue to base the generated colors from (a number from 0 - 359).
		// saturation: Number?
		//		If a hue is passed, this is used for the saturation value (0 - 100).
		// low: Number?
		//		An optional value to determine the lowest value used to generate a color (HSV model)
		// high: Number?
		//		An optional value to determine the highest value used to generate a color (HSV model)
		// base: String|dojo/_base/Color?
		//		A base color to use if we are defining colors using dojox.color.Palette
		// generator: String?
		//		The generator function name from dojox/color/Palette.
	};
	=====*/
	lang.mixin(Theme, {

		defineColors: function(kwArgs){
			// summary:
			//		Generate a set of colors for the theme based on keyword
			//		arguments.
			// kwArgs: __DefineColorArgs
			//		The arguments object used to define colors.
			// returns: dojo/_base/Color[]
			//		An array of colors for use in a theme.
			//
			// example:
			//	|	var colors = Theme.defineColors({
			//	|		base: "#369",
			//	|		generator: "compound"
			//	|	});
			//
			// example:
			//	|	var colors = Theme.defineColors({
			//	|		hue: 60,
			//	|		saturation: 90,
			//	|		low: 30,
			//	|		high: 80
			//	|	});
			kwArgs = kwArgs || {};
			var l, c = [], n = kwArgs.num || 5;	// the number of colors to generate
			if(kwArgs.colors){
				// we have an array of colors predefined, so fix for the number of series.
				l = kwArgs.colors.length;
				for(var i = 0; i < n; i++){
					c.push(kwArgs.colors[i % l]);
				}
				return c;	//	dojo.Color[]
			}
			if(kwArgs.hue){
				// single hue, generate a set based on brightness
				var s = kwArgs.saturation || 100,	// saturation
					st = kwArgs.low || 30,
					end = kwArgs.high || 90;
				// we'd like it to be a little on the darker side.
				l = (end + st) / 2;
				// alternately, use "shades"
				return Palette.generate(
					colorX.fromHsv(kwArgs.hue, s, l), "monochromatic"
				).colors;
			}
			if(kwArgs.generator){
				//	pass a base color and the name of a generator
				return colorX.Palette.generate(kwArgs.base, kwArgs.generator).colors;
			}
			return c;	//	dojo.Color[]
		},

		generateGradient: function(fillPattern, colorFrom, colorTo){
			var fill = lang.delegate(fillPattern);
			fill.colors = [
				{offset: 0, color: colorFrom},
				{offset: 1, color: colorTo}
			];
			return fill;
		},

		generateHslColor: function(color, luminance){
			color = new Color(color);
			var hsl    = color.toHsl(),
				result = colorX.fromHsl(hsl.h, hsl.s, luminance);
			result.a = color.a;	// add missing opacity
			return result;
		},

		generateHslGradient: function(color, fillPattern, lumFrom, lumTo){
			color = new Color(color);
			var hsl       = color.toHsl(),
				colorFrom = colorX.fromHsl(hsl.h, hsl.s, lumFrom),
				colorTo   = colorX.fromHsl(hsl.h, hsl.s, lumTo);
			colorFrom.a = colorTo.a = color.a;	// add missing opacity
			return Theme.generateGradient(fillPattern, colorFrom, colorTo);	// Object
		}
	});

	// for compatibility
	Theme.defaultMarkers = SimpleTheme.defaultMarkers;
	Theme.defaultColors = SimpleTheme.defaultColors;
	Theme.defaultTheme = SimpleTheme.defaultTheme;

	return Theme;
});

},
'dojox/mobile/LongListMixin':function(){
define([ "dojo/_base/array",
         "dojo/_base/lang",
         "dojo/_base/declare",
         "dojo/sniff",
         "dojo/dom-construct",
         "dojo/dom-geometry",
         "dijit/registry",
         "./common",
         "./viewRegistry" ],
		function(array, lang, declare, has, domConstruct, domGeometry, registry, dm, viewRegistry){

	// module:
	//		dojox/mobile/LongListMixin
	// summary:
	//		A mixin that enhances performance of long lists contained in scrollable views.

	return declare("dojox.mobile.LongListMixin", null, {
		// summary:
		//		This mixin enhances performance of very long lists contained in scrollable views.
		// description:
		//		LongListMixin enhances a list contained in a ScrollableView
		//		so that only a subset of the list items are actually contained in the DOM
		//		at any given time. 
		//		The parent must be a ScrollableView or another scrollable component
		//		that inherits from the dojox.mobile.scrollable mixin, otherwise the mixin has
		//		no effect. Also, editable lists are not yet supported, so lazy scrolling is
		//		disabled if the list's 'editable' attribute is true.
		//		If this mixin is used, list items must be added, removed or reordered exclusively
		//		using the addChild and removeChild methods of the list. If the DOM is modified
		//		directly (for example using list.containerNode.appendChild(...)), the list
		//		will not behave correctly.
		
		// pageSize: int
		//		Items are loaded in the DOM by chunks of this size.
		pageSize: 20,
		
		// maxPages: int
		//		When this limit is reached, previous pages will be unloaded.
		maxPages: 5,
		
		// unloadPages: int
		//		Number of pages that will be unloaded when maxPages is reached.
		unloadPages: 1,
		
		startup : function(){
			if(this._started){ return; }
			
			this.inherited(arguments);

			if(!this.editable){

				this._sv = viewRegistry.getEnclosingScrollable(this.domNode);

				if(this._sv){

					// Get all children already added (e.g. through markup) and initialize _items
					this._items = this.getChildren();

					// remove all existing items from the old container node
					this._clearItems();

					this.containerNode = domConstruct.create("div", null, this.domNode);

					// listen to scrollTo and slideTo from the parent scrollable object

					this.connect(this._sv, "scrollTo", lang.hitch(this, this._loadItems), true);
					this.connect(this._sv, "slideTo", lang.hitch(this, this._loadItems), true);

					// The _topDiv and _bottomDiv elements are place holders for the items
					// that are not actually in the DOM at the top and bottom of the list.

					this._topDiv = domConstruct.create("div", null, this.domNode, "first");
					this._bottomDiv = domConstruct.create("div", null, this.domNode, "last");

					this._reloadItems();
				}
			}
		},
		
		_loadItems : function(toPos){
			// summary:	Adds and removes items to/from the DOM when the list is scrolled.
			
			var sv = this._sv; 			// ScrollableView
			var h = sv.getDim().d.h;
			if(h <= 0){ return; } 			// view is hidden

			var cury = -sv.getPos().y; // current y scroll position
			var posy = toPos ? -toPos.y : cury;

			// get minimum and maximum visible y positions:
			// we use the largest area including both the current and new position
			// so that all items will be visible during slideTo animations
			var visibleYMin = Math.min(cury, posy),
				visibleYMax = Math.max(cury, posy) + h;
			
			// add pages at top and bottom as required to fill the visible area
			while(this._loadedYMin > visibleYMin && this._addBefore()){ }
			while(this._loadedYMax < visibleYMax && this._addAfter()){ }
		},
		
		_reloadItems: function(){
			// summary:	Resets the internal state and reloads items according to the current scroll position.

			// remove all loaded items
			this._clearItems();
			
			// reset internal state
			this._loadedYMin = this._loadedYMax = 0;
			this._firstIndex = 0;
			this._lastIndex = -1;
			this._topDiv.style.height = "0px";
			
			this._loadItems();
		},
		
		_clearItems: function(){
			// summary: Removes all currently loaded items.
			var c = this.containerNode;
			array.forEach(registry.findWidgets(c), function(item){
				c.removeChild(item.domNode);
			});
		},
		
		_addBefore: function(){
			// summary:	Loads pages of items before the currently visible items to fill the visible area.
			
			var i, count;
			
			var oldBox = domGeometry.getMarginBox(this.containerNode);
			
			for(count = 0, i = this._firstIndex-1; count < this.pageSize && i >= 0; count++, i--){
				var item = this._items[i];
				domConstruct.place(item.domNode, this.containerNode, "first");
				if(!item._started){
					item.startup();
				}
				this._firstIndex = i;
			}
			
			var newBox = domGeometry.getMarginBox(this.containerNode);

			this._adjustTopDiv(oldBox, newBox);
			
			if(this._lastIndex - this._firstIndex >= this.maxPages*this.pageSize){
				var toRemove = this.unloadPages*this.pageSize;
				for(i = 0; i < toRemove; i++){
					this.containerNode.removeChild(this._items[this._lastIndex - i].domNode);
				}
				this._lastIndex -= toRemove;
				
				newBox = domGeometry.getMarginBox(this.containerNode);
			}

			this._adjustBottomDiv(newBox);
			
			return count == this.pageSize;
		},
		
		_addAfter: function(){
			// summary:	Loads pages of items after the currently visible items to fill the visible area.
			
			var i, count;
			
			var oldBox = null;
			
			for(count = 0, i = this._lastIndex+1; count < this.pageSize && i < this._items.length; count++, i++){
				var item = this._items[i];
				domConstruct.place(item.domNode, this.containerNode);
				if(!item._started){
					item.startup();
				}
				this._lastIndex = i;
			}
			if(this._lastIndex - this._firstIndex >= this.maxPages*this.pageSize){
				oldBox = domGeometry.getMarginBox(this.containerNode);
				var toRemove = this.unloadPages*this.pageSize;
				for(i = 0; i < toRemove; i++){
					this.containerNode.removeChild(this._items[this._firstIndex + i].domNode);
				}
				this._firstIndex += toRemove;
			}
			
			var newBox = domGeometry.getMarginBox(this.containerNode);

			if(oldBox){
				this._adjustTopDiv(oldBox, newBox);
			}
			this._adjustBottomDiv(newBox);

			return count == this.pageSize;
		},
		
		_adjustTopDiv: function(oldBox, newBox){
			// summary:	Adjusts the height of the top filler div after items have been added/removed.
			
			this._loadedYMin -= newBox.h - oldBox.h;
			this._topDiv.style.height = this._loadedYMin + "px";
		},
		
		_adjustBottomDiv: function(newBox){
			// summary:	Adjusts the height of the bottom filler div after items have been added/removed.
			
			// the total height is an estimate based on the average height of the already loaded items
			var h = this._lastIndex > 0 ? (this._loadedYMin + newBox.h) / this._lastIndex : 0;
			h *= this._items.length - 1 - this._lastIndex;
			this._bottomDiv.style.height = h + "px";
			this._loadedYMax = this._loadedYMin + newBox.h;
		},
		
		_childrenChanged : function(){
			// summary: Called by addChild/removeChild, updates the loaded items.
			
			// Whenever an item is added or removed, this may impact the loaded items,
			// so we have to clear all loaded items and recompute them. We cannot afford 
			// to do this on every add/remove, so we use a timer to batch these updates.
			// There would probably be a way to update the loaded items on the fly
			// in add/removeChild, but at the cost of much more code...
			if(!this._qs_timer){
				this._qs_timer = this.defer(function(){
					delete this._qs_timer;
					this._reloadItems();
				});
			}
		},

		resize: function(){
			// summary: Loads/unloads items to fit the new size
			this.inherited(arguments);
			if(this._items){
				this._loadItems();
			}
		},
		
		// The rest of the methods are overrides of _Container and _WidgetBase.
		// We must override them because children are not all added to the DOM tree
		// under the list node, only a subset of them will really be in the DOM,
		// but we still want the list to look as if all children were there.

		addChild : function(/* dijit._Widget */widget, /* int? */insertIndex){
			// summary: Overrides dijit._Container
			if(this._items){
				if( typeof insertIndex == "number"){
					this._items.splice(insertIndex, 0, widget);
				}else{
					this._items.push(widget);
				}
				this._childrenChanged();
			}else{
				this.inherited(arguments);
			}
		},

		removeChild : function(/* Widget|int */widget){
			// summary: Overrides dijit._Container
			if(this._items){
				this._items.splice(typeof widget == "number" ? widget : this._items.indexOf(widget), 1);
				this._childrenChanged();
			}else{
				this.inherited(arguments);
			}
		},

		getChildren : function(){
			// summary: Overrides dijit._WidgetBase
			if(this._items){
				return this._items.slice(0);
			}else{
				return this.inherited(arguments);
			}
		},

		_getSiblingOfChild : function(/* dijit._Widget */child, /* int */dir){
			// summary: Overrides dijit._Container

			if(this._items){
				var index = this._items.indexOf(child);
				if(index >= 0){
					index = dir > 0 ? index++ : index--;
				}
				return this._items[index];
			}else{
				return this.inherited(arguments);
			}
		},
		
		generateList: function(/*Array*/items){
			// summary:
			//		Overrides dojox.mobile._StoreListMixin when the list is a store list.
			
			if(this._items && !this.append){
				// _StoreListMixin calls destroyRecursive to delete existing items, not removeChild,
				// so we must remove all logical items (i.e. clear _items) before reloading the store.
				// And since the superclass destroys all children returned by getChildren(), and
				// this would actually return no children because _items is now empty, we must
				// destroy all children manually first.
				array.forEach(this.getChildren(), function(child){
					child.destroyRecursive();
				});
				this._items = [];
			}
			this.inherited(arguments);
		}
	});
});

},
'money/views/accounts':function(){
define([
	"dojo/_base/declare","dojox/mobile/TextBox","dojo/_base/array", "dojox/mobile/ListItem",
	"dijit/registry","dojo/dom-attr","dojo/json","dojo/dom-style", 'dojo/DeferredList', 'dojo/Deferred',
	"dojox/mobile/ToolBarButton","money/dialog",'dojo/text!money/views/accounts.html'
 ],
    function(declare,TextBox,arrayUtil, ListItem,   registry, domAttr,json, domStyle, DeferredList, Deferred, Button, Dialog){
    
	return {
		beforeActivate: function(contact){
			window.AppData.numberPicker.mode = "a"
			
			if( Number(this.params.create) == 1 && this.params.currency) this.add( this.params.currency );
							
			this.start()
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
				window.AppData.objAccounts.account.startAmount, window.AppData.objAccounts.account.maincur
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
			console.log('ADD child')
			var self = this
			if(account.startAmount == undefined) 
				account.startAmount = 0;
			deleteAccount = function(e, _this){
				e.preventDefault();
				e.stopPropagation();
				self.dlg.show(false, "", self.nls.deleteAccount + '?', self.nls.yes, function(){
				
					var id = domAttr.get(_this,"data-finance-id"), 
					defRemoveOperationArray  = [ new Deferred, new Deferred ];
					defRemoveOperation = new DeferredList ( defRemoveOperationArray );
					if(id){
						window.AppData.store.query({account: id}).then ( function( thisAccountItems ){
							var defArray = []
							console.log( 'thisAccountItems', thisAccountItems )
							arrayUtil.forEach(thisAccountItems.items, function(item){
								defArray.push( window.AppData.store.remove(item.id) );
							})
							if( defArray.length > 0 )
								new DeferredList( defArray ).then(function(){
									defRemoveOperationArray [0] .resolve();
								})
							else defRemoveOperationArray [0] .resolve();
						})
						
						window.AppData.store.query({accountTo: id}).then(function(thisAccountItems){
							defArray = []
							arrayUtil.forEach(thisAccountItems.items, function(item){
								defArray.push( window.AppData.store.remove(item.id) )
							})
							if( defArray.length > 0 )
								new DeferredList( defArray ).then(function(){
									defRemoveOperationArray [1] .resolve();
								})
							else defRemoveOperationArray [1] .resolve();
						})
						
						window.AppData.accountStore.remove(id);
						self.displayEmptyMsgs( window.AppData.accountStore.query().length )
						
						var deleted = localStorage.getItem('deletedAccounts') ? json.parse(localStorage.getItem('deletedAccounts')) : new Array();
						deleted.push(id);
						localStorage.setItem('deletedAccounts',json.stringify(deleted));
						registry.byId('li'+id).destroyRecursive();
						
						window.AppData.store._setAccounts( window.AppData.store.getAccounts() );
						
						defRemoveOperation.then(function(){
							console.log('CALL REFRESH')
							if( window.dFinance.children.dFinance_summary ){
								window.dFinance.children.dFinance_summary.summary = [];
								window.dFinance.children.dFinance_summary.daily.refresh();
								window.dFinance.children.dFinance_summary.displayAll();
							}
						})
						
						
					}
				}, self.nls.no)
			}
			this.accList.addChild(new ListItem({
				label: '<div ontouchstart="window.AppData.touched = true; deleteAccount(event,this)"'+
				'onclick="if(!window.AppData.touched)  deleteAccount(event,this)" data-finance-id="'+account.id+'" class="domButton mblDomButtonBlueCircleMinus"><div><div><div></div></div></div></div>'+'<div style="left:35px; right:10px; position:absolute;"><input style="width: 100%" type="text" id="a-'+ account.id + '" value="' + account.label +'"/></div>',
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
					window.AppData.numberPicker.show( account.startAmount, account.maincur )
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

},
'dojox/charting/axis2d/Invisible':function(){
define(["dojo/_base/lang", "dojo/_base/declare", "./Base", "../scaler/linear",
	"dojox/lang/utils"],
	function(lang, declare, Base, lin, du){

/*=====
	var __InvisibleAxisCtorArgs = {
		// summary:
		//		Optional arguments used in the definition of an invisible axis.
		// vertical: Boolean?
		//		A flag that says whether an axis is vertical (i.e. y axis) or horizontal. Default is false (horizontal).
		// fixUpper: String?
		//		Align the greatest value on the axis with the specified tick level. Options are "major", "minor", "micro", or "none".  Defaults to "none".
		// fixLower: String?
		//		Align the smallest value on the axis with the specified tick level. Options are "major", "minor", "micro", or "none".  Defaults to "none".
		// natural: Boolean?
		//		Ensure tick marks are made on "natural" numbers. Defaults to false.
		// leftBottom: Boolean?
		//		The position of a vertical axis; if true, will be placed against the left-bottom corner of the chart.  Defaults to true.
		// includeZero: Boolean?
		//		Include 0 on the axis rendering.  Default is false.
		// fixed: Boolean?
		//		Force all axis labels to be fixed numbers.  Default is true.
		// min: Number?
		//		The smallest value on an axis. Default is 0.
		// max: Number?
		//		The largest value on an axis. Default is 1.
		// from: Number?
		//		Force the chart to render data visible from this value. Default is 0.
		// to: Number?
		//		Force the chart to render data visible to this value. Default is 1.
		// majorTickStep: Number?
		//		The amount to skip before a major tick is drawn. When not set the major ticks step is computed from
		//		the data range.
		// minorTickStep: Number?
		//		The amount to skip before a minor tick is drawn. When not set the minor ticks step is computed from
		//		the data range.
		// microTickStep: Number?
		//		The amount to skip before a micro tick is drawn. When not set the micro ticks step is computed from
	};
=====*/

	return declare("dojox.charting.axis2d.Invisible", Base, {
		// summary:
		//		A axis object used in dojox.charting.  You can use that axis if you want the axis to be invisible.
		//		See dojox.charting.Chart.addAxis for details.
		//
		// defaultParams: Object
		//		The default parameters used to define any axis.
		// optionalParams: Object
		//		Any optional parameters needed to define an axis.

		/*
		// TODO: the documentation tools need these to be pre-defined in order to pick them up
		//	correctly, but the code here is partially predicated on whether or not the properties
		//	actually exist.  For now, we will leave these undocumented but in the code for later. -- TRT

		// opt: Object
		//		The actual options used to define this axis, created at initialization.
		// scaler: Object
		//		The calculated helper object to tell charts how to draw an axis and any data.
		// ticks: Object
		//		The calculated tick object that helps a chart draw the scaling on an axis.
		// dirty: Boolean
		//		The state of the axis (whether it needs to be redrawn or not)
		// scale: Number
		//		The current scale of the axis.
		// offset: Number
		//		The current offset of the axis.

		opt: null,
		scaler: null,
		ticks: null,
		dirty: true,
		scale: 1,
		offset: 0,
		*/
		defaultParams: {
			vertical:    false,		// true for vertical axis
			fixUpper:    "none",	// align the upper on ticks: "major", "minor", "micro", "none"
			fixLower:    "none",	// align the lower on ticks: "major", "minor", "micro", "none"
			natural:     false,		// all tick marks should be made on natural numbers
			leftBottom:  true,		// position of the axis, used with "vertical"
			includeZero: false,		// 0 should be included
			fixed:       true		// all labels are fixed numbers
		},
		optionalParams: {
			min:			0,	// minimal value on this axis
			max:			1,	// maximal value on this axis
			from:			0,	// visible from this value
			to:				1,	// visible to this value
			majorTickStep:	4,	// major tick step
			minorTickStep:	2,	// minor tick step
			microTickStep:	1	// micro tick step
		},

		constructor: function(chart, kwArgs){
			// summary:
			//		The constructor for an invisible axis.
			// chart: dojox/charting/Chart
			//		The chart the axis belongs to.
			// kwArgs: __InvisibleAxisCtorArgs?
			//		Any optional keyword arguments to be used to define this axis.
			this.opt = lang.clone(this.defaultParams);
            du.updateWithObject(this.opt, kwArgs);
			du.updateWithPattern(this.opt, kwArgs, this.optionalParams);
		},
		dependOnData: function(){
			// summary:
			//		Find out whether or not the axis options depend on the data in the axis.
			return !("min" in this.opt) || !("max" in this.opt);	//	Boolean
		},
		clear: function(){
			// summary:
			//		Clear out all calculated properties on this axis;
			// returns: dojox/charting/axis2d/Invisible
			//		The reference to the axis for functional chaining.
			delete this.scaler;
			delete this.ticks;
			this.dirty = true;
			return this;	//	dojox/charting/axis2d/Invisible
		},
		initialized: function(){
			// summary:
			//		Finds out if this axis has been initialized or not.
			// returns: Boolean
			//		Whether a scaler has been calculated and if the axis is not dirty.
			return "scaler" in this && !(this.dirty && this.dependOnData());
		},
		setWindow: function(scale, offset){
			// summary:
			//		Set the drawing "window" for the axis.
			// scale: Number
			//		The new scale for the axis.
			// offset: Number
			//		The new offset for the axis.
			// returns: dojox/charting/axis2d/Invisible
			//		The reference to the axis for functional chaining.
			this.scale  = scale;
			this.offset = offset;
			return this.clear();	//	dojox/charting/axis2d/Invisible
		},
		getWindowScale: function(){
			// summary:
			//		Get the current windowing scale of the axis.
			return "scale" in this ? this.scale : 1;	//	Number
		},
		getWindowOffset: function(){
			// summary:
			//		Get the current windowing offset for the axis.
			return "offset" in this ? this.offset : 0;	//	Number
		},
		calculate: function(min, max, span){
			// summary:
			//		Perform all calculations needed to render this axis.
			// min: Number
			//		The smallest value represented on this axis.
			// max: Number
			//		The largest value represented on this axis.
			// span: Number
			//		The span in pixels over which axis calculations are made.
			// returns: dojox/charting/axis2d/Invisible
			//		The reference to the axis for functional chaining.
			if(this.initialized()){
				return this;
			}
			var o = this.opt;
			// we used to have a 4th function parameter to reach labels but
			// nobody was calling it with 4 parameters.
			this.labels = o.labels;
			this.scaler = lin.buildScaler(min, max, span, o);
			// store the absolute major tick start, this will be useful when dropping a label every n labels
			// TODO: if o.lower then it does not work
			var tsb = this.scaler.bounds;
			if("scale" in this){
				// calculate new range
				o.from = tsb.lower + this.offset;
				o.to   = (tsb.upper - tsb.lower) / this.scale + o.from;
				// make sure that bounds are correct
				if( !isFinite(o.from) ||
					isNaN(o.from) ||
					!isFinite(o.to) ||
					isNaN(o.to) ||
					o.to - o.from >= tsb.upper - tsb.lower
				){
					// any error --- remove from/to bounds
					delete o.from;
					delete o.to;
					delete this.scale;
					delete this.offset;
				}else{
					// shift the window, if we are out of bounds
					if(o.from < tsb.lower){
						o.to += tsb.lower - o.from;
						o.from = tsb.lower;
					}else if(o.to > tsb.upper){
						o.from += tsb.upper - o.to;
						o.to = tsb.upper;
					}
					// update the offset
					this.offset = o.from - tsb.lower;
				}
				// re-calculate the scaler
				this.scaler = lin.buildScaler(min, max, span, o);
				tsb = this.scaler.bounds;
				// cleanup
				if(this.scale == 1 && this.offset == 0){
					delete this.scale;
					delete this.offset;
				}
			}
			return this;	//	dojox/charting/axis2d/Invisible
		},
		getScaler: function(){
			// summary:
			//		Get the pre-calculated scaler object.
			return this.scaler;	//	Object
		},
		getTicks: function(){
			// summary:
			//		Get the pre-calculated ticks object.
			return this.ticks;	//	Object
		}
	});
});

},
'money/store':function(){
/*
*   Store module
* 	rebuilt to work only with IndexedDB	
* 
*   v. 0.9
* 	21/09/2014
*   
* 	Mikhael Milikhin
* 
*/

define([
   	"dojo/_base/declare",
   	"dojo/_base/Deferred",
   	"dojo/json",
	"dojo/_base/array",
	"dojo/date/locale", 
	"money/idb",
	"dojo/_base/lang",
	"dojo/store/Observable", "dojo/store/Memory"
	],
    function(
		declare, Deferred, json,
		arrayUtil, locale, Idb,
		lang, Observable, Memory) {
			
        return declare(null, {
            isLocalStorageAvailable :function(){
				return 'localStorage' in window && window['localStorage'] !== null;			
			},
			
			idb: null,
			
			/*
			 * 	Basic operations with storage:
			 * 
			 * 	- get
			 * 	- put
			 * 	- remove
			 * 	- query
			 * 
			 */
			'get': function(id){
                return this.idb.getById(id);
            },
            
            /*
             * @doNotRefresh - not to update edited time//not to initiate views update
             */ 
            'put': function(obj, doNotRefresh, doNotRefreshSummary){
				var doNotRefresh = doNotRefresh || false
				var doNotRefreshSummary = doNotRefreshSummary || false
                if( !obj ) return false;
                try{
					for(var i = 0; i < obj.tags.length; i++){
						var queryTagByLabel = window.AppData.tagsStore.query({
							'label' : obj.tags[i]
						});
						var queryTagById = window.AppData.tagsStore.query({
							'id' : obj.tags[i]
						});
						
						//if condition below are false, we already have have tag ID, so nothing needed to be done
						if( ( queryTagByLabel.length > 0 ) && ( queryTagById.length == 0 ) ){
							//tag found by label
							obj.tags[i] = queryTagByLabel[0].id
						}else if(( queryTagByLabel.length == 0 ) && ( queryTagById.length == 0) ){
							//tag not found
							var label = obj.tags[i]
							if(label != ""){
								obj.tags[i] = window.AppData.tagsStore.add({
									label: label,
									et: new Date().getTime()
								})
							}
							else remove(obj.tags,i)							
						}
					}
					
					if(obj.tags.sort) 
						obj.tags.sort();
					
					localStorage.setItem("tags",
						json.stringify( window.AppData.tagsStore.query() )
					);
					
					// generate unique object ID
					obj.id = obj.id ? obj.id : Math.random()
					
					var idbPromise = false
					//Edit time. needed for Dropbox; ??
					if(!doNotRefresh)
						obj.et = new Date().getTime();
						
					idbPromise = this.idb.addItem( obj, doNotRefreshSummary );
					return {
						id	: obj.id, 
						obj	: obj, 
						def	: idbPromise
					}					
                }catch(e){
					alert('error saving to store.. ' + e.toString())
                    console.log("error saving to store...", e)
                }
            },
            
            'query': function(){
				return this.idb.query.apply( this.idb, arguments )
			},
			
			/*
			 * @doNotLog - don't save info about deletion
			 */ 
            'remove': function(removedFrom, doNotLog){
                var d = null, doNotLog = doNotLog || false;
                try{
					d = this.idb.deleteItem(removedFrom)                    
					if( !doNotLog ) {
						var deleted = 
							localStorage.getItem('deleted') ? 
								json.parse(localStorage.getItem('deleted')) : 
								new Array();
								
						deleted.push(removedFrom);
						localStorage.setItem('deleted',json.stringify(deleted));
					}
                }catch(e){
                    console.log("error removing from store...", e)
                }
                
                if(!d) {
					d = new Deferred;
					setTimeout(function(){
						d.resolve('hz');
					},0);
				}
                return d;
            },
            
            
            /*
             * Should be executed when data is fetched from Permanent store
             */ 
            _setupTagsDueToFrequency: function(data){
                /*
                *   item.date is transformed into Date object 
                * 	(IndexedDb doesn't support Date)
                */
               
                var tagsFreq = {};
                arrayUtil.forEach( data, lang.hitch( function( item ) {
					for( var i = 0; i < item.tags.length; i++) {
						if (tagsFreq [ item.tags[i] ])
							tagsFreq [ item.tags[i] ] ++;
						else
							tagsFreq [ item.tags[i] ] = 1;
					}					
				}), this)
				
				
				//reorder tags
				var tags = this._getTags();
				tags.sort( function( a,b ) {					
					return tagsFreq[a.id] < tagsFreq[b.id] ? 1 : -1;
				})
				
				for(var i = 0; i < tags.length; i++)
					tags[i].freq = tagsFreq[ tags[i].id ]
				
				window.AppData.tagsStore = 
					new Memory({ 
						idProperty:'id', 
						data: tags
					});
				
				
				console.log( 'TAGS', window.AppData.tagsStore.query() );
				
				//create handlers for put and remove events
				//this._createTransactionHandlers();
				//resolve data loading promise
				this.createPromise.resolve({status: 'ok'})
            },
            
            // -------------------------------------------- //
            //		  Initialize all stores                 //
            // ---------------------------------------------//
            
            		
			constructor: function( args ){
				this.createPromise = new Deferred()
				var self = this
				window.AppData.store = this
				if( !this.isLocalStorageAvailable() ){
					alert( 'HTML5 Local storage is not supported. Application won\'t work.')
					throw "NO_LOCAL_STORAGE";
				}
				
				var savedData = this.getAllData()
				window.AppData.accountStore = new Memory({
					idProperty:'id',
					data: savedData.accounts
				});
					
				window.AppData.curs = []; 
				var j=0;
				for (var i in window.AppData.currencies){
					//console.log(window.AppData.currencies[i])
					window.AppData.curs[j++] = {
						id: i,
						label:window.AppData.currencies[i] +  ' ('+i+')'//,
						//rightText: "$1 = " + window.AppData.rates.rates[i]+" "+i
					}
				}
				window.AppData.currencyStore = new Memory({ 
					idProperty:'id', 
					data: window.AppData.curs 
				});
					
				window.AppData.tagsStore = new Memory({
					idProperty:'id',
					data: savedData.tags
				});
				
				var themesData = [
					{"label": "Holodark", "id": "Holodark"},
					{"label": "Light (default)", "id": "Custom"}
				];
				var localeData = [
					{"label": "System default", "id": "no_lang"},
					{"label": "Russian", "id": "ru-ru"},
					{"label": "English", "id": "en-us"}
				];
				
				window.AppData.themeStore = new Memory({
					idProperty:'id',
					data: themesData
				});
				window.AppData.langStore = new Memory({
					idProperty:'id',
					data: localeData
				});
					
				this.idb = new Idb();
				this.idb.open().then( function(){
					self.query().then( function( data ){
						self._setupTagsDueToFrequency( data.items );
					});
					
				})
				
				
			},
			
			// ----------------------------------------------//
			//		Basic operations with additional stores  //
			// ----------------------------------------------//
			
			/*
			 *  _get & _set methods for each type of data.
			 *  Accounts, Tags and Settings - stored in LocalStorage
			 * 	Transactions - at IndexedDb
			 */ 
			setLocale: function(loc){
				if(loc && this.isLocalStorageAvailable())
					localStorage.setItem("lang",loc)
			},
			setTheme: function(theme){
				window.AppData.appTheme = theme
				if(theme && this.isLocalStorageAvailable())
					localStorage.setItem("appTheme",theme)
			},
			
			getAccount: function(id){
				return window.AppData.accountStore.get(id)
			},
			getAccounts: function(){
				return window.AppData.accountStore.query()
			},
			putAccount: function(obj){
				return window.AppData.accountStore.put(obj)
			},
			
			// remove account and all connected transactions
			removeAccount: function(id){
				var defArray = [],  defResult = new Deferred;
				defArray.push( new Deferred );
				defArray.push( new Deferred );
				if(id && window.AppData.accountStore.get(id)){
					this.idb.query({
						account: id
					}).then( function( data ) {
						var thisAccountTrans = data.items;
						arrayUtil.forEach(thisAccountTrans, function(item){
							this.idb.remove(item.id). then(
								function(){
									defArray[0].resolve('ok')
								}
							)
						},this)
					} )
					
					this.idb.query({
						accountTo: id
					}).then ( function( data) {
						var thisAccountTrans = data.items;
						arrayUtil.forEach(thisAccountTrans, function(item){
							this.idb.remove(item.id). then(
								function(){
									defArray[1].resolve('ok')
								}
							)
						},this)
					})
					
					new DeferredList( defArray )
						.then( function(){
							window.AppData.accountStore.remove(id)
							this._setAccounts(this.getAccounts());
							defResult.resolve( 'ok' )
						});					
				}
				return defResult;
			},
			_getAccounts: function(){
				if(this.isLocalStorageAvailable())
					return localStorage.getItem("accounts") ? json.parse(localStorage.getItem("accounts")) : []
				else return []
			},
			_setAccounts: function(data){
				if(data){
					localStorage.setItem("accounts", json.stringify( data ) )
					window.AppData.accountStore = new Memory({
						idProperty : 'id',
						'data' : data
					});
				}
			},
			
			
			
			
			_getSettings: function(){
				if(this.isLocalStorageAvailable())
					return localStorage.getItem("settings") ? json.parse(
						localStorage.getItem("settings")
					) : []
				else return []
			},
			
			_getTypes: function(){
				return [
					{"label": '_expence', "id": "e"},
					{"label": '_income', "id": "i"},
					{"label": '_transfer', "id": "t"}
				]
			},
			
			
			
			// Works with store
			getTag: function(id){
				return window.AppData.tagsStore.get(id)
			},
			putTag: function(obj){
				return window.AppData.tagsStore.put(obj)
			},
			getTags: function(){
				return window.AppData.tagsStore.query()
			},
			removeTag: function(id){
				if(id && window.AppData.tagsStore.get(id)){
					window.AppData.tagsStore.remove(id)
					this._setTags( this.getTags() )
				}
			},
			
			// Works with local storage			
			_getTags: function(){
				if(this.isLocalStorageAvailable())
					return localStorage.getItem("tags") ? json.parse(localStorage.getItem("tags")) : []
				else return []
			},
			_setTags: function(data){
				if(data){
					localStorage.setItem("tags", json.stringify( data ))
					window.AppData.tagsStore = new Memory({
						idProperty:'id','data': data
					})
				}
			},
			
			
			// NOT USED FOR NOW
			
			_getStoredDataCopy: function(){
				return this.idb ? lang.clone(this.idb.query()) : []
			},
			getAllData: function(formatDate){
				var formatDate = formatDate || false
				//var storeData = this._getStoredDataCopy()
				//if(formatDate)
				//	arrayUtil.forEach(storeData,function(item){
				//		item.date = locale.format(item.date, {selector:"date", datePattern:window.AppData.widgetDateFormat})
				//	})
				//console.log(storeData)
				return {
					accounts: this._getAccounts(),
					settings: this._getSettings(),
					types	: this._getTypes(),
					tags	: this._getTags()//,
					//storeData: storeData
				}
			},
			
			restoreAllData: function(rawData){
				var restorePromise = new Deferred()
				try{
					var data = json.parse(rawData);
					console.log('data to restore ', data)
					this._setAccounts(data.accounts)
					this._setSettings(data.settings)
					this._setTags(data.tags)
					if(data.storeData){
						var rpromises = [], ipromises = []
						arrayUtil.forEach(this.queryItems(),function(item){
							var def = this.removeItem(item.id)
							if(def)rpromises.push(def)
						},this)
						if(rpromiss.length){
							var rDeferredList = new DeferredList(rpromises), self = this
							rDeferredList.then(function(state){
								arrayUtil.forEach(data,function(item){
									var def = self.putItem(item)
									if(def) ipromises.push(def)
								},self)
							})
						}else{
							arrayUtil.forEach(data,function(item){
								var def = self.putItem(item)
								if(def) ipromises.push(def)
							},self)
						}
						
						//return Deferred object
						if(ipromises.length){
							var iDeferredList = new DeferredList(ipromises)
							iDeferredList.then(function(e){
								restorePromise.resolve({state: 1 /* ~no errors */, msg: 'done'})
							})							
						}else restorePromise.resolve({state: 1 /* ~no errors */, msg: 'done'})
					}
				}catch(e){
					restorePromise.resolve({state: 10 /* ~error */, msg: 'unknown error'})
				}
				return restorePromise;
			}
        });
    }
);

},
'money/nls/settings':function(){
define({
	root: {
		title	: "Settings",
	    menu	: 'Menu',
	    myData	: 'My data',
	    transition: 'Animation effects',
	    graphics: 'Graphics settings',
	    tags	: 'My tags (categories)',
	    accounts: 'My accounts',
	    prefs	: 'Personalization',
	    language: 'Language & locale', 
	    theme	: 'Theme' 
	    
	},
	'ru-ru': true
});

},
'money/nls/ru-ru/settings':function(){
define({
	title	: "Настройки",
	menu	: 'Меню',
	myData	: 'Мои данные',
	transition: 'Анимация',
	graphics: 'Настройки графики',
	tags	: 'Мои метки (категории)',
	accounts: 'Мои счета',
	prefs	: 'Персонализация',
	language: 'Язык и региональные стандарты',
	theme	: 'Тема оформления'  
	
});

},
'dojox/charting/widget/Legend':function(){
define(["dojo/_base/declare", "dijit/_WidgetBase", "dojox/gfx","dojo/_base/array", "dojo/has", "dojo/has!dojo-bidi?../bidi/widget/Legend",
		"dojox/lang/functional", "dojo/dom", "dojo/dom-construct", "dojo/dom-class","dijit/registry"],
		function(declare, _WidgetBase, gfx, arr, has, BidiLegend, df,
				dom, domConstruct, domClass, registry){

	var Legend = declare(has("dojo-bidi")? "dojox.charting.widget.NonBidiLegend" : "dojox.charting.widget.Legend", _WidgetBase, {
		// summary:
		//		A legend for a chart. A legend contains summary labels for
		//		each series of data contained in the chart.
		//		
		//		Set the horizontal attribute to boolean false to layout legend labels vertically.
		//		Set the horizontal attribute to a number to layout legend labels in horizontal
		//		rows each containing that number of labels (except possibly the last row).
		//		
		//		(Line or Scatter charts (colored lines with shape symbols) )
		//		-o- Series1		-X- Series2		-v- Series3
		//		
		//		(Area/Bar/Pie charts (letters represent colors))
		//		[a] Series1		[b] Series2		[c] Series3

		chartRef:   "",
		horizontal: true,
		swatchSize: 18,

		legendBody: null,

		postCreate: function(){
			if(!this.chart && this.chartRef){
				this.chart = registry.byId(this.chartRef) || registry.byNode(dom.byId(this.chartRef));
				if(!this.chart){
					console.log("Could not find chart instance with id: " + this.chartRef);
				}
			}
			// we want original chart
			this.chart = this.chart.chart || this.chart;
			this.refresh();
		},
		buildRendering: function(){
			this.domNode = domConstruct.create("table",
					{role: "group", "aria-label": "chart legend", "class": "dojoxLegendNode"});
			this.legendBody = domConstruct.create("tbody", null, this.domNode);
			this.inherited(arguments);
		},
		destroy: function(){
			if(this._surfaces){
				arr.forEach(this._surfaces, function(surface){
					surface.destroy();
				});
			}
			this.inherited(arguments);
		},
		refresh: function(){
			// summary:
			//		regenerates the legend to reflect changes to the chart

			// cleanup
			if(this._surfaces){
				arr.forEach(this._surfaces, function(surface){
					surface.destroy();
				});
			}
			this._surfaces = [];
			while(this.legendBody.lastChild){
				domConstruct.destroy(this.legendBody.lastChild);
			}

			if(this.horizontal){
				domClass.add(this.domNode, "dojoxLegendHorizontal");
				// make a container <tr>
				this._tr = domConstruct.create("tr", null, this.legendBody);
				this._inrow = 0;
			}

			// keep trying to reach this.series for compatibility reasons in case the user set them, but could be removed
			var s = this.series || this.chart.series;
			if(s.length == 0){
				return;
			}
			if(s[0].chart.stack[0].declaredClass == "dojox.charting.plot2d.Pie"){
				var t = s[0].chart.stack[0];
				if(typeof t.run.data[0] == "number"){
					var filteredRun = df.map(t.run.data, "Math.max(x, 0)");
					var slices = df.map(filteredRun, "/this", df.foldl(filteredRun, "+", 0));
					arr.forEach(slices, function(x, i){
						this._addLabel(t.dyn[i], t._getLabel(x * 100) + "%");
					}, this);
				}else{
					arr.forEach(t.run.data, function(x, i){
						this._addLabel(t.dyn[i], x.legend || x.text || x.y);
					}, this);
				}
			}else{
				arr.forEach(s, function(x){
					this._addLabel(x.dyn, x.legend || x.name);
				}, this);
			}
		},
		_addLabel: function(dyn, label){
			// create necessary elements
			var wrapper = domConstruct.create("td"),
				icon = domConstruct.create("div", null, wrapper),
				text = domConstruct.create("label", null, wrapper),
				div  = domConstruct.create("div", {
					style: {
						"width": this.swatchSize + "px",
						"height":this.swatchSize + "px",
						"float": "left"
					}
				}, icon);
			domClass.add(icon, "dojoxLegendIcon dijitInline");
			domClass.add(text, "dojoxLegendText");
			// create a skeleton
			if(this._tr){
				// horizontal
				this._tr.appendChild(wrapper);
				if(++this._inrow === this.horizontal){
					// make a fresh container <tr>
					this._tr = domConstruct.create("tr", null, this.legendBody);
					this._inrow = 0;
				}
			}else{
				// vertical
				var tr = domConstruct.create("tr", null, this.legendBody);
				tr.appendChild(wrapper);
			}

			// populate the skeleton
			this._makeIcon(div, dyn);
			text.innerHTML = String(label);
			if(has("dojo-bidi")){
				text.dir = this.getTextDir(label, text.dir);
			}
		},
		_makeIcon: function(div, dyn){
			var mb = { h: this.swatchSize, w: this.swatchSize };
			var surface = gfx.createSurface(div, mb.w, mb.h);
			this._surfaces.push(surface);
			if(dyn.fill){
				// regions
				surface.createRect({x: 2, y: 2, width: mb.w - 4, height: mb.h - 4}).
					setFill(dyn.fill).setStroke(dyn.stroke);
			}else if(dyn.stroke || dyn.marker){
				// draw line
				var line = {x1: 0, y1: mb.h / 2, x2: mb.w, y2: mb.h / 2};
				if(dyn.stroke){
					surface.createLine(line).setStroke(dyn.stroke);
				}
				if(dyn.marker){
					// draw marker on top
					var c = {x: mb.w / 2, y: mb.h / 2};
					surface.createPath({path: "M" + c.x + " " + c.y + " " + dyn.marker}).
						setFill(dyn.markerFill).setStroke(dyn.markerStroke);
				}
			}else{
				// nothing
				surface.createRect({x: 2, y: 2, width: mb.w - 4, height: mb.h - 4}).
					setStroke("black");
				surface.createLine({x1: 2, y1: 2, x2: mb.w - 2, y2: mb.h - 2}).setStroke("black");
				surface.createLine({x1: 2, y1: mb.h - 2, x2: mb.w - 2, y2: 2}).setStroke("black");
			}
		}
	});
	return has("dojo-bidi")? declare("dojox.charting.widget.Legend", [Legend, BidiLegend]) : Legend;
	
});

},
'dojox/charting/plot2d/common':function(){
define(["dojo/_base/lang", "dojo/_base/array", "dojo/_base/Color", 
		"dojox/gfx", "dojox/lang/functional", "../scaler/common"], 
	function(lang, arr, Color, g, df, sc){
	
	var common = lang.getObject("dojox.charting.plot2d.common", true);
	
	return lang.mixin(common, {	
		doIfLoaded: sc.doIfLoaded,
		makeStroke: function(stroke){
			if(!stroke){ return stroke; }
			if(typeof stroke == "string" || stroke instanceof Color){
				stroke = {color: stroke};
			}
			return g.makeParameters(g.defaultStroke, stroke);
		},
		augmentColor: function(target, color){
			var t = new Color(target),
				c = new Color(color);
			c.a = t.a;
			return c;
		},
		augmentStroke: function(stroke, color){
			var s = common.makeStroke(stroke);
			if(s){
				s.color = common.augmentColor(s.color, color);
			}
			return s;
		},
		augmentFill: function(fill, color){
			var fc, c = new Color(color);
			if(typeof fill == "string" || fill instanceof Color){
				return common.augmentColor(fill, color);
			}
			return fill;
		},

		defaultStats: {
			vmin: Number.POSITIVE_INFINITY, vmax: Number.NEGATIVE_INFINITY,
			hmin: Number.POSITIVE_INFINITY, hmax: Number.NEGATIVE_INFINITY
		},

		collectSimpleStats: function(series){
			var stats = lang.delegate(common.defaultStats);
			for(var i = 0; i < series.length; ++i){
				var run = series[i];
				for(var j = 0; j < run.data.length; j++){
					if(run.data[j] !== null){
						if(typeof run.data[j] == "number"){
							// 1D case
							var old_vmin = stats.vmin, old_vmax = stats.vmax;
							arr.forEach(run.data, function(val, i){
								if(val !== null){
									var x = i + 1, y = val;
									if(isNaN(y)){ y = 0; }
									stats.hmin = Math.min(stats.hmin, x);
									stats.hmax = Math.max(stats.hmax, x);
									stats.vmin = Math.min(stats.vmin, y);
									stats.vmax = Math.max(stats.vmax, y);
								}
							});
							if("ymin" in run){ stats.vmin = Math.min(old_vmin, run.ymin); }
							if("ymax" in run){ stats.vmax = Math.max(old_vmax, run.ymax); }
						}else{
							// 2D case
							var old_hmin = stats.hmin, old_hmax = stats.hmax,
								old_vmin = stats.vmin, old_vmax = stats.vmax;
							if(!("xmin" in run) || !("xmax" in run) || !("ymin" in run) || !("ymax" in run)){
								arr.forEach(run.data, function(val, i){
									if(val !== null){
										var x = "x" in val ? val.x : i + 1, y = val.y;
										if(isNaN(x)){ x = 0; }
										if(isNaN(y)){ y = 0; }
										stats.hmin = Math.min(stats.hmin, x);
										stats.hmax = Math.max(stats.hmax, x);
										stats.vmin = Math.min(stats.vmin, y);
										stats.vmax = Math.max(stats.vmax, y);
									}
								});
							}
							if("xmin" in run){ stats.hmin = Math.min(old_hmin, run.xmin); }
							if("xmax" in run){ stats.hmax = Math.max(old_hmax, run.xmax); }
							if("ymin" in run){ stats.vmin = Math.min(old_vmin, run.ymin); }
							if("ymax" in run){ stats.vmax = Math.max(old_vmax, run.ymax); }
						}

						break;
					}
				}
			}
			return stats;
		},

		calculateBarSize: function(/* Number */ availableSize, /* Object */ opt, /* Number? */ clusterSize){
			if(!clusterSize){
				clusterSize = 1;
			}
			var gap = opt.gap, size = (availableSize - 2 * gap) / clusterSize;
			if("minBarSize" in opt){
				size = Math.max(size, opt.minBarSize);
			}
			if("maxBarSize" in opt){
				size = Math.min(size, opt.maxBarSize);
			}
			size = Math.max(size, 1);
			gap = (availableSize - size * clusterSize) / 2;
			return {size: size, gap: gap};	// Object
		},

		collectStackedStats: function(series){
			// collect statistics
			var stats = lang.clone(common.defaultStats);
			if(series.length){
				// 1st pass: find the maximal length of runs
				stats.hmin = Math.min(stats.hmin, 1);
				stats.hmax = df.foldl(series, "seed, run -> Math.max(seed, run.data.length)", stats.hmax);
				// 2nd pass: stack values
				for(var i = 0; i < stats.hmax; ++i){
					var v = series[0].data[i];
					v = v && (typeof v == "number" ? v : v.y);
					if(isNaN(v)){ v = 0; }
					stats.vmin = Math.min(stats.vmin, v);
					for(var j = 1; j < series.length; ++j){
						var t = series[j].data[i];
						t = t && (typeof t == "number" ? t : t.y);
						if(isNaN(t)){ t = 0; }
						v += t;
					}
					stats.vmax = Math.max(stats.vmax, v);
				}
			}
			return stats;
		},

		curve: function(/* Number[] */a, /* Number|String */tension){
			//	FIX for #7235, submitted by Enzo Michelangeli.
			//	Emulates the smoothing algorithms used in a famous, unnamed spreadsheet
			//		program ;)
			var array = a.slice(0);
			if(tension == "x") {
				array[array.length] = array[0];   // add a last element equal to the first, closing the loop
			}
			var p=arr.map(array, function(item, i){
				if(i==0){ return "M" + item.x + "," + item.y; }
				if(!isNaN(tension)) { // use standard Dojo smoothing in tension is numeric
					var dx=item.x-array[i-1].x, dy=array[i-1].y;
					return "C"+(item.x-(tension-1)*(dx/tension))+","+dy+" "+(item.x-(dx/tension))+","+item.y+" "+item.x+","+item.y;
				} else if(tension == "X" || tension == "x" || tension == "S") {
					// use Excel "line smoothing" algorithm (http://xlrotor.com/resources/files.shtml)
					var p0, p1 = array[i-1], p2 = array[i], p3;
					var bz1x, bz1y, bz2x, bz2y;
					var f = 1/6;
					if(i==1) {
						if(tension == "x") {
							p0 = array[array.length-2];
						} else { // "tension == X || tension == "S"
							p0 = p1;
						}
						f = 1/3;
					} else {
						p0 = array[i-2];
					}
					if(i==(array.length-1)) {
						if(tension == "x") {
							p3 = array[1];
						} else { // "tension == X || tension == "S"
							p3 = p2;
						}
						f = 1/3;
					} else {
						p3 = array[i+1];
					}
					var p1p2 = Math.sqrt((p2.x-p1.x)*(p2.x-p1.x)+(p2.y-p1.y)*(p2.y-p1.y));
					var p0p2 = Math.sqrt((p2.x-p0.x)*(p2.x-p0.x)+(p2.y-p0.y)*(p2.y-p0.y));
					var p1p3 = Math.sqrt((p3.x-p1.x)*(p3.x-p1.x)+(p3.y-p1.y)*(p3.y-p1.y));

					var p0p2f = p0p2 * f;
					var p1p3f = p1p3 * f;

					if(p0p2f > p1p2/2 && p1p3f > p1p2/2) {
						p0p2f = p1p2/2;
						p1p3f = p1p2/2;
					} else if(p0p2f > p1p2/2) {
						p0p2f = p1p2/2;
						p1p3f = p1p2/2 * p1p3/p0p2;
					} else if(p1p3f > p1p2/2) {
						p1p3f = p1p2/2;
						p0p2f = p1p2/2 * p0p2/p1p3;
					}

					if(tension == "S") {
						if(p0 == p1) { p0p2f = 0; }
						if(p2 == p3) { p1p3f = 0; }
					}

					bz1x = p1.x + p0p2f*(p2.x - p0.x)/p0p2;
					bz1y = p1.y + p0p2f*(p2.y - p0.y)/p0p2;
					bz2x = p2.x - p1p3f*(p3.x - p1.x)/p1p3;
					bz2y = p2.y - p1p3f*(p3.y - p1.y)/p1p3;
				}
				return "C"+(bz1x+","+bz1y+" "+bz2x+","+bz2y+" "+p2.x+","+p2.y);
			});
			return p.join(" ");
		},
		
		getLabel: function(/*Number*/number, /*Boolean*/fixed, /*Number*/precision){
			return sc.doIfLoaded("dojo/number", function(numberLib){
				return (fixed ? numberLib.format(number, {places : precision}) :
					numberLib.format(number)) || "";
			}, function(){
				return fixed ? number.toFixed(precision) : number.toString();
			});
		}
	});
});

},
'dojox/gfx/shape':function(){
define(["./_base", "dojo/_base/lang", "dojo/_base/declare", "dojo/_base/kernel", "dojo/_base/sniff",
	"dojo/on", "dojo/_base/array", "dojo/dom-construct", "dojo/_base/Color", "./matrix" ],
	function(g, lang, declare, kernel, has, on, arr, domConstruct, Color, matrixLib){

	var shape = g.shape = {
		// summary:
		//		This module contains the core graphics Shape API.
		//		Different graphics renderer implementation modules (svg, canvas, vml, silverlight, etc.) extend this
		//		basic api to provide renderer-specific implementations for each shape.
	};

	shape.Shape = declare("dojox.gfx.shape.Shape", null, {
		// summary:
		//		a Shape object, which knows how to apply
		//		graphical attributes and transformations
	
		constructor: function(){
			// rawNode: Node
			//		underlying graphics-renderer-specific implementation object (if applicable)
			this.rawNode = null;

			// shape: Object
			//		an abstract shape object
			//		(see dojox/gfx.defaultPath,
			//		dojox/gfx.defaultPolyline,
			//		dojox/gfx.defaultRect,
			//		dojox/gfx.defaultEllipse,
			//		dojox/gfx.defaultCircle,
			//		dojox/gfx.defaultLine,
			//		or dojox/gfx.defaultImage)
			this.shape = null;
	
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a transformation matrix
			this.matrix = null;
	
			// fillStyle: dojox/gfx.Fill
			//		a fill object
			//		(see dojox/gfx.defaultLinearGradient,
			//		dojox/gfx.defaultRadialGradient,
			//		dojox/gfx.defaultPattern,
			//		or dojo/Color)
			this.fillStyle = null;
	
			// strokeStyle: dojox/gfx.Stroke
			//		a stroke object
			//		(see dojox/gfx.defaultStroke)
			this.strokeStyle = null;
	
			// bbox: dojox/gfx.Rectangle
			//		a bounding box of this shape
			//		(see dojox/gfx.defaultRect)
			this.bbox = null;
	
			// virtual group structure
	
			// parent: Object
			//		a parent or null
			//		(see dojox/gfx/shape.Surface,
			//		or dojox/gfx.Group)
			this.parent = null;
	
			// parentMatrix: dojox/gfx/matrix.Matrix2D
			//		a transformation matrix inherited from the parent
			this.parentMatrix = null;

			if(has("gfxRegistry")){
				var uid = shape.register(this);
				this.getUID = function(){
					return uid;
				}
			}
		},
		
		destroy: function(){
			// summary:
			//		Releases all internal resources owned by this shape. Once this method has been called,
			//		the instance is considered destroyed and should not be used anymore.
			if(has("gfxRegistry")){
				shape.dispose(this);
			}
			if(this.rawNode && "__gfxObject__" in this.rawNode){
				this.rawNode.__gfxObject__ = null;
			}
			this.rawNode = null;
		},
	
		// trivial getters
	
		getNode: function(){
			// summary:
			//		Different graphics rendering subsystems implement shapes in different ways.  This
			//		method provides access to the underlying graphics subsystem object.  Clients calling this
			//		method and using the return value must be careful not to try sharing or using the underlying node
			//		in a general way across renderer implementation.
			//		Returns the underlying graphics Node, or null if no underlying graphics node is used by this shape.
			return this.rawNode; // Node
		},
		getShape: function(){
			// summary:
			//		returns the current Shape object or null
			//		(see dojox/gfx.defaultPath,
			//		dojox/gfx.defaultPolyline,
			//		dojox/gfx.defaultRect,
			//		dojox/gfx.defaultEllipse,
			//		dojox/gfx.defaultCircle,
			//		dojox/gfx.defaultLine,
			//		or dojox/gfx.defaultImage)
			return this.shape; // Object
		},
		getTransform: function(){
			// summary:
			//		Returns the current transformation matrix applied to this Shape or null
			return this.matrix;	// dojox/gfx/matrix.Matrix2D
		},
		getFill: function(){
			// summary:
			//		Returns the current fill object or null
			//		(see dojox/gfx.defaultLinearGradient,
			//		dojox/gfx.defaultRadialGradient,
			//		dojox/gfx.defaultPattern,
			//		or dojo/Color)
			return this.fillStyle;	// Object
		},
		getStroke: function(){
			// summary:
			//		Returns the current stroke object or null
			//		(see dojox/gfx.defaultStroke)
			return this.strokeStyle;	// Object
		},
		getParent: function(){
			// summary:
			//		Returns the parent Shape, Group or null if this Shape is unparented.
			//		(see dojox/gfx/shape.Surface,
			//		or dojox/gfx.Group)
			return this.parent;	// Object
		},
		getBoundingBox: function(){
			// summary:
			//		Returns the bounding box Rectangle for this shape or null if a BoundingBox cannot be
			//		calculated for the shape on the current renderer or for shapes with no geometric area (points).
			//		A bounding box is a rectangular geometric region
			//		defining the X and Y extent of the shape.
			//		(see dojox/gfx.defaultRect)
			//		Note that this method returns a direct reference to the attribute of this instance. Therefore you should
			//		not modify its value directly but clone it instead.
			return this.bbox;	// dojox/gfx.Rectangle
		},
		getTransformedBoundingBox: function(){
			// summary:
			//		returns an array of four points or null
			//		four points represent four corners of the untransformed bounding box
			var b = this.getBoundingBox();
			if(!b){
				return null;	// null
			}
			var m = this._getRealMatrix(),
				gm = matrixLib;
			return [	// Array
					gm.multiplyPoint(m, b.x, b.y),
					gm.multiplyPoint(m, b.x + b.width, b.y),
					gm.multiplyPoint(m, b.x + b.width, b.y + b.height),
					gm.multiplyPoint(m, b.x, b.y + b.height)
				];
		},
		getEventSource: function(){
			// summary:
			//		returns a Node, which is used as
			//		a source of events for this shape
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			return this.rawNode;	// Node
		},
	
		// empty settings
		
		setClip: function(clip){
			// summary:
			//		sets the clipping area of this shape.
			// description:
			//		The clipping area defines the shape area that will be effectively visible. Everything that
			//		would be drawn outside of the clipping area will not be rendered.
			//		The possible clipping area types are rectangle, ellipse, polyline and path, but all are not
			//		supported by all the renderers. vml only supports rectangle clipping, while the gfx silverlight renderer does not
			//		support path clipping.
			//		The clip parameter defines the clipping area geometry, and should be an object with the following properties:
			//
			//		- {x:Number, y:Number, width:Number, height:Number} for rectangular clip
			//		- {cx:Number, cy:Number, rx:Number, ry:Number} for ellipse clip
			//		- {points:Array} for polyline clip
			//		- {d:String} for a path clip.
			//
			//		The clip geometry coordinates are expressed in the coordinate system used to draw the shape. In other
			//		words, the clipping area is defined in the shape parent coordinate system and the shape transform is automatically applied.
			// example:
			//		The following example shows how to clip a gfx image with all the possible clip geometry: a rectangle,
			//		an ellipse, a circle (using the ellipse geometry), a polyline and a path:
			//
			//	|	surface.createImage({src:img, width:200,height:200}).setClip({x:10,y:10,width:50,height:50});
			//	|	surface.createImage({src:img, x:100,y:50,width:200,height:200}).setClip({cx:200,cy:100,rx:20,ry:30});
			//	|	surface.createImage({src:img, x:0,y:350,width:200,height:200}).setClip({cx:100,cy:425,rx:60,ry:60});
			//	|	surface.createImage({src:img, x:300,y:0,width:200,height:200}).setClip({points:[350,0,450,50,380,130,300,110]});
			//	|	surface.createImage({src:img, x:300,y:350,width:200,height:200}).setClip({d:"M 350,350 C314,414 317,557 373,450.0000 z"});

			// clip: Object
			//		an object that defines the clipping geometry, or null to remove clip.
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			this.clip = clip;
		},
		
		getClip: function(){
			return this.clip;
		},
	
		setShape: function(shape){
			// summary:
			//		sets a shape object
			//		(the default implementation simply ignores it)
			// shape: Object
			//		a shape object
			//		(see dojox/gfx.defaultPath,
			//		dojox/gfx.defaultPolyline,
			//		dojox/gfx.defaultRect,
			//		dojox/gfx.defaultEllipse,
			//		dojox/gfx.defaultCircle,
			//		dojox/gfx.defaultLine,
			//		or dojox/gfx.defaultImage)
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			this.shape = g.makeParameters(this.shape, shape);
			this.bbox = null;
			return this;	// self
		},
		setFill: function(fill){
			// summary:
			//		sets a fill object
			//		(the default implementation simply ignores it)
			// fill: Object
			//		a fill object
			//		(see dojox/gfx.defaultLinearGradient,
			//		dojox/gfx.defaultRadialGradient,
			//		dojox/gfx.defaultPattern,
			//		or dojo/_base/Color)
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			if(!fill){
				// don't fill
				this.fillStyle = null;
				return this;	// self
			}
			var f = null;
			if(typeof(fill) == "object" && "type" in fill){
				// gradient or pattern
				switch(fill.type){
					case "linear":
						f = g.makeParameters(g.defaultLinearGradient, fill);
						break;
					case "radial":
						f = g.makeParameters(g.defaultRadialGradient, fill);
						break;
					case "pattern":
						f = g.makeParameters(g.defaultPattern, fill);
						break;
				}
			}else{
				// color object
				f = g.normalizeColor(fill);
			}
			this.fillStyle = f;
			return this;	// self
		},
		setStroke: function(stroke){
			// summary:
			//		sets a stroke object
			//		(the default implementation simply ignores it)
			// stroke: Object
			//		a stroke object
			//		(see dojox/gfx.defaultStroke)
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			if(!stroke){
				// don't stroke
				this.strokeStyle = null;
				return this;	// self
			}
			// normalize the stroke
			if(typeof stroke == "string" || lang.isArray(stroke) || stroke instanceof Color){
				stroke = {color: stroke};
			}
			var s = this.strokeStyle = g.makeParameters(g.defaultStroke, stroke);
			s.color = g.normalizeColor(s.color);
			return this;	// self
		},
		setTransform: function(matrix){
			// summary:
			//		sets a transformation matrix
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a matrix or a matrix-like object
			//		(see an argument of dojox/gfx/matrix.Matrix2D
			//		constructor for a list of acceptable arguments)
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			this.matrix = matrixLib.clone(matrix ? matrixLib.normalize(matrix) : matrixLib.identity);
			return this._applyTransform();	// self
		},
	
		_applyTransform: function(){
			// summary:
			//		physically sets a matrix
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			return this;	// self
		},
	
		// z-index
	
		moveToFront: function(){
			// summary:
			//		moves a shape to front of its parent's list of shapes
			var p = this.getParent();
			if(p){
				p._moveChildToFront(this);
				this._moveToFront();	// execute renderer-specific action
			}
			return this;	// self
		},
		moveToBack: function(){
			// summary:
			//		moves a shape to back of its parent's list of shapes
			var p = this.getParent();
			if(p){
				p._moveChildToBack(this);
				this._moveToBack();	// execute renderer-specific action
			}
			return this;
		},
		_moveToFront: function(){
			// summary:
			//		renderer-specific hook, see dojox/gfx/shape.Shape.moveToFront()
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
		},
		_moveToBack: function(){
			// summary:
			//		renderer-specific hook, see dojox/gfx/shape.Shape.moveToFront()
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
		},
	
		// apply left & right transformation
	
		applyRightTransform: function(matrix){
			// summary:
			//		multiplies the existing matrix with an argument on right side
			//		(this.matrix * matrix)
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a matrix or a matrix-like object
			//		(see an argument of dojox/gfx/matrix.Matrix2D
			//		constructor for a list of acceptable arguments)
			return matrix ? this.setTransform([this.matrix, matrix]) : this;	// self
		},
		applyLeftTransform: function(matrix){
			// summary:
			//		multiplies the existing matrix with an argument on left side
			//		(matrix * this.matrix)
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a matrix or a matrix-like object
			//		(see an argument of dojox/gfx/matrix.Matrix2D
			//		constructor for a list of acceptable arguments)
			return matrix ? this.setTransform([matrix, this.matrix]) : this;	// self
		},
		applyTransform: function(matrix){
			// summary:
			//		a shortcut for dojox/gfx/shape.Shape.applyRightTransform
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a matrix or a matrix-like object
			//		(see an argument of dojox/gfx/matrix.Matrix2D
			//		constructor for a list of acceptable arguments)
			return matrix ? this.setTransform([this.matrix, matrix]) : this;	// self
		},
	
		// virtual group methods
	
		removeShape: function(silently){
			// summary:
			//		removes the shape from its parent's list of shapes
			// silently: Boolean
			//		if true, do not redraw a picture yet
			if(this.parent){
				this.parent.remove(this, silently);
			}
			return this;	// self
		},
		_setParent: function(parent, matrix){
			// summary:
			//		sets a parent
			// parent: Object
			//		a parent or null
			//		(see dojox/gfx/shape.Surface,
			//		or dojox/gfx.Group)
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a 2D matrix or a matrix-like object
			this.parent = parent;
			return this._updateParentMatrix(matrix);	// self
		},
		_updateParentMatrix: function(matrix){
			// summary:
			//		updates the parent matrix with new matrix
			// matrix: dojox/gfx/Matrix2D
			//		a 2D matrix or a matrix-like object
			this.parentMatrix = matrix ? matrixLib.clone(matrix) : null;
			return this._applyTransform();	// self
		},
		_getRealMatrix: function(){
			// summary:
			//		returns the cumulative ('real') transformation matrix
			//		by combining the shape's matrix with its parent's matrix
			var m = this.matrix;
			var p = this.parent;
			while(p){
				if(p.matrix){
					m = matrixLib.multiply(p.matrix, m);
				}
				p = p.parent;
			}
			return m;	// dojox/gfx/matrix.Matrix2D
		}
	});
	
	shape._eventsProcessing = {
		on: function(type, listener){
			//	summary:
			//		Connects an event to this shape.

			return on(this.getEventSource(), type, shape.fixCallback(this, g.fixTarget, listener));
		},

		connect: function(name, object, method){
			// summary:
			//		connects a handler to an event on this shape
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			// redirect to fixCallback to normalize events and add the gfxTarget to the event. The latter
			// is done by dojox/gfx.fixTarget which is defined by each renderer
			if(name.substring(0, 2) == "on"){
				name = name.substring(2);
			}
			return this.on(name, method ? lang.hitch(object, method) : object);
		},

		disconnect: function(token){
			// summary:
			//		connects a handler by token from an event on this shape
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
	
			return token.remove();
		}
	};
	
	shape.fixCallback = function(gfxElement, fixFunction, scope, method){
		// summary:
		//		Wraps the callback to allow for tests and event normalization
		//		before it gets invoked. This is where 'fixTarget' is invoked.
		// tags:
		//      private
		// gfxElement: Object
		//		The GFX object that triggers the action (ex.:
		//		dojox/gfx.Surface and dojox/gfx/shape.Shape). A new event property
		//		'gfxTarget' is added to the event to reference this object.
		//		for easy manipulation of GFX objects by the event handlers.
		// fixFunction: Function
		//		The function that implements the logic to set the 'gfxTarget'
		//		property to the event. It should be 'dojox/gfx.fixTarget' for
		//		most of the cases
		// scope: Object
		//		Optional. The scope to be used when invoking 'method'. If
		//		omitted, a global scope is used.
		// method: Function|String
		//		The original callback to be invoked.
		if(!method){
			method = scope;
			scope = null;
		}
		if(lang.isString(method)){
			scope = scope || kernel.global;
			if(!scope[method]){ throw(['dojox.gfx.shape.fixCallback: scope["', method, '"] is null (scope="', scope, '")'].join('')); }
			return function(e){  
				return fixFunction(e,gfxElement) ? scope[method].apply(scope, arguments || []) : undefined; }; // Function
		}
		return !scope 
			? function(e){ 
				return fixFunction(e,gfxElement) ? method.apply(scope, arguments) : undefined; } 
			: function(e){ 
				return fixFunction(e,gfxElement) ? method.apply(scope, arguments || []) : undefined; }; // Function
	};
	lang.extend(shape.Shape, shape._eventsProcessing);
	
	shape.Container = {
		// summary:
		//		a container of shapes, which can be used
		//		as a foundation for renderer-specific groups, or as a way
		//		to logically group shapes (e.g, to propagate matricies)
	
		_init: function() {
			// children: Array
			//		a list of children
			this.children = [];
			this._batch = 0;
		},
	
		// group management
	
		openBatch: function() {
			// summary:
			//		starts a new batch, subsequent new child shapes will be held in
			//		the batch instead of appending to the container directly.
			// description:
			//		Because the canvas renderer has no DOM hierarchy, the canvas implementation differs
			//		such that it suspends the repaint requests for this container until the current batch is closed by a call to closeBatch().
			return this;
		},
		closeBatch: function() {
			// summary:
			//		submits the current batch, append all pending child shapes to DOM
			// description:
			//		On canvas, this method flushes the pending redraws queue.
			return this;
		},
		add: function(shape){
			// summary:
			//		adds a shape to the list
			// shape: dojox/gfx/shape.Shape
			//		the shape to add to the list
			var oldParent = shape.getParent();
			if(oldParent){
				oldParent.remove(shape, true);
			}
			this.children.push(shape);
			return shape._setParent(this, this._getRealMatrix());	// self
		},
		remove: function(shape, silently){
			// summary:
			//		removes a shape from the list
			// shape: dojox/gfx/shape.Shape
			//		the shape to remove
			// silently: Boolean
			//		if true, do not redraw a picture yet
			for(var i = 0; i < this.children.length; ++i){
				if(this.children[i] == shape){
					if(silently){
						// skip for now
					}else{
						shape.parent = null;
						shape.parentMatrix = null;
					}
					this.children.splice(i, 1);
					break;
				}
			}
			return this;	// self
		},
		clear: function(/*Boolean?*/ destroy){
			// summary:
			//		removes all shapes from a group/surface.
			// destroy: Boolean
			//		Indicates whether the children should be destroyed. Optional.
			var shape;
			for(var i = 0; i < this.children.length;++i){
				shape = this.children[i];
				shape.parent = null;
				shape.parentMatrix = null;
				if(destroy){
					shape.destroy();
				}
			}
			this.children = [];
			return this;	// self
		},
		getBoundingBox: function(){
			// summary:
			//		Returns the bounding box Rectangle for this shape.
			if(this.children){
				// if this is a composite shape, then sum up all the children
				var result = null;
				arr.forEach(this.children, function(shape){
					var bb = shape.getBoundingBox();
					if(bb){
						var ct = shape.getTransform();
						if(ct){
							bb = matrixLib.multiplyRectangle(ct, bb);
						}
						if(result){
							// merge two bbox 
							result.x = Math.min(result.x, bb.x);
							result.y = Math.min(result.y, bb.y);
							result.endX = Math.max(result.endX, bb.x + bb.width);
							result.endY = Math.max(result.endY, bb.y + bb.height);
						}else{
							// first bbox 
							result = {
								x: bb.x,
								y: bb.y,
								endX: bb.x + bb.width,
								endY: bb.y + bb.height
							};
						}
					}
				});
				if(result){
					result.width = result.endX - result.x;
					result.height = result.endY - result.y;
				}
				return result; // dojox/gfx.Rectangle
			}
			// unknown/empty bounding box, subclass shall override this impl 
			return null;
		},
		// moving child nodes
		_moveChildToFront: function(shape){
			// summary:
			//		moves a shape to front of the list of shapes
			// shape: dojox/gfx/shape.Shape
			//		one of the child shapes to move to the front
			for(var i = 0; i < this.children.length; ++i){
				if(this.children[i] == shape){
					this.children.splice(i, 1);
					this.children.push(shape);
					break;
				}
			}
			return this;	// self
		},
		_moveChildToBack: function(shape){
			// summary:
			//		moves a shape to back of the list of shapes
			// shape: dojox/gfx/shape.Shape
			//		one of the child shapes to move to the front
			for(var i = 0; i < this.children.length; ++i){
				if(this.children[i] == shape){
					this.children.splice(i, 1);
					this.children.unshift(shape);
					break;
				}
			}
			return this;	// self
		}
	};

	shape.Surface = declare("dojox.gfx.shape.Surface", null, {
		// summary:
		//		a surface object to be used for drawings
		constructor: function(){
			// underlying node
			this.rawNode = null;
			// the parent node
			this._parent = null;
			// the list of DOM nodes to be deleted in the case of destruction
			this._nodes = [];
			// the list of events to be detached in the case of destruction
			this._events = [];
		},
		destroy: function(){
			// summary:
			//		destroy all relevant external resources and release all
			//		external references to make this object garbage-collectible
			arr.forEach(this._nodes, domConstruct.destroy);
			this._nodes = [];
			arr.forEach(this._events, function(h){ if(h){ h.remove(); } });
			this._events = [];
			this.rawNode = null;	// recycle it in _nodes, if it needs to be recycled
			if(has("ie")){
				while(this._parent.lastChild){
					domConstruct.destroy(this._parent.lastChild);
				}
			}else{
				this._parent.innerHTML = "";
			}
			this._parent = null;
		},
		getEventSource: function(){
			// summary:
			//		returns a node, which can be used to attach event listeners
			return this.rawNode; // Node
		},
		_getRealMatrix: function(){
			// summary:
			//		always returns the identity matrix
			return null;	// dojox/gfx/Matrix2D
		},
		/*=====
		 setDimensions: function(width, height){
			 // summary:
			 //		sets the width and height of the rawNode
			 // width: String
			 //		width of surface, e.g., "100px"
			 // height: String
			 //		height of surface, e.g., "100px"
			 return this;	// self
		 },
		 getDimensions: function(){
			 // summary:
			 //     gets current width and height in pixels
			 // returns: Object
			 //     object with properties "width" and "height"
		 },
		 =====*/
		isLoaded: true,
		onLoad: function(/*dojox/gfx/shape.Surface*/ surface){
			// summary:
			//		local event, fired once when the surface is created
			//		asynchronously, used only when isLoaded is false, required
			//		only for Silverlight.
		},
		whenLoaded: function(/*Object|Null*/ context, /*Function|String*/ method){
			var f = lang.hitch(context, method);
			if(this.isLoaded){
				f(this);
			}else{
				on.once(this, "load", function(surface){
					f(surface);
				});
			}
		}
	});
	lang.extend(shape.Surface, shape._eventsProcessing);

	/*=====
	g.Point = declare("dojox/gfx.Point", null, {
		// summary:
		//		2D point for drawings - {x, y}
		// description:
		//		Do not use this object directly!
		//		Use the naked object instead: {x: 1, y: 2}.
	});

	g.Rectangle = declare("dojox.gfx.Rectangle", null, {
		// summary:
		//		rectangle - {x, y, width, height}
		// description:
		//		Do not use this object directly!
		//		Use the naked object instead: {x: 1, y: 2, width: 100, height: 200}.
	});
	 =====*/


	shape.Rect = declare("dojox.gfx.shape.Rect", shape.Shape, {
		// summary:
		//		a generic rectangle
		constructor: function(rawNode){
			// rawNode: Node
			//		The underlying graphics system object (typically a DOM Node)
			this.shape = g.getDefault("Rect");
			this.rawNode = rawNode;
		},
		getBoundingBox: function(){
			// summary:
			//		returns the bounding box (its shape in this case)
			return this.shape;	// dojox/gfx.Rectangle
		}
	});
	
	shape.Ellipse = declare("dojox.gfx.shape.Ellipse", shape.Shape, {
		// summary:
		//		a generic ellipse
		constructor: function(rawNode){
			// rawNode: Node
			//		a DOM Node
			this.shape = g.getDefault("Ellipse");
			this.rawNode = rawNode;
		},
		getBoundingBox: function(){
			// summary:
			//		returns the bounding box
			if(!this.bbox){
				var shape = this.shape;
				this.bbox = {x: shape.cx - shape.rx, y: shape.cy - shape.ry,
					width: 2 * shape.rx, height: 2 * shape.ry};
			}
			return this.bbox;	// dojox/gfx.Rectangle
		}
	});
	
	shape.Circle = declare("dojox.gfx.shape.Circle", shape.Shape, {
		// summary:
		//		a generic circle
		constructor: function(rawNode){
			// rawNode: Node
			//		a DOM Node
			this.shape = g.getDefault("Circle");
			this.rawNode = rawNode;
		},
		getBoundingBox: function(){
			// summary:
			//		returns the bounding box
			if(!this.bbox){
				var shape = this.shape;
				this.bbox = {x: shape.cx - shape.r, y: shape.cy - shape.r,
					width: 2 * shape.r, height: 2 * shape.r};
			}
			return this.bbox;	// dojox/gfx.Rectangle
		}
	});
	
	shape.Line = declare("dojox.gfx.shape.Line", shape.Shape, {
		// summary:
		//		a generic line (do not instantiate it directly)
		constructor: function(rawNode){
			// rawNode: Node
			//		a DOM Node
			this.shape = g.getDefault("Line");
			this.rawNode = rawNode;
		},
		getBoundingBox: function(){
			// summary:
			//		returns the bounding box
			if(!this.bbox){
				var shape = this.shape;
				this.bbox = {
					x:		Math.min(shape.x1, shape.x2),
					y:		Math.min(shape.y1, shape.y2),
					width:	Math.abs(shape.x2 - shape.x1),
					height:	Math.abs(shape.y2 - shape.y1)
				};
			}
			return this.bbox;	// dojox/gfx.Rectangle
		}
	});
	
	shape.Polyline = declare("dojox.gfx.shape.Polyline", shape.Shape, {
		// summary:
		//		a generic polyline/polygon (do not instantiate it directly)
		constructor: function(rawNode){
			// rawNode: Node
			//		a DOM Node
			this.shape = g.getDefault("Polyline");
			this.rawNode = rawNode;
		},
		setShape: function(points, closed){
			// summary:
			//		sets a polyline/polygon shape object
			// points: Object|Array
			//		a polyline/polygon shape object, or an array of points
			// closed: Boolean
			//		close the polyline to make a polygon
			if(points && points instanceof Array){
				this.inherited(arguments, [{points: points}]);
				if(closed && this.shape.points.length){
					this.shape.points.push(this.shape.points[0]);
				}
			}else{
				this.inherited(arguments, [points]);
			}
			return this;	// self
		},
		_normalizePoints: function(){
			// summary:
			//		normalize points to array of {x:number, y:number}
			var p = this.shape.points, l = p && p.length;
			if(l && typeof p[0] == "number"){
				var points = [];
				for(var i = 0; i < l; i += 2){
					points.push({x: p[i], y: p[i + 1]});
				}
				this.shape.points = points;
			}
		},
		getBoundingBox: function(){
			// summary:
			//		returns the bounding box
			if(!this.bbox && this.shape.points.length){
				var p = this.shape.points;
				var l = p.length;
				var t = p[0];
				var bbox = {l: t.x, t: t.y, r: t.x, b: t.y};
				for(var i = 1; i < l; ++i){
					t = p[i];
					if(bbox.l > t.x) bbox.l = t.x;
					if(bbox.r < t.x) bbox.r = t.x;
					if(bbox.t > t.y) bbox.t = t.y;
					if(bbox.b < t.y) bbox.b = t.y;
				}
				this.bbox = {
					x:		bbox.l,
					y:		bbox.t,
					width:	bbox.r - bbox.l,
					height:	bbox.b - bbox.t
				};
			}
			return this.bbox;	// dojox/gfx.Rectangle
		}
	});
	
	shape.Image = declare("dojox.gfx.shape.Image", shape.Shape, {
		// summary:
		//		a generic image (do not instantiate it directly)
		constructor: function(rawNode){
			// rawNode: Node
			//		a DOM Node
			this.shape = g.getDefault("Image");
			this.rawNode = rawNode;
		},
		getBoundingBox: function(){
			// summary:
			//		returns the bounding box (its shape in this case)
			return this.shape;	// dojox/gfx.Rectangle
		},
		setStroke: function(){
			// summary:
			//		ignore setting a stroke style
			return this;	// self
		},
		setFill: function(){
			// summary:
			//		ignore setting a fill style
			return this;	// self
		}
	});
	
	shape.Text = declare(shape.Shape, {
		// summary:
		//		a generic text (do not instantiate it directly)
		constructor: function(rawNode){
			// rawNode: Node
			//		a DOM Node
			this.fontStyle = null;
			this.shape = g.getDefault("Text");
			this.rawNode = rawNode;
		},
		getFont: function(){
			// summary:
			//		returns the current font object or null
			return this.fontStyle;	// Object
		},
		setFont: function(newFont){
			// summary:
			//		sets a font for text
			// newFont: Object
			//		a font object (see dojox/gfx.defaultFont) or a font string
			this.fontStyle = typeof newFont == "string" ? g.splitFontString(newFont) :
				g.makeParameters(g.defaultFont, newFont);
			this._setFont();
			return this;	// self
		},
		getBoundingBox: function(){
			var bbox = null, s = this.getShape();
			if(s.text){
				bbox = g._base._computeTextBoundingBox(this);
			}
			return bbox;
		}
	});
	
	shape.Creator = {
		// summary:
		//		shape creators
		createShape: function(shape){
			// summary:
			//		creates a shape object based on its type; it is meant to be used
			//		by group-like objects
			// shape: Object
			//		a shape descriptor object
			// returns: dojox/gfx/shape.Shape | Null
			//      a fully instantiated surface-specific Shape object
			switch(shape.type){
				case g.defaultPath.type:		return this.createPath(shape);
				case g.defaultRect.type:		return this.createRect(shape);
				case g.defaultCircle.type:	    return this.createCircle(shape);
				case g.defaultEllipse.type:	    return this.createEllipse(shape);
				case g.defaultLine.type:		return this.createLine(shape);
				case g.defaultPolyline.type:	return this.createPolyline(shape);
				case g.defaultImage.type:		return this.createImage(shape);
				case g.defaultText.type:		return this.createText(shape);
				case g.defaultTextPath.type:	return this.createTextPath(shape);
			}
			return null;
		},
		createGroup: function(){
			// summary:
			//		creates a group shape
			return this.createObject(g.Group);	// dojox/gfx/Group
		},
		createRect: function(rect){
			// summary:
			//		creates a rectangle shape
			// rect: Object
			//		a path object (see dojox/gfx.defaultRect)
			return this.createObject(g.Rect, rect);	// dojox/gfx/shape.Rect
		},
		createEllipse: function(ellipse){
			// summary:
			//		creates an ellipse shape
			// ellipse: Object
			//		an ellipse object (see dojox/gfx.defaultEllipse)
			return this.createObject(g.Ellipse, ellipse);	// dojox/gfx/shape.Ellipse
		},
		createCircle: function(circle){
			// summary:
			//		creates a circle shape
			// circle: Object
			//		a circle object (see dojox/gfx.defaultCircle)
			return this.createObject(g.Circle, circle);	// dojox/gfx/shape.Circle
		},
		createLine: function(line){
			// summary:
			//		creates a line shape
			// line: Object
			//		a line object (see dojox/gfx.defaultLine)
			return this.createObject(g.Line, line);	// dojox/gfx/shape.Line
		},
		createPolyline: function(points){
			// summary:
			//		creates a polyline/polygon shape
			// points: Object
			//		a points object (see dojox/gfx.defaultPolyline)
			//		or an Array of points
			return this.createObject(g.Polyline, points);	// dojox/gfx/shape.Polyline
		},
		createImage: function(image){
			// summary:
			//		creates a image shape
			// image: Object
			//		an image object (see dojox/gfx.defaultImage)
			return this.createObject(g.Image, image);	// dojox/gfx/shape.Image
		},
		createText: function(text){
			// summary:
			//		creates a text shape
			// text: Object
			//		a text object (see dojox/gfx.defaultText)
			return this.createObject(g.Text, text);	// dojox/gfx/shape.Text
		},
		createPath: function(path){
			// summary:
			//		creates a path shape
			// path: Object
			//		a path object (see dojox/gfx.defaultPath)
			return this.createObject(g.Path, path);	// dojox/gfx/shape.Path
		},
		createTextPath: function(text){
			// summary:
			//		creates a text shape
			// text: Object
			//		a textpath object (see dojox/gfx.defaultTextPath)
			return this.createObject(g.TextPath, {}).setText(text);	// dojox/gfx/shape.TextPath
		},
		createObject: function(shapeType, rawShape){
			// summary:
			//		creates an instance of the passed shapeType class
			// shapeType: Function
			//		a class constructor to create an instance of
			// rawShape: Object 
			//		properties to be passed in to the classes 'setShape' method
	
			// SHOULD BE RE-IMPLEMENTED BY THE RENDERER!
			return null;	// dojox/gfx/shape.Shape
		}
	};
	
	/*=====
	 lang.extend(shape.Surface, shape.Container);
	 lang.extend(shape.Surface, shape.Creator);

	 g.Group = declare(shape.Shape, {
		// summary:
		//		a group shape, which can be used
		//		to logically group shapes (e.g, to propagate matricies)
	});
	lang.extend(g.Group, shape.Container);
	lang.extend(g.Group, shape.Creator);

	g.Rect     = shape.Rect;
	g.Circle   = shape.Circle;
	g.Ellipse  = shape.Ellipse;
	g.Line     = shape.Line;
	g.Polyline = shape.Polyline;
	g.Text     = shape.Text;
	g.Surface  = shape.Surface;
	=====*/

	return shape;
});

},
'money/nls/app.nls':function(){
define({
  root: {
	//for v0.3.x
	animation	: 'Animation effects',
	animHelp	: 'Animation effects can make things even more beautiful.',
	transition	: 'Transition effects',
	back		: 'Back',
	
	done		: 'DONE',
	selectDate	: 'Select date',
	
	expence		: 'Expence',
	income		: 'Income',
	transfer	: 'Transfer',	
	
	remove		: 'Remove transaction',
	
	monthly		: 'Transactions (monthly)',
	daily		: 'Back',
	details		: 'Transaction details',
	
	type		: 'Type',
	
	settings	: "Settings",
	summary		: "Reports",
	transactions: "Transactions",
	
	//months
	jan3	: 'Jan',
	feb3	: 'Feb',
	mar3	: 'Mar',
	apr3	: 'Apr',
	may3	: 'May',
	jun3	: 'Jun',
	jul3	: 'Jul',
	aug3	: 'Aug',
	sep3	: 'Sep',
	oct3	: 'Oct',
	nov3	: 'Nov',
	dec3	: 'Dec',	
	
	jan	: 'January',
	feb	: 'February',
	mar	: 'March',
	apr	: 'April',
	may	: 'May',
	jun	: 'June',
	jul	: 'July',
	aug	: 'August',
	sep	: 'September',
	oct	: 'October',
	nov	: 'November',
	dec	: 'December'	
	
  },
  "en-us" : true,
  "ru-ru" : true
});

},
'money/nls/en-us/app.nls':function(){
define({
	//the same as root
 
});

},
'money/nls/ru-ru/app.nls':function(){
define({
	//for v0.3.x
	animation	: 'Настройки анимации',
	animHelp	: 'Здесь можно сделать вещи более приятными.',
	transition	: 'Эффекты переходов',
	
	done		: 'ГОТОВО',
	selectDate	: 'Выберите дату',
	
	expence		: 'Расход',
	income		: 'Доход',
	transfer	: 'Перевод',
	
	remove		: 'Удалить транзакцию',
	
	settings	: "Настройки",
	summary		: "Отчеты",
	transactions: "Транзакции",
	
	monthly		: 'Транзакции (период)',
	daily		: 'Назад',
	details		: 'Детали транзакции',
	
	//months
	jan3	: 'Янв',
	feb3	: 'Фев',
	mar3	: 'Мар',
	apr3	: 'Апр',
	may3	: 'Май',
	jun3	: 'Июн',
	jul3	: 'Июл',
	aug3	: 'Авг',
	sep3	: 'Сен',
	oct3	: 'Окт',
	nov3	: 'Ноя',
	dec3	: 'Дек',
	
	
	jan	: 'Январь',
	feb	: 'Февраль',
	mar	: 'Март',
	apr	: 'Апрель',
	may	: 'Май',
	jun	: 'Июнь',
	jul	: 'Июль',
	aug	: 'Август',
	sep	: 'Сентябрь',
	oct	: 'Октябрь',
	nov	: 'Ноябрь',
	dec	: 'Декабрь'
	
});

},
'dojox/gfx/canvasWithEvents':function(){
define(["dojo/_base/lang", "dojo/_base/declare", "dojo/has", "dojo/on", "dojo/aspect", "dojo/touch", "dojo/_base/Color", "dojo/dom",
		"dojo/dom-geometry", "dojo/_base/window", "./_base","./canvas", "./shape", "./matrix"],
function(lang, declare, has, on, aspect, touch, Color, dom, domGeom, win, g, canvas, shapeLib, m){
	function makeFakeEvent(event){
		// summary:
		//		Generates a "fake", fully mutable event object by copying the properties from an original host Event
		//		object to a new standard JavaScript object.

		var fakeEvent = {};
		for(var k in event){
			if(typeof event[k] === "function"){
				// Methods (like preventDefault) must be invoked on the original event object, or they will not work
				fakeEvent[k] = lang.hitch(event, k);
			}
			else{
				fakeEvent[k] = event[k];
			}
		}
		return fakeEvent;
	}

	// Browsers that implement the current (January 2013) WebIDL spec allow Event object properties to be mutated
	// using Object.defineProperty; some older WebKits (Safari 6-) and at least IE10- do not follow the spec. Direct
	// mutation is, of course, much faster when it can be done.
    has.add("dom-mutableEvents", function(){
        var event = document.createEvent("UIEvents");
        try {
            if(Object.defineProperty){
                Object.defineProperty(event, "type", { value: "foo" });
            }else{
                event.type = "foo";
            }
            return event.type === "foo";
        }catch(e){
            return false;
        }
    });

	var canvasWithEvents = g.canvasWithEvents = {
		// summary:
		//		This the graphics rendering bridge for W3C Canvas compliant browsers which extends
		//		the basic canvas drawing renderer bridge to add additional support for graphics events
		//		on Shapes.
		//		Since Canvas is an immediate mode graphics api, with no object graph or
		//		eventing capabilities, use of the canvas module alone will only add in drawing support.
		//		This additional module, canvasWithEvents extends this module with additional support
		//		for handling events on Canvas.  By default, the support for events is now included
		//		however, if only drawing capabilities are needed, canvas event module can be disabled
		//		using the dojoConfig option, canvasEvents:true|false.
	};

	canvasWithEvents.Shape = declare("dojox.gfx.canvasWithEvents.Shape", canvas.Shape, {
		_testInputs: function(/* Object */ ctx, /* Array */ pos){
			if(this.clip || (!this.canvasFill && this.strokeStyle)){
				// pixel-based until a getStrokedPath-like api is available on the path
				this._hitTestPixel(ctx, pos);
			}else{
				this._renderShape(ctx);
				var length = pos.length,
					t = this.getTransform();

				for(var i = 0; i < length; ++i){
					var input = pos[i];
					// already hit
					if(input.target){continue;}
					var x = input.x,
						y = input.y,
						p = t ? m.multiplyPoint(m.invert(t), x, y) : { x: x, y: y };
					input.target = this._hitTestGeometry(ctx, p.x, p.y);
				}
			}
		},

		_hitTestPixel: function(/* Object */ ctx, /* Array */ pos){
			for(var i = 0; i < pos.length; ++i){
				var input = pos[i];
				if(input.target){continue;}
				var x = input.x,
					y = input.y;
				ctx.clearRect(0,0,1,1);
				ctx.save();
				ctx.translate(-x, -y);
				this._render(ctx, true);
				input.target = ctx.getImageData(0, 0, 1, 1).data[0] ? this : null;
				ctx.restore();
			}
		},

		_hitTestGeometry: function(ctx, x, y){
			return ctx.isPointInPath(x, y) ? this : null;
		},

		_renderFill: function(/* Object */ ctx, /* Boolean */ apply){
			// summary:
			//		render fill for the shape
			// ctx:
			//		a canvas context object
			// apply:
			//		whether ctx.fill() shall be called
			if(ctx.pickingMode){
				if("canvasFill" in this && apply){
					ctx.fill();
				}
				return;
			}
			this.inherited(arguments);
		},

		_renderStroke: function(/* Object */ ctx){
			// summary:
			//		render stroke for the shape
			// ctx:
			//		a canvas context object
			// apply:
			//		whether ctx.stroke() shall be called
			if(this.strokeStyle && ctx.pickingMode){
				var c = this.strokeStyle.color;
				try{
					this.strokeStyle.color = new Color(ctx.strokeStyle);
					this.inherited(arguments);
				}finally{
					this.strokeStyle.color = c;
				}
			}else{
				this.inherited(arguments);
			}
		},

		// events

		getEventSource: function(){
			return this.surface.rawNode;
		},

		on: function(type, listener){
			// summary:
			//		Connects an event to this shape.

			var expectedTarget = this.rawNode;

			// note that event listeners' targets are automatically fixed up in the canvas's addEventListener method
			return on(this.getEventSource(), type, function(event){
				if(dom.isDescendant(event.target, expectedTarget)){
					listener.apply(expectedTarget, arguments);
				}
			});
		},

		connect: function(name, object, method){
			// summary:
			//		Deprecated. Connects a handler to an event on this shape. Use `on` instead.

			if(name.substring(0, 2) == "on"){
				name = name.substring(2);
			}
			return this.on(name, method ? lang.hitch(object, method) : lang.hitch(null, object));
		},

		disconnect: function(handle){
			// summary:
			//		Deprecated. Disconnects an event handler. Use `handle.remove` instead.

			handle.remove();
		}
	});

	canvasWithEvents.Group = declare("dojox.gfx.canvasWithEvents.Group", [canvasWithEvents.Shape, canvas.Group], {
		_testInputs: function(/*Object*/ ctx, /*Array*/ pos){
			var children = this.children,
				t = this.getTransform(),
				i,
				j,
				input;

			if(children.length === 0){
				return;
			}
			var posbk = [];
			for(i = 0; i < pos.length; ++i){
				input = pos[i];
				// backup position before transform applied
				posbk[i] = {
					x: input.x,
					y: input.y
				};
				if(input.target){continue;}
				var x = input.x, y = input.y;
				var p = t ? m.multiplyPoint(m.invert(t), x, y) : { x: x, y: y };
				input.x = p.x;
				input.y = p.y;
			}
			for(i = children.length - 1; i >= 0; --i){
				children[i]._testInputs(ctx, pos);
				// does it need more hit tests ?
				var allFound = true;
				for(j = 0; j < pos.length; ++j){
					if(pos[j].target == null){
						allFound = false;
						break;
					}
				}
				if(allFound){
					break;
				}
			}
			if(this.clip){
				// filter positive hittests against the group clipping area
				for(i = 0; i < pos.length; ++i){
					input = pos[i];
					input.x = posbk[i].x;
					input.y = posbk[i].y;
					if(input.target){
						ctx.clearRect(0,0,1,1);
						ctx.save();
						ctx.translate(-input.x, -input.y);
						this._render(ctx, true);
						if(!ctx.getImageData(0, 0, 1, 1).data[0]){
							input.target = null;
						}
						ctx.restore();
					}
				}
			}else{
				for(i = 0; i < pos.length; ++i){
					pos[i].x = posbk[i].x;
					pos[i].y = posbk[i].y;
				}
			}
		}

	});

	canvasWithEvents.Image = declare("dojox.gfx.canvasWithEvents.Image", [canvasWithEvents.Shape, canvas.Image], {
		_renderShape: function(/* Object */ ctx){
			// summary:
			//		render image
			// ctx:
			//		a canvas context object
			var s = this.shape;
			if(ctx.pickingMode){
				ctx.fillRect(s.x, s.y, s.width, s.height);
			}else{
				this.inherited(arguments);
			}
		},
		_hitTestGeometry: function(ctx, x, y){
			// TODO: improve hit testing to take into account transparency
			var s = this.shape;
			return x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height ? this : null;
		}
	});

	canvasWithEvents.Text = declare("dojox.gfx.canvasWithEvents.Text", [canvasWithEvents.Shape, canvas.Text], {
		_testInputs: function(ctx, pos){
			return this._hitTestPixel(ctx, pos);
		}
	});

	canvasWithEvents.Rect = declare("dojox.gfx.canvasWithEvents.Rect", [canvasWithEvents.Shape, canvas.Rect], {});
	canvasWithEvents.Circle = declare("dojox.gfx.canvasWithEvents.Circle", [canvasWithEvents.Shape, canvas.Circle], {});
	canvasWithEvents.Ellipse = declare("dojox.gfx.canvasWithEvents.Ellipse", [canvasWithEvents.Shape, canvas.Ellipse],{});
	canvasWithEvents.Line = declare("dojox.gfx.canvasWithEvents.Line", [canvasWithEvents.Shape, canvas.Line],{});
	canvasWithEvents.Polyline = declare("dojox.gfx.canvasWithEvents.Polyline", [canvasWithEvents.Shape, canvas.Polyline],{});
	canvasWithEvents.Path = declare("dojox.gfx.canvasWithEvents.Path", [canvasWithEvents.Shape, canvas.Path],{});
	canvasWithEvents.TextPath = declare("dojox.gfx.canvasWithEvents.TextPath", [canvasWithEvents.Shape, canvas.TextPath],{});

	// When events are dispatched using on.emit, certain properties of these events (like target) get overwritten by
	// the DOM. The only real way to deal with this at the moment, short of never using any standard event properties,
	// is to store this data out-of-band and fix up the event object passed to the listener by wrapping the listener.
	// The out-of-band data is stored here.
	var fixedEventData = null;

	canvasWithEvents.Surface = declare("dojox.gfx.canvasWithEvents.Surface", canvas.Surface, {
		constructor: function(){
			this._elementUnderPointer = null;
		},

		fixTarget: function(listener){
			// summary:
			//		Corrects the `target` properties of the event object passed to the actual listener.
			// listener: Function
			//		An event listener function.

			var surface = this;

			return function(event){
				var k;
				if(fixedEventData){
					if(has("dom-mutableEvents")){
						Object.defineProperties(event, fixedEventData);
					}else{
						event = makeFakeEvent(event);
						for(k in fixedEventData){
							event[k] = fixedEventData[k].value;
						}
					}
				}else{
					// non-synthetic events need to have target correction too, but since there is no out-of-band
					// data we need to figure out the target ourselves
					var canvas = surface.getEventSource(),
						target = canvas._dojoElementFromPoint(
							// touch events may not be fixed at this point, so clientX/Y may not be set on the
							// event object
							(event.changedTouches ? event.changedTouches[0] : event).pageX,
							(event.changedTouches ? event.changedTouches[0] : event).pageY
						);
					if(has("dom-mutableEvents")){
						Object.defineProperties(event, {
							target: {
								value: target,
								configurable: true,
								enumerable: true
							},
							gfxTarget: {
								value: target.shape,
								configurable: true,
								enumerable: true
							}
						});
					}else{
						event = makeFakeEvent(event);
						event.target = target;
						event.gfxTarget = target.shape;
					}
				}

				// fixTouchListener in dojo/on undoes target changes by copying everything from changedTouches even
				// if the value already exists on the event; of course, this canvas implementation currently only
				// supports one pointer at a time. if we wanted to make sure all the touches arrays' targets were
				// updated correctly as well, we could support multi-touch and this workaround would not be needed
				if(has("touch")){
					// some standard properties like clientX/Y are not provided on the main touch event object,
					// so copy them over if we need to
					if(event.changedTouches && event.changedTouches[0]){
						var changedTouch = event.changedTouches[0];
						for(k in changedTouch){
							if(!event[k]){
								if(has("dom-mutableEvents")){
									Object.defineProperty(event, k, {
										value: changedTouch[k],
										configurable: true,
										enumerable: true
									});
								}else{
									event[k] = changedTouch[k];
								}
							}
						}
					}
					event.corrected = event;
				}

				return listener.call(this, event);
			};
		},

		_checkPointer: function(event){
			// summary:
			//		Emits enter/leave/over/out events in response to the pointer entering/leaving the inner elements
			//		within the canvas.

			function emit(types, target, relatedTarget){
				// summary:
				//		Emits multiple synthetic events defined in `types` with the given target `target`.

				var oldBubbles = event.bubbles;

				for(var i = 0, type; (type = types[i]); ++i){
					// targets get reset when the event is dispatched so we need to give information to fixTarget to
					// restore the target on the dispatched event through a back channel
					fixedEventData = {
						target: { value: target, configurable: true, enumerable: true},
						gfxTarget: { value: target.shape, configurable: true, enumerable: true },
						relatedTarget: { value: relatedTarget, configurable: true, enumerable: true }
					};

					// bubbles can be set directly, though.
					Object.defineProperty(event, "bubbles", {
						value: type.bubbles,
						configurable: true,
						enumerable: true
					});

					on.emit(canvas, type.type, event);
					fixedEventData = null;
				}

				Object.defineProperty(event, "bubbles", { value: oldBubbles, configurable: true, enumerable: true });
			}

			// Types must be arrays because hash map order is not guaranteed but we must fire in order to match normal
			// event behaviour
			var TYPES = {
					out: [
						{ type: "mouseout", bubbles: true },
						{ type: "MSPointerOut", bubbles: true },
						{ type: "pointerout", bubbles: true },
						{ type: "mouseleave", bubbles: false },
						{ type: "dojotouchout", bubbles: true}
					],
					over: [
						{ type: "mouseover", bubbles: true },
						{ type: "MSPointerOver", bubbles: true },
						{ type: "pointerover", bubbles: true },
						{ type: "mouseenter", bubbles: false },
						{ type: "dojotouchover", bubbles: true}
					]
				},
				elementUnderPointer = event.target,
				oldElementUnderPointer = this._elementUnderPointer,
				canvas = this.getEventSource();

			if(oldElementUnderPointer !== elementUnderPointer){
				if(oldElementUnderPointer && oldElementUnderPointer !== canvas){
					emit(TYPES.out, oldElementUnderPointer, elementUnderPointer);
				}

				this._elementUnderPointer = elementUnderPointer;

				if(elementUnderPointer && elementUnderPointer !== canvas){
					emit(TYPES.over, elementUnderPointer, oldElementUnderPointer);
				}
			}
		},

		getEventSource: function(){
			return this.rawNode;
		},

		on: function(type, listener){
			// summary:
			//		Connects an event to this surface.

			return on(this.getEventSource(), type, listener);
		},

		connect: function(/*String*/ name, /*Object*/ object, /*Function|String*/ method){
			// summary:
			//		Deprecated. Connects a handler to an event on this surface. Use `on` instead.
			// name: String
			//		The event name
			// object: Object
			//		The object that method will receive as "this".
			// method: Function
			//		A function reference, or name of a function in context.

			if(name.substring(0, 2) == "on"){
				name = name.substring(2);
			}
			return this.on(name, method ? lang.hitch(object, method) : object);
		},

		disconnect: function(handle){
			// summary:
			//		Deprecated. Disconnects a handler. Use `handle.remove` instead.

			handle.remove();
		},

		_initMirrorCanvas: function(){
			// summary:
			//		Initialises a mirror canvas used for event hit detection.

			this._initMirrorCanvas = function(){};

			var canvas = this.getEventSource(),
				mirror = this.mirrorCanvas = canvas.ownerDocument.createElement("canvas");

			mirror.width = 1;
			mirror.height = 1;
			mirror.style.position = "absolute";
			mirror.style.left = mirror.style.top = "-99999px";
			canvas.parentNode.appendChild(mirror);

			var moveEvt = "mousemove";
			if(has("pointer-events")){
				moveEvt = "pointermove";
			}else if(has("MSPointer")){
				moveEvt = "MSPointerMove";
			}else if(has("touch-events")){
				moveEvt = "touchmove";
			}
			on(canvas, moveEvt, lang.hitch(this, "_checkPointer"));
		},

		destroy: function(){
			if(this.mirrorCanvas){
				this.mirrorCanvas.parentNode.removeChild(this.mirrorCanvas);
				this.mirrorCanvas = null;
			}
			this.inherited(arguments);
		}
	});

	canvasWithEvents.createSurface = function(parentNode, width, height){
		// summary:
		//		creates a surface (Canvas)
		// parentNode: Node
		//		a parent node
		// width: String
		//		width of surface, e.g., "100px"
		// height: String
		//		height of surface, e.g., "100px"

		if(!width && !height){
			var pos = domGeom.position(parentNode);
			width  = width  || pos.w;
			height = height || pos.h;
		}
		if(typeof width === "number"){
			width = width + "px";
		}
		if(typeof height === "number"){
			height = height + "px";
		}

		var surface = new canvasWithEvents.Surface(),
			parent = dom.byId(parentNode),
			canvas = parent.ownerDocument.createElement("canvas");

		canvas.width  = g.normalizedLength(width);	// in pixels
		canvas.height = g.normalizedLength(height);	// in pixels

		parent.appendChild(canvas);
		surface.rawNode = canvas;
		surface._parent = parent;
		surface.surface = surface;

		g._base._fixMsTouchAction(surface);

		// any event handler added to the canvas needs to have its target fixed.
		var oldAddEventListener = canvas.addEventListener,
			oldRemoveEventListener = canvas.removeEventListener,
			listeners = [];

		var addEventListenerImpl = function(type, listener, useCapture){
			surface._initMirrorCanvas();

			var actualListener = surface.fixTarget(listener);
			listeners.push({ original: listener, actual: actualListener });
			oldAddEventListener.call(this, type, actualListener, useCapture);
		};
		var removeEventListenerImpl = function(type, listener, useCapture){
			for(var i = 0, record; (record = listeners[i]); ++i){
				if(record.original === listener){
					oldRemoveEventListener.call(this, type, record.actual, useCapture);
					listeners.splice(i, 1);
					break;
				}
			}
		};
		try{
			Object.defineProperties(canvas, {
				addEventListener: {
					value: addEventListenerImpl,
					enumerable: true,
					configurable: true
				},
				removeEventListener: {
					value: removeEventListenerImpl
				}
			});
		}catch(e){
			// Object.defineProperties fails on iOS 4-5. "Not supported on DOM objects").
			canvas.addEventListener = addEventListenerImpl;
			canvas.removeEventListener = removeEventListenerImpl;
		}


		canvas._dojoElementFromPoint = function(x, y){
			// summary:
			//		Returns the shape under the given (x, y) coordinate.
			// evt:
			//		mouse event

			if(!surface.mirrorCanvas){
				return this;
			}

			var surfacePosition = domGeom.position(this, true);

			// use canvas-relative positioning
			x -= surfacePosition.x;
			y -= surfacePosition.y;

			var mirror = surface.mirrorCanvas,
				ctx = mirror.getContext("2d"),
				children = surface.children;

			ctx.clearRect(0, 0, mirror.width, mirror.height);
			ctx.save();
			ctx.strokeStyle = "rgba(127,127,127,1.0)";
			ctx.fillStyle = "rgba(127,127,127,1.0)";
			ctx.pickingMode = true;

			// TODO: Make inputs non-array
			var inputs = [ { x: x, y: y } ];

			// process the inputs to find the target.
			for(var i = children.length - 1; i >= 0; i--){
				children[i]._testInputs(ctx, inputs);

				if(inputs[0].target){
					break;
				}
			}
			ctx.restore();
			return inputs[0] && inputs[0].target ? inputs[0].target.rawNode : this;
		};


		return surface; // dojox/gfx.Surface
	};

	var Creator = {
		createObject: function(){
			// summary:
			//		Creates a synthetic, partially-interoperable Element object used to uniquely identify the given
			//		shape within the canvas pseudo-DOM.

			var shape = this.inherited(arguments),
				listeners = {};

			shape.rawNode = {
				shape: shape,
				ownerDocument: shape.surface.rawNode.ownerDocument,
				parentNode: shape.parent ? shape.parent.rawNode : null,
				addEventListener: function(type, listener){
					var listenersOfType = listeners[type] = (listeners[type] || []);
					for(var i = 0, record; (record = listenersOfType[i]); ++i){
						if(record.listener === listener){
							return;
						}
					}

					listenersOfType.push({
						listener: listener,
						handle: aspect.after(this, "on" + type, shape.surface.fixTarget(listener), true)
					});
				},
				removeEventListener: function(type, listener){
					var listenersOfType = listeners[type];
					if(!listenersOfType){
						return;
					}
					for(var i = 0, record; (record = listenersOfType[i]); ++i){
						if(record.listener === listener){
							record.handle.remove();
							listenersOfType.splice(i, 1);
							return;
						}
					}
				}
			};
			return shape;
		}
	};

	canvasWithEvents.Group.extend(Creator);
	canvasWithEvents.Surface.extend(Creator);

	return canvasWithEvents;
});

},
'money/nls/np':function(){
define({
	root: {
		title	: "Amount",
		done	: 'Done'
	    
	    
	},
	'ru-ru': true
});

},
'money/nls/ru-ru/np':function(){
define({
		title	: "Сумма",
		done	: 'Готово'
	    
});

},
'money/TouchableToolBarButton':function(){
define([
	"dojo/_base/array", 
	"dojo/_base/declare",
	"dojo/_base/window",
	"dojo/_base/event",
	"dojo/sniff",
	"dojo/touch",
	"dojo/on",
	"dojo/dom",
	"dojo/dom-class",
	"dojox/mobile/ToolBarButton"
	], function(array, declare,win, event, has, touch, on, dom, domClass, Button) {
    return declare("money.TouchableToolBarButton", Button, {
		constructor: function(){
			this.inherited(arguments)
		},
		duration: 0,
			
		postCreate: function(){
			var _this = this;
			on(this.domNode, 'mousedown', function(){
				console.log('MOUSE')
				if(!_this._isTouched)
					_this._isMouseClicked = true
			})
			this.on(touch.press, function(e){
				if(_this._isMouseClicked) return;
				console.log('TOUCH EVENT')
				_this._isTouched = true
						
				event.stop(e);
				if(_this.domNode.disabled){
					return;
				}
				_this._press(true);
				
				_this._moveh = on(win.doc, touch.move, function(e){
					event.stop(e);							
					var inside = false;
					for(var t = e.target; t; t = t.parentNode){
						if(t == _this.domNode){
							inside = true;
							break;
						}
					}
					_this._press(inside);
				});
				_this._endh = on(win.doc, touch.release, function(e){
					if(_this._pressed){
						setTimeout(function(){
							//alert('click called ' + e.target)
							on.emit(e.target, "click", { 
								bubbles: true, 
								cancelable: true, 
								_synthetic: true 
							});
							console.log('emitted')
								
						});
					}
					event.stop(e);
					_this._press(false);
					_this._moveh.remove();
					_this._endh.remove();
				});
			});
			//this.domNode.addEventListener("click", function(e){
				//if(_this._isTouched){
				//	e.stopImmediatePropagation();
				//	e.preventDefault();
				//}
			//}, true);
					
			//dom.setSelectable(this.focusNode, false);
			//this.connect(this.domNode, "onclick", "_onClick");
		},
				
		_press: function(pressed){
			if(pressed != this._pressed){
				this._pressed = pressed;
				var button = this.focusNode || this.domNode;
				var newStateClasses = (this.baseClass+' '+this["class"]).split(" ");
				newStateClasses = array.map(newStateClasses, function(c){ return c+"Selected"; });
				(pressed?domClass.add:domClass.remove)(button, newStateClasses);
			}
		}
    });
});

},
'money/views/currencypicker':function(){
define(["dijit/registry","dojo/_base/array","dojo/query", 'dojo/on', "dojo/sniff","dojo/dom-class", "dojox/mobile/LongListMixin", "money/WheelScrollableView", 'dojo/text!money/views/currencypicker.html'],
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

},
'dojo/store/Observable':function(){
define(["../_base/kernel", "../_base/lang", "../when", "../_base/array" /*=====, "./api/Store" =====*/
], function(kernel, lang, when, array /*=====, Store =====*/){

// module:
//		dojo/store/Observable

var Observable = function(/*Store*/ store){
	// summary:
	//		The Observable store wrapper takes a store and sets an observe method on query()
	//		results that can be used to monitor results for changes.
	//
	// description:
	//		Observable wraps an existing store so that notifications can be made when a query
	//		is performed.
	//
	// example:
	//		Create a Memory store that returns an observable query, and then log some
	//		information about that query.
	//
	//	|	var store = Observable(new Memory({
	//	|		data: [
	//	|			{id: 1, name: "one", prime: false},
	//	|			{id: 2, name: "two", even: true, prime: true},
	//	|			{id: 3, name: "three", prime: true},
	//	|			{id: 4, name: "four", even: true, prime: false},
	//	|			{id: 5, name: "five", prime: true}
	//	|		]
	//	|	}));
	//	|	var changes = [], results = store.query({ prime: true });
	//	|	var observer = results.observe(function(object, previousIndex, newIndex){
	//	|		changes.push({previousIndex:previousIndex, newIndex:newIndex, object:object});
	//	|	});
	//
	//		See the Observable tests for more information.

	var undef, queryUpdaters = [], revision = 0;
	// a Comet driven store could directly call notify to notify observers when data has
	// changed on the backend
	// create a new instance
	store = lang.delegate(store);
	
	store.notify = function(object, existingId){
		revision++;
		var updaters = queryUpdaters.slice();
		for(var i = 0, l = updaters.length; i < l; i++){
			updaters[i](object, existingId);
		}
	};
	var originalQuery = store.query;
	store.query = function(query, options){
		options = options || {};
		var results = originalQuery.apply(this, arguments);
		if(results && results.forEach){
			var nonPagedOptions = lang.mixin({}, options);
			delete nonPagedOptions.start;
			delete nonPagedOptions.count;

			var queryExecutor = store.queryEngine && store.queryEngine(query, nonPagedOptions);
			var queryRevision = revision;
			var listeners = [], queryUpdater;
			results.observe = function(listener, includeObjectUpdates){
				if(listeners.push(listener) == 1){
					// first listener was added, create the query checker and updater
					queryUpdaters.push(queryUpdater = function(changed, existingId){
						when(results, function(resultsArray){
							var atEnd = resultsArray.length != options.count;
							var i, l, listener;
							if(++queryRevision != revision){
								throw new Error("Query is out of date, you must observe() the query prior to any data modifications");
							}
							var removedObject, removedFrom = -1, insertedInto = -1;
							if(existingId !== undef){
								// remove the old one
								for(i = 0, l = resultsArray.length; i < l; i++){
									var object = resultsArray[i];
									if(store.getIdentity(object) == existingId){
										removedObject = object;
										removedFrom = i;
										if(queryExecutor || !changed){// if it was changed and we don't have a queryExecutor, we shouldn't remove it because updated objects would be eliminated
											resultsArray.splice(i, 1);
										}
										break;
									}
								}
							}
							if(queryExecutor){
								// add the new one
								if(changed &&
										// if a matches function exists, use that (probably more efficient)
										(queryExecutor.matches ? queryExecutor.matches(changed) : queryExecutor([changed]).length)){

									var firstInsertedInto = removedFrom > -1 ? 
										removedFrom : // put back in the original slot so it doesn't move unless it needs to (relying on a stable sort below)
										resultsArray.length;
									resultsArray.splice(firstInsertedInto, 0, changed); // add the new item
									insertedInto = array.indexOf(queryExecutor(resultsArray), changed); // sort it
									// we now need to push the change back into the original results array
									resultsArray.splice(firstInsertedInto, 1); // remove the inserted item from the previous index
									
									if((options.start && insertedInto == 0) ||
										(!atEnd && insertedInto == resultsArray.length)){
										// if it is at the end of the page, assume it goes into the prev or next page
										insertedInto = -1;
									}else{
										resultsArray.splice(insertedInto, 0, changed); // and insert into the results array with the correct index
									}
								}
							}else if(changed){
								// we don't have a queryEngine, so we can't provide any information
								// about where it was inserted or moved to. If it is an update, we leave it's position alone, other we at least indicate a new object
								if(existingId !== undef){
									// an update, keep the index the same
									insertedInto = removedFrom;
								}else if(!options.start){
									// a new object
									insertedInto = store.defaultIndex || 0;
									resultsArray.splice(insertedInto, 0, changed);
								}
							}
							if((removedFrom > -1 || insertedInto > -1) &&
									(includeObjectUpdates || !queryExecutor || (removedFrom != insertedInto))){
								var copyListeners = listeners.slice();
								for(i = 0;listener = copyListeners[i]; i++){
									listener(changed || removedObject, removedFrom, insertedInto);
								}
							}
						});
					});
				}
				var handle = {};
				// TODO: Remove cancel in 2.0.
				handle.remove = handle.cancel = function(){
					// remove this listener
					var index = array.indexOf(listeners, listener);
					if(index > -1){ // check to make sure we haven't already called cancel
						listeners.splice(index, 1);
						if(!listeners.length){
							// no more listeners, remove the query updater too
							queryUpdaters.splice(array.indexOf(queryUpdaters, queryUpdater), 1);
						}
					}
				};
				return handle;
			};
		}
		return results;
	};
	var inMethod;
	function whenFinished(method, action){
		var original = store[method];
		if(original){
			store[method] = function(value){
				var originalId;
				if(method === 'put'){
					originalId = store.getIdentity(value);
				}
				if(inMethod){
					// if one method calls another (like add() calling put()) we don't want two events
					return original.apply(this, arguments);
				}
				inMethod = true;
				try{
					var results = original.apply(this, arguments);
					when(results, function(results){
						action((typeof results == "object" && results) || value, originalId);
					});
					return results;
				}finally{
					inMethod = false;
				}
			};
		}
	}
	// monitor for updates by listening to these methods
	whenFinished("put", function(object, originalId){
		store.notify(object, originalId);
	});
	whenFinished("add", function(object){
		store.notify(object);
	});
	whenFinished("remove", function(id){
		store.notify(undefined, id);
	});

	return store;
};

lang.setObject("dojo.store.Observable", Observable);

return Observable;
});

},
'dojox/app/utils/hash':function(){
define(["dojo/_base/lang"], function(lang){

// module:
//		dojox/app/utils/hash

var hashUtil = {
	// summary:
	//		This module contains the hash

		getParams: function(/*String*/ hash){
			// summary:
			//		get the params from the hash
			//
			// hash: String
			//		the url hash
			//
			// returns:
			//		the params object
			//
			var params;
			if(hash && hash.length){
				// fixed handle view specific params
				
				while(hash.indexOf("(") > 0){ 
					var index = hash.indexOf("(");
					var endindex = hash.indexOf(")");
					var viewPart = hash.substring(index,endindex+1);
					if(!params){ params = {}; }
					params = hashUtil.getParamObj(params, viewPart);
					// next need to remove the viewPart from the hash, and look for the next one
					var viewName = viewPart.substring(1,viewPart.indexOf("&"));
					hash = hash.replace(viewPart, viewName);
				}	
				// after all of the viewParts need to get the other params	

				for(var parts = hash.split("&"), x = 0; x < parts.length; x++){
					var tp = parts[x].split("="), name = tp[0], value = encodeURIComponent(tp[1] || "");
					if(name && value){
						if(!params){ params = {}; }
						params[name] = value;
					}
				}
			}
			return params; // Object
		},

		getParamObj: function(/*Object*/ params, /*String*/ viewPart){
			// summary:
			//		called to handle a view specific params object
			// params: Object
			//		the view specific params object
			// viewPart: String
			//		the part of the view with the params for the view
			//
			// returns:
	 		//		the params object for the view
			//
			var viewparams;
			var viewName = viewPart.substring(1,viewPart.indexOf("&"));
			var hash = viewPart.substring(viewPart.indexOf("&"), viewPart.length-1);
				for(var parts = hash.split("&"), x = 0; x < parts.length; x++){
					var tp = parts[x].split("="), name = tp[0], value = encodeURIComponent(tp[1] || "");
					if(name && value){
						if(!viewparams){ viewparams = {}; }
						viewparams[name] = value;
					}
				}
			params[viewName] = 	viewparams;
			return params; // Object
		},

		buildWithParams: function(/*String*/ hash, /*Object*/ params){
			// summary:
			//		build up the url hash adding the params
			// hash: String
			//		the url hash
			// params: Object
			//		the params object
			//
			// returns:
	 		//		the params object
			//
			if(hash.charAt(0) !== "#"){
				hash = "#"+hash;
			}
			for(var item in params){
				var value = params[item];
				// add a check to see if the params includes a view name if so setup the hash like (viewName&item=value);
				if(lang.isObject(value)){
					hash = hashUtil.addViewParams(hash, item, value);
				}else{
					if(item && value != null){
						hash = hash+"&"+item+"="+params[item];
					}
				}
			}
			return hash; // String
		},

		addViewParams: function(/*String*/ hash, /*String*/ view, /*Object*/ params){
			// summary:
			//		add the view specific params to the hash for example (view1&param1=value1)
			// hash: String
			//		the url hash
			// view: String
			//		the view name
			// params: Object
			//		the params for this view
			//
			// returns:
			//		the hash string
			//
			if(hash.charAt(0) !== "#"){
				hash = "#"+hash;
			}
			var index = hash.indexOf(view);
			if(index > 0){ // found the view?
				if((hash.charAt(index-1) == "#" || hash.charAt(index-1) == "+") && // assume it is the view? or could check the char after for + or & or -
					(hash.charAt(index+view.length) == "&" || hash.charAt(index+view.length) == "+" || hash.charAt(index+view.length) == "-")){
					// found the view at this index.
					var oldView = hash.substring(index-1,index+view.length+1);
					var paramString = hashUtil.getParamString(params);
					var newView = hash.charAt(index-1) + "(" + view + paramString + ")" + hash.charAt(index+view.length);
					hash = hash.replace(oldView, newView);
				}
			}
			
			return hash; // String
		},

		getParamString: function(/*Object*/ params){
			// summary:
			//		return the param string
			// params: Object
			//		the params object
			//
			// returns:
			//		the params string
			//
			var paramStr = "";
			for(var item in params){
				var value = params[item];
				if(item && value != null){
					paramStr = paramStr+"&"+item+"="+params[item];
				}
			}
			return paramStr; // String
		},

		getTarget: function(/*String*/ hash, /*String?*/ defaultView){
			// summary:
			//		return the target string
			// hash: String
			//		the hash string
			// defaultView: String
			//		the optional defaultView string
			//
			// returns:
			//		the target string
			//
			if(!defaultView){ defaultView = ""}
			while(hash.indexOf("(") > 0){ 
				var index = hash.indexOf("(");
				var endindex = hash.indexOf(")");
				var viewPart = hash.substring(index,endindex+1);
				var viewName = viewPart.substring(1,viewPart.indexOf("&"));
				hash = hash.replace(viewPart, viewName);
			}	
			
			return (((hash && hash.charAt(0) == "#") ? hash.substr(1) : hash) || defaultView).split('&')[0];	// String
		}
};

return hashUtil;

});
},
'dojox/css3/transition':function(){
define(["dojo/_base/lang",
		"dojo/_base/array",
		"dojo/Deferred",
		"dojo/when",
		"dojo/promise/all",
		"dojo/on",
		"dojo/sniff"],
		function(lang, array, Deferred, when, all, on, has){
	// module: 
	//		dojox/css3/transition
	
	//create cross platform animation/transition effects
	//TODO enable opera mobile when it is hardware accelerated
	// IE10 is using standard names so this is working without any modifications
	var transitionEndEventName = "transitionend";
	var transitionPrefix = "t"; //by default use "t" prefix and "ransition" to make word "transition"
	var translateMethodStart = "translate3d(";//Android 2.x does not support translateX in CSS Transition, we need to use translate3d in webkit browsers
	var translateMethodEnd = ",0,0)";
	if(has("webkit")){
		transitionPrefix = "WebkitT";
		transitionEndEventName = "webkitTransitionEnd";
	}else if(has("mozilla")){
		transitionPrefix = "MozT";
		translateMethodStart = "translateX(";
		translateMethodEnd = ")";
	}
	
	//TODO find a way to lock the animation and prevent animation conflict
	//Use the simple object inheritance
	var transition = function(/*Object?*/args){
		// summary:
		//		This module defines the transition utilities which can be used
		//		to perform transition effects based on the CSS Transition standard.
		// args:
		//		The arguments which will be mixed into this transition object.
		
		//default config should be in animation object itself instead of its prototype
		//otherwise, it might be easy for making mistake of modifying prototype
		var defaultConfig = {
				startState: {},
				endState: {},
				node: null,
				duration: 250,
				"in": true,
				direction: 1,
				autoClear: true
		};

		lang.mixin(this, defaultConfig);
		lang.mixin(this, args);

		//create the deferred object which will resolve after the animation is finished.
		//We can rely on "onAfterEnd" function to notify the end of a single animation,
		//but using a deferred object is easier to wait for multiple animations end.
		if(!this.deferred){
			this.deferred = new Deferred();
		}
	};
	
	lang.extend(transition, {
		
		play: function(){
			// summary:
			//		Plays the transition effect defined by this transition object.
			transition.groupedPlay([this]);
		},
		
		//method to apply the state of the transition
		_applyState: function(state){
			var style = this.node.style;
			for(var property in state){
				if(state.hasOwnProperty(property)){
					style[property] = state[property];
				}
			}
		},
		
		
		initState: function(){
			// summary:
			//		Method to initialize the state for a transition.
			
			//apply the immediate style change for initial state.
			this.node.style[transitionPrefix + "ransitionProperty"] = "none";
			this.node.style[transitionPrefix + "ransitionDuration"] = "0ms";
			this._applyState(this.startState);
			
		},
		
		_beforeStart: function(){
			if (this.node.style.display === "none"){
				this.node.style.display = "";
			}
			this.beforeStart();
		},
		
		_beforeClear: function(){
			this.node.style[transitionPrefix + "ransitionProperty"] = "";
			this.node.style[transitionPrefix + "ransitionDuration"] = "";
			if(this["in"] !== true){
				this.node.style.display = "none";
			}			 
			this.beforeClear();
		},
		
		_onAfterEnd: function(){
			this.deferred.resolve(this.node);
			if(this.node.id && transition.playing[this.node.id]===this.deferred){
				delete transition.playing[this.node.id];
			}
			this.onAfterEnd();
		},
		
		beforeStart: function(){
			// summary:
			//		The callback which will be called right before the start
			//		of the transition effect.
		},
		
		beforeClear: function(){
			// summary:
			//		The callback which will be called right after the end
			//		of the transition effect and before the final state is
			//		cleared.
		},
		
		onAfterEnd: function(){
			// summary:
			//		The callback which will be called right after the end
			//		of the transition effect and after the final state is
			//		cleared.
		},
		
		start: function(){
			// summary:
			//		Method to start the transition.
			this._beforeStart();
			this._startTime = new Date().getTime(); // set transition start timestamp
			this._cleared = false; // set clear flag to false

			var self = this;
			//change the transition duration
			self.node.style[transitionPrefix + "ransitionProperty"] = "all";
			self.node.style[transitionPrefix + "ransitionDuration"] = self.duration + "ms";
			
			//connect to clear the transition state after the transition end.
			//Since the transition is conducted asynchronously, we need to 
			//connect to transition end event to clear the state
			on.once(self.node, transitionEndEventName, function(){
				self.clear();
			});
			
			this._applyState(this.endState);
		},
		
		clear: function(){
			// summary:
			//		Method to clear the state after a transition.
			if(this._cleared) {
				return;
			}
			this._cleared = true; // set clear flag to true

			this._beforeClear();
			this._removeState(this.endState);
			// console.log(this.node.id + " clear.");
			this._onAfterEnd();
		},
		
		//create removeState method
		_removeState: function(state){
			var style = this.node.style;
			for(var property in state){
				if(state.hasOwnProperty(property)){
					style[property] = "";
				}
			}
		}
		
	});
	
	//TODO add the lock mechanism for all of the transition effects
	//	   consider using only one object for one type of transition.
	
	transition.slide = function(node, config){
		// summary:
		//		Method which is used to create the transition object of a slide effect.
		// node:
		//		The node that the slide transition effect will be applied on.
		// config:
		//		The cofig arguments which will be mixed into this transition object.

		//create the return object and set the startState, endState of the return
		var ret = new transition(config);
		ret.node = node;
		
		var startX = "0";
		var endX = "0";
		
		if(ret["in"]){
			if(ret.direction === 1){
				startX = "100%";
			}else{
				startX = "-100%";
			}
		}else{
			if(ret.direction === 1){
				endX = "-100%";
			}else{
				endX = "100%";
			}
		}
		
		ret.startState[transitionPrefix + "ransform"]=translateMethodStart+startX+translateMethodEnd;
		
		ret.endState[transitionPrefix + "ransform"]=translateMethodStart+endX+translateMethodEnd;
		
		return ret;
	};
		
	transition.fade = function(node, config){
		// summary:
		//		Method which is used to create the transition object of fade effect.
		// node:
		//		The node that the fade transition effect will be applied on.
		// config:
		//		The cofig arguments which will be mixed into this transition object.
		var ret = new transition(config);
		ret.node = node;
		
		var startOpacity = "0";
		var endOpacity = "0";
		
		if(ret["in"]){
			endOpacity = "1";
		}else{
			startOpacity = "1";
		}
		
		lang.mixin(ret, {
			startState:{
				"opacity": startOpacity
			},
			endState:{
				"opacity": endOpacity
			}
		});
		
		return ret;
	};
	
	transition.flip = function(node, config){
		// summary:
		//		Method which is used to create the transition object of flip effect.
		// node:
		//		The node that the flip transition effect will be applied on.
		// config:
		//		The cofig arguments which will be mixed into this transition object.
		
		var ret = new transition(config);
		ret.node = node;
	   
		if(ret["in"]){
			//Need to set opacity here because Android 2.2 has bug that
			//scale(...) in transform does not persist status
			lang.mixin(ret,{
				startState:{
					"opacity": "0"
				},
				endState:{
					"opacity": "1"
				}
			});
			ret.startState[transitionPrefix + "ransform"]="scale(0,0.8) skew(0,-30deg)";
			ret.endState[transitionPrefix + "ransform"]="scale(1,1) skew(0,0)";
		}else{
			lang.mixin(ret,{
				startState:{
					"opacity": "1"
				},
				endState:{
					"opacity": "0"
				}
			});			
			ret.startState[transitionPrefix + "ransform"]="scale(1,1) skew(0,0)";
			ret.endState[transitionPrefix + "ransform"]="scale(0,0.8) skew(0,30deg)";
		}
		
		return ret;
	};
	
	var getWaitingList = function(/*Array*/ nodes){
		var defs = [];
		array.forEach(nodes, function(node){
			//check whether the node is under other animation
			if(node.id && transition.playing[node.id]){
				//hook on deferred object in transition.playing
				defs.push(transition.playing[node.id]);
			}
			
		});
		return all(defs);
	};
	
	transition.getWaitingList = getWaitingList;
	
	transition.groupedPlay = function(/*Array*/args){
		// summary:
		//		The method which groups multiple transitions and plays 
		//		them together.
		// args: 
		//		The array of transition objects which will be played together.
		
		var animNodes = array.filter(args, function(item){
			return item.node;
		});
		
		var waitingList = getWaitingList(animNodes);

		//update registry with deferred objects in animations of args.
		array.forEach(args, function(item){
			if(item.node.id){
				transition.playing[item.node.id] = item.deferred;
			}
		});
		
		//wait for all deferred object in deferred list to resolve
		when(waitingList, function(){
			array.forEach(args, function(item){
				//set the start state
				item.initState();
			});
			
			//Assume the fps of the animation should be higher than 30 fps and
			//allow the browser to use one frame's time to redraw so that
			//the transition can be started
			setTimeout(function(){
				array.forEach(args, function(item){
					item.start();
				});

				// check and clear node if the node not cleared.
				// 1. on Android2.2/2.3, the "fade out" transitionEnd event will be lost if the soft keyboard popup, so we need to check nodes' clear status.
				// 2. The "fade in" transitionEnd event will before or after "fade out" transitionEnd event and it always occurs.
				//	  We can check fade out node status in the last "fade in" node transitionEnd event callback, if node transition timeout, we clear it.
				// NOTE: the last "fade in" transitionEnd event will always fired, so we bind on this event and check other nodes.
				on.once(args[args.length-1].node, transitionEndEventName, function(){
					var timeout;
					for(var i=0; i<args.length-1; i++){
						if(args[i].deferred.fired !== 0 && !args[i]._cleared){
							timeout = new Date().getTime() - args[i]._startTime;
							if(timeout >= args[i].duration){
								args[i].clear();
							}
						}
					}
				});
				setTimeout(function(){
					var timeout;
					for(var i=0; i<args.length; i++){
						if(args[i].deferred.fired !== 0 && !args[i]._cleared){
							timeout = new Date().getTime() - args[i]._startTime;
							if(timeout >= args[i].duration){
								args[i].clear();
							}
						}
					}
				}, args[0].duration+50);
			}, 33);
		});
	};
	
	transition.chainedPlay = function(/*Array*/args){
		// summary:
		//		The method which plays multiple transitions one by one.
		// args: 
		//		The array of transition objects which will be played in a chain.
		
		var animNodes = array.filter(args, function(item){
			return item.node;
		});
		
		var waitingList = getWaitingList(animNodes);

		//update registry with deferred objects in animations of args.
		array.forEach(args, function(item){
			if(item.node.id){
				transition.playing[item.node.id] = item.deferred;
			}
		});
		
		when(waitingList, function(){
			array.forEach(args, function(item){
				//set the start state
				item.initState();
			});
			
			//chain animations together
			for (var i=1, len=args.length; i < len; i++){
				args[i-1].deferred.then(lang.hitch(args[i], function(){
					this.start();
				}));
			}
			
			//Assume the fps of the animation should be higher than 30 fps and
			//allow the browser to use one frame's time to redraw so that
			//the transition can be started
			setTimeout(function(){
				args[0].start();
			}, 33);
		});		   
	};
	
	//TODO complete the registry mechanism for animation handling and prevent animation conflicts
	transition.playing = {};
	
	return transition;
});

},
'dojo/cldr/monetary':function(){
define(["../_base/kernel", "../_base/lang"], function(dojo, lang){

// module:
//		dojo/cldr/monetary

var monetary = {
	// summary:
	//		TODOC
};
lang.setObject("dojo.cldr.monetary", monetary);

monetary.getData = function(/*String*/ code){
	// summary:
	//		A mapping of currency code to currency-specific formatting information. Returns a unique object with properties: places, round.
	// code:
	//		an [ISO 4217](http://en.wikipedia.org/wiki/ISO_4217) currency code

	// from http://www.unicode.org/cldr/data/common/supplemental/supplementalData.xml:supplementalData/currencyData/fractions

	var placesData = {
		ADP:0,AFN:0,ALL:0,AMD:0,BHD:3,BIF:0,BYR:0,CLF:0,CLP:0,
		COP:0,CRC:0,DJF:0,ESP:0,GNF:0,GYD:0,HUF:0,IDR:0,IQD:0,
		IRR:3,ISK:0,ITL:0,JOD:3,JPY:0,KMF:0,KPW:0,KRW:0,KWD:3,
		LAK:0,LBP:0,LUF:0,LYD:3,MGA:0,MGF:0,MMK:0,MNT:0,MRO:0,
		MUR:0,OMR:3,PKR:0,PYG:0,RSD:0,RWF:0,SLL:0,SOS:0,STD:0,
		SYP:0,TMM:0,TND:3,TRL:0,TZS:0,UGX:0,UZS:0,VND:0,VUV:0,
		XAF:0,XOF:0,XPF:0,YER:0,ZMK:0,ZWD:0
	};

	var roundingData = {};

	var places = placesData[code], round = roundingData[code];
	if(typeof places == "undefined"){ places = 2; }
	if(typeof round == "undefined"){ round = 0; }

	return {places: places, round: round}; // Object
};

return monetary;
});

},
'money/idb':function(){
/*
*   Store interface implementation via IndexedDB
* 	
*   v. 0.9
* 	21/09/2014
*   
* 	Mikhael Milikhin
* 
*/

define([
    //common js
	"dojo/_base/declare","dojo/date/locale","dojo/Deferred",
   "dojo/_base/array","dojo/_base/lang"
	],
    function(declare,locale,Deferred,arrayUtil,lang) {
		// Return the declared class!
		return declare("money.idb",null, {
			dbName 		: "money",
			operationDb	: "operation",
			operationIdProperty : "id",
			dbVersion 	: 35,
			indexedDb	: null,
			moneyDb		: {},
			
			init: function(){
				this.moneyDb.open()
			},
			
			/*
			 * window.indexedDb 	- indexedDb interface
			 * moneyDb				- db instance for storing TRANSACTIONS
			 */ 
			
			constructor: function(){
				// проверяем существования префикса.
				window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
				// также могут отличаться и window.IDB* objects: Transaction, KeyRange и тд
				window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
				window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
				
				if(!window.indexedDB) {
					window.indexedDB = window.shimIndexedDB;                    
				}
				if (!window.indexedDB) {
					window.alert("Ваш браузер не поддерживат стандартную реализацию IndexedDB. Поэтому некоторый функционал может не поддерживаться.");
				}
				this.moneyDb = {}
				this.moneyDb.db = null;
			},
			
			_onError: function(e) {
				console.log(e);
			},
			
			/*
			 * Allias to getById
			 */ 
			'get': function( id ){
				return this.getById( id )
			},
			
			/*
			 * It's easy: just getting object by id :-)
			 */ 
			getById: function(id) {
				var id = parseFloat(id) || -1, 
					db = this.moneyDb.db,
					trans = db.transaction( this.operationDb, 'readwrite'),
					store = trans.objectStore(this.operationDb),
					request = store.get(id),
					defRes = new Deferred;
				
				request.onsuccess = lang.hitch(this,function(e) {
					var item = e.target.result
					//replace transaction dateString with real Date
					if(item) {
						var date = item.date;
						item.date = locale.parse(date, {"selector":"date", "datePattern":window.AppData.widgetDateFormat})
					}
					defRes.resolve( item )
				});

				request.onerror = function(e) {
					console.log("Error getting object: " + id, e);
					defRes.resolve( null )
				};
				return defRes
			},
			
			getCount: function(){
				var def = new Deferred;
				this.query().then( function( items ){
					def.resolve( items.items.length )
				})
				return def
			},
			
			/* implements query dojo's interface
			* conditions (optional) is an object with filter params
			* {
			* 	from: date,
			* 	to	: date,
			* 	type: 'e' OR 'i' OR 't',
			* 
			* 	account: accountId,
			* 	tags: [ tadIds ]
			* }
			*	TODO: impement sorting params.
			*/ 
			'query': function( conditions ){
				var scope = scope || this,
					request = window.indexedDB.open( this.dbName ),
					items = [],
					defRes = new Deferred;
					
				request.onsuccess = lang.hitch(this,function(event) {
					// Enumerate the entire object store.
					var db = this.moneyDb.db,
						trans = db.transaction( this.operationDb, 'readonly' ),
						store = trans.objectStore( this.operationDb ),
						index, keyRange, from, to, type, account, accountTo,
						queryRequest;
						
					trans.oncomplete = lang.hitch(this,function() {
						// sort by date
						items = items.sort(function(a, b){
							return (a.date < b.date ? 1: -1) 
						})
						defRes.resolve( {'items': items} )
					});
					
					
					if( !!conditions ) {
						if( !!conditions.account){
							account = parseFloat( conditions.account );
						}
						if( !!conditions.accountTo){
							accountTo = parseFloat( conditions.accountTo );
						}
						if( !!conditions.from) {
							from = lang.isFunction(conditions.from) ?
								conditions.from() : conditions.from;
							if(!!from)
							from = isValidDate( from ) ? 
								locale.format( from, {
									"selector":"date", 
									"datePattern": window.AppData.widgetDateFormat
								}) : from;
						}
						if( !!conditions.to ){
							to = lang.isFunction(conditions.to) ?
								conditions.to() : conditions.to;
							if(!!to)
							to = locale.format( to, {
								"selector":"date", 
								"datePattern":window.AppData.widgetDateFormat
							});	
						}
						if( !!conditions.type) {
							type = lang.isFunction(conditions.type) ?
								conditions.type() : conditions.type
						}
					}
					console.log(from, to)
					if(account){
						keyRange = IDBKeyRange.only( account );
						index = store.index('account')
					}
					if(accountTo){
						keyRange = IDBKeyRange.only( accountTo );
						index = store.index('accountTo')
					}
					// get transations for the ONLY date
					if( from && !to) {
						if( type ) {
							keyRange = IDBKeyRange.only( [type, from]);
							index = store.index('dateType')
						}else{
							keyRange = IDBKeyRange.only( from );
							index = store.index('date')
						}
					}
					// get transations between given dates
					else if( from && to ) {
						if( type ) {
							keyRange = IDBKeyRange.bound( [type, from], [type, to]);
							index = store.index('dateType')
						} else {
							console.log(from, to)
							keyRange = IDBKeyRange.bound( from, to );
							index = store.index('date')
						}
					} else {
					// get transations by type						
						if( type ){
							keyRange = IDBKeyRange.only( type );
							index = store.index('type')
						}
					}
					
					if(keyRange) {
						queryRequest = index.openCursor( 
							keyRange
						);
					}
					else queryRequest = store.openCursor();
					
					if (queryRequest) {
						queryRequest.onsuccess = lang.hitch(this, function(event) {
							// This hack is to allow our code to run with Firefox (older versions than 6)
							var cursor = queryRequest.result || event.result;

							// If cursor is null then we've completed the enumeration, so return
							if (!cursor || !cursor.value) {
								return;
							}
							
							//get real date
							var date = cursor.value.date;
							cursor.value.date = 
								locale.parse(cursor.value.date, {
									"selector":"date", 
									"datePattern":
									window.AppData.widgetDateFormat
								})
							
							items.push(cursor.value)
							//this.deleteItem(cursor.value.id)
							//continue enumeration
							if(cursor["continue"] && lang.isFunction(cursor["continue"]))
								cursor["continue"]();
								
						})
					}else {
						defRes.resolve({ items: [] })
					}
				})
				
				return defRes;
			},
			
			'put': function(){
				return this.addItem( arguments );
			},		
			addItem: function(d, dontRefreshSummary){
				var def = new Deferred(),
					item = lang.clone(d),
					self = this
				var date = isValidDate(item.date) ? 
					locale.format(item.date, {
						"selector":"date", 
						"datePattern":"yyyy-MM-dd"
					}) : item.date
				
				item.date = date
				
				var db = self.moneyDb.db;
				var trans = db.transaction([self.operationDb], "readwrite");
				var store = trans.objectStore(self.operationDb);
				//console.log('????',parseFloat( item.id ))
				var getReq = store.get( parseFloat( item.id ) )
				
				getReq.onsuccess = function( res ){
					var oldDate, foundItem =  res.target.result;
					
					if(foundItem)
						oldDate = foundItem.date
					//console.log('OLD DATE',oldDate, foundItem)
					//console.log( d.id, item.id, '!')
				
					try {
						var request = store.put( item );
					}catch(e){
						console.log(' error adding to IDB')
						setTimeout(function(){
							def.resolve('e')
						},10);
						return def;
					}
					request.onsuccess = lang.hitch(self, function(e) {
						def.resolve('ok')
						console.log("saved..")
						if( !dontRefreshSummary)
						require(['dijit/registry'], function(registry){
							if( registry.byId('summary-list') )
								registry.byId('summary-list').onUpdate(
									d, oldDate
								)
						})
						
					});
						
					request.onerror = function(e) {
						def.resolve('e')
						console.log("Error Adding: ", e);
					};
				}
				
				return def
			},
			
			'remove': function(){
				return this.deleteItem( arguments )
			},
			/*
			 * Delete object with id = id from db :-)
			 */ 
			deleteItem: function(id) {
				var def = new Deferred()
				// Это неспроста. По-моему если передать строку - 
				// будет печаль.
				id = parseFloat(id)
				
				var db = this.moneyDb.db;
					trans = db.transaction(this.operationDb, 'readwrite');
					store = trans.objectStore(this.operationDb);
					request = store["delete"](id);

					request.onsuccess = function(e) {
						def.resolve('ok')
						console.log('RESOLVED DELETE')
					};

					request.onerror = function(e) {
						def.resolve('e')
					};
				return def				
			},
			
			/*
			 * Open DB. if version is newer, than version of DB, update db schema
			 * scope.callback will be executed on array of all DB objects
			 */
			open: function(){
				var callback = callback || null,
					scope = scope || this,
					request = window.indexedDB.open(this.dbName, this.dbVersion),
					self = this,
					defRes = new Deferred;
				
				request.onerror = function(e) {
					console.log(e);
				}
				
				request.onsuccess = function(e) {
					// Old api: var v = "2-beta";
					self.moneyDb.db = e.target.result;
					var db = self.moneyDb.db;
					if (db.setVersion) {
						console.log("in old setVersion: "+ db.setVersion);
						if (db.version != dbVersion) {
							var req = db.setVersion( self.dbVersion );
							req.onsuccess = lang.hitch(self, function () {
								if(db.objectStoreNames.contains(self.operationDb)) {
									db.deleteObjectStore(self.operationDb);
								}
								var store = db.createObjectStore(self.operationDb, {keyPath: 'id', autoIncrement:false});
								
								var trans = req.result;
								trans.oncomplete = function(e) {
									defRes.resolve('ok');
								}
							});
						}
						else {
							defRes.resolve( 'ok' )
						}
					}else {
						defRes.resolve( 'ok' )
					}
				}
				
				request.onupgradeneeded = function(e) {
					console.log ("going to upgrade our DB!");
					
					self.moneyDb.db = e.target.result;
					var db = self.moneyDb.db;
					if( db.objectStoreNames.contains(self.operationDb) ) {
						db.deleteObjectStore(self.operationDb);
					}
					var store = db.createObjectStore(self.operationDb,{keyPath: 'id',autoIncrement:false});
					store.createIndex("date", "date", { unique: false });
					store.createIndex("type", "type", { unique: false });
					store.createIndex("account", "account", { unique: false });
					store.createIndex("accountTo", "accountTo", { unique: false });
					store.createIndex("dateType", ["type", "date"], { unique: false });
					store.createIndex("accType", ["type", "account"], { unique: false });
					defRes.resolve( 'ok' )			
					//self.getAllItems();
				}
				request.onfailure = function(){
					self._onError;
					defRes.reolve( 'e' )
				}
				return defRes;
			}
		})
	})

},
'dojox/mobile/Icon':function(){
define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/dom-class",
	"dojo/dom-construct",
	"./iconUtils",
	"dojo/has",
	"dojo/has!dojo-bidi?dojox/mobile/bidi/Icon"
], function(declare, lang, domClass, domConstruct, iconUtils, has, BidiIcon){

	// module:
	//		dojox/mobile/Icon

	var Icon = declare(has("dojo-bidi") ? "dojox.mobile.NonBidiIcon" : "dojox.mobile.Icon", null, {
		// summary:
		//		A wrapper for image icon, CSS sprite icon, or DOM Button.
		// description:
		//		Icon is a simple utility class for creating an image icon, a CSS sprite icon, 
		//		or a DOM Button. It calls dojox/mobile/iconUtils.createIcon() with the 
		//		appropriate parameters to create an icon. 
		//		Note that this module is not a widget, that is it does not inherit 
		//		from dijit/_WidgetBase.
		// example:
		//		Image icon:
		//	|	<div data-dojo-type="dojox.mobile.Icon"
		//	|		data-dojo-props='icon:"images/tab-icon-12h.png"'></div>
		//
		//		CSS sprite icon:
		//	|	<div data-dojo-type="dojox.mobile.Icon"
		//	|		data-dojo-props='icon:"images/tab-icons.png",iconPos:"29,116,29,29"'></div>
		//
		//		DOM Button:
		//	|	<div data-dojo-type="dojox.mobile.Icon"
		//	|		data-dojo-props='icon:"mblDomButtonBlueCircleArrow"'></div>

		// icon: [const] String
		//		An icon to display. The value can be either a path for an image
		//		file or a class name of a DOM button.
		//		Note that changing the value of the property after the icon
		//		creation has no effect.
		icon: "",

		// iconPos: [const] String
		//		The position of an aggregated icon. IconPos is comma separated
		//		values like top,left,width,height (ex. "0,0,29,29").
		//		Note that changing the value of the property after the icon
		//		creation has no effect.
		iconPos: "",

		// alt: [const] String
		//		An alt text for the icon image.
		//		Note that changing the value of the property after the icon
		//		creation has no effect.
		alt: "",

		// tag: String
		//		The name of the HTML tag to create as this.domNode.
		tag: "div",

		constructor: function(/*Object?*/args, /*DomNode?*/node){
			// summary:
			//		Creates a new instance of the class.
			// args:
			//		Contains properties to be set.
			// node:
			//		The DOM node. If none is specified, it is automatically created. 
			if(args){
				lang.mixin(this, args);
			}
			this.domNode = node || domConstruct.create(this.tag);
			iconUtils.createIcon(this.icon, this.iconPos, null, this.alt, this.domNode);
			this._setCustomTransform();
		},
		_setCustomTransform: function(){
			// summary:
			//		To be implemented in bidi/Icon.js.
		}
	});
	return has("dojo-bidi") ? declare("dojox.mobile.Icon", [Icon, BidiIcon]) : Icon;
});

},
'money/nls/accountpicker':function(){
define({
	root: {
		title	: "Choose account",
	    done	: 'DONE',
	    viewHelp : 'Choose account from a list below or enter new account\'s title, please'
	},
	'ru-ru': true
});

},
'money/nls/ru-ru/accountpicker':function(){
define({
	title	: "Выберите счет",
	done	: 'Готово'	,
	    viewHelp : 'Выберите счет из списка или введите название нового счета, пожалуйста'
});

},
'dojox/lang/utils':function(){
define(["..", "dojo/_base/lang"], 
  function(dojox, lang){
	var du = lang.getObject("lang.utils", true, dojox);
	
	var empty = {}, opts = Object.prototype.toString;

	var clone = function(o){
		if(o){
			switch(opts.call(o)){
				case "[object Array]":
					return o.slice(0);
				case "[object Object]":
					return lang.delegate(o);
			}
		}
		return o;
	}
	
	lang.mixin(du, {
		coerceType: function(target, source){
			// summary:
			//		Coerces one object to the type of another.
			// target: Object
			//		object, which typeof result is used to coerce "source" object.
			// source: Object
			//		object, which will be forced to change type.
			switch(typeof target){
				case "number":	return Number(eval("(" + source + ")"));
				case "string":	return String(source);
				case "boolean":	return Boolean(eval("(" + source + ")"));
			}
			return eval("(" + source + ")");
		},
		
		updateWithObject: function(target, source, conv){
			// summary:
			//		Updates an existing object in place with properties from an "source" object.
			// target: Object
			//		the "target" object to be updated
			// source: Object
			//		the "source" object, whose properties will be used to source the existed object.
			// conv: Boolean?
			//		force conversion to the original type
			if(!source){ return target; }
			for(var x in target){
				if(x in source && !(x in empty)){
					var t = target[x];
					if(t && typeof t == "object"){
						du.updateWithObject(t, source[x], conv);
					}else{
						target[x] = conv ? du.coerceType(t, source[x]) : clone(source[x]);
					}
				}
			}
			return target;	// Object
		},
	
		updateWithPattern: function(target, source, pattern, conv){
			// summary:
			//		Updates an existing object in place with properties from an "source" object.
			// target: Object
			//		the "target" object to be updated
			// source: Object
			//		the "source" object, whose properties will be used to source the existed object.
			// pattern: Object
			//		object, whose properties will be used to pull values from the "source"
			// conv: Boolean?
			//		force conversion to the original type
			if(!source || !pattern){ return target; }
			for(var x in pattern){
				if(x in source && !(x in empty)){
					target[x] = conv ? du.coerceType(pattern[x], source[x]) : clone(source[x]);
				}
			}
			return target;	// Object
		},
		
		merge: function(object, mixin){
			// summary:
			//		Merge two objects structurally, mixin properties will override object's properties.
			// object: Object
			//		original object.
			// mixin: Object
			//		additional object, which properties will override object's properties.
			if(mixin){
				var otype = opts.call(object), mtype = opts.call(mixin), t, i, l, m;
				switch(mtype){
					case "[object Array]":
						if(mtype == otype){
							t = new Array(Math.max(object.length, mixin.length));
							for(i = 0, l = t.length; i < l; ++i){
								t[i] = du.merge(object[i], mixin[i]);
							}
							return t;
						}
						return mixin.slice(0);
					case "[object Object]":
						if(mtype == otype && object){
							t = lang.delegate(object);
							for(i in mixin){
								if(i in object){
									l = object[i];
									m = mixin[i];
									if(m !== l){
										t[i] = du.merge(l, m);
									}
								}else{
									t[i] = lang.clone(mixin[i]);
								}
							}
							return t;
						}
						return lang.clone(mixin);
				}
			}
			return mixin;
		}
	});
	
	return du;
});

},
'dojox/app/View':function(){
define(["require", "dojo/when", "dojo/on", "dojo/_base/declare", "dojo/_base/lang", "dojo/Deferred",
		"dijit/Destroyable", "dijit/_TemplatedMixin", "dijit/_WidgetsInTemplateMixin", "./ViewBase", "./utils/nls"],
	function(require, when, on, declare, lang, Deferred, Destroyable, _TemplatedMixin, _WidgetsInTemplateMixin, ViewBase, nls){

	return declare("dojox.app.View", [_TemplatedMixin, _WidgetsInTemplateMixin, Destroyable, ViewBase], {
		// summary:
		//		View class inheriting from ViewBase adding templating & globalization capabilities.
		constructor: function(params){
			// summary:
			//		Constructs a View instance either from a configuration or programmatically.
			//
			// example:
			//		|	use configuration file
			//		|
			// 		|	// load view controller from views/simple.js by default
			//		|	"simple":{
			//		|		"template": "myapp/views/simple.html",
			//		|		"nls": "myapp/nls/simple"
			//		|		"dependencies":["dojox/mobile/TextBox"]
			//		|	}
			//		|
			//		|	"home":{
			//		|		"template": "myapp/views/home.html", // no controller set to not use a view controller
			//		|		"dependencies":["dojox/mobile/TextBox"]
			//		|	}
			//		|	"main":{
			//		|		"template": "myapp/views/main.html",
			//		|		"controller": "myapp/views/main.js", // identify load view controller from views/main.js
			//		|		"dependencies":["dojox/mobile/TextBox"]
			//		|	}
			//
			// example:
			//		|	var viewObj = new View({
			//		|		app: this.app,
			//		|		id: this.id,
			//		|		name: this.name,
			//		|		parent: this,
			//		|		templateString: this.templateString,
			//		|		template: this.template, 
			//		|		controller: this.controller
			//		|	});
			//		|	viewObj.start(); // start view
			//
			// params:
			//		view parameters, include:
			//
			//		- app: the app
			//		- id: view id
			//		- name: view name
			//		- template: view template identifier. If templateString is not empty, this parameter is ignored.
			//		- templateString: view template string
			//		- controller: view controller module identifier
			//		- parent: parent view
			//		- children: children views
			//		- nls: nls definition module identifier
		},

		// _TemplatedMixin requires a connect method if data-dojo-attach-* are used
		connect: function(obj, event, method){
			return this.own(on(obj, event, lang.hitch(this, method)))[0]; // handle
		},

		_loadTemplate: function(){
			// summary:
			//		load view HTML template and dependencies.
			// tags:
			//		private
			//

			if(this.templateString){
				return true;
			}else{
				var tpl = this.template;
				var deps = this.dependencies?this.dependencies:[];
				if(tpl){
					if(tpl.indexOf("./") == 0){
						tpl = "app/"+tpl;
					}
					deps = deps.concat(["dojo/text!"+tpl]);
				}
				var def = new Deferred();
				if(deps.length > 0){
					var requireSignal;
					try{
						requireSignal = require.on ? require.on("error", lang.hitch(this, function(error){
							if(def.isResolved() || def.isRejected()){
								return;
							}
							if(error.info[0] && error.info[0].indexOf(this.template) >= 0 ){
								def.resolve(false);
								if(requireSignal){
									requireSignal.remove();
								}
							}
						})) :  null;
						require(deps, function(){
							def.resolve.call(def, arguments);
							if(requireSignal){
								requireSignal.remove();
							}
						});
					}catch(e){
						def.resolve(false);
						if(requireSignal){
							requireSignal.remove();
						}
					}
				}else{
					def.resolve(true);
				}
				var loadViewDeferred = new Deferred();
				when(def, lang.hitch(this, function(){
					this.templateString = this.template ? arguments[0][arguments[0].length - 1] : "<div></div>";
					loadViewDeferred.resolve(this);
				}));
				return loadViewDeferred;
			}
		},

		// start view
		load: function(){
			var tplDef = new Deferred();
			var defDef = this.inherited(arguments);
			var nlsDef = nls(this);
			// when parent loading is done (controller), proceed with template
			// (for data-dojo-* to work we need to wait for controller to be here, this is also
			// useful when the controller is used as a layer for the view)
			when(defDef, lang.hitch(this, function(){
				when(nlsDef, lang.hitch(this, function(nls){
					// we inherit from the parent NLS
					this.nls = lang.mixin({}, this.parent.nls);
					if(nls){
						// make sure template can access nls doing ${nls.myprop}
						lang.mixin(this.nls, nls);
					}
					when(this._loadTemplate(), function(value){
						tplDef.resolve(value);
					});
				}));
			}));
			return tplDef;
		},

		_startup: function(){
			// summary:
			//		startup widgets in view template.
			// tags:
			//		private
			this.buildRendering();
			this.inherited(arguments);
		}
	});
});

},
'dojox/main':function(){
define(["dojo/_base/kernel"], function(dojo) {
	// module:
	//		dojox/main

	/*=====
	return {
		// summary:
		//		The dojox package main module; dojox package is somewhat unusual in that the main module currently just provides an empty object.
		//		Apps should require modules from the dojox packages directly, rather than loading this module.
	};
	=====*/

	return dojo.dojox;
});
},
'dojox/charting/plot2d/Columns':function(){
define(["dojo/_base/lang", "dojo/_base/array", "dojo/_base/declare", "dojo/has", "./CartesianBase", "./_PlotEvents", "./common",
		"dojox/lang/functional", "dojox/lang/functional/reversed", "dojox/lang/utils", "dojox/gfx/fx"], 
	function(lang, arr, declare, has, CartesianBase, _PlotEvents, dc, df, dfr, du, fx){

	var purgeGroup = dfr.lambda("item.purgeGroup()");

	return declare("dojox.charting.plot2d.Columns", [CartesianBase, _PlotEvents], {
		// summary:
		//		The plot object representing a column chart (vertical bars).
		defaultParams: {
			gap:	0,		// gap between columns in pixels
			animate: null,  // animate bars into place
			enableCache: false
		},
		optionalParams: {
			minBarSize:	1,	// minimal column width in pixels
			maxBarSize:	1,	// maximal column width in pixels
			// theme component
			stroke:		{},
			outline:	{},
			shadow:		{},
			fill:		{},
			filter:     {},
			styleFunc:  null,
			font:		"",
			fontColor:	""
		},

		constructor: function(chart, kwArgs){
			// summary:
			//		The constructor for a columns chart.
			// chart: dojox/charting/Chart
			//		The chart this plot belongs to.
			// kwArgs: dojox.charting.plot2d.__BarCtorArgs?
			//		An optional keyword arguments object to help define the plot.
			this.opt = lang.clone(lang.mixin(this.opt, this.defaultParams));
			du.updateWithObject(this.opt, kwArgs);
			du.updateWithPattern(this.opt, kwArgs, this.optionalParams);
			this.animate = this.opt.animate;
			this.renderingOptions = { "shape-rendering": "crispEdges" };
		},

		getSeriesStats: function(){
			// summary:
			//		Calculate the min/max on all attached series in both directions.
			// returns: Object
			//		{hmin, hmax, vmin, vmax} min/max in both directions.
			var stats = dc.collectSimpleStats(this.series);
			stats.hmin -= 0.5;
			stats.hmax += 0.5;
			return stats; // Object
		},
		
		createRect: function(run, creator, params){
			var rect;
			if(this.opt.enableCache && run._rectFreePool.length > 0){
				rect = run._rectFreePool.pop();
				rect.setShape(params);
				// was cleared, add it back
				creator.add(rect);
			}else{
				rect = creator.createRect(params);
			}
			if(this.opt.enableCache){
				run._rectUsePool.push(rect);
			}
			return rect;
		},

		render: function(dim, offsets){
			// summary:
			//		Run the calculations for any axes for this plot.
			// dim: Object
			//		An object in the form of { width, height }
			// offsets: Object
			//		An object of the form { l, r, t, b}.
			// returns: dojox/charting/plot2d/Columns
			//		A reference to this plot for functional chaining.
			if(this.zoom && !this.isDataDirty()){
				return this.performZoom(dim, offsets);
			}
			this.resetEvents();
			this.dirty = this.isDirty();
			var s;
			if(this.dirty){
				arr.forEach(this.series, purgeGroup);
				this._eventSeries = {};
				this.cleanGroup();
				s = this.getGroup();
				df.forEachRev(this.series, function(item){ item.cleanGroup(s); });
			}
			var t = this.chart.theme,
				ht = this._hScaler.scaler.getTransformerFromModel(this._hScaler),
				vt = this._vScaler.scaler.getTransformerFromModel(this._vScaler),
				baseline = Math.max(0, this._vScaler.bounds.lower),
				baselineHeight = vt(baseline),
				events = this.events(),
				bar = this.getBarProperties();
			
			var z = this.series.length;
			arr.forEach(this.series, function(serie){if(serie.hidden){z--;}});

			for(var i = this.series.length - 1; i >= 0; --i){
				var run = this.series[i];
				if(!this.dirty && !run.dirty){
					t.skip();
					this._reconnectEvents(run.name);
					continue;
				}
				run.cleanGroup();
				if(this.opt.enableCache){
					run._rectFreePool = (run._rectFreePool?run._rectFreePool:[]).concat(run._rectUsePool?run._rectUsePool:[]);
					run._rectUsePool = [];
				}
				var theme = t.next("column", [this.opt, run]),
					eventSeries = new Array(run.data.length);

				if(run.hidden){
					run.dyn.fill = theme.series.fill;
					continue;
				}
				z--;

				s = run.group;
				var indexed = arr.some(run.data, function(item){
					return typeof item == "number" || (item && !item.hasOwnProperty("x"));
				});
				// on indexed charts we can easily just interate from the first visible to the last visible
				// data point to save time
				var min = indexed?Math.max(0, Math.floor(this._hScaler.bounds.from - 1)):0;
				var max = indexed?Math.min(run.data.length, Math.ceil(this._hScaler.bounds.to)):run.data.length;
				for(var j = min; j < max; ++j){
					var value = run.data[j];
					if(value != null){
						var val = this.getValue(value, j, i, indexed),
							vv = vt(val.y),
							h = Math.abs(vv - baselineHeight), 
							finalTheme,
							sshape;
						
						if(this.opt.styleFunc || typeof value != "number"){
							var tMixin = typeof value != "number" ? [value] : [];
							if(this.opt.styleFunc){
								tMixin.push(this.opt.styleFunc(value));
							}
							finalTheme = t.addMixin(theme, "column", tMixin, true);
						}else{
							finalTheme = t.post(theme, "column");
						}
						
						if(bar.width >= 1 && h >= 0){
							var rect = {
								x: offsets.l + ht(val.x + 0.5) + bar.gap + bar.thickness * z,
								y: dim.height - offsets.b - (val.y > baseline ? vv : baselineHeight),
								width: bar.width, 
								height: h
							};
							if(finalTheme.series.shadow){
								var srect = lang.clone(rect);
								srect.x += finalTheme.series.shadow.dx;
								srect.y += finalTheme.series.shadow.dy;
								sshape = this.createRect(run, s, srect).setFill(finalTheme.series.shadow.color).setStroke(finalTheme.series.shadow);
								if(this.animate){
									this._animateColumn(sshape, dim.height - offsets.b + baselineHeight, h);
								}
							}
							
							var specialFill = this._plotFill(finalTheme.series.fill, dim, offsets);
							specialFill = this._shapeFill(specialFill, rect);
							var shape = this.createRect(run, s, rect).setFill(specialFill).setStroke(finalTheme.series.stroke);
							if(shape.setFilter && finalTheme.series.filter){
								shape.setFilter(finalTheme.series.filter);
							}
							run.dyn.fill   = shape.getFill();
							run.dyn.stroke = shape.getStroke();
							if(events){
								var o = {
									element: "column",
									index:   j,
									run:     run,
									shape:   shape,
									shadow:  sshape,
									cx:      val.x + 0.5,
									cy:      val.y,
									x:	     indexed?j:run.data[j].x,
									y:	 	 indexed?run.data[j]:run.data[j].y
								};
								this._connectEvents(o);
								eventSeries[j] = o;
							}
							// if val.py is here, this means we are stacking and we need to subtract previous
							// value to get the high in which we will lay out the label
							if(!isNaN(val.py) && val.py > baseline){
								rect.height = vv - vt(val.py);
							}
							this.createLabel(s, value, rect, finalTheme);
							if(this.animate){
								this._animateColumn(shape, dim.height - offsets.b - baselineHeight, h);
							}
						}
					}
				}
				this._eventSeries[run.name] = eventSeries;
				run.dirty = false;
			}
			this.dirty = false;
			// chart mirroring starts
			if(has("dojo-bidi")){
				this._checkOrientation(this.group, dim, offsets);
			}
			// chart mirroring ends
			return this;	//	dojox/charting/plot2d/Columns
		},
		getValue: function(value, j, seriesIndex, indexed){
			var y,x;
			if(indexed){
				if(typeof value == "number"){
					y = value;
				}else{
					y = value.y;
				}
				x = j;
			}else{
				y = value.y;
				x = value.x - 1;
			}
			return { x: x, y: y };
		},
		getBarProperties: function(){
			var f = dc.calculateBarSize(this._hScaler.bounds.scale, this.opt);
			return {gap: f.gap, width: f.size, thickness: 0};
		},
		_animateColumn: function(shape, voffset, vsize){
			if(vsize==0){
				vsize = 1;
			}
			fx.animateTransform(lang.delegate({
				shape: shape,
				duration: 1200,
				transform: [
					{name: "translate", start: [0, voffset - (voffset/vsize)], end: [0, 0]},
					{name: "scale", start: [1, 1/vsize], end: [1, 1]},
					{name: "original"}
				]
			}, this.animate)).play();
		}
		
	});
});

},
'dojox/lang/functional':function(){
define(["./functional/lambda", "./functional/array", "./functional/object"], function(df){
	return df;
});

},
'dojox/mobile/SimpleDialog':function(){
define([
	"dojo/_base/declare",
	"dojo/_base/window",
	"dojo/dom-class",
	"dojo/dom-attr",
	"dojo/dom-construct",
	"dojo/on",
	"dojo/touch",
	"dijit/registry",
	"./Pane",
	"./iconUtils",
	"dojo/has",
	"dojo/has!dojo-bidi?dojox/mobile/bidi/SimpleDialog"
], function(declare, win, domClass, domAttr, domConstruct, on, touch, registry, Pane, iconUtils, has, BidiSimpleDialog){
	// module:
	//		dojox/mobile/SimpleDialog

	var SimpleDialog = declare(has("dojo-bidi") ? "dojox.mobile.NonBidiSimpleDialog" : "dojox.mobile.SimpleDialog", Pane, {
		// summary:
		//		A dialog box for mobile.
		// description:
		//		SimpleDialog is a dialog box for mobile.
		//		When a SimpleDialog is created, it is initially hidden 
		//		(display="none"). To show the dialog box, you need to
		//		get a reference to the widget and to call its show() method.
		//
		//		The contents can be arbitrary HTML, text, or widgets. Note,
		//		however, that the widget is initially hidden. You need to be
		//		careful when you place in a SimpleDialog elements that cannot 
		//		be initialized in hidden state.
		//
		//		This widget has much less functionalities than dijit/Dialog, 
		//		but it has the advantage of a much smaller code size.

		// top: String
		//		The top edge position of the widget. If "auto", the widget is
		//		placed at the middle of the screen. Otherwise, the value
		//		(ex. "20px") is used as the top style of widget's domNode.
		top: "auto",

		// left: String
		//		The left edge position of the widget. If "auto", the widget is
		//		placed at the center of the screen. Otherwise, the value
		//		(ex. "20px") is used as the left style of widget's domNode.
		left: "auto",

		// modal: Boolean
		//		If true, a translucent cover is added over the entire page to
		//		prevent the user from interacting with elements on the page.
		modal: true,

		// closeButton: [const] Boolean
		//		If true, a button to close the dialog box is displayed at the
		//		top-right corner.
		//		Note that changing the value of the property after the widget
		//		creation has no effect.
		closeButton: false,

		// closeButtonClass: String
		//		A class name of a DOM button to be used as a close button.
		closeButtonClass: "mblDomButtonSilverCircleRedCross",

		// tabIndex: String
		//		Tabindex setting for the item so users can hit the tab key to
		//		focus on it.
		tabIndex: "0",
		
		// _setTabIndexAttr: [private] String
		//		Sets tabIndex to domNode.
		_setTabIndexAttr: "",

		/* internal properties */	
		
		// baseClass: String
		//		The name of the CSS class of this widget.
		baseClass: "mblSimpleDialog",
		
		// _cover: [private] Array
		//		Array for sharing the cover instances.
		_cover: [],

		buildRendering: function(){
			this.containerNode = domConstruct.create("div", {className:"mblSimpleDialogContainer"});
			if(this.srcNodeRef){
				// reparent
				for(var i = 0, len = this.srcNodeRef.childNodes.length; i < len; i++){
					this.containerNode.appendChild(this.srcNodeRef.removeChild(this.srcNodeRef.firstChild));
				}
			}
			this.inherited(arguments);
			domAttr.set(this.domNode, "role", "dialog");
			
			if(this.containerNode.getElementsByClassName){ //TODO: Do we need to support IE8 a11y?
	            var titleNode = this.containerNode.getElementsByClassName("mblSimpleDialogTitle")[0];
	            if (titleNode){
	            	titleNode.id = titleNode.id || registry.getUniqueId("dojo_mobile_mblSimpleDialogTitle");
	            	domAttr.set(this.domNode, "aria-labelledby", titleNode.id);
	            }
	            var textNode = this.containerNode.getElementsByClassName("mblSimpleDialogText")[0];
	            if (textNode){
	                textNode.id = textNode.id || registry.getUniqueId("dojo_mobile_mblSimpleDialogText");
	                domAttr.set(this.domNode, "aria-describedby", textNode.id);
	            }
			}
			domClass.add(this.domNode, "mblSimpleDialogDecoration");
			this.domNode.style.display = "none";
			this.domNode.appendChild(this.containerNode);
			if(this.closeButton){
				this.closeButtonNode = domConstruct.create("div", {
					className: "mblSimpleDialogCloseBtn "+this.closeButtonClass
				}, this.domNode);
				iconUtils.createDomButton(this.closeButtonNode);
				this.connect(this.closeButtonNode, "onclick", "_onCloseButtonClick");
			}
			this.connect(this.domNode, "onkeydown", "_onKeyDown"); // for desktop browsers
		},

		startup: function(){
			if(this._started){ return; }
			this.inherited(arguments);
			win.body().appendChild(this.domNode);
		},

		addCover: function(){
			// summary:
			//		Adds the transparent DIV cover.
			if(!this._cover[0]){
				this._cover[0] = domConstruct.create("div", {
					className: "mblSimpleDialogCover"
				}, win.body());
			}else{
				this._cover[0].style.display = "";
			}

			if(has("windows-theme")) {
				// Hack to prevent interaction with elements placed under cover div.
				this.own(on(this._cover[0], touch.press, function() {}));
			}
		},

		removeCover: function(){
			// summary:
			//		Removes the transparent DIV cover.
			this._cover[0].style.display = "none";
		},

		_onCloseButtonClick: function(e){
			// tags:
			//		private
			if(this.onCloseButtonClick(e) === false){ return; } // user's click action
			this.hide();
		},

		onCloseButtonClick: function(/*Event*/ /*===== e =====*/){
			// summary:
			//		User-defined function to handle clicks.
			// tags:
			//		callback
		},

		_onKeyDown: function(e){
			// tags:
			//		private
			if(e.keyCode == 27){ // ESC
				this.hide();
			}
		},

		refresh: function(){ // TODO: should we call refresh on resize?
			// summary:
			//		Refreshes the layout of the dialog.
			var n = this.domNode;
			var h;
			if(this.closeButton){
				var b = this.closeButtonNode;
				var s = Math.round(b.offsetHeight / 2);
				b.style.top = -s + "px";
				b.style.left = n.offsetWidth - s + "px";
			}
			if(this.top === "auto"){
				h = win.global.innerHeight || win.doc.documentElement.clientHeight;
				n.style.top = Math.round((h - n.offsetHeight) / 2) + "px";
			}else{
				n.style.top = this.top;
			}
			if(this.left === "auto"){
				h = win.global.innerWidth || win.doc.documentElement.clientWidth;
				n.style.left = Math.round((h - n.offsetWidth) / 2) + "px";
			}else{
				n.style.left = this.left;
			}
		},

		show: function(){
			// summary:
			//		Shows the dialog.
			if(this.domNode.style.display === ""){ return; }
			if(this.modal){
				this.addCover();
			}
			this.domNode.style.display = "";
			this.resize(); // #15628
			this.refresh();
			var diaglogButton;
			if(this.domNode.getElementsByClassName){
				diaglogButton = this.domNode.getElementsByClassName("mblSimpleDialogButton")[0];
			}
			var focusNode = diaglogButton || this.closeButtonNode || this.domNode; // Focus preference is: user supplied button, close button, entire dialog
			/// on Safari iOS the focus is not taken without a timeout
			this.defer(function(){ focusNode.focus();}, 1000);
		},

		hide: function(){
			// summary:
			//		Hides the dialog.
			if(this.domNode.style.display === "none"){ return; }
			this.domNode.style.display = "none";
			if(this.modal){
				this.removeCover();
			}
		}
	});
	return has("dojo-bidi") ? declare("dojox.mobile.SimpleDialog", [SimpleDialog, BidiSimpleDialog]) : SimpleDialog;
});

},
'dojox/app/ViewBase':function(){
define(["require", "dojo/when", "dojo/on", "dojo/dom-attr", "dojo/dom-style", "dojo/_base/declare", "dojo/_base/lang",
	"dojo/Deferred", "./utils/model", "./utils/constraints"],
	function(require, when, on, domAttr, domStyle, declare, lang, Deferred, model, constraints){
	return declare("dojox.app.ViewBase", null, {
		// summary:
		//		View base class with model & controller capabilities. Subclass must implement rendering capabilities.
		constructor: function(params){
			// summary:
			//		Constructs a ViewBase instance.
			// params:
			//		view parameters, include:
			//
			//		- app: the app
			//		- id: view id
			//		- name: view name
			//		- parent: parent view
			//		- controller: view controller module identifier
			//		- children: children views
			this.id = "";
			this.name = "";
			this.children = {};
			this.selectedChildren = {};
			this.loadedStores = {};
			// private
			this._started = false;
			lang.mixin(this, params);
			// mixin views configuration to current view instance.
			if(this.parent.views){
				lang.mixin(this, this.parent.views[this.name]);
			}
		},

		// start view
		start: function(){
			// summary:
			//		start view object.
			//		load view template, view controller implement and startup all widgets in view template.
			if(this._started){
				return this;
			}
			this._startDef = new Deferred();
			when(this.load(), lang.hitch(this, function(){
				// call setupModel, after setupModel startup will be called after startup the loadViewDeferred will be resolved
				this._createDataStore(this);
				this._setupModel();
			}));
			return this._startDef;
		},

		load: function(){
			var vcDef = this._loadViewController();
			when(vcDef, lang.hitch(this, function(controller){
				if(controller){
					lang.mixin(this, controller);
				}
			}));
			return vcDef;
		},

		_createDataStore: function(){
			// summary:
			//		Create data store instance for View specific stores
			//
			// TODO: move this into a common place for use by main and ViewBase
			//
			if(this.parent.loadedStores){
				lang.mixin(this.loadedStores, this.parent.loadedStores);
			}

			if(this.stores){
				//create stores in the configuration.
				for(var item in this.stores){
					if(item.charAt(0) !== "_"){//skip the private properties
						var type = this.stores[item].type ? this.stores[item].type : "dojo/store/Memory";
						var config = {};
						if(this.stores[item].params){
							lang.mixin(config, this.stores[item].params);
						}
						// we assume the store is here through dependencies
						try{
							var storeCtor = require(type);
						}catch(e){
							throw new Error(type+" must be listed in the dependencies");
						}
						if(config.data && lang.isString(config.data)){
							//get the object specified by string value of data property
							//cannot assign object literal or reference to data property
							//because json.ref will generate __parent to point to its parent
							//and will cause infinitive loop when creating StatefulModel.
							config.data = lang.getObject(config.data);
						}
						if(this.stores[item].observable){
							try{
								var observableCtor = require("dojo/store/Observable");
							}catch(e){
								throw new Error("dojo/store/Observable must be listed in the dependencies");
							}
							this.stores[item].store = observableCtor(new storeCtor(config));
						}else{
							this.stores[item].store = new storeCtor(config);
						}
						this.loadedStores[item] = this.stores[item].store; // add this store to loadedStores for the view							
					}
				}
			}
		},

		_setupModel: function(){
			// summary:
			//		Load views model if it is not already loaded then call _startup.
			// tags:
			//		private
						
			if(!this.loadedModels){
				var createPromise;
				try{
					createPromise = model(this.models, this.parent, this.app);
				}catch(e){
					throw new Error("Error creating models: "+e.message);
				}
				when(createPromise, lang.hitch(this, function(models){
					if(models){
						// if models is an array it comes from dojo/promise/all. Each array slot contains the same result object
						// so pick slot 0.
						this.loadedModels = lang.isArray(models)?models[0]:models;
					}
					this._startup();
				}),
				function(err){
					throw new Error("Error creating models: "+err.message);					
				});
			}else{ // loadedModels already created so call _startup
				this._startup();				
			}		
		},

		_startup: function(){
			// summary:
			//		startup widgets in view template.
			// tags:
			//		private

			this._initViewHidden();
			this._needsResize = true; // flag used to be sure resize has been called before transition

			this._startLayout();
		},

		_initViewHidden: function(){
			domStyle.set(this.domNode, "visibility", "hidden");
		},

		_startLayout: function(){
			// summary:
			//		startup widgets in view template.
			// tags:
			//		private
			this.app.log("  > in app/ViewBase _startLayout firing layout for name=[",this.name,"], parent.name=[",this.parent.name,"]");

			if(!this.hasOwnProperty("constraint")){
				this.constraint = domAttr.get(this.domNode, "data-app-constraint") || "center";
			}
			constraints.register(this.constraint);


			this.app.emit("app-initLayout", {
				"view": this, 
				"callback": lang.hitch(this, function(){
						//start widget
						this.startup();

						// call view assistant's init() method to initialize view
						this.app.log("  > in app/ViewBase calling init() name=[",this.name,"], parent.name=[",this.parent.name,"]");
						this.init();
						this._started = true;
						if(this._startDef){
							this._startDef.resolve(this);
						}
				})
			});
		},


		_loadViewController: function(){
			// summary:
			//		Load view controller by configuration or by default.
			// tags:
			//		private
			//
			var viewControllerDef = new Deferred();
			var path;

			if(!this.controller){ // no longer using this.controller === "none", if we dont have one it means none.
				this.app.log("  > in app/ViewBase _loadViewController no controller set for view name=[",this.name,"], parent.name=[",this.parent.name,"]");
				viewControllerDef.resolve(true);
				return viewControllerDef;
			}else{
				path = this.controller.replace(/(\.js)$/, "");
			}

			var requireSignal;
			try{
				var loadFile = path;
				var index = loadFile.indexOf("./");
				if(index >= 0){
					loadFile = path.substring(index+2);
				}
				requireSignal = require.on ? require.on("error", function(error){
					if(viewControllerDef.isResolved() || viewControllerDef.isRejected()){
						return;
					}
					if(error.info[0] && (error.info[0].indexOf(loadFile) >= 0)){
						viewControllerDef.resolve(false);
						if(requireSignal){
							requireSignal.remove();
						}
					}
				}) : null;

				if(path.indexOf("./") == 0){
					path = "app/"+path;
				}

				require([path], function(controller){
					viewControllerDef.resolve(controller);
					if(requireSignal){
						requireSignal.remove();
					}
				});
			}catch(e){
				viewControllerDef.reject(e);
				if(requireSignal){
					requireSignal.remove();
				}
			}
			return viewControllerDef;
		},

		init: function(){
			// summary:
			//		view life cycle init()
		},

		beforeActivate: function(){
			// summary:
			//		view life cycle beforeActivate()
		},

		afterActivate: function(){
			// summary:
			//		view life cycle afterActivate()
		},

		beforeDeactivate: function(){
			// summary:
			//		view life cycle beforeDeactivate()
		},

		afterDeactivate: function(){
			// summary:
			//		view life cycle afterDeactivate()
		},

		destroy: function(){
			// summary:
			//		view life cycle destroy()
		}
	});
});

},
'dojox/gfx/bezierutils':function(){
define([
	"./_base"
], function(gfx){

	var bu = gfx.bezierutils = {},
		error = 0.1;

	var tAtLength = bu.tAtLength = function(points, length){
		// summary:
		//		Returns the t corresponding to the given length for the specified bezier curve.
		// points: Number[]
		//		The bezier points. Should be [p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y] for a cubic
		//		bezier curve or [p1x, p1y, cx, cy, p2x, p2y] for a quadratic bezier curve.
		// length: Number
		//		The length.
		var t = 0,
			quadratic = points.length == 6,
			currentLen = 0,
			splitCount = 0,
			splitFunc = quadratic ? splitQBezierAtT : splitBezierAtT;
		var _compute = function(p, error){
			// control points polygon length
			var pLen = 0;
			for(var i = 0; i < p.length-2; i+=2)
				pLen += distance(p[i],p[i+1],p[i+2],p[i+3]);
			// chord length
			var chord = quadratic ?
				distance(points[0],points[1],points[4],points[5]) :
				distance(points[0],points[1],points[6],points[7]);
			// if needs more approx. or if currentLen is greater than the target length,
			// split the curve one more time
			if(pLen - chord > error || currentLen + pLen > length + error){
				++splitCount;
				var newbezier = splitFunc(p, .5);
				// check 1st subpath
				_compute(newbezier[0], error);
				// the 1st subcurve was the good one, we stop
				if(Math.abs(currentLen - length) <= error){
					return;
				}
				// need to continue with the 2nde subcurve
				_compute(newbezier[1], error);
				return ;
			}
			currentLen += pLen;
			t += 1.0 / (1 << splitCount);
		};
		if(length)
			_compute(points, 0.5);
		return t;
	};

	var computeLength = bu.computeLength = function(/*Array*/points){
		// summary:
		//		Returns the length of the given bezier curve.
		// points: Number[]
		//		The bezier points. Should be [p1x, p1y, c1x, c1y, c2x, c2y, p2x, p2y] for a cubic
		//		bezier curve or [p1x, p1y, cx, cy, p2x, p2y] for a quadratic bezier curve.

		var quadratic = points.length == 6, pLen=0;
		// control points polygon length
		for(var i = 0; i < points.length-2; i+=2)
			pLen += distance(points[i],points[i+1],points[i+2],points[i+3]);
		// chord length
		var chord = quadratic ?
			distance(points[0],points[1],points[4],points[5]) :
			distance(points[0],points[1],points[6],points[7]);
		// split polygons until the polygon and the chord are "the same"
		if(pLen-chord>error){
			var newBeziers = quadratic ? splitQBezierAtT(points,.5) : splitCBezierAtT(points,.5);
			var length = computeLength(newBeziers[0], quadratic);
			length += computeLength(newBeziers[1], quadratic);
			return length;
		}
		// pLen is close enough, done.
		return pLen;
	};

	var distance = bu.distance = function(x1, y1, x2, y2){
		// summary:
		//		Returns the distance between the specified points.
		return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
	};

	var splitQBezierAtT = function(points, t){
		// summary:
		//		Split a quadratic bezier curve into 2 sub-quadratic beziers at the specified t.

		// de Casteljau
		var r = 1-t,
			r2 = r*r,
			t2 = t*t,
			p1x = points[0],
			p1y = points[1],
			cx = points[2],
			cy = points[3],
			p2x = points[4],
			p2y = points[5],

			ax = r*p1x + t*cx,
			ay = r*p1y + t*cy,
			bx = r*cx + t*p2x,
			by = r*cy + t*p2y,
			px = r2*p1x + 2*r*t*cx + t2*p2x,
			py = r2*p1y + 2*r*t*cy + t2*p2y;

		return [
			[
				p1x, p1y,
				ax, ay,
				px, py
			],
			[
				px, py,
				bx, by,
				p2x, p2y
			]
		];
	};

	var splitCBezierAtT = function(points, t){
		// summary:
		//		Split a cubic bezier curve into 2 sub-cubic beziers at the specified t.

		// de Casteljau
		var r = 1-t,
			r2 = r*r,
			r3 = r2*r,
			t2 = t*t,
			t3 = t2*t,
			p1x = points[0],
			p1y = points[1],
			c1x = points[2],
			c1y = points[3],
			c2x = points[4],
			c2y = points[5],
			p2x = points[6],
			p2y = points[7],

			ax = r*p1x + t*c1x,
			ay = r*p1y + t*c1y,
			cx = r*c2x + t*p2x,
			cy = r*c2y + t*p2y,
			mx = r2*p1x + 2*r*t*c1x + t2*c2x,
			my = r2*p1y + 2*r*t*c1y + t2*c2y,
			nx = r2*c1x + 2*r*t*c2x + t2*p2x,
			ny = r2*c1y + 2*r*t*c2y + t2*p2y,
			px = r3*p1x + 3*r2*t*c1x + 3*r*t2*c2x+t3*p2x,
			py = r3*p1y + 3*r2*t*c1y + 3*r*t2*c2y+t3*p2y;

		return [
			[
				p1x, p1y,
				ax, ay,
				mx, my,
				px, py
			],
			[
				px, py,
				nx, ny,
				cx, cy,
				p2x, p2y
			]
		];
	};

	var splitBezierAtT = bu.splitBezierAtT = function(points, t){
		return points.length == 6 ? splitQBezierAtT(points, t) : splitCBezierAtT(points, t);
	};
	return bu;
});
},
'money/nls/tags':function(){
define({
	root: {
		title	: "My tags",
	    settings: 'Settings',
	    add		: 'Add',
	    noTags	: 'You don\'t have any tags yet.',
	    addFirst: 'to add your first tag',
	    myTags	: 'My tags',
	    tap		: 'Tap',
	    deleteTag	: 'Delete tag',
	    yes	: 'Yes',
	    no	: 'No',
	    quantity: 'Frequency'
	    
	    
	    
	},
	'ru-ru': true
});

},
'money/nls/ru-ru/tags':function(){
define({
		title	: "Мои метки (категории)",
	    settings: 'Настройки',
	    add		: 'Добавить',
	    noTags	: 'Метки можно использовать для разбиения Ваших транзакций на категории.',
	    addFirst: 'чтобы добавить метку',
	    myTags	: 'Мои метки',
	    tap		: 'Нажмите',
	    deleteTag		: 'Удалить метку',
	    yes	: 'Да',
	    no	: 'Нет',
	    quantity: 'Частота'
	    
});

},
'dojox/app/utils/config':function(){
define(["dojo/sniff"], function(has){

// module:
//		dojox/app/utils/config

return {
	// summary:
	//		This module contains the config

	configProcessHas: function(/*Object*/ source){
		// summary:
		//		scan the source config for has checks and call configMerge to merge has sections, and remove the has sections from the source.
		// description:
		//		configProcessHas will scan the source config for has checks. 
		//		For each has section the items inside the has section will be tested with has (sniff)
		//		If the has test is true it will call configMerge to merge has sections back into the source config.
		//		It will always remove the has section from the source after processing it.
		//		The names in the has section can be separated by a comma, indicating that any of those being true will satisfy the test.
		// source:
		//		an object representing the config to be processed.
		// returns:
		//		the updated source object.
		for(var name in source){
			var	sval = source[name];
			if(name == "has"){ // found a "has" section in source
				for(var hasname in sval){ // get the hasnames from the has section
					if(!(hasname.charAt(0) == '_' && hasname.charAt(1) == '_') && sval && typeof sval === 'object'){
						// need to handle multiple has checks separated by a ",".
						var parts = hasname.split(',');
						if(parts.length > 0){
							while(parts.length > 0){ 	
								var haspart = parts.shift();
								// check for has(haspart) or if haspart starts with ! check for !(has(haspart))
								if((has(haspart)) || (haspart.charAt(0) == '!' && !(has(haspart.substring(1))))){ // if true this one should be merged
									var hasval = sval[hasname];
									this.configMerge(source, hasval); // merge this has section into the source config
									break;	// found a match for this multiple has test, so go to the next one
								}
							}
						}
					}
				}
				delete source["has"];	// after merge remove this has section from the config
			}else{
				if(!(name.charAt(0) == '_' && name.charAt(1) == '_') && sval && typeof sval === 'object'){
						this.configProcessHas(sval);
				}
			}
		}
		return source;
	},

	configMerge: function(/*Object*/ target, /*Object*/ source){
		// summary:
		//		does a deep copy of the source into the target to merge the config from the source into the target
		// description:
		//		configMerge will merge the source config into the target config with a deep copy.
		//		anything starting with __ will be skipped and if the target is an array the source items will be pushed into the target.
		// target:
		//		an object representing the config which will be updated by merging in the source.
		// source:
		//		an object representing the config to be merged into the target.
		// returns:
		//		the updated target object.

		for(var name in source){
			var tval = target[name];
			var	sval = source[name];
			if(tval !== sval && !(name.charAt(0) == '_' && name.charAt(1) == '_')){
				if(tval && typeof tval === 'object' && sval && typeof sval === 'object'){
					this.configMerge(tval, sval);
				}else{
					if(target instanceof Array){
						target.push(sval);
					}else{
						target[name] = sval;
					}
				}
			}
		}
		return target;
	}
};

});

},
'dojox/app/module/lifecycle':function(){
define(["dojo/_base/declare", "dojo/topic"], function(declare, topic){
	return declare(null, {

		lifecycle: {
			UNKNOWN: 0, //unknown
			STARTING: 1, //starting
			STARTED: 2, //started
			STOPPING: 3, //stopping
			STOPPED: 4 //stopped
		},

		_status: 0, //unknown

		getStatus: function(){
			return this._status;
		},

		setStatus: function(newStatus){
			this._status = newStatus;

			// publish /app/status event.
			// application can subscribe this event to do some status change operation.
			topic.publish("/app/status", newStatus);
		}
	});
});

},
'money/views/settings':function(){
define([
	"dojo/_base/declare","dojo/dom-class", "dojo/dom-style","dojo/dom-attr",
	"dojo/sniff", "dojo/dom-construct", "dojox/mobile/ListItem",
	"dojox/mobile/SimpleDialog", "dojox/mobile/ProgressIndicator",
	"dojo/_base/window","dojox/mobile/Button", "dojo/date/locale",'dojo/text!money/views/settings.html'
 ],
    function(declare,domClass, domStyle, domAttr,has, domConstruct, ListItem,  SimpleDialog, ProgressIndicator, win, Button, locale){
    
	return window.AppData.objSettings = {
		beforeActivate: function(contact){
			
        },
        init: function(){
			if(!window.AppData.isInitiallySmall){
				domClass.add(this.backButton.domNode,'hideOnMedium hideOnLarge')
			}
		}		
    };
});

},
'dojox/mobile/Accordion':function(){
define([
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/sniff",
	"dojo/dom-class",
	"dojo/dom-construct",
	"dojo/dom-attr",
	"dijit/_Contained",
	"dijit/_Container",
	"dijit/_WidgetBase",
	"./iconUtils",
	"./lazyLoadUtils",
	"./_css3",
	"./common",
	"require",
	"dojo/has!dojo-bidi?dojox/mobile/bidi/Accordion"
], function(array, declare, lang, has, domClass, domConstruct, domAttr, Contained, Container, WidgetBase, iconUtils, lazyLoadUtils, css3, common, require, BidiAccordion){

	// module:
	//		dojox/mobile/Accordion

	// inner class
	var _AccordionTitle = declare([WidgetBase, Contained], {
		// summary:
		//		A widget for the title of the accordion.
	
		// label: String
		//		The title of the accordion.
		label: "Label",
		
		// icon1: String
		//		A path for the unselected (typically dark) icon. If icon is not
		//		specified, the iconBase parameter of the parent widget is used.
		icon1: "",

		// icon2: String
		//		A path for the selected (typically highlight) icon. If icon is
		//		not specified, the iconBase parameter of the parent widget or
		//		icon1 is used.
		icon2: "",

		// iconPos1: String
		//		The position of an aggregated unselected (typically dark)
		//		icon. IconPos1 is a comma-separated list of values like
		//		top,left,width,height (ex. "0,0,29,29"). If iconPos1 is not
		//		specified, the iconPos parameter of the parent widget is used.
		iconPos1: "",

		// iconPos2: String
		//		The position of an aggregated selected (typically highlight)
		//		icon. IconPos2 is a comma-separated list of values like
		//		top,left,width,height (ex. "0,0,29,29"). If iconPos2 is not
		//		specified, the iconPos parameter of the parent widget or
		//		iconPos1 is used.
		iconPos2: "",

		// selected: Boolean
		//		If true, the widget is in the selected state.
		selected: false,

		// baseClass: String
		//		The name of the CSS class of this widget.
		baseClass: "mblAccordionTitle",

		buildRendering: function(){
			this.inherited(arguments);

			var a = this.anchorNode = domConstruct.create("a", {
				className: "mblAccordionTitleAnchor",
				role: "presentation"
			}, this.domNode);

			// text box
			this.textBoxNode = domConstruct.create("div", {className:"mblAccordionTitleTextBox"}, a);
			this.labelNode = domConstruct.create("span", {
				className: "mblAccordionTitleLabel",
				innerHTML: this._cv ? this._cv(this.label) : this.label
			}, this.textBoxNode);
			this._isOnLine = this.inheritParams();

			domAttr.set(this.textBoxNode, "role", "tab"); // A11Y
			domAttr.set(this.textBoxNode, "tabindex", "0");
		},

		postCreate: function(){
			this.connect(this.domNode, "onclick", "_onClick");
			common.setSelectable(this.domNode, false);
		},

		inheritParams: function(){
			var parent = this.getParent();
			if(parent){
				if(this.icon1 && parent.iconBase &&
					parent.iconBase.charAt(parent.iconBase.length - 1) === '/'){
					this.icon1 = parent.iconBase + this.icon1;
				}
				if(!this.icon1){ this.icon1 = parent.iconBase; }
				if(!this.iconPos1){ this.iconPos1 = parent.iconPos; }
				if(this.icon2 && parent.iconBase &&
					parent.iconBase.charAt(parent.iconBase.length - 1) === '/'){
					this.icon2 = parent.iconBase + this.icon2;
				}
				if(!this.icon2){ this.icon2 = parent.iconBase || this.icon1; }
				if(!this.iconPos2){ this.iconPos2 = parent.iconPos || this.iconPos1; }
			}
			return !!parent;
		},

		_setIcon: function(icon, n){
			// tags:
			//		private
			if(!this.getParent()){ return; } // icon may be invalid because inheritParams is not called yet
			this._set("icon" + n, icon);
			if(!this["iconParentNode" + n]){
				this["iconParentNode" + n] = domConstruct.create("div",
					{className:"mblAccordionIconParent mblAccordionIconParent" + n}, this.anchorNode, "first");
			}
			this["iconNode" + n] = iconUtils.setIcon(icon, this["iconPos" + n],
				this["iconNode" + n], this.alt, this["iconParentNode" + n]);
			this["icon" + n] = icon;
			domClass.toggle(this.domNode, "mblAccordionHasIcon", icon && icon !== "none");
			if(has("dojo-bidi") && !this.getParent().isLeftToRight()){
				this.getParent()._setIconDir(this["iconParentNode" + n]);
			}
		},

		_setIcon1Attr: function(icon){
			// tags:
			//		private
			this._setIcon(icon, 1);
		},

		_setIcon2Attr: function(icon){
			// tags:
			//		private
			this._setIcon(icon, 2);
		},

		startup: function(){
			if(this._started){ return; }
			if(!this._isOnLine){
				this.inheritParams();
			}
			if(!this._isOnLine){
				this.set({ // retry applying the attribute
					icon1: this.icon1,
					icon2: this.icon2
				});
			}
			this.inherited(arguments);
		},

		_onClick: function(e){
			// summary:
			//		Internal handler for click events.
			// tags:
			//		private
			if(this.onClick(e) === false){ return; } // user's click action
			var p = this.getParent();
			if(!p.fixedHeight && this.contentWidget.domNode.style.display !== "none"){
				p.collapse(this.contentWidget, !p.animation);
			}else{
				p.expand(this.contentWidget, !p.animation);
			}
		},

		onClick: function(/*Event*/ /*===== e =====*/){
			// summary:
			//		User-defined function to handle clicks
			// tags:
			//		callback
		},

		_setSelectedAttr: function(/*Boolean*/selected){
			// tags:
			//		private
			domClass.toggle(this.domNode, "mblAccordionTitleSelected", selected);
			this._set("selected", selected);
		}
	});

	var Accordion = declare(has("dojo-bidi") ? "dojox.mobile.NonBidiAccordion" : "dojox.mobile.Accordion", [WidgetBase, Container, Contained], {
		// summary:
		//		A container widget that can display a group of child panes in a stacked format.
		// description:
		//		Typically, dojox/mobile/Pane, dojox/mobile/Container, or dojox/mobile/ContentPane are 
		//		used as child widgets, but Accordion requires no specific child widget. 
		//		Accordion supports three modes for opening child panes: multiselect, fixed-height,
		//		and single-select. Accordion can have rounded corners, and it can lazy-load the 
		//		content modules.

		// iconBase: String
		//		The default icon path for child widgets.
		iconBase: "",

		// iconPos: String
		//		The default icon position for child widgets.
		iconPos: "",

		// fixedHeight: Boolean
		//		If true, the entire accordion widget has fixed height regardless
		//		of the height of each pane; in this mode, there is always an open pane and
		//		collapsing a pane can only be done by opening a different pane.
		fixedHeight: false,

		// singleOpen: Boolean
		//		If true, only one pane is open at a time. The current open pane
		//		is collapsed, when another pane is opened.
		singleOpen: false,

		// animation: Boolean
		//		If true, animation is used when a pane is opened or
		//		collapsed. The animation works only on webkit browsers.
		animation: true,

		// roundRect: Boolean
		//		If true, the widget shows rounded corners.
		//		Adding the "mblAccordionRoundRect" class to domNode has the same effect.
		roundRect: false,

		/* internal properties */
		duration: .3, // [seconds]

		// baseClass: String
		//		The name of the CSS class of this widget.
		baseClass: "mblAccordion",

		// _openSpace: [private] Number|String 
		_openSpace: 1,

		buildRendering: function(){
			this.inherited(arguments);
			domAttr.set(this.domNode, "role", "tablist"); // A11Y
			domAttr.set(this.domNode, "aria-multiselectable", !this.singleOpen); // A11Y
		},
		
		startup: function(){
			if(this._started){ return; }

			if(domClass.contains(this.domNode, "mblAccordionRoundRect")){
				this.roundRect = true;
			}else if(this.roundRect){
				domClass.add(this.domNode, "mblAccordionRoundRect");
			}

			if(this.fixedHeight){
				this.singleOpen = true;
			}
			var children = this.getChildren();
			array.forEach(children, this._setupChild, this);
			var sel;
			var posinset = 1;
			array.forEach(children, function(child){
				child.startup();
				child._at.startup();
				this.collapse(child, true);
				domAttr.set(child._at.textBoxNode, "aria-setsize", children.length);
				domAttr.set(child._at.textBoxNode, "aria-posinset", posinset++);
				if(child.selected){
					sel = child;
				}
			}, this);
			if(!sel && this.fixedHeight){
				sel = children[children.length - 1];
			}
			if(sel){
				this.expand(sel, true);
			}else{
				this._updateLast();
			}
			this.defer(function(){ this.resize(); });

			this._started = true;
		},

		_setupChild: function(/*Widget*/ child){
			// tags:
			//		private
			if(child.domNode.style.overflow != "hidden"){
				child.domNode.style.overflow = this.fixedHeight ? "auto" : "hidden";
			}
			child._at = new _AccordionTitle({
				label: child.label,
				alt: child.alt,
				icon1: child.icon1,
				icon2: child.icon2,
				iconPos1: child.iconPos1,
				iconPos2: child.iconPos2,
				contentWidget: child
			});
			domConstruct.place(child._at.domNode, child.domNode, "before");
			domClass.add(child.domNode, "mblAccordionPane");
			domAttr.set(child._at.textBoxNode, "aria-controls", child.domNode.id); // A11Y
			domAttr.set(child.domNode, "role", "tabpanel"); // A11Y
			domAttr.set(child.domNode, "aria-labelledby", child._at.id); // A11Y
		},

		addChild: function(/*Widget*/ widget, /*int?*/ insertIndex){
			this.inherited(arguments);
			if(this._started){
				this._setupChild(widget);
				widget._at.startup();
				if(widget.selected){
					this.expand(widget, true);
					this.defer(function(){
						widget.domNode.style.height = "";
					});
				}else{
					this.collapse(widget);
				}
				this._addChildAriaAttrs();
			}
		},

		removeChild: function(/*Widget|int*/ widget){
			if(typeof widget == "number"){
				widget = this.getChildren()[widget];
			}
			if(widget){
				widget._at.destroy();
			}
			this.inherited(arguments);
			this._addChildAriaAttrs();
		},
		
		_addChildAriaAttrs: function(){
			var posinset = 1;
			var children = this.getChildren();
			array.forEach(children, function(child){
				domAttr.set(child._at.textBoxNode, "aria-posinset", posinset++);
				domAttr.set(child._at.textBoxNode, "aria-setsize", children.length);
			});
		},

		getChildren: function(){
			return array.filter(this.inherited(arguments), function(child){
				return !(child instanceof _AccordionTitle);
			});
		},

		getSelectedPanes: function(){
			return array.filter(this.getChildren(), function(pane){
				return pane.domNode.style.display != "none";
			});
		},

		resize: function(){
			if(this.fixedHeight){
				var panes = array.filter(this.getChildren(), function(child){ // active pages
					return child._at.domNode.style.display != "none";
				});
				var openSpace = this.domNode.clientHeight; // height of all panes
				array.forEach(panes, function(child){
					openSpace -= child._at.domNode.offsetHeight;
				});
				this._openSpace = openSpace > 0 ? openSpace : 0;
				var sel = this.getSelectedPanes()[0];
				sel.domNode.style[css3.name("transition")] = "";
				sel.domNode.style.height = this._openSpace + "px";
			}
		},

		_updateLast: function(){
			// tags:
			//		private
			var children = this.getChildren();
			array.forEach(children, function(c, i){
				// add "mblAccordionTitleLast" to the last, closed accordion title
				domClass.toggle(c._at.domNode, "mblAccordionTitleLast",
					i === children.length - 1 && !domClass.contains(c._at.domNode, "mblAccordionTitleSelected"))
			}, this);
		},

		expand: function(/*Widget*/pane, /*boolean*/noAnimation){
			// summary:
			//		Expands the given pane to make it visible.
			// pane:
			//		A pane widget to expand.
			// noAnimation:
			//		If true, the pane expands immediately without animation effect.
			if(pane.lazy){
				lazyLoadUtils.instantiateLazyWidgets(pane.containerNode, pane.requires);
				pane.lazy = false;
			}
			var children = this.getChildren();
			array.forEach(children, function(c, i){
				c.domNode.style[css3.name("transition")] = noAnimation ? "" : "height "+this.duration+"s linear";
				if(c === pane){
					c.domNode.style.display = "";
					var h;
					if(this.fixedHeight){
						h = this._openSpace;
					}else{
						h = parseInt(c.height || c.domNode.getAttribute("height")); // ScrollableView may have the height property
						if(!h){
							c.domNode.style.height = "";
							h = c.domNode.offsetHeight;
							c.domNode.style.height = "0px";
						}
					}
					this.defer(function(){ // necessary for webkitTransition to work
						c.domNode.style.height = h + "px";
					});
					this.select(pane);
				}else if(this.singleOpen){
					this.collapse(c, noAnimation);
				}
			}, this);
			this._updateLast();
			domAttr.set(pane.domNode, "aria-expanded", "true"); // A11Y
			domAttr.set(pane.domNode, "aria-hidden", "false"); // A11Y
		},

		collapse: function(/*Widget*/pane, /*boolean*/noAnimation){
			// summary:
			//		Collapses the given pane to close it.
			// pane:
			//		A pane widget to collapse.
			// noAnimation:
			//		If true, the pane collapses immediately without animation effect.
			if(pane.domNode.style.display === "none"){ return; } // already collapsed
			pane.domNode.style[css3.name("transition")] = noAnimation ? "" : "height "+this.duration+"s linear";
			pane.domNode.style.height = "0px";
			if(!has("css3-animations") || noAnimation){
				pane.domNode.style.display = "none";
				this._updateLast();
			}else{
				// Adding a webkitTransitionEnd handler to panes may cause conflict
				// when the panes already have the one. (e.g. ScrollableView)
				var _this = this;
				_this.defer(function(){
					pane.domNode.style.display = "none";
					_this._updateLast();

					// Need to call parent view's resize() especially when the Accordion is
					// on a ScrollableView, the ScrollableView is scrolled to
					// the bottom, and then expand any other pane while in the
					// non-fixed singleOpen mode.
					if(!_this.fixedHeight && _this.singleOpen){
						for(var v = _this.getParent(); v; v = v.getParent()){
							if(domClass.contains(v.domNode, "mblView")){
								if(v && v.resize){ v.resize(); }
								break;
							}
						}
					}
				}, this.duration*1000);
			}
			this.deselect(pane);
			domAttr.set(pane.domNode, "aria-expanded", "false"); // A11Y
			domAttr.set(pane.domNode, "aria-hidden", "true"); // A11Y
		},

		select: function(/*Widget*/pane){
			// summary:
			//		Highlights the title bar of the given pane.
			// pane:
			//		A pane widget to highlight.
			pane._at.set("selected", true);
			domAttr.set(pane._at.textBoxNode, "aria-selected", "true"); // A11Y
		},

		deselect: function(/*Widget*/pane){
			// summary:
			//		Unhighlights the title bar of the given pane.
			// pane:
			//		A pane widget to unhighlight.
			pane._at.set("selected", false);
			domAttr.set(pane._at.textBoxNode, "aria-selected", "false"); // A11Y
		}
	});
	
	Accordion.ChildWidgetProperties = {
		// summary:
		//		These properties can be specified for the children of a dojox/mobile/Accordion.

		// alt: String
		//		The alternate text of the Accordion title.
		alt: "",
		// label: String
		//		The label of the Accordion title.
		label: "",
		// icon1: String
		//		The unselected icon of the Accordion title.
		icon1: "",
		// icon2: String
		//		The selected icon of the Accordion title.
		icon2: "",
		// iconPos1: String
		//		The position ("top,left,width,height") of the unselected aggregated icon of the Accordion title.
		iconPos1: "",
		// iconPos2: String
		//		The position ("top,left,width,height") of the selected aggregated icon of the Accordion title.
		iconPos2: "",
		// selected: Boolean
		//		The selected state of the Accordion title.
		selected: false,
		// lazy: Boolean
		//		Specifies that the Accordion child must be lazily loaded.
		lazy: false
	};

	// Since any widget can be specified as an Accordion child, mix ChildWidgetProperties
	// into the base widget class.  (This is a hack, but it's effective.)
	// This is for the benefit of the parser.   Remove for 2.0.  Also, hide from doc viewer.
	lang.extend(WidgetBase, /*===== {} || =====*/ Accordion.ChildWidgetProperties);

	return has("dojo-bidi") ? declare("dojox.mobile.Accordion", [Accordion, BidiAccordion]) : Accordion;
});

},
'money/views/tagspicker':function(){
define(["dijit/registry","dojo/_base/array","dojo/query","dojo/sniff","dojo/dom-class",'dojo/text!money/views/tagspicker.html'],
    function(registry, arrayUtil, query, has, domClass){
 
		return window.AppData.objTags = {
			
			beforeActivate: function(){
				if(window.AppData.objDet){
					//this.tagsPicker.set('store',window.AppData.tagsStore)
					
					this.tagsPicker.set('store',window.AppData.tagsStore)
					this.tagsPicker.refresh()
					
					registry.byId('newTags').set('value', window.AppData.details.tags.get('label'));
					this.initializeList()
				}else{//if details view is not initialized goto details
					this.app.transitionToView(this.domNode, {target: 'details' , transitionDir: 1, params: { 'edit' : true } })
				}
			},
			init: function(){
				window.AppData.tagsPickerOverlay = this
				this.tagsPicker.set('store',window.AppData.tagsStore)
				if(has('isInitiallySmall')){
					domClass.remove	(this.domNode, "left");
				}
			},
			initializeList: function(){
				//window.registry = registry
				console.log('initializeng tag list')
				var tags = window.AppData.details.transaction.tags,q
				var taglis = window.AppData.tagsPickerOverlay.tagsPicker.getChildren()
				for (var i in taglis)
					taglis[i].set('checked',false)
				for (var i in tags){
					if(registry.byId(String(tags[i]))){
						registry.byId(String(tags[i])).set('checked',true)
					}else
					if(q = window.AppData.tagsStore.query({label: String(tags[i])})[0])
						if(registry.byId(q.id))
							registry.byId(q.id).set('checked',true)
				}
				var list = query("#tagsPicker .mblListItem")
				arrayUtil.forEach(list,function(li){
					if(!registry.byId(String(li.id))._onClickSetUp){
						registry.byId(String(li.id)).onClick = function(){
							var val = registry.byId('newTags').get('value');
							var tag = window.AppData.tagsStore.get(this.id)
							var tagl = String(tag.label).toLowerCase(), tagn = String(tag.label)
							//alert('current: '+val+ 'tag: '+tagn)
							if(val.toLowerCase().indexOf(tagl) + 1){
								var end = trim(val.substr(val.toLowerCase().indexOf(tagl)+tagl.length,val.length-1))
								var beg = trim(val.substr(0, val.toLowerCase().indexOf(tagl)))
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
			}
		}
	}
);

},
'dojox/charting/themes/PrimaryColors':function(){
define(["../Theme", "./gradientGenerator", "./common"], function(Theme, gradientGenerator, themes){

	var colors = ["#f00", "#0f0", "#00f", "#ff0", "#0ff", "#f0f", "./common"],
		defaultFill = {type: "linear", space: "plot", x1: 0, y1: 0, x2: 0, y2: 100};

	themes.PrimaryColors = new Theme({
		seriesThemes: gradientGenerator.generateMiniTheme(colors, defaultFill, 90, 40, 25)
	});
	
	return themes.PrimaryColors;
});

},
'dojox/app/utils/model':function(){
define(["dojo/_base/lang", "dojo/Deferred", "dojo/promise/all", "dojo/when"], function(lang, Deferred, all, when){
	return function(/*Object*/ config, /*Object*/ parent, /*Object*/ app){
		// summary:
		//		model is called to create all of the models for the app, and all models for a view, it will
		//		create and call the appropriate model utility based upon the modelLoader set in the model in the config
		// description:
		//		Called for each view or for the app.  For each model in the config, it will  
		//		create the model utility based upon the modelLoader and call it to create and load the model. 
		// config: Object
		//		The models section of the config for this view or for the app.
		// parent: Object
		//		The parent of this view or the app itself, so that models from the parent will be 
		//		available to the view.
		// returns: loadedModels 
		//		 loadedModels is an object holding all of the available loaded models for this view.
		var loadedModels = {};
		if(parent.loadedModels){
			lang.mixin(loadedModels, parent.loadedModels);
		}
		if(config){
			var allDeferred = [];
			for(var item in config){
				if(item.charAt(0) !== "_"){
					allDeferred.push(setupModel(config, item, app, loadedModels));
				}
			}
			return (allDeferred.length == 0) ? loadedModels : all(allDeferred);
		}else{
			return loadedModels;
		}
	};

	function setupModel(config, item, app, loadedModels){
		// Here we need to create the modelLoader and call it passing in the item and the config[item].params
		var params = config[item].params ? config[item].params : {};

		var modelLoader = config[item].modelLoader ? config[item].modelLoader : "dojox/app/utils/simpleModel";
		// modelLoader must be listed in the dependencies and has thus already been loaded so it _must_ be here
		// => no need for complex code here
		try{
			var modelCtor = require(modelLoader);
		}catch(e){
			throw new Error(modelLoader+" must be listed in the dependencies");
		}
		var loadModelDeferred = new Deferred();
		var createModelPromise;
		try{
			createModelPromise = modelCtor(config, params, item);
		}catch(e){
			throw new Error("Error creating "+modelLoader+" for model named ["+item+"]: "+e.message);
		}
		when(createModelPromise, lang.hitch(this, function(newModel){
			loadedModels[item] = newModel;
			app.log("in app/model, for item=[",item,"] loadedModels =", loadedModels);
			loadModelDeferred.resolve(loadedModels);
			return loadedModels;
		}), function(e){
			throw new Error("Error loading model named ["+item+"]: "+e.message);
		});
		return loadModelDeferred;
	}
});

},
'dojo/store/util/SimpleQueryEngine':function(){
define(["../../_base/array" /*=====, "../api/Store" =====*/], function(arrayUtil /*=====, Store =====*/){

// module:
//		dojo/store/util/SimpleQueryEngine

return function(query, options){
	// summary:
	//		Simple query engine that matches using filter functions, named filter
	//		functions or objects by name-value on a query object hash
	//
	// description:
	//		The SimpleQueryEngine provides a way of getting a QueryResults through
	//		the use of a simple object hash as a filter.  The hash will be used to
	//		match properties on data objects with the corresponding value given. In
	//		other words, only exact matches will be returned.
	//
	//		This function can be used as a template for more complex query engines;
	//		for example, an engine can be created that accepts an object hash that
	//		contains filtering functions, or a string that gets evaluated, etc.
	//
	//		When creating a new dojo.store, simply set the store's queryEngine
	//		field as a reference to this function.
	//
	// query: Object
	//		An object hash with fields that may match fields of items in the store.
	//		Values in the hash will be compared by normal == operator, but regular expressions
	//		or any object that provides a test() method are also supported and can be
	//		used to match strings by more complex expressions
	//		(and then the regex's or object's test() method will be used to match values).
	//
	// options: dojo/store/api/Store.QueryOptions?
	//		An object that contains optional information such as sort, start, and count.
	//
	// returns: Function
	//		A function that caches the passed query under the field "matches".  See any
	//		of the "query" methods on dojo.stores.
	//
	// example:
	//		Define a store with a reference to this engine, and set up a query method.
	//
	//	|	var myStore = function(options){
	//	|		//	...more properties here
	//	|		this.queryEngine = SimpleQueryEngine;
	//	|		//	define our query method
	//	|		this.query = function(query, options){
	//	|			return QueryResults(this.queryEngine(query, options)(this.data));
	//	|		};
	//	|	};

	// create our matching query function
	switch(typeof query){
		default:
			throw new Error("Can not query with a " + typeof query);
		case "object": case "undefined":
			var queryObject = query;
			query = function(object){
				for(var key in queryObject){
					var required = queryObject[key];
					if(required && required.test){
						// an object can provide a test method, which makes it work with regex
						if(!required.test(object[key], object)){
							return false;
						}
					}else if(required != object[key]){
						return false;
					}
				}
				return true;
			};
			break;
		case "string":
			// named query
			if(!this[query]){
				throw new Error("No filter function " + query + " was found in store");
			}
			query = this[query];
			// fall through
		case "function":
			// fall through
	}
	function execute(array){
		// execute the whole query, first we filter
		var results = arrayUtil.filter(array, query);
		// next we sort
		var sortSet = options && options.sort;
		if(sortSet){
			results.sort(typeof sortSet == "function" ? sortSet : function(a, b){
				for(var sort, i=0; sort = sortSet[i]; i++){
					var aValue = a[sort.attribute];
					var bValue = b[sort.attribute];
					// valueOf enables proper comparison of dates
					aValue = aValue != null ? aValue.valueOf() : aValue;
					bValue = bValue != null ? bValue.valueOf() : bValue;
					if (aValue != bValue){
						return !!sort.descending == (aValue == null || aValue > bValue) ? -1 : 1;
					}
				}
				return 0;
			});
		}
		// now we paginate
		if(options && (options.start || options.count)){
			var total = results.length;
			results = results.slice(options.start || 0, (options.start || 0) + (options.count || Infinity));
			results.total = total;
		}
		return results;
	}
	execute.matches = query;
	return execute;
};

});

},
'dojox/charting/plot2d/Pie':function(){
define(["dojo/_base/lang", "dojo/_base/array" ,"dojo/_base/declare", 
		"./Base", "./_PlotEvents", "./common",
		"dojox/gfx", "dojox/gfx/matrix", "dojox/lang/functional", "dojox/lang/utils","dojo/has"],
	function(lang, arr, declare, Base, PlotEvents, dc, g, m, df, du, has){

	/*=====
	declare("dojox.charting.plot2d.__PieCtorArgs", dojox.charting.plot2d.__DefaultCtorArgs, {
		// summary:
		//		Specialized keyword arguments object for use in defining parameters on a Pie chart.
	
		// labels: Boolean?
		//		Whether or not to draw labels for each pie slice.  Default is true.
		labels:			true,
	
		// ticks: Boolean?
		//		Whether or not to draw ticks to labels within each slice. Default is false.
		ticks:			false,
	
		// fixed: Boolean?
		//		Whether a fixed precision must be applied to data values for display. Default is true.
		fixed:			true,
	
		// precision: Number?
		//		The precision at which to round data values for display. Default is 0.
		precision:		1,
	
		// labelOffset: Number?
		//		The amount in pixels by which to offset labels.  Default is 20.
		labelOffset:	20,
	
		// labelStyle: String?
		//		Options as to where to draw labels.  Values include "default", and "columns".	Default is "default".
		labelStyle:		"default",	// default/columns
		
		// omitLabels: Boolean?
		//		Whether labels of slices small to the point of not being visible are omitted.	Default false.
		omitLabels: false,
		
		// htmlLabels: Boolean?
		//		Whether or not to use HTML to render slice labels. Default is true.
		htmlLabels:		true,
	
		// radGrad: String?
		//		The type of radial gradient to use in rendering.  Default is "native".
		radGrad:        "native",
	
		// fanSize: Number?
		//		The amount for a radial gradient.  Default is 5.
		fanSize:		5,
	
		// startAngle: Number?
		//		Where to being rendering gradients in slices, in degrees.  Default is 0.
		startAngle:     0,
	
		// radius: Number?
		//		The size of the radial gradient.  Default is 0.
		radius:		0,

		// shadow: dojox.gfx.Stroke?
		//		An optional stroke to use to draw any shadows for a series on a plot.
		shadow:		{},

		// fill: dojox.gfx.Fill?
		//		Any fill to be used for elements on the plot.
		fill:		{},

		// filter: dojox.gfx.Filter?
		//		An SVG filter to be used for elements on the plot. gfx SVG renderer must be used and dojox/gfx/svgext must
		//		be required for this to work.
		filter:		{},

		// styleFunc: Function?
		//		A function that returns a styling object for the a given data item.
		styleFunc:	null
	});
	=====*/

	var FUDGE_FACTOR = 0.2; // use to overlap fans

	return declare("dojox.charting.plot2d.Pie", [Base, PlotEvents], {
		// summary:
		//		The plot that represents a typical pie chart.
		defaultParams: {
			labels:			true,
			ticks:			false,
			fixed:			true,
			precision:		1,
			labelOffset:	20,
			labelStyle:		"default",	// default/columns
			htmlLabels:		true,		// use HTML to draw labels
			radGrad:        "native",	// or "linear", or "fan"
			fanSize:		5,			// maximum fan size in degrees
			startAngle:     0			// start angle for slices in degrees
		},
		optionalParams: {
			radius:		0,
			omitLabels: false,
			// theme components
			stroke:		{},
			outline:	{},
			shadow:		{},
			fill:		{},
			filter:     {},
			styleFunc:	null,
			font:		"",
			fontColor:	"",
			labelWiring: {}
		},

		constructor: function(chart, kwArgs){
			// summary:
			//		Create a pie plot.
			this.opt = lang.clone(this.defaultParams);
			du.updateWithObject(this.opt, kwArgs);
			du.updateWithPattern(this.opt, kwArgs, this.optionalParams);
			this.axes = [];
			this.run = null;
			this.dyn = [];
			this.runFilter = []; 
		},
		clear: function(){
			// summary:
			//		Clear out all of the information tied to this plot.
			// returns: dojox/charting/plot2d/Pie
			//		A reference to this plot for functional chaining.
			this.inherited(arguments);
			this.dyn = [];
			this.run = null;
			return this;	//	dojox/charting/plot2d/Pie
		},
		setAxis: function(axis){
			// summary:
			//		Dummy method, since axes are irrelevant with a Pie chart.
			// returns: dojox/charting/plot2d/Pie
			//		The reference to this plot for functional chaining.
			return this;	//	dojox/charting/plot2d/Pie
		},
		addSeries: function(run){
			// summary:
			//		Add a series of data to this plot.
			// returns: dojox/charting/plot2d/Pie
			//		The reference to this plot for functional chaining.
			this.run = run;
			return this;	//	dojox/charting/plot2d/Pie
		},
		getSeriesStats: function(){
			// summary:
			//		Returns default stats (irrelevant for this type of plot).
			// returns: Object
			//		{hmin, hmax, vmin, vmax} min/max in both directions.
			return lang.delegate(dc.defaultStats); // Object
		},
		getRequiredColors: function(){
			// summary:
			//		Return the number of colors needed to draw this plot.
			return this.run ? this.run.data.length : 0;
		},
		render: function(dim, offsets){
			// summary:
			//		Render the plot on the chart.
			// dim: Object
			//		An object of the form { width, height }.
			// offsets: Object
			//		An object of the form { l, r, t, b }.
			// returns: dojox/charting/plot2d/Pie
			//		A reference to this plot for functional chaining.
			if(!this.dirty){ return this; }
			this.resetEvents();
			this.dirty = false;
			this._eventSeries = {};
			this.cleanGroup();
			var s = this.group, t = this.chart.theme;

			if(!this.run || !this.run.data.length){
				return this;
			}

			// calculate the geometry
			var rx = (dim.width  - offsets.l - offsets.r) / 2,
				ry = (dim.height - offsets.t - offsets.b) / 2,
				r  = Math.min(rx, ry),
				labelFont = "font" in this.opt ? this.opt.font : t.series.font,
				size,
				startAngle = m._degToRad(this.opt.startAngle),
				start = startAngle, filteredRun, slices, labels, shift, labelR,
				events = this.events();

			var run = arr.map(this.run.data, function(item, i){
				if(typeof item != "number" && item.hidden){ 
					this.runFilter.push(i); 
					item.hidden = false; 
				} 
				if(arr.some(this.runFilter, function(filter){return filter == i;})){ 
					if(typeof item == "number"){ 
						return 0; 
					}else{ 
						return {y: 0, text: item.text}; 
					} 
				}else{ 
					return item; 
				} 
			}, this);

			this.dyn = [];

			if("radius" in this.opt){
				r = this.opt.radius;
				labelR = r - this.opt.labelOffset;
			}
			var	circle = {
				cx: offsets.l + rx,
				cy: offsets.t + ry,
				r:  r
			};

			// draw shadow
			if(this.opt.shadow || t.shadow){
				var shadow = this.opt.shadow || t.shadow;
				var scircle = lang.clone(circle);
				scircle.cx += shadow.dx;
				scircle.cy += shadow.dy;
				s.createCircle(scircle).setFill(shadow.color).setStroke(shadow);
			}
			if(s.setFilter && (this.opt.filter || t.filter)){
				s.createCircle(circle).setFill(t.series.stroke).setFilter(this.opt.filter || t.filter);
			}

			if(typeof run[0] == "number"){
				filteredRun = df.map(run, "x ? Math.max(x, 0) : 0");
				if(df.every(filteredRun, "<= 0")){
					s.createCircle(circle).setStroke(t.series.stroke);
					this.dyn = arr.map(filteredRun, function(){
						return {  };
					});
					return this;
				}else{
					slices = df.map(filteredRun, "/this", df.foldl(filteredRun, "+", 0));
				 	if(this.opt.labels){
				 		labels = arr.map(slices, function(x){
							return x > 0 ? this._getLabel(x * 100) + "%" : "";
						}, this);
					}
				}
			}else{
				filteredRun = df.map(run, "x ? Math.max(x.y, 0) : 0");
				if(df.every(filteredRun, "<= 0")){
					s.createCircle(circle).setStroke(t.series.stroke);
					this.dyn = arr.map(filteredRun, function(){
						return {  };
					});
					return this;
				}else{
					slices = df.map(filteredRun, "/this", df.foldl(filteredRun, "+", 0));
					if(this.opt.labels){
						labels = arr.map(slices, function(x, i){
							if(x < 0){ return ""; }
							var v = run[i];
							return "text" in v ? v.text : this._getLabel(x * 100) + "%";
						}, this);
					}
				}
			}
			var themes = df.map(run, function(v, i){
				var tMixin = [this.opt, this.run];
				if(v !== null && typeof v != "number"){
					tMixin.push(v);
				}
				if(this.opt.styleFunc){
					tMixin.push(this.opt.styleFunc(v));
				}
				return t.next("slice", tMixin, true);
			}, this);

			if(this.opt.labels){
				size = labelFont ? g.normalizedLength(g.splitFontString(labelFont).size) : 0;
				shift = df.foldl1(df.map(labels, function(label, i){
					var font = themes[i].series.font;
					return g._base._getTextBox(label, {font: font}).w;
				}, this), "Math.max(a, b)") / 2;
				if(this.opt.labelOffset < 0){
					r = Math.min(rx - 2 * shift, ry - size) + this.opt.labelOffset;
				}
				labelR = r - this.opt.labelOffset;
			}

			// draw slices
			var eventSeries = new Array(slices.length);
			arr.some(slices, function(slice, i){
				if(slice < 0){
					// degenerated slice
					return false;	// continue
				}
				var v = run[i], theme = themes[i], specialFill, o;
				if(slice == 0){
					this.dyn.push({fill: theme.series.fill, stroke: theme.series.stroke});
					return false;
				}
				
				if(slice >= 1){
					// whole pie
					specialFill = this._plotFill(theme.series.fill, dim, offsets);
					specialFill = this._shapeFill(specialFill,
						{
							x: circle.cx - circle.r, y: circle.cy - circle.r,
							width: 2 * circle.r, height: 2 * circle.r
						});
					specialFill = this._pseudoRadialFill(specialFill, {x: circle.cx, y: circle.cy}, circle.r);
					var shape = s.createCircle(circle).setFill(specialFill).setStroke(theme.series.stroke);
					this.dyn.push({fill: specialFill, stroke: theme.series.stroke});

					if(events){
						o = {
							element: "slice",
							index:   i,
							run:     this.run,
							shape:   shape,
							x:       i,
							y:       typeof v == "number" ? v : v.y,
							cx:      circle.cx,
							cy:      circle.cy,
							cr:      r
						};
						this._connectEvents(o);
						eventSeries[i] = o;
					}

					return false;	// we continue because we want to collect null data points for legend
				}
				// calculate the geometry of the slice
				var end = start + slice * 2 * Math.PI;
				if(i + 1 == slices.length){
					end = startAngle + 2 * Math.PI;
				}
				var	step = end - start,
					x1 = circle.cx + r * Math.cos(start),
					y1 = circle.cy + r * Math.sin(start),
					x2 = circle.cx + r * Math.cos(end),
					y2 = circle.cy + r * Math.sin(end);
				// draw the slice
				var fanSize = m._degToRad(this.opt.fanSize);
				if(theme.series.fill && theme.series.fill.type === "radial" && this.opt.radGrad === "fan" && step > fanSize){
					var group = s.createGroup(), nfans = Math.ceil(step / fanSize), delta = step / nfans;
					specialFill = this._shapeFill(theme.series.fill,
						{x: circle.cx - circle.r, y: circle.cy - circle.r, width: 2 * circle.r, height: 2 * circle.r});
					for(var j = 0; j < nfans; ++j){
						var fansx = j == 0 ? x1 : circle.cx + r * Math.cos(start + (j - FUDGE_FACTOR) * delta),
							fansy = j == 0 ? y1 : circle.cy + r * Math.sin(start + (j - FUDGE_FACTOR) * delta),
							fanex = j == nfans - 1 ? x2 : circle.cx + r * Math.cos(start + (j + 1 + FUDGE_FACTOR) * delta),
							faney = j == nfans - 1 ? y2 : circle.cy + r * Math.sin(start + (j + 1 + FUDGE_FACTOR) * delta);
						group.createPath().
								moveTo(circle.cx, circle.cy).
								lineTo(fansx, fansy).
								arcTo(r, r, 0, delta > Math.PI, true, fanex, faney).
								lineTo(circle.cx, circle.cy).
								closePath().
								setFill(this._pseudoRadialFill(specialFill, {x: circle.cx, y: circle.cy}, r, start + (j + 0.5) * delta, start + (j + 0.5) * delta));
					}
					group.createPath().
						moveTo(circle.cx, circle.cy).
						lineTo(x1, y1).
						arcTo(r, r, 0, step > Math.PI, true, x2, y2).
						lineTo(circle.cx, circle.cy).
						closePath().
						setStroke(theme.series.stroke);
					shape = group;
				}else{
					shape = s.createPath().
						moveTo(circle.cx, circle.cy).
						lineTo(x1, y1).
						arcTo(r, r, 0, step > Math.PI, true, x2, y2).
						lineTo(circle.cx, circle.cy).
						closePath().
						setStroke(theme.series.stroke);
					specialFill = theme.series.fill;
					if(specialFill && specialFill.type === "radial"){
						specialFill = this._shapeFill(specialFill, {x: circle.cx - circle.r, y: circle.cy - circle.r, width: 2 * circle.r, height: 2 * circle.r});
						if(this.opt.radGrad === "linear"){
							specialFill = this._pseudoRadialFill(specialFill, {x: circle.cx, y: circle.cy}, r, start, end);
						}
					}else if(specialFill && specialFill.type === "linear"){
						specialFill = this._plotFill(specialFill, dim, offsets);
						specialFill = this._shapeFill(specialFill, shape.getBoundingBox());
					}
					shape.setFill(specialFill);
				}
				this.dyn.push({fill: specialFill, stroke: theme.series.stroke});

				if(events){
					o = {
						element: "slice",
						index:   i,
						run:     this.run,
						shape:   shape,
						x:       i,
						y:       typeof v == "number" ? v : v.y,
						cx:      circle.cx,
						cy:      circle.cy,
						cr:      r
					};
					this._connectEvents(o);
					eventSeries[i] = o;
				}

				start = end;

				return false;	// continue
			}, this);
			// draw labels
			if(this.opt.labels){
				var isRtl = has("dojo-bidi") && this.chart.isRightToLeft(); 
				if(this.opt.labelStyle == "default"){ // inside or outside based on labelOffset
					start = startAngle;
					arr.some(slices, function(slice, i){
						if(slice <= 0){
							// degenerated slice
							return false;	// continue
						}
						var theme = themes[i];
						if(slice >= 1){
							// whole pie
							this.renderLabel(s, circle.cx, circle.cy + size / 2, labels[i], theme, this.opt.labelOffset > 0);
							return true;	// stop iteration
						}
						// calculate the geometry of the slice
						var end = start + slice * 2 * Math.PI;
						if(i + 1 == slices.length){
							end = startAngle + 2 * Math.PI;
						}
						if(this.opt.omitLabels && end-start < 0.001){
							return false;	// continue
						}
						var	labelAngle = (start + end) / 2,
							x = circle.cx + labelR * Math.cos(labelAngle),
							y = circle.cy + labelR * Math.sin(labelAngle) + size / 2;
						// draw the label
						this.renderLabel(s, isRtl ? dim.width - x : x, y, labels[i], theme, this.opt.labelOffset > 0);
						start = end;
						return false;	// continue
					}, this);
				}else if(this.opt.labelStyle == "columns"){
					start = startAngle;
					var omitLabels = this.opt.omitLabels;
					//calculate label angles
					var labeledSlices = [];
					arr.forEach(slices, function(slice, i){
						var end = start + slice * 2 * Math.PI;
						if(i + 1 == slices.length){
							end = startAngle + 2 * Math.PI;
						}
						var labelAngle = (start + end) / 2;
						labeledSlices.push({
							angle: labelAngle,
							left: Math.cos(labelAngle) < 0,
							theme: themes[i],
							index: i,
							omit: omitLabels?end - start < 0.001:false
						});
						start = end;
					});
					//calculate label radius to each slice
					var labelHeight = g._base._getTextBox("a",{ font: labelFont }).h;
					this._getProperLabelRadius(labeledSlices, labelHeight, circle.r * 1.1);
					//draw label and wiring
					arr.forEach(labeledSlices, function(slice, i){
						if(!slice.omit){
							var leftColumn = circle.cx - circle.r * 2,
								rightColumn = circle.cx + circle.r * 2,
								labelWidth = g._base._getTextBox(labels[i], {font: slice.theme.series.font}).w,
								x = circle.cx + slice.labelR * Math.cos(slice.angle),
								y = circle.cy + slice.labelR * Math.sin(slice.angle),
								jointX = (slice.left) ? (leftColumn + labelWidth) : (rightColumn - labelWidth),
								labelX = (slice.left) ? leftColumn : jointX;
							var wiring = s.createPath().moveTo(circle.cx + circle.r * Math.cos(slice.angle), circle.cy + circle.r * Math.sin(slice.angle));
							if(Math.abs(slice.labelR * Math.cos(slice.angle)) < circle.r * 2 - labelWidth){
								wiring.lineTo(x, y);
							}
							wiring.lineTo(jointX, y).setStroke(slice.theme.series.labelWiring);
							this.renderLabel(s, isRtl ? dim.width - labelWidth - labelX : labelX, y, labels[i], slice.theme, false, "left");
						}
					},this);
				}
			}
			// post-process events to restore the original indexing
			var esi = 0;
			this._eventSeries[this.run.name] = df.map(run, function(v){
				return v <= 0 ? null : eventSeries[esi++];
			});
			// chart mirroring starts
			if(has("dojo-bidi")){
				this._checkOrientation(this.group, dim, offsets);
			}
			// chart mirroring ends
			return this;	//	dojox/charting/plot2d/Pie
		},
		_getProperLabelRadius: function(slices, labelHeight, minRidius){
			var leftCenterSlice, rightCenterSlice,
				leftMinSIN = 1, rightMinSIN = 1;
			if(slices.length == 1){
				slices[0].labelR = minRidius;
				return;
			}
			for(var i = 0; i < slices.length; i++){
				var tempSIN = Math.abs(Math.sin(slices[i].angle));
				if(slices[i].left){
					if(leftMinSIN >= tempSIN){
						leftMinSIN = tempSIN;
						leftCenterSlice = slices[i];
					}
				}else{
					if(rightMinSIN >= tempSIN){
						rightMinSIN = tempSIN;
						rightCenterSlice = slices[i];
					}
				}
			}
			leftCenterSlice.labelR = rightCenterSlice.labelR = minRidius;
			this._calculateLabelR(leftCenterSlice, slices, labelHeight);
			this._calculateLabelR(rightCenterSlice, slices, labelHeight);
		},
		_calculateLabelR: function(firstSlice, slices, labelHeight){
			var i = firstSlice.index,length = slices.length,
				currentLabelR = firstSlice.labelR, nextLabelR;
			while(!(slices[i%length].left ^ slices[(i+1)%length].left)){
				if(!slices[(i + 1) % length].omit){
					nextLabelR = (Math.sin(slices[i % length].angle) * currentLabelR + ((slices[i % length].left) ? (-labelHeight) : labelHeight)) /
					Math.sin(slices[(i + 1) % length].angle);
					currentLabelR = (nextLabelR < firstSlice.labelR) ? firstSlice.labelR : nextLabelR;
					slices[(i + 1) % length].labelR = currentLabelR;
				}
				i++;
			}
			i = firstSlice.index;
			var j = (i == 0)?length-1 : i - 1;
			while(!(slices[i].left ^ slices[j].left)){
				if(!slices[j].omit){
					nextLabelR = (Math.sin(slices[i].angle) * currentLabelR + ((slices[i].left) ? labelHeight : (-labelHeight))) /
					Math.sin(slices[j].angle);
					currentLabelR = (nextLabelR < firstSlice.labelR) ? firstSlice.labelR : nextLabelR;
					slices[j].labelR = currentLabelR;
				}
				i--;j--;
				i = (i < 0)?i+slices.length:i;
				j = (j < 0)?j+slices.length:j;
			}
		}
	});
});

},
'dojo/cldr/nls/number':function(){
define({ root:

//begin v1.x content
{
	"scientificFormat": "#E0",
	"currencySpacing-afterCurrency-currencyMatch": "[:^S:]",
	"infinity": "∞",
	"superscriptingExponent": "×",
	"list": ";",
	"percentSign": "%",
	"minusSign": "-",
	"currencySpacing-beforeCurrency-surroundingMatch": "[:digit:]",
	"decimalFormat-short": "000T",
	"currencySpacing-afterCurrency-insertBetween": " ",
	"nan": "NaN",
	"plusSign": "+",
	"currencySpacing-afterCurrency-surroundingMatch": "[:digit:]",
	"currencySpacing-beforeCurrency-currencyMatch": "[:^S:]",
	"currencyFormat": "¤ #,##0.00",
	"perMille": "‰",
	"group": ",",
	"percentFormat": "#,##0%",
	"decimalFormat-long": "000T",
	"decimalFormat": "#,##0.###",
	"decimal": ".",
	"currencySpacing-beforeCurrency-insertBetween": " ",
	"exponential": "E"
}
//end v1.x content
,
	"ar": true,
	"ca": true,
	"cs": true,
	"da": true,
	"de": true,
	"el": true,
	"en": true,
	"en-au": true,
	"es": true,
	"fi": true,
	"fr": true,
	"fr-ch": true,
	"he": true,
	"hu": true,
	"it": true,
	"ja": true,
	"ko": true,
	"nb": true,
	"nl": true,
	"pl": true,
	"pt": true,
	"pt-pt": true,
	"ro": true,
	"ru": true,
	"sk": true,
	"sl": true,
	"sv": true,
	"th": true,
	"tr": true,
	"zh": true,
	"zh-hant": true,
	"zh-hk": true,
	"zh-tw": true
});
},
'dojo/cldr/nls/en/number':function(){
define(
//begin v1.x content
{
	"group": ",",
	"percentSign": "%",
	"exponential": "E",
	"scientificFormat": "#E0",
	"percentFormat": "#,##0%",
	"list": ";",
	"infinity": "∞",
	"minusSign": "-",
	"decimal": ".",
	"superscriptingExponent": "×",
	"nan": "NaN",
	"perMille": "‰",
	"decimalFormat": "#,##0.###",
	"currencyFormat": "¤#,##0.00;(¤#,##0.00)",
	"plusSign": "+",
	"decimalFormat-long": "000 trillion",
	"decimalFormat-short": "000T"
}
//end v1.x content
);
},
'dojo/cldr/nls/ru/number':function(){
define(
//begin v1.x content
{
	"group": " ",
	"percentSign": "%",
	"exponential": "E",
	"scientificFormat": "#E0",
	"percentFormat": "#,##0 %",
	"list": ";",
	"infinity": "∞",
	"minusSign": "-",
	"decimal": ",",
	"superscriptingExponent": "×",
	"nan": "не число",
	"perMille": "‰",
	"decimalFormat": "#,##0.###",
	"currencyFormat": "#,##0.00 ¤",
	"plusSign": "+",
	"decimalFormat-long": "000 триллиона",
	"decimalFormat-short": "000 трлн"
}
//end v1.x content
);
},
'dojox/color/_base':function(){
define(["../main", "dojo/_base/lang", "dojo/_base/Color", "dojo/colors"],
	function(dojox, lang, Color, colors){

var cx = lang.getObject("color", true, dojox);
/*===== cx = dojox.color =====*/
		
//	alias all the dojo.Color mechanisms
cx.Color=Color;
cx.blend=Color.blendColors;
cx.fromRgb=Color.fromRgb;
cx.fromHex=Color.fromHex;
cx.fromArray=Color.fromArray;
cx.fromString=Color.fromString;

//	alias the dojo.colors mechanisms
cx.greyscale=colors.makeGrey;

lang.mixin(cx,{
	fromCmy: function(/* Object|Array|int */cyan, /*int*/magenta, /*int*/yellow){
		// summary:
		//		Create a dojox.color.Color from a CMY defined color.
		//		All colors should be expressed as 0-100 (percentage)
	
		if(lang.isArray(cyan)){
			magenta=cyan[1], yellow=cyan[2], cyan=cyan[0];
		} else if(lang.isObject(cyan)){
			magenta=cyan.m, yellow=cyan.y, cyan=cyan.c;
		}
		cyan/=100, magenta/=100, yellow/=100;
	
		var r=1-cyan, g=1-magenta, b=1-yellow;
		return new Color({ r:Math.round(r*255), g:Math.round(g*255), b:Math.round(b*255) });	//	dojox.color.Color
	},
	
	fromCmyk: function(/* Object|Array|int */cyan, /*int*/magenta, /*int*/yellow, /*int*/black){
		// summary:
		//		Create a dojox.color.Color from a CMYK defined color.
		//		All colors should be expressed as 0-100 (percentage)
	
		if(lang.isArray(cyan)){
			magenta=cyan[1], yellow=cyan[2], black=cyan[3], cyan=cyan[0];
		} else if(lang.isObject(cyan)){
			magenta=cyan.m, yellow=cyan.y, black=cyan.b, cyan=cyan.c;
		}
		cyan/=100, magenta/=100, yellow/=100, black/=100;
		var r,g,b;
		r = 1-Math.min(1, cyan*(1-black)+black);
		g = 1-Math.min(1, magenta*(1-black)+black);
		b = 1-Math.min(1, yellow*(1-black)+black);
		return new Color({ r:Math.round(r*255), g:Math.round(g*255), b:Math.round(b*255) });	//	dojox.color.Color
	},
		
	fromHsl: function(/* Object|Array|int */hue, /* int */saturation, /* int */luminosity){
		// summary:
		//		Create a dojox.color.Color from an HSL defined color.
		//		hue from 0-359 (degrees), saturation and luminosity 0-100.
	
		if(lang.isArray(hue)){
			saturation=hue[1], luminosity=hue[2], hue=hue[0];
		} else if(lang.isObject(hue)){
			saturation=hue.s, luminosity=hue.l, hue=hue.h;
		}
		saturation/=100;
		luminosity/=100;
	
		while(hue<0){ hue+=360; }
		while(hue>=360){ hue-=360; }
		
		var r, g, b;
		if(hue<120){
			r=(120-hue)/60, g=hue/60, b=0;
		} else if (hue<240){
			r=0, g=(240-hue)/60, b=(hue-120)/60;
		} else {
			r=(hue-240)/60, g=0, b=(360-hue)/60;
		}
		
		r=2*saturation*Math.min(r, 1)+(1-saturation);
		g=2*saturation*Math.min(g, 1)+(1-saturation);
		b=2*saturation*Math.min(b, 1)+(1-saturation);
		if(luminosity<0.5){
			r*=luminosity, g*=luminosity, b*=luminosity;
		}else{
			r=(1-luminosity)*r+2*luminosity-1;
			g=(1-luminosity)*g+2*luminosity-1;
			b=(1-luminosity)*b+2*luminosity-1;
		}
		return new Color({ r:Math.round(r*255), g:Math.round(g*255), b:Math.round(b*255) });	//	dojox.color.Color
	}
});
	
cx.fromHsv = function(/* Object|Array|int */hue, /* int */saturation, /* int */value){
	// summary:
	//		Create a dojox.color.Color from an HSV defined color.
	//		hue from 0-359 (degrees), saturation and value 0-100.

	if(lang.isArray(hue)){
		saturation=hue[1], value=hue[2], hue=hue[0];
	} else if (lang.isObject(hue)){
		saturation=hue.s, value=hue.v, hue=hue.h;
	}
	
	if(hue==360){ hue=0; }
	saturation/=100;
	value/=100;
	
	var r, g, b;
	if(saturation==0){
		r=value, b=value, g=value;
	}else{
		var hTemp=hue/60, i=Math.floor(hTemp), f=hTemp-i;
		var p=value*(1-saturation);
		var q=value*(1-(saturation*f));
		var t=value*(1-(saturation*(1-f)));
		switch(i){
			case 0:{ r=value, g=t, b=p; break; }
			case 1:{ r=q, g=value, b=p; break; }
			case 2:{ r=p, g=value, b=t; break; }
			case 3:{ r=p, g=q, b=value; break; }
			case 4:{ r=t, g=p, b=value; break; }
			case 5:{ r=value, g=p, b=q; break; }
		}
	}
	return new Color({ r:Math.round(r*255), g:Math.round(g*255), b:Math.round(b*255) });	//	dojox.color.Color
};
lang.extend(Color,{
	toCmy: function(){
		// summary:
		//		Convert this Color to a CMY definition.
		var cyan=1-(this.r/255), magenta=1-(this.g/255), yellow=1-(this.b/255);
		return { c:Math.round(cyan*100), m:Math.round(magenta*100), y:Math.round(yellow*100) };		//	Object
	},
		
	toCmyk: function(){
		// summary:
		//		Convert this Color to a CMYK definition.
		var cyan, magenta, yellow, black;
		var r=this.r/255, g=this.g/255, b=this.b/255;
		black = Math.min(1-r, 1-g, 1-b);
		cyan = (1-r-black)/(1-black);
		magenta = (1-g-black)/(1-black);
		yellow = (1-b-black)/(1-black);
		return { c:Math.round(cyan*100), m:Math.round(magenta*100), y:Math.round(yellow*100), b:Math.round(black*100) };	//	Object
	},
		
	toHsl: function(){
		// summary:
		//		Convert this Color to an HSL definition.
		var r=this.r/255, g=this.g/255, b=this.b/255;
		var min = Math.min(r, b, g), max = Math.max(r, g, b);
		var delta = max-min;
		var h=0, s=0, l=(min+max)/2;
		if(l>0 && l<1){
			s = delta/((l<0.5)?(2*l):(2-2*l));
		}
		if(delta>0){
			if(max==r && max!=g){
				h+=(g-b)/delta;
			}
			if(max==g && max!=b){
				h+=(2+(b-r)/delta);
			}
			if(max==b && max!=r){
				h+=(4+(r-g)/delta);
			}
			h*=60;
		}
		return { h:h, s:Math.round(s*100), l:Math.round(l*100) };	//	Object
	},
	
	toHsv: function(){
		// summary:
		//		Convert this Color to an HSV definition.
		var r=this.r/255, g=this.g/255, b=this.b/255;
		var min = Math.min(r, b, g), max = Math.max(r, g, b);
		var delta = max-min;
		var h = null, s = (max==0)?0:(delta/max);
		if(s==0){
			h = 0;
		}else{
			if(r==max){
				h = 60*(g-b)/delta;
			}else if(g==max){
				h = 120 + 60*(b-r)/delta;
			}else{
				h = 240 + 60*(r-g)/delta;
			}
	
			if(h<0){ h+=360; }
		}
		return { h:h, s:Math.round(s*100), v:Math.round(max*100) };	//	Object
	}
});

return cx;
});

},
'dojox/gfx':function(){
define(["dojo/_base/lang", "./gfx/_base", "./gfx/renderer!"], 
  function(lang, gfxBase, renderer){
	// module:
	//		dojox/gfx
	// summary:
	//		This the root of the Dojo Graphics package
	gfxBase.switchTo(renderer);
	return gfxBase;
});

},
'dojox/lang/functional/fold':function(){
define(["dojo/_base/lang", "dojo/_base/array", "dojo/_base/kernel", "./lambda"],
	function(lang, arr, kernel, df){

// This module adds high-level functions and related constructs:
//	- "fold" family of functions

// Notes:
//	- missing high-level functions are provided with the compatible API:
//		foldl, foldl1, foldr, foldr1
//	- missing JS standard functions are provided with the compatible API:
//		reduce, reduceRight
//	- the fold's counterpart: unfold

// Defined methods:
//	- take any valid lambda argument as the functional argument
//	- operate on dense arrays
//	- take a string as the array argument
//	- take an iterator objects as the array argument (only foldl, foldl1, and reduce)

	var empty = {};

	lang.mixin(df, {
		// classic reduce-class functions
		foldl: function(/*Array|String|Object*/ a, /*Function*/ f, /*Object*/ z, /*Object?*/ o){
			// summary:
			//		repeatedly applies a binary function to an array from left
			//		to right using a seed value as a starting point; returns the final
			//		value.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || kernel.global; f = df.lambda(f);
			var i, n;
			if(lang.isArray(a)){
				// array
				for(i = 0, n = a.length; i < n; z = f.call(o, z, a[i], i, a), ++i);
			}else if(typeof a.hasNext == "function" && typeof a.next == "function"){
				// iterator
				for(i = 0; a.hasNext(); z = f.call(o, z, a.next(), i++, a));
			}else{
				// object/dictionary
				for(i in a){
					if(!(i in empty)){
						z = f.call(o, z, a[i], i, a);
					}
				}
			}
			return z;	// Object
		},
		foldl1: function(/*Array|String|Object*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary:
			//		repeatedly applies a binary function to an array from left
			//		to right; returns the final value.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || kernel.global; f = df.lambda(f);
			var z, i, n;
			if(lang.isArray(a)){
				// array
				z = a[0];
				for(i = 1, n = a.length; i < n; z = f.call(o, z, a[i], i, a), ++i);
			}else if(typeof a.hasNext == "function" && typeof a.next == "function"){
				// iterator
				if(a.hasNext()){
					z = a.next();
					for(i = 1; a.hasNext(); z = f.call(o, z, a.next(), i++, a));
				}
			}else{
				// object/dictionary
				var first = true;
				for(i in a){
					if(!(i in empty)){
						if(first){
							z = a[i];
							first = false;
						}else{
							z = f.call(o, z, a[i], i, a);
						}
					}
				}
			}
			return z;	// Object
		},
		foldr: function(/*Array|String*/ a, /*Function|String|Array*/ f, /*Object*/ z, /*Object?*/ o){
			// summary:
			//		repeatedly applies a binary function to an array from right
			//		to left using a seed value as a starting point; returns the final
			//		value.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || kernel.global; f = df.lambda(f);
			for(var i = a.length; i > 0; --i, z = f.call(o, z, a[i], i, a));
			return z;	// Object
		},
		foldr1: function(/*Array|String*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary:
			//		repeatedly applies a binary function to an array from right
			//		to left; returns the final value.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || kernel.global; f = df.lambda(f);
			var n = a.length, z = a[n - 1], i = n - 1;
			for(; i > 0; --i, z = f.call(o, z, a[i], i, a));
			return z;	// Object
		},
		// JS 1.8 standard array functions, which can take a lambda as a parameter.
		reduce: function(/*Array|String|Object*/ a, /*Function|String|Array*/ f, /*Object?*/ z){
			// summary:
			//		apply a function simultaneously against two values of the array
			//		(from left-to-right) as to reduce it to a single value.
			return arguments.length < 3 ? df.foldl1(a, f) : df.foldl(a, f, z);	// Object
		},
		reduceRight: function(/*Array|String*/ a, /*Function|String|Array*/ f, /*Object?*/ z){
			// summary:
			//		apply a function simultaneously against two values of the array
			//		(from right-to-left) as to reduce it to a single value.
			return arguments.length < 3 ? df.foldr1(a, f) : df.foldr(a, f, z);	// Object
		},
		// the fold's counterpart: unfold
		unfold: function(/*Function|String|Array*/ pr, /*Function|String|Array*/ f,
						/*Function|String|Array*/ g, /*Object*/ z, /*Object?*/ o){
			// summary:
			//		builds an array by unfolding a value
			o = o || kernel.global; f = df.lambda(f); g = df.lambda(g); pr = df.lambda(pr);
			var t = [];
			for(; !pr.call(o, z); t.push(f.call(o, z)), z = g.call(o, z));
			return t;	// Array
		}
	});
});

},
'dojox/charting/themes/Shrooms':function(){
define(["../SimpleTheme", "./common"], function(SimpleTheme, themes){
	// notes: colors generated by moving in 30 degree increments around the hue circle,
	//		at 90% saturation, using a B value of 75 (HSB model).
	themes.Shrooms = new SimpleTheme({
		colors: [
			"#bf1313", // 0
			"#69bf13", // 90
			"#13bfbf", // 180
			"#6913bf", // 270
			"#bf6913", // 30
			"#13bf13", // 120
			"#1369bf", // 210
			"#bf13bf", // 300
			"#bfbf13", // 60
			"#13bf69", // 150
			"#1313bf", // 240
			"#bf1369"  // 330
		]
	});
	return themes.Shrooms;
});

},
'dojox/lang/functional/object':function(){
define(["dojo/_base/kernel", "dojo/_base/lang", "./lambda"], function(kernel, lang, df){

// This module adds high-level functions and related constructs:
//	- object/dictionary helpers

// Defined methods:
//	- take any valid lambda argument as the functional argument
//	- skip all attributes that are present in the empty object
//		(IE and/or 3rd-party libraries).

	var empty = {};

	lang.mixin(df, {
		// object helpers
		keys: function(/*Object*/ obj){
			// summary:
			//		returns an array of all keys in the object
			var t = [];
			for(var i in obj){
				if(!(i in empty)){
					t.push(i);
				}
			}
			return	t; // Array
		},
		values: function(/*Object*/ obj){
			// summary:
			//		returns an array of all values in the object
			var t = [];
			for(var i in obj){
				if(!(i in empty)){
					t.push(obj[i]);
				}
			}
			return	t; // Array
		},
		filterIn: function(/*Object*/ obj, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary:
			//		creates new object with all attributes that pass the test
			//		implemented by the provided function.
			o = o || kernel.global; f = df.lambda(f);
			var t = {}, v, i;
			for(i in obj){
				if(!(i in empty)){
					v = obj[i];
					if(f.call(o, v, i, obj)){ t[i] = v; }
				}
			}
			return t;	// Object
		},
		forIn: function(/*Object*/ obj, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary:
			//		iterates over all object attributes.
			o = o || kernel.global; f = df.lambda(f);
			for(var i in obj){
				if(!(i in empty)){
					f.call(o, obj[i], i, obj);
				}
			}
			return o;	// Object
		},
		mapIn: function(/*Object*/ obj, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary:
			//		creates new object with the results of calling
			//		a provided function on every attribute in this object.
			o = o || kernel.global; f = df.lambda(f);
			var t = {}, i;
			for(i in obj){
				if(!(i in empty)){
					t[i] = f.call(o, obj[i], i, obj);
				}
			}
			return t;	// Object
		}
	});
	
	return df;
});

},
'money/views/navigation':function(){
define(["dojo/dom-class","dojo/dom-style","dojo/dom-attr","dojo/dom","dojo/sniff", "dijit/registry",'dojo/text!money/views/navigation.html'],
	function(domClass, domStyle, domAttr, dom, has, registry){
	return{
		
		init: function(){
			
			if(has('isInitiallySmall')){
				domClass.remove	(this.domNode, "left");
			}
		}
	}
})

},
'dojo/hash':function(){
define(["./_base/kernel", "require", "./_base/config", "./aspect", "./_base/lang", "./topic", "./domReady", "./sniff"],
	function(dojo, require, config, aspect, lang, topic, domReady, has){

	// module:
	//		dojo/hash

	dojo.hash = function(/* String? */ hash, /* Boolean? */ replace){
		// summary:
		//		Gets or sets the hash string in the browser URL.
		// description:
		//		Handles getting and setting of location.hash.
		//
		//		 - If no arguments are passed, acts as a getter.
		//		 - If a string is passed, acts as a setter.
		// hash:
		//		the hash is set - #string.
		// replace:
		//		If true, updates the hash value in the current history
		//		state instead of creating a new history state.
		// returns:
		//		when used as a getter, returns the current hash string.
		//		when used as a setter, returns the new hash string.
		// example:
		//	|	topic.subscribe("/dojo/hashchange", context, callback);
		//	|
		//	|	function callback (hashValue){
		//	|		// do something based on the hash value.
		//	|	}

		// getter
		if(!arguments.length){
			return _getHash();
		}
		// setter
		if(hash.charAt(0) == "#"){
			hash = hash.substring(1);
		}
		if(replace){
			_replace(hash);
		}else{
			location.href = "#" + hash;
		}
		return hash; // String
	};

	// Global vars
	var _recentHash, _ieUriMonitor, _connect,
		_pollFrequency = config.hashPollFrequency || 100;

	//Internal functions
	function _getSegment(str, delimiter){
		var i = str.indexOf(delimiter);
		return (i >= 0) ? str.substring(i+1) : "";
	}

	function _getHash(){
		return _getSegment(location.href, "#");
	}

	function _dispatchEvent(){
		topic.publish("/dojo/hashchange", _getHash());
	}

	function _pollLocation(){
		if(_getHash() === _recentHash){
			return;
		}
		_recentHash = _getHash();
		_dispatchEvent();
	}

	function _replace(hash){
		if(_ieUriMonitor){
			if(_ieUriMonitor.isTransitioning()){
				setTimeout(lang.hitch(null,_replace,hash), _pollFrequency);
				return;
			}
			var href = _ieUriMonitor.iframe.location.href;
			var index = href.indexOf('?');
			// main frame will detect and update itself
			_ieUriMonitor.iframe.location.replace(href.substring(0, index) + "?" + hash);
			return;
		}
		location.replace("#"+hash);
		!_connect && _pollLocation();
	}

	function IEUriMonitor(){
		// summary:
		//		Determine if the browser's URI has changed or if the user has pressed the
		//		back or forward button. If so, call _dispatchEvent.
		//
		// description:
		//		IE doesn't add changes to the URI's hash into the history unless the hash
		//		value corresponds to an actual named anchor in the document. To get around
		//		this IE difference, we use a background IFrame to maintain a back-forward
		//		history, by updating the IFrame's query string to correspond to the
		//		value of the main browser location's hash value.
		//
		//		E.g. if the value of the browser window's location changes to
		//
		//		#action=someAction
		//
		//		... then we'd update the IFrame's source to:
		//
		//		?action=someAction
		//
		//		This design leads to a somewhat complex state machine, which is
		//		described below:
		//
		//		####s1
		//
		//		Stable state - neither the window's location has changed nor
		//		has the IFrame's location. Note that this is the 99.9% case, so
		//		we optimize for it.
		//
		//		Transitions: s1, s2, s3
		//
		//		####s2
		//
		//		Window's location changed - when a user clicks a hyperlink or
		//		code programmatically changes the window's URI.
		//
		//		Transitions: s4
		//
		//		####s3
		//
		//		Iframe's location changed as a result of user pressing back or
		//		forward - when the user presses back or forward, the location of
		//		the background's iframe changes to the previous or next value in
		//		its history.
		//
		//		Transitions: s1
		//
		//		####s4
		//
		//		IEUriMonitor has programmatically changed the location of the
		//		background iframe, but it's location hasn't yet changed. In this
		//		case we do nothing because we need to wait for the iframe's
		//		location to reflect its actual state.
		//
		//		Transitions: s4, s5
		//
		//		####s5
		//
		//		IEUriMonitor has programmatically changed the location of the
		//		background iframe, and the iframe's location has caught up with
		//		reality. In this case we need to transition to s1.
		//
		//		Transitions: s1
		//
		//		The hashchange event is always dispatched on the transition back to s1.


		// create and append iframe
		var ifr = document.createElement("iframe"),
			IFRAME_ID = "dojo-hash-iframe",
			ifrSrc = config.dojoBlankHtmlUrl || require.toUrl("./resources/blank.html");

		if(config.useXDomain && !config.dojoBlankHtmlUrl){
			console.warn("dojo/hash: When using cross-domain Dojo builds,"
				+ " please save dojo/resources/blank.html to your domain and set djConfig.dojoBlankHtmlUrl"
				+ " to the path on your domain to blank.html");
		}

		ifr.id = IFRAME_ID;
		ifr.src = ifrSrc + "?" + _getHash();
		ifr.style.display = "none";
		document.body.appendChild(ifr);

		this.iframe = dojo.global[IFRAME_ID];
		var recentIframeQuery, transitioning, expectedIFrameQuery, docTitle, ifrOffline,
			iframeLoc = this.iframe.location;

		function resetState(){
			_recentHash = _getHash();
			recentIframeQuery = ifrOffline ? _recentHash : _getSegment(iframeLoc.href, "?");
			transitioning = false;
			expectedIFrameQuery = null;
		}

		this.isTransitioning = function(){
			return transitioning;
		};

		this.pollLocation = function(){
			if(!ifrOffline){
				try{
					//see if we can access the iframe's location without a permission denied error
					var iframeSearch = _getSegment(iframeLoc.href, "?");
					//good, the iframe is same origin (no thrown exception)
					if(document.title != docTitle){ //sync title of main window with title of iframe.
						docTitle = this.iframe.document.title = document.title;
					}
				}catch(e){
					//permission denied - server cannot be reached.
					ifrOffline = true;
					console.error("dojo/hash: Error adding history entry. Server unreachable.");
				}
			}
			var hash = _getHash();
			if(transitioning && _recentHash === hash){
				// we're in an iframe transition (s4 or s5)
				if(ifrOffline || iframeSearch === expectedIFrameQuery){
					// s5 (iframe caught up to main window or iframe offline), transition back to s1
					resetState();
					_dispatchEvent();
				}else{
					// s4 (waiting for iframe to catch up to main window)
					setTimeout(lang.hitch(this,this.pollLocation),0);
					return;
				}
			}else if(_recentHash === hash && (ifrOffline || recentIframeQuery === iframeSearch)){
				// we're in stable state (s1, iframe query == main window hash), do nothing
			}else{
				// the user has initiated a URL change somehow.
				// sync iframe query <-> main window hash
				if(_recentHash !== hash){
					// s2 (main window location changed), set iframe url and transition to s4
					_recentHash = hash;
					transitioning = true;
					expectedIFrameQuery = hash;
					ifr.src = ifrSrc + "?" + expectedIFrameQuery;
					ifrOffline = false; //we're updating the iframe src - set offline to false so we can check again on next poll.
					setTimeout(lang.hitch(this,this.pollLocation),0); //yielded transition to s4 while iframe reloads.
					return;
				}else if(!ifrOffline){
					// s3 (iframe location changed via back/forward button), set main window url and transition to s1.
					location.href = "#" + iframeLoc.search.substring(1);
					resetState();
					_dispatchEvent();
				}
			}
			setTimeout(lang.hitch(this,this.pollLocation), _pollFrequency);
		};
		resetState(); // initialize state (transition to s1)
		setTimeout(lang.hitch(this,this.pollLocation), _pollFrequency);
	}
	domReady(function(){
		if("onhashchange" in dojo.global && (!has("ie") || (has("ie") >= 8 && document.compatMode != "BackCompat"))){	//need this IE browser test because "onhashchange" exists in IE8 in IE7 mode
			_connect = aspect.after(dojo.global,"onhashchange",_dispatchEvent, true);
		}else{
			if(document.addEventListener){ // Non-IE
				_recentHash = _getHash();
				setInterval(_pollLocation, _pollFrequency); //Poll the window location for changes
			}else if(document.attachEvent){ // IE7-
				//Use hidden iframe in versions of IE that don't have onhashchange event
				_ieUriMonitor = new IEUriMonitor();
			}
			// else non-supported browser, do nothing.
		}
	});

	return dojo.hash;

});

},
'dojox/charting/scaler/linear':function(){
define(["dojo/_base/lang", "./common"], 
	function(lang, common){
	var linear = lang.getObject("dojox.charting.scaler.linear", true);
	
	var deltaLimit = 3,	// pixels
		getLabel = common.getNumericLabel;

		function findString(/*String*/ val, /*Array*/ text){
			val = val.toLowerCase();
			for(var i = text.length - 1; i >= 0; --i){
				if(val === text[i]){
					return true;
				}
			}
			return false;
		}
	
	var calcTicks = function(min, max, kwArgs, majorTick, minorTick, microTick, span){
		kwArgs = lang.delegate(kwArgs);
		if(!majorTick){
			if(kwArgs.fixUpper == "major"){ kwArgs.fixUpper = "minor"; }
			if(kwArgs.fixLower == "major"){ kwArgs.fixLower = "minor"; }
		}
		if(!minorTick){
			if(kwArgs.fixUpper == "minor"){ kwArgs.fixUpper = "micro"; }
			if(kwArgs.fixLower == "minor"){ kwArgs.fixLower = "micro"; }
		}
		if(!microTick){
			if(kwArgs.fixUpper == "micro"){ kwArgs.fixUpper = "none"; }
			if(kwArgs.fixLower == "micro"){ kwArgs.fixLower = "none"; }
		}
		var lowerBound = findString(kwArgs.fixLower, ["major"]) ?
				Math.floor(kwArgs.min / majorTick) * majorTick :
					findString(kwArgs.fixLower, ["minor"]) ?
						Math.floor(kwArgs.min / minorTick) * minorTick :
							findString(kwArgs.fixLower, ["micro"]) ?
								Math.floor(kwArgs.min / microTick) * microTick : kwArgs.min,
			upperBound = findString(kwArgs.fixUpper, ["major"]) ?
				Math.ceil(kwArgs.max / majorTick) * majorTick :
					findString(kwArgs.fixUpper, ["minor"]) ?
						Math.ceil(kwArgs.max / minorTick) * minorTick :
							findString(kwArgs.fixUpper, ["micro"]) ?
								Math.ceil(kwArgs.max / microTick) * microTick : kwArgs.max;
								
		if(kwArgs.useMin){ min = lowerBound; }
		if(kwArgs.useMax){ max = upperBound; }
		
		var majorStart = (!majorTick || kwArgs.useMin && findString(kwArgs.fixLower, ["major"])) ?
				min : Math.ceil(min / majorTick) * majorTick,
			minorStart = (!minorTick || kwArgs.useMin && findString(kwArgs.fixLower, ["major", "minor"])) ?
				min : Math.ceil(min / minorTick) * minorTick,
			microStart = (! microTick || kwArgs.useMin && findString(kwArgs.fixLower, ["major", "minor", "micro"])) ?
				min : Math.ceil(min / microTick) * microTick,
			majorCount = !majorTick ? 0 : (kwArgs.useMax && findString(kwArgs.fixUpper, ["major"]) ?
				Math.round((max - majorStart) / majorTick) :
				Math.floor((max - majorStart) / majorTick)) + 1,
			minorCount = !minorTick ? 0 : (kwArgs.useMax && findString(kwArgs.fixUpper, ["major", "minor"]) ?
				Math.round((max - minorStart) / minorTick) :
				Math.floor((max - minorStart) / minorTick)) + 1,
			microCount = !microTick ? 0 : (kwArgs.useMax && findString(kwArgs.fixUpper, ["major", "minor", "micro"]) ?
				Math.round((max - microStart) / microTick) :
				Math.floor((max - microStart) / microTick)) + 1,
			minorPerMajor  = minorTick ? Math.round(majorTick / minorTick) : 0,
			microPerMinor  = microTick ? Math.round(minorTick / microTick) : 0,
			majorPrecision = majorTick ? Math.floor(Math.log(majorTick) / Math.LN10) : 0,
			minorPrecision = minorTick ? Math.floor(Math.log(minorTick) / Math.LN10) : 0,
			scale = span / (max - min);
		if(!isFinite(scale)){ scale = 1; }
		
		return {
			bounds: {
				lower:	lowerBound,
				upper:	upperBound,
				from:	min,
				to:		max,
				scale:	scale,
				span:	span
			},
			major: {
				tick:	majorTick,
				start:	majorStart,
				count:	majorCount,
				prec:	majorPrecision
			},
			minor: {
				tick:	minorTick,
				start:	minorStart,
				count:	minorCount,
				prec:	minorPrecision
			},
			micro: {
				tick:	microTick,
				start:	microStart,
				count:	microCount,
				prec:	0
			},
			minorPerMajor:	minorPerMajor,
			microPerMinor:	microPerMinor,
			scaler:			linear
		};
	};
	
	return lang.mixin(linear, {
		buildScaler: function(/*Number*/ min, /*Number*/ max, /*Number*/ span, /*Object*/ kwArgs, /*Number?*/ delta, /*Number?*/ minorDelta){
			var h = {fixUpper: "none", fixLower: "none", natural: false};
			if(kwArgs){
				if("fixUpper" in kwArgs){ h.fixUpper = String(kwArgs.fixUpper); }
				if("fixLower" in kwArgs){ h.fixLower = String(kwArgs.fixLower); }
				if("natural"  in kwArgs){ h.natural  = Boolean(kwArgs.natural); }
			}
			minorDelta = !minorDelta || minorDelta < deltaLimit ? deltaLimit : minorDelta;
			
			// update bounds
			if("min" in kwArgs){ min = kwArgs.min; }
			if("max" in kwArgs){ max = kwArgs.max; }
			if(kwArgs.includeZero){
				if(min > 0){ min = 0; }
				if(max < 0){ max = 0; }
			}
			h.min = min;
			h.useMin = true;
			h.max = max;
			h.useMax = true;
			
			if("from" in kwArgs){
				min = kwArgs.from;
				h.useMin = false;
			}
			if("to" in kwArgs){
				max = kwArgs.to;
				h.useMax = false;
			}
			
			// check for erroneous condition
			if(max <= min){
				return calcTicks(min, max, h, 0, 0, 0, span);	// Object
			}
			if(!delta){
				delta = max - min;
			}
			var mag = Math.floor(Math.log(delta) / Math.LN10),
				major = kwArgs && ("majorTickStep" in kwArgs) ? kwArgs.majorTickStep : Math.pow(10, mag),
				minor = 0, micro = 0, ticks;
				
			// calculate minor ticks
			if(kwArgs && ("minorTickStep" in kwArgs)){
				minor = kwArgs.minorTickStep;
			}else{
				do{
					minor = major / 10;
					if(!h.natural || minor > 0.9){
						ticks = calcTicks(min, max, h, major, minor, 0, span);
						if(ticks.bounds.scale * ticks.minor.tick > minorDelta){ break; }
					}
					minor = major / 5;
					if(!h.natural || minor > 0.9){
						ticks = calcTicks(min, max, h, major, minor, 0, span);
						if(ticks.bounds.scale * ticks.minor.tick > minorDelta){ break; }
					}
					minor = major / 2;
					if(!h.natural || minor > 0.9){
						ticks = calcTicks(min, max, h, major, minor, 0, span);
						if(ticks.bounds.scale * ticks.minor.tick > minorDelta){ break; }
					}
					return calcTicks(min, max, h, major, 0, 0, span);	// Object
				}while(false);
			}
	
			// calculate micro ticks
			if(kwArgs && ("microTickStep" in kwArgs)){
				micro = kwArgs.microTickStep;
				ticks = calcTicks(min, max, h, major, minor, micro, span);
			}else{
				do{
					micro = minor / 10;
					if(!h.natural || micro > 0.9){
						ticks = calcTicks(min, max, h, major, minor, micro, span);
						if(ticks.bounds.scale * ticks.micro.tick > deltaLimit){ break; }
					}
					micro = minor / 5;
					if(!h.natural || micro > 0.9){
						ticks = calcTicks(min, max, h, major, minor, micro, span);
						if(ticks.bounds.scale * ticks.micro.tick > deltaLimit){ break; }
					}
					micro = minor / 2;
					if(!h.natural || micro > 0.9){
						ticks = calcTicks(min, max, h, major, minor, micro, span);
						if(ticks.bounds.scale * ticks.micro.tick > deltaLimit){ break; }
					}
					micro = 0;
				}while(false);
			}
	
			return micro ? ticks : calcTicks(min, max, h, major, minor, 0, span);	// Object
		},
		buildTicks: function(/*Object*/ scaler, /*Object*/ kwArgs){
			var step, next, tick,
				nextMajor = scaler.major.start,
				nextMinor = scaler.minor.start,
				nextMicro = scaler.micro.start;
			if(kwArgs.microTicks && scaler.micro.tick){
				step = scaler.micro.tick, next = nextMicro;
			}else if(kwArgs.minorTicks && scaler.minor.tick){
				step = scaler.minor.tick, next = nextMinor;
			}else if(scaler.major.tick){
				step = scaler.major.tick, next = nextMajor;
			}else{
				// no ticks
				return null;
			}
			// make sure that we have finite bounds
			var revScale = 1 / scaler.bounds.scale;
			if(scaler.bounds.to <= scaler.bounds.from || isNaN(revScale) || !isFinite(revScale) ||
					step <= 0 || isNaN(step) || !isFinite(step)){
				// no ticks
				return null;
			}
			// loop over all ticks
			var majorTicks = [], minorTicks = [], microTicks = [];
			while(next <= scaler.bounds.to + revScale){
				if(Math.abs(nextMajor - next) < step / 2){
					// major tick
					tick = {value: nextMajor};
					if(kwArgs.majorLabels){
						tick.label = getLabel(nextMajor, scaler.major.prec, kwArgs);
					}
					majorTicks.push(tick);
					nextMajor += scaler.major.tick;
					nextMinor += scaler.minor.tick;
					nextMicro += scaler.micro.tick;
				}else if(Math.abs(nextMinor - next) < step / 2){
					// minor tick
					if(kwArgs.minorTicks){
						tick = {value: nextMinor};
						if(kwArgs.minorLabels && (scaler.minMinorStep <= scaler.minor.tick * scaler.bounds.scale)){
							tick.label = getLabel(nextMinor, scaler.minor.prec, kwArgs);
						}
						minorTicks.push(tick);
					}
					nextMinor += scaler.minor.tick;
					nextMicro += scaler.micro.tick;
				}else{
					// micro tick
					if(kwArgs.microTicks){
						microTicks.push({value: nextMicro});
					}
					nextMicro += scaler.micro.tick;
				}
				next += step;
			}
			return {major: majorTicks, minor: minorTicks, micro: microTicks};	// Object
		},
		getTransformerFromModel: function(/*Object*/ scaler){
			var offset = scaler.bounds.from, scale = scaler.bounds.scale;
			return function(x){ return (x - offset) * scale; };	// Function
		},
		getTransformerFromPlot: function(/*Object*/ scaler){
			var offset = scaler.bounds.from, scale = scaler.bounds.scale;
			return function(x){ return x / scale + offset; };	// Function
		}
	});
});

},
'money/nls/stats':function(){
define({
	root: {
		title	: "Statistics & reports",
	    
	    expences: 'Expences',
	    incomes: 'Incomes',
	    transfers: 'Transfers',
	    back: 'Back', 
	    noAccounts: 'You don\'t have any accounts yet',
	    noTransactions: 'No transactions found for selected timespan.',
	    menu: 'Menu',
	    accounts: 'Accounts',
	    transactions: 'Transactions',
	    add: 'Add',
	    addFirst : 'to add one',
	    navMenu: ' in the main menu ',
	    allTheTime : 'All the time',
	    addFirstAccount : 'to add your first account',
	    tap		: 'Tap',
	    myAchievements: 'My achievements for period',
	    myAccounts: 'My accounts',
	    myTransactions: 'My transactions',
	    expInc : 'Expences/Incomes',
	    byTags : 'Transactions by tags',
	    transs : 'tr.',
	    noTags : 'No tags',
	    moreCharts: 'Graphic reports',
	    earlier: 'Previous months',
	    later: 'Next months',
	    
	    "series-i" : 'Incomes',
	    "series-e" : 'Expences'
	    
	},
	'ru-ru': true
});

},
'money/nls/ru-ru/stats':function(){
define({
	
	title	: "Отчеты и статистика",
	    
	expences: 'Расходы',
	incomes: 'Доходы',
	transfers: 'Переводы',
	back: 'Назад', 
	noAccounts: '',
	noTransactions: 'Не найдено транзакций за выбранный период времени.',
	menu: 'Меню',
	accounts: 'Счета',
	transactions: 'Транзакции',
	add: 'Добавить',
	navMenu: ' в главном меню',
	addFirst : 'чтобы добавить транзакцию',
	addFirstAccount : 'чтобы добавить первый счет',
	tap		: 'Нажмите',
	myAchievements: 'Итого за период',
	myAccounts: 'Мои счета',
	myTransactions: 'Мои транзакции',
	expInc : 'Расходы/Доходы',
	byTags : 'Транзакции по категориям',
	moreCharts : 'Отчеты',
	transs: 'тр.',
	noTags : 'Без меток',
	earlier: 'Предыдущие месяцы',
	later: 'Следующие месяцы',
	    
	    "series-i" : 'Расходы',
	    "series-e" : 'Доходы'
	
});

},
'money/numberpicker':function(){
// Include basic Dojo, mobile, XHR dependencies along with
define([
	"dojo/_base/declare","dijit/registry",
	"dojo/on","dijit/_WidgetBase","dojo/_base/array","dojo/_base/lang",
    "dijit/_TemplatedMixin","dijit/_WidgetsInTemplateMixin",
	"dojo/text!../money/numberpicker.html", 'dojo/i18n!./nls/np', "dojox/mobile/Pane","dojox/mobile/GridLayout","dojox/mobile/TextBox"
    ],
    function(declare,registry,on, _WidgetBase, arrayUtil,lang, _TemplatedMixin, _WidgetsInTemplateMixin, template, nls) {
        // Return the declared class!
        return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
			templateString: template,
			constructor: function(){
				this.nls = nls
				console.log(nls)
				window.AppData.numberPicker = this
								
			},
			type	: 'e',
			zeros 	: 2,
			zeroCounts: window.AppData.zeroCounts,
			value	: '000',
			 _onDoneCallbackRegistry: [{
				fn		: function(value){
					console.log("edited", value)
                },
                scope	: window,
                mode	: 'all'
            }],
			mode: "t",
			
			startup: function() {
				this.inherited(arguments);
				this.amount = registry.byId('amount-input')
			},
			
			show: function( val, cur ){
				var cur = cur || (
					( window.AppData.details && this.mode == 't' ) ? 
						window.AppData.details.transaction.currency.toLowerCase() : 
						window.AppData.currency
				);
				var val = val || (
					( window.AppData.details && this.mode == 't' ) ? 
						window.AppData.details.transaction.amount :
						0
				)
				
				cur = cur.toLowerCase();
				console.log('THE CURRENCY', cur)
				if(cur && this.zeroCounts[cur] != undefined )
					this.zeros = this.zeroCounts[cur];
				else this.zeros = 2;
				//var dotPos = this.value.indexOf('.') != -1 ? ( this.value.length - this.value.indexOf('.') ) : 0;
				this.value = String( Math.abs( val * Math.pow(10, ( this.zeros ) ) ) );
				
				this.value = 
					String( Math.abs( parseInt( this.value )) );
				
				while( this.value.length < this.zeros + 1) {
					this.value = '0' + this.value;
				}
				
				if(window.AppData.details && window.AppData.details.transaction && window.AppData.details.transaction.type)
					this.type = window.AppData.details.transaction.type
				if(this.mode == "t" ) {
					console.log('ZEROS2', this.zeros, val, this.value, parseInt(val), String(parseInt(val)))
					this.amount.set('value', getNumber( Math.abs( window.AppData.details.transaction.amount ), this.zeros))
				}
				else if(this.mode == "a" ) this.amount.set('value',getNumber(Math.abs(window.AppData.objAccounts.account.startAmount)))
				registry.byId('customPicker').show('amount', ['below-centered','above-centered','after','before'])
			},
			
			done: function(){
				var val = Number( registry.byId('amount-input').get('value') , this.zeros);
				val = (this.type == "e") ? -val: val;
				registry.byId('customPicker').hide();
				return val;
			},
			
			onDone: function(){
				var self = window.AppData.numberPicker
				arrayUtil.forEach(this._onDoneCallbackRegistry, function(c){                    
					if(lang.isFunction(c.fn) && ( self.mode == c.mode || c.mode == 'all') ){
						var exec = lang.hitch(c.scope,c.fn,self.done());
						exec();
					}
				});				
			},
			
			key: function(code, btn){
				/*if(btn){
					btn.set('disabled',true)
					setTimeout(function(){
						btn.set('disabled',false)
					},50)
				}*/
				var self = this
				console.log( this.value )
				if(code == "dz") {
					this.key('0');
					this.key('0');
					return;
				} else if(code == 'c') {
					this.value = this.value.substr(0, this.value.length - 1)
					if(this.value.length < this.zeros + 1)
						this.value = '0' + this.value.toString()
					}else{
						this.value += code.toString() ;
						if(this.value.substr(0, 1) == '0'){
							this.value = this.value.substr(1, this.value.length-1)
						}							
					}
				console.log('!!!!!!!!!!!!!!!', this.zeros,this.zeros > 0, this.value.substr(0, this.value.length - this.zeros), this.zeros > 0 ? ('.' + this.value.substr( -this.zeros) ) : '')
				var newval = this.value.substr(0, this.value.length - this.zeros) + 
					( this.zeros > 0 ? ('.' + this.value.substr( -this.zeros) ) : '' );
				self.amount.set('value', newval)
			},
		})
	}
);

},
'dojox/gfx/gradutils':function(){
// Various generic utilities to deal with a linear gradient

define(["./_base", "dojo/_base/lang", "./matrix", "dojo/_base/Color"], 
  function(g, lang, m, Color){
  
	var gradutils = g.gradutils = {};

	function findColor(o, c){
		if(o <= 0){
			return c[0].color;
		}
		var len = c.length;
		if(o >= 1){
			return c[len - 1].color;
		}
		//TODO: use binary search
		for(var i = 0; i < len; ++i){
			var stop = c[i];
			if(stop.offset >= o){
				if(i){
					var prev = c[i - 1];
					return Color.blendColors(new Color(prev.color), new Color(stop.color),
						(o - prev.offset) / (stop.offset - prev.offset));
				}
				return stop.color;
			}
		}
		return c[len - 1].color;
	}

	gradutils.getColor = function(fill, pt){
		// summary:
		//		sample a color from a gradient using a point
		// fill: Object
		//		fill object
		// pt: dojox/gfx.Point
		//		point where to sample a color
		var o;
		if(fill){
			switch(fill.type){
				case "linear":
					var angle = Math.atan2(fill.y2 - fill.y1, fill.x2 - fill.x1),
						rotation = m.rotate(-angle),
						projection = m.project(fill.x2 - fill.x1, fill.y2 - fill.y1),
						p = m.multiplyPoint(projection, pt),
						pf1 = m.multiplyPoint(projection, fill.x1, fill.y1),
						pf2 = m.multiplyPoint(projection, fill.x2, fill.y2),
						scale = m.multiplyPoint(rotation, pf2.x - pf1.x, pf2.y - pf1.y).x;
					o = m.multiplyPoint(rotation, p.x - pf1.x, p.y - pf1.y).x / scale;
					break;
				case "radial":
					var dx = pt.x - fill.cx, dy = pt.y - fill.cy;
					o = Math.sqrt(dx * dx + dy * dy) / fill.r;
					break;
			}
			return findColor(o, fill.colors);	// dojo/_base/Color
		}
		// simple color
		return new Color(fill || [0, 0, 0, 0]);	// dojo/_base/Color
	};

	gradutils.reverse = function(fill){
		// summary:
		//		reverses a gradient
		// fill: Object
		//		fill object
		if(fill){
			switch(fill.type){
				case "linear":
				case "radial":
					fill = lang.delegate(fill);
					if(fill.colors){
						var c = fill.colors, l = c.length, i = 0, stop,
							n = fill.colors = new Array(c.length);
						for(; i < l; ++i){
							stop = c[i];
							n[i] = {
								offset: 1 - stop.offset,
								color:  stop.color
							};
						}
						n.sort(function(a, b){ return a.offset - b.offset; });
					}
					break;
			}
		}
		return fill;	// Object
	};

	return gradutils;
});

},
'dojox/charting/plot2d/Base':function(){
define(["dojo/_base/declare", "dojo/_base/array", "dojox/gfx",
		"../Element", "./common", "../axis2d/common", "dojo/has"],
	function(declare, arr, gfx, Element, common, ac, has){
/*=====
dojox.charting.plot2d.__PlotCtorArgs = {
	// summary:
	//		The base keyword arguments object for plot constructors.
	//		Note that the parameters for this may change based on the
	//		specific plot type (see the corresponding plot type for
	//		details).

	// tooltipFunc: Function?
	//		An optional function used to compute tooltip text for this plot. It takes precedence over
	//		the default function when available.
	//	|		function tooltipFunc(o) { return "text"; }
	//		`o`is the event object that triggered the tooltip.
	tooltipFunc: null
};
=====*/
	var Base = declare("dojox.charting.plot2d.Base", Element, {
		// summary:
		//		Base class for all plot types.
		constructor: function(chart, kwArgs){
			// summary:
			//		Create a base plot for charting.
			// chart: dojox/chart/Chart
			//		The chart this plot belongs to.
			// kwArgs: dojox.charting.plot2d.__PlotCtorArgs?
			//		An optional arguments object to help define the plot.
	
			// TODO does not work in markup
			if(kwArgs && kwArgs.tooltipFunc){
				this.tooltipFunc = kwArgs.tooltipFunc;
			}
		},
		clear: function(){
			// summary:
			//		Clear out all of the information tied to this plot.
			// returns: dojox.charting.plot2d.Base
			//		A reference to this plot for functional chaining.
			this.series = [];
			this.dirty = true;
			return this;	//	dojox/charting/plot2d/Base
		},
		setAxis: function(axis){
			// summary:
			//		Set an axis for this plot.
			// axis: dojox.charting.axis2d.Base
			//		The axis to set.
			// returns: dojox/charting/plot2d/Base
			//		A reference to this plot for functional chaining.
			return this;	//	dojox/charting/plot2d/Base
		},
		assignAxes: function(axes){
			// summary:
			//		From an array of axes pick the ones that correspond to this plot and
			//		assign them to the plot using setAxis method.
			// axes: Array
			//		An array of dojox/charting/axis2d/Base
			// tags:
			//		protected
			arr.forEach(this.axes, function(axis){
				if(this[axis]){
					this.setAxis(axes[this[axis]]);
				}
			}, this);
		},
		addSeries: function(run){
			// summary:
			//		Add a data series to this plot.
			// run: dojox.charting.Series
			//		The series to be added.
			// returns: dojox/charting/plot2d/Base
			//		A reference to this plot for functional chaining.
			this.series.push(run);
			return this;	//	dojox/charting/plot2d/Base
		},
		getSeriesStats: function(){
			// summary:
			//		Calculate the min/max on all attached series in both directions.
			// returns: Object
			//		{hmin, hmax, vmin, vmax} min/max in both directions.
			return common.collectSimpleStats(this.series);
		},
		calculateAxes: function(dim){
			// summary:
			//		Stub function for running the axis calculations (deprecated).
			// dim: Object
			//		An object of the form { width, height }
			// returns: dojox/charting/plot2d/Base
			//		A reference to this plot for functional chaining.
			this.initializeScalers(dim, this.getSeriesStats());
			return this;	//	dojox/charting/plot2d/Base
		},
		initializeScalers: function(){
			// summary:
			//		Does nothing.
			return this;
		},
		isDataDirty: function(){
			// summary:
			//		Returns whether or not any of this plot's data series need to be rendered.
			// returns: Boolean
			//		Flag indicating if any of this plot's series are invalid and need rendering.
			return arr.some(this.series, function(item){ return item.dirty; });	//	Boolean
		},
		render: function(dim, offsets){
			// summary:
			//		Render the plot on the chart.
			// dim: Object
			//		An object of the form { width, height }.
			// offsets: Object
			//		An object of the form { l, r, t, b }.
			// returns: dojox/charting/plot2d/Base
			//		A reference to this plot for functional chaining.
			return this;	//	dojox/charting/plot2d/Base
		},
		renderLabel: function(group, x, y, label, theme, block, align){
			var elem = ac.createText[this.opt.htmlLabels && gfx.renderer != "vml" ? "html" : "gfx"]
				(this.chart, group, x, y, align?align:"middle", label, theme.series.font, theme.series.fontColor);
			// if the label is inside we need to avoid catching events on it this would prevent action on
			// chart elements
			if(block){
				// TODO this won't work in IE neither in VML nor in HTML
				// a solution would be to catch the event on the label and refire it to the element
				// possibly using elementFromPoint or having it already available
				if(this.opt.htmlLabels && gfx.renderer != "vml"){
					// we have HTML labels, let's use pointEvents on the HTML node
					elem.style.pointerEvents = "none";
				}else if(elem.rawNode){
					// we have SVG labels, let's use pointerEvents on the SVG or VML node
					elem.rawNode.style.pointerEvents = "none";
				}
				// else we have Canvas, we need do nothing, as Canvas text won't catch events
			}
			if(this.opt.htmlLabels && gfx.renderer != "vml"){
				this.htmlElements.push(elem);
			}

			return elem;
		},
		getRequiredColors: function(){
			// summary:
			//		Get how many data series we have, so we know how many colors to use.
			// returns: Number
			//		The number of colors needed.
			return this.series.length;	//	Number
		},
		_getLabel: function(number){
			return common.getLabel(number, this.opt.fixed, this.opt.precision);
		}
	});
	if(has("dojo-bidi")){
		Base.extend({
			_checkOrientation: function(group, dim, offsets){
				this.chart.applyMirroring(this.group, dim, offsets);
			}		
		});
	}
	return Base;
});

},
'money/WheelScrollableView':function(){
define([
"dojo/_base/declare",
"dojo/_base/event",
"dojo/mouse",
"dojox/mobile/sniff",
"dojox/mobile/ScrollablePane"
], function(declare, event, mouse, has, ScrollableView){
    return declare("money.WheelScrollableView", ScrollableView, {
        init: function(params){
            this.inherited(arguments);
            //if(!has("touch")){
            this.connect(this.domNode, mouse.wheel, "_mouseWheel");
            this.addCover();

            this.removeCover();
            this.flashScrollBar();
            this.isFirstScroll = true
            window.t = this
            this._waitingInterval = setInterval(function(){
                self.isFirstScroll = true
            },2000)

        },
        _mouseWheel: function(e){
            event.stop(e); // prevent propagation
            if(this._waitingInterval)
                clearInterval(this._waitingInterval)

            var pos = this.getPos();
            var dim = this.getDim();
            var self = this;

            if(this.isFirstScroll)
                this.flashScrollBar();

            this.isFirstScroll = false

            this.showScrollBar();

            if(window.AppData.scrollBarTimeout)
                clearTimeout(window.AppData.scrollBarTimeout)

            window.AppData.scrollBarTimeout = setTimeout(function(){
                self.hideScrollBar()
                self.removeCover();
                self._waitingInterval = setInterval(function(){
                    self.isFirstScroll = true
                },2000)
            },1000)

            var deltaY = e.wheelDelta > 0 ? 150 : - 150;
            var newY = pos.y + deltaY;
            //console.log(newY)
            //console.log(dim)

            if (newY <= 0 && Math.abs(newY) <= dim.o.h){ // stop scrolling at the top/bottom
                this.slideTo({x: pos.x, y: newY});
            }
            else 
                if( (newY < 0 ) && ( Math.abs(newY) > dim.o.h ) && ( dim.d.h < dim.c.h) ) this.slideTo({x: pos.x, y: -dim.o.h})
            else 
                if (newY > 0) this.slideTo({x: pos.x, y: 0}) 

        }
    });
});

},
'money/nls/backup':function(){
define({
	root: {
		title	: "Backup & Restore",
	    dropbox	: 'You can sync data between your devices using Dropbox account',
	    dropboxStart : 'Press button to sync your data',
	    dropboxRedirect: 'After clicking the button You\'ll be redirected to Dropbox web page to authorize and then redirected back to this page:',
	    menu	: 'Menu',
	    onlineBackup : 'Dropbox',
	    factoryReset : 'My device',
	    internetRequired : 'Your device need to be conncted to Internet to use backup & sync',
	    
	    backupCreate: 'Sync now',
		restore		: 'Restore from Dropbox',
		clearRemote	: 'Clear Dropbox data',
		clearLocal	: 'Clear local data',
		clear		: 'Delete all data & settings',
		clearTrans	: 'Delete all transactions',
		
		linkDropbox	: 'Link to my Dropbox account',
		unlinkDropbox: 'Unlink my Dropbox account',
	    backupRestoreTitle : 'Backup & Restore',
	    taskCompleted : 'Task completed',
	    applicationWillBeRestarted : 'Application will be restarted',
	    errorOpeningDatastore: 'Error opening Dropbox datastore. Please, check your Internet connection, try to restart Application or unlink your Dropbox account and link it once again',
	    errorCreatingDatastore : 'Error creating datastore. Maybe your platform is not supported by Dropbox Datastore API',
	    errorStrange : 'Sync error. Please, try to reconnect your Dropbox account.',
	    error : 'ERROR',
	    errorInState: 'Error occured in the Dropbox datastore API. Don\'t worry, application will be restarted and everything will be OK. :-)',
	    restart : 'Restart application',
	    
	    processing: "Processing...",
		syncing	: 'Sync to Dropbox',
		cancel	: 'Hide progress',
		signing : 'Redirecting to dropbox.com',
		pleaseWait: 'Please wait...',
		currenciesDontMatch: 'Home currencies don\'t match. Please, clear dropbox data or clear local data and set the same home currency as in Dropbox',
		sureToClear: 'Delete all application data at Dropbox?',
		sureToClearAll: 'Delete all application data at THIS device?',
		no: 'No',
		yes: 'Yes'
	},
	'ru-ru': true
});

},
'money/nls/ru-ru/backup':function(){
define({
	title	: "Синхронизация данных",
	dropbox	: 'Вы можете синхронизировать данные между Вашими устройствами, использую учетную запись Dropbox',
	dropboxStart	: 'Для выполнения синхронизации нажмите на кнопку:',
	dropboxRedirect: 'После нажатия на кнопку Вы будете перенаправлены на сайт Dropbox для выполнения авторизации, и затем перенаправлены на эту страницу снова:',
	menu	: 'Меню',
	onlineBackup : 'Dropbox',
	factoryReset : 'Мое устройство',
	internetRequired : 'Соединение с Интернет необходимо для синхронизаци данных',
	    
	backupCreate: 'Синхронизировать данные',
	restore		: 'Восстановить данные из Dropbox',
	clearRemote	: 'Удалить данные из Dropbox',
	clearLocal	: 'Удалить данные?',
	clear		: 'Удалить все данные и настройки',
	clearTrans	: 'Удалить все транзакции',
		
	linkDropbox	: 'Подключить учетную запись Dropbox',
	unlinkDropbox: 'Отключить учетную запись Dropbox',
	backupRestoreTitle : 'Синхронизация',
	taskCompleted : 'Задача успешно выполнена',
	applicationWillBeRestarted : 'Приложение будет перезапущено',
	errorOpeningDatastore: 'Ошибка соединения с Dropbox. Пожалуйста, проверьте наличие Интернет-соединения, попробуйте перезапустить приложение или заново подключить Вашу учетную запись Dropbox.',
	errorCreatingDatastore : 'Ошибка создания хранилища данных для Dropbox. Возможно, Ваша платформа не поддерживается Dropbox Datastore API',
	errorStrange : 'Ошибка синхронизации. Пожалуйста, попробуйте заново подключить Вашу учетную запись Dropbox.',
	error : 'ОШИБКА',
	errorInState: 'Ошибка Dropbox datastore API. Сейчас приложение будет перезапущено и все будет в порядке :-)',
	restart : 'Перезапустить приложение',
	
	processing: "Идет синхронизация...",
	syncing	: 'Сохранение в Dropbox',
	cancel	: 'Скрыть окно',
	signing : 'Соединение с dropbox.com',
	pleaseWait: 'Секундочку...',
	currenciesDontMatch: 'Основные валюты не совпадают. Пожалуйста, удалите данные в Dropbox ИЛИ удалите все данные на локальном устройстве и установите ту же основную валюту, что и в Dropbox',
	sureToClear: 'Удалить данные приложения в Dropbox?',
		sureToClearAll: 'Удалить данные приложения на ЭТОМ устройстве?',
		no: 'Нет',
		yes: 'Да'
});

},
'money/nls/about':function(){
define({
	root: {
		title	: "R5M Finance",
	    r5mfIs	: 'R5M Finance is an easy-to-use cross-platform finance manager for your smartphone',
	    menu	: 'Menu',
	    updates	: 'Updates:',
	    symba	: 'Note for Symbian (Nokia belle) users: ..Symbian, as you might know, also works on magic. So it\'s all about magic*magic = magic^2! ;-)',
	    thanks	: 'Thanks to:',
	    
	    issueTitle	: 'If something went wrong',
	    issue	: 'Report bug',
	    latest	: 'Latest version already installed.',
	    updating: 'Downloading updates...',
	    ready	: 'Updates are ready to be installed.',
	    apply	: 'Apply updates',
	    updated	: 'Currencies exchange rates for ',
	    
	    webSiteTitle : 'Project site',
	    webSite	: 'Visit our project page to find applications for other devices and get latest news',
	    webSiteUrl : 'http://r5m.me',
	    
	    helpUs : 'Support R5M Finance project',
	    helpAbout : 'Together we can make World a better place. Your support to the project is very appreciated. Please, visit our web page at http://r5m.me to make a donation or submit bugs',
	    donate: 'en',
	    
	    asIs: "This software is provided 'as-is', without any express or implied warranty. In no event will the authors be held liable for any damages arising from the use of this software.",
	    eula: 'EULA',
	    
	    privacyTitle: "Privacy policy",
	    privacy: "This application doesn't collect, use, store, and share or disclose any information about the user or any other person. All data is stored on your device. Sync is done using Dropbox datastore API. Information about Dropbox privacy policy can be found at dropbox.com"
	},
	'ru-ru': true
});

},
'money/nls/ru-ru/about':function(){
define({
		title	: "R5M Finance",
	    r5mfIs	: 'R5M Finance - это простой в использовании кросс-платформенный меннеджер личных финансов для мобильных устройств',
	    menu	: 'Меню',
	    updates	: 'Обновления:',
	    symba	: 'Note for Symbian (Nokia belle) users: ..Symbian, as you might know, also works on magic. So it\'s all about magic*magic = magic^2! ;-)',
	    thanks	: 'Авторы выражают благодарность:',
	    
	    latest	: 'Установлена актуальная версия приложения.',
	    updating: 'Загрузка обновлений...',
	    ready	: 'Обновления готовы к уставновке.',
	    apply	: 'Применить обновления',
		updated	: 'Курсы обмена валют за ',
		issue	: 'Сообщить об ошибке',
	    issueTitle	: 'Если что-то пошло не так',
	    
		webSiteTitle : 'Сайт проекта',
	    webSite	: 'Последние новости и приложения для других платформ доступны на официальном сайте проекта:',
	    webSiteUrl : 'http://r5m.me',
	    
	    helpUs : 'Поддержите R5M Finance',
	    helpAbout : 'Нам важна Ваша поддержка. На сайте r5m.me Вы можете сделать пожертвование, сообщить об ошибках или поделиться идеями.',
	    donate: 'ru',
	    
	    asIs: "Настоящее программное обеспечение предоставляется 'как-есть', без каких-либо явных или подразумеваемых гарантий. Ни при каких условиях авторы не несут ответственности за любые убытки, возникшие в результате использования данного программного обеспечения.",
	    
	    privacyTitle: "Политика конфиденциальности",
	    privacy: "Данное приложение не собирает и не хранит какую-либо информацию о пользователях. Все данные хранятся на Вашем устройстве. Синхронизация данных выполняется с использованием Dropbox datastore API. Информация о политике конфиденциальности Dropbox может быть найдена на dropbox.com"
});

},
'dojo/store/Memory':function(){
define(["../_base/declare", "./util/QueryResults", "./util/SimpleQueryEngine" /*=====, "./api/Store" =====*/],
function(declare, QueryResults, SimpleQueryEngine /*=====, Store =====*/){

// module:
//		dojo/store/Memory

// No base class, but for purposes of documentation, the base class is dojo/store/api/Store
var base = null;
/*===== base = Store; =====*/

return declare("dojo.store.Memory", base, {
	// summary:
	//		This is a basic in-memory object store. It implements dojo/store/api/Store.
	constructor: function(options){
		// summary:
		//		Creates a memory object store.
		// options: dojo/store/Memory
		//		This provides any configuration information that will be mixed into the store.
		//		This should generally include the data property to provide the starting set of data.
		for(var i in options){
			this[i] = options[i];
		}
		this.setData(this.data || []);
	},
	// data: Array
	//		The array of all the objects in the memory store
	data:null,

	// idProperty: String
	//		Indicates the property to use as the identity property. The values of this
	//		property should be unique.
	idProperty: "id",

	// index: Object
	//		An index of data indices into the data array by id
	index:null,

	// queryEngine: Function
	//		Defines the query engine to use for querying the data store
	queryEngine: SimpleQueryEngine,
	get: function(id){
		// summary:
		//		Retrieves an object by its identity
		// id: Number
		//		The identity to use to lookup the object
		// returns: Object
		//		The object in the store that matches the given id.
		return this.data[this.index[id]];
	},
	getIdentity: function(object){
		// summary:
		//		Returns an object's identity
		// object: Object
		//		The object to get the identity from
		// returns: Number
		return object[this.idProperty];
	},
	put: function(object, options){
		// summary:
		//		Stores an object
		// object: Object
		//		The object to store.
		// options: dojo/store/api/Store.PutDirectives?
		//		Additional metadata for storing the data.  Includes an "id"
		//		property if a specific id is to be used.
		// returns: Number
		var data = this.data,
			index = this.index,
			idProperty = this.idProperty;
		var id = object[idProperty] = (options && "id" in options) ? options.id : idProperty in object ? object[idProperty] : Math.random();
		if(id in index){
			// object exists
			if(options && options.overwrite === false){
				throw new Error("Object already exists");
			}
			// replace the entry in data
			data[index[id]] = object;
		}else{
			// add the new object
			index[id] = data.push(object) - 1;
		}
		return id;
	},
	add: function(object, options){
		// summary:
		//		Creates an object, throws an error if the object already exists
		// object: Object
		//		The object to store.
		// options: dojo/store/api/Store.PutDirectives?
		//		Additional metadata for storing the data.  Includes an "id"
		//		property if a specific id is to be used.
		// returns: Number
		(options = options || {}).overwrite = false;
		// call put with overwrite being false
		return this.put(object, options);
	},
	remove: function(id){
		// summary:
		//		Deletes an object by its identity
		// id: Number
		//		The identity to use to delete the object
		// returns: Boolean
		//		Returns true if an object was removed, falsy (undefined) if no object matched the id
		var index = this.index;
		var data = this.data;
		if(id in index){
			data.splice(index[id], 1);
			// now we have to reindex
			this.setData(data);
			return true;
		}
	},
	query: function(query, options){
		// summary:
		//		Queries the store for objects.
		// query: Object
		//		The query to use for retrieving objects from the store.
		// options: dojo/store/api/Store.QueryOptions?
		//		The optional arguments to apply to the resultset.
		// returns: dojo/store/api/Store.QueryResults
		//		The results of the query, extended with iterative methods.
		//
		// example:
		//		Given the following store:
		//
		// 	|	var store = new Memory({
		// 	|		data: [
		// 	|			{id: 1, name: "one", prime: false },
		//	|			{id: 2, name: "two", even: true, prime: true},
		//	|			{id: 3, name: "three", prime: true},
		//	|			{id: 4, name: "four", even: true, prime: false},
		//	|			{id: 5, name: "five", prime: true}
		//	|		]
		//	|	});
		//
		//	...find all items where "prime" is true:
		//
		//	|	var results = store.query({ prime: true });
		//
		//	...or find all items where "even" is true:
		//
		//	|	var results = store.query({ even: true });
		return QueryResults(this.queryEngine(query, options)(this.data));
	},
	setData: function(data){
		// summary:
		//		Sets the given data as the source for this store, and indexes it
		// data: Object[]
		//		An array of objects to use as the source of data.
		if(data.items){
			// just for convenience with the data format IFRS expects
			this.idProperty = data.identifier || this.idProperty;
			data = this.data = data.items;
		}else{
			this.data = data;
		}
		this.index = {};
		for(var i = 0, l = data.length; i < l; i++){
			this.index[data[i][this.idProperty]] = i;
		}
	}
});

});

},
'dojox/app/main':function(){
define(["require", "dojo/_base/kernel", "dojo/_base/lang", "dojo/_base/declare", "dojo/_base/config",
	"dojo/_base/window", "dojo/Evented", "dojo/Deferred", "dojo/when", "dojo/has", "dojo/on", "dojo/ready",
	"dojo/dom-construct", "dojo/dom-attr", "./utils/model", "./utils/nls", "./module/lifecycle",
	"./utils/hash", "./utils/constraints", "./utils/config"],
	function(require, kernel, lang, declare, config, win, Evented, Deferred, when, has, on, ready, domConstruct, domAttr,
			 model, nls, lifecycle, hash, constraints, configUtils){

	has.add("app-log-api", (config["app"] || {}).debugApp);

	var Application = declare(Evented, {
		constructor: function(params, node){
			lang.mixin(this, params);
			this.params = params;
			this.id = params.id;
			this.defaultView = params.defaultView;
			this.controllers = [];
			this.children = {};
			this.loadedModels = {};
			this.loadedStores = {};
			// Create a new domNode and append to body
			// Need to bind startTransition event on application domNode,
			// Because dojox/mobile/ViewController bind startTransition event on document.body
			// Make application's root domNode id unique because this id can be visited by window namespace on Chrome 18.
			this.setDomNode(domConstruct.create("div", {
				id: this.id+"_Root",
				style: "width:100%; height:100%; overflow-y:hidden; overflow-x:hidden;"
			}));
			node.appendChild(this.domNode);
		},

		createDataStore: function(params){
			// summary:
			//		Create data store instance
			//
			// params: Object
			//		data stores configuration.

			if(params.stores){
				//create stores in the configuration.
				for(var item in params.stores){
					if(item.charAt(0) !== "_"){//skip the private properties
						var type = params.stores[item].type ? params.stores[item].type : "dojo/store/Memory";
						var config = {};
						if(params.stores[item].params){
							lang.mixin(config, params.stores[item].params);
						}
						// we assume the store is here through dependencies
						try{
							var storeCtor = require(type);
						}catch(e){
							throw new Error(type+" must be listed in the dependencies");
						}
						if(config.data && lang.isString(config.data)){
							//get the object specified by string value of data property
							//cannot assign object literal or reference to data property
							//because json.ref will generate __parent to point to its parent
							//and will cause infinitive loop when creating StatefulModel.
							config.data = lang.getObject(config.data);
						}
						if(params.stores[item].observable){
							try{
								var observableCtor = require("dojo/store/Observable");
							}catch(e){
								throw new Error("dojo/store/Observable must be listed in the dependencies");
							}
							params.stores[item].store = observableCtor(new storeCtor(config));
						}else{
							params.stores[item].store = new storeCtor(config);
						}
						this.loadedStores[item] = params.stores[item].store;							
					}
				}
			}
		},

		createControllers: function(controllers){
			// summary:
			//		Create controller instance
			//
			// controllers: Array
			//		controller configuration array.
			// returns:
			//		controllerDeferred object

			if(controllers){
				var requireItems = [];
				for(var i = 0; i < controllers.length; i++){
					requireItems.push(controllers[i]);
				}

				var def = new Deferred();
				var requireSignal;
				try{
					requireSignal = require.on ? require.on("error", function(error){
						if(def.isResolved() || def.isRejected()){
							return;
						}
						def.reject("load controllers error.");
						if(requireSignal){
							requireSignal.remove();
						}
					}) : null;
					require(requireItems, function(){
						def.resolve.call(def, arguments);
						if(requireSignal){
							requireSignal.remove();
						}
					});
				}catch(e){
					def.reject(e);
					if(requireSignal){
						requireSignal.remove();
					}
				}

				var controllerDef = new Deferred();
				when(def, lang.hitch(this, function(){
					for(var i = 0; i < arguments[0].length; i++){
						// instantiate controllers, set Application object, and perform auto binding
						this.controllers.push((new arguments[0][i](this)).bind());
					}
					controllerDef.resolve(this);
				}), function(){
					//require def error, reject loadChildDeferred
					controllerDef.reject("load controllers error.");
				});
				return controllerDef;
			}
		},

		trigger: function(event, params){
			// summary:
			//		trigger an event. Deprecated, use emit instead.
			//
			// event: String
			//		event name. The event is binded by controller.bind() method.
			// params: Object
			//		event params.
			kernel.deprecated("dojox.app.Application.trigger", "Use dojox.app.Application.emit instead", "2.0");
			this.emit(event, params);
		},

		// setup default view and Controllers and startup the default view
		start: function(){
			//
			//create application level data store
			this.createDataStore(this.params);

			// create application level data model
			var loadModelLoaderDeferred = new Deferred();
			var createPromise;
			try{
				createPromise = model(this.params.models, this, this);
			}catch(e){
				loadModelLoaderDeferred.reject(e);
				return loadModelLoaderDeferred.promise;
			}
			when(createPromise, lang.hitch(this, function(models){
				// if models is an array it comes from dojo/promise/all. Each array slot contains the same result object
				// so pick slot 0.
				this.loadedModels = lang.isArray(models)?models[0]:models;
				this.setupControllers();
				// if available load root NLS
				when(nls(this.params), lang.hitch(this, function(nls){
					if(nls){
						lang.mixin(this.nls = {}, nls);
					}
					this.startup();
				}));
			}), function(){
				loadModelLoaderDeferred.reject("load model error.")
			});
		},

		setDomNode: function(domNode){
			var oldNode = this.domNode;
			this.domNode = domNode;
			this.emit("app-domNode", {
				oldNode: oldNode,
				newNode: domNode
			});
		},

		setupControllers: function(){
			// create application controller instance
			// move set _startView operation from history module to application
			var currentHash = window.location.hash;
		//	this._startView = (((currentHash && currentHash.charAt(0) == "#") ? currentHash.substr(1) : currentHash) || this.defaultView).split('&')[0];
			this._startView = hash.getTarget(currentHash, this.defaultView);
			this._startParams = hash.getParams(currentHash);
		},

		startup: function(){
			// load controllers and views
			//
			this.selectedChildren = {};			
			var controllers = this.createControllers(this.params.controllers);
			// constraint on app
			if(this.hasOwnProperty("constraint")){
				constraints.register(this.params.constraints);
			}else{
				this.constraint = "center";
			}
			var emitLoad = function(){
				// emit "app-load" event and let controller to load view.
				this.emit("app-load", {
					viewId: this.defaultView,
					initLoad: true,
					params: this._startParams,
					callback: lang.hitch(this, function (){
						this.emit("app-transition", {
							viewId: this.defaultView,
							forceTransitionNone: true, // we want to avoid the transition on the first display for the defaultView
							opts: { params: this._startParams }
						});
						if(this.defaultView !== this._startView){
							// transition to startView. If startView==defaultView, that means initial the default view.
							this.emit("app-transition", {
								viewId: this._startView,
								opts: { params: this._startParams }
							});
						}
						this.setStatus(this.lifecycle.STARTED);
					})
				});
			};
			when(controllers, lang.hitch(this, function(){
				if(this.template){
					// emit "app-init" event so that the Load controller can initialize root view
					this.emit("app-init", {
						app: this,	// pass the app into the View so it can have easy access to app
						name: this.name,
						type: this.type,
						parent: this,
						templateString: this.templateString,
						controller: this.controller,
						callback: lang.hitch(this, function(view){
							this.setDomNode(view.domNode);
							emitLoad.call(this);
						})
					});
				}else{
					emitLoad.call(this);
				}
			}));
		}		
	});

	function generateApp(config, node){
		// summary:
		//		generate the application
		//
		// config: Object
		//		app config
		// node: domNode
		//		domNode.
		var path;

		// call configProcessHas to process any has blocks in the config
		config = configUtils.configProcessHas(config);

		if(!config.loaderConfig){
			config.loaderConfig = {};
		}
		if(!config.loaderConfig.paths){
			config.loaderConfig.paths = {};
		}
		if(!config.loaderConfig.paths["app"]){
			// Register application module path
			path = window.location.pathname;
			if(path.charAt(path.length) != "/"){
				path = path.split("/");
				path.pop();
				path = path.join("/");
			}
			config.loaderConfig.paths["app"] = path;
		}
		require(config.loaderConfig);

		if(!config.modules){
			config.modules = [];
		}
		// add dojox/app lifecycle module by default
		config.modules.push("./module/lifecycle");
		var modules = config.modules.concat(config.dependencies?config.dependencies:[]);

		if(config.template){
			path = config.template;
			if(path.indexOf("./") == 0){
				path = "app/"+path;
			}
			modules.push("dojo/text!" + path);
		}

		require(modules, function(){
			var modules = [Application];
			for(var i = 0; i < config.modules.length; i++){
				modules.push(arguments[i]);
			}

			if(config.template){
				var ext = {
					templateString: arguments[arguments.length - 1]
				}
			}
			App = declare(modules, ext);

			ready(function(){
				var app = new App(config, node || win.body());

				if(has("app-log-api")){
					app.log = function(){
						// summary:
						//		If config is set to turn on app logging, then log msg to the console
						//
						// arguments: 
						//		the message to be logged, 
						//		all but the last argument will be treated as Strings and be concatenated together, 
						//      the last argument can be an object it will be added as an argument to the console.log 						
						var msg = "";
						try{
							for(var i = 0; i < arguments.length-1; i++){
								msg = msg + arguments[i];
							}
							console.log(msg,arguments[arguments.length-1]);
						}catch(e){}
					};
				}else{
					app.log = function(){}; // noop
				}

				app.transitionToView = function(/*DomNode*/target, /*Object*/transitionOptions, /*Event?*/triggerEvent){
					// summary:
					//		A convenience function to fire the transition event to transition to the view.
					//
					// target:
					//		The DOM node that initiates the transition (for example a ListItem).
					// transitionOptions:
					//		Contains the transition options.
					// triggerEvent:
					//		The event that triggered the transition (for example a touch event on a ListItem).
					var opts = {bubbles:true, cancelable:true, detail: transitionOptions, triggerEvent: triggerEvent || null};
					on.emit(target,"startTransition", opts);
				};

				app.setStatus(app.lifecycle.STARTING);
				// Create global namespace for application.
				// The global name is application id. ie: modelApp
				var globalAppName = app.id;
				if(window[globalAppName]){
					lang.mixin(app, window[globalAppName]);
				}
				window[globalAppName] = app;
				app.start();
			});
		});
	}

	return function(config, node){
		if(!config){
			throw new Error("App Config Missing");
		}

		if(config.validate){
			require(["dojox/json/schema", "dojox/json/ref", "dojo/text!dojox/application/schema/application.json"], function(schema, appSchema){
				schema = dojox.json.ref.resolveJson(schema);
				if(schema.validate(config, appSchema)){
					generateApp(config, node);
				}
			});
		}else{
			generateApp(config, node);
		}
	}
});

},
'dojox/color/Palette':function(){
define(["dojo/_base/lang", "dojo/_base/array", "./_base"],
	function(lang, arr, dxc){

	/***************************************************************
	*	dojox.color.Palette
	*
	*	The Palette object is loosely based on the color palettes
	*	at Kuler (http://kuler.adobe.com).  They are 5 color palettes
	*	with the base color considered to be the third color in the
	*	palette (for generation purposes).
	*
	*	Palettes can be generated from well-known algorithms or they
	* 	can be manually created by passing an array to the constructor.
	*
	*	Palettes can be transformed, using a set of specific params
	*	similar to the way shapes can be transformed with dojox.gfx.
	*	However, unlike with transformations in dojox.gfx, transforming
	* 	a palette will return you a new Palette object, in effect
	* 	a clone of the original.
	***************************************************************/

	//	ctor ----------------------------------------------------------------------------
	dxc.Palette = function(/* String|Array|dojox.color.Color|dojox.color.Palette */base){
		// summary:
		//		An object that represents a palette of colors.
		// description:
		//		A Palette is a representation of a set of colors.  While the standard
		//		number of colors contained in a palette is 5, it can really handle any
		//		number of colors.
		//
		//		A palette is useful for the ability to transform all the colors in it
		//		using a simple object-based approach.  In addition, you can generate
		//		palettes using dojox.color.Palette.generate; these generated palettes
		//		are based on the palette generators at http://kuler.adobe.com.

		// colors: dojox.color.Color[]
		//		The actual color references in this palette.
		this.colors = [];
		if(base instanceof dxc.Palette){
			this.colors = base.colors.slice(0);
		}
		else if(base instanceof dxc.Color){
			this.colors = [ null, null, base, null, null ];
		}
		else if(lang.isArray(base)){
			this.colors = arr.map(base.slice(0), function(item){
				if(lang.isString(item)){ return new dxc.Color(item); }
				return item;
			});
		}
		else if (lang.isString(base)){
			this.colors = [ null, null, new dxc.Color(base), null, null ];
		}
	}

	//	private functions ---------------------------------------------------------------

	//	transformations
	function tRGBA(p, param, val){
		var ret = new dxc.Palette();
		ret.colors = [];
		arr.forEach(p.colors, function(item){
			var r=(param=="dr")?item.r+val:item.r,
				g=(param=="dg")?item.g+val:item.g,
				b=(param=="db")?item.b+val:item.b,
				a=(param=="da")?item.a+val:item.a
			ret.colors.push(new dxc.Color({
				r: Math.min(255, Math.max(0, r)),
				g: Math.min(255, Math.max(0, g)),
				b: Math.min(255, Math.max(0, b)),
				a: Math.min(1, Math.max(0, a))
			}));
		});
		return ret;
	}

	function tCMY(p, param, val){
		var ret = new dxc.Palette();
		ret.colors = [];
		arr.forEach(p.colors, function(item){
			var o=item.toCmy(),
				c=(param=="dc")?o.c+val:o.c,
				m=(param=="dm")?o.m+val:o.m,
				y=(param=="dy")?o.y+val:o.y;
			ret.colors.push(dxc.fromCmy(
				Math.min(100, Math.max(0, c)),
				Math.min(100, Math.max(0, m)),
				Math.min(100, Math.max(0, y))
			));
		});
		return ret;
	}

	function tCMYK(p, param, val){
		var ret = new dxc.Palette();
		ret.colors = [];
		arr.forEach(p.colors, function(item){
			var o=item.toCmyk(),
				c=(param=="dc")?o.c+val:o.c,
				m=(param=="dm")?o.m+val:o.m,
				y=(param=="dy")?o.y+val:o.y,
				k=(param=="dk")?o.b+val:o.b;
			ret.colors.push(dxc.fromCmyk(
				Math.min(100, Math.max(0, c)),
				Math.min(100, Math.max(0, m)),
				Math.min(100, Math.max(0, y)),
				Math.min(100, Math.max(0, k))
			));
		});
		return ret;
	}

	function tHSL(p, param, val){
		var ret = new dxc.Palette();
		ret.colors = [];
		arr.forEach(p.colors, function(item){
			var o=item.toHsl(),
				h=(param=="dh")?o.h+val:o.h,
				s=(param=="ds")?o.s+val:o.s,
				l=(param=="dl")?o.l+val:o.l;
			ret.colors.push(dxc.fromHsl(h%360, Math.min(100, Math.max(0, s)), Math.min(100, Math.max(0, l))));
		});
		return ret;
	}

	function tHSV(p, param, val){
		var ret = new dxc.Palette();
		ret.colors = [];
		arr.forEach(p.colors, function(item){
			var o=item.toHsv(),
				h=(param=="dh")?o.h+val:o.h,
				s=(param=="ds")?o.s+val:o.s,
				v=(param=="dv")?o.v+val:o.v;
			ret.colors.push(dxc.fromHsv(h%360, Math.min(100, Math.max(0, s)), Math.min(100, Math.max(0, v))));
		});
		return ret;
	}

	//	helper functions
	function rangeDiff(val, low, high){
		//	given the value in a range from 0 to high, find the equiv
		//		using the range low to high.
		return high-((high-val)*((high-low)/high));
	}

/*=====
var __transformArgs = {
	// summary:
	//		The keywords argument to be passed to the dojox.color.Palette.transform function.  Note that
	//		while all arguments are optional, *some* arguments must be passed.  The basic concept is that
	//		you pass a delta value for a specific aspect of a color model (or multiple aspects of the same
	//		color model); for instance, if you wish to transform a palette based on the HSV color model,
	//		you would pass one of "dh", "ds", or "dv" as a value.
	// use: String?
	//		Specify the color model to use for the transformation.  Can be "rgb", "rgba", "hsv", "hsl", "cmy", "cmyk".
	// dr: Number?
	//		The delta to be applied to the red aspect of the RGB/RGBA color model.
	// dg: Number?
	//		The delta to be applied to the green aspect of the RGB/RGBA color model.
	// db: Number?
	//		The delta to be applied to the blue aspect of the RGB/RGBA color model.
	// da: Number?
	//		The delta to be applied to the alpha aspect of the RGBA color model.
	// dc: Number?
	//		The delta to be applied to the cyan aspect of the CMY/CMYK color model.
	// dm: Number?
	//		The delta to be applied to the magenta aspect of the CMY/CMYK color model.
	// dy: Number?
	//		The delta to be applied to the yellow aspect of the CMY/CMYK color model.
	// dk: Number?
	//		The delta to be applied to the black aspect of the CMYK color model.
	// dh: Number?
	//		The delta to be applied to the hue aspect of the HSL/HSV color model.
	// ds: Number?
	//		The delta to be applied to the saturation aspect of the HSL/HSV color model.
	// dl: Number?
	//		The delta to be applied to the luminosity aspect of the HSL color model.
	// dv: Number?
	//		The delta to be applied to the value aspect of the HSV color model.
};
var __generatorArgs = {
	// summary:
	//		The keyword arguments object used to create a palette based on a base color.
	// base: dojo/_base/Color
	//		The base color to be used to generate the palette.
};
var __analogousArgs = {
	// summary:
	//		The keyword arguments object that is used to create a 5 color palette based on the
	//		analogous rules as implemented at http://kuler.adobe.com, using the HSV color model.
	// base: dojo/_base/Color
	//		The base color to be used to generate the palette.
	// high: Number?
	//		The difference between the hue of the base color and the highest hue.  In degrees, default is 60.
	// low: Number?
	//		The difference between the hue of the base color and the lowest hue.  In degrees, default is 18.
};
var __splitComplementaryArgs = {
	// summary:
	//		The keyword arguments object used to create a palette based on the split complementary rules
	//		as implemented at http://kuler.adobe.com.
	// base: dojo/_base/Color
	//		The base color to be used to generate the palette.
	// da: Number?
	//		The delta angle to be used to determine where the split for the complementary rules happen.
	//		In degrees, the default is 30.
};
=====*/

	//	object methods ---------------------------------------------------------------
	lang.extend(dxc.Palette, {
		transform: function(/*__transformArgs*/kwArgs){
			// summary:
			//		Transform the palette using a specific transformation function
			//		and a set of transformation parameters.
			// description:
			//		{palette}.transform is a simple way to uniformly transform
			//		all of the colors in a palette using any of 5 formulae:
			//		RGBA, HSL, HSV, CMYK or CMY.
			//
			//		Once the forumula to be used is determined, you can pass any
			//		number of parameters based on the formula "d"[param]; for instance,
			//		{ use: "rgba", dr: 20, dg: -50 } will take all of the colors in
			//		palette, add 20 to the R value and subtract 50 from the G value.
			//
			//		Unlike other types of transformations, transform does *not* alter
			//		the original palette but will instead return a new one.
			var fn=tRGBA;	//	the default transform function.
			if(kwArgs.use){
				//	we are being specific about the algo we want to use.
				var use=kwArgs.use.toLowerCase();
				if(use.indexOf("hs")==0){
					if(use.charAt(2)=="l"){ fn=tHSL; }
					else { fn=tHSV; }
				}
				else if(use.indexOf("cmy")==0){
					if(use.charAt(3)=="k"){ fn=tCMYK; }
					else { fn=tCMY; }
				}
			}
			//	try to guess the best choice.
			else if("dc" in kwArgs || "dm" in kwArgs || "dy" in kwArgs){
				if("dk" in kwArgs){ fn = tCMYK; }
				else { fn = tCMY; }
			}
			else if("dh" in kwArgs || "ds" in kwArgs){
				if("dv" in kwArgs){ fn = tHSV; }
				else { fn = tHSL; }
			}

			var palette = this;
			for(var p in kwArgs){
				//	ignore use
				if(p=="use"){ continue; }
				palette = fn(palette, p, kwArgs[p]);
			}
			return palette;		//	dojox.color.Palette
		},
		clone: function(){
			// summary:
			//		Clones the current palette.
			return new dxc.Palette(this);	//	dojox.color.Palette
		}
	});

	lang.mixin(dxc.Palette, {
		generators: {
			analogous:function(/* __analogousArgs */args){
				// summary:
				//		Create a 5 color palette based on the analogous rules as implemented at
				//		http://kuler.adobe.com.
				var high=args.high||60, 	//	delta between base hue and highest hue (subtracted from base)
					low=args.low||18,		//	delta between base hue and lowest hue (added to base)
					base = lang.isString(args.base)?new dxc.Color(args.base):args.base,
					hsv=base.toHsv();

				//	generate our hue angle differences
				var h=[
					(hsv.h+low+360)%360,
					(hsv.h+Math.round(low/2)+360)%360,
					hsv.h,
					(hsv.h-Math.round(high/2)+360)%360,
					(hsv.h-high+360)%360
				];

				var s1=Math.max(10, (hsv.s<=95)?hsv.s+5:(100-(hsv.s-95))),
					s2=(hsv.s>1)?hsv.s-1:21-hsv.s,
					v1=(hsv.v>=92)?hsv.v-9:Math.max(hsv.v+9, 20),
					v2=(hsv.v<=90)?Math.max(hsv.v+5, 20):(95+Math.ceil((hsv.v-90)/2)),
					s=[ s1, s2, hsv.s, s1, s1 ],
					v=[ v1, v2, hsv.v, v1, v2 ]

				return new dxc.Palette(arr.map(h, function(hue, i){
					return dxc.fromHsv(hue, s[i], v[i]);
				}));		//	dojox.color.Palette
			},

			monochromatic: function(/* __generatorArgs */args){
				// summary:
				//		Create a 5 color palette based on the monochromatic rules as implemented at
				//		http://kuler.adobe.com.
				var base = lang.isString(args.base)?new dxc.Color(args.base):args.base,
					hsv = base.toHsv();
				
				//	figure out the saturation and value
				var s1 = (hsv.s-30>9)?hsv.s-30:hsv.s+30,
					s2 = hsv.s,
					v1 = rangeDiff(hsv.v, 20, 100),
					v2 = (hsv.v-20>20)?hsv.v-20:hsv.v+60,
					v3 = (hsv.v-50>20)?hsv.v-50:hsv.v+30;

				return new dxc.Palette([
					dxc.fromHsv(hsv.h, s1, v1),
					dxc.fromHsv(hsv.h, s2, v3),
					base,
					dxc.fromHsv(hsv.h, s1, v3),
					dxc.fromHsv(hsv.h, s2, v2)
				]);		//	dojox.color.Palette
			},

			triadic: function(/* __generatorArgs */args){
				// summary:
				//		Create a 5 color palette based on the triadic rules as implemented at
				//		http://kuler.adobe.com.
				var base = lang.isString(args.base)?new dxc.Color(args.base):args.base,
					hsv = base.toHsv();

				var h1 = (hsv.h+57+360)%360,
					h2 = (hsv.h-157+360)%360,
					s1 = (hsv.s>20)?hsv.s-10:hsv.s+10,
					s2 = (hsv.s>90)?hsv.s-10:hsv.s+10,
					s3 = (hsv.s>95)?hsv.s-5:hsv.s+5,
					v1 = (hsv.v-20>20)?hsv.v-20:hsv.v+20,
					v2 = (hsv.v-30>20)?hsv.v-30:hsv.v+30,
					v3 = (hsv.v-30>70)?hsv.v-30:hsv.v+30;

				return new dxc.Palette([
					dxc.fromHsv(h1, s1, hsv.v),
					dxc.fromHsv(hsv.h, s2, v2),
					base,
					dxc.fromHsv(h2, s2, v1),
					dxc.fromHsv(h2, s3, v3)
				]);		//	dojox.color.Palette
			},

			complementary: function(/* __generatorArgs */args){
				// summary:
				//		Create a 5 color palette based on the complementary rules as implemented at
				//		http://kuler.adobe.com.
				var base = lang.isString(args.base)?new dxc.Color(args.base):args.base,
					hsv = base.toHsv();

				var h1 = ((hsv.h*2)+137<360)?(hsv.h*2)+137:Math.floor(hsv.h/2)-137,
					s1 = Math.max(hsv.s-10, 0),
					s2 = rangeDiff(hsv.s, 10, 100),
					s3 = Math.min(100, hsv.s+20),
					v1 = Math.min(100, hsv.v+30),
					v2 = (hsv.v>20)?hsv.v-30:hsv.v+30;

				return new dxc.Palette([
					dxc.fromHsv(hsv.h, s1, v1),
					dxc.fromHsv(hsv.h, s2, v2),
					base,
					dxc.fromHsv(h1, s3, v2),
					dxc.fromHsv(h1, hsv.s, hsv.v)
				]);		//	dojox.color.Palette
			},

			splitComplementary: function(/* __splitComplementaryArgs */args){
				// summary:
				//		Create a 5 color palette based on the split complementary rules as implemented at
				//		http://kuler.adobe.com.
				var base = lang.isString(args.base)?new dxc.Color(args.base):args.base,
					dangle = args.da || 30,
					hsv = base.toHsv();

				var baseh = ((hsv.h*2)+137<360)?(hsv.h*2)+137:Math.floor(hsv.h/2)-137,
					h1 = (baseh-dangle+360)%360,
					h2 = (baseh+dangle)%360,
					s1 = Math.max(hsv.s-10, 0),
					s2 = rangeDiff(hsv.s, 10, 100),
					s3 = Math.min(100, hsv.s+20),
					v1 = Math.min(100, hsv.v+30),
					v2 = (hsv.v>20)?hsv.v-30:hsv.v+30;

				return new dxc.Palette([
					dxc.fromHsv(h1, s1, v1),
					dxc.fromHsv(h1, s2, v2),
					base,
					dxc.fromHsv(h2, s3, v2),
					dxc.fromHsv(h2, hsv.s, hsv.v)
				]);		//	dojox.color.Palette
			},

			compound: function(/* __generatorArgs */args){
				// summary:
				//		Create a 5 color palette based on the compound rules as implemented at
				//		http://kuler.adobe.com.
				var base = lang.isString(args.base)?new dxc.Color(args.base):args.base,
					hsv = base.toHsv();

				var h1 = ((hsv.h*2)+18<360)?(hsv.h*2)+18:Math.floor(hsv.h/2)-18,
					h2 = ((hsv.h*2)+120<360)?(hsv.h*2)+120:Math.floor(hsv.h/2)-120,
					h3 = ((hsv.h*2)+99<360)?(hsv.h*2)+99:Math.floor(hsv.h/2)-99,
					s1 = (hsv.s-40>10)?hsv.s-40:hsv.s+40,
					s2 = (hsv.s-10>80)?hsv.s-10:hsv.s+10,
					s3 = (hsv.s-25>10)?hsv.s-25:hsv.s+25,
					v1 = (hsv.v-40>10)?hsv.v-40:hsv.v+40,
					v2 = (hsv.v-20>80)?hsv.v-20:hsv.v+20,
					v3 = Math.max(hsv.v, 20);

				return new dxc.Palette([
					dxc.fromHsv(h1, s1, v1),
					dxc.fromHsv(h1, s2, v2),
					base,
					dxc.fromHsv(h2, s3, v3),
					dxc.fromHsv(h3, s2, v2)
				]);		//	dojox.color.Palette
			},

			shades: function(/* __generatorArgs */args){
				// summary:
				//		Create a 5 color palette based on the shades rules as implemented at
				//		http://kuler.adobe.com.
				var base = lang.isString(args.base)?new dxc.Color(args.base):args.base,
					hsv = base.toHsv();

				var s  = (hsv.s==100 && hsv.v==0)?0:hsv.s,
					v1 = (hsv.v-50>20)?hsv.v-50:hsv.v+30,
					v2 = (hsv.v-25>=20)?hsv.v-25:hsv.v+55,
					v3 = (hsv.v-75>=20)?hsv.v-75:hsv.v+5,
					v4 = Math.max(hsv.v-10, 20);

				return new dxc.Palette([
					new dxc.fromHsv(hsv.h, s, v1),
					new dxc.fromHsv(hsv.h, s, v2),
					base,
					new dxc.fromHsv(hsv.h, s, v3),
					new dxc.fromHsv(hsv.h, s, v4)
				]);		//	dojox.color.Palette
			}
		},
		generate: function(/* String|dojox.color.Color */base, /* Function|String */type){
			// summary:
			//		Generate a new Palette using any of the named functions in
			//		dojox.color.Palette.generators or an optional function definition.  Current
			//		generators include "analogous", "monochromatic", "triadic", "complementary",
			//		"splitComplementary", and "shades".
			if(lang.isFunction(type)){
				return type({ base: base });	//	dojox.color.Palette
			}
			else if(dxc.Palette.generators[type]){
				return dxc.Palette.generators[type]({ base: base });	//	dojox.color.Palette
			}
			throw new Error("dojox.color.Palette.generate: the specified generator ('" + type + "') does not exist.");
		}
	});
	
	return dxc.Palette;
});

},
'dojo/cldr/nls/currency':function(){
define({ root:

//begin v1.x content
{
	"USD_symbol": "US$",
	"CAD_symbol": "CA$",
	"GBP_symbol": "£",
	"HKD_symbol": "HK$",
	"JPY_symbol": "JP¥",
	"AUD_symbol": "A$",
	"CNY_symbol": "CN¥",
	"EUR_symbol": "€"
}
//end v1.x content
,
	"ar": true,
	"ca": true,
	"cs": true,
	"da": true,
	"de": true,
	"el": true,
	"en": true,
	"en-au": true,
	"en-ca": true,
	"en-gb": true,
	"es": true,
	"fi": true,
	"fr": true,
	"fr-ch": true,
	"he": true,
	"hu": true,
	"it": true,
	"ja": true,
	"ko": true,
	"nb": true,
	"nl": true,
	"pl": true,
	"pt": true,
	"pt-pt": true,
	"ro": true,
	"ru": true,
	"sk": true,
	"sl": true,
	"sv": true,
	"th": true,
	"tr": true,
	"zh": true,
	"zh-hant": true,
	"zh-hk": true,
	"zh-tw": true
});
},
'dojo/cldr/nls/en/currency':function(){
define(
//begin v1.x content
{
	"HKD_displayName": "Hong Kong Dollar",
	"CHF_displayName": "Swiss Franc",
	"JPY_symbol": "¥",
	"CAD_displayName": "Canadian Dollar",
	"CNY_displayName": "Chinese Yuan",
	"USD_symbol": "$",
	"AUD_displayName": "Australian Dollar",
	"JPY_displayName": "Japanese Yen",
	"USD_displayName": "US Dollar",
	"GBP_displayName": "British Pound Sterling",
	"EUR_displayName": "Euro"
}
//end v1.x content
);
},
'dojo/cldr/nls/ru/currency':function(){
define(
//begin v1.x content
{
	"HKD_displayName": "Гонконгский доллар",
	"CHF_displayName": "Швейцарский франк",
	"JPY_symbol": "¥",
	"CAD_displayName": "Канадский доллар",
	"HKD_symbol": "HK$",
	"CNY_displayName": "Юань Ренминби",
	"USD_symbol": "$",
	"AUD_displayName": "Австралийский доллар",
	"JPY_displayName": "Японская иена",
	"CAD_symbol": "CA$",
	"USD_displayName": "Доллар США",
	"EUR_symbol": "€",
	"CNY_symbol": "CN¥",
	"GBP_displayName": "Английский фунт стерлингов",
	"GBP_symbol": "£",
	"AUD_symbol": "A$",
	"EUR_displayName": "Евро"
}
//end v1.x content
);
},
'dojox/charting/axis2d/common':function(){
define(["dojo/_base/lang", "dojo/_base/window", "dojo/dom-geometry", "dojox/gfx", "dojo/has"],
	function(lang, win, domGeom, g, has){

	var common = lang.getObject("dojox.charting.axis2d.common", true);
	
	var clearNode = function(s){
		s.marginLeft   = "0px";
		s.marginTop    = "0px";
		s.marginRight  = "0px";
		s.marginBottom = "0px";
		s.paddingLeft   = "0px";
		s.paddingTop    = "0px";
		s.paddingRight  = "0px";
		s.paddingBottom = "0px";
		s.borderLeftWidth   = "0px";
		s.borderTopWidth    = "0px";
		s.borderRightWidth  = "0px";
		s.borderBottomWidth = "0px";
	};

	var getBoxWidth = function(n){
		// marginBox is incredibly slow, so avoid it if we can
		if(n["getBoundingClientRect"]){
			var bcr = n.getBoundingClientRect();
			return bcr.width || (bcr.right - bcr.left);
		}else{
			return domGeom.getMarginBox(n).w;
		}
	};

	return lang.mixin(common, {
		// summary:
		//		Common methods to be used by any axis.  This is considered "static".
		createText: {
			gfx: function(chart, creator, x, y, align, text, font, fontColor){
				// summary:
				//		Use dojox.gfx to create any text.
				// chart: dojox.charting.Chart
				//		The chart to create the text into.
				// creator: dojox.gfx.Surface
				//		The graphics surface to use for creating the text.
				// x: Number
				//		Where to create the text along the x axis (CSS left).
				// y: Number
				//		Where to create the text along the y axis (CSS top).
				// align: String
				//		How to align the text.  Can be "left", "right", "center".
				// text: String
				//		The text to render.
				// font: String
				//		The font definition, a la CSS "font".
				// fontColor: String|dojo.Color
				//		The color of the resultant text.
				// returns: dojox.gfx.Text
				//		The resultant GFX object.
				return creator.createText({
					x: x, y: y, text: text, align: align
				}).setFont(font).setFill(fontColor);	//	dojox.gfx.Text
			},
			html: function(chart, creator, x, y, align, text, font, fontColor, labelWidth){
				// summary:
				//		Use the HTML DOM to create any text.
				// chart: dojox.charting.Chart
				//		The chart to create the text into.
				// creator: dojox.gfx.Surface
				//		The graphics surface to use for creating the text.
				// x: Number
				//		Where to create the text along the x axis (CSS left).
				// y: Number
				//		Where to create the text along the y axis (CSS top).
				// align: String
				//		How to align the text.  Can be "left", "right", "center".
				// text: String
				//		The text to render.
				// font: String
				//		The font definition, a la CSS "font".
				// fontColor: String|dojo.Color
				//		The color of the resultant text.
				// labelWidth: Number?
				//		The maximum width of the resultant DOM node.
				// returns: DOMNode
				//		The resultant DOMNode (a "div" element).

				// setup the text node
				var p = win.doc.createElement("div"), s = p.style, boxWidth;
				// bidi support, if this function exists the module was loaded 
				if(chart.getTextDir){
					p.dir = chart.getTextDir(text);
				}
				clearNode(s);
				s.font = font;
				p.innerHTML = String(text).replace(/\s/g, "&nbsp;");
				s.color = fontColor;
				// measure the size
				s.position = "absolute";
				s.left = "-10000px";
				win.body().appendChild(p);
				var size = g.normalizedLength(g.splitFontString(font).size);

				// do we need to calculate the label width?
				if(!labelWidth){
					boxWidth = getBoxWidth(p);
				}
				// when the textDir is rtl, but the UI ltr needs
				// to recalculate the starting point
				if(p.dir == "rtl"){
					x += labelWidth ? labelWidth : boxWidth;
				}

				// new settings for the text node
				win.body().removeChild(p);

				s.position = "relative";
				if(labelWidth){
					s.width = labelWidth + "px";
					// s.border = "1px dotted grey";
					switch(align){
						case "middle":
							s.textAlign = "center";
							s.left = (x - labelWidth / 2) + "px";
							break;
						case "end":
							s.textAlign = "right";
							s.left = (x - labelWidth) + "px";
							break;
						default:
							s.left = x + "px";
							s.textAlign = "left";
							break;
					}
				}else{
					switch(align){
						case "middle":
							s.left = Math.floor(x - boxWidth / 2) + "px";
							// s.left = Math.floor(x - p.offsetWidth / 2) + "px";
							break;
						case "end":
							s.left = Math.floor(x - boxWidth) + "px";
							// s.left = Math.floor(x - p.offsetWidth) + "px";
							break;
						//case "start":
						default:
							s.left = Math.floor(x) + "px";
							break;
					}
				}
				s.top = Math.floor(y - size) + "px";
				s.whiteSpace = "nowrap";	// hack for WebKit
				// setup the wrapper node
				var wrap = win.doc.createElement("div"), w = wrap.style;
				clearNode(w);
				w.width = "0px";
				w.height = "0px";
				// insert nodes
				wrap.appendChild(p);
				chart.node.insertBefore(wrap, chart.node.firstChild);
				if(has("dojo-bidi")){
					chart.htmlElementsRegistry.push([wrap, x, y, align, text, font, fontColor]);
				}
				return wrap;	//	DOMNode
			}
		}
	});
});

},
'dojox/gesture/Base':function(){
define([
	"dojo/_base/kernel",
	"dojo/_base/declare",
	"dojo/_base/array",
	"dojo/_base/lang",
	"dojo/dom",
	"dojo/on",
	"dojo/touch",
	"dojo/has",
	"../main"
], function(kernel, declare, array, lang, dom, on, touch, has, dojox){
	// module:
	//		dojox/gesture/Base
	// summary:
	//		This module provides an abstract parental class for various gesture implementations.
	
/*=====
	dojox.gesture.Base = {
		// summary:
		//		An abstract parental class for various gesture implementations.
		//
		//		It's mainly responsible for:
		//
		//		1. Binding on() listening handlers for supported gesture events.
		//
		//		2. Monitoring underneath events and process different phases - 'press'|'move'|'release'|'cancel'.
		//
		//		3. Firing and bubbling gesture events with on() API.
		//
		//		A gesture implementation only needs to extend this class and overwrite appropriate phase handlers:
		//
		//		- press()|move()|release()|cancel for recognizing and firing gestures
		//
		// example:
		//		1. A typical gesture implementation.
		//
		//		Suppose we have dojox/gesture/a which provides 3 gesture events:"a", "a.x", "a.y" to be used as:
		//		|	dojo.connect(node, dojox.gesture.a, function(e){});
		//		|	dojo.connect(node, dojox.gesture.a.x, function(e){});
		//		|	dojo.connect(node, dojox.gesture.a.y, function(e){});
		//
		//		The definition of the gesture "a" may look like:
		//		|	define([..., "./Base"], function(..., Base){
		//		|		var clz = declare(Base, {
		//		|			defaultEvent: "a",
		//		|
		//		|			subEvents: ["x", "y"],
		//		|			
		//		|			press: function(data, e){
		//		|				this.fire(node, {type: "a.x", ...});
		//		|			},
		//		|			move: function(data, e){
		//		|				this.fire(node, {type: "a.y", ...});
		//		|			},
		//		|			release: function(data, e){
		//		|				this.fire(node, {type: "a", ...});
		//		|			},
		//		|			cancel: function(data, e){
		//		|				// clean up
		//		|			}
		//		|		});
		//		|
		//		|		// in order to have a default instance for handy use
		//		|		dojox.gesture.a = new clz();
		//		|
		//		|		// so that we can create new instances like
		//		|		// var mine = new dojox.gesture.a.A({...})
		//		|		dojox.gesture.a.A = clz;
		//		|
		//		|		return dojox.gesture.a;
		//		|	});
		//
		//		2. A gesture can be used in the following ways(taking dojox.gesture.tap for example):
		//
		//		A. Used with dojo.connect()
		//		|	dojo.connect(node, dojox.gesture.tap, function(e){});
		//		|	dojo.connect(node, dojox.gesture.tap.hold, function(e){});
		//		|	dojo.connect(node, dojox.gesture.tap.doubletap, function(e){});		
		//
		//		B. Used with dojo.on
		//		|	define(["dojo/on", "dojox/gesture/tap"], function(on, tap){
		//		|		on(node, tap, function(e){});
		//		|		on(node, tap.hold, function(e){});
		//		|		on(node, tap.doubletap, function(e){});
		//
		//		C. Used with dojox.gesture.tap directly
		//		|	dojox.gesture.tap(node, function(e){});
		//		|	dojox.gesture.tap.hold(node, function(e){});
		//		|	dojox.gesture.tap.doubletap(node, function(e){});
		//
		//		Though there is always a default gesture instance after being required, e.g 
		//		|	require(["dojox/gesture/tap"], function(){...});
		//
		//		It's possible to create a new one with different parameter setting:
		//		|	var myTap = new dojox.gesture.tap.Tap({holdThreshold: 300});
		//		|	dojo.connect(node, myTap, function(e){});
		//		|	dojo.connect(node, myTap.hold, function(e){});
		//		|	dojo.connect(node, myTap.doubletap, function(e){});
		//		
		//		Please refer to dojox/gesture/ for more gesture usages
	};
=====*/
	kernel.experimental("dojox.gesture.Base");
	
	lang.getObject("gesture", true, dojox);

	// Declare an internal anonymous class which will only be exported by module return value
	return declare(/*===== "dojox.gesture.Base", =====*/null, {

		// defaultEvent: [readonly] String
		//		Default event e.g. 'tap' is a default event of dojox.gesture.tap
		defaultEvent: " ",

		// subEvents: [readonly] Array
		//		A list of sub events e.g ['hold', 'doubletap'],
		//		used by being combined with defaultEvent like 'tap.hold', 'tap.doubletap' etc.
		subEvents: [],

		// touchOnly: boolean
		//		Whether the gesture is touch-device only
		touchOnly : false,

		// _elements: Array
		//		List of elements that wraps target node and gesture data
		_elements: null,

		/*=====
		// _lock: Dom
		//		The dom node whose descendants are all locked for processing
		_lock: null,
		
		// _events: [readonly] Array
		//		The complete list of supported gesture events with full name space
		//		e.g ['tap', 'tap.hold', 'tap.doubletap']
		_events: null,
		=====*/

		constructor: function(args){
			lang.mixin(this, args);
			this.init();
		},
		init: function(){
			// summary:
			//		Initialization works
			this._elements = [];

			if(!has("touch") && this.touchOnly){
				console.warn("Gestures:[", this.defaultEvent, "] is only supported on touch devices!");
				return;
			}

			// bind on() handlers for various events
			var evt = this.defaultEvent;
			this.call = this._handle(evt);

			this._events = [evt];
			array.forEach(this.subEvents, function(subEvt){
				this[subEvt] = this._handle(evt + '.' + subEvt);
				this._events.push(evt + '.' + subEvt);
			}, this);
		},
		_handle: function(/*String*/eventType){
			// summary:
			//		Bind listen handler for the given gesture event(e.g. 'tap', 'tap.hold' etc.)
			//		the returned handle will be used internally by dojo/on
			var self = this;
			//called by dojo/on
			return function(node, listener){
				// normalize, arguments might be (null, node, listener)
				var a = arguments;
				if(a.length > 2){
					node = a[1];
					listener = a[2];
				}
				var isNode = node && (node.nodeType || node.attachEvent || node.addEventListener);
				if(!isNode){
					return on(node, eventType, listener);
				}else{
					var onHandle = self._add(node, eventType, listener);
					// FIXME - users are supposed to explicitly call either
					// disconnect(signal) or signal.remove() to release resources
					var signal = {
						remove: function(){
							onHandle.remove();
							self._remove(node, eventType);
						}
					};
					return signal;
				}
			}; // dojo/on handle
		},
		_add: function(/*Dom*/node, /*String*/type, /*function*/listener){
			// summary:
			//		Bind dojo/on handlers for both gesture event(e.g 'tab.hold')
			//		and underneath 'press'|'move'|'release' events
			var element = this._getGestureElement(node);
			if(!element){
				// the first time listening to the node
				element = {
					target: node,
					data: {},
					handles: {}
				};

				var _press = lang.hitch(this, "_process", element, "press");
				var _move = lang.hitch(this, "_process", element, "move");
				var _release = lang.hitch(this, "_process", element, "release");
				var _cancel = lang.hitch(this, "_process", element, "cancel");

				var handles = element.handles;
				if(this.touchOnly){
					handles.press = on(node, 'touchstart', _press);
					handles.move = on(node, 'touchmove', _move);
					handles.release = on(node, 'touchend', _release);
					handles.cancel = on(node, 'touchcancel', _cancel);
				}else{
					handles.press = touch.press(node, _press);
					handles.move = touch.move(node, _move);
					handles.release = touch.release(node, _release);
					handles.cancel = touch.cancel(node, _cancel);
				}
				this._elements.push(element);
			}
			// track num of listeners for the gesture event - type
			// so that we can release element if no more gestures being monitored
			element.handles[type] = !element.handles[type] ? 1 : ++element.handles[type];

			return on(node, type, listener); //handle
		},
		_getGestureElement: function(/*Dom*/node){
			// summary:
			//		Obtain a gesture element for the give node
			var i = 0, element;
			for(; i < this._elements.length; i++){
				element = this._elements[i];
				if(element.target === node){
					return element;
				}
			}
		},
		_process: function(element, phase, e){
			// summary:
			//		Process and dispatch to appropriate phase handlers.
			//		Also provides the machinery for managing gesture bubbling.
			// description:
			//		1. e._locking is used to make sure only the most inner node
			//		will be processed for the same gesture, suppose we have:
			//	|	on(inner, dojox.gesture.tap, func1);
			//	|	on(outer, dojox.gesture.tap, func2);
			//		only the inner node will be processed by tap gesture, once matched,
			//		the 'tap' event will be bubbled up from inner to outer, dojo.StopEvent(e)
			//		can be used at any level to stop the 'tap' event.
			//
			//		2. Once a node starts being processed, all it's descendant nodes will be locked.
			//		The same gesture won't be processed on its descendant nodes until the lock is released.
			// element: Object
			//		Gesture element
			// phase: String
			//		Phase of a gesture to be processed, might be 'press'|'move'|'release'|'cancel'
			// e: Event
			//		Native event
			e._locking = e._locking || {};
			if(e._locking[this.defaultEvent] || this.isLocked(e.currentTarget)){
				return;
			}
			// invoking gesture.press()|move()|release()|cancel()
			// #16900: same condition as in dojo/touch, to avoid breaking the editing of input fields.
			if((e.target.tagName != "INPUT" || e.target.type == "radio" || e.target.type == "checkbox")
				&& e.target.tagName != "TEXTAREA"){
				e.preventDefault(); 
			}
			e._locking[this.defaultEvent] = true;
			this[phase](element.data, e);
		},
		press: function(data, e){
			// summary:
			//		Process the 'press' phase of a gesture
		},
		move: function(data, e){
			// summary:
			//		Process the 'move' phase of a gesture
		},
		release: function(data, e){
			// summary:
			//		Process the 'release' phase of a gesture
		},
		cancel: function(data, e){
			// summary:
			//		Process the 'cancel' phase of a gesture
		},
		fire: function(node, event){
			// summary:
			//		Fire a gesture event and invoke registered listeners
			//		a simulated GestureEvent will also be sent along
			// node: DomNode
			//		Target node to fire the gesture
			// event: Object
			//		An object containing specific gesture info e.g {type: 'tap.hold'|'swipe.left'), ...}
			//		all these properties will be put into a simulated GestureEvent when fired.
			//		Note - Default properties in a native Event won't be overwritten, see on.emit() for more details.
			if(!node || !event){
				return;
			}
			event.bubbles = true;
			event.cancelable = true;
			on.emit(node, event.type, event);
		},
		_remove: function(/*Dom*/node, /*String*/type){
			// summary:
			//		Check and remove underneath handlers if node
			//		is not being listened for 'this' gesture anymore,
			//		this happens when user removed all previous on() handlers.
			var element = this._getGestureElement(node);
			if(!element || !element.handles){ return; }
			
			element.handles[type]--;

			var handles = element.handles;
			if(!array.some(this._events, function(evt){
				return handles[evt] > 0;
			})){
				// clean up if node is not being listened anymore
				this._cleanHandles(handles);
				var i = array.indexOf(this._elements, element);
				if(i >= 0){
					this._elements.splice(i, 1);
				}
			}
		},
		_cleanHandles: function(/*Object*/handles){
			// summary:
			//		Clean up on handles
			for(var x in handles){
				//remove handles for "press"|"move"|"release"|"cancel"
				if(handles[x].remove){
					handles[x].remove();
				}
				delete handles[x];
			}
		},
		lock: function(/*Dom*/node){
			// summary:
			//		Lock all descendants of the node.
			// tags:
			//		protected
			this._lock = node;
		},
		unLock: function(){
			// summary:
			//		Release the lock
			// tags:
			//		protected
			this._lock = null;
		},
		isLocked: function(node){
			// summary:
			//		Check if the node is locked, isLocked(node) means
			//		whether it's a descendant of the currently locked node.
			// tags:
			//		protected
			if(!this._lock || !node){
				return false;
			}
			return this._lock !== node && dom.isDescendant(node, this._lock);
		},
		destroy: function(){
			// summary:
			//		Release all handlers and resources
			array.forEach(this._elements, function(element){
				this._cleanHandles(element.handles);
			}, this);
			this._elements = null;
		}
	});
});
},
'dojox/gfx/arc':function(){
define(["./_base", "dojo/_base/lang", "./matrix"], 
  function(g, lang, m){
	var twoPI = 2 * Math.PI, pi4 = Math.PI / 4, pi8 = Math.PI / 8,
		pi48 = pi4 + pi8, curvePI4 = unitArcAsBezier(pi8);

	function unitArcAsBezier(alpha){
		// summary:
		//		return a start point, 1st and 2nd control points, and an end point of
		//		a an arc, which is reflected on the x axis
		// alpha: Number
		//		angle in radians, the arc will be 2 * angle size
		var cosa  = Math.cos(alpha), sina  = Math.sin(alpha),
			p2 = {x: cosa + (4 / 3) * (1 - cosa), y: sina - (4 / 3) * cosa * (1 - cosa) / sina};
		return {	// Object
			s:  {x: cosa, y: -sina},
			c1: {x: p2.x, y: -p2.y},
			c2: p2,
			e:  {x: cosa, y: sina}
		};
	}

	var arc = g.arc = {
		// summary:
		//		This module contains the core graphics Arc functions.
		
		unitArcAsBezier: unitArcAsBezier,
		/*===== 
		unitArcAsBezier: function(alpha) {
			// summary:
			//		return a start point, 1st and 2nd control points, and an end point of
			//		a an arc, which is reflected on the x axis
			// alpha: Number
			//		angle in radians, the arc will be 2 * angle size
		},
		=====*/

		// curvePI4: Object
		//		an object with properties of an arc around a unit circle from 0 to pi/4
		curvePI4: curvePI4,

		arcAsBezier: function(last, rx, ry, xRotg, large, sweep, x, y){
			// summary:
			//		calculates an arc as a series of Bezier curves
			//		given the last point and a standard set of SVG arc parameters,
			//		it returns an array of arrays of parameters to form a series of
			//		absolute Bezier curves.
			// last: Object
			//		a point-like object as a start of the arc
			// rx: Number
			//		a horizontal radius for the virtual ellipse
			// ry: Number
			//		a vertical radius for the virtual ellipse
			// xRotg: Number
			//		a rotation of an x axis of the virtual ellipse in degrees
			// large: Boolean
			//		which part of the ellipse will be used (the larger arc if true)
			// sweep: Boolean
			//		direction of the arc (CW if true)
			// x: Number
			//		the x coordinate of the end point of the arc
			// y: Number
			//		the y coordinate of the end point of the arc

			// calculate parameters
			large = Boolean(large);
			sweep = Boolean(sweep);
			var xRot = m._degToRad(xRotg),
				rx2 = rx * rx, ry2 = ry * ry,
				pa = m.multiplyPoint(
					m.rotate(-xRot),
					{x: (last.x - x) / 2, y: (last.y - y) / 2}
				),
				pax2 = pa.x * pa.x, pay2 = pa.y * pa.y,
				c1 = Math.sqrt((rx2 * ry2 - rx2 * pay2 - ry2 * pax2) / (rx2 * pay2 + ry2 * pax2));
			if(isNaN(c1)){ c1 = 0; }
			var	ca = {
					x:  c1 * rx * pa.y / ry,
					y: -c1 * ry * pa.x / rx
				};
			if(large == sweep){
				ca = {x: -ca.x, y: -ca.y};
			}
			// the center
			var c = m.multiplyPoint(
				[
					m.translate(
						(last.x + x) / 2,
						(last.y + y) / 2
					),
					m.rotate(xRot)
				],
				ca
			);
			// calculate the elliptic transformation
			var elliptic_transform = m.normalize([
				m.translate(c.x, c.y),
				m.rotate(xRot),
				m.scale(rx, ry)
			]);
			// start, end, and size of our arc
			var inversed = m.invert(elliptic_transform),
				sp = m.multiplyPoint(inversed, last),
				ep = m.multiplyPoint(inversed, x, y),
				startAngle = Math.atan2(sp.y, sp.x),
				endAngle   = Math.atan2(ep.y, ep.x),
				theta = startAngle - endAngle;	// size of our arc in radians
			if(sweep){ theta = -theta; }
			if(theta < 0){
				theta += twoPI;
			}else if(theta > twoPI){
				theta -= twoPI;
			}

			// draw curve chunks
			var alpha = pi8, curve = curvePI4, step  = sweep ? alpha : -alpha,
				result = [];
			for(var angle = theta; angle > 0; angle -= pi4){
				if(angle < pi48){
					alpha = angle / 2;
					curve = unitArcAsBezier(alpha);
					step  = sweep ? alpha : -alpha;
					angle = 0;	// stop the loop
				}
				var c2, e, M = m.normalize([elliptic_transform, m.rotate(startAngle + step)]);
				if(sweep){
					c1 = m.multiplyPoint(M, curve.c1);
					c2 = m.multiplyPoint(M, curve.c2);
					e  = m.multiplyPoint(M, curve.e );
				}else{
					c1 = m.multiplyPoint(M, curve.c2);
					c2 = m.multiplyPoint(M, curve.c1);
					e  = m.multiplyPoint(M, curve.s );
				}
				// draw the curve
				result.push([c1.x, c1.y, c2.x, c2.y, e.x, e.y]);
				startAngle += 2 * step;
			}
			return result;	// Array
		}
	};
	
	return arc;
});

},
'dojox/charting/plot2d/_PlotEvents':function(){
define(["dojo/_base/lang", "dojo/_base/array", "dojo/_base/declare", "dojo/_base/connect"], 
	function(lang, arr, declare, hub){

	return declare("dojox.charting.plot2d._PlotEvents", null, {
		constructor: function(){
			this._shapeEvents = [];
			this._eventSeries = {};
		},
		destroy: function(){
			// summary:
			//		Destroy any internal elements and event handlers.
			this.resetEvents();
			this.inherited(arguments);
		},
		plotEvent: function(o){
			// summary:
			//		Stub function for use by specific plots.
			// o: Object
			//		An object intended to represent event parameters.
		},
		raiseEvent: function(o){
			// summary:
			//		Raises events in predefined order
			// o: Object
			//		An object intended to represent event parameters.
			this.plotEvent(o);
			var t = lang.delegate(o);
			t.originalEvent = o.type;
			t.originalPlot  = o.plot;
			t.type = "onindirect";
			arr.forEach(this.chart.stack, function(plot){
				if(plot !== this && plot.plotEvent){
					t.plot = plot;
					plot.plotEvent(t);
				}
			}, this);
		},
		connect: function(object, method){
			// summary:
			//		Helper function to connect any object's method to our plotEvent.
			// object: Object
			//		The object to connect to.
			// method: String|Function
			//		The method to fire when our plotEvent is fired.
			// returns: Array
			//		The handle as returned from dojo.connect (see dojo.connect).
			this.dirty = true;
			return hub.connect(this, "plotEvent", object, method);	//	Array
		},
		events: function(){
			// summary:
			//		Find out if any event handlers have been connected to our plotEvent.
			// returns: Boolean
			//		A flag indicating that there are handlers attached.
			return !!this.plotEvent.after;
		},
		resetEvents: function(){
			// summary:
			//		Reset all events attached to our plotEvent (i.e. disconnect).
			if(this._shapeEvents.length){
				arr.forEach(this._shapeEvents, function(item){
					item.shape.disconnect(item.handle);
				});
				this._shapeEvents = [];
			}
			this.raiseEvent({type: "onplotreset", plot: this});
		},
		_connectSingleEvent: function(o, eventName){
			this._shapeEvents.push({
				shape:  o.eventMask,
				handle: o.eventMask.connect(eventName, this, function(e){
					o.type  = eventName;
					o.event = e;
					this.raiseEvent(o);
					o.event = null;
				})
			});
		},
		_connectEvents: function(o){
			if(o){
				o.chart = this.chart;
				o.plot  = this;
				o.hAxis = this.hAxis || null;
				o.vAxis = this.vAxis || null;
				o.eventMask = o.eventMask || o.shape;
				this._connectSingleEvent(o, "onmouseover");
				this._connectSingleEvent(o, "onmouseout");
				this._connectSingleEvent(o, "onclick");
			}
		},
		_reconnectEvents: function(seriesName){
			var a = this._eventSeries[seriesName];
			if(a){
				arr.forEach(a, this._connectEvents, this);
			}
		},
		fireEvent: function(seriesName, eventName, index, eventObject){
			// summary:
			//		Emulates firing an event for a given data value (specified by
			//		an index) of a given series.
			// seriesName: String
			//		Series name.
			// eventName: String
			//		Event name to emulate.
			// index: Number
			//		Valid data value index used to raise an event.
			// eventObject: Object?
			//		Optional event object. Especially useful for synthetic events.
			//		Default: null.
			var s = this._eventSeries[seriesName];
			if(s && s.length && index < s.length){
				var o = s[index];
				o.type  = eventName;
				o.event = eventObject || null;
				this.raiseEvent(o);
				o.event = null;
			}
		}
	});
});

},
'dojox/charting/Element':function(){
define(["dojo/_base/array", "dojo/dom-construct","dojo/_base/declare", "dojox/gfx", "dojox/gfx/shape"],
	function(arr, domConstruct, declare, gfx, shape){

	return declare("dojox.charting.Element", null, {
		// summary:
		//		A base class that is used to build other elements of a chart, such as
		//		a series.
		// chart: dojox/charting/Chart
		//		The parent chart for this element.
		// group: dojox/gfx/shape.Group
		//		The visual GFX group representing this element.
		// htmlElement: Array
		//		Any DOMNodes used as a part of this element (such as HTML-based labels).
		// dirty: Boolean
		//		A flag indicating whether or not this element needs to be rendered.

		chart: null,
		group: null,
		htmlElements: null,
		dirty: true,
		renderingOptions: null,

		constructor: function(chart, kwArgs){
			// summary:
			//		Creates a new charting element.
			// chart: dojox/charting/Chart
			//		The chart that this element belongs to.
			this.chart = chart;
			this.group = null;
			this.htmlElements = [];
			this.dirty = true;
			this.trailingSymbol = "...";
			this._events = [];
			if (kwArgs && kwArgs.renderingOptions) {
				this.renderingOptions = kwArgs.renderingOptions;
			}
		},
		purgeGroup: function(){
			// summary:
			//		Clear any elements out of our group, and destroy the group.
			// returns: dojox/charting/Element
			//		A reference to this object for functional chaining.
			this.destroyHtmlElements();
			if(this.group){
				// since 1.7.x we need dispose shape otherwise there is a memoryleak
				this.getGroup().removeShape();
				var children = this.getGroup().children;
				// starting with 1.9 the registry is optional and thus dispose is
				if(shape.dispose){
					for(var i = 0; i < children.length;++i){
						shape.dispose(children[i], true);
					}
				}
				if(this.getGroup().rawNode){
					domConstruct.empty(this.getGroup().rawNode);
				}
				this.getGroup().clear();
				// starting with 1.9 the registry is optional and thus dispose is
				if(shape.dispose){
					shape.dispose(this.getGroup(), true);
				}
				if(this.getGroup() != this.group){
					// we do have an intermediary clipping group (see CartesianBase)
					if(this.group.rawNode){
						domConstruct.empty(this.group.rawNode);
					}
					this.group.clear();
					// starting with 1.9 the registry is optional and thus dispose is
					if(shape.dispose){
						shape.dispose(this.group, true);
					}
				}
				this.group = null;
			}
			this.dirty = true;
			if(this._events.length){
				arr.forEach(this._events, function(item){
					item.shape.disconnect(item.handle);
				});
				this._events = [];
			}
			return this;	//	dojox.charting.Element
		},
		cleanGroup: function(creator){
			// summary:
			//		Clean any elements (HTML or GFX-based) out of our group, and create a new one.
			// creator: dojox/gfx/shape.Surface?
			//		An optional surface to work with.
			// returns: dojox/charting/Element
			//		A reference to this object for functional chaining.
			this.destroyHtmlElements();
			if(!creator){ creator = this.chart.surface; }
			if(this.group){
				var bgnode;
				var children = this.getGroup().children;
				// starting with 1.9 the registry is optional and thus dispose is
				if(shape.dispose){
					for(var i = 0; i < children.length;++i){
						shape.dispose(children[i], true);
					}
				}
				if(this.getGroup().rawNode){
					bgnode = this.getGroup().bgNode;
					domConstruct.empty(this.getGroup().rawNode);
				}
				this.getGroup().clear();
				if(bgnode){
					this.getGroup().rawNode.appendChild(bgnode);
				}
			}else{
				this.group = creator.createGroup();
				// in some cases we have a rawNode but this is not an actual DOM element (CanvasWithEvents) so check
				// the actual rawNode type.
				if (this.renderingOptions && this.group.rawNode && 
					this.group.rawNode.namespaceURI == "http://www.w3.org/2000/svg") {
					for (var key in this.renderingOptions) {
						this.group.rawNode.setAttribute(key, this.renderingOptions[key]);
					}
				}
			}
			this.dirty = true;
			return this;	//	dojox.charting.Element
		},
		getGroup: function(){
			return this.group;
		},
		destroyHtmlElements: function(){
			// summary:
			//		Destroy any DOMNodes that may have been created as a part of this element.
			if(this.htmlElements.length){
				arr.forEach(this.htmlElements, domConstruct.destroy);
				this.htmlElements = [];
			}
		},
		destroy: function(){
			// summary:
			//		API addition to conform to the rest of the Dojo Toolkit's standard.
			this.purgeGroup();
		},
		//text utilities
		getTextWidth: function(s, font){
			return gfx._base._getTextBox(s, {font: font}).w || 0;
		},
		getTextWithLimitLength: function(s, font, limitWidth, truncated){
			// summary:
			//		Get the truncated string based on the limited width in px(dichotomy algorithm)
			// s: String?
			//		candidate text.
			// font: String?
			//		text's font style.
			// limitWidth: Number?
			//		text limited width in px.
			// truncated: Boolean?
			//		whether the input text(s) has already been truncated.
			// returns: Object
			// |	{
			// |		text: processed text, maybe truncated or not,
			// |		truncated: whether text has been truncated
			// |	}
			if(!s || s.length <= 0){
				return {
					text: "",
					truncated: truncated || false
				};
			}
			if(!limitWidth || limitWidth <= 0){
				return {
					text: s,
					truncated: truncated || false
				};
			}
			var delta = 2,
				//golden section for dichotomy algorithm
				trucPercentage = 0.618,
				minStr = s.substring(0,1) + this.trailingSymbol,
				minWidth = this.getTextWidth(minStr, font);
			if(limitWidth <= minWidth){
				return {
					text: minStr,
					truncated: true
				};
			}
			var width = this.getTextWidth(s, font);
			if(width <= limitWidth){
				return {
					text: s,
					truncated: truncated || false
				};
			}else{
				var begin = 0,
					end = s.length;
				while(begin < end){
					if(end - begin <= delta ){
						while (this.getTextWidth(s.substring(0, begin) + this.trailingSymbol, font) > limitWidth) {
							begin -= 1;
						}
						return {
							text: (s.substring(0,begin) + this.trailingSymbol),
							truncated: true
							};
					}
					var index = begin + Math.round((end - begin) * trucPercentage),
						widthIntercepted = this.getTextWidth(s.substring(0, index), font);
					if(widthIntercepted < limitWidth){
						begin = index;
						end = end;
					}else{
						begin = begin;
						end = index;
					}
				}
			}
		},
		getTextWithLimitCharCount: function(s, font, wcLimit, truncated){
			// summary:
			//		Get the truncated string based on the limited character count(dichotomy algorithm)
			// s: String?
			//		candidate text.
			// font: String?
			//		text's font style.
			// wcLimit: Number?
			//		text limited character count.
			// truncated: Boolean?
			//		whether the input text(s) has already been truncated.
			// returns: Object
			// |	{
			// |		text: processed text, maybe truncated or not,
			// |		truncated: whether text has been truncated
			// |	}
			if (!s || s.length <= 0) {
				return {
					text: "",
					truncated: truncated || false
				};
			}
			if(!wcLimit || wcLimit <= 0 || s.length <= wcLimit){
				return {
					text: s,
					truncated: truncated || false
				};
			}
			return {
				text: s.substring(0, wcLimit) + this.trailingSymbol,
				truncated: true
			};
		},
		// fill utilities
		_plotFill: function(fill, dim, offsets){
			// process a plot-wide fill
			if(!fill || !fill.type || !fill.space){
				return fill;
			}
			var space = fill.space, span;
			switch(fill.type){
				case "linear":
					if(space === "plot" || space === "shapeX" || space === "shapeY"){
						// clone a fill so we can modify properly directly
						fill = gfx.makeParameters(gfx.defaultLinearGradient, fill);
						fill.space = space;
						// process dimensions
						if(space === "plot" || space === "shapeX"){
							// process Y
							span = dim.height - offsets.t - offsets.b;
							fill.y1 = offsets.t + span * fill.y1 / 100;
							fill.y2 = offsets.t + span * fill.y2 / 100;
						}
						if(space === "plot" || space === "shapeY"){
							// process X
							span = dim.width - offsets.l - offsets.r;
							fill.x1 = offsets.l + span * fill.x1 / 100;
							fill.x2 = offsets.l + span * fill.x2 / 100;
						}
					}
					break;
				case "radial":
					if(space === "plot"){
						// this one is used exclusively for scatter charts
						// clone a fill so we can modify properly directly
						fill = gfx.makeParameters(gfx.defaultRadialGradient, fill);
						fill.space = space;
						// process both dimensions
						var spanX = dim.width  - offsets.l - offsets.r,
							spanY = dim.height - offsets.t - offsets.b;
						fill.cx = offsets.l + spanX * fill.cx / 100;
						fill.cy = offsets.t + spanY * fill.cy / 100;
						fill.r  = fill.r * Math.sqrt(spanX * spanX + spanY * spanY) / 200;
					}
					break;
				case "pattern":
					if(space === "plot" || space === "shapeX" || space === "shapeY"){
						// clone a fill so we can modify properly directly
						fill = gfx.makeParameters(gfx.defaultPattern, fill);
						fill.space = space;
						// process dimensions
						if(space === "plot" || space === "shapeX"){
							// process Y
							span = dim.height - offsets.t - offsets.b;
							fill.y = offsets.t + span * fill.y / 100;
							fill.height = span * fill.height / 100;
						}
						if(space === "plot" || space === "shapeY"){
							// process X
							span = dim.width - offsets.l - offsets.r;
							fill.x = offsets.l + span * fill.x / 100;
							fill.width = span * fill.width / 100;
						}
					}
					break;
			}
			return fill;
		},
		_shapeFill: function(fill, bbox){
			// process shape-specific fill
			if(!fill || !fill.space){
				return fill;
			}
			var space = fill.space, span;
			switch(fill.type){
				case "linear":
					if(space === "shape" || space === "shapeX" || space === "shapeY"){
						// clone a fill so we can modify properly directly
						fill = gfx.makeParameters(gfx.defaultLinearGradient, fill);
						fill.space = space;
						// process dimensions
						if(space === "shape" || space === "shapeX"){
							// process X
							span = bbox.width;
							fill.x1 = bbox.x + span * fill.x1 / 100;
							fill.x2 = bbox.x + span * fill.x2 / 100;
						}
						if(space === "shape" || space === "shapeY"){
							// process Y
							span = bbox.height;
							fill.y1 = bbox.y + span * fill.y1 / 100;
							fill.y2 = bbox.y + span * fill.y2 / 100;
						}
					}
					break;
				case "radial":
					if(space === "shape"){
						// this one is used exclusively for bubble charts and pie charts
						// clone a fill so we can modify properly directly
						fill = gfx.makeParameters(gfx.defaultRadialGradient, fill);
						fill.space = space;
						// process both dimensions
						fill.cx = bbox.x + bbox.width  / 2;
						fill.cy = bbox.y + bbox.height / 2;
						fill.r  = fill.r * bbox.width  / 200;
					}
					break;
				case "pattern":
					if(space === "shape" || space === "shapeX" || space === "shapeY"){
						// clone a fill so we can modify properly directly
						fill = gfx.makeParameters(gfx.defaultPattern, fill);
						fill.space = space;
						// process dimensions
						if(space === "shape" || space === "shapeX"){
							// process X
							span = bbox.width;
							fill.x = bbox.x + span * fill.x / 100;
							fill.width = span * fill.width / 100;
						}
						if(space === "shape" || space === "shapeY"){
							// process Y
							span = bbox.height;
							fill.y = bbox.y + span * fill.y / 100;
							fill.height = span * fill.height / 100;
						}
					}
					break;
			}
			return fill;
		},
		_pseudoRadialFill: function(fill, center, radius, start, end){
			// process pseudo-radial fills
			if(!fill || fill.type !== "radial" || fill.space !== "shape"){
				return fill;
			}
			// clone and normalize fill
			var space = fill.space;
			fill = gfx.makeParameters(gfx.defaultRadialGradient, fill);
			fill.space = space;
			if(arguments.length < 4){
				// process both dimensions
				fill.cx = center.x;
				fill.cy = center.y;
				fill.r  = fill.r * radius / 100;
				return fill;
			}
			// convert to a linear gradient
			var angle = arguments.length < 5 ? start : (end + start) / 2;
			return {
				type: "linear",
				x1: center.x,
				y1: center.y,
				x2: center.x + fill.r * radius * Math.cos(angle) / 100,
				y2: center.y + fill.r * radius * Math.sin(angle) / 100,
				colors: fill.colors
			};
		}
	});
});

},
'money/nls/details':function(){
define({
	root: {
		title	: "Edit transaction",
	    
	    amount	: 'Amount',
		account	: 'Account',
		accounts: 'Accounts',
		accountTo: 'To account',
		defaultAccount: 'Cash',
		defaultAccount2 : 'My bank account',
		
		tags	: 'Tags',
		categories: 'Categories',
		date	: 'Date',
		description:'Description',
		amountHolder: '0.00',
		accountHolder : 'default',
		ok		: 'OK',
		yes		: 'Yes',
		no		: 'No',
		sure	: 'Delete transaction?',
		pickDate: 'Date',
		done	: 'Done',
		today	: 'Today',

		newAccount1 : "New account",
		newAccount2 : "will be created. Please, choose it's currency",

		newAccountTitle : "Create account",
		process	: 'Continue',
		saveErrorD: 'An error occured while saving transaction. Application will be restarted to try to fix it. Last edited transaction won\'t be saved',
		saveErrorT: 'Database error',
		close : 'Continue'
	},
	'ru-ru': true
});

},
'money/nls/ru-ru/details':function(){
define({
	title	: "Редактирование транзакции",
	    
	amount	: 'Сумма',
	account	: 'Счет',
	accounts: 'Счета',
	accountTo: 'На счет',
	defaultAccount: 'Наличные',
	defaultAccount2: 'Счет в банке',
		
	tags	: 'Метки (категории)',
	categories: 'Категории',
	date	: 'Дата',
	description:'Описание',
	amountHolder: '0.00',
	accountHolder : 'По умолчанию',
	ok		: 'OK',
	yes		: 'Да',
	no		: 'Нет',
	sure	: 'Удалить транзакцию?',
	type	: 'Тип',
	pickDate: 'Дата',
	done	: 'Готово',
	today	: 'Сегодня',

	newAccount1 : "Будет создан новый счет",
	newAccount2 : ". Выберите его валюту, пожалуйста",

	newAccountTitle : "Создание счета",
	process	: 'Продолжить',
	saveErrorD: 'Во время сохранения транзакции произошла ошибка. Приложение будет перезапущено, чтобы устранить неполадки. Последняя транзакция не будет сохранена',
	saveErrorT: 'Ошибка базы данных',
	close : 'Продолжить'
	
});

},
'money/views/about':function(){
define(["dojo/_base/declare","dojo/dom-class", "dojo/dom-attr", 'dojo/date/locale', "dojo/sniff",
	'dijit/registry','money/TouchableButton','dojo/text!money/views/about.html'],
    function(declare, domClass, domAttr, locale, has, registry, Button){
    
	return window.AppData.objAbout = {
		
		beforeActivate: function(contact){
		    
        },
        init: function(){
			if(!has('isInitiallySmall'))
				domClass.add(this.backButton.domNode,'hideOnMedium hideOnLarge')
			var cacheStatus = 'Checking for update...'
			var self = this;
		   
		    var checkUpdates = function(){
				switch(window.CACHE_STATUS){
		            case 0: cacheStatus = self.nls.latest; break;
		            case 2: cacheStatus = self.nls.updating +' <b>' + parseInt( window.CACHED_FILES / 29 * 100 ) + '%</b>'; break;
		            case 1: cacheStatus = self.nls.ready + ' <button id="upd-btn" class="mblBlueButton" onclick="location.reload();">' + self.nls.apply + '</button>'; break;
		        }
		        domAttr.set('about-updates', 'innerHTML', cacheStatus)
		        if( registry.byId('upd-btn') )
					registry.byId('upd-btn').destroy();
				new Button({
					label: self.nls.apply,
					click: function(){
						location.reload();
					}
				},'upd-btn')
		        
			}
			
			checkUpdates()
		    var ci = setInterval(function(){
				checkUpdates();				
		    },1000)
		    
		    domAttr.set('about-updated', 'innerHTML', getDateStringHrWithYear( getDate(window.AppData.updated, locale), locale) )
		    /*
		    if(this.nls.donate == "ru") {
				domAttr.set('donate-button', 'innerHTML', '<form action="https://www.paypal.com/cgi-bin/webscr" method="get" target="_blank">'+
					'<input type="hidden" name="cmd" value="_s-xclick">'+
					'<input type="hidden" name="hosted_button_id" value="R8HRXYWRJZ632">'+
					'<input type="image" src="https://www.paypalobjects.com/ru_RU/RU/i/btn/btn_donateCC_LG.gif" border="0" name="submit" alt="PayPal — более безопасный и легкий способ оплаты через Интернет!">'+
					'<img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1">'+
				'</form>');
			}else {
				domAttr.set('donate-button', 'innerHTML', '<form action="https://www.paypal.com/cgi-bin/webscr" method="get" target="_blank">'+
					'<input type="hidden" name="cmd" value="_s-xclick">'+
					'<input type="hidden" name="hosted_button_id" value="3ZBTSMVVA9JLA">'+
					'<input type="image" src="https://www.paypalobjects.com/en_US/GB/i/btn/btn_donateCC_LG.gif" border="0" name="submit" alt="PayPal – The safer, easier way to pay online.">'+
					'<img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1">'+
				'</form>');
			}*/
        }        
    };
});

},
'dojox/gfx/matrix':function(){
define(["./_base","dojo/_base/lang"], 
  function(g, lang){
	var m = g.matrix = {};

	// candidates for dojox.math:
	var _degToRadCache = {};
	m._degToRad = function(degree){
		return _degToRadCache[degree] || (_degToRadCache[degree] = (Math.PI * degree / 180));
	};
	m._radToDeg = function(radian){ return radian / Math.PI * 180; };

	m.Matrix2D = function(arg){
		// summary:
		//		a 2D matrix object
		// description:
		//		Normalizes a 2D matrix-like object. If arrays is passed,
		//		all objects of the array are normalized and multiplied sequentially.
		// arg: Object
		//		a 2D matrix-like object, a number, or an array of such objects
		if(arg){
			if(typeof arg == "number"){
				this.xx = this.yy = arg;
			}else if(arg instanceof Array){
				if(arg.length > 0){
					var matrix = m.normalize(arg[0]);
					// combine matrices
					for(var i = 1; i < arg.length; ++i){
						var l = matrix, r = m.normalize(arg[i]);
						matrix = new m.Matrix2D();
						matrix.xx = l.xx * r.xx + l.xy * r.yx;
						matrix.xy = l.xx * r.xy + l.xy * r.yy;
						matrix.yx = l.yx * r.xx + l.yy * r.yx;
						matrix.yy = l.yx * r.xy + l.yy * r.yy;
						matrix.dx = l.xx * r.dx + l.xy * r.dy + l.dx;
						matrix.dy = l.yx * r.dx + l.yy * r.dy + l.dy;
					}
					lang.mixin(this, matrix);
				}
			}else{
				lang.mixin(this, arg);
			}
		}
	};

	// the default (identity) matrix, which is used to fill in missing values
	lang.extend(m.Matrix2D, {xx: 1, xy: 0, yx: 0, yy: 1, dx: 0, dy: 0});

	lang.mixin(m, {
		// summary:
		//		class constants, and methods of dojox/gfx/matrix

		// matrix constants

		// identity: dojox/gfx/matrix.Matrix2D
		//		an identity matrix constant: identity * (x, y) == (x, y)
		identity: new m.Matrix2D(),

		// flipX: dojox/gfx/matrix.Matrix2D
		//		a matrix, which reflects points at x = 0 line: flipX * (x, y) == (-x, y)
		flipX:    new m.Matrix2D({xx: -1}),

		// flipY: dojox/gfx/matrix.Matrix2D
		//		a matrix, which reflects points at y = 0 line: flipY * (x, y) == (x, -y)
		flipY:    new m.Matrix2D({yy: -1}),

		// flipXY: dojox/gfx/matrix.Matrix2D
		//		a matrix, which reflects points at the origin of coordinates: flipXY * (x, y) == (-x, -y)
		flipXY:   new m.Matrix2D({xx: -1, yy: -1}),

		// matrix creators

		translate: function(a, b){
			// summary:
			//		forms a translation matrix
			// description:
			//		The resulting matrix is used to translate (move) points by specified offsets.
			// a: Number|dojox/gfx.Point
			//		an x coordinate value, or a point-like object, which specifies offsets for both dimensions
			// b: Number?
			//		a y coordinate value
			// returns: dojox/gfx/matrix.Matrix2D
			if(arguments.length > 1){
				return new m.Matrix2D({dx: a, dy: b}); // dojox/gfx/matrix.Matrix2D
			}
			// branch
			return new m.Matrix2D({dx: a.x, dy: a.y}); // dojox/gfx/matrix.Matrix2D
		},
		scale: function(a, b){
			// summary:
			//		forms a scaling matrix
			// description:
			//		The resulting matrix is used to scale (magnify) points by specified offsets.
			// a: Number|dojox/gfx.Point
			//		a scaling factor used for the x coordinate, or
			//		a uniform scaling factor used for the both coordinates, or
			//		a point-like object, which specifies scale factors for both dimensions
			// b: Number?
			//		a scaling factor used for the y coordinate
			// returns: dojox/gfx/matrix.Matrix2D
			if(arguments.length > 1){
				return new m.Matrix2D({xx: a, yy: b}); // dojox/gfx/matrix.Matrix2D
			}
			if(typeof a == "number"){
				return new m.Matrix2D({xx: a, yy: a}); // dojox/gfx/matrix.Matrix2D
			}
			return new m.Matrix2D({xx: a.x, yy: a.y}); // dojox/gfx/matrix.Matrix2D
		},
		rotate: function(angle){
			// summary:
			//		forms a rotating matrix
			// description:
			//		The resulting matrix is used to rotate points
			//		around the origin of coordinates (0, 0) by specified angle.
			// angle: Number
			//		an angle of rotation in radians (>0 for CW)
			// returns: dojox/gfx/matrix.Matrix2D
			var c = Math.cos(angle);
			var s = Math.sin(angle);
			return new m.Matrix2D({xx: c, xy: -s, yx: s, yy: c}); // dojox/gfx/matrix.Matrix2D
		},
		rotateg: function(degree){
			// summary:
			//		forms a rotating matrix
			// description:
			//		The resulting matrix is used to rotate points
			//		around the origin of coordinates (0, 0) by specified degree.
			//		See dojox/gfx/matrix.rotate() for comparison.
			// degree: Number
			//		an angle of rotation in degrees (>0 for CW)
			// returns: dojox/gfx/matrix.Matrix2D
			return m.rotate(m._degToRad(degree)); // dojox/gfx/matrix.Matrix2D
		},
		skewX: function(angle) {
			// summary:
			//		forms an x skewing matrix
			// description:
			//		The resulting matrix is used to skew points in the x dimension
			//		around the origin of coordinates (0, 0) by specified angle.
			// angle: Number
			//		a skewing angle in radians
			// returns: dojox/gfx/matrix.Matrix2D
			return new m.Matrix2D({xy: Math.tan(angle)}); // dojox/gfx/matrix.Matrix2D
		},
		skewXg: function(degree){
			// summary:
			//		forms an x skewing matrix
			// description:
			//		The resulting matrix is used to skew points in the x dimension
			//		around the origin of coordinates (0, 0) by specified degree.
			//		See dojox/gfx/matrix.skewX() for comparison.
			// degree: Number
			//		a skewing angle in degrees
			// returns: dojox/gfx/matrix.Matrix2D
			return m.skewX(m._degToRad(degree)); // dojox/gfx/matrix.Matrix2D
		},
		skewY: function(angle){
			// summary:
			//		forms a y skewing matrix
			// description:
			//		The resulting matrix is used to skew points in the y dimension
			//		around the origin of coordinates (0, 0) by specified angle.
			// angle: Number
			//		a skewing angle in radians
			// returns: dojox/gfx/matrix.Matrix2D
			return new m.Matrix2D({yx: Math.tan(angle)}); // dojox/gfx/matrix.Matrix2D
		},
		skewYg: function(degree){
			// summary:
			//		forms a y skewing matrix
			// description:
			//		The resulting matrix is used to skew points in the y dimension
			//		around the origin of coordinates (0, 0) by specified degree.
			//		See dojox/gfx/matrix.skewY() for comparison.
			// degree: Number
			//		a skewing angle in degrees
			// returns: dojox/gfx/matrix.Matrix2D
			return m.skewY(m._degToRad(degree)); // dojox/gfx/matrix.Matrix2D
		},
		reflect: function(a, b){
			// summary:
			//		forms a reflection matrix
			// description:
			//		The resulting matrix is used to reflect points around a vector,
			//		which goes through the origin.
			// a: dojox/gfx.Point|Number
			//		a point-like object, which specifies a vector of reflection, or an X value
			// b: Number?
			//		a Y value
			// returns: dojox/gfx/matrix.Matrix2D
			if(arguments.length == 1){
				b = a.y;
				a = a.x;
			}
			// make a unit vector
			var a2 = a * a, b2 = b * b, n2 = a2 + b2, xy = 2 * a * b / n2;
			return new m.Matrix2D({xx: 2 * a2 / n2 - 1, xy: xy, yx: xy, yy: 2 * b2 / n2 - 1}); // dojox/gfx/matrix.Matrix2D
		},
		project: function(a, b){
			// summary:
			//		forms an orthogonal projection matrix
			// description:
			//		The resulting matrix is used to project points orthogonally on a vector,
			//		which goes through the origin.
			// a: dojox/gfx.Point|Number
			//		a point-like object, which specifies a vector of projection, or
			//		an x coordinate value
			// b: Number?
			//		a y coordinate value
			// returns: dojox/gfx/matrix.Matrix2D
			if(arguments.length == 1){
				b = a.y;
				a = a.x;
			}
			// make a unit vector
			var a2 = a * a, b2 = b * b, n2 = a2 + b2, xy = a * b / n2;
			return new m.Matrix2D({xx: a2 / n2, xy: xy, yx: xy, yy: b2 / n2}); // dojox/gfx/matrix.Matrix2D
		},

		// ensure matrix 2D conformance
		normalize: function(matrix){
			// summary:
			//		converts an object to a matrix, if necessary
			// description:
			//		Converts any 2D matrix-like object or an array of
			//		such objects to a valid dojox/gfx/matrix.Matrix2D object.
			// matrix: Object
			//		an object, which is converted to a matrix, if necessary
			// returns: dojox/gfx/matrix.Matrix2D
			return (matrix instanceof m.Matrix2D) ? matrix : new m.Matrix2D(matrix); // dojox/gfx/matrix.Matrix2D
		},

		// common operations

		isIdentity: function(matrix){
			// summary:
			//		returns whether the specified matrix is the identity.
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a 2D matrix object to be tested
			// returns: Boolean
			return matrix.xx == 1 && matrix.xy == 0 && matrix.yx == 0 && matrix.yy == 1 && matrix.dx == 0 && matrix.dy == 0; // Boolean
		},
		clone: function(matrix){
			// summary:
			//		creates a copy of a 2D matrix
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a 2D matrix-like object to be cloned
			// returns: dojox/gfx/matrix.Matrix2D
			var obj = new m.Matrix2D();
			for(var i in matrix){
				if(typeof(matrix[i]) == "number" && typeof(obj[i]) == "number" && obj[i] != matrix[i]) obj[i] = matrix[i];
			}
			return obj; // dojox/gfx/matrix.Matrix2D
		},
		invert: function(matrix){
			// summary:
			//		inverts a 2D matrix
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a 2D matrix-like object to be inverted
			// returns: dojox/gfx/matrix.Matrix2D
			var M = m.normalize(matrix),
				D = M.xx * M.yy - M.xy * M.yx;
				M = new m.Matrix2D({
					xx: M.yy/D, xy: -M.xy/D,
					yx: -M.yx/D, yy: M.xx/D,
					dx: (M.xy * M.dy - M.yy * M.dx) / D,
					dy: (M.yx * M.dx - M.xx * M.dy) / D
				});
			return M; // dojox/gfx/matrix.Matrix2D
		},
		_multiplyPoint: function(matrix, x, y){
			// summary:
			//		applies a matrix to a point
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a 2D matrix object to be applied
			// x: Number
			//		an x coordinate of a point
			// y: Number
			//		a y coordinate of a point
			// returns: dojox/gfx.Point
			return {x: matrix.xx * x + matrix.xy * y + matrix.dx, y: matrix.yx * x + matrix.yy * y + matrix.dy}; // dojox/gfx.Point
		},
		multiplyPoint: function(matrix, /* Number||Point */ a, /* Number? */ b){
			// summary:
			//		applies a matrix to a point
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a 2D matrix object to be applied
			// a: Number|dojox/gfx.Point
			//		an x coordinate of a point, or a point
			// b: Number?
			//		a y coordinate of a point
			// returns: dojox/gfx.Point
			var M = m.normalize(matrix);
			if(typeof a == "number" && typeof b == "number"){
				return m._multiplyPoint(M, a, b); // dojox/gfx.Point
			}
			return m._multiplyPoint(M, a.x, a.y); // dojox/gfx.Point
		},
		multiplyRectangle: function(matrix, /*Rectangle*/ rect){
			// summary:
			//		Applies a matrix to a rectangle.
			// description:
			//		The method applies the transformation on all corners of the
			//		rectangle and returns the smallest rectangle enclosing the 4 transformed
			//		points.
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a 2D matrix object to be applied.
			// rect: Rectangle
			//		the rectangle to transform.
			// returns: dojox/gfx.Rectangle
			var M = m.normalize(matrix);
			rect = rect || {x:0, y:0, width:0, height:0}; 
			if(m.isIdentity(M))
				return {x: rect.x, y: rect.y, width: rect.width, height: rect.height}; // dojo/gfx.Rectangle
			var p0 = m.multiplyPoint(M, rect.x, rect.y),
				p1 = m.multiplyPoint(M, rect.x, rect.y + rect.height),
				p2 = m.multiplyPoint(M, rect.x + rect.width, rect.y),
				p3 = m.multiplyPoint(M, rect.x + rect.width, rect.y + rect.height),
				minx = Math.min(p0.x, p1.x, p2.x, p3.x),
				miny = Math.min(p0.y, p1.y, p2.y, p3.y),
				maxx = Math.max(p0.x, p1.x, p2.x, p3.x),
				maxy = Math.max(p0.y, p1.y, p2.y, p3.y);
			return{ // dojo/gfx.Rectangle
				x: minx,
				y: miny,
				width: maxx - minx,
				height: maxy - miny
			};
		},
		multiply: function(matrix){
			// summary:
			//		combines matrices by multiplying them sequentially in the given order
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a 2D matrix-like object,
			//		all subsequent arguments are matrix-like objects too
			var M = m.normalize(matrix);
			// combine matrices
			for(var i = 1; i < arguments.length; ++i){
				var l = M, r = m.normalize(arguments[i]);
				M = new m.Matrix2D();
				M.xx = l.xx * r.xx + l.xy * r.yx;
				M.xy = l.xx * r.xy + l.xy * r.yy;
				M.yx = l.yx * r.xx + l.yy * r.yx;
				M.yy = l.yx * r.xy + l.yy * r.yy;
				M.dx = l.xx * r.dx + l.xy * r.dy + l.dx;
				M.dy = l.yx * r.dx + l.yy * r.dy + l.dy;
			}
			return M; // dojox/gfx/matrix.Matrix2D
		},

		// high level operations

		_sandwich: function(matrix, x, y){
			// summary:
			//		applies a matrix at a central point
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a 2D matrix-like object, which is applied at a central point
			// x: Number
			//		an x component of the central point
			// y: Number
			//		a y component of the central point
			return m.multiply(m.translate(x, y), matrix, m.translate(-x, -y)); // dojox/gfx/matrix.Matrix2D
		},
		scaleAt: function(a, b, c, d){
			// summary:
			//		scales a picture using a specified point as a center of scaling
			// description:
			//		Compare with dojox/gfx/matrix.scale().
			// a: Number
			//		a scaling factor used for the x coordinate, or a uniform scaling factor used for both coordinates
			// b: Number?
			//		a scaling factor used for the y coordinate
			// c: Number|Point
			//		an x component of a central point, or a central point
			// d: Number
			//		a y component of a central point
			// returns: dojox/gfx/matrix.Matrix2D
			switch(arguments.length){
				case 4:
					// a and b are scale factor components, c and d are components of a point
					return m._sandwich(m.scale(a, b), c, d); // dojox/gfx/matrix.Matrix2D
				case 3:
					if(typeof c == "number"){
						return m._sandwich(m.scale(a), b, c); // dojox/gfx/matrix.Matrix2D
					}
					return m._sandwich(m.scale(a, b), c.x, c.y); // dojox/gfx/matrix.Matrix2D
			}
			return m._sandwich(m.scale(a), b.x, b.y); // dojox/gfx/matrix.Matrix2D
		},
		rotateAt: function(angle, a, b){
			// summary:
			//		rotates a picture using a specified point as a center of rotation
			// description:
			//		Compare with dojox/gfx/matrix.rotate().
			// angle: Number
			//		an angle of rotation in radians (>0 for CW)
			// a: Number|dojox/gfx.Point
			//		an x component of a central point, or a central point
			// b: Number?
			//		a y component of a central point
			// returns: dojox/gfx/matrix.Matrix2D
			if(arguments.length > 2){
				return m._sandwich(m.rotate(angle), a, b); // dojox/gfx/matrix.Matrix2D
			}
			return m._sandwich(m.rotate(angle), a.x, a.y); // dojox/gfx/matrix.Matrix2D
		},
		rotategAt: function(degree, a, b){
			// summary:
			//		rotates a picture using a specified point as a center of rotation
			// description:
			//		Compare with dojox/gfx/matrix.rotateg().
			// degree: Number
			//		an angle of rotation in degrees (>0 for CW)
			// a: Number|dojox/gfx.Point
			//		an x component of a central point, or a central point
			// b: Number?
			//		a y component of a central point
			// returns: dojox/gfx/matrix.Matrix2D
			if(arguments.length > 2){
				return m._sandwich(m.rotateg(degree), a, b); // dojox/gfx/matrix.Matrix2D
			}
			return m._sandwich(m.rotateg(degree), a.x, a.y); // dojox/gfx/matrix.Matrix2D
		},
		skewXAt: function(angle, a, b){
			// summary:
			//		skews a picture along the x axis using a specified point as a center of skewing
			// description:
			//		Compare with dojox/gfx/matrix.skewX().
			// angle: Number
			//		a skewing angle in radians
			// a: Number|dojox/gfx.Point
			//		an x component of a central point, or a central point
			// b: Number?
			//		a y component of a central point
			// returns: dojox/gfx/matrix.Matrix2D
			if(arguments.length > 2){
				return m._sandwich(m.skewX(angle), a, b); // dojox/gfx/matrix.Matrix2D
			}
			return m._sandwich(m.skewX(angle), a.x, a.y); // dojox/gfx/matrix.Matrix2D
		},
		skewXgAt: function(degree, a, b){
			// summary:
			//		skews a picture along the x axis using a specified point as a center of skewing
			// description:
			//		Compare with dojox/gfx/matrix.skewXg().
			// degree: Number
			//		a skewing angle in degrees
			// a: Number|dojox/gfx.Point
			//		an x component of a central point, or a central point
			// b: Number?
			//		a y component of a central point
			// returns: dojox/gfx/matrix.Matrix2D
			if(arguments.length > 2){
				return m._sandwich(m.skewXg(degree), a, b); // dojox/gfx/matrix.Matrix2D
			}
			return m._sandwich(m.skewXg(degree), a.x, a.y); // dojox/gfx/matrix.Matrix2D
		},
		skewYAt: function(angle, a, b){
			// summary:
			//		skews a picture along the y axis using a specified point as a center of skewing
			// description:
			//		Compare with dojox/gfx/matrix.skewY().
			// angle: Number
			//		a skewing angle in radians
			// a: Number|dojox/gfx.Point
			//		an x component of a central point, or a central point
			// b: Number?
			//		a y component of a central point
			// returns: dojox/gfx/matrix.Matrix2D
			if(arguments.length > 2){
				return m._sandwich(m.skewY(angle), a, b); // dojox/gfx/matrix.Matrix2D
			}
			return m._sandwich(m.skewY(angle), a.x, a.y); // dojox/gfx/matrix.Matrix2D
		},
		skewYgAt: function(/* Number */ degree, /* Number||Point */ a, /* Number? */ b){
			// summary:
			//		skews a picture along the y axis using a specified point as a center of skewing
			// description:
			//		Compare with dojox/gfx/matrix.skewYg().
			// degree: Number
			//		a skewing angle in degrees
			// a: Number|dojox/gfx.Point
			//		an x component of a central point, or a central point
			// b: Number?
			//		a y component of a central point
			// returns: dojox/gfx/matrix.Matrix2D
			if(arguments.length > 2){
				return m._sandwich(m.skewYg(degree), a, b); // dojox/gfx/matrix.Matrix2D
			}
			return m._sandwich(m.skewYg(degree), a.x, a.y); // dojox/gfx/matrix.Matrix2D
		}

		//TODO: rect-to-rect mapping, scale-to-fit (isotropic and anisotropic versions)

	});
	// propagate Matrix2D up
	g.Matrix2D = m.Matrix2D;

	return m;
});



},
'money/views/chartsPie':function(){
define(["dojo/_base/declare",
	"dojo/Deferred",
	"dojo/dom","dojo/dom-class", "dojo/sniff","dojo/dom-style","dojo/date",
	"dojox/charting/Chart", "dojo/_base/array", "dojo/_base/window","dojo/on",
    "dojo/dom-attr","dojo/date/locale",
    // Require the theme of our choosing
    "dojox/charting/themes/Shrooms",
    
    "dojox/charting/plot2d/Pie","dojox/charting/widget/Legend", "dojox/mobile/ListItem", 
    "dojox/charting/axis2d/Default", "dojox/charting/plot2d/ClusteredColumns", "dojox/mobile/Accordion",'dojox/mobile/ContentPane',
    'dojo/text!money/views/charts-pie.html'],
    function(declare,Deferred,dom,domClass,has,domStyle,dojodate, Chart, arrayUtil, win, on,domAttr,locale, theme, PiePlot, Legend, ListItem, Default, BarChart){
    
	return {
		legendTemplate : '<span class="chart-legend-label">'+'</span><span class="chart-label"><span class="chart-label-text">${num} * ${tags}</span>&nbsp;<span class="chart-label-amount">${amount} (${percents}%)</span></span>',
		//legendTemplate : '<span class="chart-legend-label" onclick="goTo(\'list\',{byTags: \'${tagsId}\', type: \'${type}\'})"><div class="mblListItemRightIcon"><div title="" class="mblDomButtonArrow mblDomButton"><div><div><div><div></div></div></div></div></div></div>'+'</span><span class="chart-label"><span class="chart-label-text">${num} * ${tags}</span>&nbsp;<span class="chart-label-amount">${amount} (${percents}%)</span></span>',
		
		_createPieChart: function( data ) {
			var chartData = data;
			try{
					this.pieChart = new Chart(dom.byId('chartNode')) 
						.setTheme(theme)
						.addPlot("default", {
							type		: PiePlot, // our plot2d/Pie module reference as type value
							fontColor	: "#333",
							labelWiring	: "#333",
							labelStyle	: "none",
							htmlLabels	: true,
							startAngle	: -10,
							labelOffset	: 20
						})
						.addSeries("tags", chartData)
						.render();
					
					this.legend = new Legend({ chart: this.pieChart,'horizontal' : false }, "legend");
					var self = this
					on(window,'resize', function(){
						self.pieChart.resize()						
					})					
				}catch (e){
					domStyle.set('chart-pie','display','none')
					console.log('WARN: charts are not supported')
				}
		},
		/*
		 * Build new or update exsisting pie chart based on given chartData
		 */
		_buildChart: function(chartData){
			var self = this
			
			domStyle.set('no-transactions-chart', 'display', !chartData.length? 'block':'none')
			domStyle.set('pie-chart', 'display', chartData.length? 'block':'none')
			chartData.sort( function(a, b) {
				return a.y < b.y ? 1 : -1
			})
			this._displayTotal( chartData );
			
			
			if(!this.pieChart){
				this._createPieChart( chartData )
			}else {
				this.pieChart
					.updateSeries('tags',chartData)
					.render()
				this.legend.refresh();
			}
		},
		
		
		
		
		/*
		 * 	get data (of given type) for the piechart
		 */ 
		_getData:function( type ){
			var _t = window.AppData.currentType;
			var self = this
			var chartDataDeferred = new Deferred;
			// all the transation of given type
			var data = window.AppData.store.query(
				this.getQuery(false, type || "e")
			);		
			
			// transfers doesn't affect sums
			data.then( function( result ) {
				var chartData = [], chartKeys = {}, sum = 0;			
				arrayUtil.forEach(result.items, function(item){
					sum += ( item.type != "t" ) ? parseFloat( item.amountHome ) : 0;
				})
				
				arrayUtil.forEach(result.items, function(item){
					
					var tags = (item.tags && item.tags[0]) ? item.tags.join(',') : "noTags", tagsLabels = (item.tags && item.tags[0]) ? "" : self.nls.noTags;
					if(tags){
						for(var i in item.tags){						
							if(window.AppData.tagsStore.get(item.tags[i]))
								tagsLabels += (tagsLabels ? ", " : "") + window.AppData.tagsStore.get(item.tags[i]).label
						}
					};
					if(chartKeys[tags] == undefined){
						chartData.push ({ x:1, y:Math.abs( parseFloat(item.amountHome) ), text: self.substitute( self.legendTemplate, {
								num: 1,
								tags : tagsLabels,
								amount : getMoney( Math.abs(item.amountHome).toFixed(2) ),
								percents: (Math.abs(item.amountHome / (sum != 0 ? sum : 0.001))*100).toFixed(2),
								tagsId: tags != "noTags" ? item.tags : -1,
								type: item.type
							})
						});
						chartKeys[tags] = {i : chartData.length-1, l: 1}
					}else {
						chartKeys[tags].l ++;
						chartData[chartKeys[tags].i].y += Math.abs(parseFloat(item.amountHome)), chartData[chartKeys[tags].i].text = self.substitute( self.legendTemplate, {
							num: chartKeys[tags].l ,
							tags : tagsLabels,
							amount : getMoney( Math.abs( chartData[ chartKeys[tags].i ].y).toFixed(2)),
							percents: (Math.abs( chartData[ chartKeys[tags].i ].y / (sum != 0 ? sum : 0.001) ) * 100 ).toFixed(2),
							tagsId: tags != "noTags" ? item.tags : -1,
							type: item.type
						})					
					}
					
				})
				chartDataDeferred.resolve(chartData)
			})
			
			
			return chartDataDeferred
		},
		
		// does THE item should be queried or not?
		getQuery: function( allDataMode , type){
			var res = new this.queryIdb
			res.allData = allDataMode;
			res.type = type
			return res;
		},
		
		// does THE item should be queried or not?
		
		queryIdb: function(){
			var from;
			this.allData = false
			this.from = function(){
				console.log( this.allData )
				if( this.allData || 
					window.AppData.timespan == 'noneTimespan' && 
					!window.AppData.useDateImportant)
					return undefined;
				if( window.AppData.timespan == 'lastMonth') {
					console.log( window.AppData.timespanMonth )
					from = getDate( window.AppData.timespanMonth, locale )
					return from
				}
				if( window.AppData.timespan == 'customTimespan') {
					from = new Date;
					from = new Date( from.getFullYear(), from.getMonth(), 1);
					//console.log(from)
					var daysInMonth = dojodate.getDaysInMonth(from) 
					//window.AppData.dateFrom		 = dojodate.add( from, "day", -1);
					return from
					//window.AppData.dateTo 		 = dojodate.add( from, "day", daysInMonth -1 );				
				}
				return window.AppData.dateFrom ? 
					window.AppData.dateFrom : (
						window.AppData.dateFrom = 
							dojodate.add(new Date,"day", -dojodate.getDaysInMonth(new Date))
					)
			}
			this.to = function(){
				if( this.allData || 
					window.AppData.timespan == 'noneTimespan' && 
					!window.AppData.useDateImportant)
					return undefined;
				if( window.AppData.timespan == 'lastMonth') {
					console.log( window.AppData.timespanMonth )
					from = getDate( window.AppData.timespanMonth, locale )
					var daysInMonth = dojodate.getDaysInMonth(from) 
					return dojodate.add( from, "day", daysInMonth -1 );	
				}
				if( window.AppData.timespan == 'customTimespan') {
					from = new Date;
					from = new Date( from.getFullYear(), from.getMonth(), 1);
					console.log(from)
					var daysInMonth = dojodate.getDaysInMonth(from) 
					return dojodate.add( from, "day", daysInMonth -1 );				
				}	
				return window.AppData.dateTo ? 
					window.AppData.dateTo : (
						window.AppData.dateTo = new Date// dojodate.add(new Date,"day", 1)
					)
			}
			this.type = function(){ 
				return undefined //this.allData ? undefined :
					//window.AppData.currentType
			}
		},
		
		afterActivate: function(contact){
			// x and y coordinates used for easy understanding of where they should display
			// Data represents website visits over a week period
			var btns = ['exp','inc','transf'], type = 'e';
			for(var i=0; i<btns.length; i++) {
				this[ btns[i] + 'Chart' ].get('selected') && ( type = btns[i].substr( 0,1 ) );
			}
			var self = this
				
			this._getData( type ).then( function( chartData ){
				self._buildChart(chartData)
				setTimeout(function(){
					if(self.pieChart)
						self.pieChart.resize()				
				},1)
			})
			
        },
        
        init: function(){
			window.AppData.chartsPieView = this;
			window.AppData.chartsPieView.allData = false;
			if(!this._isInheritedFromBaseView)
				new window.AppData.BaseViewClass( this, 1 /* Do not overwrite existing objects*/ );			
			
			var self = this
			//if(!has('isInitiallySmall'))
			//	domClass.add(this.backButton.domNode,'hideOnMedium hideOnLarge')
			
			//rebuild pie chart on transaction type change 
			this.expChart.onClick = function(){
				self._getData().then( function( chartData ){
					self._buildChart(chartData)
				})				
			}
			
			this.incChart.onClick = function(){
				self._getData("i").then( function( chartData ){
					self._buildChart(chartData)
				})		
			}
			
			this.transfChart.onClick = function(){
				self._getData("t").then( function( chartData ){
					self._buildChart(chartData)
				})				
			}
        },
        _displayTotal: function(data, sumNodeId, titleNodeId) {
			//calculate timespan totals
			var self = this,
				sumNodeId = sumNodeId || 'charts-pie-sum-total',
				titleNodeId = titleNodeId || 'charts-pie-sum-ts',
				total = 0, alltrans = data ? data : window.AppData.store.query( self.getQuery() ),
				daysInMonth = dojodate.getDaysInMonth(new Date),
				months = [
				'jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'				
				],
				tsHeader = this.nls.allTheTime;
				
			for(var i = 0; i < alltrans.length; i++ )
				total += alltrans[i].amountHome ? alltrans[i].amountHome : alltrans[i].y;
			
			if (window.AppData.timespan == 'last31')
				tsHeader = ( '<span style="text-transform:capitalize">' +
					locale.format( dojodate.add( new Date, "day", -daysInMonth),
						{ selector:"date", datePattern: "d MMM" }) + ' - '  +
					locale.format(new Date, {selector:"date", datePattern: "d MMM"}) +"</span>" );
			else if ( window.AppData.timespan == 'customTimespan' ){
				var from = new Date;
				from = new Date( from.getFullYear(), from.getMonth(), 1);
					
				tsHeader = ('<span style="text-transform:capitalize">' + 
					this.nls[ months [ Number( locale.format( dojodate.add(from, 'day', 0),
						{ selector:"date", datePattern: 'MM'}) ) -1 ] ] +  
					locale.format( dojodate.add(from, 'day', 0),
						{ selector:"date", datePattern: ' yyyy'}) + "</span>" );
			}
			else if (window.AppData.timespan == 'lastMonth'){
				var from = getDate( window.AppData.timespanMonth, locale )
				var daysInMonth = dojodate.getDaysInMonth(from) 
				var to = dojodate.add( from, "day", daysInMonth -1 );	
				tsHeader =  ( '<span style="text-transform:capitalize">' +
					locale.format(dojodate.add(from,"day", 0),
						{selector:"date", datePattern: "d MMM"}) + ' - '  +
					locale.format(dojodate.add(to, 'day' , 0) ,
						{selector:"date", datePattern: "d MMM"}) + "</span>" )
			}
			
			domAttr.set(sumNodeId, 'innerHTML', getMoney( total, window.AppData.currency ))
			domAttr.set(titleNodeId,'innerHTML',tsHeader)					
		}        
    };
});

},
'dojox/charting/axis2d/Base':function(){
define(["dojo/_base/declare", "../Element"],
	function(declare, Element){
	/*=====
	var __BaseAxisCtorArgs = {
		// summary:
		//		Optional arguments used in the definition of an invisible axis.
		// vertical: Boolean?
		//		A flag that says whether an axis is vertical (i.e. y axis) or horizontal. Default is false (horizontal).
		// min: Number?
		//		The smallest value on an axis. Default is 0.
		// max: Number?
		//		The largest value on an axis. Default is 1.
	};
	=====*/
	return declare("dojox.charting.axis2d.Base", Element, {
		// summary:
		//		The base class for any axis.  This is more of an interface/API
		//		definition than anything else; see dojox.charting.axis2d.Default
		//		for more details.
		constructor: function(chart, kwArgs){
			// summary:
			//		Return a new base axis.
			// chart: dojox/charting/Chart
			//		The chart this axis belongs to.
			// kwArgs: __BaseAxisCtorArgs?
			//		An optional arguments object to define the axis parameters.
			this.vertical = kwArgs && kwArgs.vertical;
			this.opt = {};
			this.opt.min = kwArgs && kwArgs.min;
			this.opt.max = kwArgs && kwArgs.max;
		},
		clear: function(){
			// summary:
			//		Stub function for clearing the axis.
			// returns: dojox/charting/axis2d/Base
			//		A reference to the axis for functional chaining.
			return this;	//	dojox/charting/axis2d/Base
		},
		initialized: function(){
			// summary:
			//		Return a flag as to whether or not this axis has been initialized.
			// returns: Boolean
			//		If the axis is initialized or not.
			return false;	//	Boolean
		},
		calculate: function(min, max, span){
			// summary:
			//		Stub function to run the calculations needed for drawing this axis.
			// returns: dojox/charting/axis2d/Base
			//		A reference to the axis for functional chaining.
			return this;	//	dojox/charting/axis2d/Base
		},
		getScaler: function(){
			// summary:
			//		A stub function to return the scaler object created during calculate.
			// returns: Object
			//		The scaler object (see dojox.charting.scaler.linear for more information)
			return null;	//	Object
		},
		getTicks: function(){
			// summary:
			//		A stub function to return the object that helps define how ticks are rendered.
			// returns: Object
			//		The ticks object.
			return null;	//	Object
		},
		getOffsets: function(){
			// summary:
			//		A stub function to return any offsets needed for axis and series rendering.
			// returns: Object
			//		An object of the form { l, r, t, b }.
			return {l: 0, r: 0, t: 0, b: 0};	//	Object
		},
		render: function(dim, offsets){
			// summary:
			//		Stub function to render this axis.
			// returns: dojox/charting/axis2d/Base
			//		A reference to the axis for functional chaining.
			this.dirty = false;
			return this;	//	dojox/charting/axis2d/Base
		}
	});
});

},
'dojox/gesture/swipe':function(){
define([
	"dojo/_base/kernel",
	"dojo/_base/declare",
	"./Base",
	"../main"
], function(kernel, declare, Base, dojox){
// module:
//		dojox/gesture/swipe

/*=====
	dojox.gesture.swipe = {
		// summary:
		//		This module provides swipe gestures including:
		//
		//		####dojox.gesture.swipe
		//
		//		A series of 'swipe' will be fired during touchmove, this will mostly
		//		be used to keep sliding the Dom target based on the swiped distance(dx, dy).
		//
		//		####dojox.gesture.swipe.end
		//	
		//		Fired when a swipe is ended so that an bounce animation may be applied
		//		to the dom target sliding to the final position.
		//
		//		Following information will be included in the fired swipe events:
		//
		//		1. type: 'swipe'|'swipe.end'
		//		2. time: an integer indicating the delta time(in milliseconds)
		//		3. dx: delta distance on X axis, dx less than 0 - moving left, dx larger than 0 - moving right
		//		4. dy: delta distance on Y axis, dy less than 0 - moving up, dY larger than 0 - moving down
		//
		//		Note - dx and dy can also be used together for a hybrid swipe(both vertically and horizontally)
		//
		// example:
		//		A. Used with dojo.connect()
		//		|	dojo.connect(node, dojox.gesture.swipe, function(e){});
		//		|	dojo.connect(node, dojox.gesture.swipe.end, function(e){});
		//
		//		B. Used with dojo.on
		//		|	define(['dojo/on', 'dojox/gesture/swipe'], function(on, swipe){
		//		|		on(node, swipe, function(e){});
		//		|		on(node, swipe.end, function(e){});
		//
		//		C. Used with dojox.gesture.swipe.* directly
		//		|	dojox.gesture.swipe(node, function(e){});
		//		|	dojox.gesture.swipe.end(node, function(e){});
	};
=====*/

kernel.experimental("dojox.gesture.swipe");

// Declare an internal anonymous class which will only be exported
// by module return value e.g. dojox.gesture.swipe.Swipe
var clz = declare(/*===== "dojox.gesture.swipe", =====*/Base, {

	// defaultEvent: [readonly] String
	//		Default event - 'swipe'
	defaultEvent: "swipe",

	// subEvents: [readonly] Array
	//		List of sub events, used by 
	//		being combined with defaultEvent as 'swipe.end'
	subEvents: ["end"],

	press: function(/*Object*/data, /*Event*/e){
		// summary:
		//		Overwritten, set initial swipe info
		if(e.touches && e.touches.length >= 2){
			//currently only support single-touch swipe
			delete data.context;
			return;
		}
		if(!data.context){
			data.context = {x: 0, y: 0, t: 0};
		}
		data.context.x = e.screenX;
		data.context.y = e.screenY;
		data.context.t = new Date().getTime();
		this.lock(e.currentTarget);
	},
	move: function(/*Object*/data, /*Event*/e){
		// summary:
		//		Overwritten, fire matched 'swipe' during touchmove
		this._recognize(data, e, "swipe");
	},
	release: function(/*Object*/data, /*Event*/e){
		// summary:
		//		Overwritten, fire matched 'swipe.end' when touchend
		this._recognize(data, e, "swipe.end");		
		delete data.context;
		this.unLock();
	},
	cancel: function(data, e){
		// summary:
		//		Overwritten
		delete data.context;
		this.unLock();
	},
	_recognize: function(/*Object*/data, /*Event*/e, /*String*/type){
		// summary:
		//		Recognize and fire appropriate gesture events
		if(!data.context){
			return;
		}
		var info = this._getSwipeInfo(data, e);
		if(!info){
			// no swipe happened
			return;
		}
		info.type = type;
		this.fire(e.target, info);
	},
	_getSwipeInfo: function(/*Object*/data, /*Event*/e){
		// summary:
		//		Calculate swipe information - time, dx and dy
		var dx, dy, info = {}, startData = data.context;
		
		info.time = new Date().getTime() - startData.t;
		
		dx = e.screenX - startData.x;
		dy = e.screenY - startData.y;
		
		if(dx === 0 && dy === 0){
			// no swipes happened
			return null;
		}
		info.dx = dx;
		info.dy = dy;
		return info;
	}
});

// the default swipe instance for handy use
dojox.gesture.swipe = new clz();
// Class for creating a new Swipe instance
dojox.gesture.swipe.Swipe = clz;

return dojox.gesture.swipe;

});
},
'dojox/charting/scaler/primitive':function(){
define(["dojo/_base/lang"], 
  function(lang){
	var primitive = lang.getObject("dojox.charting.scaler.primitive", true);
	return lang.mixin(primitive, {
		buildScaler: function(/*Number*/ min, /*Number*/ max, /*Number*/ span, /*Object*/ kwArgs){
			if(min == max){
				// artificially extend bounds
				min -= 0.5;
				max += 0.5;
				// now the line will be centered
			}
			return {
				bounds: {
					lower: min,
					upper: max,
					from:  min,
					to:    max,
					scale: span / (max - min),
					span:  span
				},
				scaler: primitive
			};
		},
		buildTicks: function(/*Object*/ scaler, /*Object*/ kwArgs){
			return {major: [], minor: [], micro: []};	// Object
		},
		getTransformerFromModel: function(/*Object*/ scaler){
			var offset = scaler.bounds.from, scale = scaler.bounds.scale;
			return function(x){ return (x - offset) * scale; };	// Function
		},
		getTransformerFromPlot: function(/*Object*/ scaler){
			var offset = scaler.bounds.from, scale = scaler.bounds.scale;
			return function(x){ return x / scale + offset; };	// Function
		}
	});
});

},
'money/nls/summary':function(){
define({
	root: {
		title	: "Transactions",
	    add		: 'Add',
	    menu	: 'Menu',
		welcome	: 'Welcome to the R5M Finance',
		welcome2: 'R5M Finance is an easy-to-use finance manager for your smartphone',		
		
		versionNote: 'This is BETA version of R5M finance.',
		
		welcome3: 'You don\'t have any transactions yet',
		tapAdd	: 'Tap "Add" button to add your first transaction',
		
		aboutR5mTitle: 'About',
		aboutR5m: 'With R5M Finance you can manage your transactions (incomes, expences and transfers) in different currecncies at any number of accounts.',
		aboutSyncTitle: 'Synchronization',
		aboutSync: 'In "Synchronization" section you can set up online backups and data sync between your devices.',
		aboutHelpTitle: 'Try now',
		aboutHelp: 'Tap "Add" button in top right corner to add yout first transaction',
		
		aboutSettingsTitle: 'Personalize',
		aboutSettings: 'In "Settings" section you can manage accounts, transaction categories (labels) and set up application user interface',		
		
		currencySelectNote: 'Please select your home currency. It will be used in reports and statistics',
		currencySelectTitle : 'Home currency',
		currencySelectButton: 'Continue',
		
		expences: 'Expences',
		incomes : 'Incomes',
		transfers:'Transfers',
		
		
		lastMonth: 'One month till today',
		thisMonth: 'This month',
		allTheTime: 'All the time',
		
		total : 'Total'

	},
	'ru-ru': true
});

},
'money/nls/ru-ru/summary':function(){
define({
		title	: "Транзакции",
	    add		: 'Добавить',
	    menu	: 'Меню',
		welcome	: 'R5M Finance',
		welcome2: 'Добро пожаловать в R5M Finance - простой в использовании менеджер личных финансов для Вашего смартфона',
		
		versionNote: 'Это бета-версия приложения для публичного тестирования',
		tapAdd	: 'Нажмите "Добавить", чтобы добавить Вашу первую транзакцию',
		
		aboutR5mTitle: 'О приложении',
		aboutR5m: 'С помощью R5M Finance Вы можете вести учет транзакций (расходов, доходов и переводов) денежных средств в различных валютах на неограниченном количестве счетов.',
		aboutSyncTitle: 'Синхронизация данных',
		aboutSync: 'В разделе "Синхронизация" можно настроить резервное копирование и синхронизацию данных между Вашими устройствами.',
		aboutHelpTitle: 'Начните учет финансов сейчас',
		aboutHelp: 'Нажмите кнопку "Добавить" в правом верхнем углу, чтобы добавить Вашу первую транзакцию',
		
		aboutSettingsTitle: 'Настройте под себя',
		aboutSettings: 'В разделе "Настройки" Вы можете управлять счетами, категориями расходов (метками) а также настроить интерфейс приложения',
		
		expences: 'Расходы',
		incomes : 'Доходы',
		transfers:'Переводы',

		currencySelectNote: 'Выберите основную валюту, пожалуйста. Эта валюта будет использоваться для отчетов и статистики',
		currencySelectTitle : 'Основная валюта',
		currencySelectButton: 'Продолжить',		
		
		lastMonth: 'Месяц до сегодня',
		thisMonth: 'Текущий месяц',
		allTheTime: 'Все время',
		
		
		total : 'Всего'

});

},
'dojo/number':function(){
define([/*===== "./_base/declare", =====*/ "./_base/lang", "./i18n", "./i18n!./cldr/nls/number", "./string", "./regexp"],
	function(/*===== declare, =====*/ lang, i18n, nlsNumber, dstring, dregexp){

// module:
//		dojo/number

var number = {
	// summary:
	//		localized formatting and parsing routines for Number
};
lang.setObject("dojo.number", number);

/*=====
number.__FormatOptions = declare(null, {
	// pattern: String?
	//		override [formatting pattern](http://www.unicode.org/reports/tr35/#Number_Format_Patterns)
	//		with this string.  Default value is based on locale.  Overriding this property will defeat
	//		localization.  Literal characters in patterns are not supported.
	// type: String?
	//		choose a format type based on the locale from the following:
	//		decimal, scientific (not yet supported), percent, currency. decimal by default.
	// places: Number?
	//		fixed number of decimal places to show.  This overrides any
	//		information in the provided pattern.
	// round: Number?
	//		5 rounds to nearest .5; 0 rounds to nearest whole (default). -1
	//		means do not round.
	// locale: String?
	//		override the locale used to determine formatting rules
	// fractional: Boolean?
	//		If false, show no decimal places, overriding places and pattern settings.
});
=====*/

number.format = function(/*Number*/ value, /*number.__FormatOptions?*/ options){
	// summary:
	//		Format a Number as a String, using locale-specific settings
	// description:
	//		Create a string from a Number using a known localized pattern.
	//		Formatting patterns appropriate to the locale are chosen from the
	//		[Common Locale Data Repository](http://unicode.org/cldr) as well as the appropriate symbols and
	//		delimiters.
	//		If value is Infinity, -Infinity, or is not a valid JavaScript number, return null.
	// value:
	//		the number to be formatted

	options = lang.mixin({}, options || {});
	var locale = i18n.normalizeLocale(options.locale),
		bundle = i18n.getLocalization("dojo.cldr", "number", locale);
	options.customs = bundle;
	var pattern = options.pattern || bundle[(options.type || "decimal") + "Format"];
	if(isNaN(value) || Math.abs(value) == Infinity){ return null; } // null
	return number._applyPattern(value, pattern, options); // String
};

//number._numberPatternRE = /(?:[#0]*,?)*[#0](?:\.0*#*)?/; // not precise, but good enough
number._numberPatternRE = /[#0,]*[#0](?:\.0*#*)?/; // not precise, but good enough

number._applyPattern = function(/*Number*/ value, /*String*/ pattern, /*number.__FormatOptions?*/ options){
	// summary:
	//		Apply pattern to format value as a string using options. Gives no
	//		consideration to local customs.
	// value:
	//		the number to be formatted.
	// pattern:
	//		a pattern string as described by
	//		[unicode.org TR35](http://www.unicode.org/reports/tr35/#Number_Format_Patterns)
	// options: number.__FormatOptions?
	//		_applyPattern is usually called via `dojo/number.format()` which
	//		populates an extra property in the options parameter, "customs".
	//		The customs object specifies group and decimal parameters if set.

	//TODO: support escapes
	options = options || {};
	var group = options.customs.group,
		decimal = options.customs.decimal,
		patternList = pattern.split(';'),
		positivePattern = patternList[0];
	pattern = patternList[(value < 0) ? 1 : 0] || ("-" + positivePattern);

	//TODO: only test against unescaped
	if(pattern.indexOf('%') != -1){
		value *= 100;
	}else if(pattern.indexOf('\u2030') != -1){
		value *= 1000; // per mille
	}else if(pattern.indexOf('\u00a4') != -1){
		group = options.customs.currencyGroup || group;//mixins instead?
		decimal = options.customs.currencyDecimal || decimal;// Should these be mixins instead?
		pattern = pattern.replace(/\u00a4{1,3}/, function(match){
			var prop = ["symbol", "currency", "displayName"][match.length-1];
			return options[prop] || options.currency || "";
		});
	}else if(pattern.indexOf('E') != -1){
		throw new Error("exponential notation not supported");
	}

	//TODO: support @ sig figs?
	var numberPatternRE = number._numberPatternRE;
	var numberPattern = positivePattern.match(numberPatternRE);
	if(!numberPattern){
		throw new Error("unable to find a number expression in pattern: "+pattern);
	}
	if(options.fractional === false){ options.places = 0; }
	return pattern.replace(numberPatternRE,
		number._formatAbsolute(value, numberPattern[0], {decimal: decimal, group: group, places: options.places, round: options.round}));
};

number.round = function(/*Number*/ value, /*Number?*/ places, /*Number?*/ increment){
	// summary:
	//		Rounds to the nearest value with the given number of decimal places, away from zero
	// description:
	//		Rounds to the nearest value with the given number of decimal places, away from zero if equal.
	//		Similar to Number.toFixed(), but compensates for browser quirks. Rounding can be done by
	//		fractional increments also, such as the nearest quarter.
	//		NOTE: Subject to floating point errors.  See dojox/math/round for experimental workaround.
	// value:
	//		The number to round
	// places:
	//		The number of decimal places where rounding takes place.  Defaults to 0 for whole rounding.
	//		Must be non-negative.
	// increment:
	//		Rounds next place to nearest value of increment/10.  10 by default.
	// example:
	// |	>>> number.round(-0.5)
	// |	-1
	// |	>>> number.round(162.295, 2)
	// |	162.29  // note floating point error.  Should be 162.3
	// |	>>> number.round(10.71, 0, 2.5)
	// |	10.75
	var factor = 10 / (increment || 10);
	return (factor * +value).toFixed(places) / factor; // Number
};

if((0.9).toFixed() == 0){
	// (isIE) toFixed() bug workaround: Rounding fails on IE when most significant digit
	// is just after the rounding place and is >=5
	var round = number.round;
	number.round = function(v, p, m){
		var d = Math.pow(10, -p || 0), a = Math.abs(v);
		if(!v || a >= d){
			d = 0;
		}else{
			a /= d;
			if(a < 0.5 || a >= 0.95){
				d = 0;
			}
		}
		return round(v, p, m) + (v > 0 ? d : -d);
	};

	// Use "doc hint" so the doc parser ignores this new definition of round(), and uses the one above.
	/*===== number.round = round; =====*/
}

/*=====
number.__FormatAbsoluteOptions = declare(null, {
	// decimal: String?
	//		the decimal separator
	// group: String?
	//		the group separator
	// places: Number|String?
	//		number of decimal places.  the range "n,m" will format to m places.
	// round: Number?
	//		5 rounds to nearest .5; 0 rounds to nearest whole (default). -1
	//		means don't round.
});
=====*/

number._formatAbsolute = function(/*Number*/ value, /*String*/ pattern, /*number.__FormatAbsoluteOptions?*/ options){
	// summary:
	//		Apply numeric pattern to absolute value using options. Gives no
	//		consideration to local customs.
	// value:
	//		the number to be formatted, ignores sign
	// pattern:
	//		the number portion of a pattern (e.g. `#,##0.00`)
	options = options || {};
	if(options.places === true){options.places=0;}
	if(options.places === Infinity){options.places=6;} // avoid a loop; pick a limit

	var patternParts = pattern.split("."),
		comma = typeof options.places == "string" && options.places.indexOf(","),
		maxPlaces = options.places;
	if(comma){
		maxPlaces = options.places.substring(comma + 1);
	}else if(!(maxPlaces >= 0)){
		maxPlaces = (patternParts[1] || []).length;
	}
	if(!(options.round < 0)){
		value = number.round(value, maxPlaces, options.round);
	}

	var valueParts = String(Math.abs(value)).split("."),
		fractional = valueParts[1] || "";
	if(patternParts[1] || options.places){
		if(comma){
			options.places = options.places.substring(0, comma);
		}
		// Pad fractional with trailing zeros
		var pad = options.places !== undefined ? options.places : (patternParts[1] && patternParts[1].lastIndexOf("0") + 1);
		if(pad > fractional.length){
			valueParts[1] = dstring.pad(fractional, pad, '0', true);
		}

		// Truncate fractional
		if(maxPlaces < fractional.length){
			valueParts[1] = fractional.substr(0, maxPlaces);
		}
	}else{
		if(valueParts[1]){ valueParts.pop(); }
	}

	// Pad whole with leading zeros
	var patternDigits = patternParts[0].replace(',', '');
	pad = patternDigits.indexOf("0");
	if(pad != -1){
		pad = patternDigits.length - pad;
		if(pad > valueParts[0].length){
			valueParts[0] = dstring.pad(valueParts[0], pad);
		}

		// Truncate whole
		if(patternDigits.indexOf("#") == -1){
			valueParts[0] = valueParts[0].substr(valueParts[0].length - pad);
		}
	}

	// Add group separators
	var index = patternParts[0].lastIndexOf(','),
		groupSize, groupSize2;
	if(index != -1){
		groupSize = patternParts[0].length - index - 1;
		var remainder = patternParts[0].substr(0, index);
		index = remainder.lastIndexOf(',');
		if(index != -1){
			groupSize2 = remainder.length - index - 1;
		}
	}
	var pieces = [];
	for(var whole = valueParts[0]; whole;){
		var off = whole.length - groupSize;
		pieces.push((off > 0) ? whole.substr(off) : whole);
		whole = (off > 0) ? whole.slice(0, off) : "";
		if(groupSize2){
			groupSize = groupSize2;
			delete groupSize2;
		}
	}
	valueParts[0] = pieces.reverse().join(options.group || ",");

	return valueParts.join(options.decimal || ".");
};

/*=====
number.__RegexpOptions = declare(null, {
	// pattern: String?
	//		override [formatting pattern](http://www.unicode.org/reports/tr35/#Number_Format_Patterns)
	//		with this string.  Default value is based on locale.  Overriding this property will defeat
	//		localization.
	// type: String?
	//		choose a format type based on the locale from the following:
	//		decimal, scientific (not yet supported), percent, currency. decimal by default.
	// locale: String?
	//		override the locale used to determine formatting rules
	// strict: Boolean?
	//		strict parsing, false by default.  Strict parsing requires input as produced by the format() method.
	//		Non-strict is more permissive, e.g. flexible on white space, omitting thousands separators
	// places: Number|String?
	//		number of decimal places to accept: Infinity, a positive number, or
	//		a range "n,m".  Defined by pattern or Infinity if pattern not provided.
});
=====*/
number.regexp = function(/*number.__RegexpOptions?*/ options){
	// summary:
	//		Builds the regular needed to parse a number
	// description:
	//		Returns regular expression with positive and negative match, group
	//		and decimal separators
	return number._parseInfo(options).regexp; // String
};

number._parseInfo = function(/*Object?*/ options){
	options = options || {};
	var locale = i18n.normalizeLocale(options.locale),
		bundle = i18n.getLocalization("dojo.cldr", "number", locale),
		pattern = options.pattern || bundle[(options.type || "decimal") + "Format"],
//TODO: memoize?
		group = bundle.group,
		decimal = bundle.decimal,
		factor = 1;

	if(pattern.indexOf('%') != -1){
		factor /= 100;
	}else if(pattern.indexOf('\u2030') != -1){
		factor /= 1000; // per mille
	}else{
		var isCurrency = pattern.indexOf('\u00a4') != -1;
		if(isCurrency){
			group = bundle.currencyGroup || group;
			decimal = bundle.currencyDecimal || decimal;
		}
	}

	//TODO: handle quoted escapes
	var patternList = pattern.split(';');
	if(patternList.length == 1){
		patternList.push("-" + patternList[0]);
	}

	var re = dregexp.buildGroupRE(patternList, function(pattern){
		pattern = "(?:"+dregexp.escapeString(pattern, '.')+")";
		return pattern.replace(number._numberPatternRE, function(format){
			var flags = {
				signed: false,
				separator: options.strict ? group : [group,""],
				fractional: options.fractional,
				decimal: decimal,
				exponent: false
				},

				parts = format.split('.'),
				places = options.places;

			// special condition for percent (factor != 1)
			// allow decimal places even if not specified in pattern
			if(parts.length == 1 && factor != 1){
			    parts[1] = "###";
			}
			if(parts.length == 1 || places === 0){
				flags.fractional = false;
			}else{
				if(places === undefined){ places = options.pattern ? parts[1].lastIndexOf('0') + 1 : Infinity; }
				if(places && options.fractional == undefined){flags.fractional = true;} // required fractional, unless otherwise specified
				if(!options.places && (places < parts[1].length)){ places += "," + parts[1].length; }
				flags.places = places;
			}
			var groups = parts[0].split(',');
			if(groups.length > 1){
				flags.groupSize = groups.pop().length;
				if(groups.length > 1){
					flags.groupSize2 = groups.pop().length;
				}
			}
			return "("+number._realNumberRegexp(flags)+")";
		});
	}, true);

	if(isCurrency){
		// substitute the currency symbol for the placeholder in the pattern
		re = re.replace(/([\s\xa0]*)(\u00a4{1,3})([\s\xa0]*)/g, function(match, before, target, after){
			var prop = ["symbol", "currency", "displayName"][target.length-1],
				symbol = dregexp.escapeString(options[prop] || options.currency || "");
			before = before ? "[\\s\\xa0]" : "";
			after = after ? "[\\s\\xa0]" : "";
			if(!options.strict){
				if(before){before += "*";}
				if(after){after += "*";}
				return "(?:"+before+symbol+after+")?";
			}
			return before+symbol+after;
		});
	}

//TODO: substitute localized sign/percent/permille/etc.?

	// normalize whitespace and return
	return {regexp: re.replace(/[\xa0 ]/g, "[\\s\\xa0]"), group: group, decimal: decimal, factor: factor}; // Object
};

/*=====
number.__ParseOptions = declare(null, {
	// pattern: String?
	//		override [formatting pattern](http://www.unicode.org/reports/tr35/#Number_Format_Patterns)
	//		with this string.  Default value is based on locale.  Overriding this property will defeat
	//		localization.  Literal characters in patterns are not supported.
	// type: String?
	//		choose a format type based on the locale from the following:
	//		decimal, scientific (not yet supported), percent, currency. decimal by default.
	// locale: String?
	//		override the locale used to determine formatting rules
	// strict: Boolean?
	//		strict parsing, false by default.  Strict parsing requires input as produced by the format() method.
	//		Non-strict is more permissive, e.g. flexible on white space, omitting thousands separators
	// fractional: Boolean|Array?
	//		Whether to include the fractional portion, where the number of decimal places are implied by pattern
	//		or explicit 'places' parameter.  The value [true,false] makes the fractional portion optional.
});
=====*/
number.parse = function(/*String*/ expression, /*number.__ParseOptions?*/ options){
	// summary:
	//		Convert a properly formatted string to a primitive Number, using
	//		locale-specific settings.
	// description:
	//		Create a Number from a string using a known localized pattern.
	//		Formatting patterns are chosen appropriate to the locale
	//		and follow the syntax described by
	//		[unicode.org TR35](http://www.unicode.org/reports/tr35/#Number_Format_Patterns)
    	//		Note that literal characters in patterns are not supported.
	// expression:
	//		A string representation of a Number
	var info = number._parseInfo(options),
		results = (new RegExp("^"+info.regexp+"$")).exec(expression);
	if(!results){
		return NaN; //NaN
	}
	var absoluteMatch = results[1]; // match for the positive expression
	if(!results[1]){
		if(!results[2]){
			return NaN; //NaN
		}
		// matched the negative pattern
		absoluteMatch =results[2];
		info.factor *= -1;
	}

	// Transform it to something Javascript can parse as a number.  Normalize
	// decimal point and strip out group separators or alternate forms of whitespace
	absoluteMatch = absoluteMatch.
		replace(new RegExp("["+info.group + "\\s\\xa0"+"]", "g"), "").
		replace(info.decimal, ".");
	// Adjust for negative sign, percent, etc. as necessary
	return absoluteMatch * info.factor; //Number
};

/*=====
number.__RealNumberRegexpFlags = declare(null, {
	// places: Number?
	//		The integer number of decimal places or a range given as "n,m".  If
	//		not given, the decimal part is optional and the number of places is
	//		unlimited.
	// decimal: String?
	//		A string for the character used as the decimal point.  Default
	//		is ".".
	// fractional: Boolean|Array?
	//		Whether decimal places are used.  Can be true, false, or [true,
	//		false].  Default is [true, false] which means optional.
	// exponent: Boolean|Array?
	//		Express in exponential notation.  Can be true, false, or [true,
	//		false]. Default is [true, false], (i.e. will match if the
	//		exponential part is present are not).
	// eSigned: Boolean|Array?
	//		The leading plus-or-minus sign on the exponent.  Can be true,
	//		false, or [true, false].  Default is [true, false], (i.e. will
	//		match if it is signed or unsigned).  flags in regexp.integer can be
	//		applied.
});
=====*/

number._realNumberRegexp = function(/*__RealNumberRegexpFlags?*/ flags){
	// summary:
	//		Builds a regular expression to match a real number in exponential
	//		notation

	// assign default values to missing parameters
	flags = flags || {};
	//TODO: use mixin instead?
	if(!("places" in flags)){ flags.places = Infinity; }
	if(typeof flags.decimal != "string"){ flags.decimal = "."; }
	if(!("fractional" in flags) || /^0/.test(flags.places)){ flags.fractional = [true, false]; }
	if(!("exponent" in flags)){ flags.exponent = [true, false]; }
	if(!("eSigned" in flags)){ flags.eSigned = [true, false]; }

	var integerRE = number._integerRegexp(flags),
		decimalRE = dregexp.buildGroupRE(flags.fractional,
		function(q){
			var re = "";
			if(q && (flags.places!==0)){
				re = "\\" + flags.decimal;
				if(flags.places == Infinity){
					re = "(?:" + re + "\\d+)?";
				}else{
					re += "\\d{" + flags.places + "}";
				}
			}
			return re;
		},
		true
	);

	var exponentRE = dregexp.buildGroupRE(flags.exponent,
		function(q){
			if(q){ return "([eE]" + number._integerRegexp({ signed: flags.eSigned}) + ")"; }
			return "";
		}
	);

	var realRE = integerRE + decimalRE;
	// allow for decimals without integers, e.g. .25
	if(decimalRE){realRE = "(?:(?:"+ realRE + ")|(?:" + decimalRE + "))";}
	return realRE + exponentRE; // String
};

/*=====
number.__IntegerRegexpFlags = declare(null, {
	// signed: Boolean?
	//		The leading plus-or-minus sign. Can be true, false, or `[true,false]`.
	//		Default is `[true, false]`, (i.e. will match if it is signed
	//		or unsigned).
	// separator: String?
	//		The character used as the thousands separator. Default is no
	//		separator. For more than one symbol use an array, e.g. `[",", ""]`,
	//		makes ',' optional.
	// groupSize: Number?
	//		group size between separators
	// groupSize2: Number?
	//		second grouping, where separators 2..n have a different interval than the first separator (for India)
});
=====*/

number._integerRegexp = function(/*number.__IntegerRegexpFlags?*/ flags){
	// summary:
	//		Builds a regular expression that matches an integer

	// assign default values to missing parameters
	flags = flags || {};
	if(!("signed" in flags)){ flags.signed = [true, false]; }
	if(!("separator" in flags)){
		flags.separator = "";
	}else if(!("groupSize" in flags)){
		flags.groupSize = 3;
	}

	var signRE = dregexp.buildGroupRE(flags.signed,
		function(q){ return q ? "[-+]" : ""; },
		true
	);

	var numberRE = dregexp.buildGroupRE(flags.separator,
		function(sep){
			if(!sep){
				return "(?:\\d+)";
			}

			sep = dregexp.escapeString(sep);
			if(sep == " "){ sep = "\\s"; }
			else if(sep == "\xa0"){ sep = "\\s\\xa0"; }

			var grp = flags.groupSize, grp2 = flags.groupSize2;
			//TODO: should we continue to enforce that numbers with separators begin with 1-9?  See #6933
			if(grp2){
				var grp2RE = "(?:0|[1-9]\\d{0," + (grp2-1) + "}(?:[" + sep + "]\\d{" + grp2 + "})*[" + sep + "]\\d{" + grp + "})";
				return ((grp-grp2) > 0) ? "(?:" + grp2RE + "|(?:0|[1-9]\\d{0," + (grp-1) + "}))" : grp2RE;
			}
			return "(?:0|[1-9]\\d{0," + (grp-1) + "}(?:[" + sep + "]\\d{" + grp + "})*)";
		},
		true
	);

	return signRE + numberRE; // String
};

return number;
});

},
'money/views/accountpicker':function(){
define(["dijit/registry","dojo/_base/array","dojo/query","dojo/sniff","dojo/dom-class",'dojo/text!money/views/accountpicker.html'],
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

},
'dojox/gfx/fx':function(){
define(["dojo/_base/lang", "./_base", "./matrix", "dojo/_base/Color", "dojo/_base/array", "dojo/_base/fx", "dojo/_base/connect", "dojo/sniff"], 
  function(lang, g, m, Color, arr, fx, Hub, has){
	var fxg = g.fx = {};

	// Generic interpolators. Should they be moved to dojox.fx?

	function InterpolNumber(start, end){
		this.start = start, this.end = end;
	}
	InterpolNumber.prototype.getValue = function(r){
		return (this.end - this.start) * r + this.start;
	};

	function InterpolUnit(start, end, units){
		this.start = start, this.end = end;
		this.units = units;
	}
	InterpolUnit.prototype.getValue = function(r){
		return (this.end - this.start) * r + this.start + this.units;
	};

	function InterpolColor(start, end){
		this.start = start, this.end = end;
		this.temp = new Color();
	}
	InterpolColor.prototype.getValue = function(r){
		return Color.blendColors(this.start, this.end, r, this.temp);
	};

	function InterpolValues(values){
		this.values = values;
		this.length = values.length;
	}
	InterpolValues.prototype.getValue = function(r){
		return this.values[Math.min(Math.floor(r * this.length), this.length - 1)];
	};

	function InterpolObject(values, def){
		this.values = values;
		this.def = def ? def : {};
	}
	InterpolObject.prototype.getValue = function(r){
		var ret = lang.clone(this.def);
		for(var i in this.values){
			ret[i] = this.values[i].getValue(r);
		}
		return ret;
	};

	function InterpolTransform(stack, original){
		this.stack = stack;
		this.original = original;
	}
	InterpolTransform.prototype.getValue = function(r){
		var ret = [];
		arr.forEach(this.stack, function(t){
			if(t instanceof m.Matrix2D){
				ret.push(t);
				return;
			}
			if(t.name == "original" && this.original){
				ret.push(this.original);
				return;
			}
 			// Adding support for custom matrices
 			if(t.name == "matrix"){
 				if((t.start instanceof m.Matrix2D) && (t.end instanceof m.Matrix2D)){
 					var transfMatrix = new m.Matrix2D();
 					for(var p in t.start) {
 						transfMatrix[p] = (t.end[p] - t.start[p])*r + t.start[p];
 					}
 					ret.push(transfMatrix);
 				}
 				return;
 			}
			if(!(t.name in m)){ return; }
			var f = m[t.name];
			if(typeof f != "function"){
				// constant
				ret.push(f);
				return;
			}
			var val = arr.map(t.start, function(v, i){
							return (t.end[i] - v) * r + v;
						}),
				matrix = f.apply(m, val);
			if(matrix instanceof m.Matrix2D){
				ret.push(matrix);
			}
		}, this);
		return ret;
	};

	var transparent = new Color(0, 0, 0, 0);

	function getColorInterpol(prop, obj, name, def){
		if(prop.values){
			return new InterpolValues(prop.values);
		}
		var value, start, end;
		if(prop.start){
			start = g.normalizeColor(prop.start);
		}else{
			start = value = obj ? (name ? obj[name] : obj) : def;
		}
		if(prop.end){
			end = g.normalizeColor(prop.end);
		}else{
			if(!value){
				value = obj ? (name ? obj[name] : obj) : def;
			}
			end = value;
		}
		return new InterpolColor(start, end);
	}

	function getNumberInterpol(prop, obj, name, def){
		if(prop.values){
			return new InterpolValues(prop.values);
		}
		var value, start, end;
		if(prop.start){
			start = prop.start;
		}else{
			start = value = obj ? obj[name] : def;
		}
		if(prop.end){
			end = prop.end;
		}else{
			if(typeof value != "number"){
				value = obj ? obj[name] : def;
			}
			end = value;
		}
		return new InterpolNumber(start, end);
	}

	fxg.animateStroke = function(/*Object*/ args){
		// summary:
		//		Returns an animation which will change stroke properties over time.
		// args:
		//		an object defining the animation setting.
		// example:
		//	|	fxg.animateStroke{{
		//	|		shape: shape,
		//	|		duration: 500,
		//	|		color: {start: "red", end: "green"},
		//	|		width: {end: 15},
		//	|		join:  {values: ["miter", "bevel", "round"]}
		//	|	}).play();
		if(!args.easing){ args.easing = fx._defaultEasing; }
		var anim = new fx.Animation(args), shape = args.shape, stroke;
		Hub.connect(anim, "beforeBegin", anim, function(){
			stroke = shape.getStroke();
			var prop = args.color, values = {}, value, start, end;
			if(prop){
				values.color = getColorInterpol(prop, stroke, "color", transparent);
			}
			prop = args.style;
			if(prop && prop.values){
				values.style = new InterpolValues(prop.values);
			}
			prop = args.width;
			if(prop){
				values.width = getNumberInterpol(prop, stroke, "width", 1);
			}
			prop = args.cap;
			if(prop && prop.values){
				values.cap = new InterpolValues(prop.values);
			}
			prop = args.join;
			if(prop){
				if(prop.values){
					values.join = new InterpolValues(prop.values);
				}else{
					start = prop.start ? prop.start : (stroke && stroke.join || 0);
					end = prop.end ? prop.end : (stroke && stroke.join || 0);
					if(typeof start == "number" && typeof end == "number"){
						values.join = new InterpolNumber(start, end);
					}
				}
			}
			this.curve = new InterpolObject(values, stroke);
		});
		Hub.connect(anim, "onAnimate", shape, "setStroke");
		return anim; // dojo.Animation
	};

	fxg.animateFill = function(/*Object*/ args){
		// summary:
		//		Returns an animation which will change fill color over time.
		//		Only solid fill color is supported at the moment
		// args:
		//		an object defining the animation setting.
		// example:
		//	|	gfx.animateFill{{
		//	|		shape: shape,
		//	|		duration: 500,
		//	|		color: {start: "red", end: "green"}
		//	|	}).play();
		if(!args.easing){ args.easing = fx._defaultEasing; }
		var anim = new fx.Animation(args), shape = args.shape, fill;
		Hub.connect(anim, "beforeBegin", anim, function(){
			fill = shape.getFill();
			var prop = args.color, values = {};
			if(prop){
				this.curve = getColorInterpol(prop, fill, "", transparent);
			}
		});
		Hub.connect(anim, "onAnimate", shape, "setFill");
		return anim; // dojo.Animation
	};

	fxg.animateFont = function(/*Object*/ args){
		// summary:
		//		Returns an animation which will change font properties over time.
		// args:
		//		an object defining the animation setting.
		// example:
		//	|	gfx.animateFont{{
		//	|		shape: shape,
		//	|		duration: 500,
		//	|		variant: {values: ["normal", "small-caps"]},
		//	|		size:  {end: 10, units: "pt"}
		//	|	}).play();
		if(!args.easing){ args.easing = fx._defaultEasing; }
		var anim = new fx.Animation(args), shape = args.shape, font;
		Hub.connect(anim, "beforeBegin", anim, function(){
			font = shape.getFont();
			var prop = args.style, values = {}, value, start, end;
			if(prop && prop.values){
				values.style = new InterpolValues(prop.values);
			}
			prop = args.variant;
			if(prop && prop.values){
				values.variant = new InterpolValues(prop.values);
			}
			prop = args.weight;
			if(prop && prop.values){
				values.weight = new InterpolValues(prop.values);
			}
			prop = args.family;
			if(prop && prop.values){
				values.family = new InterpolValues(prop.values);
			}
			prop = args.size;
			if(prop && prop.units){
				start = parseFloat(prop.start ? prop.start : (shape.font && shape.font.size || "0"));
				end = parseFloat(prop.end ? prop.end : (shape.font && shape.font.size || "0"));
				values.size = new InterpolUnit(start, end, prop.units);
			}
			this.curve = new InterpolObject(values, font);
		});
		Hub.connect(anim, "onAnimate", shape, "setFont");
		return anim; // dojo.Animation
	};

	fxg.animateTransform = function(/*Object*/ args){
		// summary:
		//		Returns an animation which will change transformation over time.
		// args:
		//		an object defining the animation setting.
		// example:
		//	|	gfx.animateTransform{{
		//	|		shape: shape,
		//	|		duration: 500,
		//	|		transform: [
		//	|			{name: "translate", start: [0, 0], end: [200, 200]},
		//	|			{name: "original"}
		//	|		]
		//	|	}).play();
		if(!args.easing){ args.easing = fx._defaultEasing; }
		var anim = new fx.Animation(args), shape = args.shape, original;
		Hub.connect(anim, "beforeBegin", anim, function(){
			original = shape.getTransform();
			this.curve = new InterpolTransform(args.transform, original);
		});
		Hub.connect(anim, "onAnimate", shape, "setTransform");
		if(g.renderer === "svg" && has("ie") >= 10){
			// fix http://bugs.dojotoolkit.org/ticket/16879
			var handlers = [
					Hub.connect(anim, "onBegin", anim, function(){
						var parent = shape.getParent();
						while(parent && parent.getParent){
							parent = parent.getParent();
						}
						if(parent){
							shape.__svgContainer = parent.rawNode.parentNode;
						}
					}),
					Hub.connect(anim, "onAnimate", anim, function(){
						try{
							if(shape.__svgContainer){
								var ov = shape.__svgContainer.style.visibility;
								shape.__svgContainer.style.visibility = "visible";
								var pokeNode = shape.__svgContainer.offsetHeight;
								shape.__svgContainer.style.visibility = ov;
							}
						}catch(e){}
					}),
					Hub.connect(anim, "onEnd", anim, function(){
						arr.forEach(handlers, Hub.disconnect);
						if(shape.__svgContainer){
							var ov = shape.__svgContainer.style.visibility;
							var sn = shape.__svgContainer;
							shape.__svgContainer.style.visibility = "visible";
							setTimeout(function(){
								try{
									sn.style.visibility = ov;
									sn = null;
								}catch(e){}
							},100);
						}
						delete shape.__svgContainer;
					})
				];
		}
		return anim; // dojo.Animation
	};
	
	return fxg;
});

},
'dojox/gfx/path':function(){
define(["./_base", "dojo/_base/lang","dojo/_base/declare", "./matrix", "./shape"],
	function(g, lang, declare, matrix, shapeLib){

	// module:
	//		dojox/gfx/path

	var Path = declare("dojox.gfx.path.Path", shapeLib.Shape, {
		// summary:
		//		a generalized path shape

		constructor: function(rawNode){
			// summary:
			//		a path constructor
			// rawNode: Node
			//		a DOM node to be used by this path object
			this.shape = lang.clone(g.defaultPath);
			this.segments = [];
			this.tbbox = null;
			this.absolute = true;
			this.last = {};
			this.rawNode = rawNode;
			this.segmented = false;
		},

		// mode manipulations
		setAbsoluteMode: function(mode){
			// summary:
			//		sets an absolute or relative mode for path points
			// mode: Boolean
			//		true/false or "absolute"/"relative" to specify the mode
			this._confirmSegmented();
			this.absolute = typeof mode == "string" ? (mode == "absolute") : mode;
			return this; // self
		},
		getAbsoluteMode: function(){
			// summary:
			//		returns a current value of the absolute mode
			this._confirmSegmented();
			return this.absolute; // Boolean
		},

		getBoundingBox: function(){
			// summary:
			//		returns the bounding box {x, y, width, height} or null
			this._confirmSegmented();
			return (this.bbox && ("l" in this.bbox)) ? {x: this.bbox.l, y: this.bbox.t, width: this.bbox.r - this.bbox.l, height: this.bbox.b - this.bbox.t} : null; // dojox/gfx.Rectangle
		},

		_getRealBBox: function(){
			// summary:
			//		returns an array of four points or null
			//		four points represent four corners of the untransformed bounding box
			this._confirmSegmented();
			if(this.tbbox){
				return this.tbbox;	// Array
			}
			var bbox = this.bbox, matrix = this._getRealMatrix();
			this.bbox = null;
			for(var i = 0, len = this.segments.length; i < len; ++i){
				this._updateWithSegment(this.segments[i], matrix);
			}
			var t = this.bbox;
			this.bbox = bbox;
			this.tbbox = t ? [
				{x: t.l, y: t.t},
				{x: t.r, y: t.t},
				{x: t.r, y: t.b},
				{x: t.l, y: t.b}
			] : null;
			return this.tbbox;	// Array
		},

		getLastPosition: function(){
			// summary:
			//		returns the last point in the path, or null
			this._confirmSegmented();
			return "x" in this.last ? this.last : null; // Object
		},

		_applyTransform: function(){
			this.tbbox = null;
			return this.inherited(arguments);
		},

		// segment interpretation
		_updateBBox: function(x, y, m){
			// summary:
			//		updates the bounding box of path with new point
			// x: Number
			//		an x coordinate
			// y: Number
			//		a y coordinate

			if(m){
				var t = matrix.multiplyPoint(m, x, y);
				x = t.x;
				y = t.y;
			}

			// we use {l, b, r, t} representation of a bbox
			if(this.bbox && ("l" in this.bbox)){
				if(this.bbox.l > x) this.bbox.l = x;
				if(this.bbox.r < x) this.bbox.r = x;
				if(this.bbox.t > y) this.bbox.t = y;
				if(this.bbox.b < y) this.bbox.b = y;
			}else{
				this.bbox = {l: x, b: y, r: x, t: y};
			}
		},
		_updateWithSegment: function(segment, matrix){
			// summary:
			//		updates the bounding box of path with new segment
			// segment: Object
			//		a segment
			var n = segment.args, l = n.length, i;
			// update internal variables: bbox, absolute, last
			switch(segment.action){
				case "M":
				case "L":
				case "C":
				case "S":
				case "Q":
				case "T":
					for(i = 0; i < l; i += 2){
						this._updateBBox(n[i], n[i + 1], matrix);
					}
					this.last.x = n[l - 2];
					this.last.y = n[l - 1];
					this.absolute = true;
					break;
				case "H":
					for(i = 0; i < l; ++i){
						this._updateBBox(n[i], this.last.y, matrix);
					}
					this.last.x = n[l - 1];
					this.absolute = true;
					break;
				case "V":
					for(i = 0; i < l; ++i){
						this._updateBBox(this.last.x, n[i], matrix);
					}
					this.last.y = n[l - 1];
					this.absolute = true;
					break;
				case "m":
					var start = 0;
					if(!("x" in this.last)){
						this._updateBBox(this.last.x = n[0], this.last.y = n[1], matrix);
						start = 2;
					}
					for(i = start; i < l; i += 2){
						this._updateBBox(this.last.x += n[i], this.last.y += n[i + 1], matrix);
					}
					this.absolute = false;
					break;
				case "l":
				case "t":
					for(i = 0; i < l; i += 2){
						this._updateBBox(this.last.x += n[i], this.last.y += n[i + 1], matrix);
					}
					this.absolute = false;
					break;
				case "h":
					for(i = 0; i < l; ++i){
						this._updateBBox(this.last.x += n[i], this.last.y, matrix);
					}
					this.absolute = false;
					break;
				case "v":
					for(i = 0; i < l; ++i){
						this._updateBBox(this.last.x, this.last.y += n[i], matrix);
					}
					this.absolute = false;
					break;
				case "c":
					for(i = 0; i < l; i += 6){
						this._updateBBox(this.last.x + n[i], this.last.y + n[i + 1], matrix);
						this._updateBBox(this.last.x + n[i + 2], this.last.y + n[i + 3], matrix);
						this._updateBBox(this.last.x += n[i + 4], this.last.y += n[i + 5], matrix);
					}
					this.absolute = false;
					break;
				case "s":
				case "q":
					for(i = 0; i < l; i += 4){
						this._updateBBox(this.last.x + n[i], this.last.y + n[i + 1], matrix);
						this._updateBBox(this.last.x += n[i + 2], this.last.y += n[i + 3], matrix);
					}
					this.absolute = false;
					break;
				case "A":
					for(i = 0; i < l; i += 7){
						this._updateBBox(n[i + 5], n[i + 6], matrix);
					}
					this.last.x = n[l - 2];
					this.last.y = n[l - 1];
					this.absolute = true;
					break;
				case "a":
					for(i = 0; i < l; i += 7){
						this._updateBBox(this.last.x += n[i + 5], this.last.y += n[i + 6], matrix);
					}
					this.absolute = false;
					break;
			}
			// add an SVG path segment
			var path = [segment.action];
			for(i = 0; i < l; ++i){
				path.push(g.formatNumber(n[i], true));
			}
			if(typeof this.shape.path == "string"){
				this.shape.path += path.join("");
			}else{
				for(i = 0, l = path.length; i < l; ++i){
					this.shape.path.push(path[i]);
				}
			}
		},

		// a dictionary, which maps segment type codes to a number of their arguments
		_validSegments: {m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0},

		_pushSegment: function(action, args){
			// summary:
			//		adds a segment
			// action: String
			//		valid SVG code for a segment's type
			// args: Array
			//		a list of parameters for this segment
			this.tbbox = null;
			var group = this._validSegments[action.toLowerCase()], segment;
			if(typeof group == "number"){
				if(group){
					if(args.length >= group){
						segment = {action: action, args: args.slice(0, args.length - args.length % group)};
						this.segments.push(segment);
						this._updateWithSegment(segment);
					}
				}else{
					segment = {action: action, args: []};
					this.segments.push(segment);
					this._updateWithSegment(segment);
				}
			}
		},

		_collectArgs: function(array, args){
			// summary:
			//		converts an array of arguments to plain numeric values
			// array: Array
			//		an output argument (array of numbers)
			// args: Array
			//		an input argument (can be values of Boolean, Number, dojox/gfx.Point, or an embedded array of them)
			for(var i = 0; i < args.length; ++i){
				var t = args[i];
				if(typeof t == "boolean"){
					array.push(t ? 1 : 0);
				}else if(typeof t == "number"){
					array.push(t);
				}else if(t instanceof Array){
					this._collectArgs(array, t);
				}else if("x" in t && "y" in t){
					array.push(t.x, t.y);
				}
			}
		},

		// segments
		moveTo: function(){
			// summary:
			//		forms a move segment
			this._confirmSegmented();
			var args = [];
			this._collectArgs(args, arguments);
			this._pushSegment(this.absolute ? "M" : "m", args);
			return this; // self
		},
		lineTo: function(){
			// summary:
			//		forms a line segment
			this._confirmSegmented();
			var args = [];
			this._collectArgs(args, arguments);
			this._pushSegment(this.absolute ? "L" : "l", args);
			return this; // self
		},
		hLineTo: function(){
			// summary:
			//		forms a horizontal line segment
			this._confirmSegmented();
			var args = [];
			this._collectArgs(args, arguments);
			this._pushSegment(this.absolute ? "H" : "h", args);
			return this; // self
		},
		vLineTo: function(){
			// summary:
			//		forms a vertical line segment
			this._confirmSegmented();
			var args = [];
			this._collectArgs(args, arguments);
			this._pushSegment(this.absolute ? "V" : "v", args);
			return this; // self
		},
		curveTo: function(){
			// summary:
			//		forms a curve segment
			this._confirmSegmented();
			var args = [];
			this._collectArgs(args, arguments);
			this._pushSegment(this.absolute ? "C" : "c", args);
			return this; // self
		},
		smoothCurveTo: function(){
			// summary:
			//		forms a smooth curve segment
			this._confirmSegmented();
			var args = [];
			this._collectArgs(args, arguments);
			this._pushSegment(this.absolute ? "S" : "s", args);
			return this; // self
		},
		qCurveTo: function(){
			// summary:
			//		forms a quadratic curve segment
			this._confirmSegmented();
			var args = [];
			this._collectArgs(args, arguments);
			this._pushSegment(this.absolute ? "Q" : "q", args);
			return this; // self
		},
		qSmoothCurveTo: function(){
			// summary:
			//		forms a quadratic smooth curve segment
			this._confirmSegmented();
			var args = [];
			this._collectArgs(args, arguments);
			this._pushSegment(this.absolute ? "T" : "t", args);
			return this; // self
		},
		arcTo: function(){
			// summary:
			//		forms an elliptic arc segment
			this._confirmSegmented();
			var args = [];
			this._collectArgs(args, arguments);
			this._pushSegment(this.absolute ? "A" : "a", args);
			return this; // self
		},
		closePath: function(){
			// summary:
			//		closes a path
			this._confirmSegmented();
			this._pushSegment("Z", []);
			return this; // self
		},

		_confirmSegmented: function() {
			if (!this.segmented) {
				var path = this.shape.path;
				// switch to non-updating version of path building
				this.shape.path = [];
				this._setPath(path);
				// switch back to the string path
				this.shape.path = this.shape.path.join("");
				// become segmented
				this.segmented = true;
			}
		},

		// setShape
		_setPath: function(path){
			// summary:
			//		forms a path using an SVG path string
			// path: String
			//		an SVG path string
			var p = lang.isArray(path) ? path : path.match(g.pathSvgRegExp);
			this.segments = [];
			this.absolute = true;
			this.bbox = {};
			this.last = {};
			if(!p) return;
			// create segments
			var action = "",	// current action
				args = [],		// current arguments
				l = p.length;
			for(var i = 0; i < l; ++i){
				var t = p[i], x = parseFloat(t);
				if(isNaN(x)){
					if(action){
						this._pushSegment(action, args);
					}
					args = [];
					action = t;
				}else{
					args.push(x);
				}
			}
			this._pushSegment(action, args);
		},
		setShape: function(newShape){
			// summary:
			//		forms a path using a shape
			// newShape: Object
			//		an SVG path string or a path object (see dojox/gfx.defaultPath)
			this.inherited(arguments, [typeof newShape == "string" ? {path: newShape} : newShape]);

			this.segmented = false;
			this.segments = [];
			if(!g.lazyPathSegmentation){
				this._confirmSegmented();
			}
			return this; // self
		},

		// useful constant for descendants
		_2PI: Math.PI * 2
	});

	var TextPath = declare("dojox.gfx.path.TextPath", Path, {
		// summary:
		//		a generalized TextPath shape

		constructor: function(rawNode){
			// summary:
			//		a TextPath shape constructor
			// rawNode: Node
			//		a DOM node to be used by this TextPath object
			if(!("text" in this)){
				this.text = lang.clone(g.defaultTextPath);
			}
			if(!("fontStyle" in this)){
				this.fontStyle = lang.clone(g.defaultFont);
			}
		},
		getText: function(){
			// summary:
			//		returns the current text object or null
			return this.text;	// Object
		},
		setText: function(newText){
			// summary:
			//		sets a text to be drawn along the path
			this.text = g.makeParameters(this.text,
				typeof newText == "string" ? {text: newText} : newText);
			this._setText();
			return this;	// self
		},
		getFont: function(){
			// summary:
			//		returns the current font object or null
			return this.fontStyle;	// Object
		},
		setFont: function(newFont){
			// summary:
			//		sets a font for text
			this.fontStyle = typeof newFont == "string" ?
				g.splitFontString(newFont) :
				g.makeParameters(g.defaultFont, newFont);
			this._setFont();
			return this;	// self
		}
	});

	/*=====
	g.Path = Path;
	g.TextPath = TextPath;
	=====*/

	return g.path = {
		// summary:
		//		This module contains the core graphics Path API.
		//		Path command format follows the W3C SVG 1.0 Path api.

		Path: Path,
		TextPath: TextPath
	};
});

},
'dojox/charting/themes/ThreeD':function(){
define(["dojo/_base/lang", "dojo/_base/array", "../Theme", "./gradientGenerator", "./PrimaryColors", "dojo/colors" /* for sanitize */, "./common"],
	function(lang, ArrayUtil, Theme, gradientGenerator, PrimaryColors, themes){

	var colors = ["#f00", "#0f0", "#00f", "#ff0", "#0ff", "#f0f", "./common"],	// the same is in PrimaryColors
		defaultFill = {type: "linear", space: "shape", x1: 0, y1: 0, x2: 100, y2: 0},
		// 3D cylinder map is calculated using dojox.gfx3d
		cyl3dMap = [
			{o: 0.00, i: 174}, {o: 0.08, i: 231}, {o: 0.18, i: 237}, {o: 0.30, i: 231},
			{o: 0.39, i: 221}, {o: 0.49, i: 206}, {o: 0.58, i: 187}, {o: 0.68, i: 165},
			{o: 0.80, i: 128}, {o: 0.90, i: 102}, {o: 1.00, i: 174}
		],
		hiliteIndex = 2, hiliteIntensity = 100,
		cyl3dFills = ArrayUtil.map(colors, function(c){
			var fill = lang.delegate(defaultFill),
				colors = fill.colors = gradientGenerator.generateGradientByIntensity(c, cyl3dMap),
				hilite = colors[hiliteIndex].color;
			// add highlight
			hilite.r += hiliteIntensity;
			hilite.g += hiliteIntensity;
			hilite.b += hiliteIntensity;
			hilite.sanitize();
			return fill;
		});

	themes.ThreeD = PrimaryColors.clone();
	themes.ThreeD.series.shadow = {dx: 1, dy: 1, width: 3, color: [0, 0, 0, 0.15]};

	themes.ThreeD.next = function(elementType, mixin, doPost){
		if(elementType == "bar" || elementType == "column"){
			// custom processing for bars and columns: substitute fills
			var index = this._current % this.seriesThemes.length,
				s = this.seriesThemes[index], old = s.fill;
			s.fill = cyl3dFills[index];
			var theme = Theme.prototype.next.apply(this, arguments);
			// cleanup
			s.fill = old;
			return theme;
		}
		return Theme.prototype.next.apply(this, arguments);
	};
	
	return themes.ThreeD;
});

},
'dojox/charting/SimpleTheme':function(){
define(["dojo/_base/lang", "dojo/_base/array","dojo/_base/declare","dojo/_base/Color", "dojox/lang/utils", "dojox/gfx/gradutils"],
	function(lang, arr, declare, Color, dlu, dgg){
	
	var SimpleTheme = declare("dojox.charting.SimpleTheme", null, {
	// summary:
	//		A SimpleTheme or Theme is a pre-defined object, primarily JSON-based, that makes up the definitions to
	//		style a chart.
	//
	// description:
	//		While you can set up style definitions on a chart directly (usually through the various add methods
	//		on a dojox.charting.Chart object), a Theme simplifies this manual setup by allowing you to
	//		pre-define all of the various visual parameters of each element in a chart.
	//
	//		Most of the properties of a Theme are straight-forward; if something is line-based (such as
	//		an axis or the ticks on an axis), they will be defined using basic stroke parameters.  Likewise,
	//		if an element is primarily block-based (such as the background of a chart), it will be primarily
	//		fill-based.
	//
	//		In addition (for convenience), a Theme definition does not have to contain the entire JSON-based
	//		structure.  Each theme is built on top of a default theme (which serves as the basis for the theme
	//		"GreySkies"), and is mixed into the default theme object.  This allows you to create a theme based,
	//		say, solely on colors for data series.
	//
	//		Defining a new theme is relatively easy; see any of the themes in dojox.charting.themes for examples
	//		on how to define your own.
	//
	//		When you set a theme on a chart, the theme itself is deep-cloned.  This means that you cannot alter
	//		the theme itself after setting the theme value on a chart, and expect it to change your chart.  If you
	//		are looking to make alterations to a theme for a chart, the suggestion would be to create your own
	//		theme, based on the one you want to use, that makes those alterations before it is applied to a chart.
	//
	//		Finally, a Theme contains a number of functions to facilitate rendering operations on a chart--the main
	//		helper of which is the ~next~ method, in which a chart asks for the information for the next data series
	//		to be rendered.
	//
	//		A note on colors:
	//		A theme palette is usually comprised of 5 different color definitions, and
	//		no more.  If you have a need to render a chart with more than 5 data elements, you can simply "push"
	//		new color definitions into the theme's .color array.  Make sure that you do that with the actual
	//		theme object from a Chart, and not in the theme itself (i.e. either do that before using .setTheme
	//		on a chart).
	//
	// example:
	//		The default theme (and structure) looks like so:
	//	|	// all objects are structs used directly in dojox.gfx
	//	|	chart:{
	//	|		stroke: null,
	//	|		fill: "white",
	//	|		pageStyle: null // suggested page style as an object suitable for dojo.style()
	//	|	},
	//	|	plotarea:{
	//	|		stroke: null,
	//	|		fill: "white"
	//	|	},
	//	|	axis:{
	//	|		stroke:	{ // the axis itself
	//	|			color: "#333",
	//	|			width: 1
	//	|		},
	//	|		tick: {	// used as a foundation for all ticks
	//	|			color:     "#666",
	//	|			position:  "center",
	//	|			font:      "normal normal normal 7pt Tahoma",	// labels on axis
	//	|			fontColor: "#333"								// color of labels
	//	|		},
	//	|		majorTick:	{ // major ticks on axis, and used for major gridlines
	//	|			width:  1,
	//	|			length: 6
	//	|		},
	//	|		minorTick:	{ // minor ticks on axis, and used for minor gridlines
	//	|			width:  0.8,
	//	|			length: 3
	//	|		},
	//	|		microTick:	{ // minor ticks on axis, and used for minor gridlines
	//	|			width:  0.5,
	//	|			length: 1
	//	|		},
	//	|		title: {
	//	|			gap:  15,
	//	|			font: "normal normal normal 11pt Tahoma",	// title font
	//	|			fontColor: "#333",							// title font color
	//	|			orientation: "axis"						// "axis": facing the axis, "away": facing away
	//	|		}
	//	|	},
	//	|	series: {
	//	|		stroke:  {width: 1.5, color: "#333"},		// line
	//	|		outline: {width: 0.1, color: "#ccc"},		// outline
	//	|		//shadow:  {dx: 1, dy: 1, width: 2, color: [0, 0, 0, 0.3]},
	//	|		shadow: null,								// no shadow
	//	|		//filter:  dojox/gfx/filters.createFilter(),
	//	|		filter: null,								// no filter, to use a filter you must use gfx SVG render and require dojox/gfx/svgext
	//	|		fill:    "#ccc",							// fill, if appropriate
	//	|		font:    "normal normal normal 8pt Tahoma",	// if there's a label
	//	|		fontColor: "#000"							// color of labels
	//	|		labelWiring: {width: 1, color: "#ccc"},		// connect marker and target data item(slice, column, bar...)
	//	|	},
	//	|	marker: {	// any markers on a series
	//	|		symbol:  "m-3,3 l3,-6 3,6 z",				// symbol
	//	|		stroke:  {width: 1.5, color: "#333"},		// stroke
	//	|		outline: {width: 0.1, color: "#ccc"},		// outline
	//	|		shadow: null,								// no shadow
	//	|		fill:    "#ccc",							// fill if needed
	//	|		font:    "normal normal normal 8pt Tahoma",	// label
	//	|		fontColor: "#000"
	//	|	},
	//	|	grid: {	// grid, when not present axis tick strokes are used instead
	//	|		majorLine: {	// major grid line
	//	|			color:     "#666",
	//	|			width:  1,
	//	|			length: 6
	//	|		},
	//	|		minorLine: {	// minor grid line
	//	|			color:     "#666",
	//	|			width:  0.8,
	//	|			length: 3
	//	|		},
	//	|		fill: "grey",  // every other stripe
	//	|		alternateFill: "grey" // alternate stripe
	//	|	},
	//	|	indicator: {
	//	|		lineStroke:  {width: 1.5, color: "#333"},		// line
	//	|		lineOutline: {width: 0.1, color: "#ccc"},		// line outline
	//	|		lineShadow: null,								// no line shadow
	//	|		lineFill: null,									// fill between lines for dual indicators
	//	|		stroke:  {width: 1.5, color: "#333"},			// label background stroke
	//	|		outline: {width: 0.1, color: "#ccc"},			// label background outline
	//	|		shadow: null,									// no label background shadow
	//	|		fill:  "#ccc",									// label background fill
	//	|		radius: 3,										// radius of the label background
	//	|		font:    "normal normal normal 10pt Tahoma",	// label font
	//	|		fontColor: "#000"								// label color
	//	|		markerFill:    "#ccc",							// marker fill
	//	|		markerSymbol:  "m-3,0 c0,-4 6,-4 6,0 m-6,0 c0,4 6,4 6,0",	// marker symbol
	//	|		markerStroke:  {width: 1.5, color: "#333"},		// marker stroke
	//	|		markerOutline: {width: 0.1, color: "#ccc"},		// marker outline
	//	|		markerShadow: null,								// no marker shadow
	//	|	}
	//
	// example:
	//		Defining a new theme is pretty simple:
	//	|	var Grasslands = new SimpleTheme({
	//	|		colors: [ "#70803a", "#dde574", "#788062", "#b1cc5d", "#eff2c2" ]
	//	|	});
	//	|
	//	|	myChart.setTheme(Grasslands);

	shapeSpaces: {shape: 1, shapeX: 1, shapeY: 1},

	constructor: function(kwArgs){
		// summary:
		//		Initialize a theme using the keyword arguments.  Note that the arguments
		//		look like the example (above), and may include a few more parameters.
		kwArgs = kwArgs || {};

		// populate theme with defaults updating them if needed
		var def = SimpleTheme.defaultTheme;
		arr.forEach(["chart", "plotarea", "axis", "grid", "series", "marker", "indicator"], function(name){
			this[name] = lang.delegate(def[name], kwArgs[name]);
		}, this);

		// personalize theme
		if(kwArgs.seriesThemes && kwArgs.seriesThemes.length){
			this.colors  = null;
			this.seriesThemes = kwArgs.seriesThemes.slice(0);
		}else{
			this.seriesThemes = null;
			this.colors = (kwArgs.colors || SimpleTheme.defaultColors).slice(0);
		}
		this.markerThemes = null;
		if(kwArgs.markerThemes && kwArgs.markerThemes.length){
			this.markerThemes = kwArgs.markerThemes.slice(0);
		}
		this.markers = kwArgs.markers ? lang.clone(kwArgs.markers) : lang.delegate(SimpleTheme.defaultMarkers);

		// set flags
		this.noGradConv = kwArgs.noGradConv;
		this.noRadialConv = kwArgs.noRadialConv;
		if(kwArgs.reverseFills){
			this.reverseFills();
		}

		//	private housekeeping
		this._current = 0;
		this._buildMarkerArray();
	},

	clone: function(){
		// summary:
		//		Clone the current theme.
		// returns: dojox.charting.SimpleTheme
		//		The cloned theme; any alterations made will not affect the original.
		var theme = new this.constructor({
			// theme components
			chart: this.chart,
			plotarea: this.plotarea,
			axis: this.axis,
			grid: this.grid,
			series: this.series,
			marker: this.marker,
			// individual arrays
			colors: this.colors,
			markers: this.markers,
			indicator: this.indicator,
			seriesThemes: this.seriesThemes,
			markerThemes: this.markerThemes,
			// flags
			noGradConv: this.noGradConv,
			noRadialConv: this.noRadialConv
		});
		// copy custom methods
		arr.forEach(
			["clone", "clear", "next", "skip", "addMixin", "post", "getTick"],
			function(name){
				if(this.hasOwnProperty(name)){
					theme[name] = this[name];
				}
			},
			this
		);
		return theme;	//	dojox.charting.SimpleTheme
	},

	clear: function(){
		// summary:
		//		Clear and reset the internal pointer to start fresh.
		this._current = 0;
	},

	next: function(elementType, mixin, doPost){
		// summary:
		//		Get the next color or series theme.
		// elementType: String?
		//		An optional element type (for use with series themes)
		// mixin: Object?
		//		An optional object to mix into the theme.
		// doPost: Boolean?
		//		A flag to post-process the results.
		// returns: Object
		//		An object of the structure { series, marker, symbol }
		var merge = dlu.merge, series, marker;
		if(this.colors){
			series = lang.delegate(this.series);
			marker = lang.delegate(this.marker);
			var color = new Color(this.colors[this._current % this.colors.length]), old;
			// modify the stroke
			if(series.stroke && series.stroke.color){
				series.stroke = lang.delegate(series.stroke);
				old = new Color(series.stroke.color);
				series.stroke.color = new Color(color);
				series.stroke.color.a = old.a;
			}else{
				series.stroke = {color: color};
			}
			if(marker.stroke && marker.stroke.color){
				marker.stroke = lang.delegate(marker.stroke);
				old = new Color(marker.stroke.color);
				marker.stroke.color = new Color(color);
				marker.stroke.color.a = old.a;
			}else{
				marker.stroke = {color: color};
			}
			// modify the fill
			if(!series.fill || series.fill.type){
				series.fill = color;
			}else{
				old = new Color(series.fill);
				series.fill = new Color(color);
				series.fill.a = old.a;
			}
			if(!marker.fill || marker.fill.type){
				marker.fill = color;
			}else{
				old = new Color(marker.fill);
				marker.fill = new Color(color);
				marker.fill.a = old.a;
			}
		}else{
			series = this.seriesThemes ?
				merge(this.series, this.seriesThemes[this._current % this.seriesThemes.length]) :
				this.series;
			marker = this.markerThemes ?
				merge(this.marker, this.markerThemes[this._current % this.markerThemes.length]) :
				series;
		}

		var symbol = marker && marker.symbol || this._markers[this._current % this._markers.length];

		var theme = {series: series, marker: marker, symbol: symbol};
		
		// advance the counter
		++this._current;

		if(mixin){
			theme = this.addMixin(theme, elementType, mixin);
		}
		if(doPost){
			theme = this.post(theme, elementType);
		}

		return theme;	//	Object
	},

	skip: function(){
		// summary:
		//		Skip the next internal color.
		++this._current;
	},

	addMixin: function(theme, elementType, mixin, doPost){
		// summary:
		//		Add a mixin object to the passed theme and process.
		// theme: dojox/charting/SimpleTheme
		//		The theme to mixin to.
		// elementType: String
		//		The type of element in question. Can be "line", "bar" or "circle"
		// mixin: Object|Array
		//		The object or objects to mix into the theme.
		// doPost: Boolean
		//		If true, run the new theme through the post-processor.
		// returns: dojox/charting/SimpleTheme
		//		The new theme.
		if(lang.isArray(mixin)){
			arr.forEach(mixin, function(m){
				theme = this.addMixin(theme, elementType, m);
			}, this);
		}else{
			var t = {};
			if("color" in mixin){
				if(elementType == "line" || elementType == "area"){
					lang.setObject("series.stroke.color", mixin.color, t);
					lang.setObject("marker.stroke.color", mixin.color, t);
				}else{
					lang.setObject("series.fill", mixin.color, t);
				}
			}
			arr.forEach(["stroke", "outline", "shadow", "fill", "filter", "font", "fontColor", "labelWiring"], function(name){
				var markerName = "marker" + name.charAt(0).toUpperCase() + name.substr(1),
					b = markerName in mixin;
				if(name in mixin){
					lang.setObject("series." + name, mixin[name], t);
					if(!b){
						lang.setObject("marker." + name, mixin[name], t);
					}
				}
				if(b){
					lang.setObject("marker." + name, mixin[markerName], t);
				}
			});
			if("marker" in mixin){
				t.symbol = mixin.marker;
				t.symbol = mixin.marker;
			}
			theme = dlu.merge(theme, t);
		}
		if(doPost){
			theme = this.post(theme, elementType);
		}
		return theme;	//	dojox/charting/SimpleTheme
	},

	post: function(theme, elementType){
		// summary:
		//		Process any post-shape fills.
		// theme: dojox/charting/SimpleTheme
		//		The theme to post process with.
		// elementType: String
		//		The type of element being filled.  Can be "bar" or "circle".
		// returns: dojox/charting/SimpleTheme
		//		The post-processed theme.
		var fill = theme.series.fill, t;
		if(!this.noGradConv && this.shapeSpaces[fill.space] && fill.type == "linear"){
			if(elementType == "bar"){
				// transpose start and end points
				t = {
					x1: fill.y1,
					y1: fill.x1,
					x2: fill.y2,
					y2: fill.x2
				};
			}else if(!this.noRadialConv && fill.space == "shape" && (elementType == "slice" || elementType == "circle")){
				// switch to radial
				t = {
					type: "radial",
					cx: 0,
					cy: 0,
					r:  100
				};
			}
			if(t){
				return dlu.merge(theme, {series: {fill: t}});
			}
		}
		return theme;	//	dojox/charting/SimpleTheme
	},

	getTick: function(name, mixin){
		// summary:
		//		Calculates and merges tick parameters.
		// name: String
		//		Tick name, can be "major", "minor", or "micro".
		// mixin: Object?
		//		Optional object to mix in to the tick.
		var tick = this.axis.tick, tickName = name + "Tick",
			merge = dlu.merge;
		if(tick){
			if(this.axis[tickName]){
				tick = merge(tick, this.axis[tickName]);
			}
		}else{
			tick = this.axis[tickName];
		}
		if(mixin){
			if(tick){
				if(mixin[tickName]){
					tick = merge(tick, mixin[tickName]);
				}
			}else{
				tick = mixin[tickName];
			}
		}
		return tick;	//	Object
	},

	inspectObjects: function(f){
		arr.forEach(["chart", "plotarea", "axis", "grid", "series", "marker", "indicator"], function(name){
			f(this[name]);
		}, this);
		if(this.seriesThemes){
			arr.forEach(this.seriesThemes, f);
		}
		if(this.markerThemes){
			arr.forEach(this.markerThemes, f);
		}
	},

	reverseFills: function(){
		this.inspectObjects(function(o){
			if(o && o.fill){
				o.fill = dgg.reverse(o.fill);
			}
		});
	},

	addMarker:function(/*String*/ name, /*String*/ segment){
		// summary:
		//		Add a custom marker to this theme.
		// example:
		//	|	myTheme.addMarker("Ellipse", foo);
		this.markers[name] = segment;
		this._buildMarkerArray();
	},

	setMarkers:function(/*Object*/ obj){
		// summary:
		//		Set all the markers of this theme at once.  obj should be a
		//		dictionary of keys and path segments.
		//
		// example:
		//	|	myTheme.setMarkers({ "CIRCLE": foo });
		this.markers = obj;
		this._buildMarkerArray();
	},

	_buildMarkerArray: function(){
		this._markers = [];
		for(var p in this.markers){
			this._markers.push(this.markers[p]);
		}
	}
});

lang.mixin(SimpleTheme, {
	defaultMarkers: {
		CIRCLE:   "m-3,0 c0,-4 6,-4 6,0 m-6,0 c0,4 6,4 6,0",
		SQUARE:   "m-3,-3 l0,6 6,0 0,-6 z",
		DIAMOND:  "m0,-3 l3,3 -3,3 -3,-3 z",
		CROSS:    "m0,-3 l0,6 m-3,-3 l6,0",
		X:        "m-3,-3 l6,6 m0,-6 l-6,6",
		TRIANGLE: "m-3,3 l3,-6 3,6 z",
		TRIANGLE_INVERTED: "m-3,-3 l3,6 3,-6 z"
	},

	defaultColors:[
		// gray skies
		"#54544c", "#858e94", "#6e767a", "#948585", "#474747"
	],

	defaultTheme: {
		// all objects are structs used directly in dojox.gfx
		chart:{
			stroke: null,
			fill: "white",
			pageStyle: null,
			titleGap:		20,
			titlePos:		"top",
			titleFont:      "normal normal bold 14pt Tahoma",	// chart title
			titleFontColor: "#333"
		},
		plotarea:{
			stroke: null,
			fill: "white"
		},
		// TODO: label rotation on axis
		axis:{
			stroke:	{ // the axis itself
				color: "#333",
				width: 1
			},
			tick: {	// used as a foundation for all ticks
				color:     "#666",
				position:  "center",
				font:      "normal normal normal 7pt Tahoma",	// labels on axis
				fontColor: "#333",								// color of labels
				labelGap:  4                                    // gap between a tick and its label in pixels
			},
			majorTick:	{ // major ticks on axis, and used for major gridlines
				width:  1,
				length: 6
			},
			minorTick:	{ // minor ticks on axis, and used for minor gridlines
				width:  0.8,
				length: 3
			},
			microTick:	{ // minor ticks on axis, and used for minor gridlines
				width:  0.5,
				length: 1
			},
			title: {
				gap:  15,
				font: "normal normal normal 11pt Tahoma",	// title font
				fontColor: "#333",							// title font color
				orientation: "axis"						// "axis": facing the axis, "away": facing away
			}
		},
		series: {
			// used as a "main" theme for series, sThemes augment it
			stroke:  {width: 1.5, color: "#333"},		// line
			outline: {width: 0.1, color: "#ccc"},		// outline
			//shadow:  {dx: 1, dy: 1, width: 2, color: [0, 0, 0, 0.3]},
			shadow: null,								// no shadow
			fill:    "#ccc",							// fill, if appropriate
			font:    "normal normal normal 8pt Tahoma",	// if there's a label
			fontColor: "#000",							// color of labels
			labelWiring: {width: 1, color: "#ccc"}		// connect marker and target data item(slice, column, bar...)
		},
		marker: {	// any markers on a series
			stroke:  {width: 1.5, color: "#333"},		// stroke
			outline: {width: 0.1, color: "#ccc"},		// outline
			//shadow:  {dx: 1, dy: 1, width: 2, color: [0, 0, 0, 0.3]},
			shadow: null,								// no shadow
			fill:    "#ccc",							// fill if needed
			font:    "normal normal normal 8pt Tahoma",	// label
			fontColor: "#000"
		},
		indicator: {
			lineStroke:  {width: 1.5, color: "#333"},		
			lineOutline: {width: 0.1, color: "#ccc"},		
			lineShadow: null,
			lineFill: null,
			stroke:  {width: 1.5, color: "#333"},		
			outline: {width: 0.1, color: "#ccc"},		
			shadow: null,								
			fill : "#ccc",
			radius: 3,
			font:    "normal normal normal 10pt Tahoma",	
			fontColor: "#000",							
			markerFill:    "#ccc",							
			markerSymbol:  "m-3,0 c0,-4 6,-4 6,0 m-6,0 c0,4 6,4 6,0",			
			markerStroke:  {width: 1.5, color: "#333"},		
			markerOutline: {width: 0.1, color: "#ccc"},		
			markerShadow: null								
		}
	}
});

return SimpleTheme;
});

},
'money/Application':function(){
// we use 'define' and not 'require' to workaround Dojo build system
// limitation that prevents from making of this file a layer if it
// using 'require'
define([
	"dojo/sniff",
	"dojo/_base/declare",
	"dojo/json",
	"dojo/dom-class",
	"dojo/currency",
	"dojo/text!./conf.json",
	'dojo/date/locale',
	'dojo/date',
	
	"dojox/app/main",
	"dojo/hash",
	"dojox/mobile/SimpleDialog",
	'money/numberpicker',
	"money/dialog",
	"money/BaseView",
	
],
	function(has, declare, json, domClass, currency, config, locale, dojodate, Application, hash, Dlg, NumberPicker, Dialog, BaseView){

		window.AppData.defaultHash = hash();
		hash("");
		
		window.AppData.BaseViewClass = BaseView		
		window.AppData.dialogWindow = new Dialog;		
		window.AppData.localeCurrency = currency;	

		if(!window.localStorage) {
			errorInitialization();
			return;		
		} 
		
		var small = 665, appConf = json.parse(config);
		// large > 860 medium <= 860  small <= 560 
		var isSmall = function(){				
			var width = window.innerWidth || document.documentElement.clientWidth;
			var height = window.innerHeight || document.documentElement.clientHeight;
			return !(width > small && height > small);
		};

		has.add("isInitiallySmall", isSmall());
		has.add("html5history", !has("ie") || has("ie") > 9);
		
		if(has("isInitiallySmall")){
			window.AppData.isInitiallySmall = true
			for(var i in appConf.views)
				appConf.views[i].constraint 	= "center"
			appConf.defaultView = "summary"
		}
		
		appConf.transition = localStorage.getItem( 'transition' ) ? localStorage.getItem( 'transition' ) : 'slide'
		appConf.defaultTransition = localStorage.getItem( 'transition' ) ? localStorage.getItem( 'transition' ) : 'slide'
		loadExchangeRates( json );

		
		
            
        
        if(localStorage.getItem('dateFrom')){
			window.AppData.dateFrom = getDate( localStorage.getItem('dateFrom'), locale )
			window.AppData.timespanMonth = getDateString(dojodate.add( window.AppData.dateFrom, 'day', 0), locale).substr(0,7) + '-01'
		}
		if(localStorage.getItem('timespan') == "lastMonth"){
			window.AppData.timespanMonth = localStorage.getItem('timespanMonth') || getDateString(new Date, locale).substr(0,7) + '-01'
			window.AppData.dateFrom = dojodate.add(getDate(window.AppData.timespanMonth, locale), 'day', 0)
			
		}
		if(window.AppData.dateFrom){
			var daysInMonth = dojodate.getDaysInMonth(dojodate.add(window.AppData.dateFrom ,'day', 0));
			window.AppData.dateTo = dojodate.add(window.AppData.dateFrom, 'day', daysInMonth)
		}

		Application(appConf);
		var dlg = new Dlg({},'customPicker')
		
		
		
		if(!window.AppData.numberPicker){
			window.AppData.numberPicker = new NumberPicker({},'numberPicker')			
			window.AppData.numberPicker.startup()
		}


		
});

},
'dojox/gfx/renderer':function(){
define(["./_base","dojo/_base/lang", "dojo/_base/sniff", "dojo/_base/window", "dojo/_base/config"],
  function(g, lang, has, win, config){
  //>> noBuildResolver
	var currentRenderer = null;

	has.add("vml", function(global, document, element){
		element.innerHTML = "<v:shape adj=\"1\"/>";
		var supported = ("adj" in element.firstChild);
		element.innerHTML = "";
		return supported;
	});

	return {
		// summary:
		//		This module is an AMD loader plugin that loads the appropriate graphics renderer
		//		implementation based on detected environment and current configuration settings.
		
		load: function(id, require, load){
			// tags:
			//      private
			if(currentRenderer && id != "force"){
				load(currentRenderer);
				return;
			}
			var renderer = config.forceGfxRenderer,
				renderers = !renderer && (lang.isString(config.gfxRenderer) ?
					config.gfxRenderer : "svg,vml,canvas,silverlight").split(","),
				silverlightObject, silverlightFlag;

			while(!renderer && renderers.length){
				switch(renderers.shift()){
					case "svg":
						// the next test is from https://github.com/phiggins42/has.js
						if("SVGAngle" in win.global){
							renderer = "svg";
						}
						break;
					case "vml":
						if(has("vml")){
							renderer = "vml";
						}
						break;
					case "silverlight":
						try{
							if(has("ie")){
								silverlightObject = new ActiveXObject("AgControl.AgControl");
								if(silverlightObject && silverlightObject.IsVersionSupported("1.0")){
									silverlightFlag = true;
								}
							}else{
								if(navigator.plugins["Silverlight Plug-In"]){
									silverlightFlag = true;
								}
							}
						}catch(e){
							silverlightFlag = false;
						}finally{
							silverlightObject = null;
						}
						if(silverlightFlag){
							renderer = "silverlight";
						}
						break;
					case "canvas":
						if(win.global.CanvasRenderingContext2D){
							renderer = "canvas";
						}
						break;
				}
			}

			if (renderer === 'canvas' && config.canvasEvents !== false) {
				renderer = "canvasWithEvents";
			}

			if(config.isDebug){
				console.log("gfx renderer = " + renderer);
			}

			function loadRenderer(){
				require(["dojox/gfx/" + renderer], function(module){
					g.renderer = renderer;
					// memorize the renderer module
					currentRenderer = module;
					// now load it
					load(module);
				});
			}
			if(renderer == "svg" && typeof window.svgweb != "undefined"){
				window.svgweb.addOnLoad(loadRenderer);
			}else{
				loadRenderer();
			}
		}
	};
});

},
'dojox/app/controllers/History':function(){
define(["dojo/_base/lang", "dojo/_base/declare", "dojo/on", "../Controller", "../utils/hash", "dojo/topic"],
function(lang, declare, on, Controller, hash, topic){
	// module:
	//		dojox/app/controllers/History
	// summary:
	//		Bind "app-domNode" event on dojox/app application instance.
	//		Bind "startTransition" event on dojox/app application domNode.
	//		Bind "popstate" event on window object.
	//		Maintain history by HTML5 "pushState" method and "popstate" event.

	return declare("dojox.app.controllers.History", Controller, {
		// _currentPosition:     Integer
		//              Persistent variable which indicates the current position/index in the history
		//              (so as to be able to figure out whether the popState event was triggerd by
		//              a backward or forward action).
		_currentPosition: 0,

		// currentState: Object
		//              Current state
		currentState: {},

		constructor: function(){
			// summary:
			//		Bind "app-domNode" event on dojox/app application instance.
			//		Bind "startTransition" event on dojox/app application domNode.
			//		Bind "popstate" event on window object.
			//

			this.events = {
				"app-domNode": this.onDomNodeChange
			};
			if(this.app.domNode){
				this.onDomNodeChange({oldNode: null, newNode: this.app.domNode});
			}
			this.bind(window, "popstate", lang.hitch(this, this.onPopState));
		},

		onDomNodeChange: function(evt){
			if(evt.oldNode != null){
				this.unbind(evt.oldNode, "startTransition");
			}
			this.bind(evt.newNode, "startTransition", lang.hitch(this, this.onStartTransition));
		},

		onStartTransition: function(evt){
			// summary:
			//		Response to dojox/app "startTransition" event.
			//
			// example:
			//		Use "dojox/mobile/TransitionEvent" to trigger "startTransition" event, and this function will response the event. For example:
			//		|	var transOpts = {
			//		|		title:"List",
			//		|		target:"items,list",
			//		|		url: "#items,list",
			//		|		params: {"param1":"p1value"}
			//		|	};
			//		|	new TransitionEvent(domNode, transOpts, e).dispatch();
			//
			// evt: Object
			//		Transition options parameter
			var currentHash = window.location.hash;
			var currentView = hash.getTarget(currentHash, this.app.defaultView);
			var currentParams =  hash.getParams(currentHash);
			var _detail = lang.clone(evt.detail);
			_detail.target = _detail.title = currentView;
			_detail.url = currentHash;
			_detail.params = currentParams;
			_detail.id = this._currentPosition;

			// Create initial state if necessary
			if(history.length == 1){
				history.pushState(_detail, _detail.href, currentHash);
			}

			// Update the current state
			_detail.bwdTransition = _detail.transition;
			lang.mixin(this.currentState, _detail);
			history.replaceState(this.currentState, this.currentState.href, currentHash);

			// Create a new "current state" history entry
			this._currentPosition += 1;
			evt.detail.id = this._currentPosition;

			var newHash = evt.detail.url || "#" + evt.detail.target;

			if(evt.detail.params){
				newHash = hash.buildWithParams(newHash, evt.detail.params);
			}

			evt.detail.fwdTransition = evt.detail.transition;
			history.pushState(evt.detail, evt.detail.href, newHash);
			this.currentState = lang.clone(evt.detail);

			// Finally: Publish pushState topic
			topic.publish("/app/history/pushState", evt.detail.target);
		},

		onPopState: function(evt){
			// summary:
			//		Response to dojox/app "popstate" event.
			//
			// evt: Object
			//		Transition options parameter

			// Clean browser's cache and refresh the current page will trigger popState event,
			// but in this situation the application has not started and throws an error.
			// So we need to check application status, if application not STARTED, do nothing.
			if((this.app.getStatus() !== this.app.lifecycle.STARTED) || !evt.state ){
				return;
			}

			// Get direction of navigation and update _currentPosition accordingly
			var backward = evt.state.id < this._currentPosition;
			backward ? this._currentPosition -= 1 : this._currentPosition += 1;

			// Publish popState topic and transition to the target view. Important: Use correct transition.
			// Reverse transitionDir only if the user navigates backwards.
			var opts = lang.mixin({reverse: backward ? true : false}, evt.state);
			opts.transition = backward ? opts.bwdTransition : opts.fwdTransition;
			this.app.emit("app-transition", {
				viewId: evt.state.target,
				opts: opts
			});
			topic.publish("/app/history/popState", evt.state.target);
		}
	});
});

},
'dojo/colors':function(){
define(["./_base/kernel", "./_base/lang", "./_base/Color", "./_base/array"], function(dojo, lang, Color, ArrayUtil){
	// module:
	//		dojo/colors

	/*=====
	return {
		// summary:
		//		Color utilities, extending Base dojo.Color
	};
	=====*/

	var ColorExt = {};
	lang.setObject("dojo.colors", ColorExt);

//TODO: this module appears to break naming conventions

	// this is a standard conversion prescribed by the CSS3 Color Module
	var hue2rgb = function(m1, m2, h){
		if(h < 0){ ++h; }
		if(h > 1){ --h; }
		var h6 = 6 * h;
		if(h6 < 1){ return m1 + (m2 - m1) * h6; }
		if(2 * h < 1){ return m2; }
		if(3 * h < 2){ return m1 + (m2 - m1) * (2 / 3 - h) * 6; }
		return m1;
	};
	// Override base Color.fromRgb with the impl in this module
	dojo.colorFromRgb = Color.fromRgb = function(/*String*/ color, /*dojo/_base/Color?*/ obj){
		// summary:
		//		get rgb(a) array from css-style color declarations
		// description:
		//		this function can handle all 4 CSS3 Color Module formats: rgb,
		//		rgba, hsl, hsla, including rgb(a) with percentage values.
		var m = color.toLowerCase().match(/^(rgba?|hsla?)\(([\s\.\-,%0-9]+)\)/);
		if(m){
			var c = m[2].split(/\s*,\s*/), l = c.length, t = m[1], a;
			if((t == "rgb" && l == 3) || (t == "rgba" && l == 4)){
				var r = c[0];
				if(r.charAt(r.length - 1) == "%"){
					// 3 rgb percentage values
					a = ArrayUtil.map(c, function(x){
						return parseFloat(x) * 2.56;
					});
					if(l == 4){ a[3] = c[3]; }
					return Color.fromArray(a, obj); // dojo/_base/Color
				}
				return Color.fromArray(c, obj); // dojo/_base/Color
			}
			if((t == "hsl" && l == 3) || (t == "hsla" && l == 4)){
				// normalize hsl values
				var H = ((parseFloat(c[0]) % 360) + 360) % 360 / 360,
					S = parseFloat(c[1]) / 100,
					L = parseFloat(c[2]) / 100,
					// calculate rgb according to the algorithm
					// recommended by the CSS3 Color Module
					m2 = L <= 0.5 ? L * (S + 1) : L + S - L * S,
					m1 = 2 * L - m2;
				a = [
					hue2rgb(m1, m2, H + 1 / 3) * 256,
					hue2rgb(m1, m2, H) * 256,
					hue2rgb(m1, m2, H - 1 / 3) * 256,
					1
				];
				if(l == 4){ a[3] = c[3]; }
				return Color.fromArray(a, obj); // dojo/_base/Color
			}
		}
		return null;	// dojo/_base/Color
	};

	var confine = function(c, low, high){
		// summary:
		//		sanitize a color component by making sure it is a number,
		//		and clamping it to valid values
		c = Number(c);
		return isNaN(c) ? high : c < low ? low : c > high ? high : c;	// Number
	};

	Color.prototype.sanitize = function(){
		// summary:
		//		makes sure that the object has correct attributes
		var t = this;
		t.r = Math.round(confine(t.r, 0, 255));
		t.g = Math.round(confine(t.g, 0, 255));
		t.b = Math.round(confine(t.b, 0, 255));
		t.a = confine(t.a, 0, 1);
		return this;	// dojo/_base/Color
	};

	ColorExt.makeGrey = Color.makeGrey = function(/*Number*/ g, /*Number?*/ a){
		// summary:
		//		creates a greyscale color with an optional alpha
		return Color.fromArray([g, g, g, a]);	// dojo/_base/Color
	};

	// mixin all CSS3 named colors not already in _base, along with SVG 1.0 variant spellings
	lang.mixin(Color.named, {
		"aliceblue":	[240,248,255],
		"antiquewhite": [250,235,215],
		"aquamarine":	[127,255,212],
		"azure":	[240,255,255],
		"beige":	[245,245,220],
		"bisque":	[255,228,196],
		"blanchedalmond":	[255,235,205],
		"blueviolet":	[138,43,226],
		"brown":	[165,42,42],
		"burlywood":	[222,184,135],
		"cadetblue":	[95,158,160],
		"chartreuse":	[127,255,0],
		"chocolate":	[210,105,30],
		"coral":	[255,127,80],
		"cornflowerblue":	[100,149,237],
		"cornsilk": [255,248,220],
		"crimson":	[220,20,60],
		"cyan": [0,255,255],
		"darkblue": [0,0,139],
		"darkcyan": [0,139,139],
		"darkgoldenrod":	[184,134,11],
		"darkgray": [169,169,169],
		"darkgreen":	[0,100,0],
		"darkgrey": [169,169,169],
		"darkkhaki":	[189,183,107],
		"darkmagenta":	[139,0,139],
		"darkolivegreen":	[85,107,47],
		"darkorange":	[255,140,0],
		"darkorchid":	[153,50,204],
		"darkred":	[139,0,0],
		"darksalmon":	[233,150,122],
		"darkseagreen": [143,188,143],
		"darkslateblue":	[72,61,139],
		"darkslategray":	[47,79,79],
		"darkslategrey":	[47,79,79],
		"darkturquoise":	[0,206,209],
		"darkviolet":	[148,0,211],
		"deeppink": [255,20,147],
		"deepskyblue":	[0,191,255],
		"dimgray":	[105,105,105],
		"dimgrey":	[105,105,105],
		"dodgerblue":	[30,144,255],
		"firebrick":	[178,34,34],
		"floralwhite":	[255,250,240],
		"forestgreen":	[34,139,34],
		"gainsboro":	[220,220,220],
		"ghostwhite":	[248,248,255],
		"gold": [255,215,0],
		"goldenrod":	[218,165,32],
		"greenyellow":	[173,255,47],
		"grey": [128,128,128],
		"honeydew": [240,255,240],
		"hotpink":	[255,105,180],
		"indianred":	[205,92,92],
		"indigo":	[75,0,130],
		"ivory":	[255,255,240],
		"khaki":	[240,230,140],
		"lavender": [230,230,250],
		"lavenderblush":	[255,240,245],
		"lawngreen":	[124,252,0],
		"lemonchiffon": [255,250,205],
		"lightblue":	[173,216,230],
		"lightcoral":	[240,128,128],
		"lightcyan":	[224,255,255],
		"lightgoldenrodyellow": [250,250,210],
		"lightgray":	[211,211,211],
		"lightgreen":	[144,238,144],
		"lightgrey":	[211,211,211],
		"lightpink":	[255,182,193],
		"lightsalmon":	[255,160,122],
		"lightseagreen":	[32,178,170],
		"lightskyblue": [135,206,250],
		"lightslategray":	[119,136,153],
		"lightslategrey":	[119,136,153],
		"lightsteelblue":	[176,196,222],
		"lightyellow":	[255,255,224],
		"limegreen":	[50,205,50],
		"linen":	[250,240,230],
		"magenta":	[255,0,255],
		"mediumaquamarine": [102,205,170],
		"mediumblue":	[0,0,205],
		"mediumorchid": [186,85,211],
		"mediumpurple": [147,112,219],
		"mediumseagreen":	[60,179,113],
		"mediumslateblue":	[123,104,238],
		"mediumspringgreen":	[0,250,154],
		"mediumturquoise":	[72,209,204],
		"mediumvioletred":	[199,21,133],
		"midnightblue": [25,25,112],
		"mintcream":	[245,255,250],
		"mistyrose":	[255,228,225],
		"moccasin": [255,228,181],
		"navajowhite":	[255,222,173],
		"oldlace":	[253,245,230],
		"olivedrab":	[107,142,35],
		"orange":	[255,165,0],
		"orangered":	[255,69,0],
		"orchid":	[218,112,214],
		"palegoldenrod":	[238,232,170],
		"palegreen":	[152,251,152],
		"paleturquoise":	[175,238,238],
		"palevioletred":	[219,112,147],
		"papayawhip":	[255,239,213],
		"peachpuff":	[255,218,185],
		"peru": [205,133,63],
		"pink": [255,192,203],
		"plum": [221,160,221],
		"powderblue":	[176,224,230],
		"rosybrown":	[188,143,143],
		"royalblue":	[65,105,225],
		"saddlebrown":	[139,69,19],
		"salmon":	[250,128,114],
		"sandybrown":	[244,164,96],
		"seagreen": [46,139,87],
		"seashell": [255,245,238],
		"sienna":	[160,82,45],
		"skyblue":	[135,206,235],
		"slateblue":	[106,90,205],
		"slategray":	[112,128,144],
		"slategrey":	[112,128,144],
		"snow": [255,250,250],
		"springgreen":	[0,255,127],
		"steelblue":	[70,130,180],
		"tan":	[210,180,140],
		"thistle":	[216,191,216],
		"tomato":	[255,99,71],
		"turquoise":	[64,224,208],
		"violet":	[238,130,238],
		"wheat":	[245,222,179],
		"whitesmoke":	[245,245,245],
		"yellowgreen":	[154,205,50]
	});

	return Color;	// TODO: return ColorExt, not Color
});

},
'dojox/lang/functional/reversed':function(){
define(["dojo/_base/lang", "dojo/_base/kernel" ,"./lambda"],
	function(lang, kernel, df){
// This module adds high-level functions and related constructs:
//	- reversed versions of array-processing functions similar to standard JS functions

// Notes:
//	- this module provides reversed versions of standard array-processing functions:
//		forEachRev, mapRev, filterRev

// Defined methods:
//	- take any valid lambda argument as the functional argument
//	- operate on dense arrays
//	- take a string as the array argument

	lang.mixin(df, {
		// JS 1.6 standard array functions, which can take a lambda as a parameter.
		// Consider using dojo._base.array functions, if you don't need the lambda support.
		filterRev: function(/*Array|String*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary:
			//		creates a new array with all elements that pass the test
			//		implemented by the provided function.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || kernel.global; f = df.lambda(f);
			var t = [], v, i = a.length - 1;
			for(; i >= 0; --i){
				v = a[i];
				if(f.call(o, v, i, a)){ t.push(v); }
			}
			return t;	// Array
		},
		forEachRev: function(/*Array|String*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary:
			//		executes a provided function once per array element.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || kernel.global; f = df.lambda(f);
			for(var i = a.length - 1; i >= 0; f.call(o, a[i], i, a), --i);
		},
		mapRev: function(/*Array|String*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary:
			//		creates a new array with the results of calling
			//		a provided function on every element in this array.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || kernel.global; f = df.lambda(f);
			var n = a.length, t = new Array(n), i = n - 1, j = 0;
			for(; i >= 0; t[j++] = f.call(o, a[i], i, a), --i);
			return t;	// Array
		},
		everyRev: function(/*Array|String*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary:
			//		tests whether all elements in the array pass the test
			//		implemented by the provided function.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || kernel.global; f = df.lambda(f);
			for(var i = a.length - 1; i >= 0; --i){
				if(!f.call(o, a[i], i, a)){
					return false;	// Boolean
				}
			}
			return true;	// Boolean
		},
		someRev: function(/*Array|String*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary:
			//		tests whether some element in the array passes the test
			//		implemented by the provided function.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || kernel.global; f = df.lambda(f);
			for(var i = a.length - 1; i >= 0; --i){
				if(f.call(o, a[i], i, a)){
					return true;	// Boolean
				}
			}
			return false;	// Boolean
		}
	});
	
	return df;
});

},
'dojox/charting/themes/gradientGenerator':function(){
define(["dojo/_base/lang", "dojo/_base/array", "dojo/_base/Color", "../Theme", "dojox/color/_base", "./common"], 
	function(lang, arr, Color, Theme, dxcolor, themes){
	
	var gg = lang.getObject("gradientGenerator", true, themes);

	gg.generateFills = function(colors, fillPattern, lumFrom, lumTo){
		// summary:
		//		generates 2-color gradients using pure colors, a fill pattern, and two luminance values
		// colors: Array
		//		Array of colors to generate gradients for each.
		// fillPattern: Object
		//		Gradient fill descriptor which colors list will be generated.
		// lumFrom: Number
		//		Initial luminance value (0-100).
		// lumTo: Number
		//		Final luminance value (0-100).
		return arr.map(colors, function(c){	// Array
			return Theme.generateHslGradient(c, fillPattern, lumFrom, lumTo);
		});
	};
	
	gg.updateFills = function(themes, fillPattern, lumFrom, lumTo){
		// summary:
		//		transforms solid color fills into 2-color gradients using a fill pattern, and two luminance values
		// themes: Array
		//		Array of mini-themes (usually series themes or marker themes), which fill will be transformed.
		// fillPattern: Object
		//		Gradient fill descriptor which colors list will be generated.
		// lumFrom: Number
		//		Initial luminance value (0-100).
		// lumTo: Number
		//		Final luminance value (0-100).
		arr.forEach(themes, function(t){
			if(t.fill && !t.fill.type){
				t.fill = Theme.generateHslGradient(t.fill, fillPattern, lumFrom, lumTo);
			}
		});
	};
	
	gg.generateMiniTheme = function(colors, fillPattern, lumFrom, lumTo, lumStroke){
		// summary:
		//		generates mini-themes with 2-color gradients using colors, a fill pattern, and three luminance values
		// colors: Array
		//		Array of colors to generate gradients for each.
		// fillPattern: Object
		//		Gradient fill descriptor which colors list will be generated.
		// lumFrom: Number
		//		Initial luminance value (0-100).
		// lumTo: Number
		//		Final luminance value (0-100).
		// lumStroke: Number
		//		Stroke luminance value (0-100).
		return arr.map(colors, function(c){	// Array
			c = new dxcolor.Color(c);
			return {
				fill:   Theme.generateHslGradient(c, fillPattern, lumFrom, lumTo),
				stroke: {color: Theme.generateHslColor(c, lumStroke)}
			};
		});
	};
	
	gg.generateGradientByIntensity = function(color, intensityMap){
		// summary:
		//		generates gradient colors using an intensity map
		// color: dojo.Color
		//		Color to use to generate gradients.
		// intensityMap: Array
		//		Array of tuples {o, i}, where o is a gradient offset (0-1),
		//		and i is an intensity (0-255).
		color = new Color(color);
		return arr.map(intensityMap, function(stop){	// Array
			var s = stop.i / 255;
			return {
				offset: stop.o,
				color:  new Color([color.r * s, color.g * s, color.b * s, color.a])
			};
		});
	};
	
	return gg;
});

},
'money/views/charts':function(){
define(["dojo/_base/declare","dojo/dom","dojo/dom-class", "dojo/sniff","dojo/dom-style","dojo/date",
	"dojox/charting/Chart", "dojo/_base/array", "dojo/_base/window","dojo/on",
    "dojo/dom-attr","dojo/date/locale",
    // Require the theme of our choosing
    "dojox/charting/themes/Shrooms",
    
    "dojox/charting/plot2d/Pie","dojox/charting/widget/Legend", "dojox/mobile/ListItem", 
    "dojox/charting/axis2d/Default", "dojox/charting/plot2d/ClusteredColumns", "dojox/mobile/Accordion",'dojox/mobile/ContentPane',
    'dojo/text!money/views/charts.html'],
    function(declare,dom,domClass,has,domStyle,dojodate, Chart, arrayUtil, win, on,domAttr,locale, theme, PiePlot, Legend, ListItem, Default, BarChart){
    
	return window.AppData.objChart = {
		legendTemplate : '<span class="chart-legend-label" onclick="goTo(\'list\',{byTags: \'${tagsId}\', type: \'${type}\'})"><div class="mblListItemRightIcon"><div title="" class="mblDomButtonArrow mblDomButton"><div><div><div><div></div></div></div></div></div></div>'+'</span><span class="chart-label"><span class="chart-label-text">${num} * ${tags}</span>&nbsp;<span class="chart-label-amount">${amount} (${percents}%)</span></span>',
		
		
		
		getQuery: function( allDataMode ){
			var res = new this.queryIdb
			res.allData = allDataMode;
			return res;
		},
		
		// does THE item should be queried or not?
		
		queryIdb: function(){
			this.allData = false;
			var from;
			this.from = function(){
				console.log( this.allData )
				if( this.allData || 
					window.AppData.timespan == 'noneTimespan' && 
					!window.AppData.useDateImportant)
					return undefined;
				if( window.AppData.timespan == 'lastMonth') {
					console.log( window.AppData.timespanMonth )
					from = getDate( window.AppData.timespanMonth, locale )
					return from
				}
				if( window.AppData.timespan == 'customTimespan') {
					from = new Date;
					from = new Date( from.getFullYear(), from.getMonth(), 1);
					//console.log(from)
					var daysInMonth = dojodate.getDaysInMonth(from) 
					//window.AppData.dateFrom		 = dojodate.add( from, "day", -1);
					return from
					//window.AppData.dateTo 		 = dojodate.add( from, "day", daysInMonth -1 );				
				}
				return window.AppData.dateFrom ? 
					window.AppData.dateFrom : (
						window.AppData.dateFrom = 
							dojodate.add(new Date, "day", -dojodate.getDaysInMonth(new Date))
					)
			}
			this.to = function(){
				if( this.allData || 
					window.AppData.timespan == 'noneTimespan' && 
					!window.AppData.useDateImportant)
					return undefined;
				if( window.AppData.timespan == 'lastMonth') {
					console.log( window.AppData.timespanMonth )
					from = getDate( window.AppData.timespanMonth, locale )
					var daysInMonth = dojodate.getDaysInMonth(from) 
					return dojodate.add( from, "day", daysInMonth -1 );	
				}
				if( window.AppData.timespan == 'customTimespan') {
					from = new Date;
					from = new Date( from.getFullYear(), from.getMonth(), 1);
					console.log(from)
					var daysInMonth = dojodate.getDaysInMonth(from) 
					return dojodate.add( from, "day", daysInMonth -1 );				
				}	
				return window.AppData.dateTo ? 
					window.AppData.dateTo : (
						window.AppData.dateTo = new Date
					)
			}
			this.type = function(){ 
				return undefined //this.allData ? undefined :
					window.AppData.currentType
			}
		},
		
		
		_buildSummary: function(){
			window.AppData.chartsView.allData = true //type-independant query mode
			
			//data - is data of current type
			//data2 - all data in store
			var data = window.AppData.store.query( this.getQuery( false ) ),
				data2 = window.AppData.store.query( this.getQuery( true ) )
				e = 0, i = 0, t = 0, self = this;
			
			window.AppData.chartsView.allData = false //type-dependant query mode
			
			var accData = window.AppData.accountStore.query()
			var accs = {}
			
			domStyle.set('no-accounts-chart','display', !accData.length? 'block':'none')
			domStyle.set('sum-acc','display', accData.length? 'block':'none')
			
			// start accounts sum counting from startAmount
			arrayUtil.forEach(accData, function(account){
				if(account.id){
					accs[account.id] = Number(account.startAmount ? account.startAmount : 0)
				}
			})
			
			console.log(accs)
			// get transaction summary by types
			data.then(function(result){
				arrayUtil.forEach(result.items, function(item){
					if (item.type == "e") e += parseFloat(item.amountHome);
					else if (item.type == "i") i += parseFloat(item.amountHome);
					else if (item.type == "t") t += Math.abs(parseFloat(item.amountHome));
				})
				
				self.sumE.set('rightText',getMoney(e,window.AppData.currency))
				self.sumI.set('rightText',getMoney(i,window.AppData.currency))
				self.sumT.set('rightText',getMoney(t,window.AppData.currency))
			
			})
			
			data2.then( function(result){
				arrayUtil.forEach(result.items, function(item){
					var amount = 
						item.type == "t" ? -Number(item.amount) : Number(item.amount);
					
					//console.log(item.account)
					if(item.account){
						accs[item.account] = 
							(accs[item.account] ? 
								( accs[item.account] + amount ) : amount )
						if( ( item.type=="t" ) && ( item.accountTo ) ) {
							accs[item.accountTo] =
							(accs[item.accountTo] ? 
								( accs[item.accountTo] + Number(item.sumTo) ) : 
								+ Number(item.sumTo));
							
						}
					}
				})
				
				arrayUtil.forEach(self.sumAcc.getChildren(), function(acc){
					acc.destroyRecursive();
				})
				
				var sumAll = 0;
				for (var i in accs){
					sumAll += fx( Number(accs[i]) )
						.from( window.AppData.accountStore.get(i).maincur )
						.to( window.AppData.currency );
					
					self.sumAcc.addChild( new ListItem({
						label		: window.AppData.accountStore.get(i).label,
						rightText	: getMoney(accs[i], window.AppData.accountStore.get(i).maincur)
					}))
				}
				domAttr.set('acc-sum','innerHTML',getMoney(sumAll,window.AppData.currency))
			})	
			
		},
		
		afterActivate: function(contact){
			// x and y coordinates used for easy understanding of where they should display
			// Data represents website visits over a week period
			
			this._buildSummary()
			
        },
        
        init: function(){
			window.AppData.chartsView = this

			if(!this._isInheritedFromBaseView)
				new window.AppData.BaseViewClass( this, 1 /* Do not overwrite existing objects*/ );			
			
			var self = this
			if(!has('isInitiallySmall'))
				domClass.add(this.backButton.domNode,'hideOnMedium hideOnLarge')
			
			
			
        }        
    };
});

},
'dojox/charting/Chart':function(){
define(["../main", "dojo/_base/lang", "dojo/_base/array","dojo/_base/declare", "dojo/dom-style",
	"dojo/dom", "dojo/dom-geometry", "dojo/dom-construct","dojo/_base/Color", "dojo/sniff",
	"./Element", "./SimpleTheme", "./Series", "./axis2d/common", "dojox/gfx/shape",
	"dojox/gfx", "dojo/has!dojo-bidi?./bidi/Chart", "dojox/lang/functional", "dojox/lang/functional/fold", "dojox/lang/functional/reversed"],
	function(dojox, lang, arr, declare, domStyle,
	 		 dom, domGeom, domConstruct, Color, has,
	 		 Element, SimpleTheme, Series, common, shape,
	 		 g, BidiChart, func){
	/*=====
	var __ChartCtorArgs = {
		// summary:
		//		The keyword arguments that can be passed in a Chart constructor.
		// margins: Object?
		//		Optional margins for the chart, in the form of { l, t, r, b}.
		// stroke: dojox.gfx.Stroke?
		//		An optional outline/stroke for the chart.
		// fill: dojox.gfx.Fill?
		//		An optional fill for the chart.
		// delayInMs: Number
		//		Delay in ms for delayedRender(). Default: 200.
	};
	=====*/

	/*=====
	var __SeriesCtorArgs = {
		// summary:
		//		An optional arguments object that can be used in the Series constructor.
		// plot: String?
		//		The plot (by name) that this series belongs to.
	};
	=====*/

	/*=====
	var __BaseAxisCtorArgs = {
		// summary:
		//		Optional arguments used in the definition of an invisible axis.
		// vertical: Boolean?
		//		A flag that says whether an axis is vertical (i.e. y axis) or horizontal. Default is false (horizontal).
		// min: Number?
		//		The smallest value on an axis. Default is 0.
		// max: Number?
		//		The largest value on an axis. Default is 1.
	};
	=====*/

	var dc = lang.getObject("charting", true, dojox),
		clear = func.lambda("item.clear()"),
		purge = func.lambda("item.purgeGroup()"),
		destroy = func.lambda("item.destroy()"),
		makeClean = func.lambda("item.dirty = false"),
		makeDirty = func.lambda("item.dirty = true"),
		getName = func.lambda("item.name");

	var Chart = declare(has("dojo-bidi")? "dojox.charting.NonBidiChart" : "dojox.charting.Chart", null, {
		// summary:
		//		The main chart object in dojox.charting.  This will create a two dimensional
		//		chart based on dojox.gfx.
		//
		// description:
		//		dojox.charting.Chart is the primary object used for any kind of charts.  It
		//		is simple to create--just pass it a node reference, which is used as the
		//		container for the chart--and a set of optional keyword arguments and go.
		//
		//		Note that like most of dojox.gfx, most of dojox.charting.Chart's methods are
		//		designed to return a reference to the chart itself, to allow for functional
		//		chaining.  This makes defining everything on a Chart very easy to do.
		//
		// example:
		//		Create an area chart, with smoothing.
		//	|	require(["dojox/charting/Chart", "dojox/charting/themes/Shrooms", "dojox/charting/plot2d/Areas", ...],
		// 	|		function(Chart, Shrooms, Areas, ...){
		//	|		new Chart(node)
		//	|			.addPlot("default", { type: Areas, tension: "X" })
		//	|			.setTheme(Shrooms)
		//	|			.addSeries("Series A", [1, 2, 0.5, 1.5, 1, 2.8, 0.4])
		//	|			.addSeries("Series B", [2.6, 1.8, 2, 1, 1.4, 0.7, 2])
		//	|			.addSeries("Series C", [6.3, 1.8, 3, 0.5, 4.4, 2.7, 2])
		//	|			.render();
		//	|	});
		//
		// example:
		//		The form of data in a data series can take a number of forms: a simple array,
		//		an array of objects {x,y}, or something custom (as determined by the plot).
		//		Here's an example of a Candlestick chart, which expects an object of
		//		{ open, high, low, close }.
		//	|	require(["dojox/charting/Chart", "dojox/charting/plot2d/Candlesticks", ...],
		// 	|		function(Chart, Candlesticks, ...){
		//	|		new Chart(node)
		//	|			.addPlot("default", {type: Candlesticks, gap: 1})
		//	|			.addAxis("x", {fixLower: "major", fixUpper: "major", includeZero: true})
		//	|			.addAxis("y", {vertical: true, fixLower: "major", fixUpper: "major", natural: true})
		//	|			.addSeries("Series A", [
		//	|					{ open: 20, close: 16, high: 22, low: 8 },
		//	|					{ open: 16, close: 22, high: 26, low: 6, mid: 18 },
		//	|					{ open: 22, close: 18, high: 22, low: 11, mid: 21 },
		//	|					{ open: 18, close: 29, high: 32, low: 14, mid: 27 },
		//	|					{ open: 29, close: 24, high: 29, low: 13, mid: 27 },
		//	|					{ open: 24, close: 8, high: 24, low: 5 },
		//	|					{ open: 8, close: 16, high: 22, low: 2 },
		//	|					{ open: 16, close: 12, high: 19, low: 7 },
		//	|					{ open: 12, close: 20, high: 22, low: 8 },
		//	|					{ open: 20, close: 16, high: 22, low: 8 },
		//	|					{ open: 16, close: 22, high: 26, low: 6, mid: 18 },
		//	|					{ open: 22, close: 18, high: 22, low: 11, mid: 21 },
		//	|					{ open: 18, close: 29, high: 32, low: 14, mid: 27 },
		//	|					{ open: 29, close: 24, high: 29, low: 13, mid: 27 },
		//	|					{ open: 24, close: 8, high: 24, low: 5 },
		//	|					{ open: 8, close: 16, high: 22, low: 2 },
		//	|					{ open: 16, close: 12, high: 19, low: 7 },
		//	|					{ open: 12, close: 20, high: 22, low: 8 },
		//	|					{ open: 20, close: 16, high: 22, low: 8 },
		//	|					{ open: 16, close: 22, high: 26, low: 6 },
		//	|					{ open: 22, close: 18, high: 22, low: 11 },
		//	|					{ open: 18, close: 29, high: 32, low: 14 },
		//	|					{ open: 29, close: 24, high: 29, low: 13 },
		//	|					{ open: 24, close: 8, high: 24, low: 5 },
		//	|					{ open: 8, close: 16, high: 22, low: 2 },
		//	|					{ open: 16, close: 12, high: 19, low: 7 },
		//	|					{ open: 12, close: 20, high: 22, low: 8 },
		//	|					{ open: 20, close: 16, high: 22, low: 8 }
		//	|				],
		//	|				{ stroke: { color: "green" }, fill: "lightgreen" }
		//	|			)
		//	|			.render();
		//	|	});
		
		// theme: dojox/charting/SimpleTheme?
		//		An optional theme to use for styling the chart.
		// axes: dojox/charting/axis2d/Base{}?
		//		A map of axes for use in plotting a chart.
		// stack: dojox/charting/plot2d/Base[]
		//		A stack of plotters.
		// plots: dojox/charting/plot2d/Base{}
		//		A map of plotter indices
		// series: dojox/charting/Series[]
		//		The stack of data runs used to create plots.
		// runs: dojox/charting/Series{}
		//		A map of series indices
		// margins: Object?
		//		The margins around the chart. Default is { l:10, t:10, r:10, b:10 }.
		// stroke: dojox.gfx.Stroke?
		//		The outline of the chart (stroke in vector graphics terms).
		// fill: dojox.gfx.Fill?
		//		The color for the chart.
		// node: DOMNode
		//		The container node passed to the constructor.
		// surface: dojox/gfx/shape.Surface
		//		The main graphics surface upon which a chart is drawn.
		// dirty: Boolean
		//		A boolean flag indicating whether or not the chart needs to be updated/re-rendered.
		// htmlLabels: Boolean
		//		A boolean flag indicating whether or not it should try to use HTML-based labels for the title or not.
		//		The default is true.  The only caveat is IE and Opera browsers will always use GFX-based labels.

		constructor: function(/* DOMNode */node, /* __ChartCtorArgs? */kwArgs){
			// summary:
			//		The constructor for a new Chart.  Initializes all parameters used for a chart.
			// returns: dojox/charting/Chart
			//		The newly created chart.

			// initialize parameters
			if(!kwArgs){ kwArgs = {}; }
			this.margins   = kwArgs.margins ? kwArgs.margins : {l: 10, t: 10, r: 10, b: 10};
			this.stroke    = kwArgs.stroke;
			this.fill      = kwArgs.fill;
			this.delayInMs = kwArgs.delayInMs || 200;
			this.title     = kwArgs.title;
			this.titleGap  = kwArgs.titleGap;
			this.titlePos  = kwArgs.titlePos;
			this.titleFont = kwArgs.titleFont;
			this.titleFontColor = kwArgs.titleFontColor;
			this.chartTitle = null;
			this.htmlLabels = true;
			if("htmlLabels" in kwArgs){
				this.htmlLabels = kwArgs.htmlLabels;
			}

			// default initialization
			this.theme = null;
			this.axes = {};		// map of axes
			this.stack = [];	// stack of plotters
			this.plots = {};	// map of plotter indices
			this.series = [];	// stack of data runs
			this.runs = {};		// map of data run indices
			this.dirty = true;

			// create a surface
			this.node = dom.byId(node);
			var box = domGeom.getMarginBox(node);
			this.surface = g.createSurface(this.node, box.w || 400, box.h || 300);
			if(this.surface.declaredClass.indexOf("vml") == -1){
				// except if vml use native clipping
				this._nativeClip = true;
			}
		},
		destroy: function(){
			// summary:
			//		Cleanup when a chart is to be destroyed.
			// returns: void
			arr.forEach(this.series, destroy);
			arr.forEach(this.stack,  destroy);
			func.forIn(this.axes, destroy);
			this.surface.destroy();
			if(this.chartTitle && this.chartTitle.tagName){
				// destroy title if it is a DOM node
				domConstruct.destroy(this.chartTitle);
			}
		},
		getCoords: function(){
			// summary:
			//		Get the coordinates and dimensions of the containing DOMNode, as
			//		returned by dojo.coords.
			// returns: Object
			//		The resulting coordinates of the chart.  See dojo.coords for details.
			var node = this.node;
			var s = domStyle.getComputedStyle(node), coords = domGeom.getMarginBox(node, s);
			var abs = domGeom.position(node, true);
			coords.x = abs.x;
			coords.y = abs.y;
			return coords;	//	Object
		},
		setTheme: function(theme){
			// summary:
			//		Set a theme of the chart.
			// theme: dojox/charting/SimpleTheme
			//		The theme to be used for visual rendering.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			this.theme = theme.clone();
			this.dirty = true;
			return this;	//	dojox/charting/Chart
		},
		addAxis: function(name, kwArgs){
			// summary:
			//		Add an axis to the chart, for rendering.
			// name: String
			//		The name of the axis.
			// kwArgs: __BaseAxisCtorArgs?
			//		An optional keyword arguments object for use in defining details of an axis.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			var axis, axisType = kwArgs && kwArgs.type || "Default";
			if(typeof axisType == "string"){
				if(!dc.axis2d || !dc.axis2d[axisType]){
					throw Error("Can't find axis: " + axisType + " - Check " + "require() dependencies.");
				}
				axis = new dc.axis2d[axisType](this, kwArgs);
			}else{
				axis = new axisType(this, kwArgs);
			}
			axis.name = name;
			axis.dirty = true;
			if(name in this.axes){
				this.axes[name].destroy();
			}
			this.axes[name] = axis;
			this.dirty = true;
			return this;	//	dojox/charting/Chart
		},
		getAxis: function(name){
			// summary:
			//		Get the given axis, by name.
			// name: String
			//		The name the axis was defined by.
			// returns: dojox/charting/axis2d/Default
			//		The axis as stored in the chart's axis map.
			return this.axes[name];	//	dojox/charting/axis2d/Default
		},
		removeAxis: function(name){
			// summary:
			//		Remove the axis that was defined using name.
			// name: String
			//		The axis name, as defined in addAxis.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			if(name in this.axes){
				// destroy the axis
				this.axes[name].destroy();
				delete this.axes[name];
				// mark the chart as dirty
				this.dirty = true;
			}
			return this;	//	dojox/charting/Chart
		},
		addPlot: function(name, kwArgs){
			// summary:
			//		Add a new plot to the chart, defined by name and using the optional keyword arguments object.
			//		Note that dojox.charting assumes the main plot to be called "default"; if you do not have
			//		a plot called "default" and attempt to add data series to the chart without specifying the
			//		plot to be rendered on, you WILL get errors.
			// name: String
			//		The name of the plot to be added to the chart.  If you only plan on using one plot, call it "default".
			// kwArgs: dojox.charting.plot2d.__PlotCtorArgs
			//		An object with optional parameters for the plot in question.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			var plot, plotType = kwArgs && kwArgs.type || "Default";
			if(typeof plotType == "string"){
				if(!dc.plot2d || !dc.plot2d[plotType]){
					throw Error("Can't find plot: " + plotType + " - didn't you forget to dojo" + ".require() it?");
				}
				plot = new dc.plot2d[plotType](this, kwArgs);
			}else{
				plot = new plotType(this, kwArgs);
			}
			plot.name = name;
			plot.dirty = true;
			if(name in this.plots){
				this.stack[this.plots[name]].destroy();
				this.stack[this.plots[name]] = plot;
			}else{
				this.plots[name] = this.stack.length;
				this.stack.push(plot);
			}
			this.dirty = true;
			return this;	//	dojox/charting/Chart
		},
		getPlot: function(name){
			// summary:
			//		Get the given plot, by name.
			// name: String
			//		The name the plot was defined by.
			// returns: dojox/charting/plot2d/Base
			//		The plot.
			return this.stack[this.plots[name]];
		},
		removePlot: function(name){
			// summary:
			//		Remove the plot defined using name from the chart's plot stack.
			// name: String
			//		The name of the plot as defined using addPlot.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			if(name in this.plots){
				// get the index and remove the name
				var index = this.plots[name];
				delete this.plots[name];
				// destroy the plot
				this.stack[index].destroy();
				// remove the plot from the stack
				this.stack.splice(index, 1);
				// update indices to reflect the shift
				func.forIn(this.plots, function(idx, name, plots){
					if(idx > index){
						plots[name] = idx - 1;
					}
				});
				// remove all related series
				var ns = arr.filter(this.series, function(run){ return run.plot != name; });
				if(ns.length < this.series.length){
					// kill all removed series
					arr.forEach(this.series, function(run){
						if(run.plot == name){
							run.destroy();
						}
					});
					// rebuild all necessary data structures
					this.runs = {};
					arr.forEach(ns, function(run, index){
						this.runs[run.plot] = index;
					}, this);
					this.series = ns;
				}
				// mark the chart as dirty
				this.dirty = true;
			}
			return this;	//	dojox/charting/Chart
		},
		getPlotOrder: function(){
			// summary:
			//		Returns an array of plot names in the current order
			//		(the top-most plot is the first).
			// returns: Array
			return func.map(this.stack, getName); // Array
		},
		setPlotOrder: function(newOrder){
			// summary:
			//		Sets new order of plots. newOrder cannot add or remove
			//		plots. Wrong names, or dups are ignored.
			// newOrder: Array
			//		Array of plot names compatible with getPlotOrder().
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			var names = {},
				order = func.filter(newOrder, function(name){
					if(!(name in this.plots) || (name in names)){
						return false;
					}
					names[name] = 1;
					return true;
				}, this);
			if(order.length < this.stack.length){
				func.forEach(this.stack, function(plot){
					var name = plot.name;
					if(!(name in names)){
						order.push(name);
					}
				});
			}
			var newStack = func.map(order, function(name){
					return this.stack[this.plots[name]];
				}, this);
			func.forEach(newStack, function(plot, i){
				this.plots[plot.name] = i;
			}, this);
			this.stack = newStack;
			this.dirty = true;
			return this;	//	dojox/charting/Chart
		},
		movePlotToFront: function(name){
			// summary:
			//		Moves a given plot to front.
			// name: String
			//		Plot's name to move.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			if(name in this.plots){
				var index = this.plots[name];
				if(index){
					var newOrder = this.getPlotOrder();
					newOrder.splice(index, 1);
					newOrder.unshift(name);
					return this.setPlotOrder(newOrder);	//	dojox/charting/Chart
				}
			}
			return this;	//	dojox/charting/Chart
		},
		movePlotToBack: function(name){
			// summary:
			//		Moves a given plot to back.
			// name: String
			//		Plot's name to move.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			if(name in this.plots){
				var index = this.plots[name];
				if(index < this.stack.length - 1){
					var newOrder = this.getPlotOrder();
					newOrder.splice(index, 1);
					newOrder.push(name);
					return this.setPlotOrder(newOrder);	//	dojox/charting/Chart
				}
			}
			return this;	//	dojox/charting/Chart
		},
		addSeries: function(name, data, kwArgs){
			// summary:
			//		Add a data series to the chart for rendering.
			// name: String
			//		The name of the data series to be plotted.
			// data: Array|Object
			//		The array of data points (either numbers or objects) that
			//		represents the data to be drawn. Or it can be an object. In
			//		the latter case, it should have a property "data" (an array),
			//		destroy(), and setSeriesObject().
			// kwArgs: __SeriesCtorArgs?
			//		An optional keyword arguments object that will be mixed into
			//		the resultant series object.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			var run = new Series(this, data, kwArgs);
			run.name = name;
			if(name in this.runs){
				this.series[this.runs[name]].destroy();
				this.series[this.runs[name]] = run;
			}else{
				this.runs[name] = this.series.length;
				this.series.push(run);
			}
			this.dirty = true;
			// fix min/max
			if(!("ymin" in run) && "min" in run){ run.ymin = run.min; }
			if(!("ymax" in run) && "max" in run){ run.ymax = run.max; }
			return this;	//	dojox/charting/Chart
		},
		getSeries: function(name){
			// summary:
			//		Get the given series, by name.
			// name: String
			//		The name the series was defined by.
			// returns: dojox/charting/Series
			//		The series.
			return this.series[this.runs[name]];
		},
		removeSeries: function(name){
			// summary:
			//		Remove the series defined by name from the chart.
			// name: String
			//		The name of the series as defined by addSeries.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			if(name in this.runs){
				// get the index and remove the name
				var index = this.runs[name];
				delete this.runs[name];
				// destroy the run
				this.series[index].destroy();
				// remove the run from the stack of series
				this.series.splice(index, 1);
				// update indices to reflect the shift
				func.forIn(this.runs, function(idx, name, runs){
					if(idx > index){
						runs[name] = idx - 1;
					}
				});
				this.dirty = true;
			}
			return this;	//	dojox/charting/Chart
		},
		updateSeries: function(name, data, offsets){
			// summary:
			//		Update the given series with a new set of data points.
			// name: String
			//		The name of the series as defined in addSeries.
			// data: Array|Object
			//		The array of data points (either numbers or objects) that
			//		represents the data to be drawn. Or it can be an object. In
			//		the latter case, it should have a property "data" (an array),
			//		destroy(), and setSeriesObject().
			// offsets: Boolean?
			//		If true recomputes the offsets of the chart based on the new
			//		data. This is useful if the range of data is drastically changing
			//		and offsets need to be recomputed.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			if(name in this.runs){
				var run = this.series[this.runs[name]];
				run.update(data);
				if(offsets){
					this.dirty = true;
				}else{
					this._invalidateDependentPlots(run.plot, false);
					this._invalidateDependentPlots(run.plot, true);
				}
			}
			return this;	//	dojox/charting/Chart
		},
		getSeriesOrder: function(plotName){
			// summary:
			//		Returns an array of series names in the current order
			//		(the top-most series is the first) within a plot.
			// plotName: String
			//		Plot's name.
			// returns: Array
			return func.map(func.filter(this.series, function(run){
					return run.plot == plotName;
				}), getName);
		},
		setSeriesOrder: function(newOrder){
			// summary:
			//		Sets new order of series within a plot. newOrder cannot add
			//		or remove series. Wrong names, or dups are ignored.
			// newOrder: Array
			//		Array of series names compatible with getPlotOrder(). All
			//		series should belong to the same plot.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			var plotName, names = {},
				order = func.filter(newOrder, function(name){
					if(!(name in this.runs) || (name in names)){
						return false;
					}
					var run = this.series[this.runs[name]];
					if(plotName){
						if(run.plot != plotName){
							return false;
						}
					}else{
						plotName = run.plot;
					}
					names[name] = 1;
					return true;
				}, this);
			func.forEach(this.series, function(run){
				var name = run.name;
				if(!(name in names) && run.plot == plotName){
					order.push(name);
				}
			});
			var newSeries = func.map(order, function(name){
					return this.series[this.runs[name]];
				}, this);
			this.series = newSeries.concat(func.filter(this.series, function(run){
				return run.plot != plotName;
			}));
			func.forEach(this.series, function(run, i){
				this.runs[run.name] = i;
			}, this);
			this.dirty = true;
			return this;	//	dojox/charting/Chart
		},
		moveSeriesToFront: function(name){
			// summary:
			//		Moves a given series to front of a plot.
			// name: String
			//		Series' name to move.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			if(name in this.runs){
				var index = this.runs[name],
					newOrder = this.getSeriesOrder(this.series[index].plot);
				if(name != newOrder[0]){
					newOrder.splice(index, 1);
					newOrder.unshift(name);
					return this.setSeriesOrder(newOrder);	//	dojox/charting/Chart
				}
			}
			return this;	//	dojox/charting/Chart
		},
		moveSeriesToBack: function(name){
			// summary:
			//		Moves a given series to back of a plot.
			// name: String
			//		Series' name to move.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			if(name in this.runs){
				var index = this.runs[name],
					newOrder = this.getSeriesOrder(this.series[index].plot);
				if(name != newOrder[newOrder.length - 1]){
					newOrder.splice(index, 1);
					newOrder.push(name);
					return this.setSeriesOrder(newOrder);	//	dojox/charting/Chart
				}
			}
			return this;	//	dojox/charting/Chart
		},
		resize: function(width, height){
			// summary:
			//		Resize the chart to the dimensions of width and height.
			// description:
			//		Resize the chart and its surface to the width and height dimensions.
			//		If a single argument of the form {w: value1, h: value2} is provided take that argument as the dimensions to use.
			//		Finally if no argument is provided, resize the surface to the marginBox of the chart.
			// width: Number|Object?
			//		The new width of the chart or the box definition.
			// height: Number?
			//		The new height of the chart.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			switch(arguments.length){
				// case 0, do not resize the div, just the surface
				case 1:
					// argument, override node box
					domGeom.setMarginBox(this.node, width);
					break;
				case 2:
					// argument, override node box
					domGeom.setMarginBox(this.node, {w: width, h: height});
					break;
			}
			// in all cases take back the computed box
			var box = domGeom.getMarginBox(this.node);
			var d = this.surface.getDimensions();
			if(d.width != box.w || d.height != box.h){
				// and set it on the surface
				this.surface.setDimensions(box.w, box.h);
				this.dirty = true;
				return this.render();	//	dojox/charting/Chart
			}else{
				return this;
			}
		},
		getGeometry: function(){
			// summary:
			//		Returns a map of information about all axes in a chart and what they represent
			//		in terms of scaling (see dojox.charting.axis2d.Default.getScaler).
			// returns: Object
			//		An map of geometry objects, a one-to-one mapping of axes.
			var ret = {};
			func.forIn(this.axes, function(axis){
				if(axis.initialized()){
					ret[axis.name] = {
						name:		axis.name,
						vertical:	axis.vertical,
						scaler:		axis.scaler,
						ticks:		axis.ticks
					};
				}
			});
			return ret;	//	Object
		},
		setAxisWindow: function(name, scale, offset, zoom){
			// summary:
			//		Zooms an axis and all dependent plots. Can be used to zoom in 1D.
			// name: String
			//		The name of the axis as defined by addAxis.
			// scale: Number
			//		The scale on the target axis.
			// offset: Number
			//		Any offest, as measured by axis tick
			// zoom: Boolean|Object?
			//		The chart zooming animation trigger.  This is null by default,
			//		e.g. {duration: 1200}, or just set true.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			var axis = this.axes[name];
			if(axis){
				axis.setWindow(scale, offset);
				arr.forEach(this.stack,function(plot){
					if(plot.hAxis == name || plot.vAxis == name){
						plot.zoom = zoom;
					}
				});
			}
			return this;	//	dojox/charting/Chart
		},
		setWindow: function(sx, sy, dx, dy, zoom){
			// summary:
			//		Zooms in or out any plots in two dimensions.
			// sx: Number
			//		The scale for the x axis.
			// sy: Number
			//		The scale for the y axis.
			// dx: Number
			//		The pixel offset on the x axis.
			// dy: Number
			//		The pixel offset on the y axis.
			// zoom: Boolean|Object?
			//		The chart zooming animation trigger.  This is null by default,
			//		e.g. {duration: 1200}, or just set true.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			if(!("plotArea" in this)){
				this.calculateGeometry();
			}
			func.forIn(this.axes, function(axis){
				var scale, offset, bounds = axis.getScaler().bounds,
					s = bounds.span / (bounds.upper - bounds.lower);
				if(axis.vertical){
					scale  = sy;
					offset = dy / s / scale;
				}else{
					scale  = sx;
					offset = dx / s / scale;
				}
				axis.setWindow(scale, offset);
			});
			arr.forEach(this.stack, function(plot){ plot.zoom = zoom; });
			return this;	//	dojox/charting/Chart
		},
		zoomIn:	function(name, range, delayed){
			// summary:
			//		Zoom the chart to a specific range on one axis.  This calls render()
			//		directly as a convenience method.
			// name: String
			//		The name of the axis as defined by addAxis.
			// range: Array
			//		The end points of the zoom range, measured in axis ticks.
			var axis = this.axes[name];
			if(axis){
				var scale, offset, bounds = axis.getScaler().bounds;
				var lower = Math.min(range[0],range[1]);
				var upper = Math.max(range[0],range[1]);
				lower = range[0] < bounds.lower ? bounds.lower : lower;
				upper = range[1] > bounds.upper ? bounds.upper : upper;
				scale = (bounds.upper - bounds.lower) / (upper - lower);
				offset = lower - bounds.lower;
				this.setAxisWindow(name, scale, offset);
				if(delayed){
					this.delayedRender();
				}else{
					this.render();
				}
			}
		},
		calculateGeometry: function(){
			// summary:
			//		Calculate the geometry of the chart based on the defined axes of
			//		a chart.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			if(this.dirty){
				return this.fullGeometry();
			}

			// calculate geometry
			var dirty = arr.filter(this.stack, function(plot){
					return plot.dirty ||
						(plot.hAxis && this.axes[plot.hAxis].dirty) ||
						(plot.vAxis && this.axes[plot.vAxis].dirty);
				}, this);
			calculateAxes(dirty, this.plotArea);

			return this;	//	dojox/charting/Chart
		},
		fullGeometry: function(){
			// summary:
			//		Calculate the full geometry of the chart.  This includes passing
			//		over all major elements of a chart (plots, axes, series, container)
			//		in order to ensure proper rendering.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			this._makeDirty();

			// clear old values
			arr.forEach(this.stack, clear);

			// rebuild new connections, and add defaults

			// set up a theme
			if(!this.theme){
				this.setTheme(new SimpleTheme());
			}

			// assign series
			arr.forEach(this.series, function(run){
				if(!(run.plot in this.plots)){
					// TODO remove auto-assignment
					if(!dc.plot2d || !dc.plot2d.Default){
						throw Error("Can't find plot: Default - didn't you forget to dojo" + ".require() it?");
					}
					var plot = new dc.plot2d.Default(this, {});
					plot.name = run.plot;
					this.plots[run.plot] = this.stack.length;
					this.stack.push(plot);
				}
				this.stack[this.plots[run.plot]].addSeries(run);
			}, this);
			// assign axes
			arr.forEach(this.stack, function(plot){
				if(plot.assignAxes){
					plot.assignAxes(this.axes);
				}
			}, this);

			// calculate geometry

			// 1st pass
			var dim = this.dim = this.surface.getDimensions();
			dim.width  = g.normalizedLength(dim.width);
			dim.height = g.normalizedLength(dim.height);
			func.forIn(this.axes, clear);
			calculateAxes(this.stack, dim);

			// assumption: we don't have stacked axes yet
			var offsets = this.offsets = {l: 0, r: 0, t: 0, b: 0};
			// chart mirroring starts
			var self = this;
			func.forIn(this.axes, function(axis){
				if(has("dojo-bidi")){
					self._resetLeftBottom(axis);
				}
				func.forIn(axis.getOffsets(), function(o, i){ offsets[i] = Math.max(o, offsets[i]); });
			});
			// chart mirroring ends
			// add title area
			if(this.title){
				this.titleGap = (this.titleGap==0) ? 0 : this.titleGap || this.theme.chart.titleGap || 20;
				this.titlePos = this.titlePos || this.theme.chart.titlePos || "top";
				this.titleFont = this.titleFont || this.theme.chart.titleFont;
				this.titleFontColor = this.titleFontColor || this.theme.chart.titleFontColor || "black";
				var tsize = g.normalizedLength(g.splitFontString(this.titleFont).size);
				offsets[this.titlePos == "top" ? "t" : "b"] += (tsize + this.titleGap);
			}
			// add margins
			func.forIn(this.margins, function(o, i){ offsets[i] += o; });

			// 2nd pass with realistic dimensions
			this.plotArea = {
				width: dim.width - offsets.l - offsets.r,
				height: dim.height - offsets.t - offsets.b
			};
			func.forIn(this.axes, clear);
			calculateAxes(this.stack, this.plotArea);

			return this;	//	dojox/charting/Chart
		},
		render: function(){
			// summary:
			//		Render the chart according to the current information defined.  This should
			//		be the last call made when defining/creating a chart, or if data within the
			//		chart has been changed.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.

			// do we have a delayed renderer pending? If yes we need to clear it
			if(this._delayedRenderHandle){
				clearTimeout(this._delayedRenderHandle);
				this._delayedRenderHandle = null;
			}
			
			if(this.theme){
				this.theme.clear();
			}

			if(this.dirty){
				return this.fullRender();
			}

			this.calculateGeometry();

			// go over the stack backwards
			func.forEachRev(this.stack, function(plot){ plot.render(this.dim, this.offsets); }, this);

			// go over axes
			func.forIn(this.axes, function(axis){ axis.render(this.dim, this.offsets); }, this);

			this._makeClean();

			return this;	//	dojox/charting/Chart
		},
		fullRender: function(){
			// summary:
			//		Force a full rendering of the chart, including full resets on the chart itself.
			//		You should not call this method directly unless absolutely necessary.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.

			// calculate geometry
			this.fullGeometry();
			var offsets = this.offsets, dim = this.dim;
			var w = Math.max(0, dim.width  - offsets.l - offsets.r),
				h = Math.max(0, dim.height - offsets.t - offsets.b);

			// get required colors
			//var requiredColors = func.foldl(this.stack, "z + plot.getRequiredColors()", 0);
			//this.theme.defineColors({num: requiredColors, cache: false});

			// clear old shapes
			arr.forEach(this.series, purge);
			func.forIn(this.axes, purge);
			arr.forEach(this.stack,  purge);
			var children = this.surface.children;
			// starting with 1.9 the registry is optional and thus dispose is
			if(shape.dispose){
				for(var i = 0; i < children.length;++i){
					shape.dispose(children[i]);
				}
			}
			if(this.chartTitle && this.chartTitle.tagName){
				// destroy title if it is a DOM node
			    domConstruct.destroy(this.chartTitle);
			}
			this.surface.clear();
			this.chartTitle = null;

			this._renderChartBackground(dim, offsets);
			if(this._nativeClip){
				this._renderPlotBackground(dim, offsets, w, h);
			}else{
				// VML
				this._renderPlotBackground(dim, offsets, w, h);
			}

			// go over the stack backwards
			func.foldr(this.stack, function(z, plot){ return plot.render(dim, offsets), 0; }, 0);

			if(!this._nativeClip){
				// VML, matting-clipping
				this._renderChartBackground(dim, offsets);
			}

			//create title: Whether to make chart title as a widget which extends dojox.charting.Element?
			if(this.title){
				var forceHtmlLabels = (g.renderer == "canvas") && this.htmlLabels,
					labelType = forceHtmlLabels || !has("ie") && !has("opera") && this.htmlLabels ? "html" : "gfx",
					tsize = g.normalizedLength(g.splitFontString(this.titleFont).size);
				this.chartTitle = common.createText[labelType](
					this,
					this.surface,
					dim.width/2,
					this.titlePos=="top" ? tsize + this.margins.t : dim.height - this.margins.b,
					"middle",
					this.title,
					this.titleFont,
					this.titleFontColor
				);
			}

			// go over axes
			func.forIn(this.axes, function(axis){ axis.render(dim, offsets); });

			this._makeClean();

			return this;	//	dojox/charting/Chart
		},
		_renderChartBackground: function(dim, offsets){
			var t = this.theme, rect;
			// chart background
			var fill   = this.fill   !== undefined ? this.fill   : (t.chart && t.chart.fill);
			var stroke = this.stroke !== undefined ? this.stroke : (t.chart && t.chart.stroke);

			// TRT: support for "inherit" as a named value in a theme.
			if(fill == "inherit"){
				//	find the background color of the nearest ancestor node, and use that explicitly.
				var node = this.node;
				fill = new Color(domStyle.get(node, "backgroundColor"));
				while(fill.a==0 && node!=document.documentElement){
					fill = new Color(domStyle.get(node, "backgroundColor"));
					node = node.parentNode;
				}
			}

			if(fill){
				if(this._nativeClip){
					fill = Element.prototype._shapeFill(Element.prototype._plotFill(fill, dim),
						{ x:0, y: 0, width: dim.width + 1, height: dim.height + 1 });
					this.surface.createRect({ width: dim.width + 1, height: dim.height + 1 }).setFill(fill);
				}else{
					// VML
					fill = Element.prototype._plotFill(fill, dim, offsets);
					if(offsets.l){	// left
						rect = {
							x: 0,
							y: 0,
							width:  offsets.l,
							height: dim.height + 1
						};
						this.surface.createRect(rect).setFill(Element.prototype._shapeFill(fill, rect));
					}
					if(offsets.r){	// right
						rect = {
							x: dim.width - offsets.r,
							y: 0,
							width:  offsets.r + 1,
							height: dim.height + 2
						};
						this.surface.createRect(rect).setFill(Element.prototype._shapeFill(fill, rect));
					}
					if(offsets.t){	// top
						rect = {
							x: 0,
							y: 0,
							width:  dim.width + 1,
							height: offsets.t
						};
						this.surface.createRect(rect).setFill(Element.prototype._shapeFill(fill, rect));
					}
					if(offsets.b){	// bottom
						rect = {
							x: 0,
							y: dim.height - offsets.b,
							width:  dim.width + 1,
							height: offsets.b + 2
						};
						this.surface.createRect(rect).setFill(Element.prototype._shapeFill(fill, rect));
					}
				}
			}
			if(stroke){
				this.surface.createRect({
					width:  dim.width - 1,
					height: dim.height - 1
				}).setStroke(stroke);
			}
		},
		_renderPlotBackground: function(dim, offsets, w, h){
			var t = this.theme;

			// draw a plot background
			var fill   = t.plotarea && t.plotarea.fill;
			var stroke = t.plotarea && t.plotarea.stroke;
			// size might be neg if offsets are bigger that chart size this happens quite often at
			// initialization time if the chart widget is used in a BorderContainer
			// this will fail on IE/VML
			var rect = {
				x: offsets.l - 1, y: offsets.t - 1,
				width:  w + 2,
				height: h + 2
			};
			if(fill){
				fill = Element.prototype._shapeFill(Element.prototype._plotFill(fill, dim, offsets), rect);
				this.surface.createRect(rect).setFill(fill);
			}
			if(stroke){
				this.surface.createRect({
					x: offsets.l, y: offsets.t,
					width:  w + 1,
					height: h + 1
				}).setStroke(stroke);
			}
		},
		delayedRender: function(){
			// summary:
			//		Delayed render, which is used to collect multiple updates
			//		within a delayInMs time window.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.

			if(!this._delayedRenderHandle){
				this._delayedRenderHandle = setTimeout(
					lang.hitch(this, function(){
						this.render();
					}),
					this.delayInMs
				);
			}

			return this;	//	dojox/charting/Chart
		},
		connectToPlot: function(name, object, method){
			// summary:
			//		A convenience method to connect a function to a plot.
			// name: String
			//		The name of the plot as defined by addPlot.
			// object: Object
			//		The object to be connected.
			// method: Function
			//		The function to be executed.
			// returns: Array
			//		A handle to the connection, as defined by dojo.connect (see dojo.connect).
			return name in this.plots ? this.stack[this.plots[name]].connect(object, method) : null;	//	Array
		},
		fireEvent: function(seriesName, eventName, index){
			// summary:
			//		Fires a synthetic event for a series item.
			// seriesName: String
			//		Series name.
			// eventName: String
			//		Event name to simulate: onmouseover, onmouseout, onclick.
			// index: Number
			//		Valid data value index for the event.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			if(seriesName in this.runs){
				var plotName = this.series[this.runs[seriesName]].plot;
				if(plotName in this.plots){
					var plot = this.stack[this.plots[plotName]];
					if(plot){
						plot.fireEvent(seriesName, eventName, index);
					}
				}
			}
			return this;	//	dojox/charting/Chart
		},
		_makeClean: function(){
			// reset dirty flags
			arr.forEach(this.axes,   makeClean);
			arr.forEach(this.stack,  makeClean);
			arr.forEach(this.series, makeClean);
			this.dirty = false;
		},
		_makeDirty: function(){
			// reset dirty flags
			arr.forEach(this.axes,   makeDirty);
			arr.forEach(this.stack,  makeDirty);
			arr.forEach(this.series, makeDirty);
			this.dirty = true;
		},
		_invalidateDependentPlots: function(plotName, /* Boolean */ verticalAxis){
			if(plotName in this.plots){
				var plot = this.stack[this.plots[plotName]], axis,
					axisName = verticalAxis ? "vAxis" : "hAxis";
				if(plot[axisName]){
					axis = this.axes[plot[axisName]];
					if(axis && axis.dependOnData()){
						axis.dirty = true;
						// find all plots and mark them dirty
						arr.forEach(this.stack, function(p){
							if(p[axisName] && p[axisName] == plot[axisName]){
								p.dirty = true;
							}
						});
					}
				}else{
					plot.dirty = true;
				}
			}
		},
		setDir : function(dir){
			return this; 
		},
		_resetLeftBottom: function(axis){
		},
		formatTruncatedLabel: function(element, label, labelType){			
		}
	});

	function hSection(stats){
		return {min: stats.hmin, max: stats.hmax};
	}

	function vSection(stats){
		return {min: stats.vmin, max: stats.vmax};
	}

	function hReplace(stats, h){
		stats.hmin = h.min;
		stats.hmax = h.max;
	}

	function vReplace(stats, v){
		stats.vmin = v.min;
		stats.vmax = v.max;
	}

	function combineStats(target, source){
		if(target && source){
			target.min = Math.min(target.min, source.min);
			target.max = Math.max(target.max, source.max);
		}
		return target || source;
	}

	function calculateAxes(stack, plotArea){
		var plots = {}, axes = {};
		arr.forEach(stack, function(plot){
			var stats = plots[plot.name] = plot.getSeriesStats();
			if(plot.hAxis){
				axes[plot.hAxis] = combineStats(axes[plot.hAxis], hSection(stats));
			}
			if(plot.vAxis){
				axes[plot.vAxis] = combineStats(axes[plot.vAxis], vSection(stats));
			}
		});
		arr.forEach(stack, function(plot){
			var stats = plots[plot.name];
			if(plot.hAxis){
				hReplace(stats, axes[plot.hAxis]);
			}
			if(plot.vAxis){
				vReplace(stats, axes[plot.vAxis]);
			}
			plot.initializeScalers(plotArea, stats);
		});
	}
	
	return has("dojo-bidi")? declare("dojox.charting.Chart", [Chart, BidiChart]) : Chart;
});

},
'money/nls/language':function(){
define({
	root: {
		title	: "Select locale",
	    back	: 'settings',
	    systemDefault : 'System default',
	    language: 'Language'

	},
	'ru-ru': true
});

},
'money/nls/ru-ru/language':function(){
define({
		title	: "Выберите локализацию",
	    back	: 'Настройки'

});

},
'dojox/charting/axis2d/Default':function(){
define(["dojo/_base/lang", "dojo/_base/array", "dojo/sniff", "dojo/_base/declare",
	"dojo/_base/connect", "dojo/dom-geometry", "./Invisible",
	"../scaler/linear", "./common", "dojox/gfx", "dojox/lang/utils", "dojox/lang/functional",
	"dojo/has!dojo-bidi?../bidi/axis2d/Default"],
	function(lang, arr, has, declare, connect, domGeom, Invisible,
			lin, acommon, g, du, df, BidiDefault){

	/*=====
	var __AxisCtorArgs = {
		// summary:
		//		Optional arguments used in the definition of an axis.
		// vertical: Boolean?
		//		A flag that says whether an axis is vertical (i.e. y axis) or horizontal. Default is false (horizontal).
		// fixUpper: String?
		//		Align the greatest value on the axis with the specified tick level. Options are "major", "minor", "micro", or "none".  Defaults to "none".
		// fixLower: String?
		//		Align the smallest value on the axis with the specified tick level. Options are "major", "minor", "micro", or "none".  Defaults to "none".
		// natural: Boolean?
		//		Ensure tick marks are made on "natural" numbers. Defaults to false.
		// leftBottom: Boolean?
		//		Deprecated: use position instead. The position of a vertical axis; if true, will be placed against the left-bottom corner of the chart.  Defaults to true.
		// includeZero: Boolean?
		//		Include 0 on the axis rendering.  Default is false.
		// fixed: Boolean?
		//		Force all axis labels to be fixed numbers.  Default is true.
		// majorLabels: Boolean?
		//		Flag to draw labels at major ticks. Default is true.
		// minorTicks: Boolean?
		//		Flag to draw minor ticks on an axis.  Default is true.
		// minorLabels: Boolean?
		//		Flag to labels on minor ticks when there is enough space. Default is true.
		// microTicks: Boolean?
		//		Flag to draw micro ticks on an axis. Default is false.
		// htmlLabels: Boolean?
		//		Flag to use HTML (as opposed to the native vector graphics engine) to draw labels. Default is true.
		// min: Number?
		//		The smallest value on an axis. Default is 0.
		// max: Number?
		//		The largest value on an axis. Default is 1.
		// from: Number?
		//		Force the chart to render data visible from this value. Default is 0.
		// to: Number?
		//		Force the chart to render data visible to this value. Default is 1.
		// majorTickStep: Number?
		//		The amount to skip before a major tick is drawn. When not set the major ticks step is computed from
		//		the data range.
		// minorTickStep: Number?
		//		The amount to skip before a minor tick is drawn. When not set the minor ticks step is computed from
		//		the data range.
		// microTickStep: Number?
		//		The amount to skip before a micro tick is drawn. When not set the micro ticks step is computed from
		// labels: Object[]?
		//		An array of labels for major ticks, with corresponding numeric values, ordered by value.
		// labelFunc: Function?
		//		An optional function to use to compute label text. It takes precedence over
		//		the default text when available. The function must be of the following form:
		//	|		function labelFunc(text, value, precision) {}
		//		`text` is the already pre-formatted text. Pre-formatting is done using `dojo/number` is available, `Date.toFixed` otherwise.
		//		`value`  is the raw axis value.
		//		`precision` is the requested precision to be applied.
		// maxLabelSize: Number?
		//		The maximum size, in pixels, for a label.  To be used with the optional label function.
		// stroke: dojox.gfx.Stroke?
		//		An optional stroke to be used for drawing an axis.
		// majorTick: Object?
		//		An object containing a dojox.gfx.Stroke, and a length (number) for a major tick.
		// minorTick: Object?
		//		An object containing a dojox.gfx.Stroke, and a length (number) for a minor tick.
		// microTick: Object?
		//		An object containing a dojox.gfx.Stroke, and a length (number) for a micro tick.
		// tick: Object?
		//		An object containing a dojox.gfx.Stroke, and a length (number) for a tick.
		// font: String?
		//		An optional font definition (as used in the CSS font property) for labels.
		// fontColor: String|dojo.Color?
		//		An optional color to be used in drawing labels.
		// titleGap: Number?
		//		An optional grap between axis title and axis label
		// titleFont: String?
		//		An optional font definition for axis title
		// titleFontColor: String?
		//		An optional axis title color
		// titleOrientation: String?
		//		An optional orientation for axis title. "axis" means the title facing the axis, "away" means facing away.
		//		If no value is set "axis" is used.
		// enableCache: Boolean?
		//		Whether the ticks and labels are cached from one rendering to another. This improves the rendering performance of
		//		successive rendering but penalize the first rendering. For labels it is only working with gfx labels
		//		not html ones.  Default false.
		// dropLabels: Boolean?
		//		Whether the axis automatically drops labels at regular interval or not to avoid labels overlapping.
		//		This gives better results but require more computations.  You can disable it to save computation
		//		time when you know your labels won't overlap. Default is true.
		// labelSizeChange: Boolean?
		//		Indicates to the axis whether the axis labels are changing their size on zoom. If false this allows to
		//		optimize the axis by avoiding recomputing labels maximum size on zoom actions. Default is false.
		// position: String?
		//		The position of the axis. Values: "leftOrBottom", "center" or "rightOrTop". Default is "leftOrBottom".
	};
	=====*/

	var centerAnchorLimit = 45;	// in degrees

	var Default = declare(has("dojo-bidi")? "dojox.charting.axis2d.NonBidiDefault" : "dojox.charting.axis2d.Default", Invisible, {
		// summary:
		//		The default axis object used in dojox.charting.  See dojox.charting.Chart.addAxis for details.

		// defaultParams: Object
		//		The default parameters used to define any axis.
		// optionalParams: Object
		//		Any optional parameters needed to define an axis.

		/*=====
		// TODO: the documentation tools need these to be pre-defined in order to pick them up
		//	correctly, but the code here is partially predicated on whether or not the properties
		//	actually exist.  For now, we will leave these undocumented but in the code for later. -- TRT

		// opt: Object
		//		The actual options used to define this axis, created at initialization.
		// scaler: Object
		//		The calculated helper object to tell charts how to draw an axis and any data.
		// ticks: Object
		//		The calculated tick object that helps a chart draw the scaling on an axis.
		// dirty: Boolean
		//		The state of the axis (whether it needs to be redrawn or not)
		// scale: Number
		//		The current scale of the axis.
		// offset: Number
		//		The current offset of the axis.

		opt: null,
		scaler: null,
		ticks: null,
		dirty: true,
		scale: 1,
		offset: 0,
		=====*/
		defaultParams: {
			vertical:	false,		// true for vertical axis
			fixUpper:	"none",	// align the upper on ticks: "major", "minor", "micro", "none"
			fixLower:	"none",	// align the lower on ticks: "major", "minor", "micro", "none"
			natural:	 false,		// all tick marks should be made on natural numbers
			leftBottom:  true,		// position of the axis, used with "vertical" - deprecated: use position instead
			includeZero: false,		// 0 should be included
			fixed:	   true,		// all labels are fixed numbers
			majorLabels: true,		// draw major labels
			minorTicks:  true,		// draw minor ticks
			minorLabels: true,		// draw minor labels
			microTicks:  false,		// draw micro ticks
			rotation:	0,			// label rotation angle in degrees
			htmlLabels:  true,		// use HTML to draw labels
			enableCache: false,		// whether we cache or not
			dropLabels: true,		// whether we automatically drop overlapping labels or not
			labelSizeChange: false, // whether the labels size change on zoom
			position: "leftOrBottom" // position of the axis: "leftOrBottom" (default), "center" or "rightOrTop"
		},
		optionalParams: {
			min:			0,	// minimal value on this axis
			max:			1,	// maximal value on this axis
			from:			0,	// visible from this value
			to:				1,	// visible to this value
			majorTickStep:	4,	// major tick step
			minorTickStep:	2,	// minor tick step
			microTickStep:	1,	// micro tick step
			labels:			[],	// array of labels for major ticks
			// with corresponding numeric values
			// ordered by values
			labelFunc:		null, // function to compute label values
			maxLabelSize:	0,	// size in px. For use with labelFunc
			maxLabelCharCount:	0,	// size in word count.
			trailingSymbol:	null,

			// TODO: add support for minRange!
			// minRange:		1,	// smallest distance from min allowed on the axis

			// theme components
			stroke:			{},	// stroke for an axis
			majorTick:		{},	// stroke + length for a tick
			minorTick:		{},	// stroke + length for a tick
			microTick:		{},	// stroke + length for a tick
			tick:		   {},	// stroke + length for a tick
			font:			"",	// font for labels
			fontColor:		"",	// color for labels as a string
			title:				 "",	// axis title
			titleGap:			 0,		// gap between axis title and axis label
			titleFont:			 "",		// axis title font
			titleFontColor:		 "",		// axis title font color
			titleOrientation:	 ""		// "axis" means the title facing the axis, "away" means facing away
		},

		constructor: function(chart, kwArgs){
			// summary:
			//		The constructor for an axis.
			// chart: dojox/charting/Chart
			//		The chart the axis belongs to.
			// kwArgs: __AxisCtorArgs?
			//		Any optional keyword arguments to be used to define this axis.
			this.opt = lang.clone(this.defaultParams);
			du.updateWithObject(this.opt, kwArgs);
			du.updateWithPattern(this.opt, kwArgs, this.optionalParams);
			if(this.opt.enableCache){
				this._textFreePool = [];
				this._lineFreePool = [];
				this._textUsePool = [];
				this._lineUsePool = [];
			}
			this._invalidMaxLabelSize = true;
			// replace deprecated leftBotton to position
			if(!(kwArgs && ('position' in kwArgs))){
			    this.opt.position = this.opt.leftBottom ? "leftOrBottom" : "rightOrTop";
			}			
			this.renderingOptions = { "shape-rendering": "crispEdges" };
		},
		setWindow: function(scale, offset){
			// summary:
			//		Set the drawing "window" for the axis.
			// scale: Number
			//		The new scale for the axis.
			// offset: Number
			//		The new offset for the axis.
			// returns: dojox/charting/axis2d/Default
			//		The reference to the axis for functional chaining.
			if(scale != this.scale){
				// if scale changed we need to recompute new max label size
				this._invalidMaxLabelSize = true;
			}
			return this.inherited(arguments);
		},

		_groupLabelWidth: function(labels, font, wcLimit){
			if(!labels.length){
				return 0;
			}
			if(labels.length > 50){
				// let's avoid degenerated cases
				labels.length = 50;
			}
			if(lang.isObject(labels[0])){
				labels = df.map(labels, function(label){ return label.text; });
			}
			if(wcLimit){
				labels = df.map(labels, function(label){
					return lang.trim(label).length == 0 ? "" : label.substring(0, wcLimit) + this.trailingSymbol;
				}, this);
			}
			var s = labels.join("<br>");
			return g._base._getTextBox(s, {font: font}).w || 0;
		},

		_getMaxLabelSize: function(min, max, span, rotation, font, size){
			if(this._maxLabelSize == null && arguments.length == 6){
				var o = this.opt;
				// everything might have changed, reset the minMinorStep value
				this.scaler.minMinorStep = this._prevMinMinorStep = 0;
				var ob = lang.clone(o);
				delete ob.to;
				delete ob.from;
				// build all the ticks from min, to max not from to to _but_ using the step
				// that would be used if we where just displaying from to to from.
				var sb = lin.buildScaler(min, max, span, ob, o.to - o.from);
				sb.minMinorStep = 0;
				this._majorStart = sb.major.start;
				// we build all the ticks not only the ones we need to draw in order to get
				// a correct drop rate computation that works for any offset of this scale
				var tb = lin.buildTicks(sb, o);
				// if there is not tick at all tb is null
				if(size && tb){
					var majLabelW = 0, minLabelW = 0; // non rotated versions
					// we first collect all labels when needed
					var tickLabelFunc = function(tick){
						if(tick.label){
							this.push(tick.label);
						}
					};
					var labels = [];
					if(this.opt.majorLabels){
						arr.forEach(tb.major, tickLabelFunc, labels);
						majLabelW = this._groupLabelWidth(labels, font, ob.maxLabelCharCount);
						if(ob.maxLabelSize){
							majLabelW = Math.min(ob.maxLabelSize, majLabelW);
						}
					}
					// do the minor labels computation only if dropLabels is set
					labels = [];
					if(this.opt.dropLabels && this.opt.minorLabels){
						arr.forEach(tb.minor, tickLabelFunc, labels);
						minLabelW = this._groupLabelWidth(labels, font, ob.maxLabelCharCount);
						if(ob.maxLabelSize){
							minLabelW = Math.min(ob.maxLabelSize, minLabelW);
						}
					}
					this._maxLabelSize = {
						majLabelW: majLabelW, minLabelW: minLabelW,
						majLabelH: size, minLabelH: size
					};
				}else{
					this._maxLabelSize = null;
				}
			}
			return this._maxLabelSize;
		},

		calculate: function(min, max, span){
			this.inherited(arguments);
			// when the scale has not changed there is no reason for minMinorStep to change
			this.scaler.minMinorStep = this._prevMinMinorStep;
			// we want to recompute the dropping mechanism only when the scale or the size of the axis is changing
			// not when for example when we scroll (otherwise effect would be weird)
			if((this._invalidMaxLabelSize || span != this._oldSpan) && (min != Infinity && max != -Infinity)){
				this._invalidMaxLabelSize = false;
				if(this.opt.labelSizeChange){
					this._maxLabelSize = null;
				}
				this._oldSpan = span;
				var o = this.opt;
				var ta = this.chart.theme.axis, rotation = o.rotation % 360,
					labelGap = this.chart.theme.axis.tick.labelGap,
					// TODO: we use one font --- of major tick, we need to use major and minor fonts
					font = o.font || (ta.majorTick && ta.majorTick.font) || (ta.tick && ta.tick.font),
					size = font ? g.normalizedLength(g.splitFontString(font).size) : 0,
					// even if we don't drop label we need to compute max size for offsets
					labelW = this._getMaxLabelSize(min, max, span, rotation, font, size);
				if(typeof labelGap != "number"){
					labelGap = 4; // in pixels
				}
				if(labelW && o.dropLabels){
					var cosr = Math.abs(Math.cos(rotation * Math.PI / 180)),
						sinr = Math.abs(Math.sin(rotation * Math.PI / 180));
					var majLabelW, minLabelW;
					if(rotation < 0){
						rotation += 360;
					}
					switch(rotation){
						case 0:
						case 180:
							// trivial cases: horizontal labels
							if(this.vertical){
								majLabelW = minLabelW = size;
							}else{
								majLabelW = labelW.majLabelW;
								minLabelW = labelW.minLabelW;
							}
							break;
						case 90:
						case 270:
							// trivial cases: vertical
							if(this.vertical){
								majLabelW = labelW.majLabelW;
								minLabelW = labelW.minLabelW;
							}else{
								majLabelW = minLabelW = size;
							}
							break;
						default:
							// all major labels are parallel they can't collapse except if the two ticks are
							// closer than the height of the text * cos(90-rotation)
							majLabelW  = this.vertical ? Math.min(labelW.majLabelW, size / cosr) : Math.min(labelW.majLabelW, size / sinr);
							// for minor labels we need to rotated them
							var gap1 = Math.sqrt(labelW.minLabelW * labelW.minLabelW + size * size),
								gap2 = this.vertical ? size * cosr + labelW.minLabelW * sinr : labelW.minLabelW * cosr + size * sinr;
							minLabelW = Math.min(gap1, gap2);
							break;
					}
					// we need to check both minor and major labels fit a minor step
					this.scaler.minMinorStep = this._prevMinMinorStep =  Math.max(majLabelW, minLabelW) + labelGap;
					var canMinorLabel = this.scaler.minMinorStep <= this.scaler.minor.tick * this.scaler.bounds.scale;
					if(!canMinorLabel){
						// we can't place minor labels, let's see if we can place major ones
						// in a major step and if not which skip interval we must follow
						this._skipInterval = Math.floor((majLabelW + labelGap) / (this.scaler.major.tick * this.scaler.bounds.scale));
					}else{
						// everything fit well
						this._skipInterval = 0;
					}
				}else{
					// drop label disabled
					this._skipInterval = 0;
				}
			}
			// computes the tick subset we need for that scale/offset
			this.ticks = lin.buildTicks(this.scaler, this.opt);
			return this;
		},

		getOffsets: function(){
			// summary:
			//		Get the physical offset values for this axis (used in drawing data series). This method is not
			//		supposed to be called by the users but internally.
			// returns: Object
			//		The calculated offsets in the form of { l, r, t, b } (left, right, top, bottom).
			var s = this.scaler, offsets = { l: 0, r: 0, t: 0, b: 0 };
			if(!s){
				return offsets;
			}
			var o = this.opt,
				ta = this.chart.theme.axis,
				labelGap = this.chart.theme.axis.tick.labelGap,
				// TODO: we use one font --- of major tick, we need to use major and minor fonts
				taTitleFont = o.titleFont || (ta.title && ta.title.font),
				taTitleGap = (o.titleGap==0) ? 0 : o.titleGap || (ta.title && ta.title.gap),
				taMajorTick = this.chart.theme.getTick("major", o),
				taMinorTick = this.chart.theme.getTick("minor", o),
				tsize = taTitleFont ? g.normalizedLength(g.splitFontString(taTitleFont).size) : 0,
				rotation = o.rotation % 360, position = o.position, 
				leftBottom = position !== "rightOrTop",
				cosr = Math.abs(Math.cos(rotation * Math.PI / 180)),
				sinr = Math.abs(Math.sin(rotation * Math.PI / 180));
			this.trailingSymbol = (o.trailingSymbol === undefined || o.trailingSymbol === null) ?
				this.trailingSymbol : o.trailingSymbol;
			if(typeof labelGap != "number"){
				labelGap = 4; // in pixels
			}
			if(rotation < 0){
				rotation += 360;
			}
			var maxLabelSize = this._getMaxLabelSize(); // don't need parameters, calculate has been called before => we use cached value
			if(maxLabelSize){
				var side;
				var labelWidth = Math.ceil(Math.max(maxLabelSize.majLabelW, maxLabelSize.minLabelW)) + 1,
					size = Math.ceil(Math.max(maxLabelSize.majLabelH, maxLabelSize.minLabelH)) + 1;
				if(this.vertical){
					side = leftBottom ? "l" : "r";
					switch(rotation){
						case 0:
						case 180:
							offsets[side] = position === "center" ? 0 : labelWidth;
							offsets.t = offsets.b = size / 2;
							break;
						case 90:
						case 270:
							offsets[side] = size;
							offsets.t = offsets.b = labelWidth / 2;
							break;
						default:
							if(rotation <= centerAnchorLimit || (180 < rotation && rotation <= (180 + centerAnchorLimit))){
								offsets[side] = size * sinr / 2 + labelWidth * cosr;
								offsets[leftBottom ? "t" : "b"] = size * cosr / 2 + labelWidth * sinr;
								offsets[leftBottom ? "b" : "t"] = size * cosr / 2;
							}else if(rotation > (360 - centerAnchorLimit) || (180 > rotation && rotation > (180 - centerAnchorLimit))){
								offsets[side] = size * sinr / 2 + labelWidth * cosr;
								offsets[leftBottom ? "b" : "t"] = size * cosr / 2 + labelWidth * sinr;
								offsets[leftBottom ? "t" : "b"] = size * cosr / 2;
							}else if(rotation < 90 || (180 < rotation && rotation < 270)){
								offsets[side] = size * sinr + labelWidth * cosr;
								offsets[leftBottom ? "t" : "b"] = size * cosr + labelWidth * sinr;
							}else{
								offsets[side] = size * sinr + labelWidth * cosr;
								offsets[leftBottom ? "b" : "t"] = size * cosr + labelWidth * sinr;
							}
							break;
					}
					if(position === "center"){
					    offsets[side] = 0;
					}
					else{					
					    offsets[side] += labelGap + Math.max(taMajorTick.length > 0?taMajorTick.length:0,
														 taMinorTick.length > 0?taMinorTick.length:0) + (o.title ? (tsize + taTitleGap) : 0);
					}
				}else{
					side = leftBottom ? "b" : "t";
					switch(rotation){
						case 0:
						case 180:
							offsets[side] = position === "center" ? 0 : size;
							offsets.l = offsets.r = labelWidth / 2;
							break;
						case 90:
						case 270:
							offsets[side] = labelWidth;
							offsets.l = offsets.r = size / 2;
							break;
						default:
							if((90 - centerAnchorLimit) <= rotation && rotation <= 90 || (270 - centerAnchorLimit) <= rotation && rotation <= 270){
								offsets[side] = size * cosr / 2 + labelWidth * sinr;
								offsets[leftBottom ? "r" : "l"] = size * sinr / 2 + labelWidth * cosr;
								offsets[leftBottom ? "l" : "r"] = size * sinr / 2;
							}else if(90 <= rotation && rotation <= (90 + centerAnchorLimit) || 270 <= rotation && rotation <= (270 + centerAnchorLimit)){
								offsets[side] = size * cosr / 2 + labelWidth * sinr;
								offsets[leftBottom ? "l" : "r"] = size * sinr / 2 + labelWidth * cosr;
								offsets[leftBottom ? "r" : "l"] = size * sinr / 2;
							}else if(rotation < centerAnchorLimit || (180 < rotation && rotation < (180 + centerAnchorLimit))){
								offsets[side] = size * cosr + labelWidth * sinr;
								offsets[leftBottom ? "r" : "l"] = size * sinr + labelWidth * cosr;
							}else{
								offsets[side] = size * cosr + labelWidth * sinr;
								offsets[leftBottom ? "l" : "r"] = size * sinr + labelWidth * cosr;
							}
							break;
					}
					if(position === "center"){
					    offsets[side] = 0;
					}
					else{					
					offsets[side] += labelGap + Math.max(taMajorTick.length > 0?taMajorTick.length:0,
														 taMinorTick.length > 0?taMinorTick.length:0) + (o.title ? (tsize + taTitleGap) : 0);
					}
				}
			}
			return offsets;	//	Object
		},
		cleanGroup: function(creator){
			if(this.opt.enableCache && this.group){
				this._lineFreePool = this._lineFreePool.concat(this._lineUsePool);
				this._lineUsePool = [];
				this._textFreePool = this._textFreePool.concat(this._textUsePool);
				this._textUsePool = [];
			}
			this.inherited(arguments);
		},
		createText: function(labelType, creator, x, y, align, textContent, font, fontColor, labelWidth){
			if(!this.opt.enableCache || labelType=="html"){
				return acommon.createText[labelType](
						this.chart,
						creator,
						x,
						y,
						align,
						textContent,
						font,
						fontColor,
						labelWidth
					);
			}
			var text;
			if(this._textFreePool.length > 0){
				text = this._textFreePool.pop();
				text.setShape({x: x, y: y, text: textContent, align: align});
				// For now all items share the same font, no need to re-set it
				//.setFont(font).setFill(fontColor);
				// was cleared, add it back
				creator.add(text);
			}else{
				text = acommon.createText[labelType](
						this.chart,
						creator,
						x,
						y,
						align,
						textContent,
						font,
						fontColor						
					);			
			}
			this._textUsePool.push(text);
			return text;
		},
		createLine: function(creator, params){
			var line;
			if(this.opt.enableCache && this._lineFreePool.length > 0){
				line = this._lineFreePool.pop();
				line.setShape(params);
				// was cleared, add it back
				creator.add(line);
			}else{
				line = creator.createLine(params);
			}
			if(this.opt.enableCache){
				this._lineUsePool.push(line);
			}
			return line;
		},
		render: function(dim, offsets){
			// summary:
			//		Render/draw the axis.
			// dim: Object
			//		An object of the form { width, height}.
			// offsets: Object
			//		An object of the form { l, r, t, b }.
			// returns: dojox/charting/axis2d/Default
			//		The reference to the axis for functional chaining.
			
			var isRtl = this._isRtl();	// chart mirroring
			if(!this.dirty || !this.scaler){
				return this;	//	dojox/charting/axis2d/Default
			}
			// prepare variable
			var o = this.opt, ta = this.chart.theme.axis, position = o.position, 
			       leftBottom = position !== "rightOrTop", rotation = o.rotation % 360,
				start, stop, titlePos, titleRotation=0, titleOffset, axisVector, tickVector, anchorOffset, labelOffset, labelAlign,
				labelGap = this.chart.theme.axis.tick.labelGap,
				// TODO: we use one font --- of major tick, we need to use major and minor fonts
				taFont = o.font || (ta.majorTick && ta.majorTick.font) || (ta.tick && ta.tick.font),
				taTitleFont = o.titleFont || (ta.title && ta.title.font),
				// TODO: we use one font color --- we need to use different colors
				taFontColor = o.fontColor || (ta.majorTick && ta.majorTick.fontColor) || (ta.tick && ta.tick.fontColor) || "black",
				taTitleFontColor = o.titleFontColor || (ta.title && ta.title.fontColor) || "black",
				taTitleGap = (o.titleGap==0) ? 0 : o.titleGap || (ta.title && ta.title.gap) || 15,
				taTitleOrientation = o.titleOrientation || (ta.title && ta.title.orientation) || "axis",
				taMajorTick = this.chart.theme.getTick("major", o),
				taMinorTick = this.chart.theme.getTick("minor", o),
				taMicroTick = this.chart.theme.getTick("micro", o),

				taStroke = "stroke" in o ? o.stroke : ta.stroke,
				size = taFont ? g.normalizedLength(g.splitFontString(taFont).size) : 0,
				cosr = Math.abs(Math.cos(rotation * Math.PI / 180)),
				sinr = Math.abs(Math.sin(rotation * Math.PI / 180)),
				tsize = taTitleFont ? g.normalizedLength(g.splitFontString(taTitleFont).size) : 0;
			if(typeof labelGap != "number"){
				labelGap = 4; // in pixels
			}
			if(rotation < 0){
				rotation += 360;
			}
			var cachedLabelW = this._getMaxLabelSize();
			cachedLabelW = cachedLabelW && cachedLabelW.majLabelW;
			if(this.vertical){
				start = {y: dim.height - offsets.b};
				stop  = {y: offsets.t};
				titlePos = {y: (dim.height - offsets.b + offsets.t)/2};
				titleOffset = size * sinr + (cachedLabelW || 0) * cosr + labelGap + Math.max(taMajorTick.length > 0?taMajorTick.length:0,
																		 					 taMinorTick.length > 0?taMinorTick.length:0) +
					tsize + taTitleGap;
				axisVector = {x: 0, y: -1};
				labelOffset = {x: 0, y: 0};
				tickVector = {x: 1, y: 0};
				anchorOffset = {x: labelGap, y: 0};
				switch(rotation){
					case 0:
						labelAlign = "end";
						labelOffset.y = size * 0.4;
						break;
					case 90:
						labelAlign = "middle";
						labelOffset.x = -size;
						break;
					case 180:
						labelAlign = "start";
						labelOffset.y = -size * 0.4;
						break;
					case 270:
						labelAlign = "middle";
						break;
					default:
						if(rotation < centerAnchorLimit){
							labelAlign = "end";
							labelOffset.y = size * 0.4;
						}else if(rotation < 90){
							labelAlign = "end";
							labelOffset.y = size * 0.4;
						}else if(rotation < (180 - centerAnchorLimit)){
							labelAlign = "start";
						}else if(rotation < (180 + centerAnchorLimit)){
							labelAlign = "start";
							labelOffset.y = -size * 0.4;
						}else if(rotation < 270){
							labelAlign = "start";
							labelOffset.x = leftBottom ? 0 : size * 0.4;
						}else if(rotation < (360 - centerAnchorLimit)){
							labelAlign = "end";
							labelOffset.x = leftBottom ? 0 : size * 0.4;
						}else{
							labelAlign = "end";
							labelOffset.y = size * 0.4;
						}
				}
				if(leftBottom){
					start.x = stop.x = position === "center" ? dim.width/2 : offsets.l;
					titleRotation = (taTitleOrientation && taTitleOrientation == "away") ? 90 : 270;
					titlePos.x = offsets.l - titleOffset + (titleRotation == 270 ? tsize : 0);
					tickVector.x = -1;
					anchorOffset.x = -anchorOffset.x;
				}else{
					start.x = stop.x = dim.width - offsets.r;
					titleRotation = (taTitleOrientation && taTitleOrientation == "axis") ? 90 : 270;
					titlePos.x = dim.width - offsets.r + titleOffset - (titleRotation == 270 ? 0 : tsize);
					switch(labelAlign){
						case "start":
							labelAlign = "end";
							break;
						case "end":
							labelAlign = "start";
							break;
						case "middle":
							labelOffset.x += size;
							break;
					}
				}
			}else{
				start = {x: offsets.l};
				stop  = {x: dim.width - offsets.r};
				titlePos = {x: (dim.width - offsets.r + offsets.l)/2};
				titleOffset = size * cosr + (cachedLabelW || 0) * sinr + labelGap + Math.max(taMajorTick.length > 0?taMajorTick.length:0,
																		 					 taMinorTick.length > 0?taMinorTick.length:0) +
					tsize + taTitleGap;
				axisVector = {x: isRtl ? -1 : 1, y: 0}; 	// chart mirroring
				labelOffset = {x: 0, y: 0};
				tickVector = {x: 0, y: 1};
				anchorOffset = {x: 0, y: labelGap};
				switch(rotation){
					case 0:
						labelAlign = "middle";
						labelOffset.y = size;
						break;
					case 90:
						labelAlign = "start";
						labelOffset.x = -size * 0.4;
						break;
					case 180:
						labelAlign = "middle";
						break;
					case 270:
						labelAlign = "end";
						labelOffset.x = size * 0.4;
						break;
					default:
						if(rotation < (90 - centerAnchorLimit)){
							labelAlign = "start";
							labelOffset.y = leftBottom ? size : 0;
						}else if(rotation < (90 + centerAnchorLimit)){
							labelAlign = "start";
							labelOffset.x = -size * 0.4;
						}else if(rotation < 180){
							labelAlign = "start";
							labelOffset.y = leftBottom ? 0 : -size;
						}else if(rotation < (270 - centerAnchorLimit)){
							labelAlign = "end";
							labelOffset.y = leftBottom ? 0 : -size;
						}else if(rotation < (270 + centerAnchorLimit)){
							labelAlign = "end";
							labelOffset.y = leftBottom ? size * 0.4 : 0;
						}else{
							labelAlign = "end";
							labelOffset.y = leftBottom ? size : 0;
						}
				}
				if(leftBottom){
					start.y = stop.y = position === "center" ? dim.height/2 : dim.height - offsets.b;
					titleRotation = (taTitleOrientation && taTitleOrientation == "axis") ? 180 : 0;
					titlePos.y = dim.height - offsets.b + titleOffset - (titleRotation ? tsize : 0);
				}else{
					start.y = stop.y = offsets.t;
					titleRotation = (taTitleOrientation && taTitleOrientation == "away") ? 180 : 0;
					titlePos.y = offsets.t - titleOffset + (titleRotation ? 0 : tsize);
					tickVector.y = -1;
					anchorOffset.y = -anchorOffset.y;
					switch(labelAlign){
						case "start":
							labelAlign = "end";
							break;
						case "end":
							labelAlign = "start";
							break;
						case "middle":
							labelOffset.y -= size;
							break;
					}
				}
			}

			// render shapes

			this.cleanGroup();

			var s = this.group,
				c = this.scaler,
				t = this.ticks,
				f = lin.getTransformerFromModel(this.scaler),
				// GFX Canvas now supports labels, so let's _not_ fallback to HTML anymore on canvas, just use
				// HTML labels if explicitly asked + no rotation + no IE + no Opera
				labelType = (!o.title || !titleRotation) && !rotation && this.opt.htmlLabels && !has("ie") && !has("opera") ? "html" : "gfx",
				dx = tickVector.x * taMajorTick.length,
				dy = tickVector.y * taMajorTick.length,
				skip = this._skipInterval;

			s.createLine({
				x1: start.x,
				y1: start.y,
				x2: stop.x,
				y2: stop.y
			}).setStroke(taStroke);

			//create axis title
			if(o.title){
				var axisTitle = acommon.createText[labelType](
					this.chart,
					s,
					titlePos.x,
					titlePos.y,
					"middle",
					o.title,
					taTitleFont,
					taTitleFontColor
				);
				if(labelType == "html"){
					this.htmlElements.push(axisTitle);
				}else{
					//as soon as rotation is provided, labelType won't be "html"
					//rotate gfx labels
					axisTitle.setTransform(g.matrix.rotategAt(titleRotation, titlePos.x, titlePos.y));
				}
			}

			// go out nicely instead of try/catch
			if(t == null){
				this.dirty = false;
				return this;
			}

			var rel = (t.major.length > 0)?(t.major[0].value - this._majorStart) / c.major.tick:0;
			var canLabel = this.opt.majorLabels;
			arr.forEach(t.major, function(tick, i){
				var offset = f(tick.value), elem,
					x = (isRtl ? stop.x : start.x) + axisVector.x * offset, // chart mirroring
					y = start.y + axisVector.y * offset;
				i += rel;
				this.createLine(s, {
					x1: x, y1: y,
					x2: x + dx,
					y2: y + dy
				}).setStroke(taMajorTick);
				if(tick.label && (!skip || (i - (1 + skip)) % (1 + skip) == 0)){
					var label = o.maxLabelCharCount ? this.getTextWithLimitCharCount(tick.label, taFont, o.maxLabelCharCount) : {
						text: tick.label,
						truncated: false
					};
					label = o.maxLabelSize ? this.getTextWithLimitLength(label.text, taFont, o.maxLabelSize, label.truncated) : label;
					elem = this.createText(labelType,
						s,
						x + (taMajorTick.length > 0 ? dx : 0) + anchorOffset.x + (rotation ? 0 : labelOffset.x),
						y + (taMajorTick.length > 0 ? dy : 0) + anchorOffset.y + (rotation ? 0 : labelOffset.y),
						labelAlign,
						label.text,
						taFont,
						taFontColor
						//cachedLabelW
					);
					// if bidi support was required, the textDir is "auto" and truncation
					// took place, we need to update the dir of the element for cases as:
					// Fool label: 111111W (W for bidi character)
					// truncated label: 11...
					// in this case for auto textDir the dir will be "ltr" which is wrong.
					if(label.truncated){
						this.chart.formatTruncatedLabel(elem, tick.label, labelType);
					}
					label.truncated && this.labelTooltip(elem, this.chart, tick.label, label.text, taFont, labelType);
					if(labelType == "html"){
						this.htmlElements.push(elem);
					}else if(rotation){
						elem.setTransform([
							{dx: labelOffset.x, dy: labelOffset.y},
							g.matrix.rotategAt(
								rotation,
								x + (taMajorTick.length > 0 ? dx : 0) + anchorOffset.x,
								y + (taMajorTick.length > 0 ? dy : 0) + anchorOffset.y
							)
						]);
					}
				}
			}, this);

			dx = tickVector.x * taMinorTick.length;
			dy = tickVector.y * taMinorTick.length;
			canLabel = this.opt.minorLabels && c.minMinorStep <= c.minor.tick * c.bounds.scale;
			arr.forEach(t.minor, function(tick){
				var offset = f(tick.value), elem,
					x = (isRtl ? stop.x : start.x)  + axisVector.x * offset,
					y = start.y + axisVector.y * offset; // chart mirroring
				this.createLine(s, {
					x1: x, y1: y,
					x2: x + dx,
					y2: y + dy
				}).setStroke(taMinorTick);
				if(canLabel && tick.label){
					var label = o.maxLabelCharCount ? this.getTextWithLimitCharCount(tick.label, taFont, o.maxLabelCharCount) : {
						text: tick.label,
						truncated: false
					};
					label = o.maxLabelSize ? this.getTextWithLimitLength(label.text, taFont, o.maxLabelSize, label.truncated) : label;
					elem = this.createText(labelType,
						s,
						x + (taMinorTick.length > 0 ? dx : 0) + anchorOffset.x + (rotation ? 0 : labelOffset.x),
						y + (taMinorTick.length  > 0 ? dy : 0) + anchorOffset.y + (rotation ? 0 : labelOffset.y),
						labelAlign,
						label.text,
						taFont,
						taFontColor
						//cachedLabelW
					);
					// if bidi support was required, the textDir is "auto" and truncation
					// took place, we need to update the dir of the element for cases as:
					// Fool label: 111111W (W for bidi character)
					// truncated label: 11...
					// in this case for auto textDir the dir will be "ltr" which is wrong.
					if(label.truncated){
						this.chart.formatTruncatedLabel(elem, tick.label, labelType);
					}
					label.truncated && this.labelTooltip(elem, this.chart, tick.label, label.text, taFont, labelType);
					if(labelType == "html"){
						this.htmlElements.push(elem);
					}else if(rotation){
						elem.setTransform([
							{dx: labelOffset.x, dy: labelOffset.y},
							g.matrix.rotategAt(
								rotation,
								x + (taMinorTick.length > 0 ? dx : 0) + anchorOffset.x,
								y + (taMinorTick.length > 0 ? dy : 0) + anchorOffset.y
							)
						]);
					}
				}
			}, this);

			dx = tickVector.x * taMicroTick.length;
			dy = tickVector.y * taMicroTick.length;
			arr.forEach(t.micro, function(tick){
				var offset = f(tick.value),
					x = start.x + axisVector.x * offset,
					y = start.y + axisVector.y * offset;
					this.createLine(s, {
						x1: x, y1: y,
						x2: x + dx,
						y2: y + dy
					}).setStroke(taMicroTick);
			}, this);

			this.dirty = false;
			return this;	//	dojox/charting/axis2d/Default
		},
		labelTooltip: function(elem, chart, label, truncatedLabel, font, elemType){
			var modules = ["dijit/Tooltip"];
			var aroundRect = {type: "rect"}, position = ["above", "below"],
				fontWidth = g._base._getTextBox(truncatedLabel, {font: font}).w || 0,
				fontHeight = font ? g.normalizedLength(g.splitFontString(font).size) : 0;
			if(elemType == "html"){
				lang.mixin(aroundRect, domGeom.position(elem.firstChild, true));
				aroundRect.width = Math.ceil(fontWidth);
				aroundRect.height = Math.ceil(fontHeight);
				this._events.push({
					shape:  dojo,
					handle: connect.connect(elem.firstChild, "onmouseover", this, function(e){
						require(modules, function(Tooltip){
							Tooltip.show(label, aroundRect, position);
						});
					})
				});
				this._events.push({
					shape:  dojo,
					handle: connect.connect(elem.firstChild, "onmouseout", this, function(e){
						require(modules, function(Tooltip){
							Tooltip.hide(aroundRect);
						});
					})
				});
			}else{
				var shp = elem.getShape(),
					lt = chart.getCoords();
				aroundRect = lang.mixin(aroundRect, {
					x: shp.x - fontWidth / 2,
					y: shp.y
				});
				aroundRect.x += lt.x;
				aroundRect.y += lt.y;
				aroundRect.x = Math.round(aroundRect.x);
				aroundRect.y = Math.round(aroundRect.y);
				aroundRect.width = Math.ceil(fontWidth);
				aroundRect.height = Math.ceil(fontHeight);
				this._events.push({
					shape:  elem,
					handle: elem.connect("onmouseenter", this, function(e){
						require(modules, function(Tooltip){
							Tooltip.show(label, aroundRect, position);
						});
					})
				});
				this._events.push({
					shape:  elem,
					handle: elem.connect("onmouseleave", this, function(e){
						require(modules, function(Tooltip){
							Tooltip.hide(aroundRect);
						});
					})
				});
			}
		},
		_isRtl: function(){
			return false;
		}
	});
	return has("dojo-bidi")? declare("dojox.charting.axis2d.Default", [Default, BidiDefault]) : Default;
});

},
'dojo/store/util/QueryResults':function(){
define(["../../_base/array", "../../_base/lang", "../../when"
], function(array, lang, when){

// module:
//		dojo/store/util/QueryResults

var QueryResults = function(results){
	// summary:
	//		A function that wraps the results of a store query with additional
	//		methods.
	// description:
	//		QueryResults is a basic wrapper that allows for array-like iteration
	//		over any kind of returned data from a query.  While the simplest store
	//		will return a plain array of data, other stores may return deferreds or
	//		promises; this wrapper makes sure that *all* results can be treated
	//		the same.
	//
	//		Additional methods include `forEach`, `filter` and `map`.
	// results: Array|dojo/promise/Promise
	//		The result set as an array, or a promise for an array.
	// returns:
	//		An array-like object that can be used for iterating over.
	// example:
	//		Query a store and iterate over the results.
	//
	//	|	store.query({ prime: true }).forEach(function(item){
	//	|		//	do something
	//	|	});

	if(!results){
		return results;
	}

	var isPromise = !!results.then;
	// if it is a promise it may be frozen
	if(isPromise){
		results = lang.delegate(results);
	}
	function addIterativeMethod(method){
		// Always add the iterative methods so a QueryResults is
		// returned whether the environment is ES3 or ES5
		results[method] = function(){
			var args = arguments;
			var result = when(results, function(results){
				Array.prototype.unshift.call(args, results);
				return QueryResults(array[method].apply(array, args));
			});
			// forEach should only return the result of when()
			// when we're wrapping a promise
			if(method !== "forEach" || isPromise){
				return result;
			}
		};
	}

	addIterativeMethod("forEach");
	addIterativeMethod("filter");
	addIterativeMethod("map");
	if(results.total == null){
		results.total = when(results, function(results){
			return results.length;
		});
	}
	return results; // Object
};

lang.setObject("dojo.store.util.QueryResults", QueryResults);

return QueryResults;

});

},
'dojox/charting/plot2d/ClusteredColumns':function(){
define(["dojo/_base/declare", "dojo/_base/array", "./Columns", "./common"], 
	function(declare, array, Columns, dc){

	return declare("dojox.charting.plot2d.ClusteredColumns", Columns, {
		// summary:
		//		A plot representing grouped or clustered columns (vertical bars)
		getBarProperties: function(){
			var length = this.series.length;
			array.forEach(this.series, function(serie){if(serie.hidden){length--;}});
			var f = dc.calculateBarSize(this._hScaler.bounds.scale, this.opt, length);
			return {gap: f.gap, width: f.size, thickness: f.size, clusterSize: length};
		}
	});
});

},
'dojo/DeferredList':function(){
define(["./_base/kernel", "./_base/Deferred", "./_base/array"], function(dojo, Deferred, darray){
	// module:
	//		dojo/DeferredList


dojo.DeferredList = function(/*Array*/ list, /*Boolean?*/ fireOnOneCallback, /*Boolean?*/ fireOnOneErrback, /*Boolean?*/ consumeErrors, /*Function?*/ canceller){
	// summary:
	//		Deprecated, use dojo/promise/all instead.
	//		Provides event handling for a group of Deferred objects.
	// description:
	//		DeferredList takes an array of existing deferreds and returns a new deferred of its own
	//		this new deferred will typically have its callback fired when all of the deferreds in
	//		the given list have fired their own deferreds.  The parameters `fireOnOneCallback` and
	//		fireOnOneErrback, will fire before all the deferreds as appropriate
	// list:
	//		The list of deferreds to be synchronizied with this DeferredList
	// fireOnOneCallback:
	//		Will cause the DeferredLists callback to be fired as soon as any
	//		of the deferreds in its list have been fired instead of waiting until
	//		the entire list has finished
	// fireonOneErrback:
	//		Will cause the errback to fire upon any of the deferreds errback
	// canceller:
	//		A deferred canceller function, see dojo.Deferred
	var resultList = [];
	Deferred.call(this);
	var self = this;
	if(list.length === 0 && !fireOnOneCallback){
		this.resolve([0, []]);
	}
	var finished = 0;
	darray.forEach(list, function(item, i){
		item.then(function(result){
			if(fireOnOneCallback){
				self.resolve([i, result]);
			}else{
				addResult(true, result);
			}
		},function(error){
			if(fireOnOneErrback){
				self.reject(error);
			}else{
				addResult(false, error);
			}
			if(consumeErrors){
				return null;
			}
			throw error;
		});
		function addResult(succeeded, result){
			resultList[i] = [succeeded, result];
			finished++;
			if(finished === list.length){
				self.resolve(resultList);
			}

		}
	});
};
dojo.DeferredList.prototype = new Deferred();

dojo.DeferredList.prototype.gatherResults = function(deferredList){
	// summary:
	//		Gathers the results of the deferreds for packaging
	//		as the parameters to the Deferred Lists' callback
	// deferredList: dojo/DeferredList
	//		The deferred list from which this function gathers results.
	// returns: dojo/DeferredList
	//		The newly created deferred list which packs results as
	//		parameters to its callback.

	var d = new dojo.DeferredList(deferredList, false, true, false);
	d.addCallback(function(results){
		var ret = [];
		darray.forEach(results, function(result){
			ret.push(result[1]);
		});
		return ret;
	});
	return d;
};

return dojo.DeferredList;
});

},
'dojox/gfx/decompose':function(){
define(["./_base", "dojo/_base/lang", "./matrix"], 
  function (g, lang, m){
	function eq(/* Number */ a, /* Number */ b){
		// summary:
		//		compare two FP numbers for equality
		return Math.abs(a - b) <= 1e-6 * (Math.abs(a) + Math.abs(b));	// Boolean
	}

	function calcFromValues(/* Number */ r1, /* Number */ m1, /* Number */ r2, /* Number */ m2){
		// summary:
		//		uses two close FP ration and their original magnitudes to approximate the result
		if(!isFinite(r1)){
			return r2;	// Number
		}else if(!isFinite(r2)){
			return r1;	// Number
		}
		m1 = Math.abs(m1); m2 = Math.abs(m2);
		return (m1 * r1 + m2 * r2) / (m1 + m2);	// Number
	}

	function transpose(matrix){
		// matrix: dojox/gfx/matrix.Matrix2D
		//		a 2D matrix-like object
		var M = new m.Matrix2D(matrix);
		return lang.mixin(M, {dx: 0, dy: 0, xy: M.yx, yx: M.xy});	// dojox/gfx/matrix.Matrix2D
	}

	function scaleSign(/* dojox/gfx/matrix.Matrix2D */ matrix){
		return (matrix.xx * matrix.yy < 0 || matrix.xy * matrix.yx > 0) ? -1 : 1;	// Number
	}

	function eigenvalueDecomposition(matrix){
		// matrix: dojox/gfx/matrix.Matrix2D
		//		a 2D matrix-like object
		var M = m.normalize(matrix),
			b = -M.xx - M.yy,
			c = M.xx * M.yy - M.xy * M.yx,
			d = Math.sqrt(b * b - 4 * c),
			l1 = -(b + (b < 0 ? -d : d)) / 2,
			l2 = c / l1,
			vx1 = M.xy / (l1 - M.xx), vy1 = 1,
			vx2 = M.xy / (l2 - M.xx), vy2 = 1;
		if(eq(l1, l2)){
			vx1 = 1, vy1 = 0, vx2 = 0, vy2 = 1;
		}
		if(!isFinite(vx1)){
			vx1 = 1, vy1 = (l1 - M.xx) / M.xy;
			if(!isFinite(vy1)){
				vx1 = (l1 - M.yy) / M.yx, vy1 = 1;
				if(!isFinite(vx1)){
					vx1 = 1, vy1 = M.yx / (l1 - M.yy);
				}
			}
		}
		if(!isFinite(vx2)){
			vx2 = 1, vy2 = (l2 - M.xx) / M.xy;
			if(!isFinite(vy2)){
				vx2 = (l2 - M.yy) / M.yx, vy2 = 1;
				if(!isFinite(vx2)){
					vx2 = 1, vy2 = M.yx / (l2 - M.yy);
				}
			}
		}
		var d1 = Math.sqrt(vx1 * vx1 + vy1 * vy1),
			d2 = Math.sqrt(vx2 * vx2 + vy2 * vy2);
		if(!isFinite(vx1 /= d1)){ vx1 = 0; }
		if(!isFinite(vy1 /= d1)){ vy1 = 0; }
		if(!isFinite(vx2 /= d2)){ vx2 = 0; }
		if(!isFinite(vy2 /= d2)){ vy2 = 0; }
		return {	// Object
			value1: l1,
			value2: l2,
			vector1: {x: vx1, y: vy1},
			vector2: {x: vx2, y: vy2}
		};
	}

	function decomposeSR(/* dojox/gfx/matrix.Matrix2D */ M, /* Object */ result){
		// summary:
		//		decomposes a matrix into [scale, rotate]; no checks are done.
		var sign = scaleSign(M),
			a = result.angle1 = (Math.atan2(M.yx, M.yy) + Math.atan2(-sign * M.xy, sign * M.xx)) / 2,
			cos = Math.cos(a), sin = Math.sin(a);
		result.sx = calcFromValues(M.xx / cos, cos, -M.xy / sin, sin);
		result.sy = calcFromValues(M.yy / cos, cos,  M.yx / sin, sin);
		return result;	// Object
	}

	function decomposeRS(/* dojox/gfx/matrix.Matrix2D */ M, /* Object */ result){
		// summary:
		//		decomposes a matrix into [rotate, scale]; no checks are done
		var sign = scaleSign(M),
			a = result.angle2 = (Math.atan2(sign * M.yx, sign * M.xx) + Math.atan2(-M.xy, M.yy)) / 2,
			cos = Math.cos(a), sin = Math.sin(a);
		result.sx = calcFromValues(M.xx / cos, cos,  M.yx / sin, sin);
		result.sy = calcFromValues(M.yy / cos, cos, -M.xy / sin, sin);
		return result;	// Object
	}

	return g.decompose = function(matrix){
		// summary:
		//		Decompose a 2D matrix into translation, scaling, and rotation components.
		// description:
		//		This function decompose a matrix into four logical components:
		//		translation, rotation, scaling, and one more rotation using SVD.
		//		The components should be applied in following order:
		//	| [translate, rotate(angle2), scale, rotate(angle1)]
		// matrix: dojox/gfx/matrix.Matrix2D
		//		a 2D matrix-like object
		var M = m.normalize(matrix),
			result = {dx: M.dx, dy: M.dy, sx: 1, sy: 1, angle1: 0, angle2: 0};
		// detect case: [scale]
		if(eq(M.xy, 0) && eq(M.yx, 0)){
			return lang.mixin(result, {sx: M.xx, sy: M.yy});	// Object
		}
		// detect case: [scale, rotate]
		if(eq(M.xx * M.yx, -M.xy * M.yy)){
			return decomposeSR(M, result);	// Object
		}
		// detect case: [rotate, scale]
		if(eq(M.xx * M.xy, -M.yx * M.yy)){
			return decomposeRS(M, result);	// Object
		}
		// do SVD
		var	MT = transpose(M),
			u  = eigenvalueDecomposition([M, MT]),
			v  = eigenvalueDecomposition([MT, M]),
			U  = new m.Matrix2D({xx: u.vector1.x, xy: u.vector2.x, yx: u.vector1.y, yy: u.vector2.y}),
			VT = new m.Matrix2D({xx: v.vector1.x, xy: v.vector1.y, yx: v.vector2.x, yy: v.vector2.y}),
			S = new m.Matrix2D([m.invert(U), M, m.invert(VT)]);
		decomposeSR(VT, result);
		S.xx *= result.sx;
		S.yy *= result.sy;
		decomposeRS(U, result);
		S.xx *= result.sx;
		S.yy *= result.sy;
		return lang.mixin(result, {sx: S.xx, sy: S.yy});	// Object
	};
});

},
'money/nls/theme':function(){
define({
	root: {
		title	: "Select theme",
	    back	: 'Settings',
	    systemDefault : 'System default',
	    theme: 'Application theme',
	    light : 'Light (default)',
	    dark : 'Dark',

	},
	'ru-ru': true
});

},
'money/nls/ru-ru/theme':function(){
define({
		title	: "Тема оформления",
	    back	: 'Настройки',
	    theme	: 'Выберите тему оформления',
		light 	: 'Светлая (по умолчанию)',
	    dark 	: 'Тёмная',
});


},
'money/nls/currency':function(){
define({
	root: {
		title	: "Select currency",
		done	: 'DONE',
		selectCurrency : 'Select currency from a list below, please.',
		more: 'Show all currencies...',
		less: 'Only basic currencies'
		
	},
	'ru-ru': true
});

},
'money/nls/ru-ru/currency':function(){
define({
	title	: "Выберите валюту",
	done	: 'Готово',
	selectCurrency : 'Выберите валюту из списка, пожалуйста.',
	more: 'Все валюты...',
	less: 'Только основные валюты'
});

},
'dojox/lang/functional/lambda':function(){
define(["../..", "dojo/_base/lang", "dojo/_base/array"], function(dojox, lang, arr){
	var df = lang.getObject("lang.functional", true, dojox);

// This module adds high-level functions and related constructs:
//	- anonymous functions built from the string

// Acknowledgements:
//	- lambda() is based on work by Oliver Steele
//		(http://osteele.com/sources/javascript/functional/functional.js)
//		which was published under MIT License

// Notes:
//	- lambda() produces functions, which after the compilation step are
//		as fast as regular JS functions (at least theoretically).

// Lambda input values:
//	- returns functions unchanged
//	- converts strings to functions
//	- converts arrays to a functional composition

	var lcache = {};

	// split() is augmented on IE6 to ensure the uniform behavior
	var split = "ab".split(/a*/).length > 1 ? String.prototype.split :
			function(sep){
				 var r = this.split.call(this, sep),
					 m = sep.exec(this);
				 if(m && m.index == 0){ r.unshift(""); }
				 return r;
			};
			
	var lambda = function(/*String*/ s){
		var args = [], sects = split.call(s, /\s*->\s*/m);
		if(sects.length > 1){
			while(sects.length){
				s = sects.pop();
				args = sects.pop().split(/\s*,\s*|\s+/m);
				if(sects.length){ sects.push("(function(" + args.join(", ") + "){ return (" + s + "); })"); }
			}
		}else if(s.match(/\b_\b/)){
			args = ["_"];
		}else{
			var l = s.match(/^\s*(?:[+*\/%&|\^\.=<>]|!=)/m),
				r = s.match(/[+\-*\/%&|\^\.=<>!]\s*$/m);
			if(l || r){
				if(l){
					args.push("$1");
					s = "$1" + s;
				}
				if(r){
					args.push("$2");
					s = s + "$2";
				}
			}else{
				// the point of the long regex below is to exclude all well-known
				// lower-case words from the list of potential arguments
				var vars = s.
					replace(/(?:\b[A-Z]|\.[a-zA-Z_$])[a-zA-Z_$\d]*|[a-zA-Z_$][a-zA-Z_$\d]*:|this|true|false|null|undefined|typeof|instanceof|in|delete|new|void|arguments|decodeURI|decodeURIComponent|encodeURI|encodeURIComponent|escape|eval|isFinite|isNaN|parseFloat|parseInt|unescape|dojo|dijit|dojox|window|document|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g, "").
					match(/([a-z_$][a-z_$\d]*)/gi) || [], t = {};
				arr.forEach(vars, function(v){
					if(!t.hasOwnProperty(v)){
						args.push(v);
						t[v] = 1;
					}
				});
			}
		}
		return {args: args, body: s};	// Object
	};

	var compose = function(/*Array*/ a){
		return a.length ?
					function(){
						var i = a.length - 1, x = df.lambda(a[i]).apply(this, arguments);
						for(--i; i >= 0; --i){ x = df.lambda(a[i]).call(this, x); }
						return x;
					}
				:
					// identity
					function(x){ return x; };
	};

	lang.mixin(df, {
		// lambda
		rawLambda: function(/*String*/ s){
			// summary:
			//		builds a function from a snippet, or array (composing),
			//		returns an object describing the function; functions are
			//		passed through unmodified.
			// description:
			//		This method is to normalize a functional representation (a
			//		text snippet) to an object that contains an array of
			//		arguments, and a body , which is used to calculate the
			//		returning value.
			return lambda(s);	// Object
		},
		buildLambda: function(/*String*/ s){
			// summary:
			//		builds a function from a snippet, returns a string, which
			//		represents the function.
			// description:
			//		This method returns a textual representation of a function
			//		built from the snippet. It is meant to be evaled in the
			//		proper context, so local variables can be pulled from the
			//		environment.
			var l = lambda(s);
			return "function(" + l.args.join(",") + "){return (" + l.body + ");}";	// String
		},
		lambda: function(/*Function|String|Array*/ s){
			// summary:
			//		builds a function from a snippet, or array (composing),
			//		returns a function object; functions are passed through
			//		unmodified.
			// description:
			//		This method is used to normalize a functional
			//		representation (a text snippet, an array, or a function) to
			//		a function object.
			if(typeof s == "function"){ return s; }
			if(s instanceof Array){ return compose(s); }
			if(lcache.hasOwnProperty(s)){ return lcache[s]; }
			var l = lambda(s);
			return lcache[s] = new Function(l.args, "return (" + l.body + ");");	// Function
		},
		clearLambdaCache: function(){
			// summary:
			//		clears internal cache of lambdas
			lcache = {};
		}
	});
	
	return df;
});

},
'money/nls/daily':function(){
define({
	root: {
		title	: "Transactions",
	    add		: 'Add',
	    menu	: 'Menu',
		welcome	: 'Welcome to the R5M Finance - Free cross-platform personal finance manager',
		tapAdd	: 'Tap "Add" button to add one',
		
		expences: 'Expences',
		incomes : 'Incomes',
		transfers:'Transfers',
		total	: 'Total',
		summary : 'By days',
		noExpences : 'No expences found on this day',
		noIncomes : 'No incomes found on this day',
		noTransfers : 'No transfers found on this day',
		noTags	: 'No tags',
		stats	: 'Statistics'
		
	},
	'ru-ru': true
});

},
'money/nls/ru-ru/daily':function(){
define({
	title	: "Транзакции",
	add		: 'Добавить',
	menu	: 'Меню',
	welcome	: 'Добро пожаловать в R5M Finance - свободный кросс-платформенный менеджер Ваших личных финансов',
	tapAdd	: 'Нажмите "Добавить", чтобы создать транзакцию',
		
	expences: 'Расходы',
	incomes : 'Доходы',
	transfers:'Переводы',
		
	summary : 'По дням',
	total	: 'Всего',
	noExpences : 'Не найдено расходов в этот день',
	noIncomes : 'Не найдено доходов в этот день',
	noTransfers : 'Не найдено переводов в этот день',
	noTags	: 'Без меток',
	stats	: 'Статистика'
	
});

},
'dojox/charting/plot2d/CartesianBase':function(){
define(["dojo/_base/lang", "dojo/_base/declare", "dojo/_base/connect", "dojo/has",
		"./Base", "../scaler/primitive", "dojox/gfx", "dojox/gfx/fx", "dojox/lang/utils"], 
	function(lang, declare, hub, has, Base, primitive, gfx, fx, du){
	/*=====
	declare("dojox.charting.plot2d.__CartesianCtorArgs", dojox.charting.plot2d.__PlotCtorArgs, {
		// hAxis: String?
		//		The horizontal axis name.
		hAxis: "x",

		// vAxis: String?
		//		The vertical axis name
		vAxis: "y",

		// labels: Boolean?
		//		For plots that support labels, whether or not to draw labels for each data item.  Default is false.
		labels:			false,

		// fixed: Boolean?
        //		Whether a fixed precision must be applied to data values for display. Default is true.
		fixed:			true,

		// precision: Number?
        //		The precision at which to round data values for display. Default is 0.
		precision:		1,

		// labelOffset: Number?
		//		The amount in pixels by which to offset labels when using "outside" labelStyle.  Default is 10.
		labelOffset:	10,

		// labelStyle: String?
		//		Options as to where to draw labels.  This must be either "inside" or "outside". By default
		//      the labels are drawn "inside" the shape representing the data point (a column rectangle for a Columns plot
		//      or a marker for a Line plot for instance). When "outside" is used the labels are drawn above the data point shape.
		labelStyle:		"inside",

		// htmlLabels: Boolean?
		//		Whether or not to use HTML to render slice labels. Default is true.
		htmlLabels:		true,

		// omitLabels: Boolean?
		//		Whether labels that do not fit in an item render are omitted or not.	This applies only when labelStyle
		//		is "inside".	Default is false.
		omitLabels: true,

		// labelFunc: Function?
		//		An optional function to use to compute label text. It takes precedence over
		//		the default text when available.
		//	|		function labelFunc(value, fixed, precision) {}
		//		`value` is the data value to display
		//		`fixed` is true if fixed precision must be applied.
		//		`precision` is the requested precision to be applied.
		labelFunc: null
	});
	=====*/

	return declare("dojox.charting.plot2d.CartesianBase", Base, {
		baseParams: {
			hAxis: 			"x",
			vAxis: 			"y",
			labels:			false,
			labelOffset:    10,
			fixed:			true,
			precision:		1,
			labelStyle:		"inside",
			htmlLabels:		true,		// use HTML to draw labels
			omitLabels:		true,
			labelFunc:		null
        },

		// summary:
		//		Base class for cartesian plot types.
		constructor: function(chart, kwArgs){
			// summary:
			//		Create a cartesian base plot for cartesian charts.
			// chart: dojox/chart/Chart
			//		The chart this plot belongs to.
			// kwArgs: dojox.charting.plot2d.__CartesianCtorArgs?
			//		An optional arguments object to help define the plot.
			this.axes = ["hAxis", "vAxis"];
			this.zoom = null;
			this.zoomQueue = [];	// zooming action task queue
			this.lastWindow = {vscale: 1, hscale: 1, xoffset: 0, yoffset: 0};
			this.hAxis = (kwArgs && kwArgs.hAxis) || "x";
			this.vAxis = (kwArgs && kwArgs.vAxis) || "y";
			this.series = [];
			this.opt = lang.clone(this.baseParams);
			du.updateWithObject(this.opt, kwArgs);
		},
		clear: function(){
			// summary:
			//		Clear out all of the information tied to this plot.
			// returns: dojox/charting/plot2d/CartesianBase
			//		A reference to this plot for functional chaining.
			this.inherited(arguments);
			this._hAxis = null;
			this._vAxis = null;
			return this;	//	dojox/charting/plot2d/CartesianBase
		},
		cleanGroup: function(creator, noClip){
			this.inherited(arguments);
			if(!noClip && this.chart._nativeClip){
				var offsets = this.chart.offsets, dim = this.chart.dim;
				var w = Math.max(0, dim.width  - offsets.l - offsets.r),
					h = Math.max(0, dim.height - offsets.t - offsets.b);
				this.group.setClip({ x: offsets.l, y: offsets.t, width: w, height: h });
				if(!this._clippedGroup){
					this._clippedGroup = this.group.createGroup();
				}
			}
		},
		purgeGroup: function(){
			this.inherited(arguments);
			this._clippedGroup = null;
		},
		getGroup: function(){
			return this._clippedGroup || this.group;
		},
		setAxis: function(axis){
			// summary:
			//		Set an axis for this plot.
			// axis: dojox/charting/axis2d/Base
			//		The axis to set.
			// returns: dojox/charting/plot2d/CartesianBase
			//		A reference to this plot for functional chaining.
			if(axis){
				this[axis.vertical ? "_vAxis" : "_hAxis"] = axis;
			}
			return this;	//	dojox/charting/plot2d/CartesianBase
		},
		toPage: function(coord){
			// summary:
			//		Compute page coordinates from plot axis data coordinates.
			// coord: Object?
			//		The coordinates in plot axis data coordinate space. For cartesian charts that is of the following form:
			//		`{ hAxisName: 50, vAxisName: 200 }`
			//		If not provided return the transform method instead of the result of the transformation.
			// returns: Object
			//		The resulting page pixel coordinates. That is of the following form:
			//		`{ x: 50, y: 200 }`
			var ah = this._hAxis, av = this._vAxis,
				sh = ah.getScaler(), sv = av.getScaler(),
				th = sh.scaler.getTransformerFromModel(sh),
				tv = sv.scaler.getTransformerFromModel(sv),
				c = this.chart.getCoords(),
				o = this.chart.offsets, dim = this.chart.dim;
			var t = function(coord){
				var r = {};
				r.x = th(coord[ah.name]) + c.x + o.l;
				r.y = c.y + dim.height - o.b - tv(coord[av.name]);
				return r;
			};
			// if no coord return the function so that we can capture the current transforms
			// and reuse them later on
			return coord?t(coord):t; // Object
		},
		toData: function(coord){
			// summary:
			//		Compute plot axis data coordinates from page coordinates.
			// coord: Object
			//		The pixel coordinate in page coordinate space. That is of the following form:
			//		`{ x: 50, y: 200 }`
			//		If not provided return the tranform method instead of the result of the transformation.
			// returns: Object
			//		The resulting plot axis data coordinates. For cartesian charts that is of the following form:
			//		`{ hAxisName: 50, vAxisName: 200 }`
			var ah = this._hAxis, av = this._vAxis,
				sh = ah.getScaler(), sv = av.getScaler(),
				th = sh.scaler.getTransformerFromPlot(sh),
				tv = sv.scaler.getTransformerFromPlot(sv),
				c = this.chart.getCoords(),
				o = this.chart.offsets, dim = this.chart.dim;
			var t = function(coord){
				var r = {};
				r[ah.name] = th(coord.x - c.x - o.l);
				r[av.name] = tv(c.y + dim.height - coord.y  - o.b);
				return r;
			};
			// if no coord return the function so that we can capture the current transforms
			// and reuse them later on
			return coord?t(coord):t; // Object
		},
		isDirty: function(){
			// summary:
			//		Returns whether or not this plot needs to be rendered.
			// returns: Boolean
			//		The state of the plot.
			return this.dirty || this._hAxis && this._hAxis.dirty || this._vAxis && this._vAxis.dirty;	//	Boolean
		},
		createLabel: function(group, value, bbox, theme){
			if(this.opt.labels){
				var x, y, label = this.opt.labelFunc?this.opt.labelFunc.apply(this, [value, this.opt.fixed, this.opt.precision]):
					this._getLabel(isNaN(value.y)?value:value.y);
				if(this.opt.labelStyle == "inside"){
					var lbox = gfx._base._getTextBox(label, { font: theme.series.font } );
					x = bbox.x + bbox.width / 2;
					y = bbox.y + bbox.height / 2 + lbox.h / 4;
					if(lbox.w > bbox.width || lbox.h > bbox.height){
						return;
					}

				}else{
					x = bbox.x + bbox.width / 2;
					y = bbox.y - this.opt.labelOffset;
				}
				this.renderLabel(group, x, y, label, theme, this.opt.labelStyle == "inside");
			}
		},
		performZoom: function(dim, offsets){
			// summary:
			//		Create/alter any zooming windows on this plot.
			// dim: Object
			//		An object of the form { width, height }.
			// offsets: Object
			//		An object of the form { l, r, t, b }.
			// returns: dojox/charting/plot2d/CartesianBase
			//		A reference to this plot for functional chaining.

			// get current zooming various
			var vs = this._vAxis.scale || 1,
				hs = this._hAxis.scale || 1,
				vOffset = dim.height - offsets.b,
				hBounds = this._hScaler.bounds,
				xOffset = (hBounds.from - hBounds.lower) * hBounds.scale,
				vBounds = this._vScaler.bounds,
				yOffset = (vBounds.from - vBounds.lower) * vBounds.scale,
				// get incremental zooming various
				rVScale = vs / this.lastWindow.vscale,
				rHScale = hs / this.lastWindow.hscale,
				rXOffset = (this.lastWindow.xoffset - xOffset)/
					((this.lastWindow.hscale == 1)? hs : this.lastWindow.hscale),
				rYOffset = (yOffset - this.lastWindow.yoffset)/
					((this.lastWindow.vscale == 1)? vs : this.lastWindow.vscale),

				shape = this.getGroup(),
				anim = fx.animateTransform(lang.delegate({
					shape: shape,
					duration: 1200,
					transform:[
						{name:"translate", start:[0, 0], end: [offsets.l * (1 - rHScale), vOffset * (1 - rVScale)]},
						{name:"scale", start:[1, 1], end: [rHScale, rVScale]},
						{name:"original"},
						{name:"translate", start: [0, 0], end: [rXOffset, rYOffset]}
					]}, this.zoom));

			lang.mixin(this.lastWindow, {vscale: vs, hscale: hs, xoffset: xOffset, yoffset: yOffset});
			//add anim to zooming action queue,
			//in order to avoid several zooming action happened at the same time
			this.zoomQueue.push(anim);
			//perform each anim one by one in zoomQueue
			hub.connect(anim, "onEnd", this, function(){
				this.zoom = null;
				this.zoomQueue.shift();
				if(this.zoomQueue.length > 0){
					this.zoomQueue[0].play();
				}
			});
			if(this.zoomQueue.length == 1){
				this.zoomQueue[0].play();
			}
			return this;	//	dojox/charting/plot2d/CartesianBase
		},
		initializeScalers: function(dim, stats){
			// summary:
			//		Initializes scalers using attached axes.
			// dim: Object
			//		Size of a plot area in pixels as {width, height}.
			// stats: Object
			//		Min/max of data in both directions as {hmin, hmax, vmin, vmax}.
			// returns: dojox/charting/plot2d/CartesianBase
			//		A reference to this plot for functional chaining.
			if(this._hAxis){
				if(!this._hAxis.initialized()){
					this._hAxis.calculate(stats.hmin, stats.hmax, dim.width);
				}
				this._hScaler = this._hAxis.getScaler();
			}else{
				this._hScaler = primitive.buildScaler(stats.hmin, stats.hmax, dim.width);
			}
			if(this._vAxis){
				if(!this._vAxis.initialized()){
					this._vAxis.calculate(stats.vmin, stats.vmax, dim.height);
				}
				this._vScaler = this._vAxis.getScaler();
			}else{
				this._vScaler = primitive.buildScaler(stats.vmin, stats.vmax, dim.height);
			}
			return this;	//	dojox/charting/plot2d/CartesianBase
		}
	});
});

},
'dojox/app/utils/nls':function(){
define(["require", "dojo/Deferred"],  function(require, Deferred){
	return function(/*Object*/ config, /*Object*/ parent){
		// summary:
		//		nsl is called to create to load the nls all for the app, or for a view.
		// config: Object
		//		The section of the config for this view or for the app.
		// parent: Object
		//		The parent of this view or the app itself, so that models from the parent will be
		//		available to the view.
		var path = config.nls;
		if(path){
			var nlsDef = new Deferred();
			var requireSignal;
			try{
				var loadFile = path;
				var index = loadFile.indexOf("./");
				if(index >= 0){
					loadFile = path.substring(index+2);
				}
				requireSignal = require.on ? require.on("error", function(error){
					if (nlsDef.isResolved() || nlsDef.isRejected()) {
						return;
					}
					if(error.info[0] && (error.info[0].indexOf(loadFile)>= 0)){
						nlsDef.resolve(false);
						if(requireSignal){
							requireSignal.remove();
						}
					}
				}) : null;

				if(path.indexOf("./") == 0){
					path = "app/"+path;
				}

				require(["dojo/i18n!"+path], function(nls){
					nlsDef.resolve(nls);
					requireSignal.remove();
				});
			}catch(e){
				nlsDef.reject(e);
				if(requireSignal){
					requireSignal.remove();
				}
			}
			return nlsDef;
		}else{
			return false;
		}
	};
});

},
'money/nls/timespan':function(){
define({
	root: {
		title	: "Timespan",
	    done	: 'DONE',
	    help	: 'Here you can select timespan for your transactions list and statistics page',
	    menu	: 'Menu',
		last31	: 'One month till today',
	    customTimespan	: 'This month',
	    lastMonth 		: 'One month since the date...',
	    allTimespan		: 'All the time',
	    selectTimespan 	: 'Select timespan'
	},
	'ru-ru': true
});

},
'money/nls/ru-ru/timespan':function(){
define({
		title	: "Отрезок времени",
	    done	: 'Готово',
	    help	: 'Здесь Вы можете задать отрезок времени для списка транзакций и статистических отчетов',
	    menu	: 'Меню',
	    last31	: 'Месяц до сегодняшнего дня',
	    customTimespan	: 'Текущий месяц',
	    lastMonth 		: 'Один месяц с выбранной даты...',
	    allTimespan		: 'Всё время',
	    selectTimespan 	: 'Выберите отрезок времени'
});

},
'dojox/charting/themes/common':function(){
define(["dojo/_base/lang"], function(lang){
	return lang.getObject("dojox.charting.themes", true);
});

},
'money/views/transition':function(){
define(["dojo/_base/declare","dojo/dom-class", "dojo/dom-attr","dojo/sniff",'dojo/on','dojo/text!money/views/transition.html'],
    function(declare, domClass, domAttr, has, on){
    
	return window.AppData.objAbout = {
		effects : ['none','fade','slide','flip'],
		
		beforeActivate: function(contact){
		    this.selectActiveListItem();		    
        },
        init: function(){
			var self = this		
			for(var i=0; i < this.effects.length; i++){
				(function(item){
					on(self[ self.effects[item] ], 'click', function(){
						self.setActiveListItem( self.effects[ item ] )
					})
				})(i)
			}
        },   
        selectActiveListItem: function(){
			var current = localStorage.getItem( 'transition' ) ? localStorage.getItem( 'transition' ) : 'none'
			//var current = 'none'
			console.log(current)
			this[ current ].set( 'checked' , true );
		},
		setActiveListItem: function( effect ) {
			console.log( effect )
			var current = localStorage.setItem( 'transition', effect)
			this[ effect ].set( 'checked' , true );
			location.reload();
		}   
    };
});

},
'dojox/gfx/canvas':function(){
define(["./_base", "dojo/_base/lang", "dojo/_base/array", "dojo/_base/declare", "dojo/_base/window", "dojo/dom-geometry",
		"dojo/dom", "./shape", "./path", "./arc", "./matrix", "./decompose", "./bezierutils"],
function(g, lang, arr, declare, win, domGeom, dom, gs, pathLib, ga, m, decompose, bezierUtils ){
	var canvas = g.canvas = {
		// summary:
		//		This the graphics rendering bridge for W3C Canvas compliant browsers.
		//		Since Canvas is an immediate mode graphics api, with no object graph or
		//		eventing capabilities, use of this module alone will only add in drawing support.
		//		The additional module, canvasWithEvents extends this module with additional support
		//		for handling events on Canvas.  By default, the support for events is now included
		//		however, if only drawing capabilities are needed, canvas event module can be disabled
		//		using the dojoConfig option, canvasEvents:true|false.
		//		The id of the Canvas renderer is 'canvas'.  This id can be used when switch Dojo's
		//		graphics context between renderer implementations.  See dojox/gfx/_base.switchRenderer
		//		API.
	};
	var pattrnbuffer = null,
		mp = m.multiplyPoint,
		pi = Math.PI,
		twoPI = 2 * pi,
		halfPI = pi /2,
		extend = lang.extend;

	if(win.global.CanvasRenderingContext2D){
		var ctx2d = win.doc.createElement("canvas").getContext("2d");
		var hasNativeDash = typeof ctx2d.setLineDash == "function";
		var hasFillText = typeof ctx2d.fillText == "function";
	}

	var dasharray = {
		solid:				"none",
		shortdash:			[4, 1],
		shortdot:			[1, 1],
		shortdashdot:		[4, 1, 1, 1],
		shortdashdotdot:	[4, 1, 1, 1, 1, 1],
		dot:				[1, 3],
		dash:				[4, 3],
		longdash:			[8, 3],
		dashdot:			[4, 3, 1, 3],
		longdashdot:		[8, 3, 1, 3],
		longdashdotdot:		[8, 3, 1, 3, 1, 3]
	};

	function drawDashedArc(/*CanvasRenderingContext2D*/ctx, /*Number[]*/dash,  /*int*/cx,  /*int*/cy,  /*int*/r, /*Number*/sa, /*Number*/ea, /*Boolean*/ccw, /*Boolean?*/apply, prevResidue){
		var residue, angle, l = dash.length, i= 0;
		// if there's a previous dash residue from the previous arc, start with it.
		if(prevResidue){
			angle = prevResidue.l/r;
			i = prevResidue.i;
		}else{
			angle = dash[0]/r;
		}
		while(sa < ea){
			// if the dash segment length is longer than what remains to stroke, keep it for next arc. (aka residue)
			if(sa+angle > ea){
				residue = {l: (sa+angle-ea)*r, i: i};
				angle = ea-sa;
			}
			if(!(i%2)){
				ctx.beginPath();
				ctx.arc(cx, cy, r, sa, sa+angle, ccw);
				if(apply) ctx.stroke();
			}
			sa += angle;
			++i;
			angle = dash[i%l]/r;
		}
		return residue;
	}

	function splitToDashedBezier(/*Number[]*/points, /*Number[]*/dashArray, /*Number[]*/newPoints, /*Object*/prevResidue){
		var residue = 0, t = 0, dash, i = 0;
		if(prevResidue){
			dash = prevResidue.l;
			i = prevResidue.i;
		}else{
			dash = dashArray[0];
		}
		while(t<1){
			// get the 't' corresponding to the given dash value.
			t = bezierUtils.tAtLength(points, dash);
			if(t==1){
				var rl = bezierUtils.computeLength(points);
				residue = {l: dash-rl, i: i};
			}
			// split bezier at t: left part is the "dash" curve, right part is the remaining bezier points
			var curves = bezierUtils.splitBezierAtT(points, t);
			if(!(i%2)){
				// only keep the "dash" curve
				newPoints.push(curves[0]);
			}
			points = curves[1];
			++i;
			dash = dashArray[i%dashArray.length];
		}
		return residue;
	}

	function toDashedCurveTo(/*Array||CanvasRenderingContext2D*/ctx, /*shape.Path*/shape, /*Number[]*/points, /*Object*/prevResidue){
		// summary:
		//		Builds a set of bezier (cubic || quadratic)curveTo' canvas instructions that represents a dashed stroke of the specified bezier geometry.

		var pts = [shape.last.x, shape.last.y].concat(points),
			quadratic = points.length === 4, ctx2d = !(ctx instanceof Array),
			api = quadratic ? "quadraticCurveTo" : "bezierCurveTo",
			curves = [];
		var residue = splitToDashedBezier(pts, shape.canvasDash, curves, prevResidue);
		for(var c=0; c<curves.length;++c){
			var curve = curves[c];
			if(ctx2d){
				ctx.moveTo(curve[0], curve[1]);
				ctx[api].apply(ctx, curve.slice(2));
			}else{
				ctx.push("moveTo", [curve[0], curve[1]]);
				ctx.push(api, curve.slice(2));
			}
		}
		return residue;
	}

	function toDashedLineTo(/*Array||CanvasRenderingContext2D*/ctx, /*shape.Shape*/shape, /*int*/x1, /*int*/y1, /*int*/x2, /*int*/y2, /*Object*/prevResidue){
		// summary:
		//		Builds a set of moveTo/lineTo' canvas instructions that represents a dashed stroke of the specified line geometry.

		var residue = 0, r = 0, dal = 0, tlength = bezierUtils.distance(x1, y1, x2, y2), i = 0, dash = shape.canvasDash,
			prevx = x1, prevy = y1, x, y, ctx2d = !(ctx instanceof Array);
		if(prevResidue){
			dal=prevResidue.l;
			i = prevResidue.i;
		}else{
			dal += dash[0];
		}
		while(Math.abs(1-r)>0.01){
			if(dal>tlength){
				residue = {l:dal-tlength,i:i};
				dal=tlength;
			}
			r = dal/tlength;
			x = x1 + (x2-x1)*r;
			y = y1 + (y2-y1)*r;
			if(!(i++%2)){
				if(ctx2d){
					ctx.moveTo(prevx, prevy);
					ctx.lineTo(x, y);
				}else{
					ctx.push("moveTo", [prevx, prevy]);
					ctx.push("lineTo", [x, y]);
				}
			}
			prevx = x;
			prevy = y;
			dal += dash[i%dash.length];
		}
		return residue;
	}

	canvas.Shape = declare("dojox.gfx.canvas.Shape", gs.Shape, {
		_render: function(/* Object */ ctx){
			// summary:
			//		render the shape
			ctx.save();
			this._renderTransform(ctx);
			this._renderClip(ctx);
			this._renderShape(ctx);
			this._renderFill(ctx, true);
			this._renderStroke(ctx, true);
			ctx.restore();
		},
		_renderClip: function(ctx){
			if (this.canvasClip){
				this.canvasClip.render(ctx);
				ctx.clip();
			}
		},
		_renderTransform: function(/* Object */ ctx){
			if("canvasTransform" in this){
				var t = this.canvasTransform;
				ctx.translate(t.dx, t.dy);
				ctx.rotate(t.angle2);
				ctx.scale(t.sx, t.sy);
				ctx.rotate(t.angle1);
				// The future implementation when vendors catch up with the spec:
				// var t = this.matrix;
				// ctx.transform(t.xx, t.yx, t.xy, t.yy, t.dx, t.dy);
			}
		},
		_renderShape: function(/* Object */ ctx){
			// nothing
		},
		_renderFill: function(/* Object */ ctx, /* Boolean */ apply){
			if("canvasFill" in this){
				var fs = this.fillStyle;
				if("canvasFillImage" in this){
					var w = fs.width, h = fs.height,
						iw = this.canvasFillImage.width, ih = this.canvasFillImage.height,
						// let's match the svg default behavior wrt. aspect ratio: xMidYMid meet
						sx = w == iw ? 1 : w / iw,
						sy = h == ih ? 1 : h / ih,
						s = Math.min(sx,sy), //meet->math.min , slice->math.max
						dx = (w - s * iw)/2,
						dy = (h - s * ih)/2;
					// the buffer used to scaled the image
					pattrnbuffer.width = w; pattrnbuffer.height = h;
					var copyctx = pattrnbuffer.getContext("2d");
					copyctx.clearRect(0, 0, w, h);
					copyctx.drawImage(this.canvasFillImage, 0, 0, iw, ih, dx, dy, s*iw, s*ih);
					this.canvasFill = ctx.createPattern(pattrnbuffer, "repeat");
					delete this.canvasFillImage;
				}
				ctx.fillStyle = this.canvasFill;
				if(apply){
					// offset the pattern
					if (fs.type==="pattern" && (fs.x !== 0 || fs.y !== 0)) {
						ctx.translate(fs.x,fs.y);
					}
					ctx.fill();
				}
			}else{
				ctx.fillStyle = "rgba(0,0,0,0.0)";
			}
		},
		_renderStroke: function(/* Object */ ctx, /* Boolean */ apply){
			var s = this.strokeStyle;
			if(s){
				ctx.strokeStyle = s.color.toString();
				ctx.lineWidth = s.width;
				ctx.lineCap = s.cap;
				if(typeof s.join == "number"){
					ctx.lineJoin = "miter";
					ctx.miterLimit = s.join;
				}else{
					ctx.lineJoin = s.join;
				}
				if(this.canvasDash){
					if(hasNativeDash){
						ctx.setLineDash(this.canvasDash);
						if(apply){ ctx.stroke(); }
					}else{
						this._renderDashedStroke(ctx, apply);
					}
				}else{
					if(apply){ ctx.stroke(); }
				}
			}else if(!apply){
				ctx.strokeStyle = "rgba(0,0,0,0.0)";
			}
		},
		_renderDashedStroke: function(ctx, apply){},

		// events are not implemented
		getEventSource: function(){ return null; },
		on:				function(){},
		connect:		function(){},
		disconnect:		function(){},

		canvasClip:null,
		setClip: function(/*Object*/clip){
			this.inherited(arguments);
			var clipType = clip ? "width" in clip ? "rect" :
							"cx" in clip ? "ellipse" :
							"points" in clip ? "polyline" : "d" in clip ? "path" : null : null;
			if(clip && !clipType){
				return this;
			}
			this.canvasClip = clip ? makeClip(clipType, clip) : null;
			if(this.parent){this.parent._makeDirty();}
			return this;
		}
	});

	var makeClip = function(clipType, geometry){
		switch(clipType){
			case "ellipse":
				return {
					canvasEllipse: makeEllipse({shape:geometry}),
					render: function(ctx){return canvas.Ellipse.prototype._renderShape.call(this, ctx);}
				};
			case "rect":
				return {
					shape: lang.delegate(geometry,{r:0}),
					render: function(ctx){return canvas.Rect.prototype._renderShape.call(this, ctx);}
				};
			case "path":
				return {
					canvasPath: makeClipPath(geometry),
					render: function(ctx){this.canvasPath._renderShape(ctx);}
				};
			case "polyline":
				return {
					canvasPolyline: geometry.points,
					render: function(ctx){return canvas.Polyline.prototype._renderShape.call(this, ctx);}
				};
		}
		return null;
	};

	var makeClipPath = function(geo){
		var p = new dojox.gfx.canvas.Path();
		p.canvasPath = [];
		p._setPath(geo.d);
		return p;
	};

	var modifyMethod = function(shape, method, extra){
		var old = shape.prototype[method];
		shape.prototype[method] = extra ?
			function(){
				if(this.parent){this.parent._makeDirty();}
				old.apply(this, arguments);
				extra.call(this);
				return this;
			} :
			function(){
				if(this.parent){this.parent._makeDirty();}
				return old.apply(this, arguments);
			};
	};

	modifyMethod(canvas.Shape, "setTransform",
		function(){
			// prepare Canvas-specific structures
			if(this.matrix){
				this.canvasTransform = g.decompose(this.matrix);
			}else{
				delete this.canvasTransform;
			}
		});

	modifyMethod(canvas.Shape, "setFill",
		function(){
			// prepare Canvas-specific structures
			var fs = this.fillStyle, f;
			if(fs){
				if(typeof(fs) == "object" && "type" in fs){
					var ctx = this.surface.rawNode.getContext("2d");
					switch(fs.type){
						case "linear":
						case "radial":
							f = fs.type == "linear" ?
								ctx.createLinearGradient(fs.x1, fs.y1, fs.x2, fs.y2) :
								ctx.createRadialGradient(fs.cx, fs.cy, 0, fs.cx, fs.cy, fs.r);
							arr.forEach(fs.colors, function(step){
								f.addColorStop(step.offset, g.normalizeColor(step.color).toString());
							});
							break;
						case "pattern":
							if (!pattrnbuffer) {
								pattrnbuffer = document.createElement("canvas");
							}
							// no need to scale the image since the canvas.createPattern uses
							// the original image data and not the scaled ones (see spec.)
							// the scaling needs to be done at rendering time in a context buffer
							var img =new Image();
							this.surface.downloadImage(img, fs.src);
							this.canvasFillImage = img;
					}
				}else{
					// Set fill color using CSS RGBA func style
					f = fs.toString();
				}
				this.canvasFill = f;
			}else{
				delete this.canvasFill;
			}
		});

	modifyMethod(canvas.Shape, "setStroke",
		function(){
			var st = this.strokeStyle;
			if(st){
				var da = this.strokeStyle.style.toLowerCase();
				if(da in dasharray){
					da = dasharray[da];
				}
				if(da instanceof Array){
					da = da.slice();
					this.canvasDash = da;
					var i;
					for(i = 0; i < da.length; ++i){
						da[i] *= st.width;
					}
					if(st.cap != "butt"){
						for(i = 0; i < da.length; i += 2){
							da[i] -= st.width;
							if(da[i] < 1){ da[i] = 1; }
						}
						for(i = 1; i < da.length; i += 2){
							da[i] += st.width;
						}
					}
				}else{
					delete this.canvasDash;
				}
			}else{
				delete this.canvasDash;
			}
			this._needsDash = !hasNativeDash && !!this.canvasDash;
		});

	modifyMethod(canvas.Shape, "setShape");

	canvas.Group = declare("dojox.gfx.canvas.Group", canvas.Shape, {
		// summary:
		//		a group shape (Canvas), which can be used
		//		to logically group shapes (e.g, to propagate matricies)
		constructor: function(){
			gs.Container._init.call(this);
		},
		_render: function(/* Object */ ctx){
			// summary:
			//		render the group
			ctx.save();
			this._renderTransform(ctx);
			this._renderClip(ctx);
			for(var i = 0; i < this.children.length; ++i){
				this.children[i]._render(ctx);
			}
			ctx.restore();
		},
		destroy: function(){
			// summary:
			//		Releases all internal resources owned by this shape. Once this method has been called,
			//		the instance is considered disposed and should not be used anymore.

			// don't call canvas impl to avoid makeDirty'
			gs.Container.clear.call(this, true);
			// avoid this.inherited
			canvas.Shape.prototype.destroy.apply(this, arguments);
		}
	});



	canvas.Rect = declare("dojox.gfx.canvas.Rect", [canvas.Shape, gs.Rect], {
		// summary:
		//		a rectangle shape (Canvas)
		_renderShape: function(/* Object */ ctx){
			var s = this.shape, r = Math.min(s.r, s.height / 2, s.width / 2),
				xl = s.x, xr = xl + s.width, yt = s.y, yb = yt + s.height,
				xl2 = xl + r, xr2 = xr - r, yt2 = yt + r, yb2 = yb - r;
			ctx.beginPath();
			ctx.moveTo(xl2, yt);
			if(r){
				ctx.arc(xr2, yt2, r, -halfPI, 0, false);
				ctx.arc(xr2, yb2, r, 0, halfPI, false);
				ctx.arc(xl2, yb2, r, halfPI, pi, false);
				ctx.arc(xl2, yt2, r, pi, pi + halfPI, false);
			}else{
				ctx.lineTo(xr2, yt);
				ctx.lineTo(xr, yb2);
				ctx.lineTo(xl2, yb);
				ctx.lineTo(xl, yt2);
			}
			ctx.closePath();
		},
		_renderDashedStroke: function(ctx, apply){
			var s = this.shape, residue, r = Math.min(s.r, s.height / 2, s.width / 2),
				xl = s.x, xr = xl + s.width, yt = s.y, yb = yt + s.height,
				xl2 = xl + r, xr2 = xr - r, yt2 = yt + r, yb2 = yb - r;
			if(r){
				ctx.beginPath();
				residue = toDashedLineTo(ctx, this, xl2, yt, xr2, yt);
				if(apply) ctx.stroke();
				residue = drawDashedArc(ctx, this.canvasDash, xr2, yt2, r, -halfPI, 0, false, apply, residue);
				ctx.beginPath();
				residue = toDashedLineTo(ctx, this, xr, yt2, xr, yb2, residue);
				if(apply) ctx.stroke();
				residue = drawDashedArc(ctx, this.canvasDash, xr2, yb2, r, 0, halfPI, false, apply, residue);
				ctx.beginPath();
				residue = toDashedLineTo(ctx, this, xr2, yb, xl2, yb, residue);
				if(apply) ctx.stroke();
				residue = drawDashedArc(ctx, this.canvasDash, xl2, yb2, r, halfPI, pi, false, apply, residue);
				ctx.beginPath();
				residue = toDashedLineTo(ctx, this, xl, yb2, xl, yt2,residue);
				if(apply) ctx.stroke();
				drawDashedArc(ctx, this.canvasDash, xl2, yt2, r, pi, pi + halfPI, false, apply, residue);
			}else{
				ctx.beginPath();
				residue = toDashedLineTo(ctx, this, xl2, yt, xr2, yt);
				residue = toDashedLineTo(ctx, this, xr2, yt, xr, yb2, residue);
				residue = toDashedLineTo(ctx, this, xr, yb2, xl2, yb, residue);
				toDashedLineTo(ctx, this, xl2, yb, xl, yt2, residue);
				if(apply) ctx.stroke();
			}
		}
	});

	var bezierCircle = [];
	(function(){
		var u = ga.curvePI4;
		bezierCircle.push(u.s, u.c1, u.c2, u.e);
		for(var a = 45; a < 360; a += 45){
			var r = m.rotateg(a);
			bezierCircle.push(mp(r, u.c1), mp(r, u.c2), mp(r, u.e));
		}
	})();

	var makeEllipse = function(shape){
		// prepare Canvas-specific structures
		var t, c1, c2, r = [], s = shape.shape,
			M = m.normalize([m.translate(s.cx, s.cy), m.scale(s.rx, s.ry)]);
		t = mp(M, bezierCircle[0]);
		r.push([t.x, t.y]);
		for(var i = 1; i < bezierCircle.length; i += 3){
			c1 = mp(M, bezierCircle[i]);
			c2 = mp(M, bezierCircle[i + 1]);
			t  = mp(M, bezierCircle[i + 2]);
			r.push([c1.x, c1.y, c2.x, c2.y, t.x, t.y]);
		}
		if(shape._needsDash){
			var points = [], p1 = r[0];
			for(i = 1; i < r.length; ++i){
				var curves = [];
				splitToDashedBezier(p1.concat(r[i]), shape.canvasDash, curves);
				p1 = [r[i][4],r[i][5]];
				points.push(curves);
			}
			shape._dashedPoints = points;
		}
		return r;
	};

	canvas.Ellipse = declare("dojox.gfx.canvas.Ellipse", [canvas.Shape, gs.Ellipse], {
		// summary:
		//		an ellipse shape (Canvas)
		setShape: function(){
			this.inherited(arguments);
			this.canvasEllipse = makeEllipse(this);
			return this;
		},
		setStroke: function(){
			this.inherited(arguments);
			if(!hasNativeDash){
				this.canvasEllipse = makeEllipse(this);
			}
			return this;
		},
		_renderShape: function(/* Object */ ctx){
			var r = this.canvasEllipse, i;
			ctx.beginPath();
			ctx.moveTo.apply(ctx, r[0]);
			for(i = 1; i < r.length; ++i){
				ctx.bezierCurveTo.apply(ctx, r[i]);
			}
			ctx.closePath();
		},
		_renderDashedStroke: function(ctx, apply){
			var r = this._dashedPoints;
			ctx.beginPath();
			for(var i = 0; i < r.length; ++i){
				var curves = r[i];
				for(var j=0;j<curves.length;++j){
					var curve = curves[j];
					ctx.moveTo(curve[0], curve[1]);
					ctx.bezierCurveTo(curve[2],curve[3],curve[4],curve[5],curve[6],curve[7]);
				}
			}
			if(apply) ctx.stroke();
		}
	});

	canvas.Circle = declare("dojox.gfx.canvas.Circle", [canvas.Shape, gs.Circle], {
		// summary:
		//		a circle shape (Canvas)
		_renderShape: function(/* Object */ ctx){
			var s = this.shape;
			ctx.beginPath();
			ctx.arc(s.cx, s.cy, s.r, 0, twoPI, 1);
		},
		_renderDashedStroke: function(ctx, apply){
			var s = this.shape;
			var startAngle = 0, angle, l = this.canvasDash.length; i=0;
			while(startAngle < twoPI){
				angle = this.canvasDash[i%l]/s.r;
				if(!(i%2)){
					ctx.beginPath();
					ctx.arc(s.cx, s.cy, s.r, startAngle, startAngle+angle, 0);
					if(apply) ctx.stroke();
				}
				startAngle+=angle;
				++i;
			}
		}
	});

	canvas.Line = declare("dojox.gfx.canvas.Line", [canvas.Shape, gs.Line], {
		// summary:
		//		a line shape (Canvas)
		_renderShape: function(/* Object */ ctx){
			var s = this.shape;
			ctx.beginPath();
			ctx.moveTo(s.x1, s.y1);
			ctx.lineTo(s.x2, s.y2);
		},
		_renderDashedStroke: function(ctx, apply){
			var s = this.shape;
			ctx.beginPath();
			toDashedLineTo(ctx, this, s.x1, s.y1, s.x2, s.y2);
			if(apply) ctx.stroke();
		}
	});

	canvas.Polyline = declare("dojox.gfx.canvas.Polyline", [canvas.Shape, gs.Polyline], {
		// summary:
		//		a polyline/polygon shape (Canvas)
		setShape: function(){
			this.inherited(arguments);
			var p = this.shape.points, f = p[0], r, c, i;
			this.bbox = null;
			// normalize this.shape.points as array of points: [{x,y}, {x,y}, ...]
			this._normalizePoints();
			// after _normalizePoints, if shape.points was [x1,y1,x2,y2,..], shape.points references a new array
			// and p references the original points array
			// prepare Canvas-specific structures, if needed
			if(p.length){
				if(typeof f == "number"){ // already in the canvas format [x1,y1,x2,y2,...]
					r = p;
				}else{ // convert into canvas-specific format
					r = [];
					for(i=0; i < p.length; ++i){
						c = p[i];
						r.push(c.x, c.y);
					}
				}
			}else{
				r = [];
			}
			this.canvasPolyline = r;
			return this;
		},
		_renderShape: function(/* Object */ ctx){
			var p = this.canvasPolyline;
			if(p.length){
				ctx.beginPath();
				ctx.moveTo(p[0], p[1]);
				for(var i = 2; i < p.length; i += 2){
					ctx.lineTo(p[i], p[i + 1]);
				}
			}
		},
		_renderDashedStroke: function(ctx, apply){
			var p = this.canvasPolyline, residue = 0;
			ctx.beginPath();
			for(var i = 0; i < p.length; i += 2){
				residue = toDashedLineTo(ctx, this, p[i], p[i + 1], p[i + 2], p[i + 3], residue);
			}
			if(apply) ctx.stroke();
		}
	});

	canvas.Image = declare("dojox.gfx.canvas.Image", [canvas.Shape, gs.Image], {
		// summary:
		//		an image shape (Canvas)
		setShape: function(){
			this.inherited(arguments);
			// prepare Canvas-specific structures
			var img = new Image();
			this.surface.downloadImage(img, this.shape.src);
			this.canvasImage = img;
			return this;
		},
		_renderShape: function(/* Object */ ctx){
			var s = this.shape;
			ctx.drawImage(this.canvasImage, s.x, s.y, s.width, s.height);
		}
	});

	canvas.Text = declare("dojox.gfx.canvas.Text", [canvas.Shape, gs.Text], {
		_setFont:function(){
			if(this.fontStyle){
				this.canvasFont = g.makeFontString(this.fontStyle);
			}else{
				delete this.canvasFont;
			}
		},

		getTextWidth: function(){
			// summary:
			//		get the text width in pixels
			var s = this.shape, w = 0, ctx;
			if(s.text){
				ctx = this.surface.rawNode.getContext("2d");
				ctx.save();
				this._renderTransform(ctx);
				this._renderFill(ctx, false);
				this._renderStroke(ctx, false);
				if (this.canvasFont)
					ctx.font = this.canvasFont;
				w = ctx.measureText(s.text).width;
				ctx.restore();
			}
			return w;
		},

		// override to apply first fill and stroke (
		// the base implementation is for path-based shape that needs to first define the path then to fill/stroke it.
		// Here, we need the fillstyle or strokestyle to be set before calling fillText/strokeText.
		_render: function(/* Object */ctx){
			// summary:
			//		render the shape
			// ctx: Object
			//		the drawing context.
			ctx.save();
			this._renderTransform(ctx);
			this._renderFill(ctx, false);
			this._renderStroke(ctx, false);
			this._renderShape(ctx);
			ctx.restore();
		},

		_renderShape: function(ctx){
			// summary:
			//		a text shape (Canvas)
			// ctx: Object
			//		the drawing context.
			var ta, s = this.shape;
			if(!s.text){
				return;
			}
			// text align
			ta = s.align === 'middle' ? 'center' : s.align;
			ctx.textAlign = ta;
			if(this.canvasFont){
				ctx.font = this.canvasFont;
			}
			if(this.canvasFill){
				ctx.fillText(s.text, s.x, s.y);
			}
			if(this.strokeStyle){
				ctx.beginPath(); // fix bug in FF3.6. Fixed in FF4b8
				ctx.strokeText(s.text, s.x, s.y);
				ctx.closePath();
			}
		}
	});
	modifyMethod(canvas.Text, "setFont");

	if(!hasFillText){
		canvas.Text.extend({
			getTextWidth: function(){
				return 0;
			},
			getBoundingBox: function(){
				return null;
			},
			_renderShape: function(){
			}
		});
	}

	var pathRenderers = {
			M: "_moveToA", m: "_moveToR",
			L: "_lineToA", l: "_lineToR",
			H: "_hLineToA", h: "_hLineToR",
			V: "_vLineToA", v: "_vLineToR",
			C: "_curveToA", c: "_curveToR",
			S: "_smoothCurveToA", s: "_smoothCurveToR",
			Q: "_qCurveToA", q: "_qCurveToR",
			T: "_qSmoothCurveToA", t: "_qSmoothCurveToR",
			A: "_arcTo", a: "_arcTo",
			Z: "_closePath", z: "_closePath"
		};


	canvas.Path = declare("dojox.gfx.canvas.Path", [canvas.Shape, pathLib.Path], {
		// summary:
		//		a path shape (Canvas)
		constructor: function(){
			this.lastControl = {};
		},
		setShape: function(){
			this.canvasPath = [];
			this._dashedPath= [];
			return this.inherited(arguments);
		},
		setStroke:function(){
			this.inherited(arguments);
			if(!hasNativeDash){
				this.segmented = false;
				this._confirmSegmented();
			}
			return this;
		},
		_setPath: function(){
			this._dashResidue = null;
			this.inherited(arguments);
		},
		_updateWithSegment: function(segment){
			var last = lang.clone(this.last);
			this[pathRenderers[segment.action]](this.canvasPath, segment.action, segment.args, this._needsDash ? this._dashedPath : null);
			this.last = last;
			this.inherited(arguments);
		},
		_renderShape: function(/* Object */ ctx){
			var r = this.canvasPath;
			ctx.beginPath();
			for(var i = 0; i < r.length; i += 2){
				ctx[r[i]].apply(ctx, r[i + 1]);
			}
		},
		_renderDashedStroke: hasNativeDash ? function(){} : function(ctx, apply){
			var r = this._dashedPath;
			ctx.beginPath();
			for(var i = 0; i < r.length; i += 2){
				ctx[r[i]].apply(ctx, r[i + 1]);
			}
			if(apply) ctx.stroke();
		},
		_moveToA: function(result, action, args, doDash){
			result.push("moveTo", [args[0], args[1]]);
			if(doDash) doDash.push("moveTo", [args[0], args[1]]);
			for(var i = 2; i < args.length; i += 2){
				result.push("lineTo", [args[i], args[i + 1]]);
				if(doDash)
					this._dashResidue = toDashedLineTo(doDash, this, args[i - 2], args[i - 1], args[i], args[i + 1], this._dashResidue);
			}
			this.last.x = args[args.length - 2];
			this.last.y = args[args.length - 1];
			this.lastControl = {};
		},
		_moveToR: function(result, action, args, doDash){
			var pts;
			if("x" in this.last){
				pts = [this.last.x += args[0], this.last.y += args[1]];
				result.push("moveTo", pts);
				if(doDash) doDash.push("moveTo", pts);
			}else{
				pts = [this.last.x = args[0], this.last.y = args[1]];
				result.push("moveTo", pts);
				if(doDash) doDash.push("moveTo", pts);
			}
			for(var i = 2; i < args.length; i += 2){
				result.push("lineTo", [this.last.x += args[i], this.last.y += args[i + 1]]);
				if(doDash)
					this._dashResidue = toDashedLineTo(doDash, this, doDash[doDash.length - 1][0], doDash[doDash.length - 1][1], this.last.x, this.last.y, this._dashResidue);
			}
			this.lastControl = {};
		},
		_lineToA: function(result, action, args, doDash){
			for(var i = 0; i < args.length; i += 2){
				if(doDash)
					this._dashResidue = toDashedLineTo(doDash, this, this.last.x, this.last.y, args[i], args[i + 1], this._dashResidue);
				result.push("lineTo", [args[i], args[i + 1]]);
			}
			this.last.x = args[args.length - 2];
			this.last.y = args[args.length - 1];
			this.lastControl = {};
		},
		_lineToR: function(result, action, args, doDash){
			for(var i = 0; i < args.length; i += 2){
				result.push("lineTo", [this.last.x += args[i], this.last.y += args[i + 1]]);
				if(doDash)
					this._dashResidue = toDashedLineTo(doDash, this, doDash[doDash.length - 1][0], doDash[doDash.length - 1][1], this.last.x, this.last.y, this._dashResidue);
			}
			this.lastControl = {};
		},
		_hLineToA: function(result, action, args, doDash){
			for(var i = 0; i < args.length; ++i){
				result.push("lineTo", [args[i], this.last.y]);
				if(doDash)
					this._dashResidue = toDashedLineTo(doDash, this, doDash[doDash.length - 1][0], doDash[doDash.length - 1][1], args[i], this.last.y, this._dashResidue);
			}
			this.last.x = args[args.length - 1];
			this.lastControl = {};
		},
		_hLineToR: function(result, action, args, doDash){
			for(var i = 0; i < args.length; ++i){
				result.push("lineTo", [this.last.x += args[i], this.last.y]);
				if(doDash)
					this._dashResidue = toDashedLineTo(doDash, this, doDash[doDash.length - 1][0], doDash[doDash.length - 1][1], this.last.x, this.last.y, this._dashResidue);
			}
			this.lastControl = {};
		},
		_vLineToA: function(result, action, args, doDash){
			for(var i = 0; i < args.length; ++i){
				result.push("lineTo", [this.last.x, args[i]]);
				if(doDash)
					this._dashResidue = toDashedLineTo(doDash, this, doDash[doDash.length - 1][0], doDash[doDash.length - 1][1], this.last.x, args[i], this._dashResidue);
			}
			this.last.y = args[args.length - 1];
			this.lastControl = {};
		},
		_vLineToR: function(result, action, args, doDash){
			for(var i = 0; i < args.length; ++i){
				result.push("lineTo", [this.last.x, this.last.y += args[i]]);
				if(doDash)
					this._dashResidue = toDashedLineTo(doDash, this, doDash[doDash.length - 1][0], doDash[doDash.length - 1][1], this.last.x, this.last.y, this._dashResidue);
			}
			this.lastControl = {};
		},
		_curveToA: function(result, action, args, doDash){
			for(var i = 0; i < args.length; i += 6){
				result.push("bezierCurveTo", args.slice(i, i + 6));
				if(doDash)
					this._dashResidue = toDashedCurveTo(doDash, this, result[result.length-1], this._dashResidue);
			}
			this.last.x = args[args.length - 2];
			this.last.y = args[args.length - 1];
			this.lastControl.x = args[args.length - 4];
			this.lastControl.y = args[args.length - 3];
			this.lastControl.type = "C";
		},
		_curveToR: function(result, action, args, doDash){
			for(var i = 0; i < args.length; i += 6){
				result.push("bezierCurveTo", [
					this.last.x + args[i],
					this.last.y + args[i + 1],
					this.lastControl.x = this.last.x + args[i + 2],
					this.lastControl.y = this.last.y + args[i + 3],
					this.last.x + args[i + 4],
					this.last.y + args[i + 5]
				]);
				if(doDash)
					this._dashResidue = toDashedCurveTo(doDash, this, result[result.length-1], this._dashResidue);
				this.last.x += args[i + 4];
				this.last.y += args[i + 5];
			}
			this.lastControl.type = "C";
		},
		_smoothCurveToA: function(result, action, args, doDash){
			for(var i = 0; i < args.length; i += 4){
				var valid = this.lastControl.type == "C";
				result.push("bezierCurveTo", [
					valid ? 2 * this.last.x - this.lastControl.x : this.last.x,
					valid ? 2 * this.last.y - this.lastControl.y : this.last.y,
					args[i],
					args[i + 1],
					args[i + 2],
					args[i + 3]
				]);
				if(doDash)
					this._dashResidue = toDashedCurveTo(doDash, this, result[result.length-1], this._dashResidue);
				this.lastControl.x = args[i];
				this.lastControl.y = args[i + 1];
				this.lastControl.type = "C";
			}
			this.last.x = args[args.length - 2];
			this.last.y = args[args.length - 1];
		},
		_smoothCurveToR: function(result, action, args, doDash){
			for(var i = 0; i < args.length; i += 4){
				var valid = this.lastControl.type == "C";
				result.push("bezierCurveTo", [
					valid ? 2 * this.last.x - this.lastControl.x : this.last.x,
					valid ? 2 * this.last.y - this.lastControl.y : this.last.y,
					this.last.x + args[i],
					this.last.y + args[i + 1],
					this.last.x + args[i + 2],
					this.last.y + args[i + 3]
				]);
				if(doDash)
					this._dashResidue = toDashedCurveTo(doDash, this, result[result.length-1], this._dashResidue);
				this.lastControl.x = this.last.x + args[i];
				this.lastControl.y = this.last.y + args[i + 1];
				this.lastControl.type = "C";
				this.last.x += args[i + 2];
				this.last.y += args[i + 3];
			}
		},
		_qCurveToA: function(result, action, args, doDash){
			for(var i = 0; i < args.length; i += 4){
				result.push("quadraticCurveTo", args.slice(i, i + 4));
			}
			if(doDash)
				this._dashResidue = toDashedCurveTo(doDash, this, result[result.length - 1], this._dashResidue);
			this.last.x = args[args.length - 2];
			this.last.y = args[args.length - 1];
			this.lastControl.x = args[args.length - 4];
			this.lastControl.y = args[args.length - 3];
			this.lastControl.type = "Q";
		},
		_qCurveToR: function(result, action, args, doDash){
			for(var i = 0; i < args.length; i += 4){
				result.push("quadraticCurveTo", [
					this.lastControl.x = this.last.x + args[i],
					this.lastControl.y = this.last.y + args[i + 1],
					this.last.x + args[i + 2],
					this.last.y + args[i + 3]
				]);
				if(doDash)
					this._dashResidue = toDashedCurveTo(doDash, this, result[result.length - 1], this._dashResidue);
				this.last.x += args[i + 2];
				this.last.y += args[i + 3];
			}
			this.lastControl.type = "Q";
		},
		_qSmoothCurveToA: function(result, action, args, doDash){
			for(var i = 0; i < args.length; i += 2){
				var valid = this.lastControl.type == "Q";
				result.push("quadraticCurveTo", [
					this.lastControl.x = valid ? 2 * this.last.x - this.lastControl.x : this.last.x,
					this.lastControl.y = valid ? 2 * this.last.y - this.lastControl.y : this.last.y,
					args[i],
					args[i + 1]
				]);
				if(doDash)
					this._dashResidue = toDashedCurveTo(doDash, this, result[result.length - 1], this._dashResidue);
				this.lastControl.type = "Q";
			}
			this.last.x = args[args.length - 2];
			this.last.y = args[args.length - 1];
		},
		_qSmoothCurveToR: function(result, action, args, doDash){
			for(var i = 0; i < args.length; i += 2){
				var valid = this.lastControl.type == "Q";
				result.push("quadraticCurveTo", [
					this.lastControl.x = valid ? 2 * this.last.x - this.lastControl.x : this.last.x,
					this.lastControl.y = valid ? 2 * this.last.y - this.lastControl.y : this.last.y,
					this.last.x + args[i],
					this.last.y + args[i + 1]
				]);
				if(doDash)
					this._dashResidue = toDashedCurveTo(doDash, this, result[result.length - 1], this._dashResidue);
				this.lastControl.type = "Q";
				this.last.x += args[i];
				this.last.y += args[i + 1];
			}
		},
		_arcTo: function(result, action, args, doDash){
			var relative = action == "a";
			for(var i = 0; i < args.length; i += 7){
				var x1 = args[i + 5], y1 = args[i + 6];
				if(relative){
					x1 += this.last.x;
					y1 += this.last.y;
				}
				var arcs = ga.arcAsBezier(
					this.last, args[i], args[i + 1], args[i + 2],
					args[i + 3] ? 1 : 0, args[i + 4] ? 1 : 0,
					x1, y1
				);
				arr.forEach(arcs, function(p){
					result.push("bezierCurveTo", p);
				});
				if(doDash)
					this._dashResidue = toDashedCurveTo(doDash, this, p, this._dashResidue);
				this.last.x = x1;
				this.last.y = y1;
			}
			this.lastControl = {};
		},
		_closePath: function(result, action, args, doDash){
			result.push("closePath", []);
			if(doDash)
				this._dashResidue = toDashedLineTo(doDash, this, this.last.x, this.last.y, doDash[1][0], doDash[1][1], this._dashResidue);
			this.lastControl = {};
		}
	});
	arr.forEach(["moveTo", "lineTo", "hLineTo", "vLineTo", "curveTo",
		"smoothCurveTo", "qCurveTo", "qSmoothCurveTo", "arcTo", "closePath"],
		function(method){ modifyMethod(canvas.Path, method); }
	);

	canvas.TextPath = declare("dojox.gfx.canvas.TextPath", [canvas.Shape, pathLib.TextPath], {
		// summary:
		//		a text shape (Canvas)
		_renderShape: function(/* Object */ ctx){
			var s = this.shape;
			// nothing for the moment
		},
		_setText: function(){
			// not implemented
		},
		_setFont: function(){
			// not implemented
		}
	});

	canvas.Surface = declare("dojox.gfx.canvas.Surface", gs.Surface, {
		// summary:
		//		a surface object to be used for drawings (Canvas)
		constructor: function(){
			gs.Container._init.call(this);
			this.pendingImageCount = 0;
			this.makeDirty();
		},
		destroy: function(){
			gs.Container.clear.call(this, true); // avoid makeDirty() from canvas.Container.clear impl.
			this.inherited(arguments);
		},
		setDimensions: function(width, height){
			// summary:
			//		sets the width and height of the rawNode
			// width: String
			//		width of surface, e.g., "100px"
			// height: String
			//		height of surface, e.g., "100px"
			this.width  = g.normalizedLength(width);	// in pixels
			this.height = g.normalizedLength(height);	// in pixels
			if(!this.rawNode) return this;
			var dirty = false;
			if (this.rawNode.width != this.width){
				this.rawNode.width = this.width;
				dirty = true;
			}
			if (this.rawNode.height != this.height){
				this.rawNode.height = this.height;
				dirty = true;
			}
			if (dirty)
				this.makeDirty();
			return this;	// self
		},
		getDimensions: function(){
			// summary:
			//		returns an object with properties "width" and "height"
			return this.rawNode ? {width:  this.rawNode.width, height: this.rawNode.height} : null;	// Object
		},
		_render: function(force){
			// summary:
			//		render the all shapes
			if(!this.rawNode || (!force && this.pendingImageCount)){ return; }
			var ctx = this.rawNode.getContext("2d");
			ctx.clearRect(0, 0, this.rawNode.width, this.rawNode.height);
			this.render(ctx);
			if("pendingRender" in this){
				clearTimeout(this.pendingRender);
				delete this.pendingRender;
			}
		},
		render: function(ctx){
			// summary:
			//		Renders the gfx scene.
			// description:
			//		this method is called to render the gfx scene to the specified context.
			//		This method should not be invoked directly but should be used instead
			//		as an extension point on which user can connect to with aspect.before/aspect.after
			//		to implement pre- or post- image processing jobs on the drawing surface.
			// ctx: CanvasRenderingContext2D
			//		The surface Canvas rendering context.
			ctx.save();
			for(var i = 0; i < this.children.length; ++i){
				this.children[i]._render(ctx);
			}
			ctx.restore();
		},
		makeDirty: function(){
			// summary:
			//		internal method, which is called when we may need to redraw
			if(!this.pendingImagesCount && !("pendingRender" in this) && !this._batch){
				this.pendingRender = setTimeout(lang.hitch(this, this._render), 0);
			}
		},
		downloadImage: function(img, url){
			// summary:
			//		internal method, which starts an image download and renders, when it is ready
			// img: Image
			//		the image object
			// url: String
			//		the url of the image
			var handler = lang.hitch(this, this.onImageLoad);
			if(!this.pendingImageCount++ && "pendingRender" in this){
				clearTimeout(this.pendingRender);
				delete this.pendingRender;
			}
			img.onload  = handler;
			img.onerror = handler;
			img.onabort = handler;
			img.src = url;
		},
		onImageLoad: function(){
			if(!--this.pendingImageCount){
				this.onImagesLoaded();
				this._render();
			}
		},
		onImagesLoaded: function(){
			// summary:
			//		An extension point called when all pending images downloads have been completed.
			// description:
			//		This method is invoked when all pending images downloads have been completed, just before
			//		the gfx scene is redrawn. User can connect to this method to get notified when a
			//		gfx scene containing images is fully resolved.
		},

		// events are not implemented
		getEventSource: function(){ return null; },
		connect:		function(){},
		disconnect:		function(){},
		on:				function(){}
	});

	canvas.createSurface = function(parentNode, width, height){
		// summary:
		//		creates a surface (Canvas)
		// parentNode: Node
		//		a parent node
		// width: String
		//		width of surface, e.g., "100px"
		// height: String
		//		height of surface, e.g., "100px"

		if(!width && !height){
			var pos = domGeom.position(parentNode);
			width  = width  || pos.w;
			height = height || pos.h;
		}
		if(typeof width == "number"){
			width = width + "px";
		}
		if(typeof height == "number"){
			height = height + "px";
		}

		var s = new canvas.Surface(),
			p = dom.byId(parentNode),
			c = p.ownerDocument.createElement("canvas");

		c.width  = g.normalizedLength(width);	// in pixels
		c.height = g.normalizedLength(height);	// in pixels

		p.appendChild(c);
		s.rawNode = c;
		s._parent = p;
		s.surface = s;
		return s;	// dojox/gfx.Surface
	};

	// Extenders

	var C = gs.Container, Container = {
		openBatch: function() {
			// summary:
			//		starts a new batch, subsequent new child shapes will be held in
			//		the batch instead of appending to the container directly.
			// description:
			//		Because the canvas renderer has no DOM hierarchy, the canvas implementation differs
			//		such that it suspends the repaint requests for this container until the current batch is closed by a call to closeBatch().
			++this._batch;
			return this;
		},
		closeBatch: function() {
			// summary:
			//		submits the current batch.
			// description:
			//		On canvas, this method flushes the pending redraws queue.
			this._batch = this._batch > 0 ? --this._batch : 0;
			this._makeDirty();
			return this;
		},
		_makeDirty: function(){
			if(!this._batch){
				this.surface.makeDirty();
			}
		},
		add: function(shape){
			this._makeDirty();
			return C.add.apply(this, arguments);
		},
		remove: function(shape, silently){
			this._makeDirty();
			return C.remove.apply(this, arguments);
		},
		clear: function(){
			this._makeDirty();
			return C.clear.apply(this, arguments);
		},
		getBoundingBox: C.getBoundingBox,
		_moveChildToFront: function(shape){
			this._makeDirty();
			return C._moveChildToFront.apply(this, arguments);
		},
		_moveChildToBack: function(shape){
			this._makeDirty();
			return C._moveChildToBack.apply(this, arguments);
		}
	};

	var Creator = {
		// summary:
		//		Canvas shape creators
		createObject: function(shapeType, rawShape) {
			// summary:
			//		creates an instance of the passed shapeType class
			// shapeType: Function
			//		a class constructor to create an instance of
			// rawShape: Object
			//		properties to be passed in to the classes "setShape" method
			// overrideSize: Boolean
			//		set the size explicitly, if true
			var shape = new shapeType();
			shape.surface = this.surface;
			shape.setShape(rawShape);
			this.add(shape);
			return shape;	// dojox/gfx/shape.Shape
		}
	};

	extend(canvas.Group, Container);
	extend(canvas.Group, gs.Creator);
	extend(canvas.Group, Creator);

	extend(canvas.Surface, Container);
	extend(canvas.Surface, gs.Creator);
	extend(canvas.Surface, Creator);

	// no event support -> nothing to fix.
	canvas.fixTarget = function(event, gfxElement){
		// tags:
		//		private
		return true;
	};

	return canvas;
});

},
'money/views/chartsBar':function(){
define([
	"dojo/_base/declare",
	"dojo/dom",
	"dojo/dom-class","dojo/Deferred", 
	"dojo/sniff","dojo/dom-style","dojo/dom-construct","dojo/date",
	"dojox/charting/Chart", "dojo/_base/array", "dojo/_base/window","dojo/on",
    "dojo/dom-attr","dojo/date/locale",
    // Require the theme of our choosing
    "dojox/charting/themes/Shrooms",
    
    "dojox/charting/plot2d/Pie","dojox/charting/widget/Legend", "dojox/mobile/ListItem", 
    "dojox/charting/axis2d/Default", "dojox/charting/plot2d/ClusteredColumns", "dojox/mobile/Accordion",'dojox/mobile/ContentPane',
    'dojo/text!money/views/charts-bar.html'],
    function(declare,dom,domClass,Deferred,has,domStyle,domConstruct,dojodate, Chart, arrayUtil, win, on,domAttr,locale, theme, PiePlot, Legend, ListItem, Default, BarChart){
    
	return {
		legendTemplate : '<span class="chart-legend-label" onclick="goTo(\'list\',{byTags: \'${tagsId}\', type: \'${type}\'})"><div class="mblListItemRightIcon"><div title="" class="mblDomButtonArrow mblDomButton"><div><div><div><div></div></div></div></div></div></div>'+'</span><span class="chart-label"><span class="chart-label-text">${num} * ${tags}</span>&nbsp;<span class="chart-label-amount">${amount} (${percents}%)</span></span>',
		monthsOnPage: has( 'isInitiallySmall' ) ? 2 : 3,
		_getFormattedChartData: function( data ) {
			var vals = {i: [], e: [] }, axisLabels = [], barChartData = data;
			for(var i in barChartData){						
				for( var j in barChartData[i] ) {
					vals[i].push( barChartData[i][j] )
					var alreadyadded = false
					for(var k=0; k< axisLabels.length; k++)
						if( axisLabels[k].value == barChartData[i][j].x )
							{ alreadyadded = true; break }
					if(!alreadyadded)
						axisLabels.push ({ 
							value: barChartData[i][j].x,
							text: locale.format( locale.parse( j, { selector:"date", datePattern: 'yyyyMM'}),
								{ selector: "date", datePattern: 'MMM yyyy' })
						})
				}
			}
										
			for(var i in vals)
				vals[i].sort( function(a, b) {
					return a.x > b.x ? 1 :-1
				})
					
			axisLabels.sort( function(a, b) {
				return a.value > b.value ? 1 :-1
			})
			
			var months = [], monthsNumbers = {};
			var num = 0;
			//console.log(vals)
			
			for(var i in vals)
				for(var j=0; j< vals[i].length; j++) {
					var flag = false
					for (var k=0; k<months.length; k++)
						if( months[k] == vals[i][j].x ) { flag = true; break ;}
					if(!flag)
						months.push ( vals[i][j].x )
				}
			months.sort();
			for (var k=0; k<months.length; k++)
				monthsNumbers[ months[k] ] = num ++;
			
			for(var i in vals)
				for(var j=0; j< vals[i].length; j++) {
					vals[i][j].x = monthsNumbers[ vals[i][j].x ]
				}
			for(var i=0; i< axisLabels.length; i++)
				axisLabels[i].value = monthsNumbers[ axisLabels[i].value ]
			return {vals : vals, axis: axisLabels}
		},
		_createBarChart : function( data ) {
			var barChartData = data, self = this
			var formattedData = this._getFormattedChartData( data )
			
			var vals = formattedData.vals,axisLabels = formattedData.axis
			
			try{
				self.chart1 = new Chart("simplechart", {
					title: self._displayTotal(),
					titlePos: "top",
					titleGap: 25,
					titleFont: "normal normal normal 17pt Arial",
					titleFontColor: "black"
				})	.setTheme(theme)
					.addPlot("default", {
						type: BarChart, 
						gap: 10,  font: "normal normal 11pt Tahoma",
						labelOffset: 10,
						labelStyle: "default",      // default/columns/rows/auto
						//htmlLabels: true,
						labels: true
					})
					.addAxis("x", {
						labels: axisLabels, 
						font: "normal normal 11pt Tahoma",
						
						ajorTickStep:1,
						minorTickStep: 1,
						microTickStep: 1
					})
					.addAxis("y", { 
						vertical: true, 
						font: "normal normal 11pt Tahoma", 
						includeZero: true
					});
					
				for(var i in vals){
					self.chart1.addSeries(self.nls["series-" + i], vals[i], { 
						fill: i == 'e' ? "red" : 'green',
						stroke: {color: ( i == 'e' ? "red" : 'green' )}
					} );
				}
					
				self.chart1.render();
				if( self.legend )
					self.legend.destroy();
				
				domConstruct.create('div', {id: "legend1"}, 'simplechart','after');
				self.legend = new Legend({ 
						chart: self.chart1, 'horizontal' : false 
					}, 
					'legend1'
					//domConstruct.create("div",{},"legend")
				);
				on(window,'resize', function(){
					self.chart1.resize()
				})	
			} catch (e){
				domStyle.set('chart-bar','display','none')
				console.log('WARN: charts are not supported')
			}					
			
		},
		
		/*
		 * Build new or update exsisting pie chart based on given chartData
		 */
		_buildChart: function(){
			var self = this, deferredResult = new Deferred;
			this._getBarChartData().then(function( barChartData ){
				if( self.chart1 )
					self.chart1.destroy();
				self._createBarChart( barChartData );
				deferredResult.resolve('ok')
			});		
			return deferredResult;
		},
		
		
		getQuery: function( ){
			var res = new this.queryIdb ( this )
			return res;
		},
		
		// does THE item should be queried or not?
		
		queryIdb: function(parent){
			
			this.getDate = function(isFirst){
				var today = window.AppData.chartsBarView.basicDate;
				
				var firstDay = dojodate.add(
					new Date( today.getFullYear(), today.getMonth(), 1),
					'month',
					- (parent.monthsOnPage - 1)
				);
				
				var lastDay = dojodate.add( 
					dojodate.add( 
						firstDay, 'month', parent.monthsOnPage
					), 
					'day', 
					-1
				)
				
				console.log('FDLD',firstDay, lastDay)
				return isFirst ? firstDay : lastDay
			}
			
			this.from = function(){
				return this.getDate( true )
			}
			this.to = function(){
				return this.getDate( false )
			}
			this.type = function(){ 
				return undefined
			}
		},
		/*
		 * Get data for the bar chart
		 */ 
		_getBarChartData: function(){
			var self = this, barChartDataDeferred = new Deferred;
			
			
			
			var barChartData = { i : {}, e: {} }
			var data = window.AppData.store.query( this.getQuery() );
			
			// define tags info rendering
			data.then(function(result){
				arrayUtil.forEach(result.items, function(item){
			
					if( item.type == "e" || item.type == "i"){
						var dateStr = Number( locale.format( item.date, { selector:"date", datePattern: 'yyyyMM'}) );
						barChartData[ item.type ][ dateStr ] = barChartData[ item.type ][ dateStr ] ? 
							{x: dateStr, y: barChartData[ item.type ][ dateStr ].y + Math.abs( item.amountHome )} :
							{x: dateStr, y: Math.abs( item.amountHome )};
					}
				})
				
				var today = window.AppData.chartsBarView.basicDate;
				var firstDay = new Date( today.getFullYear(), today.getMonth(), 1);
				firstDay = dojodate.add( 
					firstDay, 'month', - ( self.monthsOnPage - 1)
				);
				
				for(var i=0; i<self.monthsOnPage;i ++) {
					var dateId = Number( locale.format( dojodate.add(firstDay,'month',i), { selector:"date", datePattern: 'yyyyMM'}) );
					if(!barChartData['e'][ dateId ])
						barChartData['e'][ dateId ] = {x: dateId, y:0}
					if(!barChartData['i'][ dateId ])
						barChartData['i'][ dateId ] = {x: dateId, y:0}
				}
				
				barChartDataDeferred.resolve( barChartData )
			})
			
			
			
			return barChartDataDeferred;
		},	
		
		afterActivate: function(contact){
			// x and y coordinates used for easy understanding of where they should display
			// Data represents website visits over a week period
			var self = this

			this._buildChart().then(function(){
				setTimeout(function(){
					if(self.chart1)
						self.chart1.resize()
				}, 1 )
			})
			
        },
        
        init: function(){
			window.AppData.chartsBarView = this
			window.AppData.chartsBarView.basicDate = new Date;
			if(!this._isInheritedFromBaseView)
				new window.AppData.BaseViewClass( this, 1 /* Do not overwrite existing objects*/ );			
			
			var self = this
			//if(!has('isInitiallySmall'))
			//	domClass.add(this.backButton.domNode,'hideOnMedium hideOnLarge')		
			
			on( this.earlier, 'click', function(){
				window.AppData.chartsBarView.basicDate = 
					dojodate.add( window.AppData.chartsBarView.basicDate, 'month', -self.monthsOnPage );
				self._buildChart();
			})
			on( this.later, 'click', function(){
				
				window.AppData.chartsBarView.basicDate = 
					dojodate.add( window.AppData.chartsBarView.basicDate, 'month', self.monthsOnPage );
				self._buildChart();
			})
        },
        
         _displayTotal: function(titleNodeId) {
			//calculate timespan totals
			var self = this, titleNodeId = titleNodeId || 'bar-chart-ts',
				today = window.AppData.chartsBarView.basicDate,
				firstDay = new Date( today.getFullYear(), today.getMonth(), 1);
				
				firstDay = dojodate.add ( 
					firstDay, 'month', - (self.monthsOnPage - 1) 
				);
				
				var lastDay = dojodate.add ( 
					firstDay, 'month', self.monthsOnPage
				);
				
				firstDay = dojodate.add( 
					firstDay, 
					'second', 
					-1 
				);
				
				lastDay = dojodate.add( 
					lastDay, 
					'second', 
					-1 
				);
				
				firstDay = dojodate.add( new Date( today.getFullYear(), today.getMonth(), 1), 'month', -(self.monthsOnPage - 1) );
			
			tsHeader = locale.format(firstDay, { selector:"date", datePattern: 'd MMM yyyy'}) + ' - ' +locale.format(lastDay, { selector:"date", datePattern: 'd MMM yyyy'})
			return tsHeader;
		}           
    };
});

},
'dojox/charting/scaler/common':function(){
define(["dojo/_base/lang"], function(lang){

	var eq = function(/*Number*/ a, /*Number*/ b){
		// summary:
		//		compare two FP numbers for equality
		return Math.abs(a - b) <= 1e-6 * (Math.abs(a) + Math.abs(b));	// Boolean
	};
	
	var common = lang.getObject("dojox.charting.scaler.common", true);
	
	var testedModules = {};

	return lang.mixin(common, {
		doIfLoaded: function(moduleName, ifloaded, ifnotloaded){
			if(testedModules[moduleName] == undefined){
				try{
					testedModules[moduleName] = require(moduleName);
				}catch(e){
					testedModules[moduleName] = null;
				}
			}
			if(testedModules[moduleName]){
				return ifloaded(testedModules[moduleName]);
			}else{
				return ifnotloaded();
			}
		},
		getNumericLabel: function(/*Number*/ number, /*Number*/ precision, /*Object*/ kwArgs){
			var def = "";
			common.doIfLoaded("dojo/number", function(numberLib){
				def = (kwArgs.fixed ? numberLib.format(number, {places : precision < 0 ? -precision : 0}) :
					numberLib.format(number)) || "";
			}, function(){
				def = kwArgs.fixed ? number.toFixed(precision < 0 ? -precision : 0) : number.toString();
			});
			if(kwArgs.labelFunc){
				var r = kwArgs.labelFunc(def, number, precision);
				if(r){ return r; }
				// else fall through to the regular labels search
			}
			if(kwArgs.labels){
				// classic binary search
				// TODO: working only if the array is sorted per value should be better documented or sorted automatically
				var l = kwArgs.labels, lo = 0, hi = l.length;
				while(lo < hi){
					var mid = Math.floor((lo + hi) / 2), val = l[mid].value;
					if(val < number){
						lo = mid + 1;
					}else{
						hi = mid;
					}
				}
				// lets take into account FP errors
				if(lo < l.length && eq(l[lo].value, number)){
					return l[lo].text;
				}
				--lo;
				if(lo >= 0 && lo < l.length && eq(l[lo].value, number)){
					return l[lo].text;
				}
				lo += 2;
				if(lo < l.length && eq(l[lo].value, number)){
					return l[lo].text;
				}
				// otherwise we will produce a number
			}
			return def;
		}
	});
});

},
'money/views/list':function(){
/*
*   Transactions list module
* 	rebuilt to work async
* 
*   v. 0.9
* 	21/09/2014
*   
* 	Mikhael Milikhin
* 
*/

define(["dojo/_base/declare","dojo/on", "dojox/gesture/swipe","dojo/date","dojo/date/locale",
	"dojo/dom-construct", "dojo/dom-style",'dojo/dom-class',
	"dojo/_base/array","dojo/_base/lang", 'dojo/date',
	"dijit/registry","dojo/dom","dojo/dom-attr", 
	"dojo/date/locale","dojox/mobile/ListItem",
    "dojox/mobile/EdgeToEdgeStoreList",'dojo/text!money/views/list.html'],
    function(declare, on, swipe, date, locale, domConstruct, domStyle, domClass, arrayUtil,lang,dojodate, registry, dom, domAttr, locale, ListItem){
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
			if(!this.params.byTags)
				registry.byId('list-title').set('label',getDateStringHr( getDate(date, locale), locale))
			else {
				var _tagIds = "noTags", _tagsLabels = [this.nls.noTags];
				if( this.params.byTags != -1){
					_tagIds = String(this.params.byTags).split(/%2C|,+/ /* this is comma symbol or encoded comma symbol*/), _tagsLabels = [];
					for(var i=0; i < _tagIds.length; i++){
						_tagsLabels[i] = window.AppData.store.getTag(  Number( _tagIds[i] ) ).label
					}
				}
				registry.byId('list-title').set('label', _tagsLabels.join( ', ' ));
			}
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
			var total = 0, alltrans = window.AppData.store.query( self.queryIdb );
			alltrans.then(function(data){
				total = 0;
				var items = data.items
				for(var i = 0; i < items.length; i++ )
					total += items[i].amountHome;
				domAttr.set(sumNodeId, 'innerHTML', getMoney( total, window.AppData.currency ))
			
			})					
		},
		
		beforeDeactivate: function(){
			this._oldParams = this.params
		},
		
		beforeActivate: function(){
            var self = this
            var callback = function(){
				if(self.params.type){
					window.AppData.currentType = self.params.type
				}
				if( self.params.id)
					window.AppData.currentDate = self.params.id;
				
				if( self.params.from == 'details' && self._oldParams 
					&& this._oldParams.byTags) {
					this.params = this._oldParams
				}
				
				//empty page
				arrayUtil.forEach(registry.byId('daily-list').getChildren(), function(li){
					li.destroyRecursive()
				})
				domConstruct.empty('daily-list')
				//
				self.transactions.refresh().then( function(){
					self._renderHeader();				
					self._displayTotal();				
					self.reloadPage();

					var btns = ['e','i','t']
					for(var i=0; i<btns.length; i++) {					

						if( self.params.byTags || self.params.byTags == -1) {
							self.backButton.transitionOptions.target = "chartsPie";
							self.backButton.set( 'label', self.nls.stats);
							registry.byId( 'list-is-' + btns[i] ).transitionOptions.params.id = undefined;
							registry.byId( 'list-is-' + btns[i] ).transitionOptions.params.byTags = self.params.byTags;						
						}else {
							self.backButton.transitionOptions.target = "summary";
							self.backButton.set('label', self.nls.summary);
							registry.byId( 'list-is-' + btns[i] ).transitionOptions.params.id = self.params.id;
							registry.byId( 'list-is-' + btns[i] ).transitionOptions.params.byTags = undefined;
						}
					}
				})
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
		
		queryIdb: {
			from: function(){ return window.AppData.currentDate},
			type: function(){ return window.AppData.currentType}
		},
        query: function(item){
			if(!window.AppData.detailsView || !window.AppData.detailsView.params.byTags)
				return (getDateString(item.date,locale) == window.AppData.currentDate) && (item.type == window.AppData.currentType)
			else {
				var _tagIds = []; _tagsLabels = []
				if( window.AppData.detailsView.params.byTags != -1){
					_tagIds = window.AppData.detailsView.params.byTags = String(window.AppData.detailsView.params.byTags).split(/%2C|,+/ /* this is comma symbol or encoded comma symbol*/);
					for(var i=0; i < _tagIds.length; i++){
						_tagsLabels[i] = window.AppData.store.getTag(  Number( _tagIds[i] ) ) ?
							window.AppData.store.getTag(  Number( _tagIds[i] ) ).id : _tagIds[i];
					}
				}
				
				var from = window.AppData.dateFrom ? window.AppData.dateFrom : (window.AppData.dateFrom = dojodate.add(new Date,"day", -daysInMonth - 1));
				var to = window.AppData.dateTo ? window.AppData.dateTo : (window.AppData.dateTo = dojodate.add(new Date,"day", 1));
				//return (item.tags == _tagsLabels.join(','))
				return (item.type==window.AppData.currentType) && (item.tags == _tagsLabels.join(',')) &&
					( (window.AppData.timespan == 'noneTimespan' && !window.AppData.useDateImportant) || ( dojodate.difference(item.date, from, "second") < 0 ) && ( dojodate.difference(item.date, to, "second") > 0) )
			}
		},
		
        listItem: TransactionListItem,

        init: function(){
            //on(this.domNode, swipe, function(e){console.log(e)});
			var self = this;
			if(!this._isInheritedFromBaseView)
				new window.AppData.BaseViewClass( this );			
			
			window.AppData.detailsView = this
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
			for (var i=0;i < item.tags.length; i++){
				if(tags != "") tags+=", ";
				tags += window.AppData.store.getTag(item.tags[i]).label
			}
			if(tags == "") tags = self.nls.noTags
			itemClone.cats = 
				"<div class='date-header'>" + (self.params.byTags ? getDateStringHr(itemClone.date, locale) : tags) + "</div>" +
				"<div class='summary'>"+self.substitute(self._accountTemplate, itemClone)+"</div>"+
				(itemClone.descr ? ("<div class='li-descr'><hr/>"+itemClone.descr+"</div>") : "")
			
			return new this.itemRenderer(
				this._createItemProperties(itemClone)
			);			
		}
    };
});

},
'money/views/theme':function(){
define([
	'dojo/dom-construct',
	'dojo/dom-class',
	'dojo/sniff',
	'dijit/registry',
	'dojo/topic',
	'dojo/dom-attr',"dojo/on","dojo/dom-style","dojo/query","dojo/_base/array","dojox/mobile/Pane",'dojo/text!money/views/theme.html'], 
	function(domConstruct, domClass, has, registry, topic, domAttr, on, domStyle,query, arrayUtil){
  	return {
		_hasMenu : false,
		_hasBack : 'settings',
		_setupDisplayMode: function(){
		},
		
		themes: ['ios7',/*'iPhone',*/'Holodark'],
		//init is triggered when view is created
		init : function(){
			//
			this._setupDisplayMode()
			var self = this
			for(var i =0; i< this.themes.length ; i++){
			    (function(i){
			        self[self.themes[i]].onClick = function(){
			            localStorage.setItem('theme', self.themes[i])
			            location.reload();
			           //location.assign('/app');
			        }
			    })(i)
			}
			
			/*this.systemDefault.onClick = function(){
			    localStorage.removeItem('app_locale')
			    location.reload();
			    //location.assign('/app');
			}
			*/
		},
		
		//triggered before showing view
		beforeActivate: function(){
			//this.legendButton.set('selected',true)
			
			for(var i =0; i< this.themes.length ; i++){
			    if(localStorage.getItem('theme') && localStorage.getItem('theme') == this.themes[i])
			        this[this.themes[i]].set('checked', true)
			}
		},
		afterActivate: function(){
			//
		}			
	}
})

},
'money/TouchableButton':function(){
define([
	"dojo/_base/array", 
	"dojo/_base/declare",
	"dojo/_base/window",
	"dojo/_base/event",
	"dojo/sniff",
	"dojo/touch",
	"dojo/on",
	"dojo/dom",
	"dojo/dom-class",
	"dojox/mobile/Button"
	], function(array, declare,win, event, has, touch, on, dom, domClass, Button) {
    return declare("money.TouchableButton", Button, {
		
		duration: 0,
			
		postCreate: function(){
			var _this = this;
			on(this.domNode, 'mousedown', function(){
				if(!_this._isTouched)
					_this._isMouseClicked = true
			})
			this.on(touch.press, function(e){
				if(_this._isMouseClicked) return;
				_this._isTouched = true
						
				event.stop(e);
				if(_this.domNode.disabled){
					return;
				}
				_this._press(true);
				
				_this._moveh = on(win.doc, touch.move, function(e){
					event.stop(e);							
					var inside = false;
					for(var t = e.target; t; t = t.parentNode){
						if(t == _this.domNode){
							inside = true;
							break;
						}
					}
					_this._press(inside);
				});
				_this._endh = on(win.doc, touch.release, function(e){
					if(_this._pressed){
						setTimeout(function(){
							//alert('click called ' + e.target)
							on.emit(e.target, "click", { 
								bubbles: true, 
								cancelable: true, 
								_synthetic: true 
							});
							console.log('emitted')
								
						});
					}
					event.stop(e);
					_this._press(false);
					_this._moveh.remove();
					_this._endh.remove();
				});
			});
			//this.domNode.addEventListener("click", function(e){
				//if(_this._isTouched){
				//	e.stopImmediatePropagation();
				//	e.preventDefault();
				//}
			//}, true);
					
			dom.setSelectable(this.focusNode, false);
			this.connect(this.domNode, "onclick", "_onClick");
		},
				
		_press: function(pressed){
			if(pressed != this._pressed){
				this._pressed = pressed;
				var button = this.focusNode || this.domNode;
				var newStateClasses = (this.baseClass+' '+this["class"]).split(" ");
				newStateClasses = array.map(newStateClasses, function(c){ return c+"Selected"; });
				(pressed?domClass.add:domClass.remove)(button, newStateClasses);
			}
		}
    });
});

},
'money/nls/accounts':function(){
define({
	root: {
		title	: "My accounts",
	    settings: 'Settings',
	    add		: 'Add',
	    noAccounts	: 'You don\'t have any accounts yet.',
	    addFirst: 'to add your first account',
	    myAccounts	: 'List of accounts',
	    tap		: 'Tap',
	    
	    newAccount: 'New account will be created',
	    chooseCurrency: 'Please select it\'s currency',
	    process : 'Continue',
	    createAccount: 'Creating account',
	    yes: 'Yes',
	    no	: 'No',
	    deleteAccount: 'Delete account',
	    startAmount: 'Start balance / Default currency'
	    
	},
	'ru-ru': true
});

},
'money/nls/ru-ru/accounts':function(){
define({
	title	: "Мои счета",
	settings: 'Настройки',
	add		: 'Добавить',
	noAccounts	: '',
	addFirst: 'чтобы добавить ваш первый счет',
	myAccounts	: 'Мои счета',
	tap		: 'Нажмите',
	    
	newAccount: 'Будет создан новый счет',
	chooseCurrency: 'Пожалуйста, выберите его основную валюту',
	process : 'Продолжить',
	createAccount: 'Создание счета',
	startAmount: 'Нач. баланс / Валюта по умолч.'
});

},
'url:money/views/backup.html':"<div class=\"mblBackground\">\n    <div data-dojo-type=\"dojox/mobile/Heading\"\n        data-dojo-props=\"fixed: 'top'\">\n        <button data-dojo-type=\"dojox/mobile/ToolBarButton\"\n            data-dojo-attach-point=\"backButton\"\n            data-dojo-props=\"arrow: 'left', target: 'navigation', transitionDir: -1\"\n            class=\"left-button\">${nls.menu}</button>\n    </button>\n    ${nls.title} \n    </div>\n    <div data-dojo-type=\"money/WheelScrollableView\">\n\t\t<div id=\"online\">\n\t\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t\t${nls.title}\n\t\t\t\t</div>\n\t\t\t\t<div id=\"sync-login\" data-dojo-type=\"dojox/mobile/Pane\" data-dojo-props='shadow:true'>\n\t\t\t\t\t${nls.dropbox}\n\t\t\t\t\t<br/>\n\t\t\t\t\t<span id=\"dr-redir\">${nls.dropboxRedirect}</span>\n\t\t\t\t\t<span id=\"dropbox-sync-help\">${nls.dropboxStart}</span>\n\t\t\t\t\t<button data-dojo-type=\"money/TouchableButton\" class=\"mblBlueButton\"  id=\"backup-create\"\n\t\t\t\t\t\tdata-dojo-attach-point=\"syncBtn\"  style=\"padding: 0 10px; margin:0; margin-top:5px;\"\n\t\t\t\t\t\tdata-dojo-props='label:\"${nls.backupCreate}\"'>\n\t\t\t\t\t</button>\t\t\t\t\t\n\t\t\t\t\t<button \n\t\t\t\t\t\tdata-dojo-type=\"money/TouchableButton\"\n\t\t\t\t\t\tdata-dojo-props=\"label: '${nls.linkDropbox}'\"\n\t\t\t\t\t\tdata-dojo-attach-point=\"loginBtn\" class=\"mblBlueButton\" style=\"padding: 0 10px; margin:0; margin-top:5px;\"\n\t\t\t\t\t\t></button>\t\t\t\t\t\n\t\t\t\t</div>\n\t\t\t<div id=\"backup-download\">\t\t\t\n\t\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t\t${nls.onlineBackup}\n\t\t\t\t</div>\n\t\t\t\t<ul data-dojo-type=\"dojox/mobile/EdgeToEdgeList\">\n\t\t\t\t\t<!--<li data-dojo-type=\"dojox/mobile/ListItem\"  id=\"backup-restore\"\n\t\t\t\t\t\tdata-dojo-attach-point=\"restoreBtn\"\n\t\t\t\t\t\tdata-dojo-props='clickable:true, label:\"${nls.restore}\"'>\n\t\t\t\t\t</li>-->\n\t\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"\n\t\t\t\t\t\tdata-dojo-attach-point=\"logoutBtn\"\n\t\t\t\t\t\tdata-dojo-props='noArrow: true, clickable:true, label:\"${nls.unlinkDropbox}\"'>\n\t\t\t\t\t</li>\n\t\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"  id=\"backup-clear\"\n\t\t\t\t\t\tdata-dojo-attach-point=\"clearBtn\"\n\t\t\t\t\t\tdata-dojo-props='noArrow: true, clickable:true, label:\"${nls.clearRemote}\"'>\n\t\t\t\t\t</li>\n\t\t\t\t</ul>\n\t\t\t</div>\n\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t\t${nls.factoryReset}\n\t\t\t</div>\n\t\t\t<ul data-dojo-type=\"dojox/mobile/EdgeToEdgeList\">\n\t\t\t\t<!--<li data-dojo-type=\"dojox/mobile/ListItem\"  id=\"backup-clear-trans\"\n\t\t\t\t\tdata-dojo-attach-point=\"clearTransBtn\"\n\t\t\t\t\tdata-dojo-props='clickable:true, label:\"${nls.clearTrans}\"'>\n\t\t\t\t</li>-->\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"  id=\"backup-clear-all\"\n\t\t\t\t\tdata-dojo-attach-point=\"clearAllBtn\"\n\t\t\t\t\tdata-dojo-props='noArrow: true, clickable:true, label:\"${nls.clear}\"'>\n\t\t\t\t</li>\n\t\t\t</ul>\n\t\t</div>\n\t\t<div id=\"offline\">\n\t\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\n\t\t\t\t${nls.internetRequired}\n\t\t\t</div>\n\t\t</div>\n    </div>\n</div>\n",
'url:money/views/charts.html':"<div class=\"mblBackground\">\n    <div data-dojo-type=\"dojox/mobile/Heading\"\n        data-dojo-props=\"fixed: 'top'\">\n        <button data-dojo-type=\"dojox/mobile/ToolBarButton\"\n            data-dojo-attach-point=\"backButton\"\n            data-dojo-props=\"arrow: 'left', target: 'navigation', transitionDir: -1, transitionOptions: { params: { id: window.AppData.currentDate }}\"\n            class=\"left-button\">${nls.menu}</button>\n    </button>\n    ${nls.title}\n    </div>\n    <div data-dojo-type=\"money/WheelScrollableView\">\n\t\t<div id=\"sum-main\">\n\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t<span id=\"acc-sum\" style=\"\"></span>${nls.myAccounts}\n\t\t\t</div>\n\t\t\t<div data-dojo-type=\"dojox/mobile/Pane\" id=\"no-accounts-chart\">\n\t\t\t\t${nls.tap}\n\t\t\t\t<b>${nls.settings}</b> -> <b>${nls.accounts}</b> -> <b>${nls.add}</b> ${nls.navMenu} ${nls.addFirstAccount}\n\t\t\t</div>\n\t\t\t<ul data-dojo-type=\"dojox/mobile/EdgeToEdgeList\" id=\"sum-acc\"\n\t\t\t\tdata-dojo-attach-point=\"sumAcc\">\n\t\t\t</ul>\n\t\t</div>\n\t\t<div id=\"sum-main\">\n\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t${nls.myAchievements}\n\t\t\t</div>\n\t\t\t<ul data-dojo-type=\"dojox/mobile/EdgeToEdgeList\">\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"  id=\"sum-exp\"\n\t\t\t\t\tdata-dojo-attach-point=\"sumE\"\n\t\t\t\t\tdata-dojo-props='rightText:\"0.00\", label:\"${nls.expences}\"'></li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\" id=\"sum-inc\"\n\t\t\t\t\tdata-dojo-attach-point=\"sumI\"\n\t\t\t\t\tdata-dojo-props='rightText:\"0.00\", label:\"${nls.incomes}\"'></li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"  id=\"sum-tr\"\n\t\t\t\t\tdata-dojo-attach-point=\"sumT\"\n\t\t\t\t\tdata-dojo-props='rightText:\"0.00\", label:\"${nls.transfers}\"'></li>\n\t\t\t</ul>\n\t\t</div>\n\t\t<div id=\"chart-main\">\n\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t${nls.moreCharts}\n\t\t\t</div>\n\t\t\t<ul data-dojo-type=\"dojox/mobile/EdgeToEdgeList\">\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\" \n\t\t\t\t\tdata-dojo-props='target: \"chartsPie\", \n\t\t\t\t\t\tlabel: \"${nls.byTags}\",\n\t\t\t\t\t\tclickable: true'></li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\" \n\t\t\t\t\tdata-dojo-props='target: \"chartsBar\", \n\t\t\t\t\t\tlabel: \"${nls.expInc}\",\n\t\t\t\t\t\tclickable: true'></li>\n\t\t\t</ul>\n\t\t</div>\t\t\n    </div>\n</div>\n",
'url:money/views/language.html':"<div class=\"mblBackground\">\n\t<div \n\t\tdata-dojo-attach-point=\"heading\"\n\t\tdata-dojo-type=\"dojox/mobile/Heading\" data-dojo-props=\"label:'${nls.title}'\">\n\t\t<button data-dojo-type=\"dojox/mobile/ToolBarButton\"\n            data-dojo-attach-point=\"backButton\"\n            data-dojo-props=\"arrow: 'left', target: 'settings', transitionDir: -1\"\n            class=\"left-button\">${nls.back}</button>\n\t</div>\n\t<div \n\t\tdata-dojo-type=\"money/WheelScrollableView\" data-dojo-props=\"height:'auto'\"\n\t\tdata-dojo-attach-point=\"viewContainer\">\n\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\" data-dojo-props=\"label:'${nls.language}'\"></div>\n\t\t<ul data-dojo-type=\"dojox/mobile/EdgeToEdgeList\" data-dojo-props=\"select: 'single'\">\n\t\t\t<div \n\t\t\t\tdata-dojo-attach-point=\"systemDefault\" \n\t\t\t\tdata-dojo-type=\"dojox/mobile/ListItem\" \n\t\t\t\tdata-dojo-props=\"label: '${nls.systemDefault}', checked: true\"></div>\n\t\t\t<div \n\t\t\t\tdata-dojo-attach-point=\"en-us\" \n\t\t\t\tdata-dojo-type=\"dojox/mobile/ListItem\" \n\t\t\t\tdata-dojo-props=\"label: 'English'\"></div>\n\t\t\t<div \n\t\t\t\tdata-dojo-attach-point=\"ru-ru\" \n\t\t\t\tdata-dojo-type=\"dojox/mobile/ListItem\" \n\t\t\t\tdata-dojo-props=\"label: 'Русский'\"></div>\n\t\t\t\n\t\t</ul>\n\t\n\t</div>\t\t\t\n</div>\n",
'url:money/views/tagspicker.html':"<div class=\"\" data-dojo-type=\"dojox/app/widgets/Container\" >\n\t<h1 data-dojo-type=\"dojox/mobile/Heading\" data-dojo-props=\"fixed:'top',label:'${nls.title}'\">\n\t\t\t<div data-dojo-type=\"dojox/mobile/ToolBarButton\" label=\"${nls.done}\" class=\"mblBlueButton right-button\"\n\t\t\t\tdata-dojo-props=\"onClick:function(){\n\t\t\t\t\twindow.AppData.objDet.tags(); \n\t\t\t\t\tvar t = window.AppData.isInitiallySmall ? 'details' : 'navigation+details'\n\t\t\t\t\twindow.dFinance.transitionToView(this.domNode,{\n\t\t\t\t\t\ttarget: t , transitionDir: -1,\n\t\t\t\t\t\tparams: {'edit' : true, doNotReload : true, 'id': window.AppData.tagsPickerOverlay.params.id}\n\t\t\t\t\t})\n\t\t\t\t}\"\t\n\t\t\t></div>\n\t\t</h1>\n\t\t<div data-dojo-type=\"money/WheelScrollableView\">\n\t\t<div data-dojo-type=\"dojox/mobile/Heading\" data-dojo-props=\"fixed:'top'\" style=\"height:auto\" class=\"mblSecondHeading\">\n\t\t\t<div style=\"padding: 5px 20px;\">\n\t\t\t\t<div class=\"view-help\">${nls.viewHelp}</div>\n\t\t\t\t<input type=\"text\" data-dojo-type=\"dojox/mobile/TextBox\" id=\"newTags\" \n\t\t\t\t\tdata-dojo-props=\"placeHolder:'${nls.inputHelp}'\"/>\n\t\t\t</div>\n\t\t</div>\n\t\t<div style=\"padding: 0 10px 10px 10px\">\n\t\t\t<div id=\"tagsPicker\" \n\t\t\t\tdata-dojo-type=\"dojox/mobile/RoundRectStoreList\"\n\t\t\t\tdata-dojo-attach-point=\"tagsPicker\"\n\t\t\t\tdata-dojo-props=\"stateful:false,store: window.AppData.tagsStore, select:'multiple'\">\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>\t\n",
'url:money/views/settings.html':"<div class=\"mblBackground\">\n    <div data-dojo-type=\"dojox/mobile/Heading\"\n        data-dojo-props=\"fixed: 'top'\">\n        <button data-dojo-type=\"money/TouchableToolBarButton\"\n            data-dojo-attach-point=\"backButton\"\n            data-dojo-props=\"arrow: 'left', target: 'navigation', transitionDir: -1, transitionOptions: { params: { id: window.AppData.currentDate }}\"\n            class=\"left-button\">${nls.menu}</button>\n\t\t</button>\n\t\t${nls.title} \n    </div>\n    <div data-dojo-type=\"money/WheelScrollableView\">\n\t\t<ul data-dojo-type=\"dojox/mobile/EdgeToEdgeList\">\n\t\t\t\n\t\t\t<li data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t${nls.myData}\n\t\t\t</li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\" \n\t\t\t\t\tdata-dojo-props='clickable:true,target:\"accounts\",label:\"${nls.accounts}\"'></li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"\n\t\t\t\t\tdata-dojo-props='clickable:true,target:\"tags\",label:\"${nls.tags}\"'></li>\t\t\t\n\t\t\t<li data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t${nls.graphics}\n\t\t\t</li>\n\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\" \n\t\t\t\tdata-dojo-props='clickable:true,target:\"transitione\",label:\"${nls.transition}\"'></li>\n\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\" \n\t\t\t\tdata-dojo-props='clickable:true,target:\"theme\",label:\"${nls.theme}\"'></li>\n\t\t\t\t\t\n\t\t\t<li data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t${nls.prefs}\n\t\t\t</li>\n\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\" \n\t\t\t\t\tdata-dojo-props='clickable:true,target:\"language\",label:\"${nls.language}\"'></li>\n\t\t\t\t\n\t\t</ul>\n    </div>\n</div>\n",
'url:money/views/details.html':"<div \n\tdata-dojo-type=\"dojox/app/widgets/Container\">    \n \t\t<div data-dojo-type=\"dojox/mobile/Heading\" class=\"title\"\n\t\tdata-dojo-props=\"fixed: 'top'\">\n\t\t<button data-dojo-type=\"dojox/mobile/ToolBarButton\"\n\t\t\t\tdata-dojo-attach-point=\"backButton\"\n\t\t\t\tdata-dojo-props=\"\n\t\t\t\t\tarrow: 'left', \n\t\t\t\t\ttarget: window.AppData.isInitiallySmall ? 'list' : 'navigation+list', \n\t\t\t\t\ttransitionDir: -1, \n\t\t\t\t\ttransitionOptions: { params: { id: window.AppData.currentDate, from: 'details' }}, \n\t\t\t\t\tonClick: function(){console.log(this)}\"\n\t\t\t\tclass=\"left-button\"\n\t\t\t\t>${nls.daily}</button>\n\n\t\t${nls.title}\n\n\t\t<button data-dojo-type=\"dojox/mobile/ToolBarButton\"\n\t\t\t\tdata-dojo-attach-point=\"editButton\"\n\t\t\t\tclass=\"right-button mblRedButton\"\n\t\t\t\tdata-dojo-props=\"transitionOptions: { params: { id: window.AppData.currentDate, from: 'details' }}\"></button>\n\t\t\t\t\n\t</div>\n\t<div data-dojo-type=\"money/WheelScrollableView\" data-dojo-props=\"threshold:window.AppData.treshold\">\n\t\n\t<div data-dojo-type=\"dojox/mobile/FormLayout\"\n         data-dojo-attach-point=\"formLayout\">\n        <div>\n\t\t\t<label for=\"type\">${nls.type}</label>\n\t\t\t<ul data-dojo-type=\"dojox/mobile/TabBar\" data-dojo-props=\"barType: 'segmentedControl'\" class=\"no-background\" id = \"type\">\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/TabBarButton\" id='det-is-e'\n\t\t\t\tdata-dojo-props=\"selected:true, onClick:this.setTypeE\">${nls.expence}</li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/TabBarButton\" id='det-is-i'\n\t\t\t\tdata-dojo-props=\"onClick:this.setTypeI\">${nls.income}</li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/TabBarButton\" id='det-is-t'\n\t\t\t\tdata-dojo-props=\"onClick:this.setTypeT\">${nls.transfer}</li>\n\t\t\t</ul>\n        </div>\n        \n        <div>\n            <label for=\"amount\">${nls.date}</label>\n            <fieldset>\n                <button id=\"date\" name=\"date\"\n                        data-dojo-type=\"dojox/mobile/Button\"\n                        data-dojo-attach-point=\"date\"\n                        data-dojo-props=\"'class':'mblGreyButton mblButton',onClick: function(){\n\t\t\t\t\t\t\t\t//window.BTN = this\n\t\t\t\t\t\t\t\tdijit.registry.byId('transactionDateOverlay').show()\n\t\t\t\t\t\t\t}\">\n\t\t\t\t\t\t\t\n\t\t\t\t</button>\n            </fieldset>\n        </div>\n        \n        <div>\n            <label for=\"account\">${nls.account}</label>\n            <fieldset>\n                <button id=\"account\" name=\"account\"\n                        data-dojo-type=\"dojox/mobile/Button\"\n                        data-dojo-attach-point=\"account\"\n                        data-dojo-props=\"'class':'mblGreyButton mblButton', onClick: function(){\n\t\t\t\t\t\t\twindow.dFinance.transitionToView(this.domNode, {\n\t\t\t\t\t\t\t\ttarget: window.AppData.isInitiallySmall ? 'accountpicker' : 'accountpicker' , transitionDir: 1,\n\t\t\t\t\t\t\t\tparams: {'id': window.AppData.details.params.id, doNotReload: true}\n\t\t\t\t\t\t\t});\n\t\t\t\t\t\t\t//dijit.registry.byId('transactionAccountOverlay').show('account', ['below-centered','above-centered','after','before'])\n\t\t\t\t\t\t\n\t\t\t\t\t\t}\"></button>\n            </fieldset>\n        </div>\n        \n        <div>\n            <label for=\"amount\">${nls.amount}</label>\n            <fieldset>\n                <button id=\"currency\" name=\"currency\"\n                        data-dojo-type=\"dojox/mobile/Button\"\n                        data-dojo-attach-point=\"currency\"\n                        data-dojo-props=\"'class':'mblBlueButton mblButton two-two'\"></button>                \n                <button id=\"amount\" name=\"amount\"\n                        data-dojo-type=\"dojox/mobile/ToolBarButton\"\n                        data-dojo-attach-point=\"amount\"\n                        data-dojo-props=\"'class':'mblGreyButton mblButton one-two',onClick: function(){window.AppData.numberPicker.show()}\"></button>\n                \n            </fieldset>\n        </div>\n        \n        <div id=\"accountTo-container\">\n            <label for=\"accountTo\">${nls.accountTo}</label>\n            <fieldset>\n                <button id=\"accountTo\" name=\"accountTo\"\n                        data-dojo-type=\"dojox/mobile/Button\"\n                        data-dojo-attach-point=\"accountTo\"\n                        data-dojo-props=\"'class':'mblGreyButton mblButton',onClick: function(){\n\t\t\t\t\t\t\twindow.dFinance.transitionToView(this.domNode, {\n\t\t\t\t\t\t\t\ttarget: window.AppData.isInitiallySmall ? 'accountpicker' : 'accountpicker' , transitionDir: 1,\n\t\t\t\t\t\t\t\tparams: {'id': window.AppData.details.params.id, doNotReload: true, mode: 'to'}\n\t\t\t\t\t\t\t});\n\t\t\t\t\t\t}\"></button>\n            </fieldset>\n        </div>\n        <div>\n            <label for=\"tags\">${nls.categories}</label>\n            <fieldset>\n                <button id=\"tags\" name=\"tags\"\n                        data-dojo-type=\"dojox/mobile/Button\"\n                        \n                        data-dojo-props=\"'class':'mblGreyButton mblButton',onClick:function(){\n\t\t\t\t\t\t\twindow.dFinance.transitionToView(this.domNode, {\n\t\t\t\t\t\t\t\ttarget: window.AppData.isInitiallySmall ? 'tagspicker' : 'tagspicker' , transitionDir: 1,\n\t\t\t\t\t\t\t\tparams: {'id': window.AppData.details.params.id, doNotReload: true}\n\t\t\t\t\t\t\t});\n\t\t\t\t\t\t}\"\n                        data-dojo-attach-point=\"tags\"></button>\n            </fieldset>\n        </div>\n        <div>\n            <label for=\"descr\">${nls.description}</label>\n            <fieldset class=\"text\">\n                <textarea id=\"descr\" name=\"descr\"\n                        data-dojo-type=\"dojox/mobile/ExpandingTextArea\"\n                        data-dojo-attach-point=\"descr\"></textarea>\n            </fieldset>\n        </div>\n\t</div>\n    \n</div>\n\t<div data-dojo-type=\"dojox/mobile/Heading\" class=\"bottom\"\n        data-dojo-props=\"fixed: 'bottom'\">\n        <div data-dojo-type=\"dojox/mobile/ToolBarButton\" data-dojo-props=\"disabled: true\"\n                    data-dojo-attach-point=\"deleteButton\"\n                    data-dojo-attach-event=\"onClick: deleteContact\"\n                    class=\"left-button\">\n                <i class=\"fa fa-trash-o\"></i> ${nls.remove}\n            </div>\n\t</div> \n\t<div id=\"datePicker\" \n\t\t\t\tdata-dojo-type=\"dojox/mobile/SpinWheelDatePicker\"\n\t\t\t\tdata-dojo-attach-point=\"datePicker\"></div>\n\t<div id=\"transactionDateOverlay\" data-dojo-attach-point=\"do\" data-dojo-type=\"dojox/mobile/SimpleDialog\" class=\"overlay date-overlay\">\n\t\t<div class=\"wrapper1\">\n\t\t\t<h2 style=\"margin: 0px; line-height: 45px;\">\n\t\t\t\t<div data-dojo-type=\"dojox/mobile/ToolBarButton\"\n\t\t\t\t\tlabel=\"${nls.done}\"\n\t\t\t\t\tclass=\"mblBlueButton\"\n\t\t\t\t\tstyle=\"width:45px;float:right;\" \n\t\t\t\t\tonClick=\"window.AppData.objDet.date()\"\n\t\t\t\t\tdata-dojo-attach-point=\"okButton\"\t\t\t\t\n\t\t\t\t></div>\n\t\t\t\t<div data-dojo-type=\"dojox/mobile/ToolBarButton\"\n\t\t\t\t\tlabel=\"${nls.today}\"\n\t\t\t\t\tstyle=\"width:45px;float:right;\" \n\t\t\t\t\tonClick = \"window.AppData.details.datePicker.reset()\"\n\t\t\t\t\tdata-dojo-attach-point=\"resetDateButton\"\t\t\t\t\n\t\t\t\t></div> ${nls.pickDate}\n\t\t\t</h2>\n\t\t\t<div id=\"datepickernode\">\n\t\t\t\t\n\t\t\t</div>\n\t\t\t\n\t\t</div>\n\t</div>\n\t\n\t<div id=\"deleteOverlay\" data-dojo-type=\"dojox/mobile/SimpleDialog\" data-dojo-attach-point=\"deleteOverlay\">\n\t\t<h1 data-dojo-type=\"dojox/mobile/Heading\" data-dojo-props=\"\" style=\"margin-bottom: 8px;\">\n\t\t\t${nls.sure}\n\t\t</h1>\n\t\t<button data-dojo-type=\"money/TouchableButton\" label=\"${nls.yes}\" class=\"mblRedButton\" style=\"\" \n\t\t\tdata-dojo-attach-event=\"onClick: _deleteContact\"></button>\n\t\t<button data-dojo-type=\"money/TouchableButton\" label=\"${nls.no}\" class=\"mblBlueButton\" style=\"\"\n\t\t\tdata-dojo-attach-event=\"onClick: _hideDelete\"></button>\t\t\t\t\n\t</div>\n</div>\n",
'url:money/views/about.html':"<div class=\"mblBackground\">\n    <div data-dojo-type=\"dojox/mobile/Heading\"\n        data-dojo-props=\"fixed: 'top'\">\n        <button data-dojo-type=\"money/TouchableToolBarButton\"\n            data-dojo-attach-point=\"backButton\"\n            data-dojo-props=\"arrow: 'left', target: 'navigation', transitionDir: -1, transitionOptions: { params: { id: window.AppData.currentDate }}\"\n            class=\"left-button\">${nls.menu}</button>\n    </button>\n    ${nls.title}        \n    </div>\n    \t<div \n\t\tdata-dojo-type=\"money/WheelScrollableView\"\n\t\tdata-dojo-props=\"threshold:window.AppData.treshold\">\n\t\t\t\n\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\tR5M Finance v0.10.6 <span style=\"text-transform: lowercase\">(beta)</span>\n\t\t\t</div>\n\t\t\t\n\t\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\n\t\t\t\t${nls.r5mfIs}\t\t\t\t\n\t\t\t</div>\n\t\t\t\n\t\t\t\n\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t${nls.webSiteTitle}\n\t\t\t</div>\n\t\t\t\n\t\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\n\t\t\t\t${nls.webSite} ${nls.webSiteUrl}\n\t\t\t</div>\n\t\t\t\n\t\t\t\n\t\t\t\n\t\t\t<!--<div data-dojo-type=\"dojox/mobile/Pane\">\n\t\t\t\t<div id=\"donate-button\" style=\"margin-top:5px;\"></div>\n\t\t\t</div>-->\n\t\t\t\t\n\t\t\t\n\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t${nls.updates}\n\t\t\t</div>\n\t\t\n\t\t\t<div data-dojo-type=\"dojox/mobile/Pane\" \n\t\t\t\tdata-dojo-attach-point=\"updateStatus\">\n\t\t\t\t<span id=\"about-updates\"></span>\n\t\t\t\t<br/>${nls.updated}<span id=\"about-updated\"></span>\n\t\t\t</div>\n\t\t\t\n\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t${nls.helpUs}\n\t\t\t</div>\n\t\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\n\t\t\t\t${nls.helpAbout}\t\t\t\t\n\t\t\t</div>\n\t\t\t\n\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t${nls.eula}\n\t\t\t</div>\t\t\t\n\t\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\n\t\t\t\t${nls.asIs}\n\t\t\t</div>\n\t\t\t\n\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t${nls.privacyTitle}\n\t\t\t</div>\t\t\t\n\t\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\n\t\t\t\t${nls.privacy}\n\t\t\t</div>\n\t\t\t\n\t\t\t<div data-dojo-type=\"dojox/mobile/Pane\" style=\"display:none\">\t\n\t\t\t\t${nls.symba}\n\t\t\t</div>\n\t\t\t\n\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t${nls.thanks}\n\t\t\t</div>\n\t\t\t\n\t\t\t<ul data-dojo-type=\"dojox/mobile/EdgeToEdgeList\">\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"\n\t\t\t\t\tdata-dojo-props='rightText: \"dojotoolkit.org\"'>Dojo toolkit\t\t\t\t\t\n\t\t\t\t</li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"\n\t\t\t\t\tdata-dojo-props='rightText: \"nparashuram.com\"'>IndexedDB polyfill</li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"\n\t\t\t\t\tdata-dojo-props='rightText: \"fontawesome.io\"'>\n\t\t\t\t\tFont Awesome\t\t\t\t\t\n\t\t\t\t</li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"\n\t\t\t\t\tdata-dojo-props='rightText: \"openexchangerates.org\"'>\n\t\t\t\t\tOpen Exchange Rates\n\t\t\t\t</li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"\n\t\t\t\t\tdata-dojo-props='rightText: \"josscrowcroft.github.com/money.js\"'>\n\t\t\t\t\tMoney.js\n\t\t\t\t</li>\n\t\t\t</ul><!--\n\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">${nls.issueTitle}</div>\n\t\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\n\t\t\t\t<a class=\"mblButton mblBlueButton\" onclick=\"openNewWindow(event);\" target=\"_blank\" href=\"https://bitbucket.org/milikhin/finance/issues/new\" >${nls.issue}</a>\n\t\t\t</div>-->\n\t\t</div>\n</div>\n",
'url:money/views/charts-bar.html':"<div class=\"mblBackground\">\n    <div data-dojo-type=\"dojox/mobile/Heading\"\n        data-dojo-props=\"fixed: 'top'\">\n        <button data-dojo-type=\"dojox/mobile/ToolBarButton\"\n            data-dojo-attach-point=\"backButton\"\n            data-dojo-props=\"arrow: 'left', target: 'charts', transitionDir: -1, transitionOptions: { params: { id: window.AppData.currentDate }}\"\n            class=\"left-button\">${nls.back}</button>\n    </button>\n    ${nls.title}\n    </div>\n    <div data-dojo-type=\"money/WheelScrollableView\">\n\t\t<div id=\"chart-bar\">\n\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t${nls.expInc} <span id=\"bar-chart-ts\"></span>\n\t\t\t</div>\n\t\t\t\n\t\t\t<div id=\"simplechart\" ></div>\n\t\t\t<!--<div id=\"legend1\" ></div>-->\n\t\t\t<button \n\t\t\t\tdata-dojo-type=\"money/TouchableButton\" \n\t\t\t\tdata-dojo-attach-point=\"earlier\"\n\t\t\t\tclass=\"mblBlueButton\"><i class=\"fa fa-arrow-circle-left\"></i> ${nls.earlier}</button>\n\t\t\t<button \n\t\t\t\tdata-dojo-type=\"money/TouchableButton\" \n\t\t\t\tdata-dojo-attach-point=\"later\"\n\t\t\t\tclass=\"mblBlueButton right-button\">${nls.later} <i class=\"fa fa-arrow-circle-right\"></i></button>\n\t\t\t\n\t\t</div>\t\t\n    </div>\n</div>\n",
'url:money/conf.json':"{\n    \"id\": \"dFinance\",\n    \"dependencies\": [\n        \"dojox/mobile/Heading\",\n        \"dojox/app/widgets/Container\",\n        \"dojox/mobile/EdgeToEdgeCategory\",\n        \"dojox/mobile/RoundRectCategory\",\n        \"dojox/mobile/EdgeToEdgeList\",\n        \"dojox/mobile/RoundRect\",\n        \"dojox/mobile/ScrollableView\",\n        \"dojox/mobile/ScrollablePane\",\n\t\t\"dojox/app/widgets/Container\",\n        \"dojox/mobile/ToolBarButton\",\n        \"dojox/mobile/Switch\" ,\n        \"money/store\",\n        \"money/TouchableButton\",\n        \"money/TouchableToolBarButton\",\n        \"money/WheelScrollableView\",\n        \"dojox/mobile/ExpandingTextArea\",\n        \"dojox/mobile/TextBox\",\n        \"dojox/mobile/Pane\",\n        \"dijit/_WidgetBase\",\n        \"dijit/_WidgetsInTemplateMixin\",\n        \"dojox/mobile/SimpleDialog\",\n        \"dijit/_TemplatedMixin\",\n        \"dojox/mobile/Opener\",\n        \"dojox/mobile/Tooltip\",\n        \"dojox/mobile/FormLayout\",\n        \"dojox/mobile/TabBar\",\n        \"dojox/mobile/TabBarButton\",\n        \"dojox/mobile/GridLayout\",\n        \"dojox/mobile/TextBox\",\n        \"dojox/mobile/SpinWheelDatePicker\",\n        \"dojox/mobile/TextArea\",\n        \"dojox/mobile/Button\",\n        \"dojox/mobile/ContentPane\",\n        \"dojox/mobile/RoundRectStoreList\",        \n        \"dojox/mobile/Icon\"\n    ],\n    \"nls\"\t\t\t\t: \"money/nls/app.nls\",\n\t\"defaultTransition\"\t: \"fade\",\n\t\"transition\"\t\t: \"fade\",\n\t\"defaultView\"\t\t: \"navigation+summary\",\n    \"controllers\"\t\t: [\n        \"dojox/app/controllers/Load\",\n        \"dojox/app/controllers/Transition\",\n        \"dojox/app/controllers/Layout\"\n    ],\n    \"stores\" : {\n\t\t\"transactions\": {\n\t\t\t\"type\": \"money/store\"\n\t\t}\n\t},\n\t\"views\": {    \n        \"navigation\":{\n\t\t\t\"constraint\"\t: \"left\",\n\t\t\t\"template\"\t\t: \"money/views/navigation.html\",\n\t\t\t\"controller\"\t: \"money/views/navigation\",\n\t\t\t\"nls\"\t\t\t: \"money/nls/navigation\"\n\t\t},\n        \"list\": {\n            \"constraint\"\t: \"center\",\n            \"controller\"\t: \"money/views/list\",\n            \"template\"\t\t: \"money/views/list.html\",\n\t\t\t\"nls\"\t\t\t: \"money/nls/daily\"\n        },\n        \"details\": {\n\t\t\t\"constraint\" \t: \"center\",\n\t\t\t\"controller\"\t: \"money/views/details\",\n\t\t\t\"template\"\t\t: \"money/views/details.html\",\n\t\t\t\"nls\"\t\t\t: \"money/nls/details\"\n\t\t},\n\t\t\"summary\": {\n\t\t\t\"constraint\" \t: \"center\",\n\t\t\t\"controller\"\t: \"money/views/summary\",\n\t\t\t\"template\"\t\t: \"money/views/summary.html\",\n\t\t\t\"nls\"       \t: \"money/nls/summary\"\n\t\t},\n\t\t\"about\": {\n\t\t\t\"constraint\"\t: \"center\",\n\t\t\t\"controller\"\t: \"money/views/about\",\n\t\t\t\"template\"\t\t: \"money/views/about.html\",\n\t\t\t\"nls\"       \t: \"money/nls/about\"\n\t\t},\n\t\t\"charts\": {\n\t\t\t\"constraint\" \t: \"center\",\n\t\t\t\"controller\"\t: \"money/views/charts\",\n\t\t\t\"template\"\t\t: \"money/views/charts.html\",\n\t\t\t\"nls\"       \t: \"money/nls/stats\"\n\t\t},\n\t\t\"chartsPie\": {\n\t\t\t\"constraint\" \t: \"center\",\n\t\t\t\"controller\"\t: \"money/views/chartsPie\",\n\t\t\t\"template\"\t\t: \"money/views/charts-pie.html\",\n\t\t\t\"nls\"       \t: \"money/nls/stats\"\n\t\t},\n\t\t\"chartsBar\": {\n\t\t\t\"constraint\" \t: \"center\",\n\t\t\t\"controller\"\t: \"money/views/chartsBar\",\n\t\t\t\"template\"\t\t: \"money/views/charts-bar.html\",\n\t\t\t\"nls\"       \t: \"money/nls/stats\"\n\t\t},\n\t\t\"tagspicker\": {\n\t\t\t\"constraint\" \t: \"center\",\n\t\t\t\"controller\"\t: \"money/views/tagspicker\",\n\t\t\t\"template\"\t\t: \"money/views/tagspicker.html\",\n\t\t\t\"nls\"       \t: \"money/nls/tagspicker\"\n\t\t},\n\t\t\"accountpicker\": {\n\t\t\t\"constraint\" \t: \"center\",\n\t\t\t\"controller\" \t: \"money/views/accountpicker\",\n\t\t\t\"template\"\t \t: \"money/views/accountpicker.html\",\n\t\t\t\"nls\"       \t: \"money/nls/accountpicker\"\n\t\t},\n\t\t\"backup\": {\n\t\t\t\"constraint\" \t: \"center\",\n\t\t\t\"controller\" \t: \"money/views/backup\",\n\t\t\t\"template\"\t \t: \"money/views/backup.html\",\n\t\t\t\"nls\"       \t: \"money/nls/backup\"\n\t\t},\n\t\t\"settings\": {\n\t\t\t\"constraint\" \t: \"center\",\n\t\t\t\"controller\" \t: \"money/views/settings\",\n\t\t\t\"template\"\t \t: \"money/views/settings.html\",\n\t\t\t\"nls\"\t \t\t: \"money/nls/settings\"\n\t\t\t\n\t\t},\n\t\t\"accounts\": {\n\t\t\t\"constraint\" \t: \"center\",\n\t\t\t\"controller\" \t: \"money/views/accounts\",\n\t\t\t\"template\"\t \t: \"money/views/accounts.html\",\n\t\t\t\"nls\"\t \t\t: \"money/nls/accounts\"\n\t\t},\n\t\t\"tags\": {\n\t\t\t\"constraint\" : \"center\",\n\t\t\t\"controller\" : \"money/views/tags\",\n\t\t\t\"template\"\t : \"money/views/tags.html\",\n\t\t\t\"nls\"\t : \"money/nls/tags\"\n\t\t},\n\t\t\"currencypicker\": {\n\t\t\t\"constraint\" : \"center\",\n\t\t\t\"controller\" : \"money/views/currencypicker\",\n\t\t\t\"template\"\t : \"money/views/currencypicker.html\",\n\t\t\t\"nls\"        : \"money/nls/currency\"\n\t\t},\n\t\t\"timespan\": {\n\t\t\t\"constraint\" : \"center\",\n\t\t\t\"controller\" : \"money/views/timespan\",\n\t\t\t\"template\"\t : \"money/views/timespan.html\",\n\t\t\t\"nls\"\t\t : \"money/nls/timespan\"\n\t\t},\n\t\t\"transitione\": {\n\t\t\t\"constraint\" : \"center\",\n\t\t\t\"controller\" : \"money/views/transition\",\n\t\t\t\"template\"\t : \"money/views/transition.html\"\n\t\t},\n\t\t\"language\": {\n\t\t\t\"constraint\" : \"center\",\n\t\t\t\"controller\" : \"money/views/language\",\n\t\t\t\"template\"\t : \"money/views/language.html\",\n\t\t\t\"nls\"\t\t : \"money/nls/language\"\n\t\t},\n\t\t\"theme\": {\n\t\t\t\"constraint\" : \"center\",\n\t\t\t\"controller\" : \"money/views/theme\",\n\t\t\t\"template\"\t : \"money/views/theme.html\",\n\t\t\t\"nls\"\t\t : \"money/nls/theme\"\n\t\t}\n    },\n    \"has\": {\n\t\t\"html5history\": {\n\t\t\t\"controllers\": [\n\t\t\t\t\"dojox/app/controllers/History\"\n\t\t\t]\n\t\t},\n\t\t\"!html5history\": {\n\t\t\t\"controllers\": [\n\t\t\t\t\"dojox/app/controllers/HistoryHash\"\n\t\t\t]\n\t\t}\t\t\n\t}\n}\n",
'url:money/views/list.html':"<div data-dojo-type=\"dojox/app/widgets/Container\">\n    <div data-dojo-type=\"dojox/mobile/Heading\"\n        data-dojo-props=\"fixed: 'top'\" id=\"list-title\" class=\"title\">\n\n        <button data-dojo-type=\"money/TouchableToolBarButton\"\n            data-dojo-attach-point=\"backButton\"\n            data-dojo-props=\"arrow: 'left', target: 'summary', transitionDir: -1, transitionOptions: { params: { id: window.AppData.currentDate }}\"\n            class=\"left-button\"\n            >${nls.summary}</button>       \n\t\t</button>\n\n\t\t${nls.title}\n\n\t\t<button data-dojo-type=\"money/TouchableToolBarButton\"\n\t\t\tclass=\"right-button mblRedButton\"\n\t\t\tdata-dojo-props=\"target: 'details',\n\t\t\t\ttransitionOptions: { params: { edit: true } }\"\n\t\t\tdata-dojo-attach-point=\"add\"><i class=\"fa fa-plus\"></i> ${nls.add}</button>\n\t\t\n    </div>\n    \n    <div id=\"list-sum\">\n\t\t<span id=\"list-sum-ts\">${nls.total}: </span>\n\t\t<span style=\"float:right;margin-right:10px\">\n\t\t\t<span id=\"list-sum-title\"></span>\n\t\t\t<span id=\"list-sum-total\"></span>\n\t\t</span>\n\t</div>\n\t\n    <ul data-dojo-type=\"dojox/mobile/TabBar\" data-dojo-props=\"fixed:'bottom'\">\n\t\t<li data-dojo-type=\"dojox/mobile/TabBarButton\" id='list-is-e'\n\t\t\tdata-dojo-props=\"target: 'list', icon: 'icons/icon_transactions.png', iconPos1:'0,19,19,17',\n                    transitionOptions: { params: { type: 'e', id : this.params.id } }\">${nls.expences}</li>\n\t\t<li data-dojo-type=\"dojox/mobile/TabBarButton\" id='list-is-i'\n\t\t\tdata-dojo-props=\"target: 'list',icon: 'icons/icon_transactions.png', iconPos1:'0,0,19,17',\n                    transitionOptions: { params: { type: 'i', id : this.params.id } }\">${nls.incomes}</li>\n\t\t<li data-dojo-type=\"dojox/mobile/TabBarButton\" id='list-is-t'\n\t\t\tdata-dojo-props=\"target: 'list', icon: 'icons/icon_transactions.png', iconPos1:'0,38,21,17',\n                    transitionOptions: { params: { type: 't', id : this.params.id } }\">${nls.transfers}</li>\n\t</ul>\n\t\n    <div data-dojo-type=\"money/WheelScrollableView\"\n\t\tdata-dojo-props=\"threshold:window.AppData.treshold\">\n\t\t\n\t\t<div \n\t\t\tdata-dojo-type=\"dojox/mobile/RoundRectCategory\" \n\t\t\tdata-dojo-attach-point=\"emptyMsgTitle\">\n\t\t\t\t${nls.noExpences}\n\t\t</div>\n\t\t<div \n\t\t\tdata-dojo-attach-point=\"emptyMsg\"\n\t\t\tdata-dojo-type=\"dojox/mobile/RoundRect\" \n\t\t\tdata-dojo-props='shadow:true'>\n\t\t\t\t${nls.tapAdd}\n\t\t</div>\n\n\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeStoreList\"\n            data-dojo-attach-point=\"transactions\" id=\"daily-list\"\n            data-dojo-props=\"store: this.loadedStores.transactions,\n\t\t\t\t\t\t\tquery: this.queryIdb,syncWithViews: true,\n\t\t\t\t\t\t\tqueryOptions: {sort: [{attribute:'date', descending: true}] },\n                            createListItem: this.createListItem,\n\t\t\t\t\t\t\tlabelProperty: 'cats',append:false,\n                            itemRenderer: this.listItem\">\n\t\t</div>\n    </div>\n</div>\n",
'url:money/views/charts-pie.html':"<div class=\"mblBackground\">\n    <div data-dojo-type=\"dojox/mobile/Heading\"\n        data-dojo-props=\"fixed: 'top'\">\n        <button data-dojo-type=\"dojox/mobile/ToolBarButton\"\n            data-dojo-attach-point=\"backButton\"\n            data-dojo-props=\"arrow: 'left', target: 'charts', transitionDir: -1\"\n            class=\"left-button\">${nls.back}</button>\n    </button>\n    ${nls.title}\n    </div>\n    <div data-dojo-type=\"money/WheelScrollableView\">\n\t\t\n\t\t<div id=\"chart-pie\">\n\t\t\t\n\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t${nls.myTransactions}\n\t\t\t</div>\n\t\t\t<ul class=\"no-background\" data-dojo-type=\"dojox/mobile/TabBar\" data-dojo-props=\"barType: 'segmentedControl'\" id=\"pie-chart-type\">\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/TabBarButton\"\n\t\t\t\t\tdata-dojo-attach-point=\"expChart\" data-dojo-props=\"selected:true\"\n\t\t\t\t\t>${nls.expences}</li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/TabBarButton\"\n\t\t\t\t\tdata-dojo-attach-point=\"incChart\"\n\t\t\t\t\t>${nls.incomes}</li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/TabBarButton\"\n\t\t\t\t\tdata-dojo-attach-point=\"transfChart\"\n\t\t\t\t\t>${nls.transfers}</li>\n\t\t\t</ul>\n\t\t\t<div>\n\t\t\t\t\n\t\t\t</div>\n\t\t\t<div data-dojo-type=\"dojox/mobile/Pane\" id=\"no-transactions-chart\">\n\t\t\t\t${nls.noTransactions}<br/>${nls.tap} <b>${nls.transactions}</b> -> <b>${nls.add}</b> ${nls.navMenu} ${nls.addFirst}.\n\t\t\t</div>\n\t\t\t<!-- create the chart -->\n\t\t\t<div id=\"pie-chart\">\n\t\t\t\t<div id=\"chartNode\" ></div>\n\t\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t\t<span id=\"charts-pie-sum-ts\"></span><span id=\"charts-pie-sum-total\"></span>\n\t\t\t\t</div>\n\t\t\t\t<div id=\"legend\"></div>\n\t\t\t</div>\n\t\t\t\n\t\t\t\t\n\t\t</div>\t\t\n    </div>\n</div>\n",
'url:money/views/navigation.html':"\t<div data-dojo-type=\"dojox/app/widgets/Container\" class=\"navPane left\" id=\"main-nav\" data-dojo-attach-point=\"navOuterContainer\">\n\t\t<h1 data-app-constraint=\"top\" data-dojo-type=\"dojox/mobile/Heading\" data-dojo-props=\"label:'${nls.title}'\"></h1>\n\t\t<div data-dojo-type=\"dojox/app/widgets/Container\" data-dojo-props=\"scrollable: true, threshold:window.AppData.treshold\">\n\t\t\t<!--<h2 data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\" style=\"height: 32px;\">Navigation</h2>-->\n\t\t\t<ul data-dojo-type=\"dojox/mobile/EdgeToEdgeList\" class=\"icon-list\">\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\" data-dojo-props=\"clickable:true,label:'<i class=\\'fa-fixed fa fa-credit-card\\'></i> ${nls.transactions}',target:'summary',arrow: true\"></li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\" data-dojo-props=\"clickable:true,label:'<i class=\\'fa-fixed fa fa-bar-chart-o\\'></i> ${nls.stats}',target:'charts',url:'#charts'\"></li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\" data-dojo-props=\"clickable:true,label:'<i class=\\'fa-fixed fa fa-clock-o\\'></i> ${nls.timespan}', target: 'timespan'\"></li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\" data-dojo-props=\"clickable:true,label:'<i class=\\'fa-fixed fa fa-hdd-o\\'></i> ${nls.backup}', target: 'backup'\"></li>\n\t\t\t\t\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\" data-dojo-props=\"clickable:true,label:'<i class=\\'fa-fixed fa fa-gear\\'></i> ${nls.settings}', target:'settings'\"></li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\" data-dojo-props=\"clickable:true,label:'<i class=\\'fa-fixed fa fa-info\\'></i> ${nls.about}',target:'about',url:'#about'\"></li>\n\t\t\t</ul>\n\t\t</div>\n\t</div>\n",
'url:money/views/summary.html':"<div \n\tdata-dojo-type=\"dojox/app/widgets/Container\">    \n    <div \n\t\tdata-dojo-type=\"dojox/mobile/Heading\" \n\t\tclass=\"title\"\n        data-dojo-props=\"fixed: 'top'\">        \n\t\t\n\t\t<button \n\t\t\tdata-dojo-type=\"dojox/mobile/ToolBarButton\"\n            data-dojo-attach-point=\"menuButton\"\n            data-dojo-props=\"target:'navigation',transitionDir:-1\"\n            class=\"left-button\"><i class=\"fa fa-bars\"></i> ${nls.menu}</button>\n        \n        ${nls.title}\n        \n        <button\n\t\t\tdata-dojo-type=\"dojox/mobile/ToolBarButton\"\n            class=\"right-button mblRedButton\"\n            data-dojo-props=\"\n\t\t\t\ttarget: 'details',\n\t\t\t\ttransitionOptions: { params: { edit: true } }\"\n            data-dojo-attach-point=\"add\"><i class=\"fa fa-plus\"></i> ${nls.add}</button>\n    </div>\n    \n    <div id=\"summary-sum\">\n\t\t<span id=\"summary-sum-ts\"></span>\n\t\t<span style=\"float:right;margin-right:10px\">\n\t\t\t<span id=\"summary-sum-title\">${nls.total}: </span>\n\t\t\t<span id=\"summary-sum-total\"></span>\n\t\t</span>\n\t</div>\n\t\n\t<div \n\t\tdata-dojo-type=\"money/WheelScrollableView\"\n\t\tdata-dojo-attach-point=\"scrollView\" style=\"transform: translatez(0);\"\n\t\tdata-dojo-props=\"threshold:window.AppData.treshold\">\n\t\t\n\t\t<div id=\"welcome-note\">\n\t\t\t<div \n\t\t\t\tdata-dojo-type=\"dojox/mobile/RoundRectCategory\">\n\t\t\t\t\t${nls.welcome}\n\t\t\t</div>\n\t\t\t<div \n\t\t\t\tdata-dojo-type=\"dojox/mobile/RoundRect\" >\n\t\t\t\t\t${nls.welcome2}<br/>${nls.versionNote}\n\t\t\t</div>\n\t\t\t<div \n\t\t\t\tdata-dojo-type=\"dojox/mobile/RoundRectCategory\" >\n\t\t\t\t\t${nls.aboutR5mTitle}\n\t\t\t</div>\n\t\t\t<div \n\t\t\t\tdata-dojo-type=\"dojox/mobile/RoundRect\" \n\t\t\t\t>\n\t\t\t\t\t${nls.aboutR5m}\n\t\t\t</div>\n\t\t\t<div \n\t\t\t\tdata-dojo-type=\"dojox/mobile/RoundRectCategory\">\n\t\t\t\t\t${nls.aboutSyncTitle}\n\t\t\t</div>\n\t\t\t<div\n\t\t\t\tdata-dojo-type=\"dojox/mobile/RoundRect\" \n\t\t\t\t>\n\t\t\t\t\t${nls.aboutSync}\n\t\t\t</div>\n\t\t\t<div \n\t\t\t\tdata-dojo-type=\"dojox/mobile/RoundRectCategory\">\n\t\t\t\t\t${nls.aboutHelpTitle}\n\t\t\t</div>\n\t\t\t<div \n\t\t\t\tdata-dojo-type=\"dojox/mobile/RoundRect\">\n\t\t\t\t\t${nls.aboutHelp}\n\t\t\t</div>\n\t\t\t<div \n\t\t\t\tdata-dojo-type=\"dojox/mobile/RoundRectCategory\">\n\t\t\t\t\t${nls.aboutSettingsTitle}\n\t\t\t</div>\n\t\t\t<div \n\t\t\t\tdata-dojo-type=\"dojox/mobile/RoundRect\" \n\t\t\t\t>\n\t\t\t\t\t${nls.aboutSettings}\n\t\t\t</div>\n\t\t</div>\n\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeStoreList\"\n            data-dojo-attach-point=\"daily\" id=\"summary-list\"\n            data-dojo-props=\"\n\t\t\t\tstore: this.loadedStores.transactions,\n\t\t\t\tquery: this.getQuery(), queryOptions:{sort:[{attribute: 'date', descending: false}]},\n\t\t\t\tcreateListItem: this.createListItem,\n\t\t\t\tlabelProperty: 'dateString',\n                itemRenderer: this.listItem\">\n\t\t</div>\t\t\n    </div>    \n    \n    <!-- Bottom tabbar-->\n    <ul data-dojo-type=\"dojox/mobile/TabBar\" data-dojo-attach-point=\"bottomBar\" data-dojo-props=\"fixed: 'bottom'\">\n\t\t<li data-dojo-type=\"dojox/mobile/TabBarButton\" id='sum-is-e'\n\t\t\tdata-dojo-props=\"selected:true,target: 'summary', icon: 'icons/icon_transactions.png', iconPos1:'0,19,19,17',\n\t\t\t\t\ttransitionOptions: { params: { type: 'e', refresh: true } }\">${nls.expences}</li>\n\t\t<li data-dojo-type=\"dojox/mobile/TabBarButton\" id='sum-is-i'\n\t\t\tdata-dojo-props=\"target: 'summary', icon: 'icons/icon_transactions.png', iconPos1:'0,0,19,17',\n                    transitionOptions: { params: { type: 'i', refresh: true } }\">${nls.incomes}</li>\n\t\t<li data-dojo-type=\"dojox/mobile/TabBarButton\" id='sum-is-t'\n\t\t\tdata-dojo-props=\"target: 'summary', icon: 'icons/icon_transactions.png', iconPos1:'0,38,21,17',\n                    transitionOptions: { params: { type: 't', refresh: true } }\">${nls.transfers}</li>\n\t</ul>\n</div>\n",
'url:money/views/transition.html':"<div class=\"mblBackground\">\n\t<div \n\t\tdata-dojo-attach-point=\"heading\"\n\t\tdata-dojo-type=\"dojox/mobile/Heading\" data-dojo-props=\"label:'${nls.animation}'\">\n\t\t<button data-dojo-type=\"dojox/mobile/ToolBarButton\"\n            data-dojo-attach-point=\"backButton\"\n            data-dojo-props=\"arrow: 'left', target: 'settings', transitionDir: -1\"\n            class=\"left-button\">${nls.settings}</button>\n\t</div>\n\t<div \n\t\tdata-dojo-type=\"money/WheelScrollableView\"\n\t\tdata-dojo-props=\"threshold:window.AppData.treshold\"\n\t\tdata-dojo-attach-point=\"viewContainer\">\n\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\" \n\t\t\tdata-dojo-props=\"label:'${nls.animation}'\"></div>\n\t\t<div data-dojo-type=\"dojox/mobile/Pane\" data-dojo-props='shadow:true'>\n\t\t\t${nls.animHelp}\n\t\t</div>\n\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\" \n\t\t\tdata-dojo-props=\"label:'${nls.transition}'\"></div>\n\t\t<ul data-dojo-type=\"dojox/mobile/EdgeToEdgeList\" data-dojo-props=\"select: 'single'\">\n\t\t\t<div \n\t\t\t\tdata-dojo-attach-point=\"none\" \n\t\t\t\tdata-dojo-type=\"dojox/mobile/ListItem\" \n\t\t\t\tdata-dojo-props=\"label: 'None'\"></div>\n\t\t\t<div \n\t\t\t\tdata-dojo-attach-point=\"slide\" \n\t\t\t\tdata-dojo-type=\"dojox/mobile/ListItem\" \n\t\t\t\tdata-dojo-props=\"label: 'Slide', checked: true\"></div>\n\t\t\t<div \n\t\t\t\tdata-dojo-attach-point=\"fade\" \n\t\t\t\tdata-dojo-type=\"dojox/mobile/ListItem\" \n\t\t\t\tdata-dojo-props=\"label: 'Fade'\"></div>\n\t\t\t<div \n\t\t\t\tdata-dojo-attach-point=\"flip\" \n\t\t\t\tdata-dojo-type=\"dojox/mobile/ListItem\" \n\t\t\t\tdata-dojo-props=\"label: 'Flip'\"></div>\n\t\t\t\n\t\t</ul>\n\t\n\t</div>\t\t\t\n</div>\n",
'url:money/numberpicker.html':"<div class=\"wrapper1\">\r\n\t<h2 style=\"margin: 0px; line-height: 45px;\">\r\n\t\t<button data-dojo-type=\"dojox/mobile/ToolBarButton\" label=\"${nls.done}\" class=\"mblBlueButton right-button\"\r\n\t\t\tonClick=\"window.AppData.numberPicker.onDone()\"\r\n\t\t\tdata-dojo-attach-point=\"okButton\"\r\n\t\t\t></button> ${nls.title}\r\n\t</h2>\r\n\t\t\r\n    <div style=\"margin:20px auto 15px auto; width:200px\">\r\n\t\t<input type=\"text\" id = \"amount-input\"\r\n\t\t\tdata-dojo-attach-point=\"inputField\"\r\n\t\t\tstyle=\"text-align:right;font-weight:bold;font-size:150%; line-height:1em; height:1.5em; width:100%\" \r\n\t\t\tdata-dojo-props=\"readOnly:true, value:''\" \r\n\t\t\tdata-dojo-type=\"dojox/mobile/TextBox\"/>\r\n\t</div>\r\n\t<div data-dojo-type=\"dojox/mobile/GridLayout\" data-dojo-props='cols:3' style=\"\">\r\n\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\r\n\t\t\t<div class=\"wrapper\">\r\n\t\t\t\t<button class=\"mblBlueButton wide\" data-dojo-type=\"dojox/mobile/ToolBarButton\"\r\n\t\t\t\tdata-dojo-props=\"_onTouchStart: function(){console.log(this,'!');window.AppData.numberPicker.key('1', this)}\">1</button>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\r\n\t\t\t<div class=\"wrapper\">\r\n\t\t\t\t<button class=\"mblBlueButton wide\" data-dojo-type=\"dojox/mobile/ToolBarButton\"\r\n\t\t\t\tdata-dojo-props=\"_onTouchStart: function(){window.AppData.numberPicker.key('2', this)}\">2</button>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\r\n\t\t\t<div class=\"wrapper\">\r\n\t\t\t\t<button class=\"mblBlueButton wide\" data-dojo-type=\"dojox/mobile/ToolBarButton\"\r\n\t\t\t\t\tdata-dojo-props=\"_onTouchStart: function(){window.AppData.numberPicker.key('3',this)}\">3</button>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\r\n\t\t\t<div class=\"wrapper\">\r\n\t\t\t\t<button class=\"mblBlueButton wide\" data-dojo-type=\"dojox/mobile/ToolBarButton\"\r\n\t\t\t\t\tdata-dojo-props=\"_onTouchStart: function(){window.AppData.numberPicker.key('4',this)}\">4</button>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\r\n\t\t\t<div class=\"wrapper\">\r\n\t\t\t\t<button class=\"mblBlueButton wide\" data-dojo-type=\"dojox/mobile/ToolBarButton\"\r\n\t\t\t\t\tdata-dojo-props=\"_onTouchStart: function(){window.AppData.numberPicker.key('5',this)}\">5</button>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\r\n\t\t\t<div class=\"wrapper\">\r\n\t\t\t\t<button class=\"mblBlueButton wide\" data-dojo-type=\"dojox/mobile/ToolBarButton\"\r\n\t\t\t\t\tdata-dojo-props=\"_onTouchStart: function(){window.AppData.numberPicker.key('6',this)}\">6</button>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\r\n\t\t\t<div class=\"wrapper\">\r\n\t\t\t\t<button class=\"mblBlueButton wide\" data-dojo-type=\"dojox/mobile/ToolBarButton\"\r\n\t\t\t\t\tdata-dojo-props=\"_onTouchStart: function(){window.AppData.numberPicker.key('7',this)}\">7</button>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\r\n\t\t\t<div class=\"wrapper\">\r\n\t\t\t\t<button class=\"mblBlueButton wide\" data-dojo-type=\"dojox/mobile/ToolBarButton\"\r\n\t\t\t\t\tdata-dojo-props=\"_onTouchStart: function(){window.AppData.numberPicker.key('8',this)}\">8</button>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\r\n\t\t\t<div class=\"wrapper\">\r\n\t\t\t\t<button class=\"mblBlueButton wide\" data-dojo-type=\"dojox/mobile/ToolBarButton\" \r\n\t\t\t\t\tdata-dojo-props=\"_onTouchStart: function(){window.AppData.numberPicker.key('9',this)}\">9</button>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\r\n\t\t\t<div class=\"wrapper\">\r\n\t\t\t\t<button class=\"mblRedButton wide\" data-dojo-type=\"dojox/mobile/ToolBarButton\"\r\n\t\t\t\t\tdata-dojo-props=\"_onTouchStart: function(){window.AppData.numberPicker.key('c',this)}\"><i class=\"fa fa-eraser\"></i></button>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\r\n\t\t\t<div class=\"wrapper\">\r\n\t\t\t\t<button class=\"mblBlueButton wide\" data-dojo-type=\"dojox/mobile/ToolBarButton\"\r\n\t\t\t\t\tdata-dojo-props=\"_onTouchStart: function(){window.AppData.numberPicker.key('0',this)}\">0</button>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\r\n\t\t\t<div class=\"wrapper\">\r\n\t\t\t\t<button class=\"mblBlueButton wide\" data-dojo-type=\"dojox/mobile/ToolBarButton\"\r\n\t\t\t\t\tdata-dojo-props=\"_onTouchStart: function(){window.AppData.numberPicker.key('dz',this)}\">.00</button>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t</div>\r\n</div>\r\n",
'url:money/views/timespan.html':"<div class=\"mblBackground\">\n    <div data-dojo-type=\"dojox/mobile/Heading\"\n        data-dojo-props=\"fixed: 'top'\">\n        <button data-dojo-type=\"dojox/mobile/ToolBarButton\"\n            data-dojo-attach-point=\"backButton\"\n            data-dojo-props=\"arrow: 'left', target: 'navigation', transitionDir: -1, transitionOptions: { params: { id: window.AppData.currentDate }}\"\n            class=\"left-button\">${nls.menu}</button>\n    </button>\n    ${nls.title} \n    </div>\n    <div data-dojo-type=\"money/WheelScrollableView\">\n\t\t<div>\n\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t\t${nls.title}\n\t\t\t\t</div><div data-dojo-type=\"dojox/mobile/Pane\">\n\t\t\t\t${nls.help}\n\t\t\t</div>\n\t\t\n\t\t\t<div>\n\t\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t\t${nls.selectTimespan}\n\t\t\t\t</div>\n\t\t\t\t<ul data-dojo-type=\"dojox/mobile/EdgeToEdgeList\" data-dojo-props=\"select:'single'\">\n\t\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"\n\t\t\t\t\t\tdata-dojo-attach-point=\"last31\"\n\t\t\t\t\t\tdata-dojo-props='clickable:true, label:\"${nls.last31}\"'>\n\t\t\t\t\t</li>\n\t\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"\n\t\t\t\t\t\tdata-dojo-attach-point=\"customTimespan\"\n\t\t\t\t\t\tdata-dojo-props='clickable:true, label:\"${nls.customTimespan}\"'>\n\t\t\t\t\t</li>\n\t\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"\n\t\t\t\t\t\tdata-dojo-attach-point=\"lastMonth\"\n\t\t\t\t\t\tdata-dojo-props='clickable:true, label:\"${nls.lastMonth}\"'>\n\t\t\t\t\t</li>\n\t\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"\n\t\t\t\t\t\tdata-dojo-attach-point=\"noneTimespan\"\n\t\t\t\t\t\tdata-dojo-props='clickable:true, label:\"${nls.allTimespan}\"'>\n\t\t\t\t\t</li>\n\t\t\t\t</ul>\n\t\t\t\t<div data-dojo-attach-point=\"timespanOverlay\" data-dojo-type=\"dojox/mobile/SimpleDialog\" class=\"overlay date-overlay\">\n\t\t\t\t\t<div class=\"wrapper1\">\n\t\t\t\t\t\t<h2 style=\"margin: 0px; line-height: 45px;\">\n\t\t\t\t\t\t\t<div data-dojo-type=\"dojox/mobile/ToolBarButton\" label=\"${nls.done}\" class=\"mblColorBlue\" style=\"width:45px;float:right;\" \t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\tdata-dojo-attach-point=\"okButton\"\t\t\t\t\n\t\t\t\t\t\t\t></div>\n\t\t\t\t\t\t\t${nls.selectDate}\n\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t<div id=\"timespanPicker\" style=\"margin-top: 10px;\"></div>\n\t\t\t\t\t\t</h2>\n\t\t\t\t\t\t\n\t\t\t\t\t</div>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t</div>\n    </div>\n</div>\n",
'url:money/views/accountpicker.html':"<div class=\"\" data-dojo-type=\"dojox/app/widgets/Container\" >\n\t<h1 data-dojo-type=\"dojox/mobile/Heading\" data-dojo-props=\"fixed:'top',label:'${nls.title}'\">\n\t\t\t<div data-dojo-type=\"dojox/mobile/ToolBarButton\" label=\"${nls.done}\" class=\"mblBlueButton right-button\"\n\t\t\t\tdata-dojo-attach-point = \"done\"\t\t\t\t\n\t\t\t></div>\n\t\t</h1>\n\t\t<div data-dojo-type=\"money/WheelScrollableView\">\n\t\t<div data-dojo-type=\"dojox/mobile/Heading\" data-dojo-props=\"fixed:'top'\" style=\"height:auto\" class=\"mblSecondHeading\">\n\t\t\t<div style=\"padding: 5px 20px;\">\n\t\t\t\t<div class=\"view-help\">${nls.viewHelp}</div>\n\t\t\t\t<input type=\"text\" data-dojo-type=\"dojox/mobile/TextBox\" id=\"newAccount\" \n\t\t\t\t\tdata-dojo-props=\"placeHolder:'Enter account title'\"/>\n\t\t\t</div>\n\t\t</div>\n\t\t<div style=\"padding: 0 10px 10px 10px\">\n\t\t\t<div id=\"accountPicker\" \n\t\t\t\tdata-dojo-type=\"dojox/mobile/RoundRectStoreList\"\n\t\t\t\tdata-dojo-attach-point=\"accountPicker\"\n\t\t\t\tdata-dojo-props=\"stateful:true,store: window.AppData.accountStore, select:'single'\">\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>\t\n",
'url:money/views/currencypicker.html':"<div data-dojo-type=\"dojox/app/widgets/Container\" >\n\t<h1 data-dojo-type=\"dojox/mobile/Heading\" data-dojo-props=\"fixed:'top',label:'${nls.title}'\">\n\t\t\t<div data-dojo-type=\"money/TouchableToolBarButton\" label=\"${nls.done}\" class=\"mblRedButton right-button\"\n\t\t\t\tdata-dojo-attach-point = \"done\"\n\t\t\t></div>\n\t\t</h1>\n\t\t<div data-dojo-type=\"dojox/mobile/Heading\" data-dojo-props=\"fixed:'top'\" class=\"mblSecondHeading\" style=\"height:auto\">\n\t\t\t\t<div style=\"padding: 5px 20px;\">\n\t\t\t\t\t<div class=\"view-help\">${nls.selectCurrency}</div>\n\t\t\t\t\t<input type=\"text\" data-dojo-type=\"dojox/mobile/TextBox\" id=\"currencyInput\" \n\t\t\t\t\t\tdata-dojo-props=\"placeHolder:'Euro (EUR)', readOnly: true\"/>\n\t\t\t\t</div>\n\t\t\t</div>\n\t\t<div class=\"heading-button-wrapper\"><button \n\t\t\t\tdata-dojo-type=\"money/TouchableButton\" \n\t\t\t\tclass=\"mblBlueButton\" \n\t\t\t\tdata-dojo-attach-point=\"more\"\n\t\t\t\tstyle=\"width: 100%;\">\n\t\t\t\t${nls.more}\n\t\t\t</button>\n\t\t</div>\n\t\t<div \n\t\t\tdata-dojo-attach-point=\"scrollView\"\n\t\t\tdata-dojo-type=\"money/WheelScrollableView\" \n\t\t\tdata-dojo-props=\"threshold:window.AppData.treshold\">\n\t\t\t\n\t\t\t<div id=\"currencyPicker\" \n\t\t\t\tdata-dojo-type=\"dojox/mobile/RoundRectStoreList\"\n                data-dojo-mixins=\"dojox/mobile/LongListMixin\"\n\t\t\t\tdata-dojo-attach-point=\"currencyPicker\"\n\t\t\t\tdata-dojo-props=\"\n\t\t\t\t\tmaxPages:3, \n\t\t\t\t\tpageSize:10, \n\t\t\t\t\tquery: this.query, \n\t\t\t\t\tqueryOptions: {sort: [{attribute:'label', descending: false}] },\n\t\t\t\t\tstateful:true, \n\t\t\t\t\tstore: window.AppData.currencyStore, \n\t\t\t\t\tselect:'single'\">\n\t\t\t</div>\n\t\t\t\n\t\t</div>\n\t\t\n</div>\t\n",
'url:money/views/tags.html':"<div \n\tdata-dojo-type=\"dojox/app/widgets/Container\">\n    <div data-dojo-type=\"dojox/mobile/Heading\"\n\t\tclass=\"title\"\n        data-dojo-props=\"fixed: 'top'\">\n        \n        <button data-dojo-type=\"money/TouchableToolBarButton\"\n            data-dojo-attach-point=\"backButton\"\n            data-dojo-props=\"arrow: 'left', target: 'settings', transitionDir: -1, transitionOptions: { params: { id: window.AppData.currentDate }}\"\n            class=\"left-button\">${nls.settings}</button>\n\t\t</button>\n\t\t\n\t\t${nls.title}\n\t\t\n\t\t<button data-dojo-type=\"money/TouchableToolBarButton\"\n            class=\"right-button mblRedButton\"\n            data-dojo-attach-point=\"addBtn\"><i class=\"fa fa-plus\"></i> ${nls.add}</button>\n\t\t\n    </div>\n    <div data-dojo-type=\"money/WheelScrollableView\">\n\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t<span class=\"right-title\">${nls.quantity}</span>${nls.myTags}\n\t\t\t</div>\n\t\t\t<div data-dojo-type=\"dojox/mobile/Pane\" id=\"no-tags-tags\">\n\t\t\t\t${nls.noTags} <br/>\n\t\t\t\t${nls.tap} <b>${nls.add}</b> ${nls.addFirst}.\n\t\t\t</div>\n\t\t\t<ul data-dojo-type=\"dojox/mobile/EdgeToEdgeList\"\n\t\t\t\tdata-dojo-attach-point = \"tagList\" id=\"tags-list\">\n\t\t\t</ul>\n\t</div>\n\t\n</div>\n",
'url:money/views/accounts.html':"<div class=\"mblBackground\">\n    <div data-dojo-type=\"dojox/mobile/Heading\"\n        data-dojo-props=\"fixed: 'top'\">\n        <button data-dojo-type=\"dojox/mobile/ToolBarButton\"\n            data-dojo-attach-point=\"backButton\"\n            data-dojo-props=\"arrow: 'left', target: 'settings', transitionDir: -1, transitionOptions: { params: { id: window.AppData.currentDate }}\"\n            class=\"left-button\">${nls.settings}</button>\n\t\t</button>\n\t\t<button data-dojo-type=\"dojox/mobile/ToolBarButton\"\n            class=\"right-button mblRedButton\"\n            data-dojo-attach-point=\"addBtn\"><i class=\"fa fa-plus\"></i> ${nls.add}</button>\n\t\t${nls.title} \n    </div>\n    <div data-dojo-type=\"money/WheelScrollableView\">\n\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t<span class=\"right-title\" style=\"margin-left: 0;\">${nls.startAmount}</span>\n\t\t\t</div>\n\t\t\t<div data-dojo-type=\"dojox/mobile/Pane\" id=\"no-accounts-accounts\">\n\t\t\t\t${nls.tap} <b>${nls.add}</b> ${nls.addFirst}.\n\t\t\t</div>\n\t\t\t<ul data-dojo-type=\"dojox/mobile/EdgeToEdgeList\"\n\t\t\t\tdata-dojo-attach-point = \"accList\" id=\"accs-list\">\n\t\t\t</ul>\n\t</div>\n\t\n</div>\n",
'url:money/views/theme.html':"<div class=\"mblBackground\">\n\t<div \n\t\tdata-dojo-attach-point=\"heading\"\n\t\tdata-dojo-type=\"dojox/mobile/Heading\" data-dojo-props=\"label:'${nls.title}'\">\n\t\t<button data-dojo-type=\"dojox/mobile/ToolBarButton\"\n            data-dojo-attach-point=\"backButton\"\n            data-dojo-props=\"arrow: 'left', target: 'settings', transitionDir: -1\"\n            class=\"left-button\">${nls.back}</button>\n\t</div>\n\t<div \n\t\tdata-dojo-type=\"money/WheelScrollableView\" data-dojo-props=\"height:'auto'\"\n\t\tdata-dojo-attach-point=\"viewContainer\">\n\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\" data-dojo-props=\"label:'${nls.theme}'\"></div>\n\t\t<ul data-dojo-type=\"dojox/mobile/EdgeToEdgeList\" data-dojo-props=\"select: 'single'\">\n\t\t\t<div \n\t\t\t\tdata-dojo-attach-point=\"ios7\" \n\t\t\t\tdata-dojo-type=\"dojox/mobile/ListItem\" \n\t\t\t\tdata-dojo-props=\"label: '${nls.light}', checked: true\"></div>\n\t\t\t<div \n\t\t\t\tdata-dojo-attach-point=\"Holodark\" \n\t\t\t\tdata-dojo-type=\"dojox/mobile/ListItem\" \n\t\t\t\tdata-dojo-props=\"label: '${nls.dark}'\"></div>\t\t\t\n\t\t\t\n\t\t</ul>\n\t\n\t</div>\t\t\t\n</div>\n",
'*now':function(r){r(['dojo/i18n!*preload*money/nls/money-app*[]']);}
}});
define("money/money-app", [], 1);
