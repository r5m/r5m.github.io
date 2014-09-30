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
