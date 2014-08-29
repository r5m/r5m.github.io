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
