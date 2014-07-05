// Include basic Dojo, mobile, XHR dependencies along with
define([
	"dojo/_base/declare","dijit/registry",
	"dojo/on","dijit/_WidgetBase","dojo/_base/array","dojo/_base/lang",
    "dijit/_TemplatedMixin","dijit/_WidgetsInTemplateMixin",
	"dojo/text!../money/numberpicker.html","dojox/mobile/Pane","dojox/mobile/GridLayout","dojox/mobile/TextBox"
    ],
    function(declare,registry,on, _WidgetBase, arrayUtil,lang, _TemplatedMixin, _WidgetsInTemplateMixin, template) {
        // Return the declared class!
        return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
			templateString: template,
			constructor: function(){
				//this.nls = nls
				//console.log(nls)
				//window.AppData.numberPicker = this
								
			},
			type: 'e',
			 _onDoneCallbackRegistry: [{
				fn: function(value){
					console.log("edited", value)
                },
                scope: window
            }],
			mode: "t",
			startup: function() {
				this.inherited(arguments);
				this.amount = registry.byId('amount-input')
			},
			show: function(){
				if(window.AppData.details && window.AppData.details.transaction && window.AppData.details.transaction.type)
					this.type = window.AppData.details.transaction.type
				if(this.mode == "t" ) this.amount.set('value',getNumber(Math.abs(window.AppData.details.transaction.amount)))
				else if(this.mode == "a" ) this.amount.set('value',getNumber(Math.abs(window.AppData.objAccounts.account.startAmount)))
				registry.byId('customPicker').show('amount', ['below-centered','above-centered','after','before'])
			},
			done: function(){
				this.amountV = registry.byId('amount-input').get('value')
				var val = ((this.type == "e") ? -this.amountV: this.amountV)
				//this.amountBtn.set("label",localeCurrency.format(val, {currency: window.AppCommonData.currency}));
				registry.byId('customPicker').hide()
				return val
			},
			onDone: function(){
				var self = window.AppData.numberPicker
				console.log(this._onDoneCallbackRegistry)
					arrayUtil.forEach(this._onDoneCallbackRegistry, function(c){                    
						if(lang.isFunction(c.fn) && self.mode == c.mode){
							var exec = lang.hitch(c.scope,c.fn,self.done());
							exec();
						}
					});
				
			},
			key: function(code, btn){
				console.log(code, this)
				
				/*if(btn){
					btn.set('disabled',true)
					setTimeout(function(){
						btn.set('disabled',false)
					},50)
				}*/
				var self = window.AppData.numberPicker
				//window.AppCommonData.detailsView.amount = registry.byId('amount-input')
				var val = self.amount.get('value');
				newval = val.substr(0,val.indexOf('.')) + val.substr(val.indexOf('.')+1,val.length)
				if(code == "dz"){
					self.key('0');this.key('0');
					return
				}else if(code == 'c'){
					newval = newval.substr(0, newval.length - 1)
					if(newval.length < 3)
						newval = '0'+ newval.toString()
					}else{
							var newval = newval+code.toString();
							if(newval.substr(0,1) == '0'){
								newval = newval.substr(1,newval.length-1)
							}							
						}
				newval = newval.substr(0,newval.length-2) + '.' + newval.substr(-2) 
				self.amount.set('value',newval)				
			},
		})
	}
);
