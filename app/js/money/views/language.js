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
