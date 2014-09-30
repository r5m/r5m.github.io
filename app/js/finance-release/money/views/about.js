require({cache:{
'url:money/views/about.html':"<div class=\"mblBackground\">\n    <div data-dojo-type=\"dojox/mobile/Heading\"\n        data-dojo-props=\"fixed: 'top'\">\n        <button data-dojo-type=\"money/TouchableToolBarButton\"\n            data-dojo-attach-point=\"backButton\"\n            data-dojo-props=\"arrow: 'left', target: 'navigation', transitionDir: -1, transitionOptions: { params: { id: window.AppData.currentDate }}\"\n            class=\"left-button\">${nls.menu}</button>\n    </button>\n    ${nls.title}        \n    </div>\n    \t<div \n\t\tdata-dojo-type=\"money/WheelScrollableView\"\n\t\tdata-dojo-props=\"threshold:window.AppData.treshold\">\n\t\t\t\n\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\tR5M Finance v0.10.6 <span style=\"text-transform: lowercase\">(beta)</span>\n\t\t\t</div>\n\t\t\t\n\t\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\n\t\t\t\t${nls.r5mfIs}\t\t\t\t\n\t\t\t</div>\n\t\t\t\n\t\t\t\n\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t${nls.webSiteTitle}\n\t\t\t</div>\n\t\t\t\n\t\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\n\t\t\t\t${nls.webSite} ${nls.webSiteUrl}\n\t\t\t</div>\n\t\t\t\n\t\t\t\n\t\t\t\n\t\t\t<!--<div data-dojo-type=\"dojox/mobile/Pane\">\n\t\t\t\t<div id=\"donate-button\" style=\"margin-top:5px;\"></div>\n\t\t\t</div>-->\n\t\t\t\t\n\t\t\t\n\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t${nls.updates}\n\t\t\t</div>\n\t\t\n\t\t\t<div data-dojo-type=\"dojox/mobile/Pane\" \n\t\t\t\tdata-dojo-attach-point=\"updateStatus\">\n\t\t\t\t<span id=\"about-updates\"></span>\n\t\t\t\t<br/>${nls.updated}<span id=\"about-updated\"></span>\n\t\t\t</div>\n\t\t\t\n\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t${nls.helpUs}\n\t\t\t</div>\n\t\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\n\t\t\t\t${nls.helpAbout}\t\t\t\t\n\t\t\t</div>\n\t\t\t\n\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t${nls.eula}\n\t\t\t</div>\t\t\t\n\t\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\n\t\t\t\t${nls.asIs}\n\t\t\t</div>\n\t\t\t\n\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t${nls.privacyTitle}\n\t\t\t</div>\t\t\t\n\t\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\n\t\t\t\t${nls.privacy}\n\t\t\t</div>\n\t\t\t\n\t\t\t<div data-dojo-type=\"dojox/mobile/Pane\" style=\"display:none\">\t\n\t\t\t\t${nls.symba}\n\t\t\t</div>\n\t\t\t\n\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t${nls.thanks}\n\t\t\t</div>\n\t\t\t\n\t\t\t<ul data-dojo-type=\"dojox/mobile/EdgeToEdgeList\">\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"\n\t\t\t\t\tdata-dojo-props='rightText: \"dojotoolkit.org\"'>Dojo toolkit\t\t\t\t\t\n\t\t\t\t</li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"\n\t\t\t\t\tdata-dojo-props='rightText: \"nparashuram.com\"'>IndexedDB polyfill</li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"\n\t\t\t\t\tdata-dojo-props='rightText: \"fontawesome.io\"'>\n\t\t\t\t\tFont Awesome\t\t\t\t\t\n\t\t\t\t</li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"\n\t\t\t\t\tdata-dojo-props='rightText: \"openexchangerates.org\"'>\n\t\t\t\t\tOpen Exchange Rates\n\t\t\t\t</li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"\n\t\t\t\t\tdata-dojo-props='rightText: \"josscrowcroft.github.com/money.js\"'>\n\t\t\t\t\tMoney.js\n\t\t\t\t</li>\n\t\t\t</ul><!--\n\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">${nls.issueTitle}</div>\n\t\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\n\t\t\t\t<a class=\"mblButton mblBlueButton\" onclick=\"openNewWindow(event);\" target=\"_blank\" href=\"https://bitbucket.org/milikhin/finance/issues/new\" >${nls.issue}</a>\n\t\t\t</div>-->\n\t\t</div>\n</div>\n"}});
define("money/views/about", ["dojo/_base/declare","dojo/dom-class", "dojo/dom-attr", 'dojo/date/locale', "dojo/sniff",
	'dijit/registry','money/TouchableButton','dojo/text!money/views/about.html'],
    function(declare, domClass, domAttr, locale, has, registry, Button){
    
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
		            case 2: cacheStatus = self.nls.updating +' <b>' + parseInt( window.CACHED_FILES / 29 * 100 ) + '%</b>'; break;
		            case 1: cacheStatus = self.nls.ready + ' <button id="upd-btn" class="mblBlueButton" onclick="location.reload();">' + self.nls.apply + '</button>'; break;
		        }
		        domAttr.set('about-updates', 'innerHTML', cacheStatus)
		        if( registry.byId('upd-btn') )
					registry.byId('upd-btn').destroy();
				new Button({
					label: self.nls.apply,
					click: function(){
						location.reload();
					}
				},'upd-btn')
		        
			}
			
			checkUpdates()
		    var ci = setInterval(function(){
				checkUpdates();				
		    },1000)
		    
		    domAttr.set('about-updated', 'innerHTML', getDateStringHrWithYear( getDate(window.AppData.updated, locale), locale) )
		    /*
		    if(this.nls.donate == "ru") {
				domAttr.set('donate-button', 'innerHTML', '<form action="https://www.paypal.com/cgi-bin/webscr" method="get" target="_blank">'+
					'<input type="hidden" name="cmd" value="_s-xclick">'+
					'<input type="hidden" name="hosted_button_id" value="R8HRXYWRJZ632">'+
					'<input type="image" src="https://www.paypalobjects.com/ru_RU/RU/i/btn/btn_donateCC_LG.gif" border="0" name="submit" alt="PayPal — более безопасный и легкий способ оплаты через Интернет!">'+
					'<img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1">'+
				'</form>');
			}else {
				domAttr.set('donate-button', 'innerHTML', '<form action="https://www.paypal.com/cgi-bin/webscr" method="get" target="_blank">'+
					'<input type="hidden" name="cmd" value="_s-xclick">'+
					'<input type="hidden" name="hosted_button_id" value="3ZBTSMVVA9JLA">'+
					'<input type="image" src="https://www.paypalobjects.com/en_US/GB/i/btn/btn_donateCC_LG.gif" border="0" name="submit" alt="PayPal – The safer, easier way to pay online.">'+
					'<img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1">'+
				'</form>');
			}*/
        }        
    };
});
