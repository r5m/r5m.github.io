require({cache:{
'url:money/views/about.html':"<div class=\"mblBackground\">\n    <div data-dojo-type=\"dojox/mobile/Heading\"\n        data-dojo-props=\"fixed: 'top'\">\n        <button data-dojo-type=\"money/TouchableToolBarButton\"\n            data-dojo-attach-point=\"backButton\"\n            data-dojo-props=\"arrow: 'left', target: 'navigation', transitionDir: -1, transitionOptions: { params: { id: window.AppData.currentDate }}\"\n            style=\"position: absolute; left: 0\"\n            class=\"backButton\">${nls.menu}</button>\n    </button>\n    ${nls.title}        \n    </div>\n    \t<div \n\t\tdata-dojo-type=\"money/WheelScrollableView\"\n\t\tdata-dojo-props=\"threshold:window.AppData.treshold\">\n\t\t\n\t\t<div data-dojo-type=\"dojox/mobile/RoundRectCategory\">\n\t\t\tR5M Finance v0.6.14\n\t\t</div>\n\t\t<div data-dojo-type=\"dojox/mobile/RoundRect\">\n\t\t\t${nls.r5mfIs}\n\t\t</div>\n\t\t\n\t\t\n\t\t<div data-dojo-type=\"dojox/mobile/RoundRectCategory\">\n\t\t\t${nls.webSiteTitle}\n\t\t</div>\n\t\t<div data-dojo-type=\"dojox/mobile/RoundRect\">\n\t\t\t${nls.webSite} <a href=\"https://r5m.github.io\" target=\"_blank\">${nls.webSiteUrl}</a> \n\t\t</div>\n\t\t\n\t\t<div data-dojo-type=\"dojox/mobile/RoundRectCategory\">\n\t\t\t${nls.updates}\n\t\t</div>\n\t\t<div data-dojo-type=\"dojox/mobile/RoundRect\" \n\t\t\tdata-dojo-props='shadow:true' \n\t\t\tdata-dojo-attach-point=\"updateStatus\">\n\t\t\t<span id=\"about-updates\"></span>\n\t\t\t<br/>${nls.updated}<span id=\"about-updated\"></span>\n\t\t</div>\n\t\t\n\t\t<div data-dojo-type=\"dojox/mobile/RoundRect\" style=\"display:none\">\t\n\t\t\t${nls.symba}\n\t\t</div>\n\t\t<div data-dojo-type=\"dojox/mobile/RoundRectCategory\">\n\t\t\t${nls.thanks}\n\t\t</div>\n\t\t\t<ul data-dojo-type=\"dojox/mobile/RoundRectList\">\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"\n\t\t\t\t\tdata-dojo-props=''>Dojo toolkit\n\t\t\t\t\t<span style=\"float:right;color:#324F85\">dojotoolkit.org</span>\n\t\t\t\t</li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"\n\t\t\t\t\tdata-dojo-props=''>IndexedDB polyfill <span style=\"float:right;color:#324F85\">nparashuram.com</span></li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"\n\t\t\t\t\tdata-dojo-props=''>\n\t\t\t\t\tFont Awesome\n\t\t\t\t\t<span style=\"float:right;color:#324F85\">fontawesome.io</span>\n\t\t\t\t</li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"\n\t\t\t\t\tdata-dojo-props=''>\n\t\t\t\t\tOpen Exchange Rates\n\t\t\t\t\t<span style=\"float:right;color:#324F85\">openexchangerates.org</span>\n\t\t\t\t</li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"\n\t\t\t\t\tdata-dojo-props=''>\n\t\t\t\t\tMoney.js\n\t\t\t\t\t<span style=\"float:right;color:#324F85\">josscrowcroft.github.com/money.js</span>\n\t\t\t\t</li>\n\t\t\t</ul>\n\t\t\n\t\t\n    </div>\n</div>\n"}});
define("money/views/about", ["dojo/_base/declare","dojo/dom-class", "dojo/dom-attr", 'dojo/date/locale', "dojo/sniff",'dojo/text!money/views/about.html'],
    function(declare, domClass, domAttr, locale, has){
    
	return window.AppData.objAbout = {
		
		beforeActivate: function(contact){
		    
        },
        init: function(){
			if(!has('isInitiallySmall'))
				domClass.add(this.backButton.domNode,'hideOnMedium hideOnLarge')
			var cacheStatus = 'Checking for update...'
			var self = this;
		   
		    var checkUpdates = function(){
				switch(window.CACHE_STATUS){
		            case 0: cacheStatus = self.nls.latest; break;
		            case 2: cacheStatus = self.nls.updating +' <b>' + parseInt( window.CACHED_FILES / 25 * 100 ) + '%</b>'; break;
		            case 1: cacheStatus = self.nls.ready + ' <button class="mblBlueButton" onclick="location.reload();">' + self.nls.apply + '</button>'; break;
		        }
		        domAttr.set('about-updates', 'innerHTML', cacheStatus)
			}
			
			checkUpdates()
		    var ci = setInterval(function(){
				checkUpdates();				
		    },1000)
		    		    
		    domAttr.set('about-updated', 'innerHTML', getDateStringHrWithYear( getDate(window.AppData.updated, locale), locale) )
        }        
    };
});
