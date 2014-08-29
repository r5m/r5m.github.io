require({cache:{
'url:money/views/transition.html':"<div class=\"mblBackground\">\n\t<div \n\t\tdata-dojo-attach-point=\"heading\"\n\t\tdata-dojo-type=\"dojox/mobile/Heading\" data-dojo-props=\"label:'${nls.animation}'\">\n\t\t<button data-dojo-type=\"dojox/mobile/ToolBarButton\"\n            data-dojo-attach-point=\"backButton\"\n            data-dojo-props=\"arrow: 'left', target: 'settings', transitionDir: -1\"\n            style=\"float:left\"\n            class=\"backButton\">${nls.back}</button>\n\t</div>\n\t<div \n\t\tdata-dojo-type=\"money/WheelScrollableView\"\n\t\tdata-dojo-props=\"threshold:window.AppData.treshold\"\n\t\tdata-dojo-attach-point=\"viewContainer\">\n\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\" \n\t\t\tdata-dojo-props=\"label:'${nls.animation}'\"></div>\n\t\t<div data-dojo-type=\"dojox/mobile/Pane\" data-dojo-props='shadow:true'>\n\t\t\t${nls.animHelp}\n\t\t</div>\n\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\" \n\t\t\tdata-dojo-props=\"label:'${nls.transition}'\"></div>\n\t\t<ul data-dojo-type=\"dojox/mobile/EdgeToEdgeList\" data-dojo-props=\"select: 'single'\">\n\t\t\t<div \n\t\t\t\tdata-dojo-attach-point=\"none\" \n\t\t\t\tdata-dojo-type=\"dojox/mobile/ListItem\" \n\t\t\t\tdata-dojo-props=\"label: 'None', checked: true\"></div>\n\t\t\t<div \n\t\t\t\tdata-dojo-attach-point=\"slide\" \n\t\t\t\tdata-dojo-type=\"dojox/mobile/ListItem\" \n\t\t\t\tdata-dojo-props=\"label: 'Slide'\"></div>\n\t\t\t<div \n\t\t\t\tdata-dojo-attach-point=\"fade\" \n\t\t\t\tdata-dojo-type=\"dojox/mobile/ListItem\" \n\t\t\t\tdata-dojo-props=\"label: 'Fade'\"></div>\n\t\t\t<div \n\t\t\t\tdata-dojo-attach-point=\"flip\" \n\t\t\t\tdata-dojo-type=\"dojox/mobile/ListItem\" \n\t\t\t\tdata-dojo-props=\"label: 'Flip'\"></div>\n\t\t\t\n\t\t</ul>\n\t\n\t</div>\t\t\t\n</div>\n"}});
define("money/views/transition", ["dojo/_base/declare","dojo/dom-class", "dojo/dom-attr","dojo/sniff",'dojo/on','dojo/text!money/views/transition.html'],
    function(declare, domClass, domAttr, has, on){
    
	return window.AppData.objAbout = {
		effects : ['none','fade','slide','flip'],
		
		beforeActivate: function(contact){
		    this.selectActiveListItem();		    
        },
        init: function(){
			var self = this		
			for(var i=0; i < this.effects.length; i++){
				(function(item){
					on(self[ self.effects[item] ], 'click', function(){
						self.setActiveListItem( self.effects[ item ] )
					})
				})(i)
			}
        },   
        selectActiveListItem: function(){
			var current = localStorage.getItem( 'transition' ) ? localStorage.getItem( 'transition' ) : 'none'
			//var current = 'none'
			console.log(current)
			this[ current ].set( 'checked' , true );
		},
		setActiveListItem: function( effect ) {
			console.log( effect )
			var current = localStorage.setItem( 'transition', effect)
			this[ effect ].set( 'checked' , true );
			location.reload();
		}   
    };
});
