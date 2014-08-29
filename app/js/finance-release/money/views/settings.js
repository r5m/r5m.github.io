require({cache:{
'url:money/views/settings.html':"<div class=\"mblBackground\">\n    <div data-dojo-type=\"dojox/mobile/Heading\"\n        data-dojo-props=\"fixed: 'top'\">\n        <button data-dojo-type=\"money/TouchableToolBarButton\"\n            data-dojo-attach-point=\"backButton\"\n            data-dojo-props=\"arrow: 'left', target: 'navigation', transitionDir: -1, transitionOptions: { params: { id: window.AppData.currentDate }}\"\n            style=\"float:left\"\n            class=\"backButton\">${nls.menu}</button>\n\t\t</button>\n\t\t${nls.title} \n    </div>\n    <div data-dojo-type=\"money/WheelScrollableView\">\n\t\t<ul data-dojo-type=\"dojox/mobile/EdgeToEdgeList\">\n\t\t\t\n\t\t\t<li data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t${nls.myData}\n\t\t\t</li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\" \n\t\t\t\t\tdata-dojo-props='clickable:true,target:\"accounts\",label:\"${nls.accounts}\"'></li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"\n\t\t\t\t\tdata-dojo-props='clickable:true,target:\"tags\",label:\"${nls.tags}\"'></li>\t\t\t\n\t\t\t<li data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t${nls.graphics}\n\t\t\t</li>\n\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\" \n\t\t\t\tdata-dojo-props='clickable:true,target:\"transitione\",label:\"${nls.transition}\"'></li>\n\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\" \n\t\t\t\tdata-dojo-props='clickable:true,target:\"theme\",label:\"${nls.theme}\"'></li>\n\t\t\t\t\t\n\t\t\t<li data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t${nls.prefs}\n\t\t\t</li>\n\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\" \n\t\t\t\t\tdata-dojo-props='clickable:true,target:\"language\",label:\"${nls.language}\"'></li>\n\t\t\t\t\n\t\t</ul>\n    </div>\n</div>\n"}});
define("money/views/settings", [
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
