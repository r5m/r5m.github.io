define(["dojo/_base/declare","dojo/dom-class", "dojo/dom-attr","dojo/sniff"],
    function(declare, domClass, domAttr, has){
    
	return window.AppData.objAbout = {
		
		beforeActivate: function(contact){
		    
        },
        init: function(){
			if(!has('isInitiallySmall'))
				domClass.add(this.backButton.domNode,'hideOnMedium hideOnLarge')
			var cacheStatus = 'Checking for update...'
		    switch(window.CACHE_STATUS){
		        case 0: cacheStatus = this.nls.latest; break;
		        case 2: cacheStatus = this.nls.updating; break;
		        case 1: cacheStatus = this.nls.ready + ' <button class="mblBlueButton" onclick="location.reload();">'+ this.nls.apply +'</button>'; break;		        
		    }
		    var self = this
		    domAttr.set(self.updateStatus.domNode, 'innerHTML', cacheStatus)
		    setInterval(function(){
				console.log(window.CACHED_FILES / 99);
		        switch(window.CACHE_STATUS){
		            case 0: cacheStatus = self.nls.latest; break;
		            case 2: cacheStatus = self.nls.updating +' <b>' + parseInt( window.CACHED_FILES / 99 * 100 ) + '%</b>'; break;
		            case 1: cacheStatus = self.nls.ready + ' <button class="mblBlueButton" onclick="location.reload();">' + self.nls.apply + '</button>'; break;		        
		        }
		        domAttr.set(self.updateStatus.domNode, 'innerHTML', cacheStatus)
		    },1000)
        }        
    };
});
