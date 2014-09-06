define("money/BaseView", [
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
