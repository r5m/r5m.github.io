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
				//window.AppData.numberPicker = this
								
			},
			type	: 'e',
			zeros 	: 2,
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
			
			show: function(){
				
				this.value = String(window.AppData.details.transaction.amount);
				var dotPos = this.value.length - this.value.indexOf('.');
				this.value = String( Math.abs( this.value * Math.pow(10, ( dotPos - 1 ) ) ) );
				while( this.value.length < this.zeros + 1) {
					this.value += '0';
				}
				console.log(this.value);
				if(window.AppData.details && window.AppData.details.transaction && window.AppData.details.transaction.type)
					this.type = window.AppData.details.transaction.type
				if(this.mode == "t" ) this.amount.set('value', getNumber( Math.abs( window.AppData.details.transaction.amount )))
				else if(this.mode == "a" ) this.amount.set('value',getNumber(Math.abs(window.AppData.objAccounts.account.startAmount)))
				registry.byId('customPicker').show('amount', ['below-centered','above-centered','after','before'])
			},
			
			done: function(){
				var val = Number( registry.byId('amount-input').get('value') );
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
				
				if(code == "dz") {
					this.key('0');
					this.key('0');
					return;
				} else if(code == 'c') {
					this.value = this.value.substr(0, this.value.length - 1)
					if(this.value.length < 3)
						this.value = '0' + this.value.toString()
					}else{
						this.value += code.toString() ;
						if(this.value.substr(0, 1) == '0'){
							this.value = this.value.substr(1, this.value.length-1)
						}							
					}
				var newval = this.value.substr(0,this.value.length-2) + '.' + this.value.substr(-2);
				self.amount.set('value', newval)
			},
		})
	}
);
