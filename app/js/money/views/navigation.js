define(["dojo/dom-class","dojo/dom-style","dojo/dom-attr","dojo/dom","dojo/sniff", "dijit/registry"],
	function(domClass, domStyle, domAttr, dom, has, registry){
	return{
		
		init: function(){
			
			if(has('isInitiallySmall')){
				domClass.remove	(this.domNode, "left");
			}
		},
		afterActivate: function(){
			window.hideProgress()
		}
	}
})
