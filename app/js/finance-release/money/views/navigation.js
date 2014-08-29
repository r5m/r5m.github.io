require({cache:{
'url:money/views/navigation.html':"\t<div data-dojo-type=\"dojox/app/widgets/Container\" class=\"navPane left\" id=\"main-nav\" data-dojo-attach-point=\"navOuterContainer\">\n\t\t<h1 data-app-constraint=\"top\" data-dojo-type=\"dojox/mobile/Heading\" data-dojo-props=\"label:'${nls.title}'\"></h1>\n\t\t<div data-dojo-type=\"dojox/app/widgets/Container\" data-dojo-props=\"scrollable: true, threshold:window.AppData.treshold\">\n\t\t\t<!--<h2 data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\" style=\"height: 32px;\">Navigation</h2>-->\n\t\t\t<ul data-dojo-type=\"dojox/mobile/EdgeToEdgeList\" class=\"icon-list\">\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\" data-dojo-props=\"clickable:true,label:'<i class=\\'fa-fixed fa fa-credit-card\\'></i> ${nls.transactions}',target:'summary',arrow: true\"></li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\" data-dojo-props=\"clickable:true,label:'<i class=\\'fa-fixed fa fa-bar-chart-o\\'></i> ${nls.stats}',target:'charts',url:'#charts'\"></li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\" data-dojo-props=\"clickable:true,label:'<i class=\\'fa-fixed fa fa-clock-o\\'></i> ${nls.timespan}', target: 'timespan'\"></li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\" data-dojo-props=\"clickable:true,label:'<i class=\\'fa-fixed fa fa-hdd-o\\'></i> ${nls.backup}', target: 'backup'\"></li>\n\t\t\t\t\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\" data-dojo-props=\"clickable:true,label:'<i class=\\'fa-fixed fa fa-gear\\'></i> ${nls.settings}', target:'settings'\"></li>\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\" data-dojo-props=\"clickable:true,label:'<i class=\\'fa-fixed fa fa-info\\'></i> ${nls.about}',target:'about',url:'#about'\"></li>\n\t\t\t</ul>\n\t\t</div>\n\t</div>\n"}});
define("money/views/navigation", ["dojo/dom-class","dojo/dom-style","dojo/dom-attr","dojo/dom","dojo/sniff", "dijit/registry",'dojo/text!money/views/navigation.html'],
	function(domClass, domStyle, domAttr, dom, has, registry){
	return{
		
		init: function(){
			
			if(has('isInitiallySmall')){
				domClass.remove	(this.domNode, "left");
			}
		}
	}
})
