define(["dojo/_base/declare","dojo/dom-class", "dojo/dom-attr", 'dojo/date/locale', "dojo/sniff",
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
