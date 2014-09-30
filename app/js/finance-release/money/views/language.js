require({cache:{
'url:money/views/language.html':"<div class=\"mblBackground\">\n\t<div \n\t\tdata-dojo-attach-point=\"heading\"\n\t\tdata-dojo-type=\"dojox/mobile/Heading\" data-dojo-props=\"label:'${nls.title}'\">\n\t\t<button data-dojo-type=\"dojox/mobile/ToolBarButton\"\n            data-dojo-attach-point=\"backButton\"\n            data-dojo-props=\"arrow: 'left', target: 'settings', transitionDir: -1\"\n            class=\"left-button\">${nls.back}</button>\n\t</div>\n\t<div \n\t\tdata-dojo-type=\"money/WheelScrollableView\" data-dojo-props=\"height:'auto'\"\n\t\tdata-dojo-attach-point=\"viewContainer\">\n\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\" data-dojo-props=\"label:'${nls.language}'\"></div>\n\t\t<ul data-dojo-type=\"dojox/mobile/EdgeToEdgeList\" data-dojo-props=\"select: 'single'\">\n\t\t\t<div \n\t\t\t\tdata-dojo-attach-point=\"systemDefault\" \n\t\t\t\tdata-dojo-type=\"dojox/mobile/ListItem\" \n\t\t\t\tdata-dojo-props=\"label: '${nls.systemDefault}', checked: true\"></div>\n\t\t\t<div \n\t\t\t\tdata-dojo-attach-point=\"en-us\" \n\t\t\t\tdata-dojo-type=\"dojox/mobile/ListItem\" \n\t\t\t\tdata-dojo-props=\"label: 'English'\"></div>\n\t\t\t<div \n\t\t\t\tdata-dojo-attach-point=\"ru-ru\" \n\t\t\t\tdata-dojo-type=\"dojox/mobile/ListItem\" \n\t\t\t\tdata-dojo-props=\"label: 'Русский'\"></div>\n\t\t\t\n\t\t</ul>\n\t\n\t</div>\t\t\t\n</div>\n"}});
define("money/views/language", [
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
