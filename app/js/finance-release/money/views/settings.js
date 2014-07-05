define("money/views/settings", [
	"dojo/_base/declare","dojo/dom-class", "dojo/dom-style","dojo/dom-attr",
	"dojo/sniff", "dojo/dom-construct", "dojox/mobile/ListItem",
	"dojox/mobile/SimpleDialog", "dojox/mobile/ProgressIndicator",
	"dojo/_base/window","dojox/mobile/Button", "dojo/date/locale"
 ],
    function(declare,domClass, domStyle, domAttr,has, domConstruct, ListItem,  SimpleDialog, ProgressIndicator, win, Button, locale){
    
	return window.AppData.objSettings = {
		beforeActivate: function(contact){
			
        },
        init: function(){
			if(!window.AppData.isInitiallySmall){
				domClass.add(this.backButton.domNode,'hideOnMedium hideOnLarge')
			}
		},
		afterActivate: function(){
			window.hideProgress()
		}
		
    };
});
