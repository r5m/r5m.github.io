define(["dojo/_base/declare","dojo/dom-class", "dojo/dom-attr","dojo/sniff",'dojo/on'],
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
			var current = localStorage.setItem('transition', effect)
			this[effect].set( 'checked' , true );
		}   
    };
});
