var profile = {
     
	"action" : "release",
	"releaseDir" : "finance-release",
     
	"stripConsole" : "normal",
	"copyTests" : false,
	"cssOptimize" : "comments.keepLines",
	"mini" : false,
	'selectorEngine': "lite",
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
                
                "dojo/_base/fx", 
                "dojo/_base/window",
                "dojo/json",
                
                "dojox/mobile/Heading",
				"dojox/mobile/ScrollableView",
				"dojox/mobile/ScrollablePane",
				'dojox/mobile/deviceTheme',
				
				"dojox/mobile/ToolBarButton",
				"dijit/_WidgetBase",
				"dijit/_WidgetsInTemplateMixin", 
				"dijit/registry",
				"dijit/_TemplatedMixin",
				"dojox/mobile/Opener",
				
				"dojox/mobile/FormLayout",
				"dojox/mobile/TabBar",
				"dojox/mobile/TabBarButton",
				"dojox/mobile/GridLayout",
				"dojox/mobile/TextBox",
				"dojox/mobile/SpinWheelDatePicker",
				"dojox/mobile/TextArea",
				"dojox/mobile/Button",
				"dojox/mobile/ContentPane",
				"dojox/mobile/RoundRectStoreList",
                "dojox/app/widgets/Container",
                "dojox/mobile/EdgeToEdgeCategory",
                "dojox/mobile/RoundRectCategory",
				"dojox/mobile/EdgeToEdgeList",
				"dojox/mobile/EdgeToEdgeStoreList",
				"dojox/mobile/RoundRect",
				"dojox/mobile/ExpandingTextArea",
				"dojox/app/widgets/Container",
				"dojox/mobile/Tooltip", 
				"dojox/mobile/Switch"
				
            ]
        },
        "money/money-app": {
			includeLocales: [ 'en-us','ru-ru' ],            
            include: [
				"money/nls/app.nls",
				
				"money/views/list",
				"money/nls/daily",
				
				
				"money/views/summary",
				"money/nls/summary",
				
				
				"money/views/details",
				"money/nls/details",
				
				"money/views/navigation",
				"money/nls/navigation",
				
				"money/views/tagspicker",
				"money/nls/tagspicker",
				
				"money/views/accountpicker",
				"money/nls/accountpicker",
				
				"money/views/about",
				"money/nls/about",
				
				"money/views/backup",
				"money/nls/backup",
				
				"money/views/settings",
				"money/nls/settings",
				
				"money/views/charts",
				"money/views/chartsPie",
				"money/views/chartsBar",
				"money/nls/stats",
				
				"money/views/accounts",
				"money/nls/accounts",
				
				"money/views/tags",
				"money/nls/tags",
				
				"money/views/currencypicker",
				"money/nls/currency",
				
				"money/views/timespan",
				"money/nls/timespan",
				
				"money/views/language",
				"money/nls/language",
				
				"money/views/theme",
				"money/nls/theme",
				
				"money/views/transition",
				
				"money/Application",
				"money/idb",
				"money/numberpicker",
				"money/TouchableButton",
				"money/TouchableToolBarButton",
				"money/store",
				"money/dialog",
				
				"dojox/charting/Chart", 
				"dojox/charting/themes/ThreeD",
				"dojox/charting/plot2d/Pie",
				"dojox/charting/widget/Legend",
				"dojox/mobile/Icon",
				"dojox/mobile/SimpleDialog", 
				"dojox/mobile/ProgressIndicator",
				
				"dojox/gfx/svg",
				"dojox/gfx/path",
				"dojox/gfx/canvasWithEvents",
				"dojox/gfx/canvas",
				"dojox/gfx/arc",
				"dojox/gfx/decompose",
				"dojox/gfx/bezierutils",
				
				"dojox/css3/transit",
				"dojox/css3/transition",
				
				"dojox/app/controllers/History",
				"dojox/app/View",
				"dojox/app/ViewBase"
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
