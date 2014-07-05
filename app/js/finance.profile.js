var profile = {
     
	"action" : "release",
	"releaseDir" : "finance-release",
     
	"stripConsole" : "normal",
	"copyTests" : false,
	"cssOptimize" : "comments.keepLines",
	"mini" : true,
	"webkitMobile" : true,
     
    localeList: "en-us,ru-ru",
    staticHasFeatures: {
		"dojo-v1x-i18n-Api": 1,
	},
    layers: {
        "dojo/dojo": {
			includeLocales: [ 'en-us','ru-ru' ],
            customBase: true,boot: true,
            include: [
				"dojox/app/controllers/Load",
				"dojox/app/controllers/Transition",
				"dojox/app/controllers/Layout",
                
                "dojo/_base/fx", "dojo/_base/window","dojo/json",
                
                "dojox/mobile/Heading",
				"dojox/mobile/ScrollableView","dojox/mobile/ScrollablePane",
				
				"dojox/mobile/ToolBarButton",
				"dijit/_WidgetBase","dijit/_WidgetsInTemplateMixin", "dijit/registry",
				"dijit/_TemplatedMixin","dojox/mobile/Opener",
				
				"dojox/mobile/FormLayout","dojox/mobile/TabBar","dojox/mobile/TabBarButton",
				"dojox/mobile/GridLayout","dojox/mobile/TextBox","dojox/mobile/SpinWheelDatePicker",
				"dojox/mobile/TextArea","dojox/mobile/Button","dojox/mobile/ContentPane","dojox/mobile/RoundRectStoreList",
                "dojox/app/widgets/Container","dojox/mobile/EdgeToEdgeCategory","dojox/mobile/RoundRectCategory",
				"dojox/mobile/EdgeToEdgeList","dojox/mobile/EdgeToEdgeStoreList","dojox/mobile/RoundRect","dojox/mobile/ExpandingTextArea",
				"dojox/app/widgets/Container",
				"dojox/mobile/Tooltip", "dojox/mobile/Switch"
				
            ]
        },
        "money/money-app": {
			includeLocales: [ 'en-us','ru-ru' ],            
            include: [
				"money/views/list",
				"money/views/summary",
				"money/views/details",
				"money/views/navigation",
				"money/views/tagspicker",
				"money/views/accountpicker",
				"money/views/about",
				"money/views/backup",
				"money/views/settings",
				"money/views/charts",
				"money/views/accounts",
				"money/views/tags",
				"money/views/currencypicker",
				"money/views/timespan",
			
				"money/Application",
				"money/idb",
				"money/numberpicker",
				"money/store",
				"money/dialog",
				
				"dojox/charting/Chart", "dojox/charting/themes/ThreeD","dojox/charting/plot2d/Pie","dojox/charting/widget/Legend","dojox/mobile/Icon",
				"dojox/mobile/SimpleDialog", "dojox/mobile/ProgressIndicator",
            ],
            
			
        }
    },
 
    packages: [
        { name:"dojo", location:"./dojo" },
        { name:"dijit", location:"./dijit" },
        { name:"dojox", location:"./dojox" },
        { name:"money", location:"./money" }
    ]
};
