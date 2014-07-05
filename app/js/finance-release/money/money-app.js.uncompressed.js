require({cache:{
'dojox/app/main':function(){
define(["require", "dojo/_base/kernel", "dojo/_base/lang", "dojo/_base/declare", "dojo/_base/config",
	"dojo/_base/window", "dojo/Evented", "dojo/Deferred", "dojo/when", "dojo/has", "dojo/on", "dojo/ready",
	"dojo/dom-construct", "dojo/dom-attr", "./utils/model", "./utils/nls", "./module/lifecycle",
	"./utils/hash", "./utils/constraints", "./utils/config"],
	function(require, kernel, lang, declare, config, win, Evented, Deferred, when, has, on, ready, domConstruct, domAttr,
			 model, nls, lifecycle, hash, constraints, configUtils){

	has.add("app-log-api", (config["app"] || {}).debugApp);

	var Application = declare(Evented, {
		constructor: function(params, node){
			lang.mixin(this, params);
			this.params = params;
			this.id = params.id;
			this.defaultView = params.defaultView;
			this.controllers = [];
			this.children = {};
			this.loadedModels = {};
			this.loadedStores = {};
			// Create a new domNode and append to body
			// Need to bind startTransition event on application domNode,
			// Because dojox/mobile/ViewController bind startTransition event on document.body
			// Make application's root domNode id unique because this id can be visited by window namespace on Chrome 18.
			this.setDomNode(domConstruct.create("div", {
				id: this.id+"_Root",
				style: "width:100%; height:100%; overflow-y:hidden; overflow-x:hidden;"
			}));
			node.appendChild(this.domNode);
		},

		createDataStore: function(params){
			// summary:
			//		Create data store instance
			//
			// params: Object
			//		data stores configuration.

			if(params.stores){
				//create stores in the configuration.
				for(var item in params.stores){
					if(item.charAt(0) !== "_"){//skip the private properties
						var type = params.stores[item].type ? params.stores[item].type : "dojo/store/Memory";
						var config = {};
						if(params.stores[item].params){
							lang.mixin(config, params.stores[item].params);
						}
						// we assume the store is here through dependencies
						try{
							var storeCtor = require(type);
						}catch(e){
							throw new Error(type+" must be listed in the dependencies");
						}
						if(config.data && lang.isString(config.data)){
							//get the object specified by string value of data property
							//cannot assign object literal or reference to data property
							//because json.ref will generate __parent to point to its parent
							//and will cause infinitive loop when creating StatefulModel.
							config.data = lang.getObject(config.data);
						}
						if(params.stores[item].observable){
							try{
								var observableCtor = require("dojo/store/Observable");
							}catch(e){
								throw new Error("dojo/store/Observable must be listed in the dependencies");
							}
							params.stores[item].store = observableCtor(new storeCtor(config));
						}else{
							params.stores[item].store = new storeCtor(config);
						}
						this.loadedStores[item] = params.stores[item].store;							
					}
				}
			}
		},

		createControllers: function(controllers){
			// summary:
			//		Create controller instance
			//
			// controllers: Array
			//		controller configuration array.
			// returns:
			//		controllerDeferred object

			if(controllers){
				var requireItems = [];
				for(var i = 0; i < controllers.length; i++){
					requireItems.push(controllers[i]);
				}

				var def = new Deferred();
				var requireSignal;
				try{
					requireSignal = require.on("error", function(error){
						if(def.isResolved() || def.isRejected()){
							return;
						}
						def.reject("load controllers error.");
						requireSignal.remove();
					});
					require(requireItems, function(){
						def.resolve.call(def, arguments);
						requireSignal.remove();
					});
				}catch(e){
					def.reject(e);
					if(requireSignal){
						requireSignal.remove();
					}
				}

				var controllerDef = new Deferred();
				when(def, lang.hitch(this, function(){
					for(var i = 0; i < arguments[0].length; i++){
						// instantiate controllers, set Application object, and perform auto binding
						this.controllers.push((new arguments[0][i](this)).bind());
					}
					controllerDef.resolve(this);
				}), function(){
					//require def error, reject loadChildDeferred
					controllerDef.reject("load controllers error.");
				});
				return controllerDef;
			}
		},

		trigger: function(event, params){
			// summary:
			//		trigger an event. Deprecated, use emit instead.
			//
			// event: String
			//		event name. The event is binded by controller.bind() method.
			// params: Object
			//		event params.
			kernel.deprecated("dojox.app.Application.trigger", "Use dojox.app.Application.emit instead", "2.0");
			this.emit(event, params);
		},

		// setup default view and Controllers and startup the default view
		start: function(){
			//
			//create application level data store
			this.createDataStore(this.params);

			// create application level data model
			var loadModelLoaderDeferred = new Deferred();
			var createPromise;
			try{
				createPromise = model(this.params.models, this, this);
			}catch(e){
				loadModelLoaderDeferred.reject(e);
				return loadModelLoaderDeferred.promise;
			}
			when(createPromise, lang.hitch(this, function(models){
				// if models is an array it comes from dojo/promise/all. Each array slot contains the same result object
				// so pick slot 0.
				this.loadedModels = lang.isArray(models)?models[0]:models;
				this.setupControllers();
				// if available load root NLS
				when(nls(this.params), lang.hitch(this, function(nls){
					if(nls){
						lang.mixin(this.nls = {}, nls);
					}
					this.startup();
				}));
			}), function(){
				loadModelLoaderDeferred.reject("load model error.")
			});
		},

		setDomNode: function(domNode){
			var oldNode = this.domNode;
			this.domNode = domNode;
			this.emit("app-domNode", {
				oldNode: oldNode,
				newNode: domNode
			});
		},

		setupControllers: function(){
			// create application controller instance
			// move set _startView operation from history module to application
			var currentHash = window.location.hash;
		//	this._startView = (((currentHash && currentHash.charAt(0) == "#") ? currentHash.substr(1) : currentHash) || this.defaultView).split('&')[0];
			this._startView = hash.getTarget(currentHash, this.defaultView);
			this._startParams = hash.getParams(currentHash);
		},

		startup: function(){
			// load controllers and views
			//
			this.selectedChildren = {};			
			var controllers = this.createControllers(this.params.controllers);
			// constraint on app
			if(this.hasOwnProperty("constraint")){
				constraints.register(this.params.constraints);
			}else{
				this.constraint = "center";
			}
			var emitLoad = function(){
				// emit "app-load" event and let controller to load view.
				this.emit("app-load", {
					viewId: this.defaultView,
					initLoad: true,
					params: this._startParams,
					callback: lang.hitch(this, function (){
						this.emit("app-transition", {
							viewId: this.defaultView,
							forceTransitionNone: true, // we want to avoid the transition on the first display for the defaultView
							opts: { params: this._startParams }
						});
						if(this.defaultView !== this._startView){
							// transition to startView. If startView==defaultView, that means initial the default view.
							this.emit("app-transition", {
								viewId: this._startView,
								opts: { params: this._startParams }
							});
						}
						this.setStatus(this.lifecycle.STARTED);
					})
				});
			};
			when(controllers, lang.hitch(this, function(){
				if(this.template){
					// emit "app-init" event so that the Load controller can initialize root view
					this.emit("app-init", {
						app: this,	// pass the app into the View so it can have easy access to app
						name: this.name,
						type: this.type,
						parent: this,
						templateString: this.templateString,
						controller: this.controller,
						callback: lang.hitch(this, function(view){
							this.setDomNode(view.domNode);
							emitLoad.call(this);
						})
					});
				}else{
					emitLoad.call(this);
				}
			}));
		}		
	});

	function generateApp(config, node){
		// summary:
		//		generate the application
		//
		// config: Object
		//		app config
		// node: domNode
		//		domNode.
		var path;

		// call configProcessHas to process any has blocks in the config
		config = configUtils.configProcessHas(config);

		if(!config.loaderConfig){
			config.loaderConfig = {};
		}
		if(!config.loaderConfig.paths){
			config.loaderConfig.paths = {};
		}
		if(!config.loaderConfig.paths["app"]){
			// Register application module path
			path = window.location.pathname;
			if(path.charAt(path.length) != "/"){
				path = path.split("/");
				path.pop();
				path = path.join("/");
			}
			config.loaderConfig.paths["app"] = path;
		}
		require(config.loaderConfig);

		if(!config.modules){
			config.modules = [];
		}
		// add dojox/app lifecycle module by default
		config.modules.push("./module/lifecycle");
		var modules = config.modules.concat(config.dependencies?config.dependencies:[]);

		if(config.template){
			path = config.template;
			if(path.indexOf("./") == 0){
				path = "app/"+path;
			}
			modules.push("dojo/text!" + path);
		}

		require(modules, function(){
			var modules = [Application];
			for(var i = 0; i < config.modules.length; i++){
				modules.push(arguments[i]);
			}

			if(config.template){
				var ext = {
					templateString: arguments[arguments.length - 1]
				}
			}
			App = declare(modules, ext);

			ready(function(){
				var app = new App(config, node || win.body());

				if(has("app-log-api")){
					app.log = function(){
						// summary:
						//		If config is set to turn on app logging, then log msg to the console
						//
						// arguments: 
						//		the message to be logged, 
						//		all but the last argument will be treated as Strings and be concatenated together, 
						//      the last argument can be an object it will be added as an argument to the console.log 						
						var msg = "";
						try{
							for(var i = 0; i < arguments.length-1; i++){
								msg = msg + arguments[i];
							}
							console.log(msg,arguments[arguments.length-1]);
						}catch(e){}
					};
				}else{
					app.log = function(){}; // noop
				}

				app.transitionToView = function(/*DomNode*/target, /*Object*/transitionOptions, /*Event?*/triggerEvent){
					// summary:
					//		A convenience function to fire the transition event to transition to the view.
					//
					// target:
					//		The DOM node that initiates the transition (for example a ListItem).
					// transitionOptions:
					//		Contains the transition options.
					// triggerEvent:
					//		The event that triggered the transition (for example a touch event on a ListItem).
					var opts = {bubbles:true, cancelable:true, detail: transitionOptions, triggerEvent: triggerEvent || null};
					on.emit(target,"startTransition", opts);
				};

				app.setStatus(app.lifecycle.STARTING);
				// Create global namespace for application.
				// The global name is application id. ie: modelApp
				var globalAppName = app.id;
				if(window[globalAppName]){
					lang.mixin(app, window[globalAppName]);
				}
				window[globalAppName] = app;
				app.start();
			});
		});
	}

	return function(config, node){
		if(!config){
			throw new Error("App Config Missing");
		}

		if(config.validate){
			require(["dojox/json/schema", "dojox/json/ref", "dojo/text!dojox/application/schema/application.json"], function(schema, appSchema){
				schema = dojox.json.ref.resolveJson(schema);
				if(schema.validate(config, appSchema)){
					generateApp(config, node);
				}
			});
		}else{
			generateApp(config, node);
		}
	}
});

},
'dojox/charting/plot2d/_PlotEvents':function(){
define(["dojo/_base/lang", "dojo/_base/array", "dojo/_base/declare", "dojo/_base/connect"], 
	function(lang, arr, declare, hub){

	return declare("dojox.charting.plot2d._PlotEvents", null, {
		constructor: function(){
			this._shapeEvents = [];
			this._eventSeries = {};
		},
		destroy: function(){
			// summary:
			//		Destroy any internal elements and event handlers.
			this.resetEvents();
			this.inherited(arguments);
		},
		plotEvent: function(o){
			// summary:
			//		Stub function for use by specific plots.
			// o: Object
			//		An object intended to represent event parameters.
		},
		raiseEvent: function(o){
			// summary:
			//		Raises events in predefined order
			// o: Object
			//		An object intended to represent event parameters.
			this.plotEvent(o);
			var t = lang.delegate(o);
			t.originalEvent = o.type;
			t.originalPlot  = o.plot;
			t.type = "onindirect";
			arr.forEach(this.chart.stack, function(plot){
				if(plot !== this && plot.plotEvent){
					t.plot = plot;
					plot.plotEvent(t);
				}
			}, this);
		},
		connect: function(object, method){
			// summary:
			//		Helper function to connect any object's method to our plotEvent.
			// object: Object
			//		The object to connect to.
			// method: String|Function
			//		The method to fire when our plotEvent is fired.
			// returns: Array
			//		The handle as returned from dojo.connect (see dojo.connect).
			this.dirty = true;
			return hub.connect(this, "plotEvent", object, method);	//	Array
		},
		events: function(){
			// summary:
			//		Find out if any event handlers have been connected to our plotEvent.
			// returns: Boolean
			//		A flag indicating that there are handlers attached.
			return !!this.plotEvent.after;
		},
		resetEvents: function(){
			// summary:
			//		Reset all events attached to our plotEvent (i.e. disconnect).
			if(this._shapeEvents.length){
				arr.forEach(this._shapeEvents, function(item){
					item.shape.disconnect(item.handle);
				});
				this._shapeEvents = [];
			}
			this.raiseEvent({type: "onplotreset", plot: this});
		},
		_connectSingleEvent: function(o, eventName){
			this._shapeEvents.push({
				shape:  o.eventMask,
				handle: o.eventMask.connect(eventName, this, function(e){
					o.type  = eventName;
					o.event = e;
					this.raiseEvent(o);
					o.event = null;
				})
			});
		},
		_connectEvents: function(o){
			if(o){
				o.chart = this.chart;
				o.plot  = this;
				o.hAxis = this.hAxis || null;
				o.vAxis = this.vAxis || null;
				o.eventMask = o.eventMask || o.shape;
				this._connectSingleEvent(o, "onmouseover");
				this._connectSingleEvent(o, "onmouseout");
				this._connectSingleEvent(o, "onclick");
			}
		},
		_reconnectEvents: function(seriesName){
			var a = this._eventSeries[seriesName];
			if(a){
				arr.forEach(a, this._connectEvents, this);
			}
		},
		fireEvent: function(seriesName, eventName, index, eventObject){
			// summary:
			//		Emulates firing an event for a given data value (specified by
			//		an index) of a given series.
			// seriesName: String
			//		Series name.
			// eventName: String
			//		Event name to emulate.
			// index: Number
			//		Valid data value index used to raise an event.
			// eventObject: Object?
			//		Optional event object. Especially useful for synthetic events.
			//		Default: null.
			var s = this._eventSeries[seriesName];
			if(s && s.length && index < s.length){
				var o = s[index];
				o.type  = eventName;
				o.event = eventObject || null;
				this.raiseEvent(o);
				o.event = null;
			}
		}
	});
});

},
'dojo/cldr/nls/number':function(){
define({ root:

//begin v1.x content
{
	"scientificFormat": "#E0",
	"currencySpacing-afterCurrency-currencyMatch": "[:^S:]",
	"infinity": "∞",
	"superscriptingExponent": "×",
	"list": ";",
	"percentSign": "%",
	"minusSign": "-",
	"currencySpacing-beforeCurrency-surroundingMatch": "[:digit:]",
	"decimalFormat-short": "000T",
	"currencySpacing-afterCurrency-insertBetween": " ",
	"nan": "NaN",
	"plusSign": "+",
	"currencySpacing-afterCurrency-surroundingMatch": "[:digit:]",
	"currencySpacing-beforeCurrency-currencyMatch": "[:^S:]",
	"currencyFormat": "¤ #,##0.00",
	"perMille": "‰",
	"group": ",",
	"percentFormat": "#,##0%",
	"decimalFormat-long": "000T",
	"decimalFormat": "#,##0.###",
	"decimal": ".",
	"currencySpacing-beforeCurrency-insertBetween": " ",
	"exponential": "E"
}
//end v1.x content
,
	"ar": true,
	"ca": true,
	"cs": true,
	"da": true,
	"de": true,
	"el": true,
	"en": true,
	"en-au": true,
	"es": true,
	"fi": true,
	"fr": true,
	"fr-ch": true,
	"he": true,
	"hu": true,
	"it": true,
	"ja": true,
	"ko": true,
	"nb": true,
	"nl": true,
	"pl": true,
	"pt": true,
	"pt-pt": true,
	"ro": true,
	"ru": true,
	"sk": true,
	"sl": true,
	"sv": true,
	"th": true,
	"tr": true,
	"zh": true,
	"zh-hant": true,
	"zh-hk": true,
	"zh-tw": true
});
},
'dojo/cldr/nls/en/number':function(){
define(
//begin v1.x content
{
	"group": ",",
	"percentSign": "%",
	"exponential": "E",
	"scientificFormat": "#E0",
	"percentFormat": "#,##0%",
	"list": ";",
	"infinity": "∞",
	"minusSign": "-",
	"decimal": ".",
	"superscriptingExponent": "×",
	"nan": "NaN",
	"perMille": "‰",
	"decimalFormat": "#,##0.###",
	"currencyFormat": "¤#,##0.00;(¤#,##0.00)",
	"plusSign": "+",
	"decimalFormat-long": "000 trillion",
	"decimalFormat-short": "000T"
}
//end v1.x content
);
},
'dojo/cldr/nls/ru/number':function(){
define(
//begin v1.x content
{
	"group": " ",
	"percentSign": "%",
	"exponential": "E",
	"scientificFormat": "#E0",
	"percentFormat": "#,##0 %",
	"list": ";",
	"infinity": "∞",
	"minusSign": "-",
	"decimal": ",",
	"superscriptingExponent": "×",
	"nan": "не число",
	"perMille": "‰",
	"decimalFormat": "#,##0.###",
	"currencyFormat": "#,##0.00 ¤",
	"plusSign": "+",
	"decimalFormat-long": "000 триллиона",
	"decimalFormat-short": "000 трлн"
}
//end v1.x content
);
},
'dojox/lang/utils':function(){
define(["..", "dojo/_base/lang"], 
  function(dojox, lang){
	var du = lang.getObject("lang.utils", true, dojox);
	
	var empty = {}, opts = Object.prototype.toString;

	var clone = function(o){
		if(o){
			switch(opts.call(o)){
				case "[object Array]":
					return o.slice(0);
				case "[object Object]":
					return lang.delegate(o);
			}
		}
		return o;
	}
	
	lang.mixin(du, {
		coerceType: function(target, source){
			// summary:
			//		Coerces one object to the type of another.
			// target: Object
			//		object, which typeof result is used to coerce "source" object.
			// source: Object
			//		object, which will be forced to change type.
			switch(typeof target){
				case "number":	return Number(eval("(" + source + ")"));
				case "string":	return String(source);
				case "boolean":	return Boolean(eval("(" + source + ")"));
			}
			return eval("(" + source + ")");
		},
		
		updateWithObject: function(target, source, conv){
			// summary:
			//		Updates an existing object in place with properties from an "source" object.
			// target: Object
			//		the "target" object to be updated
			// source: Object
			//		the "source" object, whose properties will be used to source the existed object.
			// conv: Boolean?
			//		force conversion to the original type
			if(!source){ return target; }
			for(var x in target){
				if(x in source && !(x in empty)){
					var t = target[x];
					if(t && typeof t == "object"){
						du.updateWithObject(t, source[x], conv);
					}else{
						target[x] = conv ? du.coerceType(t, source[x]) : clone(source[x]);
					}
				}
			}
			return target;	// Object
		},
	
		updateWithPattern: function(target, source, pattern, conv){
			// summary:
			//		Updates an existing object in place with properties from an "source" object.
			// target: Object
			//		the "target" object to be updated
			// source: Object
			//		the "source" object, whose properties will be used to source the existed object.
			// pattern: Object
			//		object, whose properties will be used to pull values from the "source"
			// conv: Boolean?
			//		force conversion to the original type
			if(!source || !pattern){ return target; }
			for(var x in pattern){
				if(x in source && !(x in empty)){
					target[x] = conv ? du.coerceType(pattern[x], source[x]) : clone(source[x]);
				}
			}
			return target;	// Object
		},
		
		merge: function(object, mixin){
			// summary:
			//		Merge two objects structurally, mixin properties will override object's properties.
			// object: Object
			//		original object.
			// mixin: Object
			//		additional object, which properties will override object's properties.
			if(mixin){
				var otype = opts.call(object), mtype = opts.call(mixin), t, i, l, m;
				switch(mtype){
					case "[object Array]":
						if(mtype == otype){
							t = new Array(Math.max(object.length, mixin.length));
							for(i = 0, l = t.length; i < l; ++i){
								t[i] = du.merge(object[i], mixin[i]);
							}
							return t;
						}
						return mixin.slice(0);
					case "[object Object]":
						if(mtype == otype && object){
							t = lang.delegate(object);
							for(i in mixin){
								if(i in object){
									l = object[i];
									m = mixin[i];
									if(m !== l){
										t[i] = du.merge(l, m);
									}
								}else{
									t[i] = lang.clone(mixin[i]);
								}
							}
							return t;
						}
						return lang.clone(mixin);
				}
			}
			return mixin;
		}
	});
	
	return du;
});

},
'dojox/charting/plot2d/Pie':function(){
define(["dojo/_base/lang", "dojo/_base/array" ,"dojo/_base/declare", 
		"./Base", "./_PlotEvents", "./common",
		"dojox/gfx", "dojox/gfx/matrix", "dojox/lang/functional", "dojox/lang/utils","dojo/has"],
	function(lang, arr, declare, Base, PlotEvents, dc, g, m, df, du, has){

	/*=====
	declare("dojox.charting.plot2d.__PieCtorArgs", dojox.charting.plot2d.__DefaultCtorArgs, {
		// summary:
		//		Specialized keyword arguments object for use in defining parameters on a Pie chart.
	
		// labels: Boolean?
		//		Whether or not to draw labels for each pie slice.  Default is true.
		labels:			true,
	
		// ticks: Boolean?
		//		Whether or not to draw ticks to labels within each slice. Default is false.
		ticks:			false,
	
		// fixed: Boolean?
		//		Whether a fixed precision must be applied to data values for display. Default is true.
		fixed:			true,
	
		// precision: Number?
		//		The precision at which to round data values for display. Default is 0.
		precision:		1,
	
		// labelOffset: Number?
		//		The amount in pixels by which to offset labels.  Default is 20.
		labelOffset:	20,
	
		// labelStyle: String?
		//		Options as to where to draw labels.  Values include "default", and "columns".	Default is "default".
		labelStyle:		"default",	// default/columns
		
		// omitLabels: Boolean?
		//		Whether labels of slices small to the point of not being visible are omitted.	Default false.
		omitLabels: false,
		
		// htmlLabels: Boolean?
		//		Whether or not to use HTML to render slice labels. Default is true.
		htmlLabels:		true,
	
		// radGrad: String?
		//		The type of radial gradient to use in rendering.  Default is "native".
		radGrad:        "native",
	
		// fanSize: Number?
		//		The amount for a radial gradient.  Default is 5.
		fanSize:		5,
	
		// startAngle: Number?
		//		Where to being rendering gradients in slices, in degrees.  Default is 0.
		startAngle:     0,
	
		// radius: Number?
		//		The size of the radial gradient.  Default is 0.
		radius:		0,

		// shadow: dojox.gfx.Stroke?
		//		An optional stroke to use to draw any shadows for a series on a plot.
		shadow:		{},

		// fill: dojox.gfx.Fill?
		//		Any fill to be used for elements on the plot.
		fill:		{},

		// filter: dojox.gfx.Filter?
		//		An SVG filter to be used for elements on the plot. gfx SVG renderer must be used and dojox/gfx/svgext must
		//		be required for this to work.
		filter:		{},

		// styleFunc: Function?
		//		A function that returns a styling object for the a given data item.
		styleFunc:	null
	});
	=====*/

	var FUDGE_FACTOR = 0.2; // use to overlap fans

	return declare("dojox.charting.plot2d.Pie", [Base, PlotEvents], {
		// summary:
		//		The plot that represents a typical pie chart.
		defaultParams: {
			labels:			true,
			ticks:			false,
			fixed:			true,
			precision:		1,
			labelOffset:	20,
			labelStyle:		"default",	// default/columns
			htmlLabels:		true,		// use HTML to draw labels
			radGrad:        "native",	// or "linear", or "fan"
			fanSize:		5,			// maximum fan size in degrees
			startAngle:     0			// start angle for slices in degrees
		},
		optionalParams: {
			radius:		0,
			omitLabels: false,
			// theme components
			stroke:		{},
			outline:	{},
			shadow:		{},
			fill:		{},
			filter:     {},
			styleFunc:	null,
			font:		"",
			fontColor:	"",
			labelWiring: {}
		},

		constructor: function(chart, kwArgs){
			// summary:
			//		Create a pie plot.
			this.opt = lang.clone(this.defaultParams);
			du.updateWithObject(this.opt, kwArgs);
			du.updateWithPattern(this.opt, kwArgs, this.optionalParams);
			this.axes = [];
			this.run = null;
			this.dyn = [];
			this.runFilter = []; 
		},
		clear: function(){
			// summary:
			//		Clear out all of the information tied to this plot.
			// returns: dojox/charting/plot2d/Pie
			//		A reference to this plot for functional chaining.
			this.inherited(arguments);
			this.dyn = [];
			this.run = null;
			return this;	//	dojox/charting/plot2d/Pie
		},
		setAxis: function(axis){
			// summary:
			//		Dummy method, since axes are irrelevant with a Pie chart.
			// returns: dojox/charting/plot2d/Pie
			//		The reference to this plot for functional chaining.
			return this;	//	dojox/charting/plot2d/Pie
		},
		addSeries: function(run){
			// summary:
			//		Add a series of data to this plot.
			// returns: dojox/charting/plot2d/Pie
			//		The reference to this plot for functional chaining.
			this.run = run;
			return this;	//	dojox/charting/plot2d/Pie
		},
		getSeriesStats: function(){
			// summary:
			//		Returns default stats (irrelevant for this type of plot).
			// returns: Object
			//		{hmin, hmax, vmin, vmax} min/max in both directions.
			return lang.delegate(dc.defaultStats); // Object
		},
		getRequiredColors: function(){
			// summary:
			//		Return the number of colors needed to draw this plot.
			return this.run ? this.run.data.length : 0;
		},
		render: function(dim, offsets){
			// summary:
			//		Render the plot on the chart.
			// dim: Object
			//		An object of the form { width, height }.
			// offsets: Object
			//		An object of the form { l, r, t, b }.
			// returns: dojox/charting/plot2d/Pie
			//		A reference to this plot for functional chaining.
			if(!this.dirty){ return this; }
			this.resetEvents();
			this.dirty = false;
			this._eventSeries = {};
			this.cleanGroup();
			var s = this.group, t = this.chart.theme;

			if(!this.run || !this.run.data.length){
				return this;
			}

			// calculate the geometry
			var rx = (dim.width  - offsets.l - offsets.r) / 2,
				ry = (dim.height - offsets.t - offsets.b) / 2,
				r  = Math.min(rx, ry),
				labelFont = "font" in this.opt ? this.opt.font : t.series.font,
				size,
				startAngle = m._degToRad(this.opt.startAngle),
				start = startAngle, filteredRun, slices, labels, shift, labelR,
				events = this.events();

			var run = arr.map(this.run.data, function(item, i){
				if(typeof item != "number" && item.hidden){ 
					this.runFilter.push(i); 
					item.hidden = false; 
				} 
				if(arr.some(this.runFilter, function(filter){return filter == i;})){ 
					if(typeof item == "number"){ 
						return 0; 
					}else{ 
						return {y: 0, text: item.text}; 
					} 
				}else{ 
					return item; 
				} 
			}, this);

			this.dyn = [];

			if("radius" in this.opt){
				r = this.opt.radius;
				labelR = r - this.opt.labelOffset;
			}
			var	circle = {
				cx: offsets.l + rx,
				cy: offsets.t + ry,
				r:  r
			};

			// draw shadow
			if(this.opt.shadow || t.shadow){
				var shadow = this.opt.shadow || t.shadow;
				var scircle = lang.clone(circle);
				scircle.cx += shadow.dx;
				scircle.cy += shadow.dy;
				s.createCircle(scircle).setFill(shadow.color).setStroke(shadow);
			}
			if(s.setFilter && (this.opt.filter || t.filter)){
				s.createCircle(circle).setFill(t.series.stroke).setFilter(this.opt.filter || t.filter);
			}

			if(typeof run[0] == "number"){
				filteredRun = df.map(run, "x ? Math.max(x, 0) : 0");
				if(df.every(filteredRun, "<= 0")){
					s.createCircle(circle).setStroke(t.series.stroke);
					this.dyn = arr.map(filteredRun, function(){
						return {  };
					});
					return this;
				}else{
					slices = df.map(filteredRun, "/this", df.foldl(filteredRun, "+", 0));
				 	if(this.opt.labels){
				 		labels = arr.map(slices, function(x){
							return x > 0 ? this._getLabel(x * 100) + "%" : "";
						}, this);
					}
				}
			}else{
				filteredRun = df.map(run, "x ? Math.max(x.y, 0) : 0");
				if(df.every(filteredRun, "<= 0")){
					s.createCircle(circle).setStroke(t.series.stroke);
					this.dyn = arr.map(filteredRun, function(){
						return {  };
					});
					return this;
				}else{
					slices = df.map(filteredRun, "/this", df.foldl(filteredRun, "+", 0));
					if(this.opt.labels){
						labels = arr.map(slices, function(x, i){
							if(x < 0){ return ""; }
							var v = run[i];
							return "text" in v ? v.text : this._getLabel(x * 100) + "%";
						}, this);
					}
				}
			}
			var themes = df.map(run, function(v, i){
				var tMixin = [this.opt, this.run];
				if(v !== null && typeof v != "number"){
					tMixin.push(v);
				}
				if(this.opt.styleFunc){
					tMixin.push(this.opt.styleFunc(v));
				}
				return t.next("slice", tMixin, true);
			}, this);

			if(this.opt.labels){
				size = labelFont ? g.normalizedLength(g.splitFontString(labelFont).size) : 0;
				shift = df.foldl1(df.map(labels, function(label, i){
					var font = themes[i].series.font;
					return g._base._getTextBox(label, {font: font}).w;
				}, this), "Math.max(a, b)") / 2;
				if(this.opt.labelOffset < 0){
					r = Math.min(rx - 2 * shift, ry - size) + this.opt.labelOffset;
				}
				labelR = r - this.opt.labelOffset;
			}

			// draw slices
			var eventSeries = new Array(slices.length);
			arr.some(slices, function(slice, i){
				if(slice < 0){
					// degenerated slice
					return false;	// continue
				}
				var v = run[i], theme = themes[i], specialFill, o;
				if(slice == 0){
					this.dyn.push({fill: theme.series.fill, stroke: theme.series.stroke});
					return false;
				}
				
				if(slice >= 1){
					// whole pie
					specialFill = this._plotFill(theme.series.fill, dim, offsets);
					specialFill = this._shapeFill(specialFill,
						{
							x: circle.cx - circle.r, y: circle.cy - circle.r,
							width: 2 * circle.r, height: 2 * circle.r
						});
					specialFill = this._pseudoRadialFill(specialFill, {x: circle.cx, y: circle.cy}, circle.r);
					var shape = s.createCircle(circle).setFill(specialFill).setStroke(theme.series.stroke);
					this.dyn.push({fill: specialFill, stroke: theme.series.stroke});

					if(events){
						o = {
							element: "slice",
							index:   i,
							run:     this.run,
							shape:   shape,
							x:       i,
							y:       typeof v == "number" ? v : v.y,
							cx:      circle.cx,
							cy:      circle.cy,
							cr:      r
						};
						this._connectEvents(o);
						eventSeries[i] = o;
					}

					return false;	// we continue because we want to collect null data points for legend
				}
				// calculate the geometry of the slice
				var end = start + slice * 2 * Math.PI;
				if(i + 1 == slices.length){
					end = startAngle + 2 * Math.PI;
				}
				var	step = end - start,
					x1 = circle.cx + r * Math.cos(start),
					y1 = circle.cy + r * Math.sin(start),
					x2 = circle.cx + r * Math.cos(end),
					y2 = circle.cy + r * Math.sin(end);
				// draw the slice
				var fanSize = m._degToRad(this.opt.fanSize);
				if(theme.series.fill && theme.series.fill.type === "radial" && this.opt.radGrad === "fan" && step > fanSize){
					var group = s.createGroup(), nfans = Math.ceil(step / fanSize), delta = step / nfans;
					specialFill = this._shapeFill(theme.series.fill,
						{x: circle.cx - circle.r, y: circle.cy - circle.r, width: 2 * circle.r, height: 2 * circle.r});
					for(var j = 0; j < nfans; ++j){
						var fansx = j == 0 ? x1 : circle.cx + r * Math.cos(start + (j - FUDGE_FACTOR) * delta),
							fansy = j == 0 ? y1 : circle.cy + r * Math.sin(start + (j - FUDGE_FACTOR) * delta),
							fanex = j == nfans - 1 ? x2 : circle.cx + r * Math.cos(start + (j + 1 + FUDGE_FACTOR) * delta),
							faney = j == nfans - 1 ? y2 : circle.cy + r * Math.sin(start + (j + 1 + FUDGE_FACTOR) * delta);
						group.createPath().
								moveTo(circle.cx, circle.cy).
								lineTo(fansx, fansy).
								arcTo(r, r, 0, delta > Math.PI, true, fanex, faney).
								lineTo(circle.cx, circle.cy).
								closePath().
								setFill(this._pseudoRadialFill(specialFill, {x: circle.cx, y: circle.cy}, r, start + (j + 0.5) * delta, start + (j + 0.5) * delta));
					}
					group.createPath().
						moveTo(circle.cx, circle.cy).
						lineTo(x1, y1).
						arcTo(r, r, 0, step > Math.PI, true, x2, y2).
						lineTo(circle.cx, circle.cy).
						closePath().
						setStroke(theme.series.stroke);
					shape = group;
				}else{
					shape = s.createPath().
						moveTo(circle.cx, circle.cy).
						lineTo(x1, y1).
						arcTo(r, r, 0, step > Math.PI, true, x2, y2).
						lineTo(circle.cx, circle.cy).
						closePath().
						setStroke(theme.series.stroke);
					specialFill = theme.series.fill;
					if(specialFill && specialFill.type === "radial"){
						specialFill = this._shapeFill(specialFill, {x: circle.cx - circle.r, y: circle.cy - circle.r, width: 2 * circle.r, height: 2 * circle.r});
						if(this.opt.radGrad === "linear"){
							specialFill = this._pseudoRadialFill(specialFill, {x: circle.cx, y: circle.cy}, r, start, end);
						}
					}else if(specialFill && specialFill.type === "linear"){
						specialFill = this._plotFill(specialFill, dim, offsets);
						specialFill = this._shapeFill(specialFill, shape.getBoundingBox());
					}
					shape.setFill(specialFill);
				}
				this.dyn.push({fill: specialFill, stroke: theme.series.stroke});

				if(events){
					o = {
						element: "slice",
						index:   i,
						run:     this.run,
						shape:   shape,
						x:       i,
						y:       typeof v == "number" ? v : v.y,
						cx:      circle.cx,
						cy:      circle.cy,
						cr:      r
					};
					this._connectEvents(o);
					eventSeries[i] = o;
				}

				start = end;

				return false;	// continue
			}, this);
			// draw labels
			if(this.opt.labels){
				var isRtl = has("dojo-bidi") && this.chart.isRightToLeft(); 
				if(this.opt.labelStyle == "default"){ // inside or outside based on labelOffset
					start = startAngle;
					arr.some(slices, function(slice, i){
						if(slice <= 0){
							// degenerated slice
							return false;	// continue
						}
						var theme = themes[i];
						if(slice >= 1){
							// whole pie
							this.renderLabel(s, circle.cx, circle.cy + size / 2, labels[i], theme, this.opt.labelOffset > 0);
							return true;	// stop iteration
						}
						// calculate the geometry of the slice
						var end = start + slice * 2 * Math.PI;
						if(i + 1 == slices.length){
							end = startAngle + 2 * Math.PI;
						}
						if(this.opt.omitLabels && end-start < 0.001){
							return false;	// continue
						}
						var	labelAngle = (start + end) / 2,
							x = circle.cx + labelR * Math.cos(labelAngle),
							y = circle.cy + labelR * Math.sin(labelAngle) + size / 2;
						// draw the label
						this.renderLabel(s, isRtl ? dim.width - x : x, y, labels[i], theme, this.opt.labelOffset > 0);
						start = end;
						return false;	// continue
					}, this);
				}else if(this.opt.labelStyle == "columns"){
					start = startAngle;
					var omitLabels = this.opt.omitLabels;
					//calculate label angles
					var labeledSlices = [];
					arr.forEach(slices, function(slice, i){
						var end = start + slice * 2 * Math.PI;
						if(i + 1 == slices.length){
							end = startAngle + 2 * Math.PI;
						}
						var labelAngle = (start + end) / 2;
						labeledSlices.push({
							angle: labelAngle,
							left: Math.cos(labelAngle) < 0,
							theme: themes[i],
							index: i,
							omit: omitLabels?end - start < 0.001:false
						});
						start = end;
					});
					//calculate label radius to each slice
					var labelHeight = g._base._getTextBox("a",{ font: labelFont }).h;
					this._getProperLabelRadius(labeledSlices, labelHeight, circle.r * 1.1);
					//draw label and wiring
					arr.forEach(labeledSlices, function(slice, i){
						if(!slice.omit){
							var leftColumn = circle.cx - circle.r * 2,
								rightColumn = circle.cx + circle.r * 2,
								labelWidth = g._base._getTextBox(labels[i], {font: slice.theme.series.font}).w,
								x = circle.cx + slice.labelR * Math.cos(slice.angle),
								y = circle.cy + slice.labelR * Math.sin(slice.angle),
								jointX = (slice.left) ? (leftColumn + labelWidth) : (rightColumn - labelWidth),
								labelX = (slice.left) ? leftColumn : jointX;
							var wiring = s.createPath().moveTo(circle.cx + circle.r * Math.cos(slice.angle), circle.cy + circle.r * Math.sin(slice.angle));
							if(Math.abs(slice.labelR * Math.cos(slice.angle)) < circle.r * 2 - labelWidth){
								wiring.lineTo(x, y);
							}
							wiring.lineTo(jointX, y).setStroke(slice.theme.series.labelWiring);
							this.renderLabel(s, isRtl ? dim.width - labelWidth - labelX : labelX, y, labels[i], slice.theme, false, "left");
						}
					},this);
				}
			}
			// post-process events to restore the original indexing
			var esi = 0;
			this._eventSeries[this.run.name] = df.map(run, function(v){
				return v <= 0 ? null : eventSeries[esi++];
			});
			// chart mirroring starts
			if(has("dojo-bidi")){
				this._checkOrientation(this.group, dim, offsets);
			}
			// chart mirroring ends
			return this;	//	dojox/charting/plot2d/Pie
		},
		_getProperLabelRadius: function(slices, labelHeight, minRidius){
			var leftCenterSlice, rightCenterSlice,
				leftMinSIN = 1, rightMinSIN = 1;
			if(slices.length == 1){
				slices[0].labelR = minRidius;
				return;
			}
			for(var i = 0; i < slices.length; i++){
				var tempSIN = Math.abs(Math.sin(slices[i].angle));
				if(slices[i].left){
					if(leftMinSIN >= tempSIN){
						leftMinSIN = tempSIN;
						leftCenterSlice = slices[i];
					}
				}else{
					if(rightMinSIN >= tempSIN){
						rightMinSIN = tempSIN;
						rightCenterSlice = slices[i];
					}
				}
			}
			leftCenterSlice.labelR = rightCenterSlice.labelR = minRidius;
			this._calculateLabelR(leftCenterSlice, slices, labelHeight);
			this._calculateLabelR(rightCenterSlice, slices, labelHeight);
		},
		_calculateLabelR: function(firstSlice, slices, labelHeight){
			var i = firstSlice.index,length = slices.length,
				currentLabelR = firstSlice.labelR, nextLabelR;
			while(!(slices[i%length].left ^ slices[(i+1)%length].left)){
				if(!slices[(i + 1) % length].omit){
					nextLabelR = (Math.sin(slices[i % length].angle) * currentLabelR + ((slices[i % length].left) ? (-labelHeight) : labelHeight)) /
					Math.sin(slices[(i + 1) % length].angle);
					currentLabelR = (nextLabelR < firstSlice.labelR) ? firstSlice.labelR : nextLabelR;
					slices[(i + 1) % length].labelR = currentLabelR;
				}
				i++;
			}
			i = firstSlice.index;
			var j = (i == 0)?length-1 : i - 1;
			while(!(slices[i].left ^ slices[j].left)){
				if(!slices[j].omit){
					nextLabelR = (Math.sin(slices[i].angle) * currentLabelR + ((slices[i].left) ? labelHeight : (-labelHeight))) /
					Math.sin(slices[j].angle);
					currentLabelR = (nextLabelR < firstSlice.labelR) ? firstSlice.labelR : nextLabelR;
					slices[j].labelR = currentLabelR;
				}
				i--;j--;
				i = (i < 0)?i+slices.length:i;
				j = (j < 0)?j+slices.length:j;
			}
		}
	});
});

},
'money/views/currencypicker':function(){
define(["dijit/registry","dojo/_base/array","dojo/query","dojo/sniff","dojo/dom-class", "dojox/mobile/LongListMixin", "money/WheelScrollableView"],
    function(registry, arrayUtil, query, has, domClass){
 
		return window.AppData.objCur = {
			
			beforeActivate: function(){
				
			},
			init: function(){
				var self = this
				console.log(self.params)
				arrayUtil.forEach(self.currencyPicker.getChildren(),function(_cur){
					_cur.set('checked', _cur.id == 
						(self.params.id ? (window.AppData.accountStore.get(self.params.id).maincur 
							? window.AppData.accountStore.get(self.params.id).maincur : "EUR") : "EUR") 
						? true : false)
				})
				this.done.onClick = function(){
					var cur = "", transitionOptions = {}
					if(self.params.id){
						window.AppData.objAccounts.account =
							window.AppData.accountStore.get(self.params.id)
					}
					arrayUtil.forEach(self.currencyPicker.getChildren(),function(_cur){
						if(_cur.get('checked'))
							{cur = _cur.id; return}
					})	
					if(self.params.backTo == "summary"){
						transitionOptions = {
							params: {
								currency: cur
							}
						}//window.AppData.objAccounts
					}else if(self.params.backTo == "accounts"){
						window.AppData.objAccounts.add(cur);
						window.dFinance.transitionToView(this.domNode,{
							"target": self.params.backTo , "transitionDir": -1
						});
					}else if(self.params.backTo == "details" && self.params.transaction){
						window.AppData.details.currency.set('label',cur)
						window.AppData.details.transaction.currency = cur
						console.log(window.AppData.details.currency)
						if(self.params.setCurrency){
							transitionOptions = {
								params: {
									doNotReload: true,
									id: self.params.transaction
								}
							}
						}else if(self.params.proceed)
							transitionOptions = {
								params: {
									currency: self.params.currency ? self.params.currency : "", 
									doNotReload: true,
									proceed: true,
									proceed2: true,
									currencyTo : cur
								}
							}
						else
							transitionOptions = {
								params: {
									currency: cur, 
									doNotReload: true,
									proceed: true
								}
							}
					}else if(self.params.id){
						window.AppData.objAccounts.account.currency = cur;
						//var t = window.AppData.isInitiallySmall ? 'details' : 'navigation+details'
						registry.byId("mb-"+self.params.id).set('label',cur)
						window.AppData.objAccounts.save()
					}
					window.dFinance.transitionToView(self.domNode,{
						"target": self.params.backTo , "transitionDir": -1,
						"params": transitionOptions.params
					})
					
				}
			}
		}
	}
);

},
'dojox/lang/functional/lambda':function(){
define(["../..", "dojo/_base/lang", "dojo/_base/array"], function(dojox, lang, arr){
	var df = lang.getObject("lang.functional", true, dojox);

// This module adds high-level functions and related constructs:
//	- anonymous functions built from the string

// Acknowledgements:
//	- lambda() is based on work by Oliver Steele
//		(http://osteele.com/sources/javascript/functional/functional.js)
//		which was published under MIT License

// Notes:
//	- lambda() produces functions, which after the compilation step are
//		as fast as regular JS functions (at least theoretically).

// Lambda input values:
//	- returns functions unchanged
//	- converts strings to functions
//	- converts arrays to a functional composition

	var lcache = {};

	// split() is augmented on IE6 to ensure the uniform behavior
	var split = "ab".split(/a*/).length > 1 ? String.prototype.split :
			function(sep){
				 var r = this.split.call(this, sep),
					 m = sep.exec(this);
				 if(m && m.index == 0){ r.unshift(""); }
				 return r;
			};
			
	var lambda = function(/*String*/ s){
		var args = [], sects = split.call(s, /\s*->\s*/m);
		if(sects.length > 1){
			while(sects.length){
				s = sects.pop();
				args = sects.pop().split(/\s*,\s*|\s+/m);
				if(sects.length){ sects.push("(function(" + args.join(", ") + "){ return (" + s + "); })"); }
			}
		}else if(s.match(/\b_\b/)){
			args = ["_"];
		}else{
			var l = s.match(/^\s*(?:[+*\/%&|\^\.=<>]|!=)/m),
				r = s.match(/[+\-*\/%&|\^\.=<>!]\s*$/m);
			if(l || r){
				if(l){
					args.push("$1");
					s = "$1" + s;
				}
				if(r){
					args.push("$2");
					s = s + "$2";
				}
			}else{
				// the point of the long regex below is to exclude all well-known
				// lower-case words from the list of potential arguments
				var vars = s.
					replace(/(?:\b[A-Z]|\.[a-zA-Z_$])[a-zA-Z_$\d]*|[a-zA-Z_$][a-zA-Z_$\d]*:|this|true|false|null|undefined|typeof|instanceof|in|delete|new|void|arguments|decodeURI|decodeURIComponent|encodeURI|encodeURIComponent|escape|eval|isFinite|isNaN|parseFloat|parseInt|unescape|dojo|dijit|dojox|window|document|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g, "").
					match(/([a-z_$][a-z_$\d]*)/gi) || [], t = {};
				arr.forEach(vars, function(v){
					if(!t.hasOwnProperty(v)){
						args.push(v);
						t[v] = 1;
					}
				});
			}
		}
		return {args: args, body: s};	// Object
	};

	var compose = function(/*Array*/ a){
		return a.length ?
					function(){
						var i = a.length - 1, x = df.lambda(a[i]).apply(this, arguments);
						for(--i; i >= 0; --i){ x = df.lambda(a[i]).call(this, x); }
						return x;
					}
				:
					// identity
					function(x){ return x; };
	};

	lang.mixin(df, {
		// lambda
		rawLambda: function(/*String*/ s){
			// summary:
			//		builds a function from a snippet, or array (composing),
			//		returns an object describing the function; functions are
			//		passed through unmodified.
			// description:
			//		This method is to normalize a functional representation (a
			//		text snippet) to an object that contains an array of
			//		arguments, and a body , which is used to calculate the
			//		returning value.
			return lambda(s);	// Object
		},
		buildLambda: function(/*String*/ s){
			// summary:
			//		builds a function from a snippet, returns a string, which
			//		represents the function.
			// description:
			//		This method returns a textual representation of a function
			//		built from the snippet. It is meant to be evaled in the
			//		proper context, so local variables can be pulled from the
			//		environment.
			var l = lambda(s);
			return "function(" + l.args.join(",") + "){return (" + l.body + ");}";	// String
		},
		lambda: function(/*Function|String|Array*/ s){
			// summary:
			//		builds a function from a snippet, or array (composing),
			//		returns a function object; functions are passed through
			//		unmodified.
			// description:
			//		This method is used to normalize a functional
			//		representation (a text snippet, an array, or a function) to
			//		a function object.
			if(typeof s == "function"){ return s; }
			if(s instanceof Array){ return compose(s); }
			if(lcache.hasOwnProperty(s)){ return lcache[s]; }
			var l = lambda(s);
			return lcache[s] = new Function(l.args, "return (" + l.body + ");");	// Function
		},
		clearLambdaCache: function(){
			// summary:
			//		clears internal cache of lambdas
			lcache = {};
		}
	});
	
	return df;
});

},
'dojox/lang/functional/reversed':function(){
define(["dojo/_base/lang", "dojo/_base/kernel" ,"./lambda"],
	function(lang, kernel, df){
// This module adds high-level functions and related constructs:
//	- reversed versions of array-processing functions similar to standard JS functions

// Notes:
//	- this module provides reversed versions of standard array-processing functions:
//		forEachRev, mapRev, filterRev

// Defined methods:
//	- take any valid lambda argument as the functional argument
//	- operate on dense arrays
//	- take a string as the array argument

	lang.mixin(df, {
		// JS 1.6 standard array functions, which can take a lambda as a parameter.
		// Consider using dojo._base.array functions, if you don't need the lambda support.
		filterRev: function(/*Array|String*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary:
			//		creates a new array with all elements that pass the test
			//		implemented by the provided function.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || kernel.global; f = df.lambda(f);
			var t = [], v, i = a.length - 1;
			for(; i >= 0; --i){
				v = a[i];
				if(f.call(o, v, i, a)){ t.push(v); }
			}
			return t;	// Array
		},
		forEachRev: function(/*Array|String*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary:
			//		executes a provided function once per array element.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || kernel.global; f = df.lambda(f);
			for(var i = a.length - 1; i >= 0; f.call(o, a[i], i, a), --i);
		},
		mapRev: function(/*Array|String*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary:
			//		creates a new array with the results of calling
			//		a provided function on every element in this array.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || kernel.global; f = df.lambda(f);
			var n = a.length, t = new Array(n), i = n - 1, j = 0;
			for(; i >= 0; t[j++] = f.call(o, a[i], i, a), --i);
			return t;	// Array
		},
		everyRev: function(/*Array|String*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary:
			//		tests whether all elements in the array pass the test
			//		implemented by the provided function.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || kernel.global; f = df.lambda(f);
			for(var i = a.length - 1; i >= 0; --i){
				if(!f.call(o, a[i], i, a)){
					return false;	// Boolean
				}
			}
			return true;	// Boolean
		},
		someRev: function(/*Array|String*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary:
			//		tests whether some element in the array passes the test
			//		implemented by the provided function.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || kernel.global; f = df.lambda(f);
			for(var i = a.length - 1; i >= 0; --i){
				if(f.call(o, a[i], i, a)){
					return true;	// Boolean
				}
			}
			return false;	// Boolean
		}
	});
	
	return df;
});

},
'dojo/store/util/SimpleQueryEngine':function(){
define(["../../_base/array" /*=====, "../api/Store" =====*/], function(arrayUtil /*=====, Store =====*/){

// module:
//		dojo/store/util/SimpleQueryEngine

return function(query, options){
	// summary:
	//		Simple query engine that matches using filter functions, named filter
	//		functions or objects by name-value on a query object hash
	//
	// description:
	//		The SimpleQueryEngine provides a way of getting a QueryResults through
	//		the use of a simple object hash as a filter.  The hash will be used to
	//		match properties on data objects with the corresponding value given. In
	//		other words, only exact matches will be returned.
	//
	//		This function can be used as a template for more complex query engines;
	//		for example, an engine can be created that accepts an object hash that
	//		contains filtering functions, or a string that gets evaluated, etc.
	//
	//		When creating a new dojo.store, simply set the store's queryEngine
	//		field as a reference to this function.
	//
	// query: Object
	//		An object hash with fields that may match fields of items in the store.
	//		Values in the hash will be compared by normal == operator, but regular expressions
	//		or any object that provides a test() method are also supported and can be
	//		used to match strings by more complex expressions
	//		(and then the regex's or object's test() method will be used to match values).
	//
	// options: dojo/store/api/Store.QueryOptions?
	//		An object that contains optional information such as sort, start, and count.
	//
	// returns: Function
	//		A function that caches the passed query under the field "matches".  See any
	//		of the "query" methods on dojo.stores.
	//
	// example:
	//		Define a store with a reference to this engine, and set up a query method.
	//
	//	|	var myStore = function(options){
	//	|		//	...more properties here
	//	|		this.queryEngine = SimpleQueryEngine;
	//	|		//	define our query method
	//	|		this.query = function(query, options){
	//	|			return QueryResults(this.queryEngine(query, options)(this.data));
	//	|		};
	//	|	};

	// create our matching query function
	switch(typeof query){
		default:
			throw new Error("Can not query with a " + typeof query);
		case "object": case "undefined":
			var queryObject = query;
			query = function(object){
				for(var key in queryObject){
					var required = queryObject[key];
					if(required && required.test){
						// an object can provide a test method, which makes it work with regex
						if(!required.test(object[key], object)){
							return false;
						}
					}else if(required != object[key]){
						return false;
					}
				}
				return true;
			};
			break;
		case "string":
			// named query
			if(!this[query]){
				throw new Error("No filter function " + query + " was found in store");
			}
			query = this[query];
			// fall through
		case "function":
			// fall through
	}
	function execute(array){
		// execute the whole query, first we filter
		var results = arrayUtil.filter(array, query);
		// next we sort
		var sortSet = options && options.sort;
		if(sortSet){
			results.sort(typeof sortSet == "function" ? sortSet : function(a, b){
				for(var sort, i=0; sort = sortSet[i]; i++){
					var aValue = a[sort.attribute];
					var bValue = b[sort.attribute];
					// valueOf enables proper comparison of dates
					aValue = aValue != null ? aValue.valueOf() : aValue;
					bValue = bValue != null ? bValue.valueOf() : bValue;
					if (aValue != bValue){
						return !!sort.descending == (aValue == null || aValue > bValue) ? -1 : 1;
					}
				}
				return 0;
			});
		}
		// now we paginate
		if(options && (options.start || options.count)){
			var total = results.length;
			results = results.slice(options.start || 0, (options.start || 0) + (options.count || Infinity));
			results.total = total;
		}
		return results;
	}
	execute.matches = query;
	return execute;
};

});

},
'dojox/gfx/matrix':function(){
define(["./_base","dojo/_base/lang"], 
  function(g, lang){
	var m = g.matrix = {};

	// candidates for dojox.math:
	var _degToRadCache = {};
	m._degToRad = function(degree){
		return _degToRadCache[degree] || (_degToRadCache[degree] = (Math.PI * degree / 180));
	};
	m._radToDeg = function(radian){ return radian / Math.PI * 180; };

	m.Matrix2D = function(arg){
		// summary:
		//		a 2D matrix object
		// description:
		//		Normalizes a 2D matrix-like object. If arrays is passed,
		//		all objects of the array are normalized and multiplied sequentially.
		// arg: Object
		//		a 2D matrix-like object, a number, or an array of such objects
		if(arg){
			if(typeof arg == "number"){
				this.xx = this.yy = arg;
			}else if(arg instanceof Array){
				if(arg.length > 0){
					var matrix = m.normalize(arg[0]);
					// combine matrices
					for(var i = 1; i < arg.length; ++i){
						var l = matrix, r = m.normalize(arg[i]);
						matrix = new m.Matrix2D();
						matrix.xx = l.xx * r.xx + l.xy * r.yx;
						matrix.xy = l.xx * r.xy + l.xy * r.yy;
						matrix.yx = l.yx * r.xx + l.yy * r.yx;
						matrix.yy = l.yx * r.xy + l.yy * r.yy;
						matrix.dx = l.xx * r.dx + l.xy * r.dy + l.dx;
						matrix.dy = l.yx * r.dx + l.yy * r.dy + l.dy;
					}
					lang.mixin(this, matrix);
				}
			}else{
				lang.mixin(this, arg);
			}
		}
	};

	// the default (identity) matrix, which is used to fill in missing values
	lang.extend(m.Matrix2D, {xx: 1, xy: 0, yx: 0, yy: 1, dx: 0, dy: 0});

	lang.mixin(m, {
		// summary:
		//		class constants, and methods of dojox/gfx/matrix

		// matrix constants

		// identity: dojox/gfx/matrix.Matrix2D
		//		an identity matrix constant: identity * (x, y) == (x, y)
		identity: new m.Matrix2D(),

		// flipX: dojox/gfx/matrix.Matrix2D
		//		a matrix, which reflects points at x = 0 line: flipX * (x, y) == (-x, y)
		flipX:    new m.Matrix2D({xx: -1}),

		// flipY: dojox/gfx/matrix.Matrix2D
		//		a matrix, which reflects points at y = 0 line: flipY * (x, y) == (x, -y)
		flipY:    new m.Matrix2D({yy: -1}),

		// flipXY: dojox/gfx/matrix.Matrix2D
		//		a matrix, which reflects points at the origin of coordinates: flipXY * (x, y) == (-x, -y)
		flipXY:   new m.Matrix2D({xx: -1, yy: -1}),

		// matrix creators

		translate: function(a, b){
			// summary:
			//		forms a translation matrix
			// description:
			//		The resulting matrix is used to translate (move) points by specified offsets.
			// a: Number|dojox/gfx.Point
			//		an x coordinate value, or a point-like object, which specifies offsets for both dimensions
			// b: Number?
			//		a y coordinate value
			// returns: dojox/gfx/matrix.Matrix2D
			if(arguments.length > 1){
				return new m.Matrix2D({dx: a, dy: b}); // dojox/gfx/matrix.Matrix2D
			}
			// branch
			return new m.Matrix2D({dx: a.x, dy: a.y}); // dojox/gfx/matrix.Matrix2D
		},
		scale: function(a, b){
			// summary:
			//		forms a scaling matrix
			// description:
			//		The resulting matrix is used to scale (magnify) points by specified offsets.
			// a: Number|dojox/gfx.Point
			//		a scaling factor used for the x coordinate, or
			//		a uniform scaling factor used for the both coordinates, or
			//		a point-like object, which specifies scale factors for both dimensions
			// b: Number?
			//		a scaling factor used for the y coordinate
			// returns: dojox/gfx/matrix.Matrix2D
			if(arguments.length > 1){
				return new m.Matrix2D({xx: a, yy: b}); // dojox/gfx/matrix.Matrix2D
			}
			if(typeof a == "number"){
				return new m.Matrix2D({xx: a, yy: a}); // dojox/gfx/matrix.Matrix2D
			}
			return new m.Matrix2D({xx: a.x, yy: a.y}); // dojox/gfx/matrix.Matrix2D
		},
		rotate: function(angle){
			// summary:
			//		forms a rotating matrix
			// description:
			//		The resulting matrix is used to rotate points
			//		around the origin of coordinates (0, 0) by specified angle.
			// angle: Number
			//		an angle of rotation in radians (>0 for CW)
			// returns: dojox/gfx/matrix.Matrix2D
			var c = Math.cos(angle);
			var s = Math.sin(angle);
			return new m.Matrix2D({xx: c, xy: -s, yx: s, yy: c}); // dojox/gfx/matrix.Matrix2D
		},
		rotateg: function(degree){
			// summary:
			//		forms a rotating matrix
			// description:
			//		The resulting matrix is used to rotate points
			//		around the origin of coordinates (0, 0) by specified degree.
			//		See dojox/gfx/matrix.rotate() for comparison.
			// degree: Number
			//		an angle of rotation in degrees (>0 for CW)
			// returns: dojox/gfx/matrix.Matrix2D
			return m.rotate(m._degToRad(degree)); // dojox/gfx/matrix.Matrix2D
		},
		skewX: function(angle) {
			// summary:
			//		forms an x skewing matrix
			// description:
			//		The resulting matrix is used to skew points in the x dimension
			//		around the origin of coordinates (0, 0) by specified angle.
			// angle: Number
			//		a skewing angle in radians
			// returns: dojox/gfx/matrix.Matrix2D
			return new m.Matrix2D({xy: Math.tan(angle)}); // dojox/gfx/matrix.Matrix2D
		},
		skewXg: function(degree){
			// summary:
			//		forms an x skewing matrix
			// description:
			//		The resulting matrix is used to skew points in the x dimension
			//		around the origin of coordinates (0, 0) by specified degree.
			//		See dojox/gfx/matrix.skewX() for comparison.
			// degree: Number
			//		a skewing angle in degrees
			// returns: dojox/gfx/matrix.Matrix2D
			return m.skewX(m._degToRad(degree)); // dojox/gfx/matrix.Matrix2D
		},
		skewY: function(angle){
			// summary:
			//		forms a y skewing matrix
			// description:
			//		The resulting matrix is used to skew points in the y dimension
			//		around the origin of coordinates (0, 0) by specified angle.
			// angle: Number
			//		a skewing angle in radians
			// returns: dojox/gfx/matrix.Matrix2D
			return new m.Matrix2D({yx: Math.tan(angle)}); // dojox/gfx/matrix.Matrix2D
		},
		skewYg: function(degree){
			// summary:
			//		forms a y skewing matrix
			// description:
			//		The resulting matrix is used to skew points in the y dimension
			//		around the origin of coordinates (0, 0) by specified degree.
			//		See dojox/gfx/matrix.skewY() for comparison.
			// degree: Number
			//		a skewing angle in degrees
			// returns: dojox/gfx/matrix.Matrix2D
			return m.skewY(m._degToRad(degree)); // dojox/gfx/matrix.Matrix2D
		},
		reflect: function(a, b){
			// summary:
			//		forms a reflection matrix
			// description:
			//		The resulting matrix is used to reflect points around a vector,
			//		which goes through the origin.
			// a: dojox/gfx.Point|Number
			//		a point-like object, which specifies a vector of reflection, or an X value
			// b: Number?
			//		a Y value
			// returns: dojox/gfx/matrix.Matrix2D
			if(arguments.length == 1){
				b = a.y;
				a = a.x;
			}
			// make a unit vector
			var a2 = a * a, b2 = b * b, n2 = a2 + b2, xy = 2 * a * b / n2;
			return new m.Matrix2D({xx: 2 * a2 / n2 - 1, xy: xy, yx: xy, yy: 2 * b2 / n2 - 1}); // dojox/gfx/matrix.Matrix2D
		},
		project: function(a, b){
			// summary:
			//		forms an orthogonal projection matrix
			// description:
			//		The resulting matrix is used to project points orthogonally on a vector,
			//		which goes through the origin.
			// a: dojox/gfx.Point|Number
			//		a point-like object, which specifies a vector of projection, or
			//		an x coordinate value
			// b: Number?
			//		a y coordinate value
			// returns: dojox/gfx/matrix.Matrix2D
			if(arguments.length == 1){
				b = a.y;
				a = a.x;
			}
			// make a unit vector
			var a2 = a * a, b2 = b * b, n2 = a2 + b2, xy = a * b / n2;
			return new m.Matrix2D({xx: a2 / n2, xy: xy, yx: xy, yy: b2 / n2}); // dojox/gfx/matrix.Matrix2D
		},

		// ensure matrix 2D conformance
		normalize: function(matrix){
			// summary:
			//		converts an object to a matrix, if necessary
			// description:
			//		Converts any 2D matrix-like object or an array of
			//		such objects to a valid dojox/gfx/matrix.Matrix2D object.
			// matrix: Object
			//		an object, which is converted to a matrix, if necessary
			// returns: dojox/gfx/matrix.Matrix2D
			return (matrix instanceof m.Matrix2D) ? matrix : new m.Matrix2D(matrix); // dojox/gfx/matrix.Matrix2D
		},

		// common operations

		isIdentity: function(matrix){
			// summary:
			//		returns whether the specified matrix is the identity.
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a 2D matrix object to be tested
			// returns: Boolean
			return matrix.xx == 1 && matrix.xy == 0 && matrix.yx == 0 && matrix.yy == 1 && matrix.dx == 0 && matrix.dy == 0; // Boolean
		},
		clone: function(matrix){
			// summary:
			//		creates a copy of a 2D matrix
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a 2D matrix-like object to be cloned
			// returns: dojox/gfx/matrix.Matrix2D
			var obj = new m.Matrix2D();
			for(var i in matrix){
				if(typeof(matrix[i]) == "number" && typeof(obj[i]) == "number" && obj[i] != matrix[i]) obj[i] = matrix[i];
			}
			return obj; // dojox/gfx/matrix.Matrix2D
		},
		invert: function(matrix){
			// summary:
			//		inverts a 2D matrix
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a 2D matrix-like object to be inverted
			// returns: dojox/gfx/matrix.Matrix2D
			var M = m.normalize(matrix),
				D = M.xx * M.yy - M.xy * M.yx;
				M = new m.Matrix2D({
					xx: M.yy/D, xy: -M.xy/D,
					yx: -M.yx/D, yy: M.xx/D,
					dx: (M.xy * M.dy - M.yy * M.dx) / D,
					dy: (M.yx * M.dx - M.xx * M.dy) / D
				});
			return M; // dojox/gfx/matrix.Matrix2D
		},
		_multiplyPoint: function(matrix, x, y){
			// summary:
			//		applies a matrix to a point
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a 2D matrix object to be applied
			// x: Number
			//		an x coordinate of a point
			// y: Number
			//		a y coordinate of a point
			// returns: dojox/gfx.Point
			return {x: matrix.xx * x + matrix.xy * y + matrix.dx, y: matrix.yx * x + matrix.yy * y + matrix.dy}; // dojox/gfx.Point
		},
		multiplyPoint: function(matrix, /* Number||Point */ a, /* Number? */ b){
			// summary:
			//		applies a matrix to a point
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a 2D matrix object to be applied
			// a: Number|dojox/gfx.Point
			//		an x coordinate of a point, or a point
			// b: Number?
			//		a y coordinate of a point
			// returns: dojox/gfx.Point
			var M = m.normalize(matrix);
			if(typeof a == "number" && typeof b == "number"){
				return m._multiplyPoint(M, a, b); // dojox/gfx.Point
			}
			return m._multiplyPoint(M, a.x, a.y); // dojox/gfx.Point
		},
		multiplyRectangle: function(matrix, /*Rectangle*/ rect){
			// summary:
			//		Applies a matrix to a rectangle.
			// description:
			//		The method applies the transformation on all corners of the
			//		rectangle and returns the smallest rectangle enclosing the 4 transformed
			//		points.
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a 2D matrix object to be applied.
			// rect: Rectangle
			//		the rectangle to transform.
			// returns: dojox/gfx.Rectangle
			var M = m.normalize(matrix);
			rect = rect || {x:0, y:0, width:0, height:0}; 
			if(m.isIdentity(M))
				return {x: rect.x, y: rect.y, width: rect.width, height: rect.height}; // dojo/gfx.Rectangle
			var p0 = m.multiplyPoint(M, rect.x, rect.y),
				p1 = m.multiplyPoint(M, rect.x, rect.y + rect.height),
				p2 = m.multiplyPoint(M, rect.x + rect.width, rect.y),
				p3 = m.multiplyPoint(M, rect.x + rect.width, rect.y + rect.height),
				minx = Math.min(p0.x, p1.x, p2.x, p3.x),
				miny = Math.min(p0.y, p1.y, p2.y, p3.y),
				maxx = Math.max(p0.x, p1.x, p2.x, p3.x),
				maxy = Math.max(p0.y, p1.y, p2.y, p3.y);
			return{ // dojo/gfx.Rectangle
				x: minx,
				y: miny,
				width: maxx - minx,
				height: maxy - miny
			};
		},
		multiply: function(matrix){
			// summary:
			//		combines matrices by multiplying them sequentially in the given order
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a 2D matrix-like object,
			//		all subsequent arguments are matrix-like objects too
			var M = m.normalize(matrix);
			// combine matrices
			for(var i = 1; i < arguments.length; ++i){
				var l = M, r = m.normalize(arguments[i]);
				M = new m.Matrix2D();
				M.xx = l.xx * r.xx + l.xy * r.yx;
				M.xy = l.xx * r.xy + l.xy * r.yy;
				M.yx = l.yx * r.xx + l.yy * r.yx;
				M.yy = l.yx * r.xy + l.yy * r.yy;
				M.dx = l.xx * r.dx + l.xy * r.dy + l.dx;
				M.dy = l.yx * r.dx + l.yy * r.dy + l.dy;
			}
			return M; // dojox/gfx/matrix.Matrix2D
		},

		// high level operations

		_sandwich: function(matrix, x, y){
			// summary:
			//		applies a matrix at a central point
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a 2D matrix-like object, which is applied at a central point
			// x: Number
			//		an x component of the central point
			// y: Number
			//		a y component of the central point
			return m.multiply(m.translate(x, y), matrix, m.translate(-x, -y)); // dojox/gfx/matrix.Matrix2D
		},
		scaleAt: function(a, b, c, d){
			// summary:
			//		scales a picture using a specified point as a center of scaling
			// description:
			//		Compare with dojox/gfx/matrix.scale().
			// a: Number
			//		a scaling factor used for the x coordinate, or a uniform scaling factor used for both coordinates
			// b: Number?
			//		a scaling factor used for the y coordinate
			// c: Number|Point
			//		an x component of a central point, or a central point
			// d: Number
			//		a y component of a central point
			// returns: dojox/gfx/matrix.Matrix2D
			switch(arguments.length){
				case 4:
					// a and b are scale factor components, c and d are components of a point
					return m._sandwich(m.scale(a, b), c, d); // dojox/gfx/matrix.Matrix2D
				case 3:
					if(typeof c == "number"){
						return m._sandwich(m.scale(a), b, c); // dojox/gfx/matrix.Matrix2D
					}
					return m._sandwich(m.scale(a, b), c.x, c.y); // dojox/gfx/matrix.Matrix2D
			}
			return m._sandwich(m.scale(a), b.x, b.y); // dojox/gfx/matrix.Matrix2D
		},
		rotateAt: function(angle, a, b){
			// summary:
			//		rotates a picture using a specified point as a center of rotation
			// description:
			//		Compare with dojox/gfx/matrix.rotate().
			// angle: Number
			//		an angle of rotation in radians (>0 for CW)
			// a: Number|dojox/gfx.Point
			//		an x component of a central point, or a central point
			// b: Number?
			//		a y component of a central point
			// returns: dojox/gfx/matrix.Matrix2D
			if(arguments.length > 2){
				return m._sandwich(m.rotate(angle), a, b); // dojox/gfx/matrix.Matrix2D
			}
			return m._sandwich(m.rotate(angle), a.x, a.y); // dojox/gfx/matrix.Matrix2D
		},
		rotategAt: function(degree, a, b){
			// summary:
			//		rotates a picture using a specified point as a center of rotation
			// description:
			//		Compare with dojox/gfx/matrix.rotateg().
			// degree: Number
			//		an angle of rotation in degrees (>0 for CW)
			// a: Number|dojox/gfx.Point
			//		an x component of a central point, or a central point
			// b: Number?
			//		a y component of a central point
			// returns: dojox/gfx/matrix.Matrix2D
			if(arguments.length > 2){
				return m._sandwich(m.rotateg(degree), a, b); // dojox/gfx/matrix.Matrix2D
			}
			return m._sandwich(m.rotateg(degree), a.x, a.y); // dojox/gfx/matrix.Matrix2D
		},
		skewXAt: function(angle, a, b){
			// summary:
			//		skews a picture along the x axis using a specified point as a center of skewing
			// description:
			//		Compare with dojox/gfx/matrix.skewX().
			// angle: Number
			//		a skewing angle in radians
			// a: Number|dojox/gfx.Point
			//		an x component of a central point, or a central point
			// b: Number?
			//		a y component of a central point
			// returns: dojox/gfx/matrix.Matrix2D
			if(arguments.length > 2){
				return m._sandwich(m.skewX(angle), a, b); // dojox/gfx/matrix.Matrix2D
			}
			return m._sandwich(m.skewX(angle), a.x, a.y); // dojox/gfx/matrix.Matrix2D
		},
		skewXgAt: function(degree, a, b){
			// summary:
			//		skews a picture along the x axis using a specified point as a center of skewing
			// description:
			//		Compare with dojox/gfx/matrix.skewXg().
			// degree: Number
			//		a skewing angle in degrees
			// a: Number|dojox/gfx.Point
			//		an x component of a central point, or a central point
			// b: Number?
			//		a y component of a central point
			// returns: dojox/gfx/matrix.Matrix2D
			if(arguments.length > 2){
				return m._sandwich(m.skewXg(degree), a, b); // dojox/gfx/matrix.Matrix2D
			}
			return m._sandwich(m.skewXg(degree), a.x, a.y); // dojox/gfx/matrix.Matrix2D
		},
		skewYAt: function(angle, a, b){
			// summary:
			//		skews a picture along the y axis using a specified point as a center of skewing
			// description:
			//		Compare with dojox/gfx/matrix.skewY().
			// angle: Number
			//		a skewing angle in radians
			// a: Number|dojox/gfx.Point
			//		an x component of a central point, or a central point
			// b: Number?
			//		a y component of a central point
			// returns: dojox/gfx/matrix.Matrix2D
			if(arguments.length > 2){
				return m._sandwich(m.skewY(angle), a, b); // dojox/gfx/matrix.Matrix2D
			}
			return m._sandwich(m.skewY(angle), a.x, a.y); // dojox/gfx/matrix.Matrix2D
		},
		skewYgAt: function(/* Number */ degree, /* Number||Point */ a, /* Number? */ b){
			// summary:
			//		skews a picture along the y axis using a specified point as a center of skewing
			// description:
			//		Compare with dojox/gfx/matrix.skewYg().
			// degree: Number
			//		a skewing angle in degrees
			// a: Number|dojox/gfx.Point
			//		an x component of a central point, or a central point
			// b: Number?
			//		a y component of a central point
			// returns: dojox/gfx/matrix.Matrix2D
			if(arguments.length > 2){
				return m._sandwich(m.skewYg(degree), a, b); // dojox/gfx/matrix.Matrix2D
			}
			return m._sandwich(m.skewYg(degree), a.x, a.y); // dojox/gfx/matrix.Matrix2D
		}

		//TODO: rect-to-rect mapping, scale-to-fit (isotropic and anisotropic versions)

	});
	// propagate Matrix2D up
	g.Matrix2D = m.Matrix2D;

	return m;
});



},
'money/dialog':function(){
define([
	"dojo/_base/declare",
	"dojo/_base/window",
	"dojo/dom-construct",
	"dojox/mobile/SimpleDialog",
	"dojox/mobile/ProgressIndicator",
	"dojox/mobile/Button", "dojo/dom-attr","dojox/mobile/Heading"
], function(declare, win, domConstruct, SimpleDialog, ProgressIndicator, Button, domAttr, Heading){
	return declare(null, {
		constructor: function(){
			var self = this
			this.dlg = new SimpleDialog();
			win.body().appendChild(this.dlg.domNode);
			
			//create message box
			this.titleBox = domConstruct.create("h2", {
				innerHTML: "",
				style: "margin: 0 0 10px 0;"
			}, this.dlg.domNode);
			//create message box
			this.msgBox = domConstruct.create("div", {
				'class': "mblSimpleDialogText",
				innerHTML: ""
			}, this.dlg.domNode);
			
			//create progress indicator box
			this.piBox = domConstruct.create("div", {
				'class': "mblSimpleDialogText"
			},	this.dlg.domNode);
			
			this.cancelBtn = new Button({
				'class' : "mblSimpleDialogButton mblRedButton",
				style : "margin: 0 0 10px 0;font-weight:bold;",
				innerHTML : ""
			});
			
			this.cancelBtn.onClick = 
				function(e){ self.hide() };
			
			this.cancelBtn.placeAt(this.dlg.domNode);
			
		},
		show : function(isPi, msgText, titleText, closeText, onOk){
			var self = this
			if(isPi){
				this.piIns = ProgressIndicator.getInstance();
				this.piBox.appendChild(this.piIns.domNode);
			}
			console.log(this, closeText)
			this.dlg.show();
			domAttr.set(this.titleBox,'innerHTML',titleText ? titleText : "R5M Finance")
			domAttr.set(this.msgBox,'innerHTML',msgText ? msgText : "")
			domAttr.set(this.cancelBtn.domNode,'innerHTML',closeText ? closeText : "")
			if(onOk)
				this.cancelBtn.onClick = function(){onOk(); self.hide();};
			if(isPi)
				this.piIns.start();
			this.isPi = isPi
		},
		hide : function(){
			if(this.isPi)
				this.piIns.stop();
			this.dlg.hide();
		}
	})
});

},
'dojox/app/module/lifecycle':function(){
define(["dojo/_base/declare", "dojo/topic"], function(declare, topic){
	return declare(null, {

		lifecycle: {
			UNKNOWN: 0, //unknown
			STARTING: 1, //starting
			STARTED: 2, //started
			STOPPING: 3, //stopping
			STOPPED: 4 //stopped
		},

		_status: 0, //unknown

		getStatus: function(){
			return this._status;
		},

		setStatus: function(newStatus){
			this._status = newStatus;

			// publish /app/status event.
			// application can subscribe this event to do some status change operation.
			topic.publish("/app/status", newStatus);
		}
	});
});

},
'dojox/color/_base':function(){
define(["../main", "dojo/_base/lang", "dojo/_base/Color", "dojo/colors"],
	function(dojox, lang, Color, colors){

var cx = lang.getObject("color", true, dojox);
/*===== cx = dojox.color =====*/
		
//	alias all the dojo.Color mechanisms
cx.Color=Color;
cx.blend=Color.blendColors;
cx.fromRgb=Color.fromRgb;
cx.fromHex=Color.fromHex;
cx.fromArray=Color.fromArray;
cx.fromString=Color.fromString;

//	alias the dojo.colors mechanisms
cx.greyscale=colors.makeGrey;

lang.mixin(cx,{
	fromCmy: function(/* Object|Array|int */cyan, /*int*/magenta, /*int*/yellow){
		// summary:
		//		Create a dojox.color.Color from a CMY defined color.
		//		All colors should be expressed as 0-100 (percentage)
	
		if(lang.isArray(cyan)){
			magenta=cyan[1], yellow=cyan[2], cyan=cyan[0];
		} else if(lang.isObject(cyan)){
			magenta=cyan.m, yellow=cyan.y, cyan=cyan.c;
		}
		cyan/=100, magenta/=100, yellow/=100;
	
		var r=1-cyan, g=1-magenta, b=1-yellow;
		return new Color({ r:Math.round(r*255), g:Math.round(g*255), b:Math.round(b*255) });	//	dojox.color.Color
	},
	
	fromCmyk: function(/* Object|Array|int */cyan, /*int*/magenta, /*int*/yellow, /*int*/black){
		// summary:
		//		Create a dojox.color.Color from a CMYK defined color.
		//		All colors should be expressed as 0-100 (percentage)
	
		if(lang.isArray(cyan)){
			magenta=cyan[1], yellow=cyan[2], black=cyan[3], cyan=cyan[0];
		} else if(lang.isObject(cyan)){
			magenta=cyan.m, yellow=cyan.y, black=cyan.b, cyan=cyan.c;
		}
		cyan/=100, magenta/=100, yellow/=100, black/=100;
		var r,g,b;
		r = 1-Math.min(1, cyan*(1-black)+black);
		g = 1-Math.min(1, magenta*(1-black)+black);
		b = 1-Math.min(1, yellow*(1-black)+black);
		return new Color({ r:Math.round(r*255), g:Math.round(g*255), b:Math.round(b*255) });	//	dojox.color.Color
	},
		
	fromHsl: function(/* Object|Array|int */hue, /* int */saturation, /* int */luminosity){
		// summary:
		//		Create a dojox.color.Color from an HSL defined color.
		//		hue from 0-359 (degrees), saturation and luminosity 0-100.
	
		if(lang.isArray(hue)){
			saturation=hue[1], luminosity=hue[2], hue=hue[0];
		} else if(lang.isObject(hue)){
			saturation=hue.s, luminosity=hue.l, hue=hue.h;
		}
		saturation/=100;
		luminosity/=100;
	
		while(hue<0){ hue+=360; }
		while(hue>=360){ hue-=360; }
		
		var r, g, b;
		if(hue<120){
			r=(120-hue)/60, g=hue/60, b=0;
		} else if (hue<240){
			r=0, g=(240-hue)/60, b=(hue-120)/60;
		} else {
			r=(hue-240)/60, g=0, b=(360-hue)/60;
		}
		
		r=2*saturation*Math.min(r, 1)+(1-saturation);
		g=2*saturation*Math.min(g, 1)+(1-saturation);
		b=2*saturation*Math.min(b, 1)+(1-saturation);
		if(luminosity<0.5){
			r*=luminosity, g*=luminosity, b*=luminosity;
		}else{
			r=(1-luminosity)*r+2*luminosity-1;
			g=(1-luminosity)*g+2*luminosity-1;
			b=(1-luminosity)*b+2*luminosity-1;
		}
		return new Color({ r:Math.round(r*255), g:Math.round(g*255), b:Math.round(b*255) });	//	dojox.color.Color
	}
});
	
cx.fromHsv = function(/* Object|Array|int */hue, /* int */saturation, /* int */value){
	// summary:
	//		Create a dojox.color.Color from an HSV defined color.
	//		hue from 0-359 (degrees), saturation and value 0-100.

	if(lang.isArray(hue)){
		saturation=hue[1], value=hue[2], hue=hue[0];
	} else if (lang.isObject(hue)){
		saturation=hue.s, value=hue.v, hue=hue.h;
	}
	
	if(hue==360){ hue=0; }
	saturation/=100;
	value/=100;
	
	var r, g, b;
	if(saturation==0){
		r=value, b=value, g=value;
	}else{
		var hTemp=hue/60, i=Math.floor(hTemp), f=hTemp-i;
		var p=value*(1-saturation);
		var q=value*(1-(saturation*f));
		var t=value*(1-(saturation*(1-f)));
		switch(i){
			case 0:{ r=value, g=t, b=p; break; }
			case 1:{ r=q, g=value, b=p; break; }
			case 2:{ r=p, g=value, b=t; break; }
			case 3:{ r=p, g=q, b=value; break; }
			case 4:{ r=t, g=p, b=value; break; }
			case 5:{ r=value, g=p, b=q; break; }
		}
	}
	return new Color({ r:Math.round(r*255), g:Math.round(g*255), b:Math.round(b*255) });	//	dojox.color.Color
};
lang.extend(Color,{
	toCmy: function(){
		// summary:
		//		Convert this Color to a CMY definition.
		var cyan=1-(this.r/255), magenta=1-(this.g/255), yellow=1-(this.b/255);
		return { c:Math.round(cyan*100), m:Math.round(magenta*100), y:Math.round(yellow*100) };		//	Object
	},
		
	toCmyk: function(){
		// summary:
		//		Convert this Color to a CMYK definition.
		var cyan, magenta, yellow, black;
		var r=this.r/255, g=this.g/255, b=this.b/255;
		black = Math.min(1-r, 1-g, 1-b);
		cyan = (1-r-black)/(1-black);
		magenta = (1-g-black)/(1-black);
		yellow = (1-b-black)/(1-black);
		return { c:Math.round(cyan*100), m:Math.round(magenta*100), y:Math.round(yellow*100), b:Math.round(black*100) };	//	Object
	},
		
	toHsl: function(){
		// summary:
		//		Convert this Color to an HSL definition.
		var r=this.r/255, g=this.g/255, b=this.b/255;
		var min = Math.min(r, b, g), max = Math.max(r, g, b);
		var delta = max-min;
		var h=0, s=0, l=(min+max)/2;
		if(l>0 && l<1){
			s = delta/((l<0.5)?(2*l):(2-2*l));
		}
		if(delta>0){
			if(max==r && max!=g){
				h+=(g-b)/delta;
			}
			if(max==g && max!=b){
				h+=(2+(b-r)/delta);
			}
			if(max==b && max!=r){
				h+=(4+(r-g)/delta);
			}
			h*=60;
		}
		return { h:h, s:Math.round(s*100), l:Math.round(l*100) };	//	Object
	},
	
	toHsv: function(){
		// summary:
		//		Convert this Color to an HSV definition.
		var r=this.r/255, g=this.g/255, b=this.b/255;
		var min = Math.min(r, b, g), max = Math.max(r, g, b);
		var delta = max-min;
		var h = null, s = (max==0)?0:(delta/max);
		if(s==0){
			h = 0;
		}else{
			if(r==max){
				h = 60*(g-b)/delta;
			}else if(g==max){
				h = 120 + 60*(b-r)/delta;
			}else{
				h = 240 + 60*(r-g)/delta;
			}
	
			if(h<0){ h+=360; }
		}
		return { h:h, s:Math.round(s*100), v:Math.round(max*100) };	//	Object
	}
});

return cx;
});

},
'dojox/charting/Chart':function(){
define(["../main", "dojo/_base/lang", "dojo/_base/array","dojo/_base/declare", "dojo/dom-style",
	"dojo/dom", "dojo/dom-geometry", "dojo/dom-construct","dojo/_base/Color", "dojo/sniff",
	"./Element", "./SimpleTheme", "./Series", "./axis2d/common", "dojox/gfx/shape",
	"dojox/gfx", "dojo/has!dojo-bidi?./bidi/Chart", "dojox/lang/functional", "dojox/lang/functional/fold", "dojox/lang/functional/reversed"],
	function(dojox, lang, arr, declare, domStyle,
	 		 dom, domGeom, domConstruct, Color, has,
	 		 Element, SimpleTheme, Series, common, shape,
	 		 g, BidiChart, func){
	/*=====
	var __ChartCtorArgs = {
		// summary:
		//		The keyword arguments that can be passed in a Chart constructor.
		// margins: Object?
		//		Optional margins for the chart, in the form of { l, t, r, b}.
		// stroke: dojox.gfx.Stroke?
		//		An optional outline/stroke for the chart.
		// fill: dojox.gfx.Fill?
		//		An optional fill for the chart.
		// delayInMs: Number
		//		Delay in ms for delayedRender(). Default: 200.
	};
	=====*/

	/*=====
	var __SeriesCtorArgs = {
		// summary:
		//		An optional arguments object that can be used in the Series constructor.
		// plot: String?
		//		The plot (by name) that this series belongs to.
	};
	=====*/

	/*=====
	var __BaseAxisCtorArgs = {
		// summary:
		//		Optional arguments used in the definition of an invisible axis.
		// vertical: Boolean?
		//		A flag that says whether an axis is vertical (i.e. y axis) or horizontal. Default is false (horizontal).
		// min: Number?
		//		The smallest value on an axis. Default is 0.
		// max: Number?
		//		The largest value on an axis. Default is 1.
	};
	=====*/

	var dc = lang.getObject("charting", true, dojox),
		clear = func.lambda("item.clear()"),
		purge = func.lambda("item.purgeGroup()"),
		destroy = func.lambda("item.destroy()"),
		makeClean = func.lambda("item.dirty = false"),
		makeDirty = func.lambda("item.dirty = true"),
		getName = func.lambda("item.name");

	var Chart = declare(has("dojo-bidi")? "dojox.charting.NonBidiChart" : "dojox.charting.Chart", null, {
		// summary:
		//		The main chart object in dojox.charting.  This will create a two dimensional
		//		chart based on dojox.gfx.
		//
		// description:
		//		dojox.charting.Chart is the primary object used for any kind of charts.  It
		//		is simple to create--just pass it a node reference, which is used as the
		//		container for the chart--and a set of optional keyword arguments and go.
		//
		//		Note that like most of dojox.gfx, most of dojox.charting.Chart's methods are
		//		designed to return a reference to the chart itself, to allow for functional
		//		chaining.  This makes defining everything on a Chart very easy to do.
		//
		// example:
		//		Create an area chart, with smoothing.
		//	|	require(["dojox/charting/Chart", "dojox/charting/themes/Shrooms", "dojox/charting/plot2d/Areas", ...],
		// 	|		function(Chart, Shrooms, Areas, ...){
		//	|		new Chart(node)
		//	|			.addPlot("default", { type: Areas, tension: "X" })
		//	|			.setTheme(Shrooms)
		//	|			.addSeries("Series A", [1, 2, 0.5, 1.5, 1, 2.8, 0.4])
		//	|			.addSeries("Series B", [2.6, 1.8, 2, 1, 1.4, 0.7, 2])
		//	|			.addSeries("Series C", [6.3, 1.8, 3, 0.5, 4.4, 2.7, 2])
		//	|			.render();
		//	|	});
		//
		// example:
		//		The form of data in a data series can take a number of forms: a simple array,
		//		an array of objects {x,y}, or something custom (as determined by the plot).
		//		Here's an example of a Candlestick chart, which expects an object of
		//		{ open, high, low, close }.
		//	|	require(["dojox/charting/Chart", "dojox/charting/plot2d/Candlesticks", ...],
		// 	|		function(Chart, Candlesticks, ...){
		//	|		new Chart(node)
		//	|			.addPlot("default", {type: Candlesticks, gap: 1})
		//	|			.addAxis("x", {fixLower: "major", fixUpper: "major", includeZero: true})
		//	|			.addAxis("y", {vertical: true, fixLower: "major", fixUpper: "major", natural: true})
		//	|			.addSeries("Series A", [
		//	|					{ open: 20, close: 16, high: 22, low: 8 },
		//	|					{ open: 16, close: 22, high: 26, low: 6, mid: 18 },
		//	|					{ open: 22, close: 18, high: 22, low: 11, mid: 21 },
		//	|					{ open: 18, close: 29, high: 32, low: 14, mid: 27 },
		//	|					{ open: 29, close: 24, high: 29, low: 13, mid: 27 },
		//	|					{ open: 24, close: 8, high: 24, low: 5 },
		//	|					{ open: 8, close: 16, high: 22, low: 2 },
		//	|					{ open: 16, close: 12, high: 19, low: 7 },
		//	|					{ open: 12, close: 20, high: 22, low: 8 },
		//	|					{ open: 20, close: 16, high: 22, low: 8 },
		//	|					{ open: 16, close: 22, high: 26, low: 6, mid: 18 },
		//	|					{ open: 22, close: 18, high: 22, low: 11, mid: 21 },
		//	|					{ open: 18, close: 29, high: 32, low: 14, mid: 27 },
		//	|					{ open: 29, close: 24, high: 29, low: 13, mid: 27 },
		//	|					{ open: 24, close: 8, high: 24, low: 5 },
		//	|					{ open: 8, close: 16, high: 22, low: 2 },
		//	|					{ open: 16, close: 12, high: 19, low: 7 },
		//	|					{ open: 12, close: 20, high: 22, low: 8 },
		//	|					{ open: 20, close: 16, high: 22, low: 8 },
		//	|					{ open: 16, close: 22, high: 26, low: 6 },
		//	|					{ open: 22, close: 18, high: 22, low: 11 },
		//	|					{ open: 18, close: 29, high: 32, low: 14 },
		//	|					{ open: 29, close: 24, high: 29, low: 13 },
		//	|					{ open: 24, close: 8, high: 24, low: 5 },
		//	|					{ open: 8, close: 16, high: 22, low: 2 },
		//	|					{ open: 16, close: 12, high: 19, low: 7 },
		//	|					{ open: 12, close: 20, high: 22, low: 8 },
		//	|					{ open: 20, close: 16, high: 22, low: 8 }
		//	|				],
		//	|				{ stroke: { color: "green" }, fill: "lightgreen" }
		//	|			)
		//	|			.render();
		//	|	});
		
		// theme: dojox/charting/SimpleTheme?
		//		An optional theme to use for styling the chart.
		// axes: dojox/charting/axis2d/Base{}?
		//		A map of axes for use in plotting a chart.
		// stack: dojox/charting/plot2d/Base[]
		//		A stack of plotters.
		// plots: dojox/charting/plot2d/Base{}
		//		A map of plotter indices
		// series: dojox/charting/Series[]
		//		The stack of data runs used to create plots.
		// runs: dojox/charting/Series{}
		//		A map of series indices
		// margins: Object?
		//		The margins around the chart. Default is { l:10, t:10, r:10, b:10 }.
		// stroke: dojox.gfx.Stroke?
		//		The outline of the chart (stroke in vector graphics terms).
		// fill: dojox.gfx.Fill?
		//		The color for the chart.
		// node: DOMNode
		//		The container node passed to the constructor.
		// surface: dojox/gfx/shape.Surface
		//		The main graphics surface upon which a chart is drawn.
		// dirty: Boolean
		//		A boolean flag indicating whether or not the chart needs to be updated/re-rendered.
		// htmlLabels: Boolean
		//		A boolean flag indicating whether or not it should try to use HTML-based labels for the title or not.
		//		The default is true.  The only caveat is IE and Opera browsers will always use GFX-based labels.

		constructor: function(/* DOMNode */node, /* __ChartCtorArgs? */kwArgs){
			// summary:
			//		The constructor for a new Chart.  Initializes all parameters used for a chart.
			// returns: dojox/charting/Chart
			//		The newly created chart.

			// initialize parameters
			if(!kwArgs){ kwArgs = {}; }
			this.margins   = kwArgs.margins ? kwArgs.margins : {l: 10, t: 10, r: 10, b: 10};
			this.stroke    = kwArgs.stroke;
			this.fill      = kwArgs.fill;
			this.delayInMs = kwArgs.delayInMs || 200;
			this.title     = kwArgs.title;
			this.titleGap  = kwArgs.titleGap;
			this.titlePos  = kwArgs.titlePos;
			this.titleFont = kwArgs.titleFont;
			this.titleFontColor = kwArgs.titleFontColor;
			this.chartTitle = null;
			this.htmlLabels = true;
			if("htmlLabels" in kwArgs){
				this.htmlLabels = kwArgs.htmlLabels;
			}

			// default initialization
			this.theme = null;
			this.axes = {};		// map of axes
			this.stack = [];	// stack of plotters
			this.plots = {};	// map of plotter indices
			this.series = [];	// stack of data runs
			this.runs = {};		// map of data run indices
			this.dirty = true;

			// create a surface
			this.node = dom.byId(node);
			var box = domGeom.getMarginBox(node);
			this.surface = g.createSurface(this.node, box.w || 400, box.h || 300);
			if(this.surface.declaredClass.indexOf("vml") == -1){
				// except if vml use native clipping
				this._nativeClip = true;
			}
		},
		destroy: function(){
			// summary:
			//		Cleanup when a chart is to be destroyed.
			// returns: void
			arr.forEach(this.series, destroy);
			arr.forEach(this.stack,  destroy);
			func.forIn(this.axes, destroy);
			this.surface.destroy();
			if(this.chartTitle && this.chartTitle.tagName){
				// destroy title if it is a DOM node
				domConstruct.destroy(this.chartTitle);
			}
		},
		getCoords: function(){
			// summary:
			//		Get the coordinates and dimensions of the containing DOMNode, as
			//		returned by dojo.coords.
			// returns: Object
			//		The resulting coordinates of the chart.  See dojo.coords for details.
			var node = this.node;
			var s = domStyle.getComputedStyle(node), coords = domGeom.getMarginBox(node, s);
			var abs = domGeom.position(node, true);
			coords.x = abs.x;
			coords.y = abs.y;
			return coords;	//	Object
		},
		setTheme: function(theme){
			// summary:
			//		Set a theme of the chart.
			// theme: dojox/charting/SimpleTheme
			//		The theme to be used for visual rendering.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			this.theme = theme.clone();
			this.dirty = true;
			return this;	//	dojox/charting/Chart
		},
		addAxis: function(name, kwArgs){
			// summary:
			//		Add an axis to the chart, for rendering.
			// name: String
			//		The name of the axis.
			// kwArgs: __BaseAxisCtorArgs?
			//		An optional keyword arguments object for use in defining details of an axis.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			var axis, axisType = kwArgs && kwArgs.type || "Default";
			if(typeof axisType == "string"){
				if(!dc.axis2d || !dc.axis2d[axisType]){
					throw Error("Can't find axis: " + axisType + " - Check " + "require() dependencies.");
				}
				axis = new dc.axis2d[axisType](this, kwArgs);
			}else{
				axis = new axisType(this, kwArgs);
			}
			axis.name = name;
			axis.dirty = true;
			if(name in this.axes){
				this.axes[name].destroy();
			}
			this.axes[name] = axis;
			this.dirty = true;
			return this;	//	dojox/charting/Chart
		},
		getAxis: function(name){
			// summary:
			//		Get the given axis, by name.
			// name: String
			//		The name the axis was defined by.
			// returns: dojox/charting/axis2d/Default
			//		The axis as stored in the chart's axis map.
			return this.axes[name];	//	dojox/charting/axis2d/Default
		},
		removeAxis: function(name){
			// summary:
			//		Remove the axis that was defined using name.
			// name: String
			//		The axis name, as defined in addAxis.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			if(name in this.axes){
				// destroy the axis
				this.axes[name].destroy();
				delete this.axes[name];
				// mark the chart as dirty
				this.dirty = true;
			}
			return this;	//	dojox/charting/Chart
		},
		addPlot: function(name, kwArgs){
			// summary:
			//		Add a new plot to the chart, defined by name and using the optional keyword arguments object.
			//		Note that dojox.charting assumes the main plot to be called "default"; if you do not have
			//		a plot called "default" and attempt to add data series to the chart without specifying the
			//		plot to be rendered on, you WILL get errors.
			// name: String
			//		The name of the plot to be added to the chart.  If you only plan on using one plot, call it "default".
			// kwArgs: dojox.charting.plot2d.__PlotCtorArgs
			//		An object with optional parameters for the plot in question.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			var plot, plotType = kwArgs && kwArgs.type || "Default";
			if(typeof plotType == "string"){
				if(!dc.plot2d || !dc.plot2d[plotType]){
					throw Error("Can't find plot: " + plotType + " - didn't you forget to dojo" + ".require() it?");
				}
				plot = new dc.plot2d[plotType](this, kwArgs);
			}else{
				plot = new plotType(this, kwArgs);
			}
			plot.name = name;
			plot.dirty = true;
			if(name in this.plots){
				this.stack[this.plots[name]].destroy();
				this.stack[this.plots[name]] = plot;
			}else{
				this.plots[name] = this.stack.length;
				this.stack.push(plot);
			}
			this.dirty = true;
			return this;	//	dojox/charting/Chart
		},
		getPlot: function(name){
			// summary:
			//		Get the given plot, by name.
			// name: String
			//		The name the plot was defined by.
			// returns: dojox/charting/plot2d/Base
			//		The plot.
			return this.stack[this.plots[name]];
		},
		removePlot: function(name){
			// summary:
			//		Remove the plot defined using name from the chart's plot stack.
			// name: String
			//		The name of the plot as defined using addPlot.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			if(name in this.plots){
				// get the index and remove the name
				var index = this.plots[name];
				delete this.plots[name];
				// destroy the plot
				this.stack[index].destroy();
				// remove the plot from the stack
				this.stack.splice(index, 1);
				// update indices to reflect the shift
				func.forIn(this.plots, function(idx, name, plots){
					if(idx > index){
						plots[name] = idx - 1;
					}
				});
				// remove all related series
				var ns = arr.filter(this.series, function(run){ return run.plot != name; });
				if(ns.length < this.series.length){
					// kill all removed series
					arr.forEach(this.series, function(run){
						if(run.plot == name){
							run.destroy();
						}
					});
					// rebuild all necessary data structures
					this.runs = {};
					arr.forEach(ns, function(run, index){
						this.runs[run.plot] = index;
					}, this);
					this.series = ns;
				}
				// mark the chart as dirty
				this.dirty = true;
			}
			return this;	//	dojox/charting/Chart
		},
		getPlotOrder: function(){
			// summary:
			//		Returns an array of plot names in the current order
			//		(the top-most plot is the first).
			// returns: Array
			return func.map(this.stack, getName); // Array
		},
		setPlotOrder: function(newOrder){
			// summary:
			//		Sets new order of plots. newOrder cannot add or remove
			//		plots. Wrong names, or dups are ignored.
			// newOrder: Array
			//		Array of plot names compatible with getPlotOrder().
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			var names = {},
				order = func.filter(newOrder, function(name){
					if(!(name in this.plots) || (name in names)){
						return false;
					}
					names[name] = 1;
					return true;
				}, this);
			if(order.length < this.stack.length){
				func.forEach(this.stack, function(plot){
					var name = plot.name;
					if(!(name in names)){
						order.push(name);
					}
				});
			}
			var newStack = func.map(order, function(name){
					return this.stack[this.plots[name]];
				}, this);
			func.forEach(newStack, function(plot, i){
				this.plots[plot.name] = i;
			}, this);
			this.stack = newStack;
			this.dirty = true;
			return this;	//	dojox/charting/Chart
		},
		movePlotToFront: function(name){
			// summary:
			//		Moves a given plot to front.
			// name: String
			//		Plot's name to move.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			if(name in this.plots){
				var index = this.plots[name];
				if(index){
					var newOrder = this.getPlotOrder();
					newOrder.splice(index, 1);
					newOrder.unshift(name);
					return this.setPlotOrder(newOrder);	//	dojox/charting/Chart
				}
			}
			return this;	//	dojox/charting/Chart
		},
		movePlotToBack: function(name){
			// summary:
			//		Moves a given plot to back.
			// name: String
			//		Plot's name to move.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			if(name in this.plots){
				var index = this.plots[name];
				if(index < this.stack.length - 1){
					var newOrder = this.getPlotOrder();
					newOrder.splice(index, 1);
					newOrder.push(name);
					return this.setPlotOrder(newOrder);	//	dojox/charting/Chart
				}
			}
			return this;	//	dojox/charting/Chart
		},
		addSeries: function(name, data, kwArgs){
			// summary:
			//		Add a data series to the chart for rendering.
			// name: String
			//		The name of the data series to be plotted.
			// data: Array|Object
			//		The array of data points (either numbers or objects) that
			//		represents the data to be drawn. Or it can be an object. In
			//		the latter case, it should have a property "data" (an array),
			//		destroy(), and setSeriesObject().
			// kwArgs: __SeriesCtorArgs?
			//		An optional keyword arguments object that will be mixed into
			//		the resultant series object.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			var run = new Series(this, data, kwArgs);
			run.name = name;
			if(name in this.runs){
				this.series[this.runs[name]].destroy();
				this.series[this.runs[name]] = run;
			}else{
				this.runs[name] = this.series.length;
				this.series.push(run);
			}
			this.dirty = true;
			// fix min/max
			if(!("ymin" in run) && "min" in run){ run.ymin = run.min; }
			if(!("ymax" in run) && "max" in run){ run.ymax = run.max; }
			return this;	//	dojox/charting/Chart
		},
		getSeries: function(name){
			// summary:
			//		Get the given series, by name.
			// name: String
			//		The name the series was defined by.
			// returns: dojox/charting/Series
			//		The series.
			return this.series[this.runs[name]];
		},
		removeSeries: function(name){
			// summary:
			//		Remove the series defined by name from the chart.
			// name: String
			//		The name of the series as defined by addSeries.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			if(name in this.runs){
				// get the index and remove the name
				var index = this.runs[name];
				delete this.runs[name];
				// destroy the run
				this.series[index].destroy();
				// remove the run from the stack of series
				this.series.splice(index, 1);
				// update indices to reflect the shift
				func.forIn(this.runs, function(idx, name, runs){
					if(idx > index){
						runs[name] = idx - 1;
					}
				});
				this.dirty = true;
			}
			return this;	//	dojox/charting/Chart
		},
		updateSeries: function(name, data, offsets){
			// summary:
			//		Update the given series with a new set of data points.
			// name: String
			//		The name of the series as defined in addSeries.
			// data: Array|Object
			//		The array of data points (either numbers or objects) that
			//		represents the data to be drawn. Or it can be an object. In
			//		the latter case, it should have a property "data" (an array),
			//		destroy(), and setSeriesObject().
			// offsets: Boolean?
			//		If true recomputes the offsets of the chart based on the new
			//		data. This is useful if the range of data is drastically changing
			//		and offsets need to be recomputed.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			if(name in this.runs){
				var run = this.series[this.runs[name]];
				run.update(data);
				if(offsets){
					this.dirty = true;
				}else{
					this._invalidateDependentPlots(run.plot, false);
					this._invalidateDependentPlots(run.plot, true);
				}
			}
			return this;	//	dojox/charting/Chart
		},
		getSeriesOrder: function(plotName){
			// summary:
			//		Returns an array of series names in the current order
			//		(the top-most series is the first) within a plot.
			// plotName: String
			//		Plot's name.
			// returns: Array
			return func.map(func.filter(this.series, function(run){
					return run.plot == plotName;
				}), getName);
		},
		setSeriesOrder: function(newOrder){
			// summary:
			//		Sets new order of series within a plot. newOrder cannot add
			//		or remove series. Wrong names, or dups are ignored.
			// newOrder: Array
			//		Array of series names compatible with getPlotOrder(). All
			//		series should belong to the same plot.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			var plotName, names = {},
				order = func.filter(newOrder, function(name){
					if(!(name in this.runs) || (name in names)){
						return false;
					}
					var run = this.series[this.runs[name]];
					if(plotName){
						if(run.plot != plotName){
							return false;
						}
					}else{
						plotName = run.plot;
					}
					names[name] = 1;
					return true;
				}, this);
			func.forEach(this.series, function(run){
				var name = run.name;
				if(!(name in names) && run.plot == plotName){
					order.push(name);
				}
			});
			var newSeries = func.map(order, function(name){
					return this.series[this.runs[name]];
				}, this);
			this.series = newSeries.concat(func.filter(this.series, function(run){
				return run.plot != plotName;
			}));
			func.forEach(this.series, function(run, i){
				this.runs[run.name] = i;
			}, this);
			this.dirty = true;
			return this;	//	dojox/charting/Chart
		},
		moveSeriesToFront: function(name){
			// summary:
			//		Moves a given series to front of a plot.
			// name: String
			//		Series' name to move.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			if(name in this.runs){
				var index = this.runs[name],
					newOrder = this.getSeriesOrder(this.series[index].plot);
				if(name != newOrder[0]){
					newOrder.splice(index, 1);
					newOrder.unshift(name);
					return this.setSeriesOrder(newOrder);	//	dojox/charting/Chart
				}
			}
			return this;	//	dojox/charting/Chart
		},
		moveSeriesToBack: function(name){
			// summary:
			//		Moves a given series to back of a plot.
			// name: String
			//		Series' name to move.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			if(name in this.runs){
				var index = this.runs[name],
					newOrder = this.getSeriesOrder(this.series[index].plot);
				if(name != newOrder[newOrder.length - 1]){
					newOrder.splice(index, 1);
					newOrder.push(name);
					return this.setSeriesOrder(newOrder);	//	dojox/charting/Chart
				}
			}
			return this;	//	dojox/charting/Chart
		},
		resize: function(width, height){
			// summary:
			//		Resize the chart to the dimensions of width and height.
			// description:
			//		Resize the chart and its surface to the width and height dimensions.
			//		If a single argument of the form {w: value1, h: value2} is provided take that argument as the dimensions to use.
			//		Finally if no argument is provided, resize the surface to the marginBox of the chart.
			// width: Number|Object?
			//		The new width of the chart or the box definition.
			// height: Number?
			//		The new height of the chart.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			switch(arguments.length){
				// case 0, do not resize the div, just the surface
				case 1:
					// argument, override node box
					domGeom.setMarginBox(this.node, width);
					break;
				case 2:
					// argument, override node box
					domGeom.setMarginBox(this.node, {w: width, h: height});
					break;
			}
			// in all cases take back the computed box
			var box = domGeom.getMarginBox(this.node);
			var d = this.surface.getDimensions();
			if(d.width != box.w || d.height != box.h){
				// and set it on the surface
				this.surface.setDimensions(box.w, box.h);
				this.dirty = true;
				return this.render();	//	dojox/charting/Chart
			}else{
				return this;
			}
		},
		getGeometry: function(){
			// summary:
			//		Returns a map of information about all axes in a chart and what they represent
			//		in terms of scaling (see dojox.charting.axis2d.Default.getScaler).
			// returns: Object
			//		An map of geometry objects, a one-to-one mapping of axes.
			var ret = {};
			func.forIn(this.axes, function(axis){
				if(axis.initialized()){
					ret[axis.name] = {
						name:		axis.name,
						vertical:	axis.vertical,
						scaler:		axis.scaler,
						ticks:		axis.ticks
					};
				}
			});
			return ret;	//	Object
		},
		setAxisWindow: function(name, scale, offset, zoom){
			// summary:
			//		Zooms an axis and all dependent plots. Can be used to zoom in 1D.
			// name: String
			//		The name of the axis as defined by addAxis.
			// scale: Number
			//		The scale on the target axis.
			// offset: Number
			//		Any offest, as measured by axis tick
			// zoom: Boolean|Object?
			//		The chart zooming animation trigger.  This is null by default,
			//		e.g. {duration: 1200}, or just set true.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			var axis = this.axes[name];
			if(axis){
				axis.setWindow(scale, offset);
				arr.forEach(this.stack,function(plot){
					if(plot.hAxis == name || plot.vAxis == name){
						plot.zoom = zoom;
					}
				});
			}
			return this;	//	dojox/charting/Chart
		},
		setWindow: function(sx, sy, dx, dy, zoom){
			// summary:
			//		Zooms in or out any plots in two dimensions.
			// sx: Number
			//		The scale for the x axis.
			// sy: Number
			//		The scale for the y axis.
			// dx: Number
			//		The pixel offset on the x axis.
			// dy: Number
			//		The pixel offset on the y axis.
			// zoom: Boolean|Object?
			//		The chart zooming animation trigger.  This is null by default,
			//		e.g. {duration: 1200}, or just set true.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			if(!("plotArea" in this)){
				this.calculateGeometry();
			}
			func.forIn(this.axes, function(axis){
				var scale, offset, bounds = axis.getScaler().bounds,
					s = bounds.span / (bounds.upper - bounds.lower);
				if(axis.vertical){
					scale  = sy;
					offset = dy / s / scale;
				}else{
					scale  = sx;
					offset = dx / s / scale;
				}
				axis.setWindow(scale, offset);
			});
			arr.forEach(this.stack, function(plot){ plot.zoom = zoom; });
			return this;	//	dojox/charting/Chart
		},
		zoomIn:	function(name, range, delayed){
			// summary:
			//		Zoom the chart to a specific range on one axis.  This calls render()
			//		directly as a convenience method.
			// name: String
			//		The name of the axis as defined by addAxis.
			// range: Array
			//		The end points of the zoom range, measured in axis ticks.
			var axis = this.axes[name];
			if(axis){
				var scale, offset, bounds = axis.getScaler().bounds;
				var lower = Math.min(range[0],range[1]);
				var upper = Math.max(range[0],range[1]);
				lower = range[0] < bounds.lower ? bounds.lower : lower;
				upper = range[1] > bounds.upper ? bounds.upper : upper;
				scale = (bounds.upper - bounds.lower) / (upper - lower);
				offset = lower - bounds.lower;
				this.setAxisWindow(name, scale, offset);
				if(delayed){
					this.delayedRender();
				}else{
					this.render();
				}
			}
		},
		calculateGeometry: function(){
			// summary:
			//		Calculate the geometry of the chart based on the defined axes of
			//		a chart.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			if(this.dirty){
				return this.fullGeometry();
			}

			// calculate geometry
			var dirty = arr.filter(this.stack, function(plot){
					return plot.dirty ||
						(plot.hAxis && this.axes[plot.hAxis].dirty) ||
						(plot.vAxis && this.axes[plot.vAxis].dirty);
				}, this);
			calculateAxes(dirty, this.plotArea);

			return this;	//	dojox/charting/Chart
		},
		fullGeometry: function(){
			// summary:
			//		Calculate the full geometry of the chart.  This includes passing
			//		over all major elements of a chart (plots, axes, series, container)
			//		in order to ensure proper rendering.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			this._makeDirty();

			// clear old values
			arr.forEach(this.stack, clear);

			// rebuild new connections, and add defaults

			// set up a theme
			if(!this.theme){
				this.setTheme(new SimpleTheme());
			}

			// assign series
			arr.forEach(this.series, function(run){
				if(!(run.plot in this.plots)){
					// TODO remove auto-assignment
					if(!dc.plot2d || !dc.plot2d.Default){
						throw Error("Can't find plot: Default - didn't you forget to dojo" + ".require() it?");
					}
					var plot = new dc.plot2d.Default(this, {});
					plot.name = run.plot;
					this.plots[run.plot] = this.stack.length;
					this.stack.push(plot);
				}
				this.stack[this.plots[run.plot]].addSeries(run);
			}, this);
			// assign axes
			arr.forEach(this.stack, function(plot){
				if(plot.assignAxes){
					plot.assignAxes(this.axes);
				}
			}, this);

			// calculate geometry

			// 1st pass
			var dim = this.dim = this.surface.getDimensions();
			dim.width  = g.normalizedLength(dim.width);
			dim.height = g.normalizedLength(dim.height);
			func.forIn(this.axes, clear);
			calculateAxes(this.stack, dim);

			// assumption: we don't have stacked axes yet
			var offsets = this.offsets = {l: 0, r: 0, t: 0, b: 0};
			// chart mirroring starts
			var self = this;
			func.forIn(this.axes, function(axis){
				if(has("dojo-bidi")){
					self._resetLeftBottom(axis);
				}
				func.forIn(axis.getOffsets(), function(o, i){ offsets[i] = Math.max(o, offsets[i]); });
			});
			// chart mirroring ends
			// add title area
			if(this.title){
				this.titleGap = (this.titleGap==0) ? 0 : this.titleGap || this.theme.chart.titleGap || 20;
				this.titlePos = this.titlePos || this.theme.chart.titlePos || "top";
				this.titleFont = this.titleFont || this.theme.chart.titleFont;
				this.titleFontColor = this.titleFontColor || this.theme.chart.titleFontColor || "black";
				var tsize = g.normalizedLength(g.splitFontString(this.titleFont).size);
				offsets[this.titlePos == "top" ? "t" : "b"] += (tsize + this.titleGap);
			}
			// add margins
			func.forIn(this.margins, function(o, i){ offsets[i] += o; });

			// 2nd pass with realistic dimensions
			this.plotArea = {
				width: dim.width - offsets.l - offsets.r,
				height: dim.height - offsets.t - offsets.b
			};
			func.forIn(this.axes, clear);
			calculateAxes(this.stack, this.plotArea);

			return this;	//	dojox/charting/Chart
		},
		render: function(){
			// summary:
			//		Render the chart according to the current information defined.  This should
			//		be the last call made when defining/creating a chart, or if data within the
			//		chart has been changed.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.

			// do we have a delayed renderer pending? If yes we need to clear it
			if(this._delayedRenderHandle){
				clearTimeout(this._delayedRenderHandle);
				this._delayedRenderHandle = null;
			}
			
			if(this.theme){
				this.theme.clear();
			}

			if(this.dirty){
				return this.fullRender();
			}

			this.calculateGeometry();

			// go over the stack backwards
			func.forEachRev(this.stack, function(plot){ plot.render(this.dim, this.offsets); }, this);

			// go over axes
			func.forIn(this.axes, function(axis){ axis.render(this.dim, this.offsets); }, this);

			this._makeClean();

			return this;	//	dojox/charting/Chart
		},
		fullRender: function(){
			// summary:
			//		Force a full rendering of the chart, including full resets on the chart itself.
			//		You should not call this method directly unless absolutely necessary.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.

			// calculate geometry
			this.fullGeometry();
			var offsets = this.offsets, dim = this.dim;
			var w = Math.max(0, dim.width  - offsets.l - offsets.r),
				h = Math.max(0, dim.height - offsets.t - offsets.b);

			// get required colors
			//var requiredColors = func.foldl(this.stack, "z + plot.getRequiredColors()", 0);
			//this.theme.defineColors({num: requiredColors, cache: false});

			// clear old shapes
			arr.forEach(this.series, purge);
			func.forIn(this.axes, purge);
			arr.forEach(this.stack,  purge);
			var children = this.surface.children;
			// starting with 1.9 the registry is optional and thus dispose is
			if(shape.dispose){
				for(var i = 0; i < children.length;++i){
					shape.dispose(children[i]);
				}
			}
			if(this.chartTitle && this.chartTitle.tagName){
				// destroy title if it is a DOM node
			    domConstruct.destroy(this.chartTitle);
			}
			this.surface.clear();
			this.chartTitle = null;

			this._renderChartBackground(dim, offsets);
			if(this._nativeClip){
				this._renderPlotBackground(dim, offsets, w, h);
			}else{
				// VML
				this._renderPlotBackground(dim, offsets, w, h);
			}

			// go over the stack backwards
			func.foldr(this.stack, function(z, plot){ return plot.render(dim, offsets), 0; }, 0);

			if(!this._nativeClip){
				// VML, matting-clipping
				this._renderChartBackground(dim, offsets);
			}

			//create title: Whether to make chart title as a widget which extends dojox.charting.Element?
			if(this.title){
				var forceHtmlLabels = (g.renderer == "canvas") && this.htmlLabels,
					labelType = forceHtmlLabels || !has("ie") && !has("opera") && this.htmlLabels ? "html" : "gfx",
					tsize = g.normalizedLength(g.splitFontString(this.titleFont).size);
				this.chartTitle = common.createText[labelType](
					this,
					this.surface,
					dim.width/2,
					this.titlePos=="top" ? tsize + this.margins.t : dim.height - this.margins.b,
					"middle",
					this.title,
					this.titleFont,
					this.titleFontColor
				);
			}

			// go over axes
			func.forIn(this.axes, function(axis){ axis.render(dim, offsets); });

			this._makeClean();

			return this;	//	dojox/charting/Chart
		},
		_renderChartBackground: function(dim, offsets){
			var t = this.theme, rect;
			// chart background
			var fill   = this.fill   !== undefined ? this.fill   : (t.chart && t.chart.fill);
			var stroke = this.stroke !== undefined ? this.stroke : (t.chart && t.chart.stroke);

			// TRT: support for "inherit" as a named value in a theme.
			if(fill == "inherit"){
				//	find the background color of the nearest ancestor node, and use that explicitly.
				var node = this.node;
				fill = new Color(domStyle.get(node, "backgroundColor"));
				while(fill.a==0 && node!=document.documentElement){
					fill = new Color(domStyle.get(node, "backgroundColor"));
					node = node.parentNode;
				}
			}

			if(fill){
				if(this._nativeClip){
					fill = Element.prototype._shapeFill(Element.prototype._plotFill(fill, dim),
						{ x:0, y: 0, width: dim.width + 1, height: dim.height + 1 });
					this.surface.createRect({ width: dim.width + 1, height: dim.height + 1 }).setFill(fill);
				}else{
					// VML
					fill = Element.prototype._plotFill(fill, dim, offsets);
					if(offsets.l){	// left
						rect = {
							x: 0,
							y: 0,
							width:  offsets.l,
							height: dim.height + 1
						};
						this.surface.createRect(rect).setFill(Element.prototype._shapeFill(fill, rect));
					}
					if(offsets.r){	// right
						rect = {
							x: dim.width - offsets.r,
							y: 0,
							width:  offsets.r + 1,
							height: dim.height + 2
						};
						this.surface.createRect(rect).setFill(Element.prototype._shapeFill(fill, rect));
					}
					if(offsets.t){	// top
						rect = {
							x: 0,
							y: 0,
							width:  dim.width + 1,
							height: offsets.t
						};
						this.surface.createRect(rect).setFill(Element.prototype._shapeFill(fill, rect));
					}
					if(offsets.b){	// bottom
						rect = {
							x: 0,
							y: dim.height - offsets.b,
							width:  dim.width + 1,
							height: offsets.b + 2
						};
						this.surface.createRect(rect).setFill(Element.prototype._shapeFill(fill, rect));
					}
				}
			}
			if(stroke){
				this.surface.createRect({
					width:  dim.width - 1,
					height: dim.height - 1
				}).setStroke(stroke);
			}
		},
		_renderPlotBackground: function(dim, offsets, w, h){
			var t = this.theme;

			// draw a plot background
			var fill   = t.plotarea && t.plotarea.fill;
			var stroke = t.plotarea && t.plotarea.stroke;
			// size might be neg if offsets are bigger that chart size this happens quite often at
			// initialization time if the chart widget is used in a BorderContainer
			// this will fail on IE/VML
			var rect = {
				x: offsets.l - 1, y: offsets.t - 1,
				width:  w + 2,
				height: h + 2
			};
			if(fill){
				fill = Element.prototype._shapeFill(Element.prototype._plotFill(fill, dim, offsets), rect);
				this.surface.createRect(rect).setFill(fill);
			}
			if(stroke){
				this.surface.createRect({
					x: offsets.l, y: offsets.t,
					width:  w + 1,
					height: h + 1
				}).setStroke(stroke);
			}
		},
		delayedRender: function(){
			// summary:
			//		Delayed render, which is used to collect multiple updates
			//		within a delayInMs time window.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.

			if(!this._delayedRenderHandle){
				this._delayedRenderHandle = setTimeout(
					lang.hitch(this, function(){
						this.render();
					}),
					this.delayInMs
				);
			}

			return this;	//	dojox/charting/Chart
		},
		connectToPlot: function(name, object, method){
			// summary:
			//		A convenience method to connect a function to a plot.
			// name: String
			//		The name of the plot as defined by addPlot.
			// object: Object
			//		The object to be connected.
			// method: Function
			//		The function to be executed.
			// returns: Array
			//		A handle to the connection, as defined by dojo.connect (see dojo.connect).
			return name in this.plots ? this.stack[this.plots[name]].connect(object, method) : null;	//	Array
		},
		fireEvent: function(seriesName, eventName, index){
			// summary:
			//		Fires a synthetic event for a series item.
			// seriesName: String
			//		Series name.
			// eventName: String
			//		Event name to simulate: onmouseover, onmouseout, onclick.
			// index: Number
			//		Valid data value index for the event.
			// returns: dojox/charting/Chart
			//		A reference to the current chart for functional chaining.
			if(seriesName in this.runs){
				var plotName = this.series[this.runs[seriesName]].plot;
				if(plotName in this.plots){
					var plot = this.stack[this.plots[plotName]];
					if(plot){
						plot.fireEvent(seriesName, eventName, index);
					}
				}
			}
			return this;	//	dojox/charting/Chart
		},
		_makeClean: function(){
			// reset dirty flags
			arr.forEach(this.axes,   makeClean);
			arr.forEach(this.stack,  makeClean);
			arr.forEach(this.series, makeClean);
			this.dirty = false;
		},
		_makeDirty: function(){
			// reset dirty flags
			arr.forEach(this.axes,   makeDirty);
			arr.forEach(this.stack,  makeDirty);
			arr.forEach(this.series, makeDirty);
			this.dirty = true;
		},
		_invalidateDependentPlots: function(plotName, /* Boolean */ verticalAxis){
			if(plotName in this.plots){
				var plot = this.stack[this.plots[plotName]], axis,
					axisName = verticalAxis ? "vAxis" : "hAxis";
				if(plot[axisName]){
					axis = this.axes[plot[axisName]];
					if(axis && axis.dependOnData()){
						axis.dirty = true;
						// find all plots and mark them dirty
						arr.forEach(this.stack, function(p){
							if(p[axisName] && p[axisName] == plot[axisName]){
								p.dirty = true;
							}
						});
					}
				}else{
					plot.dirty = true;
				}
			}
		},
		setDir : function(dir){
			return this; 
		},
		_resetLeftBottom: function(axis){
		},
		formatTruncatedLabel: function(element, label, labelType){			
		}
	});

	function hSection(stats){
		return {min: stats.hmin, max: stats.hmax};
	}

	function vSection(stats){
		return {min: stats.vmin, max: stats.vmax};
	}

	function hReplace(stats, h){
		stats.hmin = h.min;
		stats.hmax = h.max;
	}

	function vReplace(stats, v){
		stats.vmin = v.min;
		stats.vmax = v.max;
	}

	function combineStats(target, source){
		if(target && source){
			target.min = Math.min(target.min, source.min);
			target.max = Math.max(target.max, source.max);
		}
		return target || source;
	}

	function calculateAxes(stack, plotArea){
		var plots = {}, axes = {};
		arr.forEach(stack, function(plot){
			var stats = plots[plot.name] = plot.getSeriesStats();
			if(plot.hAxis){
				axes[plot.hAxis] = combineStats(axes[plot.hAxis], hSection(stats));
			}
			if(plot.vAxis){
				axes[plot.vAxis] = combineStats(axes[plot.vAxis], vSection(stats));
			}
		});
		arr.forEach(stack, function(plot){
			var stats = plots[plot.name];
			if(plot.hAxis){
				hReplace(stats, axes[plot.hAxis]);
			}
			if(plot.vAxis){
				vReplace(stats, axes[plot.vAxis]);
			}
			plot.initializeScalers(plotArea, stats);
		});
	}
	
	return has("dojo-bidi")? declare("dojox.charting.Chart", [Chart, BidiChart]) : Chart;
});

},
'dojox/mobile/Icon':function(){
define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/dom-class",
	"dojo/dom-construct",
	"./iconUtils",
	"dojo/has",
	"dojo/has!dojo-bidi?dojox/mobile/bidi/Icon"
], function(declare, lang, domClass, domConstruct, iconUtils, has, BidiIcon){

	// module:
	//		dojox/mobile/Icon

	var Icon = declare(has("dojo-bidi") ? "dojox.mobile.NonBidiIcon" : "dojox.mobile.Icon", null, {
		// summary:
		//		A wrapper for image icon, CSS sprite icon, or DOM Button.
		// description:
		//		Icon is a simple utility class for creating an image icon, a CSS sprite icon, 
		//		or a DOM Button. It calls dojox/mobile/iconUtils.createIcon() with the 
		//		appropriate parameters to create an icon. 
		//		Note that this module is not a widget, that is it does not inherit 
		//		from dijit/_WidgetBase.
		// example:
		//		Image icon:
		//	|	<div data-dojo-type="dojox.mobile.Icon"
		//	|		data-dojo-props='icon:"images/tab-icon-12h.png"'></div>
		//
		//		CSS sprite icon:
		//	|	<div data-dojo-type="dojox.mobile.Icon"
		//	|		data-dojo-props='icon:"images/tab-icons.png",iconPos:"29,116,29,29"'></div>
		//
		//		DOM Button:
		//	|	<div data-dojo-type="dojox.mobile.Icon"
		//	|		data-dojo-props='icon:"mblDomButtonBlueCircleArrow"'></div>

		// icon: [const] String
		//		An icon to display. The value can be either a path for an image
		//		file or a class name of a DOM button.
		//		Note that changing the value of the property after the icon
		//		creation has no effect.
		icon: "",

		// iconPos: [const] String
		//		The position of an aggregated icon. IconPos is comma separated
		//		values like top,left,width,height (ex. "0,0,29,29").
		//		Note that changing the value of the property after the icon
		//		creation has no effect.
		iconPos: "",

		// alt: [const] String
		//		An alt text for the icon image.
		//		Note that changing the value of the property after the icon
		//		creation has no effect.
		alt: "",

		// tag: String
		//		The name of the HTML tag to create as this.domNode.
		tag: "div",

		constructor: function(/*Object?*/args, /*DomNode?*/node){
			// summary:
			//		Creates a new instance of the class.
			// args:
			//		Contains properties to be set.
			// node:
			//		The DOM node. If none is specified, it is automatically created. 
			if(args){
				lang.mixin(this, args);
			}
			this.domNode = node || domConstruct.create(this.tag);
			iconUtils.createIcon(this.icon, this.iconPos, null, this.alt, this.domNode);
			this._setCustomTransform();
		},
		_setCustomTransform: function(){
			// summary:
			//		To be implemented in bidi/Icon.js.
		}
	});
	return has("dojo-bidi") ? declare("dojox.mobile.Icon", [Icon, BidiIcon]) : Icon;
});

},
'dojox/charting/themes/Shrooms':function(){
define(["../SimpleTheme", "./common"], function(SimpleTheme, themes){
	// notes: colors generated by moving in 30 degree increments around the hue circle,
	//		at 90% saturation, using a B value of 75 (HSB model).
	themes.Shrooms = new SimpleTheme({
		colors: [
			"#bf1313", // 0
			"#69bf13", // 90
			"#13bfbf", // 180
			"#6913bf", // 270
			"#bf6913", // 30
			"#13bf13", // 120
			"#1369bf", // 210
			"#bf13bf", // 300
			"#bfbf13", // 60
			"#13bf69", // 150
			"#1313bf", // 240
			"#bf1369"  // 330
		]
	});
	return themes.Shrooms;
});

},
'money/WheelScrollableView':function(){
define([
"dojo/_base/declare",
"dojo/_base/event",
"dojo/mouse",
"dojox/mobile/sniff",
"dojox/mobile/ScrollablePane"
], function(declare, event, mouse, has, ScrollableView){
    return declare("money.WheelScrollableView", ScrollableView, {
        init: function(params){
            this.inherited(arguments);
            //if(!has("touch")){
            this.connect(this.domNode, mouse.wheel, "_mouseWheel");
            this.addCover();

            this.removeCover();
            this.flashScrollBar();
            this.isFirstScroll = true
            window.t = this
            this._waitingInterval = setInterval(function(){
                self.isFirstScroll = true
            },2000)

        },
        _mouseWheel: function(e){
            event.stop(e); // prevent propagation
            if(this._waitingInterval)
                clearInterval(this._waitingInterval)

            var pos = this.getPos();
            var dim = this.getDim();
            var self = this;

            if(this.isFirstScroll)
                this.flashScrollBar();

            this.isFirstScroll = false

            this.showScrollBar();

            if(window.AppData.scrollBarTimeout)
                clearTimeout(window.AppData.scrollBarTimeout)

            window.AppData.scrollBarTimeout = setTimeout(function(){
                self.hideScrollBar()
                self.removeCover();
                self._waitingInterval = setInterval(function(){
                    self.isFirstScroll = true
                },2000)
            },1000)

            var deltaY = e.wheelDelta > 0 ? 150 : - 150;
            var newY = pos.y + deltaY;
            //console.log(newY)
            //console.log(dim)

            if (newY <= 0 && Math.abs(newY) <= dim.o.h){ // stop scrolling at the top/bottom
                this.slideTo({x: pos.x, y: newY});
            }
            else 
                if( (newY < 0 ) && ( Math.abs(newY) > dim.o.h ) && ( dim.d.h < dim.c.h) ) this.slideTo({x: pos.x, y: -dim.o.h})
            else 
                if (newY > 0) this.slideTo({x: pos.x, y: 0}) 

        }
    });
});

},
'dojox/main':function(){
define(["dojo/_base/kernel"], function(dojo) {
	// module:
	//		dojox/main

	/*=====
	return {
		// summary:
		//		The dojox package main module; dojox package is somewhat unusual in that the main module currently just provides an empty object.
		//		Apps should require modules from the dojox packages directly, rather than loading this module.
	};
	=====*/

	return dojo.dojox;
});
},
'dojox/mobile/LongListMixin':function(){
define([ "dojo/_base/array",
         "dojo/_base/lang",
         "dojo/_base/declare",
         "dojo/sniff",
         "dojo/dom-construct",
         "dojo/dom-geometry",
         "dijit/registry",
         "./common",
         "./viewRegistry" ],
		function(array, lang, declare, has, domConstruct, domGeometry, registry, dm, viewRegistry){

	// module:
	//		dojox/mobile/LongListMixin
	// summary:
	//		A mixin that enhances performance of long lists contained in scrollable views.

	return declare("dojox.mobile.LongListMixin", null, {
		// summary:
		//		This mixin enhances performance of very long lists contained in scrollable views.
		// description:
		//		LongListMixin enhances a list contained in a ScrollableView
		//		so that only a subset of the list items are actually contained in the DOM
		//		at any given time. 
		//		The parent must be a ScrollableView or another scrollable component
		//		that inherits from the dojox.mobile.scrollable mixin, otherwise the mixin has
		//		no effect. Also, editable lists are not yet supported, so lazy scrolling is
		//		disabled if the list's 'editable' attribute is true.
		//		If this mixin is used, list items must be added, removed or reordered exclusively
		//		using the addChild and removeChild methods of the list. If the DOM is modified
		//		directly (for example using list.containerNode.appendChild(...)), the list
		//		will not behave correctly.
		
		// pageSize: int
		//		Items are loaded in the DOM by chunks of this size.
		pageSize: 20,
		
		// maxPages: int
		//		When this limit is reached, previous pages will be unloaded.
		maxPages: 5,
		
		// unloadPages: int
		//		Number of pages that will be unloaded when maxPages is reached.
		unloadPages: 1,
		
		startup : function(){
			if(this._started){ return; }
			
			this.inherited(arguments);

			if(!this.editable){

				this._sv = viewRegistry.getEnclosingScrollable(this.domNode);

				if(this._sv){

					// Get all children already added (e.g. through markup) and initialize _items
					this._items = this.getChildren();

					// remove all existing items from the old container node
					this._clearItems();

					this.containerNode = domConstruct.create("div", null, this.domNode);

					// listen to scrollTo and slideTo from the parent scrollable object

					this.connect(this._sv, "scrollTo", lang.hitch(this, this._loadItems), true);
					this.connect(this._sv, "slideTo", lang.hitch(this, this._loadItems), true);

					// The _topDiv and _bottomDiv elements are place holders for the items
					// that are not actually in the DOM at the top and bottom of the list.

					this._topDiv = domConstruct.create("div", null, this.domNode, "first");
					this._bottomDiv = domConstruct.create("div", null, this.domNode, "last");

					this._reloadItems();
				}
			}
		},
		
		_loadItems : function(toPos){
			// summary:	Adds and removes items to/from the DOM when the list is scrolled.
			
			var sv = this._sv; 			// ScrollableView
			var h = sv.getDim().d.h;
			if(h <= 0){ return; } 			// view is hidden

			var cury = -sv.getPos().y; // current y scroll position
			var posy = toPos ? -toPos.y : cury;

			// get minimum and maximum visible y positions:
			// we use the largest area including both the current and new position
			// so that all items will be visible during slideTo animations
			var visibleYMin = Math.min(cury, posy),
				visibleYMax = Math.max(cury, posy) + h;
			
			// add pages at top and bottom as required to fill the visible area
			while(this._loadedYMin > visibleYMin && this._addBefore()){ }
			while(this._loadedYMax < visibleYMax && this._addAfter()){ }
		},
		
		_reloadItems: function(){
			// summary:	Resets the internal state and reloads items according to the current scroll position.

			// remove all loaded items
			this._clearItems();
			
			// reset internal state
			this._loadedYMin = this._loadedYMax = 0;
			this._firstIndex = 0;
			this._lastIndex = -1;
			this._topDiv.style.height = "0px";
			
			this._loadItems();
		},
		
		_clearItems: function(){
			// summary: Removes all currently loaded items.
			var c = this.containerNode;
			array.forEach(registry.findWidgets(c), function(item){
				c.removeChild(item.domNode);
			});
		},
		
		_addBefore: function(){
			// summary:	Loads pages of items before the currently visible items to fill the visible area.
			
			var i, count;
			
			var oldBox = domGeometry.getMarginBox(this.containerNode);
			
			for(count = 0, i = this._firstIndex-1; count < this.pageSize && i >= 0; count++, i--){
				var item = this._items[i];
				domConstruct.place(item.domNode, this.containerNode, "first");
				if(!item._started){
					item.startup();
				}
				this._firstIndex = i;
			}
			
			var newBox = domGeometry.getMarginBox(this.containerNode);

			this._adjustTopDiv(oldBox, newBox);
			
			if(this._lastIndex - this._firstIndex >= this.maxPages*this.pageSize){
				var toRemove = this.unloadPages*this.pageSize;
				for(i = 0; i < toRemove; i++){
					this.containerNode.removeChild(this._items[this._lastIndex - i].domNode);
				}
				this._lastIndex -= toRemove;
				
				newBox = domGeometry.getMarginBox(this.containerNode);
			}

			this._adjustBottomDiv(newBox);
			
			return count == this.pageSize;
		},
		
		_addAfter: function(){
			// summary:	Loads pages of items after the currently visible items to fill the visible area.
			
			var i, count;
			
			var oldBox = null;
			
			for(count = 0, i = this._lastIndex+1; count < this.pageSize && i < this._items.length; count++, i++){
				var item = this._items[i];
				domConstruct.place(item.domNode, this.containerNode);
				if(!item._started){
					item.startup();
				}
				this._lastIndex = i;
			}
			if(this._lastIndex - this._firstIndex >= this.maxPages*this.pageSize){
				oldBox = domGeometry.getMarginBox(this.containerNode);
				var toRemove = this.unloadPages*this.pageSize;
				for(i = 0; i < toRemove; i++){
					this.containerNode.removeChild(this._items[this._firstIndex + i].domNode);
				}
				this._firstIndex += toRemove;
			}
			
			var newBox = domGeometry.getMarginBox(this.containerNode);

			if(oldBox){
				this._adjustTopDiv(oldBox, newBox);
			}
			this._adjustBottomDiv(newBox);

			return count == this.pageSize;
		},
		
		_adjustTopDiv: function(oldBox, newBox){
			// summary:	Adjusts the height of the top filler div after items have been added/removed.
			
			this._loadedYMin -= newBox.h - oldBox.h;
			this._topDiv.style.height = this._loadedYMin + "px";
		},
		
		_adjustBottomDiv: function(newBox){
			// summary:	Adjusts the height of the bottom filler div after items have been added/removed.
			
			// the total height is an estimate based on the average height of the already loaded items
			var h = this._lastIndex > 0 ? (this._loadedYMin + newBox.h) / this._lastIndex : 0;
			h *= this._items.length - 1 - this._lastIndex;
			this._bottomDiv.style.height = h + "px";
			this._loadedYMax = this._loadedYMin + newBox.h;
		},
		
		_childrenChanged : function(){
			// summary: Called by addChild/removeChild, updates the loaded items.
			
			// Whenever an item is added or removed, this may impact the loaded items,
			// so we have to clear all loaded items and recompute them. We cannot afford 
			// to do this on every add/remove, so we use a timer to batch these updates.
			// There would probably be a way to update the loaded items on the fly
			// in add/removeChild, but at the cost of much more code...
			if(!this._qs_timer){
				this._qs_timer = this.defer(function(){
					delete this._qs_timer;
					this._reloadItems();
				});
			}
		},

		resize: function(){
			// summary: Loads/unloads items to fit the new size
			this.inherited(arguments);
			if(this._items){
				this._loadItems();
			}
		},
		
		// The rest of the methods are overrides of _Container and _WidgetBase.
		// We must override them because children are not all added to the DOM tree
		// under the list node, only a subset of them will really be in the DOM,
		// but we still want the list to look as if all children were there.

		addChild : function(/* dijit._Widget */widget, /* int? */insertIndex){
			// summary: Overrides dijit._Container
			if(this._items){
				if( typeof insertIndex == "number"){
					this._items.splice(insertIndex, 0, widget);
				}else{
					this._items.push(widget);
				}
				this._childrenChanged();
			}else{
				this.inherited(arguments);
			}
		},

		removeChild : function(/* Widget|int */widget){
			// summary: Overrides dijit._Container
			if(this._items){
				this._items.splice(typeof widget == "number" ? widget : this._items.indexOf(widget), 1);
				this._childrenChanged();
			}else{
				this.inherited(arguments);
			}
		},

		getChildren : function(){
			// summary: Overrides dijit._WidgetBase
			if(this._items){
				return this._items.slice(0);
			}else{
				return this.inherited(arguments);
			}
		},

		_getSiblingOfChild : function(/* dijit._Widget */child, /* int */dir){
			// summary: Overrides dijit._Container

			if(this._items){
				var index = this._items.indexOf(child);
				if(index >= 0){
					index = dir > 0 ? index++ : index--;
				}
				return this._items[index];
			}else{
				return this.inherited(arguments);
			}
		},
		
		generateList: function(/*Array*/items){
			// summary:
			//		Overrides dojox.mobile._StoreListMixin when the list is a store list.
			
			if(this._items && !this.append){
				// _StoreListMixin calls destroyRecursive to delete existing items, not removeChild,
				// so we must remove all logical items (i.e. clear _items) before reloading the store.
				// And since the superclass destroys all children returned by getChildren(), and
				// this would actually return no children because _items is now empty, we must
				// destroy all children manually first.
				array.forEach(this.getChildren(), function(child){
					child.destroyRecursive();
				});
				this._items = [];
			}
			this.inherited(arguments);
		}
	});
});

},
'money/views/summary':function(){
define(["dojo/_base/declare", "dojo/_base/array","money/dialog","dojo/date",
	"dojo/_base/fx","dojo/on","dojox/gesture/swipe","dojo/_base/lang","dijit/registry", 
	"dojo/dom", "dojo/date/locale", "dojo/query", "dojo/dom-construct", "dojo/dom-style", "dojo/dom-class","dojo/dom-attr",
	"dojox/mobile/ListItem", "dojox/mobile/EdgeToEdgeCategory","dojox/mobile/EdgeToEdgeStoreList"
    ],
    function(declare, arrayUtil,Dialog, dojodate, fx,on,swipe, lang, registry, dom, locale, query, domConstruct, domStyle, domClass, domAttr, ListItem, ListCategory){
    var TransactionListItem = declare(ListItem, {
        target: "list",
        onClick: function(){
			window.AppData.currentDate = this.id.substr( 3, this.id.length-1 )
		},
        clickable: true,
        postMixInProperties: function(){
            this.inherited(arguments);
            this.transitionOptions = {
                params: {
                    "id" : this.id.substr(3,this.id.length-1)
                }
            }            
        }
    });
	
	
    return window.AppData.objSum = {
		afterActivate: function(){
			//alert('after activate')
			window.hideProgress()
		},
		
		/*
		 * array of monthes <yyyy-MM> presented on view
		 * used to render month headers in right order
		*/
		_monthsOnPage:[],
		
		/*
		 * Template for right text of list item
		 */ 
		_accountTemplate:
			'<div><span class="transaction-amount">${amount}</span><span class="transaction-account">${account}</span></div>',
		
		/*
		 *  Substitute ${var} in template with data[var]
		 */
		substitute: function(template, data) {
			var self = this
			return template.replace(/\$\{([^\s\:\}]+)(?:\:([^\s\:\}]+))?\}/g, function(match, key){
				if(data[key]!=undefined || (key.substr(0,1) == "!" && data[key.substr(1)]))
					return (key.substr(0,1)=="!" ? self.capitalize(data[key.substr(1)]):data[key])
				return ""			
			});
		},
		
		/*
		 * make str[0] bigger :-)
		 */ 
		capitalize: function(str){
			return str.substr(0,1).toUpperCase() + str.substr(1,str.length-1)//.toLowerCase()
		},
		//-----------PRIVATE----------------//
		
		/*
		* Return array with transactions summary for each account
		* ['yyyy-MM-dd' => [{account: <account id>, amount: <amount>},...]]
		* */
		_parseTransaction: function(s, trans){
			var summary = lang.clone(s)
			console.log('!!!', summary)
			
			var dateString = (isValidDate(trans.date)) ? locale.format(trans.date, {selector:"date", datePattern:window.AppData.widgetDateFormat}) : trans.date
			if(parseFloat(trans.amount)!=NaN){
				if(summary[dateString]){
					var flag = false
					arrayUtil.forEach(summary[dateString], function(dateSum){
						if(dateSum.account == trans.account){
							dateSum.amount += parseFloat(trans.amountHome)
							flag = true
						}
					})					
					if(!flag)
						summary[dateString][summary[dateString].length] = {account: trans.account, amount: parseFloat(trans.amountHome)}
				}else{
					summary[dateString] = [{account: trans.account, amount: parseFloat(trans.amountHome)}]
				}
				summary[dateString].total = summary[dateString].total ? (summary[dateString].total + parseFloat(trans.amountHome)) : parseFloat(trans.amountHome)
			}
			return summary
		},
		
		/*
		 *	push <yyyy-MM> into _monthsOnPage if thie month hasn't been already added 
		 */
		_pushMonth: function(id){
			var monthPresent = false
			for(var i in this._monthsOnPage)
				if(this._monthsOnPage[i] == id){
					monthPresent = true; break;
				}
			if(!monthPresent)
				this._monthsOnPage.push(id)
		},
		
		/*
		 * select tab that corresponds to current transactions type
		 */ 
		_renderHeader: function(){
			var t = ['e','i','t']
			for (var i in t)
				registry.byId('sum-is-'+t[i]).set('selected',false)
			registry.byId('sum-is-'+window.AppData.currentType).set('selected',true)
		},
		
		/*
		 * Apply(!) months titles as ul's children
		 */
		_renderMonth: function(){
			var months = query('#summary-list .mblEdgeToEdgeCategory');
				for(var i=0; i< months.length; i++)
					registry.byId(months[i].id).destroy();
				
			
			for(var i in this._monthsOnPage){
				//console.log(this._monthsOnPage[i],query("."+this._monthsOnPage[i])[0])
				var date = locale.parse(this._monthsOnPage[i], {"selector":"date", "datePattern":'yyyy-MM'})
				var h = new ListCategory({
					label: this.capitalize(locale.format(date, {selector:"date", datePattern:'MMM yyyy'}))
				},domConstruct.create('h2',{},query("."+this._monthsOnPage[i])[0],'before'))
				
			}
		},
		
		/*
		 * Returns single day record
		 * 	@d - [{account: <account id>, amount: <amount>},...]
		 * 	@month - what date do the transactions refers to
		 */
		_renderRecord: function(d, month){				
			var data = lang.clone( d ),
				date = locale.parse( month, { "selector":"date", "datePattern":window.AppData.widgetDateFormat }),
				cl	 = locale.format( date, { selector:"date",datePattern:"yyyy-MM" }),
				content = '', 	//single record content
				_total = 0, 	//day transactions sum
				i=0
			data.id = "ts-"+getDateString(date, locale)
			
			//we now have transactions for THE month
			this._pushMonth(cl)			
			
			arrayUtil.forEach(data, function(data_i){
				i++;
				_total += parseFloat(data_i.amount)
				//get transaction account info
				var a = window.AppData.accountStore.query({ id:data_i.account })[0]
				data_i.account = a.label
				data_i.amount = getMoney( data_i.amount, /*a.maincur*/window.AppData.currency )
				content += this.substitute(this._accountTemplate, data_i)
			},this)
			
			data.dateString = "<div class='date-header'>" + 
					data.dateString + 
				"</div>" + 
				"<div class='summary " + 
					(( i > 1 ) ? "sub-sum":"") +
				"'>"+
					content + 
					((i > 1 && window.AppData.currentType!="t") ? 
						('<div class=\"li-total\"><span>' + 
							getMoney(_total, window.AppData.currency) +
						'</span></div> </div>') : 
					'</div>');
					
			data['class'] = cl
			return data
		},
		
		afterDeactivate: function(){
			window.dFinance.children.dFinance_summary.summary = []
		},
		
		//render timespan title & sum				
		_displayTotal: function(sumNodeId, titleNodeId) {
			//calculate timespan totals
			var self = this;
			var sumNodeId = sumNodeId || 'summary-sum-total'
			var titleNodeId = titleNodeId || 'summary-sum-ts'
			var total = 0, alltrans = window.AppData.store.query( self.query );
			for(var i = 0; i < alltrans.length; i++ )
				total += alltrans[i].amountHome;
			
			var tsHeader = 
				(window.AppData.timespan != 'noneTimespan') ? 
					(window.AppData.timespan == 'last31') ? this.nls.lastMonth : 
						( ( window.AppData.timespan == 'lastMonth' ||  window.AppData.timespan == 'customTimespan' )? 
							('<span style="text-transform:capitalize">' + locale.format(dojodate.add(window.AppData.dateFrom, 'day', 1), {selector:"date", datePattern: "MMM yyyy"}) +"</span>") : 
						this.nls.thisMonth) :
					this.nls.allTheTime
			
			domAttr.set(sumNodeId, 'innerHTML', getMoney( total, window.AppData.currency))			
			domAttr.set(titleNodeId,'innerHTML',tsHeader)				
					
		},
		
		_displayFirstTimeMessage: function() {
			var self = this
			domStyle.set(this.emptyMsgTitle.domNode,"display",self.daily.getChildren().length ? "none" : "")
			domStyle.set(this.emptyMsg.domNode,"display",self.daily.getChildren().length ? "none" : "")
			domClass[self.daily.getChildren().length ? "remove" : "add"](self.daily.domNode, 'empty')
		},
		
		_initializeHomeCurrency: function() {
			var self = this;
			if(!window.AppData.currency){
				if(!this.params.currency){
					this.dlg = window.AppData.dialogWindow = new Dialog
					this.dlg.show(false, this.nls.currencySelectNote, this.nls.currencySelectTitle, this.nls.currencySelectButton, function(){
						window.dFinance.transitionToView(self.domNode,{
							target	: 'currencypicker',
							transitionDir	: 1,
							params : {backTo : 'summary'}
						})
					})
				}else{
					window.AppData.currency = this.params.currency;
					localStorage.setItem('currency', this.params.currency)
				}
			}
		},
		//---------------PUBLIC--------------------------//
		/*
		 * Called when view gets focus
		 */
		beforeActivate: function(){
			var self = this
						
			var callback = function(){
				
				//if this is the first run of the app, set up main currency
				self._initializeHomeCurrency();
				
				//set up type of transactions to be displayed
				if(this.params.type)
					window.AppData.currentType = this.params.type
				
				if(this.params.refresh)
					self.daily.refresh();
				
				//render month names and set up type-selector UI
				window.AppData.objSum._renderHeader()
				window.AppData.objSum._renderMonth()
			
				//display transactions total
				self._displayTotal();
				
				//display welcome notes if no transactions this timespan
				self._displayFirstTimeMessage()				
			};
			
			//do not wait for callback before showing view.
			setTimeout(function(){
				callback.call(self)
			},0)
		},
		
		
		/*
		*	query function for listitem store
		*/ 
        query: function(item){
			var daysInMonth = dojodate.getDaysInMonth(new Date); 
			
			var from = window.AppData.dateFrom ? window.AppData.dateFrom : (window.AppData.dateFrom = dojodate.add(new Date,"day", -daysInMonth - 1));
			var to = window.AppData.dateTo ? window.AppData.dateTo : (window.AppData.dateTo = dojodate.add(new Date,"day", 1));
			return (item.type==window.AppData.currentType) && 
				( (window.AppData.timespan == 'noneTimespan' && !window.AppData.useDateImportant) || ( dojodate.difference(item.date, from, "second") < 0 ) && ( dojodate.difference(item.date, to, "second") > 0) )
		},
        
        /*
         * class used to create list item objects
         */ 
        listItem: TransactionListItem,
        
        _enableMenuOnSwipe: function() {
			var self = this;
			if(window.AppData.isInitiallySmall)
				on(this.domNode, swipe.end, function(e){
					if(Math.abs(e.dy) < 30){
						if(e.dx>50){
							window.dFinance.transitionToView(self.domNode,{
								"target": "navigation" , "transitionDir": -1
							})
						}
					}
				});
		},
        
        init: function(){
			registry.byId('summary-list').onUpdate = this.onListUpdate;
			registry.byId('summary-list').onDelete = this.onListUpdate;
			registry.byId('summary-list').onAdd = this.onListUpdate;
			domStyle.set(this.scrollView.containerNode,'paddingBottom','20px')
			
			this._onInit();
			
			
			if( window.AppData.store.createPromise && !window.AppData.store.createPromise.isResolved() ) {
				var self = this;			
				window.AppData.store.createPromise.then( function(){ self.beforeActivate() });
			}
				
			this.bottomBar.startup();
			this._enableMenuOnSwipe();
			
		},
        _onInit: function(){    
			if(!window.AppData.isInitiallySmall){
				domClass.add(this.menuButton.domNode,'hideOnMedium hideOnLarge')
			}
            var self = this
            self.menu = registry.byId('main-nav')
			
			this._renderMonth()
					
        },
        summary: [],
        
        /*
         * rebuild summary for the whole day corresponding to The transaction Item
         * @item - modified store record
         */ 
        onListUpdate: function(item){
			//save dateFrom & dateTo to restore after operation is complete
			var dateFrom = window.AppData.dateFrom;
			var dateTo 	 = window.AppData.dateTo;
			
			window.AppData.dateFrom = dojodate.add(item.date, 'day', -1);
			window.AppData.dateTo = dojodate.add(item.date, 'day', 1)
			window.AppData.useDateImportant = true;
			
			//all items, that needed to be recalculated
			var modifiedItems = this.store.query( this.query );
			
			//if there are no any transactions that day, just remove entry from summary
			var dateId = locale.format(item.date, {"selector":"date", "datePattern":'yyyy-MM-dd'});
			if(modifiedItems.length == 0 && registry.byId( 'ts-' +  dateId)){
				registry.byId( 'ts-' +  dateId).destroyRecursive();	
				return;
			}
			
			//else place new entry into correspondent position
			var allExistingItems = registry.byId('summary-list').getChildren();
			var inserted = false
			for(var i=0; i<allExistingItems.length; i++) {
				var _singleItem = allExistingItems[i], _siDate = _singleItem.id.substr(3, _singleItem.id.length-1)
				if(_siDate.length == 10) {
					var _siDateAsDate =  locale.parse(_siDate, {"selector":"date", "datePattern":'yyyy-MM-dd'})
					if(dojodate.difference(_siDateAsDate, item.date, 'day') >= 0){
						for(var k = 0; k < modifiedItems.length; k++) {
							var li = this.createListItem( modifiedItems[k] );
							this.addChild( li,  i);
						}
						inserted = true
						break;
					}
				}
			}
			if(!inserted)
				for(var k = 0; k < modifiedItems.length; k++) {
					var li = this.createListItem( modifiedItems[k] );
					this.addChild( li );
				}
				
			
			window.AppData.useDateImportant = false;	
			window.AppData.dateFrom = dateFrom;
			window.AppData.dateTo = dateTo;
			
		},
		
		createListItem: function(/*Object*/item){
			
			// summary:
			//		Creates a list item widget.
			var itemClone = lang.clone(item), self = window.dFinance.children.dFinance_summary
			var id = getDateString(itemClone.date, locale)
			
			var did = "ts-" + id
			if(item.type == "t"){
				itemClone.amount 		*= -1
				itemClone.amountHome 	*= -1
				itemClone.sumTo 		*= 1
			}
			self.summary = self._parseTransaction(self.summary, itemClone)
			self.summary[id].id = id
			self.summary[id].dateString = getDateStringHr(itemClone.date, locale) //get human readable date string
			
			if(item.type == "t" && item.accountTo) {
				var trans2 = lang.clone(itemClone); 
					trans2.amount 		= trans2.sumTo; 
					trans2.amountHome 	= -trans2.amountHome; 
					trans2.account 		= trans2.accountTo
				self.summary = self._parseTransaction(self.summary, trans2)
			}
			
			//replace existing list entry with new one
			if(!registry.byId(did)){			
				return new this.itemRenderer(
					this._createItemProperties( self._renderRecord(self.summary[id],id) )
				);
			}else {
				registry.byId(did).destroyRecursive()
				//return registry.byId(itemClone.id)
				return new this.itemRenderer(
					this._createItemProperties( self._renderRecord(self.summary[id],id) )
				);
			}
		}
    };
});

},
'money/views/tags':function(){
define([
	"dojo/_base/declare","dojox/mobile/TextBox","dojo/_base/array", "dojox/mobile/ListItem",
	"dijit/registry","dojo/dom-attr","dojo/json", "dojo/dom-style",
	"dojox/mobile/Button"
 ],
    function(declare,TextBox,arrayUtil, ListItem,   registry, domAttr,json, domStyle,Button){
    
	return window.AppData.objTags = {
		beforeActivate: function(contact){
			//window.AppData.numberPicker.mode = "a"
        },
        afterActivate: function(){
			window.hideProgress()
		},
        init: function(){
			var self = this
			this.addBtn.onClick = function(){
				self.add();
			}
			var tags = window.AppData.store.getTags();
			arrayUtil.forEach(tags, function(tag){
				this.addExisting(tag)
			},this)
			
			this.displayEmptyMsgs(tags.length)
		},
		//l - number of existing accounts
		displayEmptyMsgs: function(l){
			domStyle.set('no-tags-tags','display', !l? 'block':'none')
			domStyle.set('tags-list','display', l? 'block':'none')
		},        
		add: function(){
			console.log('add')
			var item = {label:'', et: new Date().getTime()}
			var existing = window.AppData.tagsStore.get(
				window.AppData.tagsStore.add(item)
			)
			this.addExisting(existing)
			this.save()
		},
		addExisting: function(tag){
			var self = this
			delTagByMinus = function(e, _this){
				e.stopPropagation();
				//get account id from it's button's tag
				var id = domAttr.get(_this, 'data-finance-id')
				window.AppData.store.query(function(item){
					var found = false
					for(var i = 0; i< item.tags.length; i++){
						if(item.tags[i] == id){
							remove(item.tags, i)
							window.AppData.store.putItem(item)
						}
					}
					return false
				})
				//remove all transactions at this account
				
				//remove account itself
				window.AppData.store.removeTag(id)
				window.AppData.store._setTags(window.AppData.store.getTags())
				
				self.displayEmptyMsgs(window.AppData.store.getTags().length)
				//destroy account list item
				registry.byId('l'+id).destroyRecursive();
				var deleted = localStorage.getItem('deletedTags') ? json.parse(localStorage.getItem('deletedTags')) : new Array();
					deleted.push(id);
				localStorage.setItem('deletedTags',json.stringify(deleted));
				
			}
			this.tagList.addChild(new ListItem({
				label: '<div ontouchend="window.AppData.touched = true; delTagByMinus(event, this);"'+
				'onclick="if(!window.AppData.touched) delTagByMinus(event, this);" style="" class="domButton mblDomButtonBlueCircleMinus" data-finance-id="'+tag.id+'"><div><div><div></div></div></div></div>'+
					'<input type="text" id="a-'+ tag.id + '" value="' + tag.label +'"/>',
				//rightText: '<button id = "ab-'+account.id+'"></button>',
				'class':'button-at-right',
				id: 'l'+tag.id
			}))
			this.displayEmptyMsgs(1)
			var tb = new TextBox({
				onChange: function(value){
					window.AppData.objTags.tag = tag
					window.AppData.objTags.tag.label = value
					self.save()
				},
				placeHolder: "Category title"
			},"a-"+tag.id)
			
		},
		save: function(){
			var tag = window.AppData.objTags.tag;
			console.log(tag)
			if(tag){
				tag.et = new Date().getTime()
				window.AppData.tagsStore.put(tag)
				window.AppData.store._setTags(window.AppData.store.getTags())
			}
		}
    };
});

},
'dojo/hash':function(){
define(["./_base/kernel", "require", "./_base/config", "./aspect", "./_base/lang", "./topic", "./domReady", "./sniff"],
	function(dojo, require, config, aspect, lang, topic, domReady, has){

	// module:
	//		dojo/hash

	dojo.hash = function(/* String? */ hash, /* Boolean? */ replace){
		// summary:
		//		Gets or sets the hash string in the browser URL.
		// description:
		//		Handles getting and setting of location.hash.
		//
		//		 - If no arguments are passed, acts as a getter.
		//		 - If a string is passed, acts as a setter.
		// hash:
		//		the hash is set - #string.
		// replace:
		//		If true, updates the hash value in the current history
		//		state instead of creating a new history state.
		// returns:
		//		when used as a getter, returns the current hash string.
		//		when used as a setter, returns the new hash string.
		// example:
		//	|	topic.subscribe("/dojo/hashchange", context, callback);
		//	|
		//	|	function callback (hashValue){
		//	|		// do something based on the hash value.
		//	|	}

		// getter
		if(!arguments.length){
			return _getHash();
		}
		// setter
		if(hash.charAt(0) == "#"){
			hash = hash.substring(1);
		}
		if(replace){
			_replace(hash);
		}else{
			location.href = "#" + hash;
		}
		return hash; // String
	};

	// Global vars
	var _recentHash, _ieUriMonitor, _connect,
		_pollFrequency = config.hashPollFrequency || 100;

	//Internal functions
	function _getSegment(str, delimiter){
		var i = str.indexOf(delimiter);
		return (i >= 0) ? str.substring(i+1) : "";
	}

	function _getHash(){
		return _getSegment(location.href, "#");
	}

	function _dispatchEvent(){
		topic.publish("/dojo/hashchange", _getHash());
	}

	function _pollLocation(){
		if(_getHash() === _recentHash){
			return;
		}
		_recentHash = _getHash();
		_dispatchEvent();
	}

	function _replace(hash){
		if(_ieUriMonitor){
			if(_ieUriMonitor.isTransitioning()){
				setTimeout(lang.hitch(null,_replace,hash), _pollFrequency);
				return;
			}
			var href = _ieUriMonitor.iframe.location.href;
			var index = href.indexOf('?');
			// main frame will detect and update itself
			_ieUriMonitor.iframe.location.replace(href.substring(0, index) + "?" + hash);
			return;
		}
		location.replace("#"+hash);
		!_connect && _pollLocation();
	}

	function IEUriMonitor(){
		// summary:
		//		Determine if the browser's URI has changed or if the user has pressed the
		//		back or forward button. If so, call _dispatchEvent.
		//
		// description:
		//		IE doesn't add changes to the URI's hash into the history unless the hash
		//		value corresponds to an actual named anchor in the document. To get around
		//		this IE difference, we use a background IFrame to maintain a back-forward
		//		history, by updating the IFrame's query string to correspond to the
		//		value of the main browser location's hash value.
		//
		//		E.g. if the value of the browser window's location changes to
		//
		//		#action=someAction
		//
		//		... then we'd update the IFrame's source to:
		//
		//		?action=someAction
		//
		//		This design leads to a somewhat complex state machine, which is
		//		described below:
		//
		//		####s1
		//
		//		Stable state - neither the window's location has changed nor
		//		has the IFrame's location. Note that this is the 99.9% case, so
		//		we optimize for it.
		//
		//		Transitions: s1, s2, s3
		//
		//		####s2
		//
		//		Window's location changed - when a user clicks a hyperlink or
		//		code programmatically changes the window's URI.
		//
		//		Transitions: s4
		//
		//		####s3
		//
		//		Iframe's location changed as a result of user pressing back or
		//		forward - when the user presses back or forward, the location of
		//		the background's iframe changes to the previous or next value in
		//		its history.
		//
		//		Transitions: s1
		//
		//		####s4
		//
		//		IEUriMonitor has programmatically changed the location of the
		//		background iframe, but it's location hasn't yet changed. In this
		//		case we do nothing because we need to wait for the iframe's
		//		location to reflect its actual state.
		//
		//		Transitions: s4, s5
		//
		//		####s5
		//
		//		IEUriMonitor has programmatically changed the location of the
		//		background iframe, and the iframe's location has caught up with
		//		reality. In this case we need to transition to s1.
		//
		//		Transitions: s1
		//
		//		The hashchange event is always dispatched on the transition back to s1.


		// create and append iframe
		var ifr = document.createElement("iframe"),
			IFRAME_ID = "dojo-hash-iframe",
			ifrSrc = config.dojoBlankHtmlUrl || require.toUrl("./resources/blank.html");

		if(config.useXDomain && !config.dojoBlankHtmlUrl){
			console.warn("dojo/hash: When using cross-domain Dojo builds,"
				+ " please save dojo/resources/blank.html to your domain and set djConfig.dojoBlankHtmlUrl"
				+ " to the path on your domain to blank.html");
		}

		ifr.id = IFRAME_ID;
		ifr.src = ifrSrc + "?" + _getHash();
		ifr.style.display = "none";
		document.body.appendChild(ifr);

		this.iframe = dojo.global[IFRAME_ID];
		var recentIframeQuery, transitioning, expectedIFrameQuery, docTitle, ifrOffline,
			iframeLoc = this.iframe.location;

		function resetState(){
			_recentHash = _getHash();
			recentIframeQuery = ifrOffline ? _recentHash : _getSegment(iframeLoc.href, "?");
			transitioning = false;
			expectedIFrameQuery = null;
		}

		this.isTransitioning = function(){
			return transitioning;
		};

		this.pollLocation = function(){
			if(!ifrOffline){
				try{
					//see if we can access the iframe's location without a permission denied error
					var iframeSearch = _getSegment(iframeLoc.href, "?");
					//good, the iframe is same origin (no thrown exception)
					if(document.title != docTitle){ //sync title of main window with title of iframe.
						docTitle = this.iframe.document.title = document.title;
					}
				}catch(e){
					//permission denied - server cannot be reached.
					ifrOffline = true;
					console.error("dojo/hash: Error adding history entry. Server unreachable.");
				}
			}
			var hash = _getHash();
			if(transitioning && _recentHash === hash){
				// we're in an iframe transition (s4 or s5)
				if(ifrOffline || iframeSearch === expectedIFrameQuery){
					// s5 (iframe caught up to main window or iframe offline), transition back to s1
					resetState();
					_dispatchEvent();
				}else{
					// s4 (waiting for iframe to catch up to main window)
					setTimeout(lang.hitch(this,this.pollLocation),0);
					return;
				}
			}else if(_recentHash === hash && (ifrOffline || recentIframeQuery === iframeSearch)){
				// we're in stable state (s1, iframe query == main window hash), do nothing
			}else{
				// the user has initiated a URL change somehow.
				// sync iframe query <-> main window hash
				if(_recentHash !== hash){
					// s2 (main window location changed), set iframe url and transition to s4
					_recentHash = hash;
					transitioning = true;
					expectedIFrameQuery = hash;
					ifr.src = ifrSrc + "?" + expectedIFrameQuery;
					ifrOffline = false; //we're updating the iframe src - set offline to false so we can check again on next poll.
					setTimeout(lang.hitch(this,this.pollLocation),0); //yielded transition to s4 while iframe reloads.
					return;
				}else if(!ifrOffline){
					// s3 (iframe location changed via back/forward button), set main window url and transition to s1.
					location.href = "#" + iframeLoc.search.substring(1);
					resetState();
					_dispatchEvent();
				}
			}
			setTimeout(lang.hitch(this,this.pollLocation), _pollFrequency);
		};
		resetState(); // initialize state (transition to s1)
		setTimeout(lang.hitch(this,this.pollLocation), _pollFrequency);
	}
	domReady(function(){
		if("onhashchange" in dojo.global && (!has("ie") || (has("ie") >= 8 && document.compatMode != "BackCompat"))){	//need this IE browser test because "onhashchange" exists in IE8 in IE7 mode
			_connect = aspect.after(dojo.global,"onhashchange",_dispatchEvent, true);
		}else{
			if(document.addEventListener){ // Non-IE
				_recentHash = _getHash();
				setInterval(_pollLocation, _pollFrequency); //Poll the window location for changes
			}else if(document.attachEvent){ // IE7-
				//Use hidden iframe in versions of IE that don't have onhashchange event
				_ieUriMonitor = new IEUriMonitor();
			}
			// else non-supported browser, do nothing.
		}
	});

	return dojo.hash;

});

},
'dojo/store/util/QueryResults':function(){
define(["../../_base/array", "../../_base/lang", "../../when"
], function(array, lang, when){

// module:
//		dojo/store/util/QueryResults

var QueryResults = function(results){
	// summary:
	//		A function that wraps the results of a store query with additional
	//		methods.
	// description:
	//		QueryResults is a basic wrapper that allows for array-like iteration
	//		over any kind of returned data from a query.  While the simplest store
	//		will return a plain array of data, other stores may return deferreds or
	//		promises; this wrapper makes sure that *all* results can be treated
	//		the same.
	//
	//		Additional methods include `forEach`, `filter` and `map`.
	// results: Array|dojo/promise/Promise
	//		The result set as an array, or a promise for an array.
	// returns:
	//		An array-like object that can be used for iterating over.
	// example:
	//		Query a store and iterate over the results.
	//
	//	|	store.query({ prime: true }).forEach(function(item){
	//	|		//	do something
	//	|	});

	if(!results){
		return results;
	}

	var isPromise = !!results.then;
	// if it is a promise it may be frozen
	if(isPromise){
		results = lang.delegate(results);
	}
	function addIterativeMethod(method){
		// Always add the iterative methods so a QueryResults is
		// returned whether the environment is ES3 or ES5
		results[method] = function(){
			var args = arguments;
			var result = when(results, function(results){
				Array.prototype.unshift.call(args, results);
				return QueryResults(array[method].apply(array, args));
			});
			// forEach should only return the result of when()
			// when we're wrapping a promise
			if(method !== "forEach" || isPromise){
				return result;
			}
		};
	}

	addIterativeMethod("forEach");
	addIterativeMethod("filter");
	addIterativeMethod("map");
	if(results.total == null){
		results.total = when(results, function(results){
			return results.length;
		});
	}
	return results; // Object
};

lang.setObject("dojo.store.util.QueryResults", QueryResults);

return QueryResults;

});

},
'dojo/currency':function(){
define([
	"./_base/array",
	"./_base/lang",
	/*===== "./_base/declare", =====*/
	"./number",
	"./i18n", "./i18n!./cldr/nls/currency",
	"./cldr/monetary"
], function(darray, lang, /*===== declare, =====*/ dnumber, i18n, nlsCurrency, cldrMonetary){

// module:
//		dojo/currency

var currency = {
	// summary:
	//		localized formatting and parsing routines for currencies
	// description:
	//		extends dojo.number to provide culturally-appropriate formatting of values
	//		in various world currencies, including use of a currency symbol.  The currencies are specified
	//		by a three-letter international symbol in all uppercase, and support for the currencies is
	//		provided by the data in `dojo.cldr`.  The scripts generating dojo.cldr specify which
	//		currency support is included.  A fixed number of decimal places is determined based
	//		on the currency type and is not determined by the 'pattern' argument.  The fractional
	//		portion is optional, by default, and variable length decimals are not supported.
};
lang.setObject("dojo.currency", currency);

currency._mixInDefaults = function(options){
	options = options || {};
	options.type = "currency";

	// Get locale-dependent currency data, like the symbol
	var bundle = i18n.getLocalization("dojo.cldr", "currency", options.locale) || {};

	// Mixin locale-independent currency data, like # of places
	var iso = options.currency;
	var data = cldrMonetary.getData(iso);

	darray.forEach(["displayName","symbol","group","decimal"], function(prop){
		data[prop] = bundle[iso+"_"+prop];
	});

	data.fractional = [true, false];

	// Mixin with provided options
	return lang.mixin(data, options);
};

/*=====
currency.__FormatOptions = declare([dnumber.__FormatOptions], {
	// type: String?
	//		Should not be set.  Value is assumed to be "currency".
	// symbol: String?
	//		localized currency symbol. The default will be looked up in table of supported currencies in `dojo.cldr`
	//		A [ISO4217](http://en.wikipedia.org/wiki/ISO_4217) currency code will be used if not found.
	// currency: String?
	//		an [ISO4217](http://en.wikipedia.org/wiki/ISO_4217) currency code, a three letter sequence like "USD".
	//		For use with dojo.currency only.
	// places: Number?
	//		number of decimal places to show.  Default is defined based on which currency is used.
	type: "",
	symbol: "",
	currency: "",
	places: ""
});
=====*/

currency.format = function(/*Number*/ value, /*__FormatOptions?*/ options){
	// summary:
	//		Format a Number as a currency, using locale-specific settings
	//
	// description:
	//		Create a string from a Number using a known, localized pattern.
	//		[Formatting patterns](http://www.unicode.org/reports/tr35/#Number_Elements)
	//		appropriate to the locale are chosen from the [CLDR](http://unicode.org/cldr)
	//		as well as the appropriate symbols and delimiters and number of decimal places.
	//
	// value:
	//		the number to be formatted.

	return dnumber.format(value, currency._mixInDefaults(options));
};

currency.regexp = function(/*dnumber.__RegexpOptions?*/ options){
	//
	// summary:
	//		Builds the regular needed to parse a currency value
	//
	// description:
	//		Returns regular expression with positive and negative match, group and decimal separators
	//		Note: the options.places default, the number of decimal places to accept, is defined by the currency type.
	return dnumber.regexp(currency._mixInDefaults(options)); // String
};

/*=====
var __ParseOptions = currency.__ParseOptions = declare(dnumber.__ParseOptions, {
	// type: String?
	//		Should not be set.  Value is assumed to be currency.
	// currency: String?
	//		an [ISO4217](http://en.wikipedia.org/wiki/ISO_4217) currency code, a three letter sequence like "USD".
	//		For use with dojo.currency only.
	// symbol: String?
	//		localized currency symbol. The default will be looked up in table of supported currencies in `dojo.cldr`
	//		A [ISO4217](http://en.wikipedia.org/wiki/ISO_4217) currency code will be used if not found.
	// places: Number?
	//		fixed number of decimal places to accept.  The default is determined based on which currency is used.
	// fractional: Boolean|Array?
	//		Whether to include the fractional portion, where the number of decimal places are implied by the currency
	//		or explicit 'places' parameter.  The value [true,false] makes the fractional portion optional.
	//		By default for currencies, it the fractional portion is optional.
});
=====*/

currency.parse = function(/*String*/ expression, /*__ParseOptions?*/ options){
	//
	// summary:
	//		Convert a properly formatted currency string to a primitive Number,
	//		using locale-specific settings.
	// description:
	//		Create a Number from a string using a known, localized pattern.
	//		[Formatting patterns](http://www.unicode.org/reports/tr35/#Number_Format_Patterns)
	//		are chosen appropriate to the locale, as well as the appropriate symbols and delimiters
	//		and number of decimal places.
	// expression:
	//		A string representation of a currency value

	return dnumber.parse(expression, currency._mixInDefaults(options));
};

return currency;
});

},
'dojox/gfx/gradutils':function(){
// Various generic utilities to deal with a linear gradient

define(["./_base", "dojo/_base/lang", "./matrix", "dojo/_base/Color"], 
  function(g, lang, m, Color){
  
	var gradutils = g.gradutils = {};

	function findColor(o, c){
		if(o <= 0){
			return c[0].color;
		}
		var len = c.length;
		if(o >= 1){
			return c[len - 1].color;
		}
		//TODO: use binary search
		for(var i = 0; i < len; ++i){
			var stop = c[i];
			if(stop.offset >= o){
				if(i){
					var prev = c[i - 1];
					return Color.blendColors(new Color(prev.color), new Color(stop.color),
						(o - prev.offset) / (stop.offset - prev.offset));
				}
				return stop.color;
			}
		}
		return c[len - 1].color;
	}

	gradutils.getColor = function(fill, pt){
		// summary:
		//		sample a color from a gradient using a point
		// fill: Object
		//		fill object
		// pt: dojox/gfx.Point
		//		point where to sample a color
		var o;
		if(fill){
			switch(fill.type){
				case "linear":
					var angle = Math.atan2(fill.y2 - fill.y1, fill.x2 - fill.x1),
						rotation = m.rotate(-angle),
						projection = m.project(fill.x2 - fill.x1, fill.y2 - fill.y1),
						p = m.multiplyPoint(projection, pt),
						pf1 = m.multiplyPoint(projection, fill.x1, fill.y1),
						pf2 = m.multiplyPoint(projection, fill.x2, fill.y2),
						scale = m.multiplyPoint(rotation, pf2.x - pf1.x, pf2.y - pf1.y).x;
					o = m.multiplyPoint(rotation, p.x - pf1.x, p.y - pf1.y).x / scale;
					break;
				case "radial":
					var dx = pt.x - fill.cx, dy = pt.y - fill.cy;
					o = Math.sqrt(dx * dx + dy * dy) / fill.r;
					break;
			}
			return findColor(o, fill.colors);	// dojo/_base/Color
		}
		// simple color
		return new Color(fill || [0, 0, 0, 0]);	// dojo/_base/Color
	};

	gradutils.reverse = function(fill){
		// summary:
		//		reverses a gradient
		// fill: Object
		//		fill object
		if(fill){
			switch(fill.type){
				case "linear":
				case "radial":
					fill = lang.delegate(fill);
					if(fill.colors){
						var c = fill.colors, l = c.length, i = 0, stop,
							n = fill.colors = new Array(c.length);
						for(; i < l; ++i){
							stop = c[i];
							n[i] = {
								offset: 1 - stop.offset,
								color:  stop.color
							};
						}
						n.sort(function(a, b){ return a.offset - b.offset; });
					}
					break;
			}
		}
		return fill;	// Object
	};

	return gradutils;
});

},
'dojox/app/utils/config':function(){
define(["dojo/sniff"], function(has){

// module:
//		dojox/app/utils/config

return {
	// summary:
	//		This module contains the config

	configProcessHas: function(/*Object*/ source){
		// summary:
		//		scan the source config for has checks and call configMerge to merge has sections, and remove the has sections from the source.
		// description:
		//		configProcessHas will scan the source config for has checks. 
		//		For each has section the items inside the has section will be tested with has (sniff)
		//		If the has test is true it will call configMerge to merge has sections back into the source config.
		//		It will always remove the has section from the source after processing it.
		//		The names in the has section can be separated by a comma, indicating that any of those being true will satisfy the test.
		// source:
		//		an object representing the config to be processed.
		// returns:
		//		the updated source object.
		for(var name in source){
			var	sval = source[name];
			if(name == "has"){ // found a "has" section in source
				for(var hasname in sval){ // get the hasnames from the has section
					if(!(hasname.charAt(0) == '_' && hasname.charAt(1) == '_') && sval && typeof sval === 'object'){
						// need to handle multiple has checks separated by a ",".
						var parts = hasname.split(',');
						if(parts.length > 0){
							while(parts.length > 0){ 	
								var haspart = parts.shift();
								// check for has(haspart) or if haspart starts with ! check for !(has(haspart))
								if((has(haspart)) || (haspart.charAt(0) == '!' && !(has(haspart.substring(1))))){ // if true this one should be merged
									var hasval = sval[hasname];
									this.configMerge(source, hasval); // merge this has section into the source config
									break;	// found a match for this multiple has test, so go to the next one
								}
							}
						}
					}
				}
				delete source["has"];	// after merge remove this has section from the config
			}else{
				if(!(name.charAt(0) == '_' && name.charAt(1) == '_') && sval && typeof sval === 'object'){
						this.configProcessHas(sval);
				}
			}
		}
		return source;
	},

	configMerge: function(/*Object*/ target, /*Object*/ source){
		// summary:
		//		does a deep copy of the source into the target to merge the config from the source into the target
		// description:
		//		configMerge will merge the source config into the target config with a deep copy.
		//		anything starting with __ will be skipped and if the target is an array the source items will be pushed into the target.
		// target:
		//		an object representing the config which will be updated by merging in the source.
		// source:
		//		an object representing the config to be merged into the target.
		// returns:
		//		the updated target object.

		for(var name in source){
			var tval = target[name];
			var	sval = source[name];
			if(tval !== sval && !(name.charAt(0) == '_' && name.charAt(1) == '_')){
				if(tval && typeof tval === 'object' && sval && typeof sval === 'object'){
					this.configMerge(tval, sval);
				}else{
					if(target instanceof Array){
						target.push(sval);
					}else{
						target[name] = sval;
					}
				}
			}
		}
		return target;
	}
};

});

},
'dojox/charting/themes/ThreeD':function(){
define(["dojo/_base/lang", "dojo/_base/array", "../Theme", "./gradientGenerator", "./PrimaryColors", "dojo/colors" /* for sanitize */, "./common"],
	function(lang, ArrayUtil, Theme, gradientGenerator, PrimaryColors, themes){

	var colors = ["#f00", "#0f0", "#00f", "#ff0", "#0ff", "#f0f", "./common"],	// the same is in PrimaryColors
		defaultFill = {type: "linear", space: "shape", x1: 0, y1: 0, x2: 100, y2: 0},
		// 3D cylinder map is calculated using dojox.gfx3d
		cyl3dMap = [
			{o: 0.00, i: 174}, {o: 0.08, i: 231}, {o: 0.18, i: 237}, {o: 0.30, i: 231},
			{o: 0.39, i: 221}, {o: 0.49, i: 206}, {o: 0.58, i: 187}, {o: 0.68, i: 165},
			{o: 0.80, i: 128}, {o: 0.90, i: 102}, {o: 1.00, i: 174}
		],
		hiliteIndex = 2, hiliteIntensity = 100,
		cyl3dFills = ArrayUtil.map(colors, function(c){
			var fill = lang.delegate(defaultFill),
				colors = fill.colors = gradientGenerator.generateGradientByIntensity(c, cyl3dMap),
				hilite = colors[hiliteIndex].color;
			// add highlight
			hilite.r += hiliteIntensity;
			hilite.g += hiliteIntensity;
			hilite.b += hiliteIntensity;
			hilite.sanitize();
			return fill;
		});

	themes.ThreeD = PrimaryColors.clone();
	themes.ThreeD.series.shadow = {dx: 1, dy: 1, width: 3, color: [0, 0, 0, 0.15]};

	themes.ThreeD.next = function(elementType, mixin, doPost){
		if(elementType == "bar" || elementType == "column"){
			// custom processing for bars and columns: substitute fills
			var index = this._current % this.seriesThemes.length,
				s = this.seriesThemes[index], old = s.fill;
			s.fill = cyl3dFills[index];
			var theme = Theme.prototype.next.apply(this, arguments);
			// cleanup
			s.fill = old;
			return theme;
		}
		return Theme.prototype.next.apply(this, arguments);
	};
	
	return themes.ThreeD;
});

},
'money/views/settings':function(){
define([
	"dojo/_base/declare","dojo/dom-class", "dojo/dom-style","dojo/dom-attr",
	"dojo/sniff", "dojo/dom-construct", "dojox/mobile/ListItem",
	"dojox/mobile/SimpleDialog", "dojox/mobile/ProgressIndicator",
	"dojo/_base/window","dojox/mobile/Button", "dojo/date/locale"
 ],
    function(declare,domClass, domStyle, domAttr,has, domConstruct, ListItem,  SimpleDialog, ProgressIndicator, win, Button, locale){
    
	return window.AppData.objSettings = {
		beforeActivate: function(contact){
			
        },
        init: function(){
			if(!window.AppData.isInitiallySmall){
				domClass.add(this.backButton.domNode,'hideOnMedium hideOnLarge')
			}
		},
		afterActivate: function(){
			window.hideProgress()
		}
		
    };
});

},
'dojox/gesture/Base':function(){
define([
	"dojo/_base/kernel",
	"dojo/_base/declare",
	"dojo/_base/array",
	"dojo/_base/lang",
	"dojo/dom",
	"dojo/on",
	"dojo/touch",
	"dojo/has",
	"../main"
], function(kernel, declare, array, lang, dom, on, touch, has, dojox){
	// module:
	//		dojox/gesture/Base
	// summary:
	//		This module provides an abstract parental class for various gesture implementations.
	
/*=====
	dojox.gesture.Base = {
		// summary:
		//		An abstract parental class for various gesture implementations.
		//
		//		It's mainly responsible for:
		//
		//		1. Binding on() listening handlers for supported gesture events.
		//
		//		2. Monitoring underneath events and process different phases - 'press'|'move'|'release'|'cancel'.
		//
		//		3. Firing and bubbling gesture events with on() API.
		//
		//		A gesture implementation only needs to extend this class and overwrite appropriate phase handlers:
		//
		//		- press()|move()|release()|cancel for recognizing and firing gestures
		//
		// example:
		//		1. A typical gesture implementation.
		//
		//		Suppose we have dojox/gesture/a which provides 3 gesture events:"a", "a.x", "a.y" to be used as:
		//		|	dojo.connect(node, dojox.gesture.a, function(e){});
		//		|	dojo.connect(node, dojox.gesture.a.x, function(e){});
		//		|	dojo.connect(node, dojox.gesture.a.y, function(e){});
		//
		//		The definition of the gesture "a" may look like:
		//		|	define([..., "./Base"], function(..., Base){
		//		|		var clz = declare(Base, {
		//		|			defaultEvent: "a",
		//		|
		//		|			subEvents: ["x", "y"],
		//		|			
		//		|			press: function(data, e){
		//		|				this.fire(node, {type: "a.x", ...});
		//		|			},
		//		|			move: function(data, e){
		//		|				this.fire(node, {type: "a.y", ...});
		//		|			},
		//		|			release: function(data, e){
		//		|				this.fire(node, {type: "a", ...});
		//		|			},
		//		|			cancel: function(data, e){
		//		|				// clean up
		//		|			}
		//		|		});
		//		|
		//		|		// in order to have a default instance for handy use
		//		|		dojox.gesture.a = new clz();
		//		|
		//		|		// so that we can create new instances like
		//		|		// var mine = new dojox.gesture.a.A({...})
		//		|		dojox.gesture.a.A = clz;
		//		|
		//		|		return dojox.gesture.a;
		//		|	});
		//
		//		2. A gesture can be used in the following ways(taking dojox.gesture.tap for example):
		//
		//		A. Used with dojo.connect()
		//		|	dojo.connect(node, dojox.gesture.tap, function(e){});
		//		|	dojo.connect(node, dojox.gesture.tap.hold, function(e){});
		//		|	dojo.connect(node, dojox.gesture.tap.doubletap, function(e){});		
		//
		//		B. Used with dojo.on
		//		|	define(["dojo/on", "dojox/gesture/tap"], function(on, tap){
		//		|		on(node, tap, function(e){});
		//		|		on(node, tap.hold, function(e){});
		//		|		on(node, tap.doubletap, function(e){});
		//
		//		C. Used with dojox.gesture.tap directly
		//		|	dojox.gesture.tap(node, function(e){});
		//		|	dojox.gesture.tap.hold(node, function(e){});
		//		|	dojox.gesture.tap.doubletap(node, function(e){});
		//
		//		Though there is always a default gesture instance after being required, e.g 
		//		|	require(["dojox/gesture/tap"], function(){...});
		//
		//		It's possible to create a new one with different parameter setting:
		//		|	var myTap = new dojox.gesture.tap.Tap({holdThreshold: 300});
		//		|	dojo.connect(node, myTap, function(e){});
		//		|	dojo.connect(node, myTap.hold, function(e){});
		//		|	dojo.connect(node, myTap.doubletap, function(e){});
		//		
		//		Please refer to dojox/gesture/ for more gesture usages
	};
=====*/
	kernel.experimental("dojox.gesture.Base");
	
	lang.getObject("gesture", true, dojox);

	// Declare an internal anonymous class which will only be exported by module return value
	return declare(/*===== "dojox.gesture.Base", =====*/null, {

		// defaultEvent: [readonly] String
		//		Default event e.g. 'tap' is a default event of dojox.gesture.tap
		defaultEvent: " ",

		// subEvents: [readonly] Array
		//		A list of sub events e.g ['hold', 'doubletap'],
		//		used by being combined with defaultEvent like 'tap.hold', 'tap.doubletap' etc.
		subEvents: [],

		// touchOnly: boolean
		//		Whether the gesture is touch-device only
		touchOnly : false,

		// _elements: Array
		//		List of elements that wraps target node and gesture data
		_elements: null,

		/*=====
		// _lock: Dom
		//		The dom node whose descendants are all locked for processing
		_lock: null,
		
		// _events: [readonly] Array
		//		The complete list of supported gesture events with full name space
		//		e.g ['tap', 'tap.hold', 'tap.doubletap']
		_events: null,
		=====*/

		constructor: function(args){
			lang.mixin(this, args);
			this.init();
		},
		init: function(){
			// summary:
			//		Initialization works
			this._elements = [];

			if(!has("touch") && this.touchOnly){
				console.warn("Gestures:[", this.defaultEvent, "] is only supported on touch devices!");
				return;
			}

			// bind on() handlers for various events
			var evt = this.defaultEvent;
			this.call = this._handle(evt);

			this._events = [evt];
			array.forEach(this.subEvents, function(subEvt){
				this[subEvt] = this._handle(evt + '.' + subEvt);
				this._events.push(evt + '.' + subEvt);
			}, this);
		},
		_handle: function(/*String*/eventType){
			// summary:
			//		Bind listen handler for the given gesture event(e.g. 'tap', 'tap.hold' etc.)
			//		the returned handle will be used internally by dojo/on
			var self = this;
			//called by dojo/on
			return function(node, listener){
				// normalize, arguments might be (null, node, listener)
				var a = arguments;
				if(a.length > 2){
					node = a[1];
					listener = a[2];
				}
				var isNode = node && (node.nodeType || node.attachEvent || node.addEventListener);
				if(!isNode){
					return on(node, eventType, listener);
				}else{
					var onHandle = self._add(node, eventType, listener);
					// FIXME - users are supposed to explicitly call either
					// disconnect(signal) or signal.remove() to release resources
					var signal = {
						remove: function(){
							onHandle.remove();
							self._remove(node, eventType);
						}
					};
					return signal;
				}
			}; // dojo/on handle
		},
		_add: function(/*Dom*/node, /*String*/type, /*function*/listener){
			// summary:
			//		Bind dojo/on handlers for both gesture event(e.g 'tab.hold')
			//		and underneath 'press'|'move'|'release' events
			var element = this._getGestureElement(node);
			if(!element){
				// the first time listening to the node
				element = {
					target: node,
					data: {},
					handles: {}
				};

				var _press = lang.hitch(this, "_process", element, "press");
				var _move = lang.hitch(this, "_process", element, "move");
				var _release = lang.hitch(this, "_process", element, "release");
				var _cancel = lang.hitch(this, "_process", element, "cancel");

				var handles = element.handles;
				if(this.touchOnly){
					handles.press = on(node, 'touchstart', _press);
					handles.move = on(node, 'touchmove', _move);
					handles.release = on(node, 'touchend', _release);
					handles.cancel = on(node, 'touchcancel', _cancel);
				}else{
					handles.press = touch.press(node, _press);
					handles.move = touch.move(node, _move);
					handles.release = touch.release(node, _release);
					handles.cancel = touch.cancel(node, _cancel);
				}
				this._elements.push(element);
			}
			// track num of listeners for the gesture event - type
			// so that we can release element if no more gestures being monitored
			element.handles[type] = !element.handles[type] ? 1 : ++element.handles[type];

			return on(node, type, listener); //handle
		},
		_getGestureElement: function(/*Dom*/node){
			// summary:
			//		Obtain a gesture element for the give node
			var i = 0, element;
			for(; i < this._elements.length; i++){
				element = this._elements[i];
				if(element.target === node){
					return element;
				}
			}
		},
		_process: function(element, phase, e){
			// summary:
			//		Process and dispatch to appropriate phase handlers.
			//		Also provides the machinery for managing gesture bubbling.
			// description:
			//		1. e._locking is used to make sure only the most inner node
			//		will be processed for the same gesture, suppose we have:
			//	|	on(inner, dojox.gesture.tap, func1);
			//	|	on(outer, dojox.gesture.tap, func2);
			//		only the inner node will be processed by tap gesture, once matched,
			//		the 'tap' event will be bubbled up from inner to outer, dojo.StopEvent(e)
			//		can be used at any level to stop the 'tap' event.
			//
			//		2. Once a node starts being processed, all it's descendant nodes will be locked.
			//		The same gesture won't be processed on its descendant nodes until the lock is released.
			// element: Object
			//		Gesture element
			// phase: String
			//		Phase of a gesture to be processed, might be 'press'|'move'|'release'|'cancel'
			// e: Event
			//		Native event
			e._locking = e._locking || {};
			if(e._locking[this.defaultEvent] || this.isLocked(e.currentTarget)){
				return;
			}
			// invoking gesture.press()|move()|release()|cancel()
			// #16900: same condition as in dojo/touch, to avoid breaking the editing of input fields.
			if((e.target.tagName != "INPUT" || e.target.type == "radio" || e.target.type == "checkbox")
				&& e.target.tagName != "TEXTAREA"){
				e.preventDefault(); 
			}
			e._locking[this.defaultEvent] = true;
			this[phase](element.data, e);
		},
		press: function(data, e){
			// summary:
			//		Process the 'press' phase of a gesture
		},
		move: function(data, e){
			// summary:
			//		Process the 'move' phase of a gesture
		},
		release: function(data, e){
			// summary:
			//		Process the 'release' phase of a gesture
		},
		cancel: function(data, e){
			// summary:
			//		Process the 'cancel' phase of a gesture
		},
		fire: function(node, event){
			// summary:
			//		Fire a gesture event and invoke registered listeners
			//		a simulated GestureEvent will also be sent along
			// node: DomNode
			//		Target node to fire the gesture
			// event: Object
			//		An object containing specific gesture info e.g {type: 'tap.hold'|'swipe.left'), ...}
			//		all these properties will be put into a simulated GestureEvent when fired.
			//		Note - Default properties in a native Event won't be overwritten, see on.emit() for more details.
			if(!node || !event){
				return;
			}
			event.bubbles = true;
			event.cancelable = true;
			on.emit(node, event.type, event);
		},
		_remove: function(/*Dom*/node, /*String*/type){
			// summary:
			//		Check and remove underneath handlers if node
			//		is not being listened for 'this' gesture anymore,
			//		this happens when user removed all previous on() handlers.
			var element = this._getGestureElement(node);
			if(!element || !element.handles){ return; }
			
			element.handles[type]--;

			var handles = element.handles;
			if(!array.some(this._events, function(evt){
				return handles[evt] > 0;
			})){
				// clean up if node is not being listened anymore
				this._cleanHandles(handles);
				var i = array.indexOf(this._elements, element);
				if(i >= 0){
					this._elements.splice(i, 1);
				}
			}
		},
		_cleanHandles: function(/*Object*/handles){
			// summary:
			//		Clean up on handles
			for(var x in handles){
				//remove handles for "press"|"move"|"release"|"cancel"
				if(handles[x].remove){
					handles[x].remove();
				}
				delete handles[x];
			}
		},
		lock: function(/*Dom*/node){
			// summary:
			//		Lock all descendants of the node.
			// tags:
			//		protected
			this._lock = node;
		},
		unLock: function(){
			// summary:
			//		Release the lock
			// tags:
			//		protected
			this._lock = null;
		},
		isLocked: function(node){
			// summary:
			//		Check if the node is locked, isLocked(node) means
			//		whether it's a descendant of the currently locked node.
			// tags:
			//		protected
			if(!this._lock || !node){
				return false;
			}
			return this._lock !== node && dom.isDescendant(node, this._lock);
		},
		destroy: function(){
			// summary:
			//		Release all handlers and resources
			array.forEach(this._elements, function(element){
				this._cleanHandles(element.handles);
			}, this);
			this._elements = null;
		}
	});
});
},
'money/views/accountpicker':function(){
define(["dijit/registry","dojo/_base/array","dojo/query","dojo/sniff","dojo/dom-class"],
    function(registry, arrayUtil, query, has, domClass){
 
		return window.AppData.objAcc = {
			
			beforeActivate: function(){
				if(window.AppData.objDet){
					//this.tagsPicker.set('store',window.AppData.tagsStore)
					this.accountPicker.set('store',window.AppData.accountStore)
					this.accountPicker.refresh()
					window.A = this.accountPicker
					this.acc = (this.params.mode == "to" ? window.AppData.details.accountTo : window.AppData.details.account)
					registry.byId('newAccount').set('value', this.acc.get('label'));
					this.initializeList()
				}else{//if details view is not initialized goto details
					this.app.transitionToView(this.domNode, {target: 'details' , transitionDir: 1, params: { 'edit' : true } })
				}
			},
			init: function(){
				//window.AppData.accountPickerOverlay = this
				this.accountPicker.set('store',window.AppData.accountsStore)
				if(has('isInitiallySmall')){
					domClass.remove	(this.domNode, "left");
				}
				var self = this
				this.done.onClick = function(){
					window.AppData.objDet.acc(self.acc);
					var a = window.AppData.accountStore.query({'label': window.AppData.details.account.get('label')})
					window.AppData.details.currency.set('label',a[0]?a[0].currency:"EUR")
					var t = window.AppData.isInitiallySmall ? 'details' : 'navigation+details'
					window.dFinance.transitionToView(this.domNode,{
						target: t , transitionDir: -1,
						params: {'edit' : true, doNotReload : true, 'id': window.AppData.details.params.id}
					})
				}
			},
			initializeList: function(){
				//window.registry = registry
				console.log('initializeng tag list')
				var tags = this.acc.get('label'),q
				console.log(tags, registry.byId(String(tags)))
				var list = this.accountPicker.getChildren()
				for (var i in list)
					list[i].set('checked',false)
				if(registry.byId(String(tags))){
						registry.byId(String(tags)).set('checked',true)
				}else if(q = window.AppData.accountStore.query({label: String(tags)})[0])
					if(registry.byId(String(q.id))){
						registry.byId(String(q.id)).set('checked',true)				
					}
				var list = query("#accountPicker .mblListItem")
				arrayUtil.forEach(list,function(li){
					if(!registry.byId(String(li.id))._onClickSetUp){
						registry.byId(String(li.id)).onClick = function(){
							var account = window.AppData.accountStore.get(this.id)
							registry.byId('newAccount').set('value', account.label);
						}
						registry.byId(String(li.id))._onClickSetUp = true
					}
				})
			}
		}
	}
);

},
'dojox/charting/themes/gradientGenerator':function(){
define(["dojo/_base/lang", "dojo/_base/array", "dojo/_base/Color", "../Theme", "dojox/color/_base", "./common"], 
	function(lang, arr, Color, Theme, dxcolor, themes){
	
	var gg = lang.getObject("gradientGenerator", true, themes);

	gg.generateFills = function(colors, fillPattern, lumFrom, lumTo){
		// summary:
		//		generates 2-color gradients using pure colors, a fill pattern, and two luminance values
		// colors: Array
		//		Array of colors to generate gradients for each.
		// fillPattern: Object
		//		Gradient fill descriptor which colors list will be generated.
		// lumFrom: Number
		//		Initial luminance value (0-100).
		// lumTo: Number
		//		Final luminance value (0-100).
		return arr.map(colors, function(c){	// Array
			return Theme.generateHslGradient(c, fillPattern, lumFrom, lumTo);
		});
	};
	
	gg.updateFills = function(themes, fillPattern, lumFrom, lumTo){
		// summary:
		//		transforms solid color fills into 2-color gradients using a fill pattern, and two luminance values
		// themes: Array
		//		Array of mini-themes (usually series themes or marker themes), which fill will be transformed.
		// fillPattern: Object
		//		Gradient fill descriptor which colors list will be generated.
		// lumFrom: Number
		//		Initial luminance value (0-100).
		// lumTo: Number
		//		Final luminance value (0-100).
		arr.forEach(themes, function(t){
			if(t.fill && !t.fill.type){
				t.fill = Theme.generateHslGradient(t.fill, fillPattern, lumFrom, lumTo);
			}
		});
	};
	
	gg.generateMiniTheme = function(colors, fillPattern, lumFrom, lumTo, lumStroke){
		// summary:
		//		generates mini-themes with 2-color gradients using colors, a fill pattern, and three luminance values
		// colors: Array
		//		Array of colors to generate gradients for each.
		// fillPattern: Object
		//		Gradient fill descriptor which colors list will be generated.
		// lumFrom: Number
		//		Initial luminance value (0-100).
		// lumTo: Number
		//		Final luminance value (0-100).
		// lumStroke: Number
		//		Stroke luminance value (0-100).
		return arr.map(colors, function(c){	// Array
			c = new dxcolor.Color(c);
			return {
				fill:   Theme.generateHslGradient(c, fillPattern, lumFrom, lumTo),
				stroke: {color: Theme.generateHslColor(c, lumStroke)}
			};
		});
	};
	
	gg.generateGradientByIntensity = function(color, intensityMap){
		// summary:
		//		generates gradient colors using an intensity map
		// color: dojo.Color
		//		Color to use to generate gradients.
		// intensityMap: Array
		//		Array of tuples {o, i}, where o is a gradient offset (0-1),
		//		and i is an intensity (0-255).
		color = new Color(color);
		return arr.map(intensityMap, function(stop){	// Array
			var s = stop.i / 255;
			return {
				offset: stop.o,
				color:  new Color([color.r * s, color.g * s, color.b * s, color.a])
			};
		});
	};
	
	return gg;
});

},
'money/views/tagspicker':function(){
define(["dijit/registry","dojo/_base/array","dojo/query","dojo/sniff","dojo/dom-class"],
    function(registry, arrayUtil, query, has, domClass){
 
		return window.AppData.objTags = {
			
			beforeActivate: function(){
				if(window.AppData.objDet){
					//this.tagsPicker.set('store',window.AppData.tagsStore)
					
					this.tagsPicker.set('store',window.AppData.tagsStore)
					this.tagsPicker.refresh()
					
					registry.byId('newTags').set('value', window.AppData.details.tags.get('label'));
					this.initializeList()
				}else{//if details view is not initialized goto details
					this.app.transitionToView(this.domNode, {target: 'details' , transitionDir: 1, params: { 'edit' : true } })
				}
			},
			init: function(){
				window.AppData.tagsPickerOverlay = this
				this.tagsPicker.set('store',window.AppData.tagsStore)
				if(has('isInitiallySmall')){
					domClass.remove	(this.domNode, "left");
				}
			},
			initializeList: function(){
				//window.registry = registry
				console.log('initializeng tag list')
				var tags = window.AppData.details.transaction.tags,q
				var taglis = window.AppData.tagsPickerOverlay.tagsPicker.getChildren()
				for (var i in taglis)
					taglis[i].set('checked',false)
				for (var i in tags){
					if(registry.byId(String(tags[i]))){
						registry.byId(String(tags[i])).set('checked',true)
					}else
					if(q = window.AppData.tagsStore.query({label: String(tags[i])})[0])
						if(registry.byId(q.id))
							registry.byId(q.id).set('checked',true)
				}
				var list = query("#tagsPicker .mblListItem")
				arrayUtil.forEach(list,function(li){
					if(!registry.byId(String(li.id))._onClickSetUp){
						registry.byId(String(li.id)).onClick = function(){
							var val = registry.byId('newTags').get('value');
							var tag = window.AppData.tagsStore.get(this.id)
							var tagl = String(tag.label).toLowerCase(), tagn = String(tag.label)
							//alert('current: '+val+ 'tag: '+tagn)
							if(val.toLowerCase().indexOf(tagl) + 1){
								var end = trim(val.substr(val.toLowerCase().indexOf(tagl)+tagl.length,val.length-1))
								var beg = trim(val.substr(0, val.toLowerCase().indexOf(tagl)))
								if(end.substr(0,1)==',') end = end.substr(1, end.length-1)
								else if(beg.substr(-1)==',') beg = beg.substr(0, beg.length-1)
								val =  beg + end;
							//	alert(beg + end)
							}else
								val += (val ? (', ' + tagn) : tagn)
							registry.byId('newTags').set('value', val);
						}
						registry.byId(String(li.id))._onClickSetUp = true
					}
				})
			}
		}
	}
);

},
'dojox/color/Palette':function(){
define(["dojo/_base/lang", "dojo/_base/array", "./_base"],
	function(lang, arr, dxc){

	/***************************************************************
	*	dojox.color.Palette
	*
	*	The Palette object is loosely based on the color palettes
	*	at Kuler (http://kuler.adobe.com).  They are 5 color palettes
	*	with the base color considered to be the third color in the
	*	palette (for generation purposes).
	*
	*	Palettes can be generated from well-known algorithms or they
	* 	can be manually created by passing an array to the constructor.
	*
	*	Palettes can be transformed, using a set of specific params
	*	similar to the way shapes can be transformed with dojox.gfx.
	*	However, unlike with transformations in dojox.gfx, transforming
	* 	a palette will return you a new Palette object, in effect
	* 	a clone of the original.
	***************************************************************/

	//	ctor ----------------------------------------------------------------------------
	dxc.Palette = function(/* String|Array|dojox.color.Color|dojox.color.Palette */base){
		// summary:
		//		An object that represents a palette of colors.
		// description:
		//		A Palette is a representation of a set of colors.  While the standard
		//		number of colors contained in a palette is 5, it can really handle any
		//		number of colors.
		//
		//		A palette is useful for the ability to transform all the colors in it
		//		using a simple object-based approach.  In addition, you can generate
		//		palettes using dojox.color.Palette.generate; these generated palettes
		//		are based on the palette generators at http://kuler.adobe.com.

		// colors: dojox.color.Color[]
		//		The actual color references in this palette.
		this.colors = [];
		if(base instanceof dxc.Palette){
			this.colors = base.colors.slice(0);
		}
		else if(base instanceof dxc.Color){
			this.colors = [ null, null, base, null, null ];
		}
		else if(lang.isArray(base)){
			this.colors = arr.map(base.slice(0), function(item){
				if(lang.isString(item)){ return new dxc.Color(item); }
				return item;
			});
		}
		else if (lang.isString(base)){
			this.colors = [ null, null, new dxc.Color(base), null, null ];
		}
	}

	//	private functions ---------------------------------------------------------------

	//	transformations
	function tRGBA(p, param, val){
		var ret = new dxc.Palette();
		ret.colors = [];
		arr.forEach(p.colors, function(item){
			var r=(param=="dr")?item.r+val:item.r,
				g=(param=="dg")?item.g+val:item.g,
				b=(param=="db")?item.b+val:item.b,
				a=(param=="da")?item.a+val:item.a
			ret.colors.push(new dxc.Color({
				r: Math.min(255, Math.max(0, r)),
				g: Math.min(255, Math.max(0, g)),
				b: Math.min(255, Math.max(0, b)),
				a: Math.min(1, Math.max(0, a))
			}));
		});
		return ret;
	}

	function tCMY(p, param, val){
		var ret = new dxc.Palette();
		ret.colors = [];
		arr.forEach(p.colors, function(item){
			var o=item.toCmy(),
				c=(param=="dc")?o.c+val:o.c,
				m=(param=="dm")?o.m+val:o.m,
				y=(param=="dy")?o.y+val:o.y;
			ret.colors.push(dxc.fromCmy(
				Math.min(100, Math.max(0, c)),
				Math.min(100, Math.max(0, m)),
				Math.min(100, Math.max(0, y))
			));
		});
		return ret;
	}

	function tCMYK(p, param, val){
		var ret = new dxc.Palette();
		ret.colors = [];
		arr.forEach(p.colors, function(item){
			var o=item.toCmyk(),
				c=(param=="dc")?o.c+val:o.c,
				m=(param=="dm")?o.m+val:o.m,
				y=(param=="dy")?o.y+val:o.y,
				k=(param=="dk")?o.b+val:o.b;
			ret.colors.push(dxc.fromCmyk(
				Math.min(100, Math.max(0, c)),
				Math.min(100, Math.max(0, m)),
				Math.min(100, Math.max(0, y)),
				Math.min(100, Math.max(0, k))
			));
		});
		return ret;
	}

	function tHSL(p, param, val){
		var ret = new dxc.Palette();
		ret.colors = [];
		arr.forEach(p.colors, function(item){
			var o=item.toHsl(),
				h=(param=="dh")?o.h+val:o.h,
				s=(param=="ds")?o.s+val:o.s,
				l=(param=="dl")?o.l+val:o.l;
			ret.colors.push(dxc.fromHsl(h%360, Math.min(100, Math.max(0, s)), Math.min(100, Math.max(0, l))));
		});
		return ret;
	}

	function tHSV(p, param, val){
		var ret = new dxc.Palette();
		ret.colors = [];
		arr.forEach(p.colors, function(item){
			var o=item.toHsv(),
				h=(param=="dh")?o.h+val:o.h,
				s=(param=="ds")?o.s+val:o.s,
				v=(param=="dv")?o.v+val:o.v;
			ret.colors.push(dxc.fromHsv(h%360, Math.min(100, Math.max(0, s)), Math.min(100, Math.max(0, v))));
		});
		return ret;
	}

	//	helper functions
	function rangeDiff(val, low, high){
		//	given the value in a range from 0 to high, find the equiv
		//		using the range low to high.
		return high-((high-val)*((high-low)/high));
	}

/*=====
var __transformArgs = {
	// summary:
	//		The keywords argument to be passed to the dojox.color.Palette.transform function.  Note that
	//		while all arguments are optional, *some* arguments must be passed.  The basic concept is that
	//		you pass a delta value for a specific aspect of a color model (or multiple aspects of the same
	//		color model); for instance, if you wish to transform a palette based on the HSV color model,
	//		you would pass one of "dh", "ds", or "dv" as a value.
	// use: String?
	//		Specify the color model to use for the transformation.  Can be "rgb", "rgba", "hsv", "hsl", "cmy", "cmyk".
	// dr: Number?
	//		The delta to be applied to the red aspect of the RGB/RGBA color model.
	// dg: Number?
	//		The delta to be applied to the green aspect of the RGB/RGBA color model.
	// db: Number?
	//		The delta to be applied to the blue aspect of the RGB/RGBA color model.
	// da: Number?
	//		The delta to be applied to the alpha aspect of the RGBA color model.
	// dc: Number?
	//		The delta to be applied to the cyan aspect of the CMY/CMYK color model.
	// dm: Number?
	//		The delta to be applied to the magenta aspect of the CMY/CMYK color model.
	// dy: Number?
	//		The delta to be applied to the yellow aspect of the CMY/CMYK color model.
	// dk: Number?
	//		The delta to be applied to the black aspect of the CMYK color model.
	// dh: Number?
	//		The delta to be applied to the hue aspect of the HSL/HSV color model.
	// ds: Number?
	//		The delta to be applied to the saturation aspect of the HSL/HSV color model.
	// dl: Number?
	//		The delta to be applied to the luminosity aspect of the HSL color model.
	// dv: Number?
	//		The delta to be applied to the value aspect of the HSV color model.
};
var __generatorArgs = {
	// summary:
	//		The keyword arguments object used to create a palette based on a base color.
	// base: dojo/_base/Color
	//		The base color to be used to generate the palette.
};
var __analogousArgs = {
	// summary:
	//		The keyword arguments object that is used to create a 5 color palette based on the
	//		analogous rules as implemented at http://kuler.adobe.com, using the HSV color model.
	// base: dojo/_base/Color
	//		The base color to be used to generate the palette.
	// high: Number?
	//		The difference between the hue of the base color and the highest hue.  In degrees, default is 60.
	// low: Number?
	//		The difference between the hue of the base color and the lowest hue.  In degrees, default is 18.
};
var __splitComplementaryArgs = {
	// summary:
	//		The keyword arguments object used to create a palette based on the split complementary rules
	//		as implemented at http://kuler.adobe.com.
	// base: dojo/_base/Color
	//		The base color to be used to generate the palette.
	// da: Number?
	//		The delta angle to be used to determine where the split for the complementary rules happen.
	//		In degrees, the default is 30.
};
=====*/

	//	object methods ---------------------------------------------------------------
	lang.extend(dxc.Palette, {
		transform: function(/*__transformArgs*/kwArgs){
			// summary:
			//		Transform the palette using a specific transformation function
			//		and a set of transformation parameters.
			// description:
			//		{palette}.transform is a simple way to uniformly transform
			//		all of the colors in a palette using any of 5 formulae:
			//		RGBA, HSL, HSV, CMYK or CMY.
			//
			//		Once the forumula to be used is determined, you can pass any
			//		number of parameters based on the formula "d"[param]; for instance,
			//		{ use: "rgba", dr: 20, dg: -50 } will take all of the colors in
			//		palette, add 20 to the R value and subtract 50 from the G value.
			//
			//		Unlike other types of transformations, transform does *not* alter
			//		the original palette but will instead return a new one.
			var fn=tRGBA;	//	the default transform function.
			if(kwArgs.use){
				//	we are being specific about the algo we want to use.
				var use=kwArgs.use.toLowerCase();
				if(use.indexOf("hs")==0){
					if(use.charAt(2)=="l"){ fn=tHSL; }
					else { fn=tHSV; }
				}
				else if(use.indexOf("cmy")==0){
					if(use.charAt(3)=="k"){ fn=tCMYK; }
					else { fn=tCMY; }
				}
			}
			//	try to guess the best choice.
			else if("dc" in kwArgs || "dm" in kwArgs || "dy" in kwArgs){
				if("dk" in kwArgs){ fn = tCMYK; }
				else { fn = tCMY; }
			}
			else if("dh" in kwArgs || "ds" in kwArgs){
				if("dv" in kwArgs){ fn = tHSV; }
				else { fn = tHSL; }
			}

			var palette = this;
			for(var p in kwArgs){
				//	ignore use
				if(p=="use"){ continue; }
				palette = fn(palette, p, kwArgs[p]);
			}
			return palette;		//	dojox.color.Palette
		},
		clone: function(){
			// summary:
			//		Clones the current palette.
			return new dxc.Palette(this);	//	dojox.color.Palette
		}
	});

	lang.mixin(dxc.Palette, {
		generators: {
			analogous:function(/* __analogousArgs */args){
				// summary:
				//		Create a 5 color palette based on the analogous rules as implemented at
				//		http://kuler.adobe.com.
				var high=args.high||60, 	//	delta between base hue and highest hue (subtracted from base)
					low=args.low||18,		//	delta between base hue and lowest hue (added to base)
					base = lang.isString(args.base)?new dxc.Color(args.base):args.base,
					hsv=base.toHsv();

				//	generate our hue angle differences
				var h=[
					(hsv.h+low+360)%360,
					(hsv.h+Math.round(low/2)+360)%360,
					hsv.h,
					(hsv.h-Math.round(high/2)+360)%360,
					(hsv.h-high+360)%360
				];

				var s1=Math.max(10, (hsv.s<=95)?hsv.s+5:(100-(hsv.s-95))),
					s2=(hsv.s>1)?hsv.s-1:21-hsv.s,
					v1=(hsv.v>=92)?hsv.v-9:Math.max(hsv.v+9, 20),
					v2=(hsv.v<=90)?Math.max(hsv.v+5, 20):(95+Math.ceil((hsv.v-90)/2)),
					s=[ s1, s2, hsv.s, s1, s1 ],
					v=[ v1, v2, hsv.v, v1, v2 ]

				return new dxc.Palette(arr.map(h, function(hue, i){
					return dxc.fromHsv(hue, s[i], v[i]);
				}));		//	dojox.color.Palette
			},

			monochromatic: function(/* __generatorArgs */args){
				// summary:
				//		Create a 5 color palette based on the monochromatic rules as implemented at
				//		http://kuler.adobe.com.
				var base = lang.isString(args.base)?new dxc.Color(args.base):args.base,
					hsv = base.toHsv();
				
				//	figure out the saturation and value
				var s1 = (hsv.s-30>9)?hsv.s-30:hsv.s+30,
					s2 = hsv.s,
					v1 = rangeDiff(hsv.v, 20, 100),
					v2 = (hsv.v-20>20)?hsv.v-20:hsv.v+60,
					v3 = (hsv.v-50>20)?hsv.v-50:hsv.v+30;

				return new dxc.Palette([
					dxc.fromHsv(hsv.h, s1, v1),
					dxc.fromHsv(hsv.h, s2, v3),
					base,
					dxc.fromHsv(hsv.h, s1, v3),
					dxc.fromHsv(hsv.h, s2, v2)
				]);		//	dojox.color.Palette
			},

			triadic: function(/* __generatorArgs */args){
				// summary:
				//		Create a 5 color palette based on the triadic rules as implemented at
				//		http://kuler.adobe.com.
				var base = lang.isString(args.base)?new dxc.Color(args.base):args.base,
					hsv = base.toHsv();

				var h1 = (hsv.h+57+360)%360,
					h2 = (hsv.h-157+360)%360,
					s1 = (hsv.s>20)?hsv.s-10:hsv.s+10,
					s2 = (hsv.s>90)?hsv.s-10:hsv.s+10,
					s3 = (hsv.s>95)?hsv.s-5:hsv.s+5,
					v1 = (hsv.v-20>20)?hsv.v-20:hsv.v+20,
					v2 = (hsv.v-30>20)?hsv.v-30:hsv.v+30,
					v3 = (hsv.v-30>70)?hsv.v-30:hsv.v+30;

				return new dxc.Palette([
					dxc.fromHsv(h1, s1, hsv.v),
					dxc.fromHsv(hsv.h, s2, v2),
					base,
					dxc.fromHsv(h2, s2, v1),
					dxc.fromHsv(h2, s3, v3)
				]);		//	dojox.color.Palette
			},

			complementary: function(/* __generatorArgs */args){
				// summary:
				//		Create a 5 color palette based on the complementary rules as implemented at
				//		http://kuler.adobe.com.
				var base = lang.isString(args.base)?new dxc.Color(args.base):args.base,
					hsv = base.toHsv();

				var h1 = ((hsv.h*2)+137<360)?(hsv.h*2)+137:Math.floor(hsv.h/2)-137,
					s1 = Math.max(hsv.s-10, 0),
					s2 = rangeDiff(hsv.s, 10, 100),
					s3 = Math.min(100, hsv.s+20),
					v1 = Math.min(100, hsv.v+30),
					v2 = (hsv.v>20)?hsv.v-30:hsv.v+30;

				return new dxc.Palette([
					dxc.fromHsv(hsv.h, s1, v1),
					dxc.fromHsv(hsv.h, s2, v2),
					base,
					dxc.fromHsv(h1, s3, v2),
					dxc.fromHsv(h1, hsv.s, hsv.v)
				]);		//	dojox.color.Palette
			},

			splitComplementary: function(/* __splitComplementaryArgs */args){
				// summary:
				//		Create a 5 color palette based on the split complementary rules as implemented at
				//		http://kuler.adobe.com.
				var base = lang.isString(args.base)?new dxc.Color(args.base):args.base,
					dangle = args.da || 30,
					hsv = base.toHsv();

				var baseh = ((hsv.h*2)+137<360)?(hsv.h*2)+137:Math.floor(hsv.h/2)-137,
					h1 = (baseh-dangle+360)%360,
					h2 = (baseh+dangle)%360,
					s1 = Math.max(hsv.s-10, 0),
					s2 = rangeDiff(hsv.s, 10, 100),
					s3 = Math.min(100, hsv.s+20),
					v1 = Math.min(100, hsv.v+30),
					v2 = (hsv.v>20)?hsv.v-30:hsv.v+30;

				return new dxc.Palette([
					dxc.fromHsv(h1, s1, v1),
					dxc.fromHsv(h1, s2, v2),
					base,
					dxc.fromHsv(h2, s3, v2),
					dxc.fromHsv(h2, hsv.s, hsv.v)
				]);		//	dojox.color.Palette
			},

			compound: function(/* __generatorArgs */args){
				// summary:
				//		Create a 5 color palette based on the compound rules as implemented at
				//		http://kuler.adobe.com.
				var base = lang.isString(args.base)?new dxc.Color(args.base):args.base,
					hsv = base.toHsv();

				var h1 = ((hsv.h*2)+18<360)?(hsv.h*2)+18:Math.floor(hsv.h/2)-18,
					h2 = ((hsv.h*2)+120<360)?(hsv.h*2)+120:Math.floor(hsv.h/2)-120,
					h3 = ((hsv.h*2)+99<360)?(hsv.h*2)+99:Math.floor(hsv.h/2)-99,
					s1 = (hsv.s-40>10)?hsv.s-40:hsv.s+40,
					s2 = (hsv.s-10>80)?hsv.s-10:hsv.s+10,
					s3 = (hsv.s-25>10)?hsv.s-25:hsv.s+25,
					v1 = (hsv.v-40>10)?hsv.v-40:hsv.v+40,
					v2 = (hsv.v-20>80)?hsv.v-20:hsv.v+20,
					v3 = Math.max(hsv.v, 20);

				return new dxc.Palette([
					dxc.fromHsv(h1, s1, v1),
					dxc.fromHsv(h1, s2, v2),
					base,
					dxc.fromHsv(h2, s3, v3),
					dxc.fromHsv(h3, s2, v2)
				]);		//	dojox.color.Palette
			},

			shades: function(/* __generatorArgs */args){
				// summary:
				//		Create a 5 color palette based on the shades rules as implemented at
				//		http://kuler.adobe.com.
				var base = lang.isString(args.base)?new dxc.Color(args.base):args.base,
					hsv = base.toHsv();

				var s  = (hsv.s==100 && hsv.v==0)?0:hsv.s,
					v1 = (hsv.v-50>20)?hsv.v-50:hsv.v+30,
					v2 = (hsv.v-25>=20)?hsv.v-25:hsv.v+55,
					v3 = (hsv.v-75>=20)?hsv.v-75:hsv.v+5,
					v4 = Math.max(hsv.v-10, 20);

				return new dxc.Palette([
					new dxc.fromHsv(hsv.h, s, v1),
					new dxc.fromHsv(hsv.h, s, v2),
					base,
					new dxc.fromHsv(hsv.h, s, v3),
					new dxc.fromHsv(hsv.h, s, v4)
				]);		//	dojox.color.Palette
			}
		},
		generate: function(/* String|dojox.color.Color */base, /* Function|String */type){
			// summary:
			//		Generate a new Palette using any of the named functions in
			//		dojox.color.Palette.generators or an optional function definition.  Current
			//		generators include "analogous", "monochromatic", "triadic", "complementary",
			//		"splitComplementary", and "shades".
			if(lang.isFunction(type)){
				return type({ base: base });	//	dojox.color.Palette
			}
			else if(dxc.Palette.generators[type]){
				return dxc.Palette.generators[type]({ base: base });	//	dojox.color.Palette
			}
			throw new Error("dojox.color.Palette.generate: the specified generator ('" + type + "') does not exist.");
		}
	});
	
	return dxc.Palette;
});

},
'dojox/lang/functional/fold':function(){
define(["dojo/_base/lang", "dojo/_base/array", "dojo/_base/kernel", "./lambda"],
	function(lang, arr, kernel, df){

// This module adds high-level functions and related constructs:
//	- "fold" family of functions

// Notes:
//	- missing high-level functions are provided with the compatible API:
//		foldl, foldl1, foldr, foldr1
//	- missing JS standard functions are provided with the compatible API:
//		reduce, reduceRight
//	- the fold's counterpart: unfold

// Defined methods:
//	- take any valid lambda argument as the functional argument
//	- operate on dense arrays
//	- take a string as the array argument
//	- take an iterator objects as the array argument (only foldl, foldl1, and reduce)

	var empty = {};

	lang.mixin(df, {
		// classic reduce-class functions
		foldl: function(/*Array|String|Object*/ a, /*Function*/ f, /*Object*/ z, /*Object?*/ o){
			// summary:
			//		repeatedly applies a binary function to an array from left
			//		to right using a seed value as a starting point; returns the final
			//		value.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || kernel.global; f = df.lambda(f);
			var i, n;
			if(lang.isArray(a)){
				// array
				for(i = 0, n = a.length; i < n; z = f.call(o, z, a[i], i, a), ++i);
			}else if(typeof a.hasNext == "function" && typeof a.next == "function"){
				// iterator
				for(i = 0; a.hasNext(); z = f.call(o, z, a.next(), i++, a));
			}else{
				// object/dictionary
				for(i in a){
					if(!(i in empty)){
						z = f.call(o, z, a[i], i, a);
					}
				}
			}
			return z;	// Object
		},
		foldl1: function(/*Array|String|Object*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary:
			//		repeatedly applies a binary function to an array from left
			//		to right; returns the final value.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || kernel.global; f = df.lambda(f);
			var z, i, n;
			if(lang.isArray(a)){
				// array
				z = a[0];
				for(i = 1, n = a.length; i < n; z = f.call(o, z, a[i], i, a), ++i);
			}else if(typeof a.hasNext == "function" && typeof a.next == "function"){
				// iterator
				if(a.hasNext()){
					z = a.next();
					for(i = 1; a.hasNext(); z = f.call(o, z, a.next(), i++, a));
				}
			}else{
				// object/dictionary
				var first = true;
				for(i in a){
					if(!(i in empty)){
						if(first){
							z = a[i];
							first = false;
						}else{
							z = f.call(o, z, a[i], i, a);
						}
					}
				}
			}
			return z;	// Object
		},
		foldr: function(/*Array|String*/ a, /*Function|String|Array*/ f, /*Object*/ z, /*Object?*/ o){
			// summary:
			//		repeatedly applies a binary function to an array from right
			//		to left using a seed value as a starting point; returns the final
			//		value.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || kernel.global; f = df.lambda(f);
			for(var i = a.length; i > 0; --i, z = f.call(o, z, a[i], i, a));
			return z;	// Object
		},
		foldr1: function(/*Array|String*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary:
			//		repeatedly applies a binary function to an array from right
			//		to left; returns the final value.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || kernel.global; f = df.lambda(f);
			var n = a.length, z = a[n - 1], i = n - 1;
			for(; i > 0; --i, z = f.call(o, z, a[i], i, a));
			return z;	// Object
		},
		// JS 1.8 standard array functions, which can take a lambda as a parameter.
		reduce: function(/*Array|String|Object*/ a, /*Function|String|Array*/ f, /*Object?*/ z){
			// summary:
			//		apply a function simultaneously against two values of the array
			//		(from left-to-right) as to reduce it to a single value.
			return arguments.length < 3 ? df.foldl1(a, f) : df.foldl(a, f, z);	// Object
		},
		reduceRight: function(/*Array|String*/ a, /*Function|String|Array*/ f, /*Object?*/ z){
			// summary:
			//		apply a function simultaneously against two values of the array
			//		(from right-to-left) as to reduce it to a single value.
			return arguments.length < 3 ? df.foldr1(a, f) : df.foldr(a, f, z);	// Object
		},
		// the fold's counterpart: unfold
		unfold: function(/*Function|String|Array*/ pr, /*Function|String|Array*/ f,
						/*Function|String|Array*/ g, /*Object*/ z, /*Object?*/ o){
			// summary:
			//		builds an array by unfolding a value
			o = o || kernel.global; f = df.lambda(f); g = df.lambda(g); pr = df.lambda(pr);
			var t = [];
			for(; !pr.call(o, z); t.push(f.call(o, z)), z = g.call(o, z));
			return t;	// Array
		}
	});
});

},
'money/Application':function(){
// we use 'define' and not 'require' to workaround Dojo build system
// limitation that prevents from making of this file a layer if it
// using 'require'
define([
	"dojo/sniff", "dojo/json", "dojo/dom-class", "dojo/currency",
	"dojo/text!./conf.json", 'dojo/date/locale','dojo/date',
	
	 "dojox/app/main", "dojo/hash","dojox/mobile/SimpleDialog",'money/numberpicker',
	 "dojox/mobile/Button","dojox/mobile/Pane","dojox/mobile/GridLayout","dojox/mobile/ToolBarButton","dojo/_base/declare","dijit/registry",
	],
	function(has, json, domClass, currency, config, locale, dojodate, Application, hash, Dlg, NumberPicker){
		//new legacyNls()
		/*window.addEventListener('load', function() {
			FastClick.attach(document.body);
		}, false);*/
		//console.log(config)
		hash("")
		window.AppData.localeCurrency = currency
		
		
		
		window.hideProgress = function(){
			console.log('hide progress')
			require(["dojo/dom-style","dojo/_base/fx"], function(domStyle, fx){
				fx.fadeOut({
					node: 'main-progress-bar',
					duration: 500
				}).play()
				setTimeout(function(){
					domStyle.set('main-progress-bar','display','none')
				},500)
			})
		}
		window.showProgress = function(){
			console.log('show progress')
			require(["dojo/dom-style","dojo/_base/fx"], function(domStyle, fx){
				domStyle.set('main-progress-bar','display','block')
				fx.fadeIn({
					node: 'main-progress-bar',
					duration: 200
				}).play()
			})
		}
		var small = 560, appConf = json.parse(config);
		// large > 860 medium <= 860  small <= 560 
		var isSmall = function(){				
			var width = window.innerWidth || document.documentElement.clientWidth;
			var height = window.innerHeight || document.documentElement.clientHeight;
			return !(width > small && height > small);
		};
		has.add("isInitiallySmall", isSmall());
		has.add("html5history", !has("ie") || has("ie") > 9);
		
		if(has("isInitiallySmall")){
			window.AppData.isInitiallySmall = true
			for(var i in appConf.views)
				appConf.views[i].constraint 	= "center"
			appConf.defaultView = "summary"
		}
		
		appConf.transition = localStorage.getItem( 'transition' ) ? localStorage.getItem( 'transition' ) : 'none'
		appConf.defaultTransition = localStorage.getItem( 'transition' ) ? localStorage.getItem( 'transition' ) : 'none'
		//window.AppData.currencies = json.parse(currencies)
		//window.AppData.rates = json.parse(rates)
		
		 if ( typeof fx !== "undefined" && fx.rates ) {
                fx.rates = window.AppData.rates.rates;
                fx.base = window.AppData.rates.base;
            } else {
                // If not, apply to fxSetup global:
                fxSetup = {
                    rates : window.AppData.rates.rates,
                    base : window.AppData.rates.base
                }
            }
            
        
        if(localStorage.getItem('dateFrom')){
			window.AppData.dateFrom = getDate( localStorage.getItem('dateFrom'), locale )
			window.AppData.timespanMonth = getDateString(dojodate.add( window.AppData.dateFrom, 'day', 1), locale).substr(0,7) + '-01'
		}
		if(localStorage.getItem('timespan') == "customTimespan"){
			window.AppData.timespanMonth = getDateString(new Date, locale).substr(0,7) + '-01'
			window.AppData.dateFrom = dojodate.add(getDate(window.AppData.timespanMonth, locale), 'day', -1)
			
		}
		if(window.AppData.dateFrom){
			var daysInMonth = dojodate.getDaysInMonth(dojodate.add(window.AppData.dateFrom ,'day', 1));
			window.AppData.dateTo = dojodate.add(window.AppData.dateFrom, 'day', daysInMonth+1)
		}
		console.log('DATE', window.AppData.dateFrom, window.AppData.dateTo)
		Application(appConf);
		var dlg = new Dlg({},'customPicker')
		
		
		
		if(!window.AppData.numberPicker){
			window.AppData.numberPicker = new NumberPicker({},'numberPicker')
			
			window.AppData.numberPicker.startup()
		}
});

},
'dojox/lang/functional/array':function(){
define(["dojo/_base/kernel", "dojo/_base/lang", "dojo/_base/array", "./lambda"],
	function(kernel, lang, arr, df){

// This module adds high-level functions and related constructs:
//	- array-processing functions similar to standard JS functions

// Notes:
//	- this module provides JS standard methods similar to high-level functions in dojo/_base/array.js:
//		forEach, map, filter, every, some

// Defined methods:
//	- take any valid lambda argument as the functional argument
//	- operate on dense arrays
//	- take a string as the array argument
//	- take an iterator objects as the array argument

	var empty = {};

	lang.mixin(df, {
		// JS 1.6 standard array functions, which can take a lambda as a parameter.
		// Consider using dojo._base.array functions, if you don't need the lambda support.
		filter: function(/*Array|String|Object*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary:
			//		creates a new array with all elements that pass the test
			//		implemented by the provided function.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || kernel.global; f = df.lambda(f);
			var t = [], v, i, n;
			if(lang.isArray(a)){
				// array
				for(i = 0, n = a.length; i < n; ++i){
					v = a[i];
					if(f.call(o, v, i, a)){ t.push(v); }
				}
			}else if(typeof a.hasNext == "function" && typeof a.next == "function"){
				// iterator
				for(i = 0; a.hasNext();){
					v = a.next();
					if(f.call(o, v, i++, a)){ t.push(v); }
				}
			}else{
				// object/dictionary
				for(i in a){
					if(!(i in empty)){
						v = a[i];
						if(f.call(o, v, i, a)){ t.push(v); }
					}
				}
			}
			return t;	// Array
		},
		forEach: function(/*Array|String|Object*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary:
			//		executes a provided function once per array element.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || kernel.global; f = df.lambda(f);
			var i, n;
			if(lang.isArray(a)){
				// array
				for(i = 0, n = a.length; i < n; f.call(o, a[i], i, a), ++i);
			}else if(typeof a.hasNext == "function" && typeof a.next == "function"){
				// iterator
				for(i = 0; a.hasNext(); f.call(o, a.next(), i++, a));
			}else{
				// object/dictionary
				for(i in a){
					if(!(i in empty)){
						f.call(o, a[i], i, a);
					}
				}
			}
			return o;	// Object
		},
		map: function(/*Array|String|Object*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary:
			//		creates a new array with the results of calling
			//		a provided function on every element in this array.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || kernel.global; f = df.lambda(f);
			var t, n, i;
			if(lang.isArray(a)){
				// array
				t = new Array(n = a.length);
				for(i = 0; i < n; t[i] = f.call(o, a[i], i, a), ++i);
			}else if(typeof a.hasNext == "function" && typeof a.next == "function"){
				// iterator
				t = [];
				for(i = 0; a.hasNext(); t.push(f.call(o, a.next(), i++, a)));
			}else{
				// object/dictionary
				t = [];
				for(i in a){
					if(!(i in empty)){
						t.push(f.call(o, a[i], i, a));
					}
				}
			}
			return t;	// Array
		},
		every: function(/*Array|String|Object*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary:
			//		tests whether all elements in the array pass the test
			//		implemented by the provided function.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || kernel.global; f = df.lambda(f);
			var i, n;
			if(lang.isArray(a)){
				// array
				for(i = 0, n = a.length; i < n; ++i){
					if(!f.call(o, a[i], i, a)){
						return false;	// Boolean
					}
				}
			}else if(typeof a.hasNext == "function" && typeof a.next == "function"){
				// iterator
				for(i = 0; a.hasNext();){
					if(!f.call(o, a.next(), i++, a)){
						return false;	// Boolean
					}
				}
			}else{
				// object/dictionary
				for(i in a){
					if(!(i in empty)){
						if(!f.call(o, a[i], i, a)){
							return false;	// Boolean
						}
					}
				}
			}
			return true;	// Boolean
		},
		some: function(/*Array|String|Object*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary:
			//		tests whether some element in the array passes the test
			//		implemented by the provided function.
			if(typeof a == "string"){ a = a.split(""); }
			o = o || kernel.global; f = df.lambda(f);
			var i, n;
			if(lang.isArray(a)){
				// array
				for(i = 0, n = a.length; i < n; ++i){
					if(f.call(o, a[i], i, a)){
						return true;	// Boolean
					}
				}
			}else if(typeof a.hasNext == "function" && typeof a.next == "function"){
				// iterator
				for(i = 0; a.hasNext();){
					if(f.call(o, a.next(), i++, a)){
						return true;	// Boolean
					}
				}
			}else{
				// object/dictionary
				for(i in a){
					if(!(i in empty)){
						if(f.call(o, a[i], i, a)){
							return true;	// Boolean
						}
					}
				}
			}
			return false;	// Boolean
		}
	});
	
	return df;
});

},
'dojox/charting/Theme':function(){
define(["dojo/_base/lang", "dojo/_base/declare", "dojo/_base/Color", "./SimpleTheme",
	    "dojox/color/_base", "dojox/color/Palette", "dojox/gfx/gradutils"],
	function(lang, declare, Color, SimpleTheme, colorX, Palette){
	
	var Theme = declare("dojox.charting.Theme", SimpleTheme, {
	// summary:
	//		A Theme is a pre-defined object, primarily JSON-based, that makes up the definitions to
	//		style a chart. It extends SimpleTheme with additional features like color definition by
	//		palettes and gradients definition.
	});

	/*=====
	var __DefineColorArgs = {
		// summary:
		//		The arguments object that can be passed to define colors for a theme.
		// num: Number?
		//		The number of colors to generate.  Defaults to 5.
		// colors: String[]|dojo/_base/Color[]?
		//		A pre-defined set of colors; this is passed through to the Theme directly.
		// hue: Number?
		//		A hue to base the generated colors from (a number from 0 - 359).
		// saturation: Number?
		//		If a hue is passed, this is used for the saturation value (0 - 100).
		// low: Number?
		//		An optional value to determine the lowest value used to generate a color (HSV model)
		// high: Number?
		//		An optional value to determine the highest value used to generate a color (HSV model)
		// base: String|dojo/_base/Color?
		//		A base color to use if we are defining colors using dojox.color.Palette
		// generator: String?
		//		The generator function name from dojox/color/Palette.
	};
	=====*/
	lang.mixin(Theme, {

		defineColors: function(kwArgs){
			// summary:
			//		Generate a set of colors for the theme based on keyword
			//		arguments.
			// kwArgs: __DefineColorArgs
			//		The arguments object used to define colors.
			// returns: dojo/_base/Color[]
			//		An array of colors for use in a theme.
			//
			// example:
			//	|	var colors = Theme.defineColors({
			//	|		base: "#369",
			//	|		generator: "compound"
			//	|	});
			//
			// example:
			//	|	var colors = Theme.defineColors({
			//	|		hue: 60,
			//	|		saturation: 90,
			//	|		low: 30,
			//	|		high: 80
			//	|	});
			kwArgs = kwArgs || {};
			var l, c = [], n = kwArgs.num || 5;	// the number of colors to generate
			if(kwArgs.colors){
				// we have an array of colors predefined, so fix for the number of series.
				l = kwArgs.colors.length;
				for(var i = 0; i < n; i++){
					c.push(kwArgs.colors[i % l]);
				}
				return c;	//	dojo.Color[]
			}
			if(kwArgs.hue){
				// single hue, generate a set based on brightness
				var s = kwArgs.saturation || 100,	// saturation
					st = kwArgs.low || 30,
					end = kwArgs.high || 90;
				// we'd like it to be a little on the darker side.
				l = (end + st) / 2;
				// alternately, use "shades"
				return Palette.generate(
					colorX.fromHsv(kwArgs.hue, s, l), "monochromatic"
				).colors;
			}
			if(kwArgs.generator){
				//	pass a base color and the name of a generator
				return colorX.Palette.generate(kwArgs.base, kwArgs.generator).colors;
			}
			return c;	//	dojo.Color[]
		},

		generateGradient: function(fillPattern, colorFrom, colorTo){
			var fill = lang.delegate(fillPattern);
			fill.colors = [
				{offset: 0, color: colorFrom},
				{offset: 1, color: colorTo}
			];
			return fill;
		},

		generateHslColor: function(color, luminance){
			color = new Color(color);
			var hsl    = color.toHsl(),
				result = colorX.fromHsl(hsl.h, hsl.s, luminance);
			result.a = color.a;	// add missing opacity
			return result;
		},

		generateHslGradient: function(color, fillPattern, lumFrom, lumTo){
			color = new Color(color);
			var hsl       = color.toHsl(),
				colorFrom = colorX.fromHsl(hsl.h, hsl.s, lumFrom),
				colorTo   = colorX.fromHsl(hsl.h, hsl.s, lumTo);
			colorFrom.a = colorTo.a = color.a;	// add missing opacity
			return Theme.generateGradient(fillPattern, colorFrom, colorTo);	// Object
		}
	});

	// for compatibility
	Theme.defaultMarkers = SimpleTheme.defaultMarkers;
	Theme.defaultColors = SimpleTheme.defaultColors;
	Theme.defaultTheme = SimpleTheme.defaultTheme;

	return Theme;
});

},
'money/views/backup':function(){
define([
	"dojo/json","dojo/on","dojo/dom-style","dojo/dom-class",
	"dojo/sniff","dojox/mobile/ProgressIndicator","dojo/_base/array",
	"dojox/mobile/Button", "dojo/date/locale","money/dialog"
 ],
    function(json, on, domStyle, domClass,has, ProgressIndicator, arrayUtil,Button, locale, Dialog){
    
	return window.AppData.objBackup = {
		beforeActivate: function(){			
			domStyle.set("online","display",navigator.onLine ? "" : "none")
			domStyle.set("offline","display",navigator.onLine ? "none" : "")
			
			setInterval(function(){
				console.log(navigator.onLine)
				domStyle.set("online","display",navigator.onLine ? "" : "none")
				domStyle.set("offline","display",navigator.onLine ? "none" : "")
			},1000)
			this.loginBtn.set('label',window.AppData.client.isAuthenticated() ? this.nls.unlinkDropbox : this.nls.linkDropbox)
			domStyle.set('backup-download','display',window.AppData.client.isAuthenticated()? "" : "none")
        },
        init: function(){
			if(!has('isInitiallySmall'))
				domClass.add(this.backButton.domNode,'hideOnMedium hideOnLarge')
			var self = this
			
			this.loginBtn._onTouchStart = function(){
				if(!window.AppData.client.isAuthenticated())
					window.AppData.client.authenticate();
				else{
					window.AppData.client.signOut();
					domStyle.set('backup-download','display', "none")
					this.set('label',self.nls.unlinkDropbox)
				}
			}
			var self = this
			
			on(this.syncBtn,'click',function(){
				self.doSync()
			})
			on(this.clearBtn,'click',function(){
				self.doSync(1)
			})
			on(this.clearTransBtn,'click',function(){
				self.doSync(3)
			})
			on(this.clearAllBtn,'click',function(){
				self.doSync(4)
			})
			console.log(this.loginBtn, this.syncBtn)
			this.dlg = window.AppData.dialogWindow ? window.AppData.dialogWindow : (window.AppData.dialogWindow = new Dialog);
				
        },
        doSync: function(flag){
			var self = this, client = window.AppData.client;
			
			if(client.isAuthenticated() || flag == 4 || flag == 3){
				console.log('showing dlg')
				this.dlg.show(true, "Processing...", "Sync to Dropbox" ,"Cancel")
				console.log('shown')
				
				if(!this.datastore && flag != 4 && flag != 3){
					try{
						var datastoreManager = client.getDatastoreManager();
						console.log(datastoreManager)
					}catch(e){
						alert('Dropbox datastore manager is not available')
						console.log(e)
					}
					datastoreManager.openDefaultDatastore(function (error, datastore) {
						if (error) {
							alert('Error opening default datastore: ' + error);
						}
						// Now you have a datastore. The next few examples can be included here.
						self.datastore = datastore
						self._doSync(self.datastore, flag)
						self.dlg.hide();
						self.dlg.show(false, "Task complete"+((flag==4||flag==3)?"<br/>Application will be restarted":""), "Backup & Restore" ,"Ok", function(){
							if(flag == 3 || flag == 4)
								location.reload()
						})
					});
				}else{
					self._doSync(self.datastore ? self.datastore : null, flag)
					this.dlg.hide();
					this.dlg.show(false, "Task complete"+((flag==4||flag==3)?"<br/>Application will be restarted":""), "Backup & Restore" ,"Ok",function(){
						if(flag == 3 || flag == 4)
							location.reload()
					})
				}
				
			}
		},
		_doSync: function(datastore, flag){
			//require("money/dialog", function(Dialog){
				var flag = flag || 0; //0 - sync, 1 - clear dropbox, 2 - restore from dropbox, 3 - clear transactions, 4 - clear all
				if(flag != 4 && flag != 3){
					var table = datastore.getTable('settings');
					var currency = table.query({id: 'hc'}).length ? table.query({id: 'hc'})[0].get('value') : false
				
					if(flag == 0){
						if(!currency) 
							table.insert({
								'id' : 'hc',
								'value' : window.AppData.currency
							})
						else if(currency != window.AppData.currency){
							this.dlg.show(false,'Home currencies don\'t match. Please, clear dropbox data or clear local data and set the same home currency as in Dropbox',"Backup & Restore","ok");
							return
						}
					}
				}
				
				this._syncAccounts(datastore, flag);
				this._syncTags(datastore, flag);
				var self = this
				setTimeout(function(){
					self._syncTransactions(datastore, flag);
				}, 3000)
				
				
				
			//})
		},
		_syncAccounts: function(datastore, flag){
			var deleted = localStorage.getItem('deletedAccounts') ? json.parse(localStorage.getItem('deletedAccounts')) : [];
			
					
			switch (flag)  {
				case 4 :
					arrayUtil.forEach(window.AppData.accountStore.query(),function(item){
						window.AppData.accountStore.remove(item.id);
					})
					localStorage.removeItem('deletedAccounts');
					window.AppData.store._setAccounts(window.AppData.store.getAccounts())
				case 3 :
					break;
				case 1 : 
					var table = datastore.getTable('accounts');
					var table4deleted = datastore.getTable('accountsDel');
					var remoteDeleted = table4deleted.query()
					
					var all = table.query()
					for(var i=0; i<remoteDeleted.length; i++){
						if(table4deleted.query({id: remoteDeleted[i].get('id')}).length)
							table4deleted.query({id: remoteDeleted[i].get('id')})[0].deleteRecord()
					}
					for(var i=0; i<all.length; i++){
						if(table.query({id: all[i].get('id')}).length)
							table.query({id: all[i].get('id')})[0].deleteRecord()
					}
					break;
				case 0 : 
					var table = datastore.getTable('accounts');
					var table4deleted = datastore.getTable('accountsDel');
					var remoteDeleted = table4deleted.query()
					
					for(var i = 0; i<remoteDeleted.length; i++)
						if(window.AppData.store.getAccount(remoteDeleted[i].get('id')))
							window.AppData.store.removeAccount(remoteDeleted[i].get('id'))
			
					for(var i=0; i<deleted.length; i++){
						if(!table4deleted.query({id: deleted[i]}).length)
							table4deleted.insert({id: deleted[i]})
						if(table.query({id: Number(deleted[i])}).length)
							table.query({id: Number(deleted[i])})[0].deleteRecord()
					}
					localStorage.removeItem('deletedAccounts');
					var results = table.query();
			
					for(var i in results){
						record = results[i];
						var localRecord = window.AppData.store.getAccount(record.get('id'))
						if(!localRecord)
							localRecord = window.AppData.store.putAccount({
								id : record.get('id'),
								et : record.get('et'),
								startAmount: record.get('startAmount'),
								label: record.get('label'),
								currency: record.get('currency'),
								maincur: record.get('maincur')
							})
						else if(record.get('et') < localRecord.et){
							record.set('maincur', localRecord.maincur);
							record.set('label', localRecord.label);
							record.set('startAmount', localRecord.startAmount);
							record.set('et', localRecord.et);					
							record.set('currency', localRecord.currency);
						}else{
							localRecord.label = record.get('label')
							localRecord.maincur = record.get('maincur')
							localRecord.currency = record.get('currency')
							localRecord.startAmount = record.get('startAmount')
							localRecord.et = record.get('et')
							window.AppData.store.putAccount(localRecord)
						}
					}
					//var records = event.affectedRecordsForTable('accounts');
					var accs = window.AppData.store.getAccounts()
					for(var i = 0; i<accs.length; i++ ){
						var localRecord = accs[i]
						if(!table.query({id:localRecord.id}).length){
							table.insert({
								'label': localRecord.label,
								'startAmount': localRecord.startAmount,
								'et': localRecord.et,
								'id': localRecord.id,
								'currency': localRecord.currency,
								'maincur': localRecord.maincur
							})
						}
					}
					window.AppData.store._setAccounts(window.AppData.store.getAccounts())
					console.log('dones')
			}
			
			
		},
		
		_syncTags: function(datastore, flag){
			
			switch (flag)  {
				case 4 :
					arrayUtil.forEach(window.AppData.tagsStore.query(),function(item){
						window.AppData.tagsStore.remove(item.id);
					})
					localStorage.removeItem('deletedTags');
					window.AppData.store._setTags(window.AppData.store.getTags())
					break;
				case 3 : 
					break;
				case 1 : 
					var table = datastore.getTable('tags');
					var table4deleted = datastore.getTable('tagsDel');
					var remoteDeleted = table4deleted.query()
			
					var all = table.query()
					for(var i=0; i<remoteDeleted.length; i++){
						if(table4deleted.query({id: remoteDeleted[i].get('id')}).length)
							table4deleted.query({id: remoteDeleted[i].get('id')})[0].deleteRecord()
					}
					for(var i=0; i<all.length; i++){
						if(table.query({id: all[i].get('id')}).length)
							table.query({id: all[i].get('id')})[0].deleteRecord()
					}
					break;
				case 0 : 
					var table = datastore.getTable('tags');
					var table4deleted = datastore.getTable('tagsDel');
					var remoteDeleted = table4deleted.query()
			
					for(var i = 0; i<remoteDeleted.length; i++)
						if(window.AppData.store.getTag(remoteDeleted[i].get('id')))
							window.AppData.store.removeTag(remoteDeleted[i].get('id'))
							
					var deleted = localStorage.getItem('deletedTags') ? json.parse(localStorage.getItem('deletedTags')) : [];
					for(var i=0; i<deleted.length; i++){
						if(!table4deleted.query({id: deleted[i]}).length)
							table4deleted.insert({id: deleted[i]})
						if(table.query({id: Number(deleted[i])}).length)
							table.query({id: Number(deleted[i])})[0].deleteRecord()
					}
					localStorage.removeItem('deletedTags');
					var results = table.query();
					
					for(var i=0;i<results.length;i++){
						record = results[i];
						var localRecord = window.AppData.store.getTag(record.get('id'))
						alert(record.get('label'));
						if(!localRecord)
							localRecord = window.AppData.store.putTag({
								id : record.get('id'),
								et : record.get('et'),
								label: record.get('label')
							})
						else if(record.get('et') < localRecord.et){
							record.set('label', localRecord.label);
							record.set('et', localRecord.et);					
						}else{
							localRecord.label = record.get('label')
							localRecord.et = record.get('et')
							window.AppData.store.putTag(localRecord)
						}
					}
					var accs = window.AppData.store.getTags()
					console.log(accs)
					for(var i = 0; i<accs.length; i++ ){
						var localRecord = accs[i]
						if( !table.query( {id : localRecord.id }).length )
							table.insert({
								'label': localRecord.label,
								'et': localRecord.et,
								'id': localRecord.id
							})
					}
					window.AppData.store._setTags(window.AppData.store.getTags())
					console.log('done with tags')
				}
		},
		
		_syncTransactions: function(datastore, flag){
			
			switch (flag)  {
				case 4 :
				case 3 :
					arrayUtil.forEach(window.AppData.store.query(),function(item){
						window.AppData.store.removeItem(item.id);
					})
					localStorage.removeItem('deleted');
					localStorage.removeItem('currency')
					break;
				case 1 : 
					var table = datastore.getTable('trans');
					/*arrayUtil.forEach(table.query(),function(item){
						item.deleteRecord()
					})*/
					
					var table4deleted = datastore.getTable('transDel');
					var remoteDeleted = table4deleted.query()
			
					var all = table.query()
					for(var i=0; i<remoteDeleted.length; i++){
						if(table4deleted.query({id: remoteDeleted[i].get('id')}).length)
							table4deleted.query({id: remoteDeleted[i].get('id')})[0].deleteRecord()
					}
					for(var i=0; i<all.length; i++){
						if(table.query({id: all[i].get('id')}).length)
							table.query({id: all[i].get('id')})[0].deleteRecord()
					}
					break;
				case 0 : 
			var table = datastore.getTable('trans');
			/*arrayUtil.forEach(table.query(),function(item){
				item.deleteRecord()
			})*/
			
			var table4deleted = datastore.getTable('transDel');
			var remoteDeleted = table4deleted.query()
			
			for(var i = 0; i<remoteDeleted.length; i++)
				if(window.AppData.store.getItem(remoteDeleted[i].get('id')))
					window.AppData.store.removeItem(remoteDeleted[i].get('id'))
			
			var deleted = localStorage.getItem('deleted') ? json.parse(localStorage.getItem('deleted')) : [];
			for(var i=0; i<deleted.length; i++){
				if(!table4deleted.query({id: deleted[i]}).length)
					table4deleted.insert({id: deleted[i]})
				
				if(table.query({id: Number(deleted[i])}).length)
					table.query({id: Number(deleted[i])})[0].deleteRecord()
			}
			localStorage.removeItem('deleted');
			var results = table.query();
			
			for(var i in results){
				record = results[i];
				var localRecord = window.AppData.store.getItem(record.get('id'))
				if(!localRecord){
					localRecord = window.AppData.store.putItem({
						id 		: record.get('id'),
						et 		: record.get('e'),
						amount 	: record.get('a'),
						amountHome : record.get('z'),
						tags	: record.get('t')._array(),
						type	: record.get('d'),
						descr	: record.get('g') ? record.get('g') : "",
						account : record.get('b'),
						date	: locale.parse(record.get('f'), {selector:"date", datePattern:window.AppData.widgetDateFormat}),
						accountTo : record.get('c')	? record.get('c') : undefined,
						sumTo 	: record.get('s')	? record.get('s') : undefined
					})
					
						
				}
				else if(record.get('e') < localRecord.et){
					
						record.set('e',localRecord.et)
						record.set('a',localRecord.amount)
						record.set('z',localRecord.amountHome)
						record.set('t',localRecord.tags)
						record.set('d',localRecord.type)
						record.set('g',localRecord.descr)
						record.set('b',localRecord.account)
						if(localRecord.accountTo) {
							record.set('c',localRecord.accountTo)
							record.set('s',localRecord.sumTo)
						}
						record.set('f',locale.format(localRecord.date, {selector:"date", datePattern:window.AppData.widgetDateFormat}))
				}else{
					localRecord.et = record.get('e')
					localRecord.amount = record.get('a')
					localRecord.amountHome = record.get('z')
					localRecord.tags = record.get('t')._array()
					localRecord.type = record.get('d')
					localRecord.account = record.get('b')
					localRecord.descr = record.get('g') ? record.get('g') : ""
					
					if(record.get('c')) {
						localRecord.accountTo = record.get('c')
						localRecord.sumTo = record.get('s')
					}
					localRecord.date = locale.parse(record.get('f'), {selector:"date", datePattern:window.AppData.widgetDateFormat})
				}
			}
			var accs = window.AppData.store.queryItems()
			for(var i = 0; i<accs.length; i++ ){
				var localRecord = accs[i]
				if(!table.query({id:localRecord.id}).length){
					record = table.insert({
						'e'	: localRecord.et,
						'id': localRecord.id,
						'a'	: localRecord.amount,
						'z'	: localRecord.amountHome,
						't'	: localRecord.tags,
						'd'	: localRecord.type,
						'b'	: localRecord.account,
						'g'	: localRecord.descr,
						'f'	: locale.format(localRecord.date, {selector:"date", datePattern:window.AppData.widgetDateFormat})
					})
					if(localRecord.accountTo){
						record.set('c',localRecord.accountTo)
						record.set('s',localRecord.sumTo)
					}
				}
			}
			console.log('done with trans')
			}
		}
    };
});

},
'dojox/gesture/swipe':function(){
define([
	"dojo/_base/kernel",
	"dojo/_base/declare",
	"./Base",
	"../main"
], function(kernel, declare, Base, dojox){
// module:
//		dojox/gesture/swipe

/*=====
	dojox.gesture.swipe = {
		// summary:
		//		This module provides swipe gestures including:
		//
		//		####dojox.gesture.swipe
		//
		//		A series of 'swipe' will be fired during touchmove, this will mostly
		//		be used to keep sliding the Dom target based on the swiped distance(dx, dy).
		//
		//		####dojox.gesture.swipe.end
		//	
		//		Fired when a swipe is ended so that an bounce animation may be applied
		//		to the dom target sliding to the final position.
		//
		//		Following information will be included in the fired swipe events:
		//
		//		1. type: 'swipe'|'swipe.end'
		//		2. time: an integer indicating the delta time(in milliseconds)
		//		3. dx: delta distance on X axis, dx less than 0 - moving left, dx larger than 0 - moving right
		//		4. dy: delta distance on Y axis, dy less than 0 - moving up, dY larger than 0 - moving down
		//
		//		Note - dx and dy can also be used together for a hybrid swipe(both vertically and horizontally)
		//
		// example:
		//		A. Used with dojo.connect()
		//		|	dojo.connect(node, dojox.gesture.swipe, function(e){});
		//		|	dojo.connect(node, dojox.gesture.swipe.end, function(e){});
		//
		//		B. Used with dojo.on
		//		|	define(['dojo/on', 'dojox/gesture/swipe'], function(on, swipe){
		//		|		on(node, swipe, function(e){});
		//		|		on(node, swipe.end, function(e){});
		//
		//		C. Used with dojox.gesture.swipe.* directly
		//		|	dojox.gesture.swipe(node, function(e){});
		//		|	dojox.gesture.swipe.end(node, function(e){});
	};
=====*/

kernel.experimental("dojox.gesture.swipe");

// Declare an internal anonymous class which will only be exported
// by module return value e.g. dojox.gesture.swipe.Swipe
var clz = declare(/*===== "dojox.gesture.swipe", =====*/Base, {

	// defaultEvent: [readonly] String
	//		Default event - 'swipe'
	defaultEvent: "swipe",

	// subEvents: [readonly] Array
	//		List of sub events, used by 
	//		being combined with defaultEvent as 'swipe.end'
	subEvents: ["end"],

	press: function(/*Object*/data, /*Event*/e){
		// summary:
		//		Overwritten, set initial swipe info
		if(e.touches && e.touches.length >= 2){
			//currently only support single-touch swipe
			delete data.context;
			return;
		}
		if(!data.context){
			data.context = {x: 0, y: 0, t: 0};
		}
		data.context.x = e.screenX;
		data.context.y = e.screenY;
		data.context.t = new Date().getTime();
		this.lock(e.currentTarget);
	},
	move: function(/*Object*/data, /*Event*/e){
		// summary:
		//		Overwritten, fire matched 'swipe' during touchmove
		this._recognize(data, e, "swipe");
	},
	release: function(/*Object*/data, /*Event*/e){
		// summary:
		//		Overwritten, fire matched 'swipe.end' when touchend
		this._recognize(data, e, "swipe.end");		
		delete data.context;
		this.unLock();
	},
	cancel: function(data, e){
		// summary:
		//		Overwritten
		delete data.context;
		this.unLock();
	},
	_recognize: function(/*Object*/data, /*Event*/e, /*String*/type){
		// summary:
		//		Recognize and fire appropriate gesture events
		if(!data.context){
			return;
		}
		var info = this._getSwipeInfo(data, e);
		if(!info){
			// no swipe happened
			return;
		}
		info.type = type;
		this.fire(e.target, info);
	},
	_getSwipeInfo: function(/*Object*/data, /*Event*/e){
		// summary:
		//		Calculate swipe information - time, dx and dy
		var dx, dy, info = {}, startData = data.context;
		
		info.time = new Date().getTime() - startData.t;
		
		dx = e.screenX - startData.x;
		dy = e.screenY - startData.y;
		
		if(dx === 0 && dy === 0){
			// no swipes happened
			return null;
		}
		info.dx = dx;
		info.dy = dy;
		return info;
	}
});

// the default swipe instance for handy use
dojox.gesture.swipe = new clz();
// Class for creating a new Swipe instance
dojox.gesture.swipe.Swipe = clz;

return dojox.gesture.swipe;

});
},
'dojo/store/Observable':function(){
define(["../_base/kernel", "../_base/lang", "../when", "../_base/array" /*=====, "./api/Store" =====*/
], function(kernel, lang, when, array /*=====, Store =====*/){

// module:
//		dojo/store/Observable

var Observable = function(/*Store*/ store){
	// summary:
	//		The Observable store wrapper takes a store and sets an observe method on query()
	//		results that can be used to monitor results for changes.
	//
	// description:
	//		Observable wraps an existing store so that notifications can be made when a query
	//		is performed.
	//
	// example:
	//		Create a Memory store that returns an observable query, and then log some
	//		information about that query.
	//
	//	|	var store = Observable(new Memory({
	//	|		data: [
	//	|			{id: 1, name: "one", prime: false},
	//	|			{id: 2, name: "two", even: true, prime: true},
	//	|			{id: 3, name: "three", prime: true},
	//	|			{id: 4, name: "four", even: true, prime: false},
	//	|			{id: 5, name: "five", prime: true}
	//	|		]
	//	|	}));
	//	|	var changes = [], results = store.query({ prime: true });
	//	|	var observer = results.observe(function(object, previousIndex, newIndex){
	//	|		changes.push({previousIndex:previousIndex, newIndex:newIndex, object:object});
	//	|	});
	//
	//		See the Observable tests for more information.

	var undef, queryUpdaters = [], revision = 0;
	// a Comet driven store could directly call notify to notify observers when data has
	// changed on the backend
	// create a new instance
	store = lang.delegate(store);
	
	store.notify = function(object, existingId){
		revision++;
		var updaters = queryUpdaters.slice();
		for(var i = 0, l = updaters.length; i < l; i++){
			updaters[i](object, existingId);
		}
	};
	var originalQuery = store.query;
	store.query = function(query, options){
		options = options || {};
		var results = originalQuery.apply(this, arguments);
		if(results && results.forEach){
			var nonPagedOptions = lang.mixin({}, options);
			delete nonPagedOptions.start;
			delete nonPagedOptions.count;

			var queryExecutor = store.queryEngine && store.queryEngine(query, nonPagedOptions);
			var queryRevision = revision;
			var listeners = [], queryUpdater;
			results.observe = function(listener, includeObjectUpdates){
				if(listeners.push(listener) == 1){
					// first listener was added, create the query checker and updater
					queryUpdaters.push(queryUpdater = function(changed, existingId){
						when(results, function(resultsArray){
							var atEnd = resultsArray.length != options.count;
							var i, l, listener;
							if(++queryRevision != revision){
								throw new Error("Query is out of date, you must observe() the query prior to any data modifications");
							}
							var removedObject, removedFrom = -1, insertedInto = -1;
							if(existingId !== undef){
								// remove the old one
								for(i = 0, l = resultsArray.length; i < l; i++){
									var object = resultsArray[i];
									if(store.getIdentity(object) == existingId){
										removedObject = object;
										removedFrom = i;
										if(queryExecutor || !changed){// if it was changed and we don't have a queryExecutor, we shouldn't remove it because updated objects would be eliminated
											resultsArray.splice(i, 1);
										}
										break;
									}
								}
							}
							if(queryExecutor){
								// add the new one
								if(changed &&
										// if a matches function exists, use that (probably more efficient)
										(queryExecutor.matches ? queryExecutor.matches(changed) : queryExecutor([changed]).length)){

									var firstInsertedInto = removedFrom > -1 ? 
										removedFrom : // put back in the original slot so it doesn't move unless it needs to (relying on a stable sort below)
										resultsArray.length;
									resultsArray.splice(firstInsertedInto, 0, changed); // add the new item
									insertedInto = array.indexOf(queryExecutor(resultsArray), changed); // sort it
									// we now need to push the change back into the original results array
									resultsArray.splice(firstInsertedInto, 1); // remove the inserted item from the previous index
									
									if((options.start && insertedInto == 0) ||
										(!atEnd && insertedInto == resultsArray.length)){
										// if it is at the end of the page, assume it goes into the prev or next page
										insertedInto = -1;
									}else{
										resultsArray.splice(insertedInto, 0, changed); // and insert into the results array with the correct index
									}
								}
							}else if(changed){
								// we don't have a queryEngine, so we can't provide any information
								// about where it was inserted or moved to. If it is an update, we leave it's position alone, other we at least indicate a new object
								if(existingId !== undef){
									// an update, keep the index the same
									insertedInto = removedFrom;
								}else if(!options.start){
									// a new object
									insertedInto = store.defaultIndex || 0;
									resultsArray.splice(insertedInto, 0, changed);
								}
							}
							if((removedFrom > -1 || insertedInto > -1) &&
									(includeObjectUpdates || !queryExecutor || (removedFrom != insertedInto))){
								var copyListeners = listeners.slice();
								for(i = 0;listener = copyListeners[i]; i++){
									listener(changed || removedObject, removedFrom, insertedInto);
								}
							}
						});
					});
				}
				var handle = {};
				// TODO: Remove cancel in 2.0.
				handle.remove = handle.cancel = function(){
					// remove this listener
					var index = array.indexOf(listeners, listener);
					if(index > -1){ // check to make sure we haven't already called cancel
						listeners.splice(index, 1);
						if(!listeners.length){
							// no more listeners, remove the query updater too
							queryUpdaters.splice(array.indexOf(queryUpdaters, queryUpdater), 1);
						}
					}
				};
				return handle;
			};
		}
		return results;
	};
	var inMethod;
	function whenFinished(method, action){
		var original = store[method];
		if(original){
			store[method] = function(value){
				var originalId;
				if(method === 'put'){
					originalId = store.getIdentity(value);
				}
				if(inMethod){
					// if one method calls another (like add() calling put()) we don't want two events
					return original.apply(this, arguments);
				}
				inMethod = true;
				try{
					var results = original.apply(this, arguments);
					when(results, function(results){
						action((typeof results == "object" && results) || value, originalId);
					});
					return results;
				}finally{
					inMethod = false;
				}
			};
		}
	}
	// monitor for updates by listening to these methods
	whenFinished("put", function(object, originalId){
		store.notify(object, originalId);
	});
	whenFinished("add", function(object){
		store.notify(object);
	});
	whenFinished("remove", function(id){
		store.notify(undefined, id);
	});

	return store;
};

lang.setObject("dojo.store.Observable", Observable);

return Observable;
});

},
'dojox/charting/themes/common':function(){
define(["dojo/_base/lang"], function(lang){
	return lang.getObject("dojox.charting.themes", true);
});

},
'money/idb':function(){
//sorry for my English :-)

define([
    //common js
	"dojo/_base/declare","dojo/date/locale","dojo/Deferred",
   "dojo/_base/array","dojo/_base/lang"
	],
    function(declare,locale,Deferred,arrayUtil,lang) {
		// Return the declared class!
		return declare("money.idb",null, {
			dbName 		: "money",
			operationDb	: "operation",
			operationIdProperty : "id",
			dbVersion 	: 12,
			indexedDb	: null,
			moneyDb		: {},
			init: function(){
				this.moneyDb.open()
			},
			/*
			 * 
			 * window.indexedDb 	- indexedDb interface
			 * moneyDb				- db instance for storing OPERATIONS
			 * 
			 */ 
			
			constructor: function(){
				// проверяем существования префикса.
				window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
				// НЕ ИСПОЛЬЗУЙТЕ "var indexedDB = ..." вне функции.
				// также могут отличаться и window.IDB* objects: Transaction, KeyRange и тд
				window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
				window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
				
				if(!window.indexedDB) {
					window.indexedDB = window.shimIndexedDB;                    
				}
				if (!window.indexedDB) {
					window.alert("Ваш браузер не поддерживат стандартную реализацию IndexedDB. Поэтому некоторый функционал может не поддерживаться.");
				}
				this.moneyDb = {}
				this.moneyDb.indexedDB = {};
				this.moneyDb.indexedDB.db = null;
			},
			
			_onError: function(e) {
				alert(e)
				console.log(e);
			},
			
			/*
			 * It's easy: just getting object by id :-)
			 */ 
			getById: function(id, callback) {
				var id = parseFloat(id) || -1, 
					db = this.moneyDb.indexedDB.db;
				var	trans = db.transaction([this.operationDb], 'readwrite');
				var	store = trans.objectStore(this.operationDb);
				var request = store.get(id);
				
				request.onsuccess = lang.hitch(this,function(e) {
					var exec = lang.hitch(this,callback,e.target.result)
					exec()
				});

				request.onerror = function(e) {
					//alert("Error getting object: " + id, e);
					console.log("Error getting object: " + id, e);
				};
			},
			
			/*
			 * It's even more easy: getting array of all objects :-)
			 * callback - method, will be executed onSuccess. As a parametr - array of found objects
			 */ 
			getAllItems: function(callback, scope){
				var scope = scope || this
				var request = window.indexedDB.open(this.dbName);
				var items = [];
				
				request.onsuccess = lang.hitch(this,function(event) {
					// Enumerate the entire object store.
					var db = this.moneyDb.indexedDB.db;
					var trans = db.transaction([this.operationDb], 'readonly');
					
					//execute callback function
					if(callback)
					trans.oncomplete = lang.hitch(this,function() {
						var exec = lang.hitch(scope,callback,items)
						exec()
					});
					var request = trans.objectStore(this.operationDb).openCursor();
					
					request.onsuccess = lang.hitch(this,function(event) {
						// This hack is to allow our code to run with Firefox (older versions than 6)
						var cursor = request.result || event.result;

						// If cursor is null then we've completed the enumeration, so return
						if (!cursor || !cursor.value) {
							return;
						}
						
						//items - array of our objects
						items.push(cursor.value)
						//this.deleteItem(cursor.value.id)
						
						//continue enumeration
						if(cursor["continue"] && lang.isFunction(cursor["continue"]))
							cursor["continue"]();
					})
				})
			},
			//adds object to db. description = object, which will be stored
						
			addItem: function(d, editMode){
				var def = new Deferred()
				var editMode = editMode || false
				//if object with id == desciption.id already exists, do nothing!
				var description = lang.clone(d)
				this.getById(description.id, function(foundObject){
					if(true/*(!foundObject && !editMode) || (foundObject && editMode)*/){
						var date = isValidDate(description.date) ? locale.format(description.date, {"selector":"date", "datePattern":"yyyy-MM-dd"}) : description.date
						
						description.date = date
						var db = this.moneyDb.indexedDB.db;
						var trans = db.transaction([this.operationDb], "readwrite");
						var store = trans.objectStore(this.operationDb);

						var data = description;	
						console.log(data,data[store.keyPath],store.keyPath)
						var request = store.put(data);

						request.onsuccess = lang.hitch(this,function(e) {
							def.resolve('ok')
							console.log("saved..")
							//this.getAllItems(console.log,window);
						});
						
						request.onerror = function(e) {
							def.resolve('e')
							console.log("Error Adding: ", e);
						};
					}
				})
				return def
			},
			
			/*
			 * Delete object with id = id from db :-)
			 */ 
			deleteItem: function(id) {
				var def = new Deferred()
				id = parseFloat(id)
				var db = this.moneyDb.indexedDB.db;
					var trans = db.transaction([this.operationDb], 'readwrite');
					var store = trans.objectStore(this.operationDb);
					var request = store["delete"](id);

					request.onsuccess = lang.hitch(this,function(e) {
						def.resolve('ok')
						console.log('RESOLVED DELETE')
					});

					request.onerror = function(e) {
						def.resolve('e')
					};
				return def				
			},
			
			/*
			 * Open DB. if version is newer, than version of DB, update db schema
			 * scope.callback will be executed on array of all DB objects
			 */
			open: function(callback, scope){
				var callback = callback || null;
				var scope = scope || this;
				var request = window.indexedDB.open(this.dbName, this.dbVersion);
				var self = this
				request.onerror = function(e) {console.log(e); window.e = e}
				
				request.onsuccess = function(e) {
					// Old api: var v = "2-beta";
					self.moneyDb.indexedDB.db = e.target.result;
					var db = self.moneyDb.indexedDB.db;
					if (db.setVersion) {
						console.log("in old setVersion: "+ db.setVersion);
						if (db.version != dbVersion) {
							var req = db.setVersion(self.dbVersion);
							req.onsuccess = lang.hitch(self, function () {
								if(db.objectStoreNames.contains(self.operationDb)) {
									db.deleteObjectStore(self.operationDb);
								}
								var store = db.createObjectStore(self.operationDb, {keyPath: 'id',autoIncrement:false});
								var trans = req.result;
								trans.oncomplete = function(e) {
									self.getAllItems(callback,scope);
								}
							});
						}
						else {
							self.getAllItems(callback,scope);
						}
					}else {
						self.getAllItems(callback,scope);
					}
				}
        
				request.onupgradeneeded = function(e) {
					console.log ("going to upgrade our DB!");
					self.moneyDb.indexedDB.db = e.target.result;
					var db = self.moneyDb.indexedDB.db;
					if(db.objectStoreNames.contains(self.operationDb)) {
						db.deleteObjectStore(self.operationDb);
					}

					var store = db.createObjectStore(self.operationDb,{keyPath: 'id',autoIncrement:false});
					self.getAllItems();
				}
				request.onfailure = self._onError;
			}
		})
	})

},
'dojox/charting/plot2d/common':function(){
define(["dojo/_base/lang", "dojo/_base/array", "dojo/_base/Color", 
		"dojox/gfx", "dojox/lang/functional", "../scaler/common"], 
	function(lang, arr, Color, g, df, sc){
	
	var common = lang.getObject("dojox.charting.plot2d.common", true);
	
	return lang.mixin(common, {	
		doIfLoaded: sc.doIfLoaded,
		makeStroke: function(stroke){
			if(!stroke){ return stroke; }
			if(typeof stroke == "string" || stroke instanceof Color){
				stroke = {color: stroke};
			}
			return g.makeParameters(g.defaultStroke, stroke);
		},
		augmentColor: function(target, color){
			var t = new Color(target),
				c = new Color(color);
			c.a = t.a;
			return c;
		},
		augmentStroke: function(stroke, color){
			var s = common.makeStroke(stroke);
			if(s){
				s.color = common.augmentColor(s.color, color);
			}
			return s;
		},
		augmentFill: function(fill, color){
			var fc, c = new Color(color);
			if(typeof fill == "string" || fill instanceof Color){
				return common.augmentColor(fill, color);
			}
			return fill;
		},

		defaultStats: {
			vmin: Number.POSITIVE_INFINITY, vmax: Number.NEGATIVE_INFINITY,
			hmin: Number.POSITIVE_INFINITY, hmax: Number.NEGATIVE_INFINITY
		},

		collectSimpleStats: function(series){
			var stats = lang.delegate(common.defaultStats);
			for(var i = 0; i < series.length; ++i){
				var run = series[i];
				for(var j = 0; j < run.data.length; j++){
					if(run.data[j] !== null){
						if(typeof run.data[j] == "number"){
							// 1D case
							var old_vmin = stats.vmin, old_vmax = stats.vmax;
							arr.forEach(run.data, function(val, i){
								if(val !== null){
									var x = i + 1, y = val;
									if(isNaN(y)){ y = 0; }
									stats.hmin = Math.min(stats.hmin, x);
									stats.hmax = Math.max(stats.hmax, x);
									stats.vmin = Math.min(stats.vmin, y);
									stats.vmax = Math.max(stats.vmax, y);
								}
							});
							if("ymin" in run){ stats.vmin = Math.min(old_vmin, run.ymin); }
							if("ymax" in run){ stats.vmax = Math.max(old_vmax, run.ymax); }
						}else{
							// 2D case
							var old_hmin = stats.hmin, old_hmax = stats.hmax,
								old_vmin = stats.vmin, old_vmax = stats.vmax;
							if(!("xmin" in run) || !("xmax" in run) || !("ymin" in run) || !("ymax" in run)){
								arr.forEach(run.data, function(val, i){
									if(val !== null){
										var x = "x" in val ? val.x : i + 1, y = val.y;
										if(isNaN(x)){ x = 0; }
										if(isNaN(y)){ y = 0; }
										stats.hmin = Math.min(stats.hmin, x);
										stats.hmax = Math.max(stats.hmax, x);
										stats.vmin = Math.min(stats.vmin, y);
										stats.vmax = Math.max(stats.vmax, y);
									}
								});
							}
							if("xmin" in run){ stats.hmin = Math.min(old_hmin, run.xmin); }
							if("xmax" in run){ stats.hmax = Math.max(old_hmax, run.xmax); }
							if("ymin" in run){ stats.vmin = Math.min(old_vmin, run.ymin); }
							if("ymax" in run){ stats.vmax = Math.max(old_vmax, run.ymax); }
						}

						break;
					}
				}
			}
			return stats;
		},

		calculateBarSize: function(/* Number */ availableSize, /* Object */ opt, /* Number? */ clusterSize){
			if(!clusterSize){
				clusterSize = 1;
			}
			var gap = opt.gap, size = (availableSize - 2 * gap) / clusterSize;
			if("minBarSize" in opt){
				size = Math.max(size, opt.minBarSize);
			}
			if("maxBarSize" in opt){
				size = Math.min(size, opt.maxBarSize);
			}
			size = Math.max(size, 1);
			gap = (availableSize - size * clusterSize) / 2;
			return {size: size, gap: gap};	// Object
		},

		collectStackedStats: function(series){
			// collect statistics
			var stats = lang.clone(common.defaultStats);
			if(series.length){
				// 1st pass: find the maximal length of runs
				stats.hmin = Math.min(stats.hmin, 1);
				stats.hmax = df.foldl(series, "seed, run -> Math.max(seed, run.data.length)", stats.hmax);
				// 2nd pass: stack values
				for(var i = 0; i < stats.hmax; ++i){
					var v = series[0].data[i];
					v = v && (typeof v == "number" ? v : v.y);
					if(isNaN(v)){ v = 0; }
					stats.vmin = Math.min(stats.vmin, v);
					for(var j = 1; j < series.length; ++j){
						var t = series[j].data[i];
						t = t && (typeof t == "number" ? t : t.y);
						if(isNaN(t)){ t = 0; }
						v += t;
					}
					stats.vmax = Math.max(stats.vmax, v);
				}
			}
			return stats;
		},

		curve: function(/* Number[] */a, /* Number|String */tension){
			//	FIX for #7235, submitted by Enzo Michelangeli.
			//	Emulates the smoothing algorithms used in a famous, unnamed spreadsheet
			//		program ;)
			var array = a.slice(0);
			if(tension == "x") {
				array[array.length] = array[0];   // add a last element equal to the first, closing the loop
			}
			var p=arr.map(array, function(item, i){
				if(i==0){ return "M" + item.x + "," + item.y; }
				if(!isNaN(tension)) { // use standard Dojo smoothing in tension is numeric
					var dx=item.x-array[i-1].x, dy=array[i-1].y;
					return "C"+(item.x-(tension-1)*(dx/tension))+","+dy+" "+(item.x-(dx/tension))+","+item.y+" "+item.x+","+item.y;
				} else if(tension == "X" || tension == "x" || tension == "S") {
					// use Excel "line smoothing" algorithm (http://xlrotor.com/resources/files.shtml)
					var p0, p1 = array[i-1], p2 = array[i], p3;
					var bz1x, bz1y, bz2x, bz2y;
					var f = 1/6;
					if(i==1) {
						if(tension == "x") {
							p0 = array[array.length-2];
						} else { // "tension == X || tension == "S"
							p0 = p1;
						}
						f = 1/3;
					} else {
						p0 = array[i-2];
					}
					if(i==(array.length-1)) {
						if(tension == "x") {
							p3 = array[1];
						} else { // "tension == X || tension == "S"
							p3 = p2;
						}
						f = 1/3;
					} else {
						p3 = array[i+1];
					}
					var p1p2 = Math.sqrt((p2.x-p1.x)*(p2.x-p1.x)+(p2.y-p1.y)*(p2.y-p1.y));
					var p0p2 = Math.sqrt((p2.x-p0.x)*(p2.x-p0.x)+(p2.y-p0.y)*(p2.y-p0.y));
					var p1p3 = Math.sqrt((p3.x-p1.x)*(p3.x-p1.x)+(p3.y-p1.y)*(p3.y-p1.y));

					var p0p2f = p0p2 * f;
					var p1p3f = p1p3 * f;

					if(p0p2f > p1p2/2 && p1p3f > p1p2/2) {
						p0p2f = p1p2/2;
						p1p3f = p1p2/2;
					} else if(p0p2f > p1p2/2) {
						p0p2f = p1p2/2;
						p1p3f = p1p2/2 * p1p3/p0p2;
					} else if(p1p3f > p1p2/2) {
						p1p3f = p1p2/2;
						p0p2f = p1p2/2 * p0p2/p1p3;
					}

					if(tension == "S") {
						if(p0 == p1) { p0p2f = 0; }
						if(p2 == p3) { p1p3f = 0; }
					}

					bz1x = p1.x + p0p2f*(p2.x - p0.x)/p0p2;
					bz1y = p1.y + p0p2f*(p2.y - p0.y)/p0p2;
					bz2x = p2.x - p1p3f*(p3.x - p1.x)/p1p3;
					bz2y = p2.y - p1p3f*(p3.y - p1.y)/p1p3;
				}
				return "C"+(bz1x+","+bz1y+" "+bz2x+","+bz2y+" "+p2.x+","+p2.y);
			});
			return p.join(" ");
		},
		
		getLabel: function(/*Number*/number, /*Boolean*/fixed, /*Number*/precision){
			return sc.doIfLoaded("dojo/number", function(numberLib){
				return (fixed ? numberLib.format(number, {places : precision}) :
					numberLib.format(number)) || "";
			}, function(){
				return fixed ? number.toFixed(precision) : number.toString();
			});
		}
	});
});

},
'money/numberpicker':function(){
// Include basic Dojo, mobile, XHR dependencies along with
define([
	"dojo/_base/declare","dijit/registry",
	"dojo/on","dijit/_WidgetBase","dojo/_base/array","dojo/_base/lang",
    "dijit/_TemplatedMixin","dijit/_WidgetsInTemplateMixin",
	"dojo/text!../money/numberpicker.html","dojox/mobile/Pane","dojox/mobile/GridLayout","dojox/mobile/TextBox"
    ],
    function(declare,registry,on, _WidgetBase, arrayUtil,lang, _TemplatedMixin, _WidgetsInTemplateMixin, template) {
        // Return the declared class!
        return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
			templateString: template,
			constructor: function(){
				//this.nls = nls
				//console.log(nls)
				//window.AppData.numberPicker = this
								
			},
			type: 'e',
			 _onDoneCallbackRegistry: [{
				fn: function(value){
					console.log("edited", value)
                },
                scope: window
            }],
			mode: "t",
			startup: function() {
				this.inherited(arguments);
				this.amount = registry.byId('amount-input')
			},
			show: function(){
				if(window.AppData.details && window.AppData.details.transaction && window.AppData.details.transaction.type)
					this.type = window.AppData.details.transaction.type
				if(this.mode == "t" ) this.amount.set('value',getNumber(Math.abs(window.AppData.details.transaction.amount)))
				else if(this.mode == "a" ) this.amount.set('value',getNumber(Math.abs(window.AppData.objAccounts.account.startAmount)))
				registry.byId('customPicker').show('amount', ['below-centered','above-centered','after','before'])
			},
			done: function(){
				this.amountV = registry.byId('amount-input').get('value')
				var val = ((this.type == "e") ? -this.amountV: this.amountV)
				//this.amountBtn.set("label",localeCurrency.format(val, {currency: window.AppCommonData.currency}));
				registry.byId('customPicker').hide()
				return val
			},
			onDone: function(){
				var self = window.AppData.numberPicker
				console.log(this._onDoneCallbackRegistry)
					arrayUtil.forEach(this._onDoneCallbackRegistry, function(c){                    
						if(lang.isFunction(c.fn) && self.mode == c.mode){
							var exec = lang.hitch(c.scope,c.fn,self.done());
							exec();
						}
					});
				
			},
			key: function(code, btn){
				console.log(code, this)
				
				/*if(btn){
					btn.set('disabled',true)
					setTimeout(function(){
						btn.set('disabled',false)
					},50)
				}*/
				var self = window.AppData.numberPicker
				//window.AppCommonData.detailsView.amount = registry.byId('amount-input')
				var val = self.amount.get('value');
				newval = val.substr(0,val.indexOf('.')) + val.substr(val.indexOf('.')+1,val.length)
				if(code == "dz"){
					self.key('0');this.key('0');
					return
				}else if(code == 'c'){
					newval = newval.substr(0, newval.length - 1)
					if(newval.length < 3)
						newval = '0'+ newval.toString()
					}else{
							var newval = newval+code.toString();
							if(newval.substr(0,1) == '0'){
								newval = newval.substr(1,newval.length-1)
							}							
						}
				newval = newval.substr(0,newval.length-2) + '.' + newval.substr(-2) 
				self.amount.set('value',newval)				
			},
		})
	}
);

},
'dojox/gfx/_base':function(){
define(["dojo/_base/kernel", "dojo/_base/lang", "dojo/_base/Color", "dojo/_base/sniff", "dojo/_base/window",
	    "dojo/_base/array","dojo/dom", "dojo/dom-construct","dojo/dom-geometry"],
function(kernel, lang, Color, has, win, arr, dom, domConstruct, domGeom){
	// module:
	//		dojox/gfx
	// summary:
	//		This module contains common core Graphics API used by different graphics renderers.

	var g = lang.getObject("dojox.gfx", true),
		b = g._base = {};
	
	// candidates for dojox.style (work on VML and SVG nodes)
	g._hasClass = function(/*DomNode*/node, /*String*/classStr){
		// summary:
		//		Returns whether or not the specified classes are a portion of the
		//		class list currently applied to the node.
		
		// return (new RegExp('(^|\\s+)'+classStr+'(\\s+|$)')).test(node.className)	// Boolean
		var cls = node.getAttribute("className");
		return cls && (" " + cls + " ").indexOf(" " + classStr + " ") >= 0;  // Boolean
	};
	g._addClass = function(/*DomNode*/node, /*String*/classStr){
		// summary:
		//		Adds the specified classes to the end of the class list on the
		//		passed node.
		var cls = node.getAttribute("className") || "";
		if(!cls || (" " + cls + " ").indexOf(" " + classStr + " ") < 0){
			node.setAttribute("className", cls + (cls ? " " : "") + classStr);
		}
	};
	g._removeClass = function(/*DomNode*/node, /*String*/classStr){
		// summary:
		//		Removes classes from node.
		var cls = node.getAttribute("className");
		if(cls){
			node.setAttribute(
				"className",
				cls.replace(new RegExp('(^|\\s+)' + classStr + '(\\s+|$)'), "$1$2")
			);
		}
	};

	// candidate for dojox.html.metrics (dynamic font resize handler is not implemented here)

	//		derived from Morris John's emResized measurer
	b._getFontMeasurements = function(){
		// summary:
		//		Returns an object that has pixel equivilents of standard font
		//		size values.
		var heights = {
			'1em': 0, '1ex': 0, '100%': 0, '12pt': 0, '16px': 0, 'xx-small': 0,
			'x-small': 0, 'small': 0, 'medium': 0, 'large': 0, 'x-large': 0,
			'xx-large': 0
		};
		var p;

		if(has("ie")){
			//		we do a font-size fix if and only if one isn't applied already.
			// NOTE: If someone set the fontSize on the HTML Element, this will kill it.
			win.doc.documentElement.style.fontSize="100%";
		}

		//		set up the measuring node.
		var div = domConstruct.create("div", {style: {
				position: "absolute",
				left: "0",
				top: "-100px",
				width: "30px",
				height: "1000em",
				borderWidth: "0",
				margin: "0",
				padding: "0",
				outline: "none",
				lineHeight: "1",
				overflow: "hidden"
			}}, win.body());

		//		do the measurements.
		for(p in heights){
			div.style.fontSize = p;
			heights[p] = Math.round(div.offsetHeight * 12/16) * 16/12 / 1000;
		}

		win.body().removeChild(div);
		return heights; //object
	};

	var fontMeasurements = null;

	b._getCachedFontMeasurements = function(recalculate){
		if(recalculate || !fontMeasurements){
			fontMeasurements = b._getFontMeasurements();
		}
		return fontMeasurements;
	};

	// candidate for dojox.html.metrics

	var measuringNode = null, empty = {};
	b._getTextBox = function(	/*String*/ text,
								/*Object*/ style,
								/*String?*/ className){
		var m, s, al = arguments.length;
		var i, box;
		if(!measuringNode){
			measuringNode = domConstruct.create("div", {style: {
				position: "absolute",
				top: "-10000px",
				left: "0",
				visibility: "hidden"
			}}, win.body());
		}
		m = measuringNode;
		// reset styles
		m.className = "";
		s = m.style;
		s.borderWidth = "0";
		s.margin = "0";
		s.padding = "0";
		s.outline = "0";
		// set new style
		if(al > 1 && style){
			for(i in style){
				if(i in empty){ continue; }
				s[i] = style[i];
			}
		}
		// set classes
		if(al > 2 && className){
			m.className = className;
		}
		// take a measure
		m.innerHTML = text;

		if(m.getBoundingClientRect){
			var bcr = m.getBoundingClientRect();
			box = {l: bcr.left, t: bcr.top, w: bcr.width || (bcr.right - bcr.left), h: bcr.height || (bcr.bottom - bcr.top)};
		}else{
			box = domGeom.getMarginBox(m);
		}
		m.innerHTML = "";
		return box;
	};

	b._computeTextLocation = function(/*g.defaultTextShape*/textShape, /*Number*/width, /*Number*/height, /*Boolean*/fixHeight) {
		var loc = {}, align = textShape.align;
		switch (align) {
			case 'end':
				loc.x = textShape.x - width;
				break;
			case 'middle':
				loc.x = textShape.x - width / 2;
				break;
			default:
				loc.x = textShape.x;
				break;
		}
		var c = fixHeight ? 0.75 : 1;
		loc.y = textShape.y - height*c; // **rough** approximation of the ascent...
		return loc;
	};
	b._computeTextBoundingBox = function(/*shape.Text*/s){
		// summary:
		//		Compute the bbox of the given shape.Text instance. Note that this method returns an
		//		approximation of the bbox, and should be used when the underlying renderer cannot provide precise metrics.
		if(!g._base._isRendered(s)){
			return {x:0, y:0, width:0, height:0};
		}
		var loc, textShape = s.getShape(),
			font = s.getFont() || g.defaultFont,
			w = s.getTextWidth(),
			h = g.normalizedLength(font.size);
		loc = b._computeTextLocation(textShape, w, h, true);
		return {
			x: loc.x,
			y: loc.y,
			width: w,
			height: h
		};
	};
	b._isRendered = function(/*Shape*/s){
		var p = s.parent;
		while(p && p.getParent){
			p = p.parent;
		}
		return p !== null;
	};

	// candidate for dojo.dom

	var uniqueId = 0;
	b._getUniqueId = function(){
		// summary:
		//		returns a unique string for use with any DOM element
		var id;
		do{
			id = kernel._scopeName + "xUnique" + (++uniqueId);
		}while(dom.byId(id));
		return id;
	};

	// IE10

	b._fixMsTouchAction = function(/*dojox/gfx/shape.Surface*/surface){
		var r = surface.rawNode;
		if (typeof r.style.msTouchAction != 'undefined')
			r.style.msTouchAction = "none";
	};

	/*=====
	g.Stroke = {
		// summary:
		//		A stroke defines stylistic properties that are used when drawing a path.

		// color: String
		//		The color of the stroke, default value 'black'.
		color: "black",

		// style: String
		//		The style of the stroke, one of 'solid', ... . Default value 'solid'.
		style: "solid",

		// width: Number
		//		The width of a stroke, default value 1.
		width: 1,

		// cap: String
		//		The endcap style of the path. One of 'butt', 'round', ... . Default value 'butt'.
		cap: "butt",

		// join: Number
		//		The join style to use when combining path segments. Default value 4.
		join: 4
	};
	
	g.Fill = {
		// summary:
		//		Defines how to fill a shape. Four types of fills can be used: solid, linear gradient, radial gradient and pattern.
		//		See dojox/gfx.LinearGradient, dojox/gfx.RadialGradient and dojox/gfx.Pattern respectively for more information about the properties supported by each type.
		
		// type: String?
		//		The type of fill. One of 'linear', 'radial', 'pattern' or undefined. If not specified, a solid fill is assumed.
		type:"",
		
		// color: String|dojo/Color?
		//		The color of a solid fill type.
		color:null,
		
	};
	
	g.LinearGradient = {
		// summary:
		//		An object defining the default stylistic properties used for Linear Gradient fills.
		//		Linear gradients are drawn along a virtual line, which results in appearance of a rotated pattern in a given direction/orientation.

		// type: String
		//		Specifies this object is a Linear Gradient, value 'linear'
		type: "linear",

		// x1: Number
		//		The X coordinate of the start of the virtual line along which the gradient is drawn, default value 0.
		x1: 0,

		// y1: Number
		//		The Y coordinate of the start of the virtual line along which the gradient is drawn, default value 0.
		y1: 0,

		// x2: Number
		//		The X coordinate of the end of the virtual line along which the gradient is drawn, default value 100.
		x2: 100,

		// y2: Number
		//		The Y coordinate of the end of the virtual line along which the gradient is drawn, default value 100.
		y2: 100,

		// colors: Array
		//		An array of colors at given offsets (from the start of the line).  The start of the line is
		//		defined at offest 0 with the end of the line at offset 1.
		//		Default value, [{ offset: 0, color: 'black'},{offset: 1, color: 'white'}], is a gradient from black to white.
		colors: []
	};
	
	g.RadialGradient = {
		// summary:
		//		Specifies the properties for RadialGradients using in fills patterns.

		// type: String
		//		Specifies this is a RadialGradient, value 'radial'
		type: "radial",

		// cx: Number
		//		The X coordinate of the center of the radial gradient, default value 0.
		cx: 0,

		// cy: Number
		//		The Y coordinate of the center of the radial gradient, default value 0.
		cy: 0,

		// r: Number
		//		The radius to the end of the radial gradient, default value 100.
		r: 100,

		// colors: Array
		//		An array of colors at given offsets (from the center of the radial gradient).
		//		The center is defined at offest 0 with the outer edge of the gradient at offset 1.
		//		Default value, [{ offset: 0, color: 'black'},{offset: 1, color: 'white'}], is a gradient from black to white.
		colors: []
	};
	
	g.Pattern = {
		// summary:
		//		An object specifying the default properties for a Pattern using in fill operations.

		// type: String
		//		Specifies this object is a Pattern, value 'pattern'.
		type: "pattern",

		// x: Number
		//		The X coordinate of the position of the pattern, default value is 0.
		x: 0,

		// y: Number
		//		The Y coordinate of the position of the pattern, default value is 0.
		y: 0,

		// width: Number
		//		The width of the pattern image, default value is 0.
		width: 0,

		// height: Number
		//		The height of the pattern image, default value is 0.
		height: 0,

		// src: String
		//		A url specifying the image to use for the pattern.
		src: ""
	};

	g.Text = {
		//	summary:
		//		A keyword argument object defining both the text to be rendered in a VectorText shape,
		//		and specifying position, alignment, and fitting.
		//	text: String
		//		The text to be rendered.
		//	x: Number?
		//		The left coordinate for the text's bounding box.
		//	y: Number?
		//		The top coordinate for the text's bounding box.
		//	width: Number?
		//		The width of the text's bounding box.
		//	height: Number?
		//		The height of the text's bounding box.
		//	align: String?
		//		The alignment of the text, as defined in SVG. Can be "start", "end" or "middle".
		//	fitting: Number?
		//		How the text is to be fitted to the bounding box. Can be 0 (no fitting), 1 (fitting based on
		//		passed width of the bounding box and the size of the font), or 2 (fit text to the bounding box,
		//		and ignore any size parameters).
		//	leading: Number?
		//		The leading to be used between lines in the text.
		//	decoration: String?
		//		Any text decoration to be used.
	};

	g.Font = {
		// summary:
		//		An object specifying the properties for a Font used in text operations.
	
		// type: String
		//		Specifies this object is a Font, value 'font'.
		type: "font",
	
		// style: String
		//		The font style, one of 'normal', 'bold', default value 'normal'.
		style: "normal",
	
		// variant: String
		//		The font variant, one of 'normal', ... , default value 'normal'.
		variant: "normal",
	
		// weight: String
		//		The font weight, one of 'normal', ..., default value 'normal'.
		weight: "normal",
	
		// size: String
		//		The font size (including units), default value '10pt'.
		size: "10pt",
	
		// family: String
		//		The font family, one of 'serif', 'sanserif', ..., default value 'serif'.
		family: "serif"
	};

	=====*/

	lang.mixin(g, {
		// summary:
		//		defines constants, prototypes, and utility functions for the core Graphics API

		// default shapes, which are used to fill in missing parameters
		defaultPath: {
			// summary:
			//		Defines the default Path prototype object.

			// type: String
			//		Specifies this object is a Path, default value 'path'.
			type: "path", 

			// path: String
			//		The path commands. See W32C SVG 1.0 specification.
			//		Defaults to empty string value.
			path: ""
		},
		defaultPolyline: {
			// summary:
			//		Defines the default PolyLine prototype.

			// type: String
			//		Specifies this object is a PolyLine, default value 'polyline'.
			type: "polyline",

			// points: Array
			//		An array of point objects [{x:0,y:0},...] defining the default polyline's line segments. Value is an empty array [].
			points: []
		},
		defaultRect: {
			// summary:
			//		Defines the default Rect prototype.

			// type: String
			//		Specifies this default object is a type of Rect. Value is 'rect'
			type: "rect",

			// x: Number
			//		The X coordinate of the default rectangles position, value 0.
			x: 0,

			// y: Number
			//		The Y coordinate of the default rectangle's position, value 0.
			y: 0,

			// width: Number
			//		The width of the default rectangle, value 100.
			width: 100,

			// height: Number
			//		The height of the default rectangle, value 100.
			height: 100,

			// r: Number
			//		The corner radius for the default rectangle, value 0.
			r: 0
		},
		defaultEllipse: {
			// summary:
			//		Defines the default Ellipse prototype.

			// type: String
			//		Specifies that this object is a type of Ellipse, value is 'ellipse'
			type: "ellipse",

			// cx: Number
			//		The X coordinate of the center of the ellipse, default value 0.
			cx: 0,

			// cy: Number
			//		The Y coordinate of the center of the ellipse, default value 0.
			cy: 0,

			// rx: Number
			//		The radius of the ellipse in the X direction, default value 200.
			rx: 200,

			// ry: Number
			//		The radius of the ellipse in the Y direction, default value 200.
			ry: 100
		},
		defaultCircle: {
			// summary:
			//		An object defining the default Circle prototype.

			// type: String
			//		Specifies this object is a circle, value 'circle'
			type: "circle",

			// cx: Number
			//		The X coordinate of the center of the circle, default value 0.
			cx: 0,
			// cy: Number
			//		The Y coordinate of the center of the circle, default value 0.
			cy: 0,

			// r: Number
			//		The radius, default value 100.
			r: 100
		},
		defaultLine: {
			// summary:
			//		An object defining the default Line prototype.

			// type: String
			//		Specifies this is a Line, value 'line'
			type: "line",

			// x1: Number
			//		The X coordinate of the start of the line, default value 0.
			x1: 0,

			// y1: Number
			//		The Y coordinate of the start of the line, default value 0.
			y1: 0,

			// x2: Number
			//		The X coordinate of the end of the line, default value 100.
			x2: 100,

			// y2: Number
			//		The Y coordinate of the end of the line, default value 100.
			y2: 100
		},
		defaultImage: {
			// summary:
			//		Defines the default Image prototype.

			// type: String
			//		Specifies this object is an image, value 'image'.
			type: "image",

			// x: Number
			//		The X coordinate of the image's position, default value 0.
			x: 0,

			// y: Number
			//		The Y coordinate of the image's position, default value 0.
			y: 0,

			// width: Number
			//		The width of the image, default value 0.
			width: 0,

			// height: Number
			//		The height of the image, default value 0.
			height: 0,

			// src: String
			//		The src url of the image, defaults to empty string.
			src: ""
		},
		defaultText: {
			// summary:
			//		Defines the default Text prototype.

			// type: String
			//		Specifies this is a Text shape, value 'text'.
			type: "text",

			// x: Number
			//		The X coordinate of the text position, default value 0.
			x: 0,

			// y: Number
			//		The Y coordinate of the text position, default value 0.
			y: 0,

			// text: String
			//		The text to be displayed, default value empty string.
			text: "",

			// align:	String
			//		The horizontal text alignment, one of 'start', 'end', 'center'. Default value 'start'.
			align: "start",

			// decoration: String
			//		The text decoration , one of 'none', ... . Default value 'none'.
			decoration: "none",

			// rotated: Boolean
			//		Whether the text is rotated, boolean default value false.
			rotated: false,

			// kerning: Boolean
			//		Whether kerning is used on the text, boolean default value true.
			kerning: true
		},
		defaultTextPath: {
			// summary:
			//		Defines the default TextPath prototype.

			// type: String
			//		Specifies this is a TextPath, value 'textpath'.
			type: "textpath",

			// text: String
			//		The text to be displayed, default value empty string.
			text: "",

			// align: String
			//		The horizontal text alignment, one of 'start', 'end', 'center'. Default value 'start'.
			align: "start",

			// decoration: String
			//		The text decoration , one of 'none', ... . Default value 'none'.
			decoration: "none",

			// rotated: Boolean
			//		Whether the text is rotated, boolean default value false.
			rotated: false,

			// kerning: Boolean
			//		Whether kerning is used on the text, boolean default value true.
			kerning: true
		},

		// default stylistic attributes
		defaultStroke: {
			// summary:
			//		A stroke defines stylistic properties that are used when drawing a path.
			//		This object defines the default Stroke prototype.
			// type: String
			//		Specifies this object is a type of Stroke, value 'stroke'.
			type: "stroke",

			// color: String
			//		The color of the stroke, default value 'black'.
			color: "black",

			// style: String
			//		The style of the stroke, one of 'solid', ... . Default value 'solid'.
			style: "solid",

			// width: Number
			//		The width of a stroke, default value 1.
			width: 1,

			// cap: String
			//		The endcap style of the path. One of 'butt', 'round', ... . Default value 'butt'.
			cap: "butt",

			// join: Number
			//		The join style to use when combining path segments. Default value 4.
			join: 4
		},
		defaultLinearGradient: {
			// summary:
			//		An object defining the default stylistic properties used for Linear Gradient fills.
			//		Linear gradients are drawn along a virtual line, which results in appearance of a rotated pattern in a given direction/orientation.

			// type: String
			//		Specifies this object is a Linear Gradient, value 'linear'
			type: "linear",

			// x1: Number
			//		The X coordinate of the start of the virtual line along which the gradient is drawn, default value 0.
			x1: 0,

			// y1: Number
			//		The Y coordinate of the start of the virtual line along which the gradient is drawn, default value 0.
			y1: 0,

			// x2: Number
			//		The X coordinate of the end of the virtual line along which the gradient is drawn, default value 100.
			x2: 100,

			// y2: Number
			//		The Y coordinate of the end of the virtual line along which the gradient is drawn, default value 100.
			y2: 100,

			// colors: Array
			//		An array of colors at given offsets (from the start of the line).  The start of the line is
			//		defined at offest 0 with the end of the line at offset 1.
			//		Default value, [{ offset: 0, color: 'black'},{offset: 1, color: 'white'}], is a gradient from black to white.
			colors: [
				{ offset: 0, color: "black" }, { offset: 1, color: "white" }
			]
		},
		defaultRadialGradient: {
			// summary:
			//		An object specifying the default properties for RadialGradients using in fills patterns.

			// type: String
			//		Specifies this is a RadialGradient, value 'radial'
			type: "radial",

			// cx: Number
			//		The X coordinate of the center of the radial gradient, default value 0.
			cx: 0,

			// cy: Number
			//		The Y coordinate of the center of the radial gradient, default value 0.
			cy: 0,

			// r: Number
			//		The radius to the end of the radial gradient, default value 100.
			r: 100,

			// colors: Array
			//		An array of colors at given offsets (from the center of the radial gradient).
			//		The center is defined at offest 0 with the outer edge of the gradient at offset 1.
			//		Default value, [{ offset: 0, color: 'black'},{offset: 1, color: 'white'}], is a gradient from black to white.
			colors: [
				{ offset: 0, color: "black" }, { offset: 1, color: "white" }
			]
		},
		defaultPattern: {
			// summary:
			//		An object specifying the default properties for a Pattern using in fill operations.

			// type: String
			//		Specifies this object is a Pattern, value 'pattern'.
			type: "pattern",

			// x: Number
			//		The X coordinate of the position of the pattern, default value is 0.
			x: 0,

			// y: Number
			//		The Y coordinate of the position of the pattern, default value is 0.
			y: 0,

			// width: Number
			//		The width of the pattern image, default value is 0.
			width: 0,

			// height: Number
			//		The height of the pattern image, default value is 0.
			height: 0,

			// src: String
			//		A url specifying the image to use for the pattern.
			src: ""
		},
		defaultFont: {
			// summary:
			//		An object specifying the default properties for a Font used in text operations.

			// type: String
			//		Specifies this object is a Font, value 'font'.
			type: "font",

			// style: String
			//		The font style, one of 'normal', 'bold', default value 'normal'.
			style: "normal",

			// variant: String
			//		The font variant, one of 'normal', ... , default value 'normal'.
			variant: "normal",

			// weight: String
			//		The font weight, one of 'normal', ..., default value 'normal'.
			weight: "normal",

			// size: String
			//		The font size (including units), default value '10pt'.
			size: "10pt",

			// family: String
			//		The font family, one of 'serif', 'sanserif', ..., default value 'serif'.
			family: "serif"
		},

		getDefault: (function(){
			// summary:
			//		Returns a function used to access default memoized prototype objects (see them defined above).
			var typeCtorCache = {};
			// a memoized delegate()
			return function(/*String*/ type){
				var t = typeCtorCache[type];
				if(t){
					return new t();
				}
				t = typeCtorCache[type] = new Function();
				t.prototype = g[ "default" + type ];
				return new t();
			}
		})(),

		normalizeColor: function(/*dojo/Color|Array|string|Object*/ color){
			// summary:
			//		converts any legal color representation to normalized
			//		dojo/Color object
			// color:
			//		A color representation.
			return (color instanceof Color) ? color : new Color(color); // dojo/Color
		},
		normalizeParameters: function(existed, update){
			// summary:
			//		updates an existing object with properties from an 'update'
			//		object
			// existed: Object
			//		the target object to be updated
			// update: Object
			//		the 'update' object, whose properties will be used to update
			//		the existed object
			var x;
			if(update){
				var empty = {};
				for(x in existed){
					if(x in update && !(x in empty)){
						existed[x] = update[x];
					}
				}
			}
			return existed;	// Object
		},
		makeParameters: function(defaults, update){
			// summary:
			//		copies the original object, and all copied properties from the
			//		'update' object
			// defaults: Object
			//		the object to be cloned before updating
			// update: Object
			//		the object, which properties are to be cloned during updating
			// returns: Object
			//      new object with new and default properties
			var i = null;
			if(!update){
				// return dojo.clone(defaults);
				return lang.delegate(defaults);
			}
			var result = {};
			for(i in defaults){
				if(!(i in result)){
					result[i] = lang.clone((i in update) ? update[i] : defaults[i]);
				}
			}
			return result; // Object
		},
		formatNumber: function(x, addSpace){
			// summary:
			//		converts a number to a string using a fixed notation
			// x: Number
			//		number to be converted
			// addSpace: Boolean
			//		whether to add a space before a positive number
			// returns: String
			//      the formatted value
			var val = x.toString();
			if(val.indexOf("e") >= 0){
				val = x.toFixed(4);
			}else{
				var point = val.indexOf(".");
				if(point >= 0 && val.length - point > 5){
					val = x.toFixed(4);
				}
			}
			if(x < 0){
				return val; // String
			}
			return addSpace ? " " + val : val; // String
		},
		// font operations
		makeFontString: function(font){
			// summary:
			//		converts a font object to a CSS font string
			// font: Object
			//		font object (see dojox/gfx.defaultFont)
			return font.style + " " + font.variant + " " + font.weight + " " + font.size + " " + font.family; // Object
		},
		splitFontString: function(str){
			// summary:
			//		converts a CSS font string to a font object
			// description:
			//		Converts a CSS font string to a gfx font object. The CSS font
			//		string components should follow the W3C specified order
			//		(see http://www.w3.org/TR/CSS2/fonts.html#font-shorthand):
			//		style, variant, weight, size, optional line height (will be
			//		ignored), and family. Note that the Font.size attribute is limited to numeric CSS length.
			// str: String
			//		a CSS font string.
			// returns: Object
			//      object in dojox/gfx.defaultFont format
			var font = g.getDefault("Font");
			var t = str.split(/\s+/);
			do{
				if(t.length < 5){ break; }
				font.style   = t[0];
				font.variant = t[1];
				font.weight  = t[2];
				var i = t[3].indexOf("/");
				font.size = i < 0 ? t[3] : t[3].substring(0, i);
				var j = 4;
				if(i < 0){
					if(t[4] == "/"){
						j = 6;
					}else if(t[4].charAt(0) == "/"){
						j = 5;
					}
				}
				if(j < t.length){
					font.family = t.slice(j).join(" ");
				}
			}while(false);
			return font;	// Object
		},
		// length operations

		// cm_in_pt: Number
		//		points per centimeter (constant)
		cm_in_pt: 72 / 2.54,

		// mm_in_pt: Number
		//		points per millimeter (constant)
		mm_in_pt: 7.2 / 2.54,

		px_in_pt: function(){
			// summary:
			//		returns the current number of pixels per point.
			return g._base._getCachedFontMeasurements()["12pt"] / 12;	// Number
		},

		pt2px: function(len){
			// summary:
			//		converts points to pixels
			// len: Number
			//		a value in points
			return len * g.px_in_pt();	// Number
		},

		px2pt: function(len){
			// summary:
			//		converts pixels to points
			// len: Number
			//		a value in pixels
			return len / g.px_in_pt();	// Number
		},

		normalizedLength: function(len) {
			// summary:
			//		converts any length value to pixels
			// len: String
			//		a length, e.g., '12pc'
			// returns: Number
			//      pixels
			if(len.length === 0){ return 0; }
			if(len.length > 2){
				var px_in_pt = g.px_in_pt();
				var val = parseFloat(len);
				switch(len.slice(-2)){
					case "px": return val;
					case "pt": return val * px_in_pt;
					case "in": return val * 72 * px_in_pt;
					case "pc": return val * 12 * px_in_pt;
					case "mm": return val * g.mm_in_pt * px_in_pt;
					case "cm": return val * g.cm_in_pt * px_in_pt;
				}
			}
			return parseFloat(len);	// Number
		},

		// pathVmlRegExp: RegExp
		//		a constant regular expression used to split a SVG/VML path into primitive components
		// tags:
		//		private
		pathVmlRegExp: /([A-Za-z]+)|(\d+(\.\d+)?)|(\.\d+)|(-\d+(\.\d+)?)|(-\.\d+)/g,

		// pathVmlRegExp: RegExp
		//		a constant regular expression used to split a SVG/VML path into primitive components
		// tags:
		//		private
		pathSvgRegExp: /([A-DF-Za-df-z])|([-+]?\d*[.]?\d+(?:[eE][-+]?\d+)?)/g,

		equalSources: function(a, b){
			// summary:
			//		compares event sources, returns true if they are equal
			// a: Object
			//		first event source
			// b: Object
			//		event source to compare against a
			// returns: Boolean
			//      true, if objects are truthy and the same
			return a && b && a === b;
		},

		switchTo: function(/*String|Object*/ renderer){
			// summary:
			//		switch the graphics implementation to the specified renderer.
			// renderer:
			//		Either the string name of a renderer (eg. 'canvas', 'svg, ...) or the renderer
			//		object to switch to.
			var ns = typeof renderer == "string" ? g[renderer] : renderer;
			if(ns){
				// If more options are added, update the docblock at the end of shape.js!
				arr.forEach(["Group", "Rect", "Ellipse", "Circle", "Line",
						"Polyline", "Image", "Text", "Path", "TextPath",
						"Surface", "createSurface", "fixTarget"], function(name){
					g[name] = ns[name];
				});
				if(typeof renderer == "string"){
					g.renderer = renderer;
				}else{
					arr.some(["svg","vml","canvas","canvasWithEvents","silverlight"], function(r){
						return (g.renderer = g[r] && g[r].Surface === g.Surface ? r : null);
					});
				}
			}
		}
	});
	
	/*=====
		g.createSurface = function(parentNode, width, height){
			// summary:
			//		creates a surface
			// parentNode: Node
			//		a parent node
			// width: String|Number
			//		width of surface, e.g., "100px" or 100
			// height: String|Number
			//		height of surface, e.g., "100px" or 100
			// returns: dojox/gfx.Surface
			//     newly created surface
		};
		g.fixTarget = function(){
			// tags:
			//		private
		};
	=====*/
	
	return g; // defaults object api
});

},
'dojox/app/utils/hash':function(){
define(["dojo/_base/lang"], function(lang){

// module:
//		dojox/app/utils/hash

var hashUtil = {
	// summary:
	//		This module contains the hash

		getParams: function(/*String*/ hash){
			// summary:
			//		get the params from the hash
			//
			// hash: String
			//		the url hash
			//
			// returns:
			//		the params object
			//
			var params;
			if(hash && hash.length){
				// fixed handle view specific params
				
				while(hash.indexOf("(") > 0){ 
					var index = hash.indexOf("(");
					var endindex = hash.indexOf(")");
					var viewPart = hash.substring(index,endindex+1);
					if(!params){ params = {}; }
					params = hashUtil.getParamObj(params, viewPart);
					// next need to remove the viewPart from the hash, and look for the next one
					var viewName = viewPart.substring(1,viewPart.indexOf("&"));
					hash = hash.replace(viewPart, viewName);
				}	
				// after all of the viewParts need to get the other params	

				for(var parts = hash.split("&"), x = 0; x < parts.length; x++){
					var tp = parts[x].split("="), name = tp[0], value = encodeURIComponent(tp[1] || "");
					if(name && value){
						if(!params){ params = {}; }
						params[name] = value;
					}
				}
			}
			return params; // Object
		},

		getParamObj: function(/*Object*/ params, /*String*/ viewPart){
			// summary:
			//		called to handle a view specific params object
			// params: Object
			//		the view specific params object
			// viewPart: String
			//		the part of the view with the params for the view
			//
			// returns:
	 		//		the params object for the view
			//
			var viewparams;
			var viewName = viewPart.substring(1,viewPart.indexOf("&"));
			var hash = viewPart.substring(viewPart.indexOf("&"), viewPart.length-1);
				for(var parts = hash.split("&"), x = 0; x < parts.length; x++){
					var tp = parts[x].split("="), name = tp[0], value = encodeURIComponent(tp[1] || "");
					if(name && value){
						if(!viewparams){ viewparams = {}; }
						viewparams[name] = value;
					}
				}
			params[viewName] = 	viewparams;
			return params; // Object
		},

		buildWithParams: function(/*String*/ hash, /*Object*/ params){
			// summary:
			//		build up the url hash adding the params
			// hash: String
			//		the url hash
			// params: Object
			//		the params object
			//
			// returns:
	 		//		the params object
			//
			if(hash.charAt(0) !== "#"){
				hash = "#"+hash;
			}
			for(var item in params){
				var value = params[item];
				// add a check to see if the params includes a view name if so setup the hash like (viewName&item=value);
				if(lang.isObject(value)){
					hash = hashUtil.addViewParams(hash, item, value);
				}else{
					if(item && value != null){
						hash = hash+"&"+item+"="+params[item];
					}
				}
			}
			return hash; // String
		},

		addViewParams: function(/*String*/ hash, /*String*/ view, /*Object*/ params){
			// summary:
			//		add the view specific params to the hash for example (view1&param1=value1)
			// hash: String
			//		the url hash
			// view: String
			//		the view name
			// params: Object
			//		the params for this view
			//
			// returns:
			//		the hash string
			//
			if(hash.charAt(0) !== "#"){
				hash = "#"+hash;
			}
			var index = hash.indexOf(view);
			if(index > 0){ // found the view?
				if((hash.charAt(index-1) == "#" || hash.charAt(index-1) == "+") && // assume it is the view? or could check the char after for + or & or -
					(hash.charAt(index+view.length) == "&" || hash.charAt(index+view.length) == "+" || hash.charAt(index+view.length) == "-")){
					// found the view at this index.
					var oldView = hash.substring(index-1,index+view.length+1);
					var paramString = hashUtil.getParamString(params);
					var newView = hash.charAt(index-1) + "(" + view + paramString + ")" + hash.charAt(index+view.length);
					hash = hash.replace(oldView, newView);
				}
			}
			
			return hash; // String
		},

		getParamString: function(/*Object*/ params){
			// summary:
			//		return the param string
			// params: Object
			//		the params object
			//
			// returns:
			//		the params string
			//
			var paramStr = "";
			for(var item in params){
				var value = params[item];
				if(item && value != null){
					paramStr = paramStr+"&"+item+"="+params[item];
				}
			}
			return paramStr; // String
		},

		getTarget: function(/*String*/ hash, /*String?*/ defaultView){
			// summary:
			//		return the target string
			// hash: String
			//		the hash string
			// defaultView: String
			//		the optional defaultView string
			//
			// returns:
			//		the target string
			//
			if(!defaultView){ defaultView = ""}
			while(hash.indexOf("(") > 0){ 
				var index = hash.indexOf("(");
				var endindex = hash.indexOf(")");
				var viewPart = hash.substring(index,endindex+1);
				var viewName = viewPart.substring(1,viewPart.indexOf("&"));
				hash = hash.replace(viewPart, viewName);
			}	
			
			return (((hash && hash.charAt(0) == "#") ? hash.substr(1) : hash) || defaultView).split('&')[0];	// String
		}
};

return hashUtil;

});
},
'dojox/charting/widget/Legend':function(){
define(["dojo/_base/declare", "dijit/_WidgetBase", "dojox/gfx","dojo/_base/array", "dojo/has", "dojo/has!dojo-bidi?../bidi/widget/Legend",
		"dojox/lang/functional", "dojo/dom", "dojo/dom-construct", "dojo/dom-class","dijit/registry"],
		function(declare, _WidgetBase, gfx, arr, has, BidiLegend, df,
				dom, domConstruct, domClass, registry){

	var Legend = declare(has("dojo-bidi")? "dojox.charting.widget.NonBidiLegend" : "dojox.charting.widget.Legend", _WidgetBase, {
		// summary:
		//		A legend for a chart. A legend contains summary labels for
		//		each series of data contained in the chart.
		//		
		//		Set the horizontal attribute to boolean false to layout legend labels vertically.
		//		Set the horizontal attribute to a number to layout legend labels in horizontal
		//		rows each containing that number of labels (except possibly the last row).
		//		
		//		(Line or Scatter charts (colored lines with shape symbols) )
		//		-o- Series1		-X- Series2		-v- Series3
		//		
		//		(Area/Bar/Pie charts (letters represent colors))
		//		[a] Series1		[b] Series2		[c] Series3

		chartRef:   "",
		horizontal: true,
		swatchSize: 18,

		legendBody: null,

		postCreate: function(){
			if(!this.chart && this.chartRef){
				this.chart = registry.byId(this.chartRef) || registry.byNode(dom.byId(this.chartRef));
				if(!this.chart){
					console.log("Could not find chart instance with id: " + this.chartRef);
				}
			}
			// we want original chart
			this.chart = this.chart.chart || this.chart;
			this.refresh();
		},
		buildRendering: function(){
			this.domNode = domConstruct.create("table",
					{role: "group", "aria-label": "chart legend", "class": "dojoxLegendNode"});
			this.legendBody = domConstruct.create("tbody", null, this.domNode);
			this.inherited(arguments);
		},
		destroy: function(){
			if(this._surfaces){
				arr.forEach(this._surfaces, function(surface){
					surface.destroy();
				});
			}
			this.inherited(arguments);
		},
		refresh: function(){
			// summary:
			//		regenerates the legend to reflect changes to the chart

			// cleanup
			if(this._surfaces){
				arr.forEach(this._surfaces, function(surface){
					surface.destroy();
				});
			}
			this._surfaces = [];
			while(this.legendBody.lastChild){
				domConstruct.destroy(this.legendBody.lastChild);
			}

			if(this.horizontal){
				domClass.add(this.domNode, "dojoxLegendHorizontal");
				// make a container <tr>
				this._tr = domConstruct.create("tr", null, this.legendBody);
				this._inrow = 0;
			}

			// keep trying to reach this.series for compatibility reasons in case the user set them, but could be removed
			var s = this.series || this.chart.series;
			if(s.length == 0){
				return;
			}
			if(s[0].chart.stack[0].declaredClass == "dojox.charting.plot2d.Pie"){
				var t = s[0].chart.stack[0];
				if(typeof t.run.data[0] == "number"){
					var filteredRun = df.map(t.run.data, "Math.max(x, 0)");
					var slices = df.map(filteredRun, "/this", df.foldl(filteredRun, "+", 0));
					arr.forEach(slices, function(x, i){
						this._addLabel(t.dyn[i], t._getLabel(x * 100) + "%");
					}, this);
				}else{
					arr.forEach(t.run.data, function(x, i){
						this._addLabel(t.dyn[i], x.legend || x.text || x.y);
					}, this);
				}
			}else{
				arr.forEach(s, function(x){
					this._addLabel(x.dyn, x.legend || x.name);
				}, this);
			}
		},
		_addLabel: function(dyn, label){
			// create necessary elements
			var wrapper = domConstruct.create("td"),
				icon = domConstruct.create("div", null, wrapper),
				text = domConstruct.create("label", null, wrapper),
				div  = domConstruct.create("div", {
					style: {
						"width": this.swatchSize + "px",
						"height":this.swatchSize + "px",
						"float": "left"
					}
				}, icon);
			domClass.add(icon, "dojoxLegendIcon dijitInline");
			domClass.add(text, "dojoxLegendText");
			// create a skeleton
			if(this._tr){
				// horizontal
				this._tr.appendChild(wrapper);
				if(++this._inrow === this.horizontal){
					// make a fresh container <tr>
					this._tr = domConstruct.create("tr", null, this.legendBody);
					this._inrow = 0;
				}
			}else{
				// vertical
				var tr = domConstruct.create("tr", null, this.legendBody);
				tr.appendChild(wrapper);
			}

			// populate the skeleton
			this._makeIcon(div, dyn);
			text.innerHTML = String(label);
			if(has("dojo-bidi")){
				text.dir = this.getTextDir(label, text.dir);
			}
		},
		_makeIcon: function(div, dyn){
			var mb = { h: this.swatchSize, w: this.swatchSize };
			var surface = gfx.createSurface(div, mb.w, mb.h);
			this._surfaces.push(surface);
			if(dyn.fill){
				// regions
				surface.createRect({x: 2, y: 2, width: mb.w - 4, height: mb.h - 4}).
					setFill(dyn.fill).setStroke(dyn.stroke);
			}else if(dyn.stroke || dyn.marker){
				// draw line
				var line = {x1: 0, y1: mb.h / 2, x2: mb.w, y2: mb.h / 2};
				if(dyn.stroke){
					surface.createLine(line).setStroke(dyn.stroke);
				}
				if(dyn.marker){
					// draw marker on top
					var c = {x: mb.w / 2, y: mb.h / 2};
					surface.createPath({path: "M" + c.x + " " + c.y + " " + dyn.marker}).
						setFill(dyn.markerFill).setStroke(dyn.markerStroke);
				}
			}else{
				// nothing
				surface.createRect({x: 2, y: 2, width: mb.w - 4, height: mb.h - 4}).
					setStroke("black");
				surface.createLine({x1: 2, y1: 2, x2: mb.w - 2, y2: mb.h - 2}).setStroke("black");
				surface.createLine({x1: 2, y1: mb.h - 2, x2: mb.w - 2, y2: 2}).setStroke("black");
			}
		}
	});
	return has("dojo-bidi")? declare("dojox.charting.widget.Legend", [Legend, BidiLegend]) : Legend;
	
});

},
'money/views/timespan':function(){
define([
	"dojo/json","dijit/registry","dojo/on","dojo/dom-style","dojo/dom-class",'dojo/date',
	"dojo/sniff","dojox/mobile/ProgressIndicator","dojo/_base/array",
	"dojox/mobile/Button", "dojo/date/locale","money/dialog","dojox/mobile/SimpleDialog", "dojox/mobile/SpinWheelDatePicker",'dojox/mobile/ToolBarButton'
 ],
    function(json, registry, on, domStyle, domClass, dojodate, has, ProgressIndicator, arrayUtil,Button, locale, Dialog, SD, SpinWheelDatePicker){
    
	return window.AppData.objBackup = {
		beforeActivate: function(){			
			
        },
        afterActivate: function(){
 			
 		},
        init: function(){
			window.AppData.timespanObj = this
			if(!has('isInitiallySmall'))
				domClass.add(this.backButton.domNode,'hideOnMedium hideOnLarge')
			var self = this
			window.AppData.timespan = localStorage.getItem('timespan') ? localStorage.getItem('timespan') : 'last31';
			
			this.last31.set('checked', false)
			this.lastMonth.set('checked', false)
			this.customTimespan.set('checked', false)
			this[window.AppData.timespan].set('checked', true)
			
			this.timespanPicker = new SpinWheelDatePicker( {id:"timespanPicker"}, "timespanPicker");
			
			
			var initialDate = window.AppData.dateFrom ? window.AppData.dateFrom : new Date
			var initialDateString = window.AppData.timespanMonth ? window.AppData.timespanMonth : getDateString(window.AppData.dateFrom ? window.AppData.dateFrom : new Date, locale).substr(0,7) + '-01'
				
			var setMonthTimespan = function(doNotSave) {
				var initialDateString = window.AppData.timespanMonth ? window.AppData.timespanMonth : getDateString(new Date, locale).substr(0,7) + '-01'
				var from = new Date( Number( initialDateString.substr(0,4) ), Number (initialDateString.substr(5,2) ) - 1, Number( initialDateString.substr(8,2) ));
				var daysInMonth = dojodate.getDaysInMonth(from) 
				window.AppData.dateFrom		 = dojodate.add( from, "day", -1);
				window.AppData.dateTo 		 = dojodate.add( from, "day", daysInMonth );				
				self[!doNotSave ? 'lastMonth' : 'customTimespan'].set( 'rightText', getDateStringHr( from, locale ) + ' - ' + getDateStringHr( dojodate.add( from, "day", daysInMonth -1), locale ) + '&nbsp;&nbsp;' )
				self[!doNotSave ? 'customTimespan' : 'lastMonth'].set( 'rightText', '' );
				
				if(!doNotSave)
					localStorage.setItem('dateFrom', getDateString(window.AppData.dateFrom, locale) )
				else
					localStorage.removeItem('dateFrom')
			}
			
			if(window.AppData.timespan == 'lastMonth' || window.AppData.timespan == 'customTimespan')
				setMonthTimespan(window.AppData.timespan == 'customTimespan')
						
			var _applyTimespanToSummaryPage = function() {
				registry.byId('summary-list').refresh();
			}
			on(this.okButton,'click',function(){
				window.AppData.timespanMonth = self.timespanPicker.get('value')
				setMonthTimespan();
				self.timespanOverlay.hide()
				_applyTimespanToSummaryPage();
			})
			
			on(this.last31,'click',function(){
				self.applyTs31()
				localStorage.removeItem('dateFrom')
				_applyTimespanToSummaryPage();
			})
			on(this.lastMonth,'click',function(){
				self.applyTsMonth()				
				self.timespanOverlay.show();
				self.timespanPicker.startup();
				self.timespanPicker.set('value',window.AppData.timespanMonth ? window.AppData.timespanMonth : initialDateString )
			})
			on(this.customTimespan,'click',function(){
				self.applyTsCustom();
				window.AppData.timespanMonth = getDateString(new Date, locale).substr(0,7) + '-01'
				setMonthTimespan(true);
				_applyTimespanToSummaryPage();
			})
			on(this.noneTimespan,'click',function(){
				self.applyTsNone()
				_applyTimespanToSummaryPage();
			})
        },
		applyTs31:function(){
			console.log('31')
			window.AppData.timespan = 'last31'
			var daysInMonth = dojodate.getDaysInMonth(new Date);
			window.AppData.dateFrom		 = undefined;
			window.AppData.dateTo		 = undefined;
			localStorage.setItem( 'timespan', 'last31' )		
		},
		applyTsMonth:function(){
			console.log('Month')
			window.AppData.timespan = 'lastMonth'
			localStorage.setItem('timespan','lastMonth')
		},
		applyTsCustom:function(){
			window.AppData.timespan = 'customTimespan'
			localStorage.setItem('timespan','customTimespan')
			console.log('custom')
		},
		applyTsNone:function(){
			window.AppData.timespan = 'noneTimespan'
			localStorage.setItem('timespan','noneTimespan')
			console.log('none')
		}
		
	};
});

},
'dojo/cldr/monetary':function(){
define(["../_base/kernel", "../_base/lang"], function(dojo, lang){

// module:
//		dojo/cldr/monetary

var monetary = {
	// summary:
	//		TODOC
};
lang.setObject("dojo.cldr.monetary", monetary);

monetary.getData = function(/*String*/ code){
	// summary:
	//		A mapping of currency code to currency-specific formatting information. Returns a unique object with properties: places, round.
	// code:
	//		an [ISO 4217](http://en.wikipedia.org/wiki/ISO_4217) currency code

	// from http://www.unicode.org/cldr/data/common/supplemental/supplementalData.xml:supplementalData/currencyData/fractions

	var placesData = {
		ADP:0,AFN:0,ALL:0,AMD:0,BHD:3,BIF:0,BYR:0,CLF:0,CLP:0,
		COP:0,CRC:0,DJF:0,ESP:0,GNF:0,GYD:0,HUF:0,IDR:0,IQD:0,
		IRR:3,ISK:0,ITL:0,JOD:3,JPY:0,KMF:0,KPW:0,KRW:0,KWD:3,
		LAK:0,LBP:0,LUF:0,LYD:3,MGA:0,MGF:0,MMK:0,MNT:0,MRO:0,
		MUR:0,OMR:3,PKR:0,PYG:0,RSD:0,RWF:0,SLL:0,SOS:0,STD:0,
		SYP:0,TMM:0,TND:3,TRL:0,TZS:0,UGX:0,UZS:0,VND:0,VUV:0,
		XAF:0,XOF:0,XPF:0,YER:0,ZMK:0,ZWD:0
	};

	var roundingData = {};

	var places = placesData[code], round = roundingData[code];
	if(typeof places == "undefined"){ places = 2; }
	if(typeof round == "undefined"){ round = 0; }

	return {places: places, round: round}; // Object
};

return monetary;
});

},
'dojox/charting/Series':function(){
define(["dojo/_base/lang", "dojo/_base/declare", "./Element"], 
	function(lang, declare, Element){ 
	/*=====
	var __SeriesCtorArgs = {
		// summary:
		//		An optional arguments object that can be used in the Series constructor.
		// plot: String?
		//		The plot (by name) that this series belongs to.
	};
	=====*/
	return declare("dojox.charting.Series", Element, {
		// summary:
		//		An object representing a series of data for plotting on a chart.
		constructor: function(chart, data, kwArgs){
			// summary:
			//		Create a new data series object for use within charting.
			// chart: dojox/charting/Chart
			//		The chart that this series belongs to.
			// data: Array|Object
			//		The array of data points (either numbers or objects) that
			//		represents the data to be drawn. Or it can be an object. In
			//		the latter case, it should have a property "data" (an array),
			//		destroy(), and setSeriesObject().
			// kwArgs: __SeriesCtorArgs?
			//		An optional keyword arguments object to set details for this series.
			lang.mixin(this, kwArgs);
			if(typeof this.plot != "string"){ this.plot = "default"; }
			this.update(data);
		},
	
		clear: function(){
			// summary:
			//		Clear the calculated additional parameters set on this series.
			this.dyn = {};
		},
		
		update: function(data){
			// summary:
			//		Set data and make this object dirty, so it can be redrawn.
			// data: Array|Object
			//		The array of data points (either numbers or objects) that
			//		represents the data to be drawn. Or it can be an object. In
			//		the latter case, it should have a property "data" (an array),
			//		destroy(), and setSeriesObject().
			if(lang.isArray(data)){
				this.data = data;
			}else{
				this.source = data;
				this.data = this.source.data;
				if(this.source.setSeriesObject){
					this.source.setSeriesObject(this);
				}
			}
			this.dirty = true;
			this.clear();
		}
	});
});

},
'dojo/store/Memory':function(){
define(["../_base/declare", "./util/QueryResults", "./util/SimpleQueryEngine" /*=====, "./api/Store" =====*/],
function(declare, QueryResults, SimpleQueryEngine /*=====, Store =====*/){

// module:
//		dojo/store/Memory

// No base class, but for purposes of documentation, the base class is dojo/store/api/Store
var base = null;
/*===== base = Store; =====*/

return declare("dojo.store.Memory", base, {
	// summary:
	//		This is a basic in-memory object store. It implements dojo/store/api/Store.
	constructor: function(options){
		// summary:
		//		Creates a memory object store.
		// options: dojo/store/Memory
		//		This provides any configuration information that will be mixed into the store.
		//		This should generally include the data property to provide the starting set of data.
		for(var i in options){
			this[i] = options[i];
		}
		this.setData(this.data || []);
	},
	// data: Array
	//		The array of all the objects in the memory store
	data:null,

	// idProperty: String
	//		Indicates the property to use as the identity property. The values of this
	//		property should be unique.
	idProperty: "id",

	// index: Object
	//		An index of data indices into the data array by id
	index:null,

	// queryEngine: Function
	//		Defines the query engine to use for querying the data store
	queryEngine: SimpleQueryEngine,
	get: function(id){
		// summary:
		//		Retrieves an object by its identity
		// id: Number
		//		The identity to use to lookup the object
		// returns: Object
		//		The object in the store that matches the given id.
		return this.data[this.index[id]];
	},
	getIdentity: function(object){
		// summary:
		//		Returns an object's identity
		// object: Object
		//		The object to get the identity from
		// returns: Number
		return object[this.idProperty];
	},
	put: function(object, options){
		// summary:
		//		Stores an object
		// object: Object
		//		The object to store.
		// options: dojo/store/api/Store.PutDirectives?
		//		Additional metadata for storing the data.  Includes an "id"
		//		property if a specific id is to be used.
		// returns: Number
		var data = this.data,
			index = this.index,
			idProperty = this.idProperty;
		var id = object[idProperty] = (options && "id" in options) ? options.id : idProperty in object ? object[idProperty] : Math.random();
		if(id in index){
			// object exists
			if(options && options.overwrite === false){
				throw new Error("Object already exists");
			}
			// replace the entry in data
			data[index[id]] = object;
		}else{
			// add the new object
			index[id] = data.push(object) - 1;
		}
		return id;
	},
	add: function(object, options){
		// summary:
		//		Creates an object, throws an error if the object already exists
		// object: Object
		//		The object to store.
		// options: dojo/store/api/Store.PutDirectives?
		//		Additional metadata for storing the data.  Includes an "id"
		//		property if a specific id is to be used.
		// returns: Number
		(options = options || {}).overwrite = false;
		// call put with overwrite being false
		return this.put(object, options);
	},
	remove: function(id){
		// summary:
		//		Deletes an object by its identity
		// id: Number
		//		The identity to use to delete the object
		// returns: Boolean
		//		Returns true if an object was removed, falsy (undefined) if no object matched the id
		var index = this.index;
		var data = this.data;
		if(id in index){
			data.splice(index[id], 1);
			// now we have to reindex
			this.setData(data);
			return true;
		}
	},
	query: function(query, options){
		// summary:
		//		Queries the store for objects.
		// query: Object
		//		The query to use for retrieving objects from the store.
		// options: dojo/store/api/Store.QueryOptions?
		//		The optional arguments to apply to the resultset.
		// returns: dojo/store/api/Store.QueryResults
		//		The results of the query, extended with iterative methods.
		//
		// example:
		//		Given the following store:
		//
		// 	|	var store = new Memory({
		// 	|		data: [
		// 	|			{id: 1, name: "one", prime: false },
		//	|			{id: 2, name: "two", even: true, prime: true},
		//	|			{id: 3, name: "three", prime: true},
		//	|			{id: 4, name: "four", even: true, prime: false},
		//	|			{id: 5, name: "five", prime: true}
		//	|		]
		//	|	});
		//
		//	...find all items where "prime" is true:
		//
		//	|	var results = store.query({ prime: true });
		//
		//	...or find all items where "even" is true:
		//
		//	|	var results = store.query({ even: true });
		return QueryResults(this.queryEngine(query, options)(this.data));
	},
	setData: function(data){
		// summary:
		//		Sets the given data as the source for this store, and indexes it
		// data: Object[]
		//		An array of objects to use as the source of data.
		if(data.items){
			// just for convenience with the data format IFRS expects
			this.idProperty = data.identifier || this.idProperty;
			data = this.data = data.items;
		}else{
			this.data = data;
		}
		this.index = {};
		for(var i = 0, l = data.length; i < l; i++){
			this.index[data[i][this.idProperty]] = i;
		}
	}
});

});

},
'dojox/charting/plot2d/Base':function(){
define(["dojo/_base/declare", "dojo/_base/array", "dojox/gfx",
		"../Element", "./common", "../axis2d/common", "dojo/has"],
	function(declare, arr, gfx, Element, common, ac, has){
/*=====
dojox.charting.plot2d.__PlotCtorArgs = {
	// summary:
	//		The base keyword arguments object for plot constructors.
	//		Note that the parameters for this may change based on the
	//		specific plot type (see the corresponding plot type for
	//		details).

	// tooltipFunc: Function?
	//		An optional function used to compute tooltip text for this plot. It takes precedence over
	//		the default function when available.
	//	|		function tooltipFunc(o) { return "text"; }
	//		`o`is the event object that triggered the tooltip.
	tooltipFunc: null
};
=====*/
	var Base = declare("dojox.charting.plot2d.Base", Element, {
		// summary:
		//		Base class for all plot types.
		constructor: function(chart, kwArgs){
			// summary:
			//		Create a base plot for charting.
			// chart: dojox/chart/Chart
			//		The chart this plot belongs to.
			// kwArgs: dojox.charting.plot2d.__PlotCtorArgs?
			//		An optional arguments object to help define the plot.
	
			// TODO does not work in markup
			if(kwArgs && kwArgs.tooltipFunc){
				this.tooltipFunc = kwArgs.tooltipFunc;
			}
		},
		clear: function(){
			// summary:
			//		Clear out all of the information tied to this plot.
			// returns: dojox.charting.plot2d.Base
			//		A reference to this plot for functional chaining.
			this.series = [];
			this.dirty = true;
			return this;	//	dojox/charting/plot2d/Base
		},
		setAxis: function(axis){
			// summary:
			//		Set an axis for this plot.
			// axis: dojox.charting.axis2d.Base
			//		The axis to set.
			// returns: dojox/charting/plot2d/Base
			//		A reference to this plot for functional chaining.
			return this;	//	dojox/charting/plot2d/Base
		},
		assignAxes: function(axes){
			// summary:
			//		From an array of axes pick the ones that correspond to this plot and
			//		assign them to the plot using setAxis method.
			// axes: Array
			//		An array of dojox/charting/axis2d/Base
			// tags:
			//		protected
			arr.forEach(this.axes, function(axis){
				if(this[axis]){
					this.setAxis(axes[this[axis]]);
				}
			}, this);
		},
		addSeries: function(run){
			// summary:
			//		Add a data series to this plot.
			// run: dojox.charting.Series
			//		The series to be added.
			// returns: dojox/charting/plot2d/Base
			//		A reference to this plot for functional chaining.
			this.series.push(run);
			return this;	//	dojox/charting/plot2d/Base
		},
		getSeriesStats: function(){
			// summary:
			//		Calculate the min/max on all attached series in both directions.
			// returns: Object
			//		{hmin, hmax, vmin, vmax} min/max in both directions.
			return common.collectSimpleStats(this.series);
		},
		calculateAxes: function(dim){
			// summary:
			//		Stub function for running the axis calculations (deprecated).
			// dim: Object
			//		An object of the form { width, height }
			// returns: dojox/charting/plot2d/Base
			//		A reference to this plot for functional chaining.
			this.initializeScalers(dim, this.getSeriesStats());
			return this;	//	dojox/charting/plot2d/Base
		},
		initializeScalers: function(){
			// summary:
			//		Does nothing.
			return this;
		},
		isDataDirty: function(){
			// summary:
			//		Returns whether or not any of this plot's data series need to be rendered.
			// returns: Boolean
			//		Flag indicating if any of this plot's series are invalid and need rendering.
			return arr.some(this.series, function(item){ return item.dirty; });	//	Boolean
		},
		render: function(dim, offsets){
			// summary:
			//		Render the plot on the chart.
			// dim: Object
			//		An object of the form { width, height }.
			// offsets: Object
			//		An object of the form { l, r, t, b }.
			// returns: dojox/charting/plot2d/Base
			//		A reference to this plot for functional chaining.
			return this;	//	dojox/charting/plot2d/Base
		},
		renderLabel: function(group, x, y, label, theme, block, align){
			var elem = ac.createText[this.opt.htmlLabels && gfx.renderer != "vml" ? "html" : "gfx"]
				(this.chart, group, x, y, align?align:"middle", label, theme.series.font, theme.series.fontColor);
			// if the label is inside we need to avoid catching events on it this would prevent action on
			// chart elements
			if(block){
				// TODO this won't work in IE neither in VML nor in HTML
				// a solution would be to catch the event on the label and refire it to the element
				// possibly using elementFromPoint or having it already available
				if(this.opt.htmlLabels && gfx.renderer != "vml"){
					// we have HTML labels, let's use pointEvents on the HTML node
					elem.style.pointerEvents = "none";
				}else if(elem.rawNode){
					// we have SVG labels, let's use pointerEvents on the SVG or VML node
					elem.rawNode.style.pointerEvents = "none";
				}
				// else we have Canvas, we need do nothing, as Canvas text won't catch events
			}
			if(this.opt.htmlLabels && gfx.renderer != "vml"){
				this.htmlElements.push(elem);
			}

			return elem;
		},
		getRequiredColors: function(){
			// summary:
			//		Get how many data series we have, so we know how many colors to use.
			// returns: Number
			//		The number of colors needed.
			return this.series.length;	//	Number
		},
		_getLabel: function(number){
			return common.getLabel(number, this.opt.fixed, this.opt.precision);
		}
	});
	if(has("dojo-bidi")){
		Base.extend({
			_checkOrientation: function(group, dim, offsets){
				this.chart.applyMirroring(this.group, dim, offsets);
			}		
		});
	}
	return Base;
});

},
'dojox/mobile/SimpleDialog':function(){
define([
	"dojo/_base/declare",
	"dojo/_base/window",
	"dojo/dom-class",
	"dojo/dom-attr",
	"dojo/dom-construct",
	"dojo/on",
	"dojo/touch",
	"dijit/registry",
	"./Pane",
	"./iconUtils",
	"dojo/has",
	"dojo/has!dojo-bidi?dojox/mobile/bidi/SimpleDialog"
], function(declare, win, domClass, domAttr, domConstruct, on, touch, registry, Pane, iconUtils, has, BidiSimpleDialog){
	// module:
	//		dojox/mobile/SimpleDialog

	var SimpleDialog = declare(has("dojo-bidi") ? "dojox.mobile.NonBidiSimpleDialog" : "dojox.mobile.SimpleDialog", Pane, {
		// summary:
		//		A dialog box for mobile.
		// description:
		//		SimpleDialog is a dialog box for mobile.
		//		When a SimpleDialog is created, it is initially hidden 
		//		(display="none"). To show the dialog box, you need to
		//		get a reference to the widget and to call its show() method.
		//
		//		The contents can be arbitrary HTML, text, or widgets. Note,
		//		however, that the widget is initially hidden. You need to be
		//		careful when you place in a SimpleDialog elements that cannot 
		//		be initialized in hidden state.
		//
		//		This widget has much less functionalities than dijit/Dialog, 
		//		but it has the advantage of a much smaller code size.

		// top: String
		//		The top edge position of the widget. If "auto", the widget is
		//		placed at the middle of the screen. Otherwise, the value
		//		(ex. "20px") is used as the top style of widget's domNode.
		top: "auto",

		// left: String
		//		The left edge position of the widget. If "auto", the widget is
		//		placed at the center of the screen. Otherwise, the value
		//		(ex. "20px") is used as the left style of widget's domNode.
		left: "auto",

		// modal: Boolean
		//		If true, a translucent cover is added over the entire page to
		//		prevent the user from interacting with elements on the page.
		modal: true,

		// closeButton: [const] Boolean
		//		If true, a button to close the dialog box is displayed at the
		//		top-right corner.
		//		Note that changing the value of the property after the widget
		//		creation has no effect.
		closeButton: false,

		// closeButtonClass: String
		//		A class name of a DOM button to be used as a close button.
		closeButtonClass: "mblDomButtonSilverCircleRedCross",

		// tabIndex: String
		//		Tabindex setting for the item so users can hit the tab key to
		//		focus on it.
		tabIndex: "0",
		
		// _setTabIndexAttr: [private] String
		//		Sets tabIndex to domNode.
		_setTabIndexAttr: "",

		/* internal properties */	
		
		// baseClass: String
		//		The name of the CSS class of this widget.
		baseClass: "mblSimpleDialog",
		
		// _cover: [private] Array
		//		Array for sharing the cover instances.
		_cover: [],

		buildRendering: function(){
			this.containerNode = domConstruct.create("div", {className:"mblSimpleDialogContainer"});
			if(this.srcNodeRef){
				// reparent
				for(var i = 0, len = this.srcNodeRef.childNodes.length; i < len; i++){
					this.containerNode.appendChild(this.srcNodeRef.removeChild(this.srcNodeRef.firstChild));
				}
			}
			this.inherited(arguments);
			domAttr.set(this.domNode, "role", "dialog");
			
			if(this.containerNode.getElementsByClassName){ //TODO: Do we need to support IE8 a11y?
	            var titleNode = this.containerNode.getElementsByClassName("mblSimpleDialogTitle")[0];
	            if (titleNode){
	            	titleNode.id = titleNode.id || registry.getUniqueId("dojo_mobile_mblSimpleDialogTitle");
	            	domAttr.set(this.domNode, "aria-labelledby", titleNode.id);
	            }
	            var textNode = this.containerNode.getElementsByClassName("mblSimpleDialogText")[0];
	            if (textNode){
	                textNode.id = textNode.id || registry.getUniqueId("dojo_mobile_mblSimpleDialogText");
	                domAttr.set(this.domNode, "aria-describedby", textNode.id);
	            }
			}
			domClass.add(this.domNode, "mblSimpleDialogDecoration");
			this.domNode.style.display = "none";
			this.domNode.appendChild(this.containerNode);
			if(this.closeButton){
				this.closeButtonNode = domConstruct.create("div", {
					className: "mblSimpleDialogCloseBtn "+this.closeButtonClass
				}, this.domNode);
				iconUtils.createDomButton(this.closeButtonNode);
				this.connect(this.closeButtonNode, "onclick", "_onCloseButtonClick");
			}
			this.connect(this.domNode, "onkeydown", "_onKeyDown"); // for desktop browsers
		},

		startup: function(){
			if(this._started){ return; }
			this.inherited(arguments);
			win.body().appendChild(this.domNode);
		},

		addCover: function(){
			// summary:
			//		Adds the transparent DIV cover.
			if(!this._cover[0]){
				this._cover[0] = domConstruct.create("div", {
					className: "mblSimpleDialogCover"
				}, win.body());
			}else{
				this._cover[0].style.display = "";
			}

			if(has("windows-theme")) {
				// Hack to prevent interaction with elements placed under cover div.
				this.own(on(this._cover[0], touch.press, function() {}));
			}
		},

		removeCover: function(){
			// summary:
			//		Removes the transparent DIV cover.
			this._cover[0].style.display = "none";
		},

		_onCloseButtonClick: function(e){
			// tags:
			//		private
			if(this.onCloseButtonClick(e) === false){ return; } // user's click action
			this.hide();
		},

		onCloseButtonClick: function(/*Event*/ /*===== e =====*/){
			// summary:
			//		User-defined function to handle clicks.
			// tags:
			//		callback
		},

		_onKeyDown: function(e){
			// tags:
			//		private
			if(e.keyCode == 27){ // ESC
				this.hide();
			}
		},

		refresh: function(){ // TODO: should we call refresh on resize?
			// summary:
			//		Refreshes the layout of the dialog.
			var n = this.domNode;
			var h;
			if(this.closeButton){
				var b = this.closeButtonNode;
				var s = Math.round(b.offsetHeight / 2);
				b.style.top = -s + "px";
				b.style.left = n.offsetWidth - s + "px";
			}
			if(this.top === "auto"){
				h = win.global.innerHeight || win.doc.documentElement.clientHeight;
				n.style.top = Math.round((h - n.offsetHeight) / 2) + "px";
			}else{
				n.style.top = this.top;
			}
			if(this.left === "auto"){
				h = win.global.innerWidth || win.doc.documentElement.clientWidth;
				n.style.left = Math.round((h - n.offsetWidth) / 2) + "px";
			}else{
				n.style.left = this.left;
			}
		},

		show: function(){
			// summary:
			//		Shows the dialog.
			if(this.domNode.style.display === ""){ return; }
			if(this.modal){
				this.addCover();
			}
			this.domNode.style.display = "";
			this.resize(); // #15628
			this.refresh();
			var diaglogButton;
			if(this.domNode.getElementsByClassName){
				diaglogButton = this.domNode.getElementsByClassName("mblSimpleDialogButton")[0];
			}
			var focusNode = diaglogButton || this.closeButtonNode || this.domNode; // Focus preference is: user supplied button, close button, entire dialog
			/// on Safari iOS the focus is not taken without a timeout
			this.defer(function(){ focusNode.focus();}, 1000);
		},

		hide: function(){
			// summary:
			//		Hides the dialog.
			if(this.domNode.style.display === "none"){ return; }
			this.domNode.style.display = "none";
			if(this.modal){
				this.removeCover();
			}
		}
	});
	return has("dojo-bidi") ? declare("dojox.mobile.SimpleDialog", [SimpleDialog, BidiSimpleDialog]) : SimpleDialog;
});

},
'money/views/list':function(){
define(["dojo/_base/declare","dojo/on", "dojox/gesture/swipe","dojo/date","dojo/date/locale",
	"dojo/dom-construct", "dojo/dom-style",'dojo/dom-class',
	"dojo/_base/array","dojo/_base/lang", 
	"dijit/registry","dojo/dom","dojo/dom-attr", 
	"dojo/date/locale","dojox/mobile/ListItem",
    "dojox/mobile/EdgeToEdgeStoreList"],
    function(declare, on, swipe, date, locale, domConstruct, domStyle, domClass, arrayUtil,lang, registry, dom, domAttr, locale, ListItem){
    var TransactionListItem = declare(ListItem, {
        target: "details",
        clickable: true,
        postMixInProperties: function(){
            this.inherited(arguments);
            this.transitionOptions = {
                params: {
                    "id" : this.id
                }
            }
        }
    });
 
 
    return self = {
		afterActivate: function(){
			window.hideProgress()
			
			
		},
		_accountTemplate:
			'<div><span class="transaction-amount">${amount}</span><span class="transaction-account">${account} </span></div>',
		substitute: function(template, data) {
			var self = this
			return template.replace(/\$\{([^\s\:\}]+)(?:\:([^\s\:\}]+))?\}/g, function(match, key){
				if(data[key]!=undefined || (key.substr(0,1) == "!" && data[key.substr(1)]))
					return (key.substr(0,1)=="!" ? self.capitalize(data[key.substr(1)]):data[key])
				return ""			
			});
		},
		capitalize: function(str){
			return str.substr(0,1).toUpperCase() + str.substr(1,str.length-1).toLowerCase()
		},
		_getDate : function(date, to, pattern){
			var to = to || "EEE dd MMM yyyy"
			var pattern = pattern || window.AppData.widgetDateFormat
			var date2 = isValidDate(date) ? date : locale.parse(date, {selector:"date", datePattern:pattern})
			return this.capitalize(locale.format(date2, {selector:"date", datePattern:to}))
		},
		_renderHeader: function(){
			var date = window.AppData.currentDate
			registry.byId('list-title').set('label',this._getDate(date))
			var t = ['e','i','t']
			for (var i in t)
				registry.byId('list-is-'+t[i]).set('selected',false)
			registry.byId('list-is-'+window.AppData.currentType).set('selected',true)
		},
		beforeActivate: function(contact){
            var self = this
            
            var callback = function(){
				var _self = window.dFinance.children.dFinance_list
				if(_self.params.type)
					window.AppData.currentType = _self.params.type
				if( _self.params.id)
					window.AppData.currentDate = _self.params.id;
				//empty page
				arrayUtil.forEach(registry.byId('daily-list').getChildren(), function(li){
					li.destroyRecursive()
				})
				domConstruct.empty('daily-list')
				//
				_self.transactions.refresh()
				self._renderHeader()
			
				_self.reloadPage();
			}
            
            setTimeout(function(){
				callback.call(self)
			},0)
		},
		reloadPage: function(){
			var _this = this
			domAttr.set(_this.emptyMsgTitle.domNode,"innerHTML",
				window.AppData.currentType == "e" ? _this.nls.noExpences : (
					window.AppData.currentType == "i" ? _this.nls.noIncomes :
						_this.nls.noTransfers
				)
			)
			domStyle.set(_this.emptyMsgTitle.domNode,"display",_this.transactions.getChildren().length ? "none" : "")
			domStyle.set(_this.emptyMsg.domNode,"display",_this.transactions.getChildren().length ? "none" : "")
			domClass[_this.transactions.getChildren().length ? "remove" : "add"](_this.transactions.domNode, 'empty')
		},
        query: function(item){
			return (getDateString(item.date,locale) == window.AppData.currentDate) && (item.type == window.AppData.currentType)
		},
        listItem: TransactionListItem,
        init: function(){
            //on(this.domNode, swipe, function(e){console.log(e)});
			var self = this
			on(this.domNode, swipe.end, function(e){
				var id = self.params.id
				var idDate = locale.parse(id,{"selector":"date", "datePattern":"yyyy-MM-dd"})
				if(Math.abs(e.dy) < 30){
					if(Math.abs(e.dx)>50){
						var newDate = date.add(idDate,'day', (e.dx > 0 ? -1 : 1));
						idDate = locale.format(newDate,{"selector":"date", "datePattern":"yyyy-MM-dd"})
						window.dFinance.transitionToView(self.domNode,{
							"target": "list" , "transitionDir": -1,
							"params": {id: idDate, type: self.params.type}
						})
					}
				}
			});
        },
        createListItem: function(/*Object*/item){
			// summary:
			//		Creates a list item widget.
			var itemClone = lang.clone(item)
			itemClone.amount = getMoney(item.amount, window.AppData.store.getAccount(item.account).maincur)
			console.log('item is ', item)
			itemClone.account = 
				( itemClone.type!="t" ) ? 
					window.AppData.store.getAccount(item.account).label : 
				( window.AppData.store.getAccount(item.account).label + " -> " + 
					(window.AppData.store.getAccount(item.accountTo) ? window.AppData.store.getAccount(item.accountTo).label : '...'))
			var tags = ""
			for (var i in item.tags){
				if(tags != "") tags+=", "
				tags += window.AppData.store.getTag(item.tags[i]).label
			}
			if(tags == "") tags = "No tags"
			itemClone.cats = 
				"<div class='date-header'>" + tags + "</div>" + "<div class='summary'>"+self.substitute(self._accountTemplate, itemClone)+"</div>"+
				(itemClone.descr ? ("<div class='li-descr'><hr/>"+itemClone.descr+"</div>") : "")
			
			//rData.display = (rData.descr ? "display:inline" : "display:none")
			console.log(itemClone)
			return new this.itemRenderer(
				this._createItemProperties(itemClone)
			);			
		}
    };
});

},
'dojox/gfx':function(){
define(["dojo/_base/lang", "./gfx/_base", "./gfx/renderer!"], 
  function(lang, gfxBase, renderer){
	// module:
	//		dojox/gfx
	// summary:
	//		This the root of the Dojo Graphics package
	gfxBase.switchTo(renderer);
	return gfxBase;
});

},
'dojo/number':function(){
define([/*===== "./_base/declare", =====*/ "./_base/lang", "./i18n", "./i18n!./cldr/nls/number", "./string", "./regexp"],
	function(/*===== declare, =====*/ lang, i18n, nlsNumber, dstring, dregexp){

// module:
//		dojo/number

var number = {
	// summary:
	//		localized formatting and parsing routines for Number
};
lang.setObject("dojo.number", number);

/*=====
number.__FormatOptions = declare(null, {
	// pattern: String?
	//		override [formatting pattern](http://www.unicode.org/reports/tr35/#Number_Format_Patterns)
	//		with this string.  Default value is based on locale.  Overriding this property will defeat
	//		localization.  Literal characters in patterns are not supported.
	// type: String?
	//		choose a format type based on the locale from the following:
	//		decimal, scientific (not yet supported), percent, currency. decimal by default.
	// places: Number?
	//		fixed number of decimal places to show.  This overrides any
	//		information in the provided pattern.
	// round: Number?
	//		5 rounds to nearest .5; 0 rounds to nearest whole (default). -1
	//		means do not round.
	// locale: String?
	//		override the locale used to determine formatting rules
	// fractional: Boolean?
	//		If false, show no decimal places, overriding places and pattern settings.
});
=====*/

number.format = function(/*Number*/ value, /*number.__FormatOptions?*/ options){
	// summary:
	//		Format a Number as a String, using locale-specific settings
	// description:
	//		Create a string from a Number using a known localized pattern.
	//		Formatting patterns appropriate to the locale are chosen from the
	//		[Common Locale Data Repository](http://unicode.org/cldr) as well as the appropriate symbols and
	//		delimiters.
	//		If value is Infinity, -Infinity, or is not a valid JavaScript number, return null.
	// value:
	//		the number to be formatted

	options = lang.mixin({}, options || {});
	var locale = i18n.normalizeLocale(options.locale),
		bundle = i18n.getLocalization("dojo.cldr", "number", locale);
	options.customs = bundle;
	var pattern = options.pattern || bundle[(options.type || "decimal") + "Format"];
	if(isNaN(value) || Math.abs(value) == Infinity){ return null; } // null
	return number._applyPattern(value, pattern, options); // String
};

//number._numberPatternRE = /(?:[#0]*,?)*[#0](?:\.0*#*)?/; // not precise, but good enough
number._numberPatternRE = /[#0,]*[#0](?:\.0*#*)?/; // not precise, but good enough

number._applyPattern = function(/*Number*/ value, /*String*/ pattern, /*number.__FormatOptions?*/ options){
	// summary:
	//		Apply pattern to format value as a string using options. Gives no
	//		consideration to local customs.
	// value:
	//		the number to be formatted.
	// pattern:
	//		a pattern string as described by
	//		[unicode.org TR35](http://www.unicode.org/reports/tr35/#Number_Format_Patterns)
	// options: number.__FormatOptions?
	//		_applyPattern is usually called via `dojo/number.format()` which
	//		populates an extra property in the options parameter, "customs".
	//		The customs object specifies group and decimal parameters if set.

	//TODO: support escapes
	options = options || {};
	var group = options.customs.group,
		decimal = options.customs.decimal,
		patternList = pattern.split(';'),
		positivePattern = patternList[0];
	pattern = patternList[(value < 0) ? 1 : 0] || ("-" + positivePattern);

	//TODO: only test against unescaped
	if(pattern.indexOf('%') != -1){
		value *= 100;
	}else if(pattern.indexOf('\u2030') != -1){
		value *= 1000; // per mille
	}else if(pattern.indexOf('\u00a4') != -1){
		group = options.customs.currencyGroup || group;//mixins instead?
		decimal = options.customs.currencyDecimal || decimal;// Should these be mixins instead?
		pattern = pattern.replace(/\u00a4{1,3}/, function(match){
			var prop = ["symbol", "currency", "displayName"][match.length-1];
			return options[prop] || options.currency || "";
		});
	}else if(pattern.indexOf('E') != -1){
		throw new Error("exponential notation not supported");
	}

	//TODO: support @ sig figs?
	var numberPatternRE = number._numberPatternRE;
	var numberPattern = positivePattern.match(numberPatternRE);
	if(!numberPattern){
		throw new Error("unable to find a number expression in pattern: "+pattern);
	}
	if(options.fractional === false){ options.places = 0; }
	return pattern.replace(numberPatternRE,
		number._formatAbsolute(value, numberPattern[0], {decimal: decimal, group: group, places: options.places, round: options.round}));
};

number.round = function(/*Number*/ value, /*Number?*/ places, /*Number?*/ increment){
	// summary:
	//		Rounds to the nearest value with the given number of decimal places, away from zero
	// description:
	//		Rounds to the nearest value with the given number of decimal places, away from zero if equal.
	//		Similar to Number.toFixed(), but compensates for browser quirks. Rounding can be done by
	//		fractional increments also, such as the nearest quarter.
	//		NOTE: Subject to floating point errors.  See dojox/math/round for experimental workaround.
	// value:
	//		The number to round
	// places:
	//		The number of decimal places where rounding takes place.  Defaults to 0 for whole rounding.
	//		Must be non-negative.
	// increment:
	//		Rounds next place to nearest value of increment/10.  10 by default.
	// example:
	// |	>>> number.round(-0.5)
	// |	-1
	// |	>>> number.round(162.295, 2)
	// |	162.29  // note floating point error.  Should be 162.3
	// |	>>> number.round(10.71, 0, 2.5)
	// |	10.75
	var factor = 10 / (increment || 10);
	return (factor * +value).toFixed(places) / factor; // Number
};

if((0.9).toFixed() == 0){
	// (isIE) toFixed() bug workaround: Rounding fails on IE when most significant digit
	// is just after the rounding place and is >=5
	var round = number.round;
	number.round = function(v, p, m){
		var d = Math.pow(10, -p || 0), a = Math.abs(v);
		if(!v || a >= d){
			d = 0;
		}else{
			a /= d;
			if(a < 0.5 || a >= 0.95){
				d = 0;
			}
		}
		return round(v, p, m) + (v > 0 ? d : -d);
	};

	// Use "doc hint" so the doc parser ignores this new definition of round(), and uses the one above.
	/*===== number.round = round; =====*/
}

/*=====
number.__FormatAbsoluteOptions = declare(null, {
	// decimal: String?
	//		the decimal separator
	// group: String?
	//		the group separator
	// places: Number|String?
	//		number of decimal places.  the range "n,m" will format to m places.
	// round: Number?
	//		5 rounds to nearest .5; 0 rounds to nearest whole (default). -1
	//		means don't round.
});
=====*/

number._formatAbsolute = function(/*Number*/ value, /*String*/ pattern, /*number.__FormatAbsoluteOptions?*/ options){
	// summary:
	//		Apply numeric pattern to absolute value using options. Gives no
	//		consideration to local customs.
	// value:
	//		the number to be formatted, ignores sign
	// pattern:
	//		the number portion of a pattern (e.g. `#,##0.00`)
	options = options || {};
	if(options.places === true){options.places=0;}
	if(options.places === Infinity){options.places=6;} // avoid a loop; pick a limit

	var patternParts = pattern.split("."),
		comma = typeof options.places == "string" && options.places.indexOf(","),
		maxPlaces = options.places;
	if(comma){
		maxPlaces = options.places.substring(comma + 1);
	}else if(!(maxPlaces >= 0)){
		maxPlaces = (patternParts[1] || []).length;
	}
	if(!(options.round < 0)){
		value = number.round(value, maxPlaces, options.round);
	}

	var valueParts = String(Math.abs(value)).split("."),
		fractional = valueParts[1] || "";
	if(patternParts[1] || options.places){
		if(comma){
			options.places = options.places.substring(0, comma);
		}
		// Pad fractional with trailing zeros
		var pad = options.places !== undefined ? options.places : (patternParts[1] && patternParts[1].lastIndexOf("0") + 1);
		if(pad > fractional.length){
			valueParts[1] = dstring.pad(fractional, pad, '0', true);
		}

		// Truncate fractional
		if(maxPlaces < fractional.length){
			valueParts[1] = fractional.substr(0, maxPlaces);
		}
	}else{
		if(valueParts[1]){ valueParts.pop(); }
	}

	// Pad whole with leading zeros
	var patternDigits = patternParts[0].replace(',', '');
	pad = patternDigits.indexOf("0");
	if(pad != -1){
		pad = patternDigits.length - pad;
		if(pad > valueParts[0].length){
			valueParts[0] = dstring.pad(valueParts[0], pad);
		}

		// Truncate whole
		if(patternDigits.indexOf("#") == -1){
			valueParts[0] = valueParts[0].substr(valueParts[0].length - pad);
		}
	}

	// Add group separators
	var index = patternParts[0].lastIndexOf(','),
		groupSize, groupSize2;
	if(index != -1){
		groupSize = patternParts[0].length - index - 1;
		var remainder = patternParts[0].substr(0, index);
		index = remainder.lastIndexOf(',');
		if(index != -1){
			groupSize2 = remainder.length - index - 1;
		}
	}
	var pieces = [];
	for(var whole = valueParts[0]; whole;){
		var off = whole.length - groupSize;
		pieces.push((off > 0) ? whole.substr(off) : whole);
		whole = (off > 0) ? whole.slice(0, off) : "";
		if(groupSize2){
			groupSize = groupSize2;
			delete groupSize2;
		}
	}
	valueParts[0] = pieces.reverse().join(options.group || ",");

	return valueParts.join(options.decimal || ".");
};

/*=====
number.__RegexpOptions = declare(null, {
	// pattern: String?
	//		override [formatting pattern](http://www.unicode.org/reports/tr35/#Number_Format_Patterns)
	//		with this string.  Default value is based on locale.  Overriding this property will defeat
	//		localization.
	// type: String?
	//		choose a format type based on the locale from the following:
	//		decimal, scientific (not yet supported), percent, currency. decimal by default.
	// locale: String?
	//		override the locale used to determine formatting rules
	// strict: Boolean?
	//		strict parsing, false by default.  Strict parsing requires input as produced by the format() method.
	//		Non-strict is more permissive, e.g. flexible on white space, omitting thousands separators
	// places: Number|String?
	//		number of decimal places to accept: Infinity, a positive number, or
	//		a range "n,m".  Defined by pattern or Infinity if pattern not provided.
});
=====*/
number.regexp = function(/*number.__RegexpOptions?*/ options){
	// summary:
	//		Builds the regular needed to parse a number
	// description:
	//		Returns regular expression with positive and negative match, group
	//		and decimal separators
	return number._parseInfo(options).regexp; // String
};

number._parseInfo = function(/*Object?*/ options){
	options = options || {};
	var locale = i18n.normalizeLocale(options.locale),
		bundle = i18n.getLocalization("dojo.cldr", "number", locale),
		pattern = options.pattern || bundle[(options.type || "decimal") + "Format"],
//TODO: memoize?
		group = bundle.group,
		decimal = bundle.decimal,
		factor = 1;

	if(pattern.indexOf('%') != -1){
		factor /= 100;
	}else if(pattern.indexOf('\u2030') != -1){
		factor /= 1000; // per mille
	}else{
		var isCurrency = pattern.indexOf('\u00a4') != -1;
		if(isCurrency){
			group = bundle.currencyGroup || group;
			decimal = bundle.currencyDecimal || decimal;
		}
	}

	//TODO: handle quoted escapes
	var patternList = pattern.split(';');
	if(patternList.length == 1){
		patternList.push("-" + patternList[0]);
	}

	var re = dregexp.buildGroupRE(patternList, function(pattern){
		pattern = "(?:"+dregexp.escapeString(pattern, '.')+")";
		return pattern.replace(number._numberPatternRE, function(format){
			var flags = {
				signed: false,
				separator: options.strict ? group : [group,""],
				fractional: options.fractional,
				decimal: decimal,
				exponent: false
				},

				parts = format.split('.'),
				places = options.places;

			// special condition for percent (factor != 1)
			// allow decimal places even if not specified in pattern
			if(parts.length == 1 && factor != 1){
			    parts[1] = "###";
			}
			if(parts.length == 1 || places === 0){
				flags.fractional = false;
			}else{
				if(places === undefined){ places = options.pattern ? parts[1].lastIndexOf('0') + 1 : Infinity; }
				if(places && options.fractional == undefined){flags.fractional = true;} // required fractional, unless otherwise specified
				if(!options.places && (places < parts[1].length)){ places += "," + parts[1].length; }
				flags.places = places;
			}
			var groups = parts[0].split(',');
			if(groups.length > 1){
				flags.groupSize = groups.pop().length;
				if(groups.length > 1){
					flags.groupSize2 = groups.pop().length;
				}
			}
			return "("+number._realNumberRegexp(flags)+")";
		});
	}, true);

	if(isCurrency){
		// substitute the currency symbol for the placeholder in the pattern
		re = re.replace(/([\s\xa0]*)(\u00a4{1,3})([\s\xa0]*)/g, function(match, before, target, after){
			var prop = ["symbol", "currency", "displayName"][target.length-1],
				symbol = dregexp.escapeString(options[prop] || options.currency || "");
			before = before ? "[\\s\\xa0]" : "";
			after = after ? "[\\s\\xa0]" : "";
			if(!options.strict){
				if(before){before += "*";}
				if(after){after += "*";}
				return "(?:"+before+symbol+after+")?";
			}
			return before+symbol+after;
		});
	}

//TODO: substitute localized sign/percent/permille/etc.?

	// normalize whitespace and return
	return {regexp: re.replace(/[\xa0 ]/g, "[\\s\\xa0]"), group: group, decimal: decimal, factor: factor}; // Object
};

/*=====
number.__ParseOptions = declare(null, {
	// pattern: String?
	//		override [formatting pattern](http://www.unicode.org/reports/tr35/#Number_Format_Patterns)
	//		with this string.  Default value is based on locale.  Overriding this property will defeat
	//		localization.  Literal characters in patterns are not supported.
	// type: String?
	//		choose a format type based on the locale from the following:
	//		decimal, scientific (not yet supported), percent, currency. decimal by default.
	// locale: String?
	//		override the locale used to determine formatting rules
	// strict: Boolean?
	//		strict parsing, false by default.  Strict parsing requires input as produced by the format() method.
	//		Non-strict is more permissive, e.g. flexible on white space, omitting thousands separators
	// fractional: Boolean|Array?
	//		Whether to include the fractional portion, where the number of decimal places are implied by pattern
	//		or explicit 'places' parameter.  The value [true,false] makes the fractional portion optional.
});
=====*/
number.parse = function(/*String*/ expression, /*number.__ParseOptions?*/ options){
	// summary:
	//		Convert a properly formatted string to a primitive Number, using
	//		locale-specific settings.
	// description:
	//		Create a Number from a string using a known localized pattern.
	//		Formatting patterns are chosen appropriate to the locale
	//		and follow the syntax described by
	//		[unicode.org TR35](http://www.unicode.org/reports/tr35/#Number_Format_Patterns)
    	//		Note that literal characters in patterns are not supported.
	// expression:
	//		A string representation of a Number
	var info = number._parseInfo(options),
		results = (new RegExp("^"+info.regexp+"$")).exec(expression);
	if(!results){
		return NaN; //NaN
	}
	var absoluteMatch = results[1]; // match for the positive expression
	if(!results[1]){
		if(!results[2]){
			return NaN; //NaN
		}
		// matched the negative pattern
		absoluteMatch =results[2];
		info.factor *= -1;
	}

	// Transform it to something Javascript can parse as a number.  Normalize
	// decimal point and strip out group separators or alternate forms of whitespace
	absoluteMatch = absoluteMatch.
		replace(new RegExp("["+info.group + "\\s\\xa0"+"]", "g"), "").
		replace(info.decimal, ".");
	// Adjust for negative sign, percent, etc. as necessary
	return absoluteMatch * info.factor; //Number
};

/*=====
number.__RealNumberRegexpFlags = declare(null, {
	// places: Number?
	//		The integer number of decimal places or a range given as "n,m".  If
	//		not given, the decimal part is optional and the number of places is
	//		unlimited.
	// decimal: String?
	//		A string for the character used as the decimal point.  Default
	//		is ".".
	// fractional: Boolean|Array?
	//		Whether decimal places are used.  Can be true, false, or [true,
	//		false].  Default is [true, false] which means optional.
	// exponent: Boolean|Array?
	//		Express in exponential notation.  Can be true, false, or [true,
	//		false]. Default is [true, false], (i.e. will match if the
	//		exponential part is present are not).
	// eSigned: Boolean|Array?
	//		The leading plus-or-minus sign on the exponent.  Can be true,
	//		false, or [true, false].  Default is [true, false], (i.e. will
	//		match if it is signed or unsigned).  flags in regexp.integer can be
	//		applied.
});
=====*/

number._realNumberRegexp = function(/*__RealNumberRegexpFlags?*/ flags){
	// summary:
	//		Builds a regular expression to match a real number in exponential
	//		notation

	// assign default values to missing parameters
	flags = flags || {};
	//TODO: use mixin instead?
	if(!("places" in flags)){ flags.places = Infinity; }
	if(typeof flags.decimal != "string"){ flags.decimal = "."; }
	if(!("fractional" in flags) || /^0/.test(flags.places)){ flags.fractional = [true, false]; }
	if(!("exponent" in flags)){ flags.exponent = [true, false]; }
	if(!("eSigned" in flags)){ flags.eSigned = [true, false]; }

	var integerRE = number._integerRegexp(flags),
		decimalRE = dregexp.buildGroupRE(flags.fractional,
		function(q){
			var re = "";
			if(q && (flags.places!==0)){
				re = "\\" + flags.decimal;
				if(flags.places == Infinity){
					re = "(?:" + re + "\\d+)?";
				}else{
					re += "\\d{" + flags.places + "}";
				}
			}
			return re;
		},
		true
	);

	var exponentRE = dregexp.buildGroupRE(flags.exponent,
		function(q){
			if(q){ return "([eE]" + number._integerRegexp({ signed: flags.eSigned}) + ")"; }
			return "";
		}
	);

	var realRE = integerRE + decimalRE;
	// allow for decimals without integers, e.g. .25
	if(decimalRE){realRE = "(?:(?:"+ realRE + ")|(?:" + decimalRE + "))";}
	return realRE + exponentRE; // String
};

/*=====
number.__IntegerRegexpFlags = declare(null, {
	// signed: Boolean?
	//		The leading plus-or-minus sign. Can be true, false, or `[true,false]`.
	//		Default is `[true, false]`, (i.e. will match if it is signed
	//		or unsigned).
	// separator: String?
	//		The character used as the thousands separator. Default is no
	//		separator. For more than one symbol use an array, e.g. `[",", ""]`,
	//		makes ',' optional.
	// groupSize: Number?
	//		group size between separators
	// groupSize2: Number?
	//		second grouping, where separators 2..n have a different interval than the first separator (for India)
});
=====*/

number._integerRegexp = function(/*number.__IntegerRegexpFlags?*/ flags){
	// summary:
	//		Builds a regular expression that matches an integer

	// assign default values to missing parameters
	flags = flags || {};
	if(!("signed" in flags)){ flags.signed = [true, false]; }
	if(!("separator" in flags)){
		flags.separator = "";
	}else if(!("groupSize" in flags)){
		flags.groupSize = 3;
	}

	var signRE = dregexp.buildGroupRE(flags.signed,
		function(q){ return q ? "[-+]" : ""; },
		true
	);

	var numberRE = dregexp.buildGroupRE(flags.separator,
		function(sep){
			if(!sep){
				return "(?:\\d+)";
			}

			sep = dregexp.escapeString(sep);
			if(sep == " "){ sep = "\\s"; }
			else if(sep == "\xa0"){ sep = "\\s\\xa0"; }

			var grp = flags.groupSize, grp2 = flags.groupSize2;
			//TODO: should we continue to enforce that numbers with separators begin with 1-9?  See #6933
			if(grp2){
				var grp2RE = "(?:0|[1-9]\\d{0," + (grp2-1) + "}(?:[" + sep + "]\\d{" + grp2 + "})*[" + sep + "]\\d{" + grp + "})";
				return ((grp-grp2) > 0) ? "(?:" + grp2RE + "|(?:0|[1-9]\\d{0," + (grp-1) + "}))" : grp2RE;
			}
			return "(?:0|[1-9]\\d{0," + (grp-1) + "}(?:[" + sep + "]\\d{" + grp + "})*)";
		},
		true
	);

	return signRE + numberRE; // String
};

return number;
});

},
'dojox/gfx/shape':function(){
define(["./_base", "dojo/_base/lang", "dojo/_base/declare", "dojo/_base/kernel", "dojo/_base/sniff",
	"dojo/on", "dojo/_base/array", "dojo/dom-construct", "dojo/_base/Color", "./matrix" ],
	function(g, lang, declare, kernel, has, on, arr, domConstruct, Color, matrixLib){

	var shape = g.shape = {
		// summary:
		//		This module contains the core graphics Shape API.
		//		Different graphics renderer implementation modules (svg, canvas, vml, silverlight, etc.) extend this
		//		basic api to provide renderer-specific implementations for each shape.
	};

	shape.Shape = declare("dojox.gfx.shape.Shape", null, {
		// summary:
		//		a Shape object, which knows how to apply
		//		graphical attributes and transformations
	
		constructor: function(){
			// rawNode: Node
			//		underlying graphics-renderer-specific implementation object (if applicable)
			this.rawNode = null;

			// shape: Object
			//		an abstract shape object
			//		(see dojox/gfx.defaultPath,
			//		dojox/gfx.defaultPolyline,
			//		dojox/gfx.defaultRect,
			//		dojox/gfx.defaultEllipse,
			//		dojox/gfx.defaultCircle,
			//		dojox/gfx.defaultLine,
			//		or dojox/gfx.defaultImage)
			this.shape = null;
	
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a transformation matrix
			this.matrix = null;
	
			// fillStyle: dojox/gfx.Fill
			//		a fill object
			//		(see dojox/gfx.defaultLinearGradient,
			//		dojox/gfx.defaultRadialGradient,
			//		dojox/gfx.defaultPattern,
			//		or dojo/Color)
			this.fillStyle = null;
	
			// strokeStyle: dojox/gfx.Stroke
			//		a stroke object
			//		(see dojox/gfx.defaultStroke)
			this.strokeStyle = null;
	
			// bbox: dojox/gfx.Rectangle
			//		a bounding box of this shape
			//		(see dojox/gfx.defaultRect)
			this.bbox = null;
	
			// virtual group structure
	
			// parent: Object
			//		a parent or null
			//		(see dojox/gfx/shape.Surface,
			//		or dojox/gfx.Group)
			this.parent = null;
	
			// parentMatrix: dojox/gfx/matrix.Matrix2D
			//		a transformation matrix inherited from the parent
			this.parentMatrix = null;

			if(has("gfxRegistry")){
				var uid = shape.register(this);
				this.getUID = function(){
					return uid;
				}
			}
		},
		
		destroy: function(){
			// summary:
			//		Releases all internal resources owned by this shape. Once this method has been called,
			//		the instance is considered destroyed and should not be used anymore.
			if(has("gfxRegistry")){
				shape.dispose(this);
			}
			if(this.rawNode && "__gfxObject__" in this.rawNode){
				this.rawNode.__gfxObject__ = null;
			}
			this.rawNode = null;
		},
	
		// trivial getters
	
		getNode: function(){
			// summary:
			//		Different graphics rendering subsystems implement shapes in different ways.  This
			//		method provides access to the underlying graphics subsystem object.  Clients calling this
			//		method and using the return value must be careful not to try sharing or using the underlying node
			//		in a general way across renderer implementation.
			//		Returns the underlying graphics Node, or null if no underlying graphics node is used by this shape.
			return this.rawNode; // Node
		},
		getShape: function(){
			// summary:
			//		returns the current Shape object or null
			//		(see dojox/gfx.defaultPath,
			//		dojox/gfx.defaultPolyline,
			//		dojox/gfx.defaultRect,
			//		dojox/gfx.defaultEllipse,
			//		dojox/gfx.defaultCircle,
			//		dojox/gfx.defaultLine,
			//		or dojox/gfx.defaultImage)
			return this.shape; // Object
		},
		getTransform: function(){
			// summary:
			//		Returns the current transformation matrix applied to this Shape or null
			return this.matrix;	// dojox/gfx/matrix.Matrix2D
		},
		getFill: function(){
			// summary:
			//		Returns the current fill object or null
			//		(see dojox/gfx.defaultLinearGradient,
			//		dojox/gfx.defaultRadialGradient,
			//		dojox/gfx.defaultPattern,
			//		or dojo/Color)
			return this.fillStyle;	// Object
		},
		getStroke: function(){
			// summary:
			//		Returns the current stroke object or null
			//		(see dojox/gfx.defaultStroke)
			return this.strokeStyle;	// Object
		},
		getParent: function(){
			// summary:
			//		Returns the parent Shape, Group or null if this Shape is unparented.
			//		(see dojox/gfx/shape.Surface,
			//		or dojox/gfx.Group)
			return this.parent;	// Object
		},
		getBoundingBox: function(){
			// summary:
			//		Returns the bounding box Rectangle for this shape or null if a BoundingBox cannot be
			//		calculated for the shape on the current renderer or for shapes with no geometric area (points).
			//		A bounding box is a rectangular geometric region
			//		defining the X and Y extent of the shape.
			//		(see dojox/gfx.defaultRect)
			//		Note that this method returns a direct reference to the attribute of this instance. Therefore you should
			//		not modify its value directly but clone it instead.
			return this.bbox;	// dojox/gfx.Rectangle
		},
		getTransformedBoundingBox: function(){
			// summary:
			//		returns an array of four points or null
			//		four points represent four corners of the untransformed bounding box
			var b = this.getBoundingBox();
			if(!b){
				return null;	// null
			}
			var m = this._getRealMatrix(),
				gm = matrixLib;
			return [	// Array
					gm.multiplyPoint(m, b.x, b.y),
					gm.multiplyPoint(m, b.x + b.width, b.y),
					gm.multiplyPoint(m, b.x + b.width, b.y + b.height),
					gm.multiplyPoint(m, b.x, b.y + b.height)
				];
		},
		getEventSource: function(){
			// summary:
			//		returns a Node, which is used as
			//		a source of events for this shape
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			return this.rawNode;	// Node
		},
	
		// empty settings
		
		setClip: function(clip){
			// summary:
			//		sets the clipping area of this shape.
			// description:
			//		The clipping area defines the shape area that will be effectively visible. Everything that
			//		would be drawn outside of the clipping area will not be rendered.
			//		The possible clipping area types are rectangle, ellipse, polyline and path, but all are not
			//		supported by all the renderers. vml only supports rectangle clipping, while the gfx silverlight renderer does not
			//		support path clipping.
			//		The clip parameter defines the clipping area geometry, and should be an object with the following properties:
			//
			//		- {x:Number, y:Number, width:Number, height:Number} for rectangular clip
			//		- {cx:Number, cy:Number, rx:Number, ry:Number} for ellipse clip
			//		- {points:Array} for polyline clip
			//		- {d:String} for a path clip.
			//
			//		The clip geometry coordinates are expressed in the coordinate system used to draw the shape. In other
			//		words, the clipping area is defined in the shape parent coordinate system and the shape transform is automatically applied.
			// example:
			//		The following example shows how to clip a gfx image with all the possible clip geometry: a rectangle,
			//		an ellipse, a circle (using the ellipse geometry), a polyline and a path:
			//
			//	|	surface.createImage({src:img, width:200,height:200}).setClip({x:10,y:10,width:50,height:50});
			//	|	surface.createImage({src:img, x:100,y:50,width:200,height:200}).setClip({cx:200,cy:100,rx:20,ry:30});
			//	|	surface.createImage({src:img, x:0,y:350,width:200,height:200}).setClip({cx:100,cy:425,rx:60,ry:60});
			//	|	surface.createImage({src:img, x:300,y:0,width:200,height:200}).setClip({points:[350,0,450,50,380,130,300,110]});
			//	|	surface.createImage({src:img, x:300,y:350,width:200,height:200}).setClip({d:"M 350,350 C314,414 317,557 373,450.0000 z"});

			// clip: Object
			//		an object that defines the clipping geometry, or null to remove clip.
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			this.clip = clip;
		},
		
		getClip: function(){
			return this.clip;
		},
	
		setShape: function(shape){
			// summary:
			//		sets a shape object
			//		(the default implementation simply ignores it)
			// shape: Object
			//		a shape object
			//		(see dojox/gfx.defaultPath,
			//		dojox/gfx.defaultPolyline,
			//		dojox/gfx.defaultRect,
			//		dojox/gfx.defaultEllipse,
			//		dojox/gfx.defaultCircle,
			//		dojox/gfx.defaultLine,
			//		or dojox/gfx.defaultImage)
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			this.shape = g.makeParameters(this.shape, shape);
			this.bbox = null;
			return this;	// self
		},
		setFill: function(fill){
			// summary:
			//		sets a fill object
			//		(the default implementation simply ignores it)
			// fill: Object
			//		a fill object
			//		(see dojox/gfx.defaultLinearGradient,
			//		dojox/gfx.defaultRadialGradient,
			//		dojox/gfx.defaultPattern,
			//		or dojo/_base/Color)
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			if(!fill){
				// don't fill
				this.fillStyle = null;
				return this;	// self
			}
			var f = null;
			if(typeof(fill) == "object" && "type" in fill){
				// gradient or pattern
				switch(fill.type){
					case "linear":
						f = g.makeParameters(g.defaultLinearGradient, fill);
						break;
					case "radial":
						f = g.makeParameters(g.defaultRadialGradient, fill);
						break;
					case "pattern":
						f = g.makeParameters(g.defaultPattern, fill);
						break;
				}
			}else{
				// color object
				f = g.normalizeColor(fill);
			}
			this.fillStyle = f;
			return this;	// self
		},
		setStroke: function(stroke){
			// summary:
			//		sets a stroke object
			//		(the default implementation simply ignores it)
			// stroke: Object
			//		a stroke object
			//		(see dojox/gfx.defaultStroke)
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			if(!stroke){
				// don't stroke
				this.strokeStyle = null;
				return this;	// self
			}
			// normalize the stroke
			if(typeof stroke == "string" || lang.isArray(stroke) || stroke instanceof Color){
				stroke = {color: stroke};
			}
			var s = this.strokeStyle = g.makeParameters(g.defaultStroke, stroke);
			s.color = g.normalizeColor(s.color);
			return this;	// self
		},
		setTransform: function(matrix){
			// summary:
			//		sets a transformation matrix
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a matrix or a matrix-like object
			//		(see an argument of dojox/gfx/matrix.Matrix2D
			//		constructor for a list of acceptable arguments)
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			this.matrix = matrixLib.clone(matrix ? matrixLib.normalize(matrix) : matrixLib.identity);
			return this._applyTransform();	// self
		},
	
		_applyTransform: function(){
			// summary:
			//		physically sets a matrix
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			return this;	// self
		},
	
		// z-index
	
		moveToFront: function(){
			// summary:
			//		moves a shape to front of its parent's list of shapes
			var p = this.getParent();
			if(p){
				p._moveChildToFront(this);
				this._moveToFront();	// execute renderer-specific action
			}
			return this;	// self
		},
		moveToBack: function(){
			// summary:
			//		moves a shape to back of its parent's list of shapes
			var p = this.getParent();
			if(p){
				p._moveChildToBack(this);
				this._moveToBack();	// execute renderer-specific action
			}
			return this;
		},
		_moveToFront: function(){
			// summary:
			//		renderer-specific hook, see dojox/gfx/shape.Shape.moveToFront()
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
		},
		_moveToBack: function(){
			// summary:
			//		renderer-specific hook, see dojox/gfx/shape.Shape.moveToFront()
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
		},
	
		// apply left & right transformation
	
		applyRightTransform: function(matrix){
			// summary:
			//		multiplies the existing matrix with an argument on right side
			//		(this.matrix * matrix)
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a matrix or a matrix-like object
			//		(see an argument of dojox/gfx/matrix.Matrix2D
			//		constructor for a list of acceptable arguments)
			return matrix ? this.setTransform([this.matrix, matrix]) : this;	// self
		},
		applyLeftTransform: function(matrix){
			// summary:
			//		multiplies the existing matrix with an argument on left side
			//		(matrix * this.matrix)
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a matrix or a matrix-like object
			//		(see an argument of dojox/gfx/matrix.Matrix2D
			//		constructor for a list of acceptable arguments)
			return matrix ? this.setTransform([matrix, this.matrix]) : this;	// self
		},
		applyTransform: function(matrix){
			// summary:
			//		a shortcut for dojox/gfx/shape.Shape.applyRightTransform
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a matrix or a matrix-like object
			//		(see an argument of dojox/gfx/matrix.Matrix2D
			//		constructor for a list of acceptable arguments)
			return matrix ? this.setTransform([this.matrix, matrix]) : this;	// self
		},
	
		// virtual group methods
	
		removeShape: function(silently){
			// summary:
			//		removes the shape from its parent's list of shapes
			// silently: Boolean
			//		if true, do not redraw a picture yet
			if(this.parent){
				this.parent.remove(this, silently);
			}
			return this;	// self
		},
		_setParent: function(parent, matrix){
			// summary:
			//		sets a parent
			// parent: Object
			//		a parent or null
			//		(see dojox/gfx/shape.Surface,
			//		or dojox/gfx.Group)
			// matrix: dojox/gfx/matrix.Matrix2D
			//		a 2D matrix or a matrix-like object
			this.parent = parent;
			return this._updateParentMatrix(matrix);	// self
		},
		_updateParentMatrix: function(matrix){
			// summary:
			//		updates the parent matrix with new matrix
			// matrix: dojox/gfx/Matrix2D
			//		a 2D matrix or a matrix-like object
			this.parentMatrix = matrix ? matrixLib.clone(matrix) : null;
			return this._applyTransform();	// self
		},
		_getRealMatrix: function(){
			// summary:
			//		returns the cumulative ('real') transformation matrix
			//		by combining the shape's matrix with its parent's matrix
			var m = this.matrix;
			var p = this.parent;
			while(p){
				if(p.matrix){
					m = matrixLib.multiply(p.matrix, m);
				}
				p = p.parent;
			}
			return m;	// dojox/gfx/matrix.Matrix2D
		}
	});
	
	shape._eventsProcessing = {
		on: function(type, listener){
			//	summary:
			//		Connects an event to this shape.

			return on(this.getEventSource(), type, shape.fixCallback(this, g.fixTarget, listener));
		},

		connect: function(name, object, method){
			// summary:
			//		connects a handler to an event on this shape
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
			// redirect to fixCallback to normalize events and add the gfxTarget to the event. The latter
			// is done by dojox/gfx.fixTarget which is defined by each renderer
			if(name.substring(0, 2) == "on"){
				name = name.substring(2);
			}
			return this.on(name, method ? lang.hitch(object, method) : object);
		},

		disconnect: function(token){
			// summary:
			//		connects a handler by token from an event on this shape
			
			// COULD BE RE-IMPLEMENTED BY THE RENDERER!
	
			return token.remove();
		}
	};
	
	shape.fixCallback = function(gfxElement, fixFunction, scope, method){
		// summary:
		//		Wraps the callback to allow for tests and event normalization
		//		before it gets invoked. This is where 'fixTarget' is invoked.
		// tags:
		//      private
		// gfxElement: Object
		//		The GFX object that triggers the action (ex.:
		//		dojox/gfx.Surface and dojox/gfx/shape.Shape). A new event property
		//		'gfxTarget' is added to the event to reference this object.
		//		for easy manipulation of GFX objects by the event handlers.
		// fixFunction: Function
		//		The function that implements the logic to set the 'gfxTarget'
		//		property to the event. It should be 'dojox/gfx.fixTarget' for
		//		most of the cases
		// scope: Object
		//		Optional. The scope to be used when invoking 'method'. If
		//		omitted, a global scope is used.
		// method: Function|String
		//		The original callback to be invoked.
		if(!method){
			method = scope;
			scope = null;
		}
		if(lang.isString(method)){
			scope = scope || kernel.global;
			if(!scope[method]){ throw(['dojox.gfx.shape.fixCallback: scope["', method, '"] is null (scope="', scope, '")'].join('')); }
			return function(e){  
				return fixFunction(e,gfxElement) ? scope[method].apply(scope, arguments || []) : undefined; }; // Function
		}
		return !scope 
			? function(e){ 
				return fixFunction(e,gfxElement) ? method.apply(scope, arguments) : undefined; } 
			: function(e){ 
				return fixFunction(e,gfxElement) ? method.apply(scope, arguments || []) : undefined; }; // Function
	};
	lang.extend(shape.Shape, shape._eventsProcessing);
	
	shape.Container = {
		// summary:
		//		a container of shapes, which can be used
		//		as a foundation for renderer-specific groups, or as a way
		//		to logically group shapes (e.g, to propagate matricies)
	
		_init: function() {
			// children: Array
			//		a list of children
			this.children = [];
			this._batch = 0;
		},
	
		// group management
	
		openBatch: function() {
			// summary:
			//		starts a new batch, subsequent new child shapes will be held in
			//		the batch instead of appending to the container directly.
			// description:
			//		Because the canvas renderer has no DOM hierarchy, the canvas implementation differs
			//		such that it suspends the repaint requests for this container until the current batch is closed by a call to closeBatch().
			return this;
		},
		closeBatch: function() {
			// summary:
			//		submits the current batch, append all pending child shapes to DOM
			// description:
			//		On canvas, this method flushes the pending redraws queue.
			return this;
		},
		add: function(shape){
			// summary:
			//		adds a shape to the list
			// shape: dojox/gfx/shape.Shape
			//		the shape to add to the list
			var oldParent = shape.getParent();
			if(oldParent){
				oldParent.remove(shape, true);
			}
			this.children.push(shape);
			return shape._setParent(this, this._getRealMatrix());	// self
		},
		remove: function(shape, silently){
			// summary:
			//		removes a shape from the list
			// shape: dojox/gfx/shape.Shape
			//		the shape to remove
			// silently: Boolean
			//		if true, do not redraw a picture yet
			for(var i = 0; i < this.children.length; ++i){
				if(this.children[i] == shape){
					if(silently){
						// skip for now
					}else{
						shape.parent = null;
						shape.parentMatrix = null;
					}
					this.children.splice(i, 1);
					break;
				}
			}
			return this;	// self
		},
		clear: function(/*Boolean?*/ destroy){
			// summary:
			//		removes all shapes from a group/surface.
			// destroy: Boolean
			//		Indicates whether the children should be destroyed. Optional.
			var shape;
			for(var i = 0; i < this.children.length;++i){
				shape = this.children[i];
				shape.parent = null;
				shape.parentMatrix = null;
				if(destroy){
					shape.destroy();
				}
			}
			this.children = [];
			return this;	// self
		},
		getBoundingBox: function(){
			// summary:
			//		Returns the bounding box Rectangle for this shape.
			if(this.children){
				// if this is a composite shape, then sum up all the children
				var result = null;
				arr.forEach(this.children, function(shape){
					var bb = shape.getBoundingBox();
					if(bb){
						var ct = shape.getTransform();
						if(ct){
							bb = matrixLib.multiplyRectangle(ct, bb);
						}
						if(result){
							// merge two bbox 
							result.x = Math.min(result.x, bb.x);
							result.y = Math.min(result.y, bb.y);
							result.endX = Math.max(result.endX, bb.x + bb.width);
							result.endY = Math.max(result.endY, bb.y + bb.height);
						}else{
							// first bbox 
							result = {
								x: bb.x,
								y: bb.y,
								endX: bb.x + bb.width,
								endY: bb.y + bb.height
							};
						}
					}
				});
				if(result){
					result.width = result.endX - result.x;
					result.height = result.endY - result.y;
				}
				return result; // dojox/gfx.Rectangle
			}
			// unknown/empty bounding box, subclass shall override this impl 
			return null;
		},
		// moving child nodes
		_moveChildToFront: function(shape){
			// summary:
			//		moves a shape to front of the list of shapes
			// shape: dojox/gfx/shape.Shape
			//		one of the child shapes to move to the front
			for(var i = 0; i < this.children.length; ++i){
				if(this.children[i] == shape){
					this.children.splice(i, 1);
					this.children.push(shape);
					break;
				}
			}
			return this;	// self
		},
		_moveChildToBack: function(shape){
			// summary:
			//		moves a shape to back of the list of shapes
			// shape: dojox/gfx/shape.Shape
			//		one of the child shapes to move to the front
			for(var i = 0; i < this.children.length; ++i){
				if(this.children[i] == shape){
					this.children.splice(i, 1);
					this.children.unshift(shape);
					break;
				}
			}
			return this;	// self
		}
	};

	shape.Surface = declare("dojox.gfx.shape.Surface", null, {
		// summary:
		//		a surface object to be used for drawings
		constructor: function(){
			// underlying node
			this.rawNode = null;
			// the parent node
			this._parent = null;
			// the list of DOM nodes to be deleted in the case of destruction
			this._nodes = [];
			// the list of events to be detached in the case of destruction
			this._events = [];
		},
		destroy: function(){
			// summary:
			//		destroy all relevant external resources and release all
			//		external references to make this object garbage-collectible
			arr.forEach(this._nodes, domConstruct.destroy);
			this._nodes = [];
			arr.forEach(this._events, function(h){ if(h){ h.remove(); } });
			this._events = [];
			this.rawNode = null;	// recycle it in _nodes, if it needs to be recycled
			if(has("ie")){
				while(this._parent.lastChild){
					domConstruct.destroy(this._parent.lastChild);
				}
			}else{
				this._parent.innerHTML = "";
			}
			this._parent = null;
		},
		getEventSource: function(){
			// summary:
			//		returns a node, which can be used to attach event listeners
			return this.rawNode; // Node
		},
		_getRealMatrix: function(){
			// summary:
			//		always returns the identity matrix
			return null;	// dojox/gfx/Matrix2D
		},
		/*=====
		 setDimensions: function(width, height){
			 // summary:
			 //		sets the width and height of the rawNode
			 // width: String
			 //		width of surface, e.g., "100px"
			 // height: String
			 //		height of surface, e.g., "100px"
			 return this;	// self
		 },
		 getDimensions: function(){
			 // summary:
			 //     gets current width and height in pixels
			 // returns: Object
			 //     object with properties "width" and "height"
		 },
		 =====*/
		isLoaded: true,
		onLoad: function(/*dojox/gfx/shape.Surface*/ surface){
			// summary:
			//		local event, fired once when the surface is created
			//		asynchronously, used only when isLoaded is false, required
			//		only for Silverlight.
		},
		whenLoaded: function(/*Object|Null*/ context, /*Function|String*/ method){
			var f = lang.hitch(context, method);
			if(this.isLoaded){
				f(this);
			}else{
				on.once(this, "load", function(surface){
					f(surface);
				});
			}
		}
	});
	lang.extend(shape.Surface, shape._eventsProcessing);

	/*=====
	g.Point = declare("dojox/gfx.Point", null, {
		// summary:
		//		2D point for drawings - {x, y}
		// description:
		//		Do not use this object directly!
		//		Use the naked object instead: {x: 1, y: 2}.
	});

	g.Rectangle = declare("dojox.gfx.Rectangle", null, {
		// summary:
		//		rectangle - {x, y, width, height}
		// description:
		//		Do not use this object directly!
		//		Use the naked object instead: {x: 1, y: 2, width: 100, height: 200}.
	});
	 =====*/


	shape.Rect = declare("dojox.gfx.shape.Rect", shape.Shape, {
		// summary:
		//		a generic rectangle
		constructor: function(rawNode){
			// rawNode: Node
			//		The underlying graphics system object (typically a DOM Node)
			this.shape = g.getDefault("Rect");
			this.rawNode = rawNode;
		},
		getBoundingBox: function(){
			// summary:
			//		returns the bounding box (its shape in this case)
			return this.shape;	// dojox/gfx.Rectangle
		}
	});
	
	shape.Ellipse = declare("dojox.gfx.shape.Ellipse", shape.Shape, {
		// summary:
		//		a generic ellipse
		constructor: function(rawNode){
			// rawNode: Node
			//		a DOM Node
			this.shape = g.getDefault("Ellipse");
			this.rawNode = rawNode;
		},
		getBoundingBox: function(){
			// summary:
			//		returns the bounding box
			if(!this.bbox){
				var shape = this.shape;
				this.bbox = {x: shape.cx - shape.rx, y: shape.cy - shape.ry,
					width: 2 * shape.rx, height: 2 * shape.ry};
			}
			return this.bbox;	// dojox/gfx.Rectangle
		}
	});
	
	shape.Circle = declare("dojox.gfx.shape.Circle", shape.Shape, {
		// summary:
		//		a generic circle
		constructor: function(rawNode){
			// rawNode: Node
			//		a DOM Node
			this.shape = g.getDefault("Circle");
			this.rawNode = rawNode;
		},
		getBoundingBox: function(){
			// summary:
			//		returns the bounding box
			if(!this.bbox){
				var shape = this.shape;
				this.bbox = {x: shape.cx - shape.r, y: shape.cy - shape.r,
					width: 2 * shape.r, height: 2 * shape.r};
			}
			return this.bbox;	// dojox/gfx.Rectangle
		}
	});
	
	shape.Line = declare("dojox.gfx.shape.Line", shape.Shape, {
		// summary:
		//		a generic line (do not instantiate it directly)
		constructor: function(rawNode){
			// rawNode: Node
			//		a DOM Node
			this.shape = g.getDefault("Line");
			this.rawNode = rawNode;
		},
		getBoundingBox: function(){
			// summary:
			//		returns the bounding box
			if(!this.bbox){
				var shape = this.shape;
				this.bbox = {
					x:		Math.min(shape.x1, shape.x2),
					y:		Math.min(shape.y1, shape.y2),
					width:	Math.abs(shape.x2 - shape.x1),
					height:	Math.abs(shape.y2 - shape.y1)
				};
			}
			return this.bbox;	// dojox/gfx.Rectangle
		}
	});
	
	shape.Polyline = declare("dojox.gfx.shape.Polyline", shape.Shape, {
		// summary:
		//		a generic polyline/polygon (do not instantiate it directly)
		constructor: function(rawNode){
			// rawNode: Node
			//		a DOM Node
			this.shape = g.getDefault("Polyline");
			this.rawNode = rawNode;
		},
		setShape: function(points, closed){
			// summary:
			//		sets a polyline/polygon shape object
			// points: Object|Array
			//		a polyline/polygon shape object, or an array of points
			// closed: Boolean
			//		close the polyline to make a polygon
			if(points && points instanceof Array){
				this.inherited(arguments, [{points: points}]);
				if(closed && this.shape.points.length){
					this.shape.points.push(this.shape.points[0]);
				}
			}else{
				this.inherited(arguments, [points]);
			}
			return this;	// self
		},
		_normalizePoints: function(){
			// summary:
			//		normalize points to array of {x:number, y:number}
			var p = this.shape.points, l = p && p.length;
			if(l && typeof p[0] == "number"){
				var points = [];
				for(var i = 0; i < l; i += 2){
					points.push({x: p[i], y: p[i + 1]});
				}
				this.shape.points = points;
			}
		},
		getBoundingBox: function(){
			// summary:
			//		returns the bounding box
			if(!this.bbox && this.shape.points.length){
				var p = this.shape.points;
				var l = p.length;
				var t = p[0];
				var bbox = {l: t.x, t: t.y, r: t.x, b: t.y};
				for(var i = 1; i < l; ++i){
					t = p[i];
					if(bbox.l > t.x) bbox.l = t.x;
					if(bbox.r < t.x) bbox.r = t.x;
					if(bbox.t > t.y) bbox.t = t.y;
					if(bbox.b < t.y) bbox.b = t.y;
				}
				this.bbox = {
					x:		bbox.l,
					y:		bbox.t,
					width:	bbox.r - bbox.l,
					height:	bbox.b - bbox.t
				};
			}
			return this.bbox;	// dojox/gfx.Rectangle
		}
	});
	
	shape.Image = declare("dojox.gfx.shape.Image", shape.Shape, {
		// summary:
		//		a generic image (do not instantiate it directly)
		constructor: function(rawNode){
			// rawNode: Node
			//		a DOM Node
			this.shape = g.getDefault("Image");
			this.rawNode = rawNode;
		},
		getBoundingBox: function(){
			// summary:
			//		returns the bounding box (its shape in this case)
			return this.shape;	// dojox/gfx.Rectangle
		},
		setStroke: function(){
			// summary:
			//		ignore setting a stroke style
			return this;	// self
		},
		setFill: function(){
			// summary:
			//		ignore setting a fill style
			return this;	// self
		}
	});
	
	shape.Text = declare(shape.Shape, {
		// summary:
		//		a generic text (do not instantiate it directly)
		constructor: function(rawNode){
			// rawNode: Node
			//		a DOM Node
			this.fontStyle = null;
			this.shape = g.getDefault("Text");
			this.rawNode = rawNode;
		},
		getFont: function(){
			// summary:
			//		returns the current font object or null
			return this.fontStyle;	// Object
		},
		setFont: function(newFont){
			// summary:
			//		sets a font for text
			// newFont: Object
			//		a font object (see dojox/gfx.defaultFont) or a font string
			this.fontStyle = typeof newFont == "string" ? g.splitFontString(newFont) :
				g.makeParameters(g.defaultFont, newFont);
			this._setFont();
			return this;	// self
		},
		getBoundingBox: function(){
			var bbox = null, s = this.getShape();
			if(s.text){
				bbox = g._base._computeTextBoundingBox(this);
			}
			return bbox;
		}
	});
	
	shape.Creator = {
		// summary:
		//		shape creators
		createShape: function(shape){
			// summary:
			//		creates a shape object based on its type; it is meant to be used
			//		by group-like objects
			// shape: Object
			//		a shape descriptor object
			// returns: dojox/gfx/shape.Shape | Null
			//      a fully instantiated surface-specific Shape object
			switch(shape.type){
				case g.defaultPath.type:		return this.createPath(shape);
				case g.defaultRect.type:		return this.createRect(shape);
				case g.defaultCircle.type:	    return this.createCircle(shape);
				case g.defaultEllipse.type:	    return this.createEllipse(shape);
				case g.defaultLine.type:		return this.createLine(shape);
				case g.defaultPolyline.type:	return this.createPolyline(shape);
				case g.defaultImage.type:		return this.createImage(shape);
				case g.defaultText.type:		return this.createText(shape);
				case g.defaultTextPath.type:	return this.createTextPath(shape);
			}
			return null;
		},
		createGroup: function(){
			// summary:
			//		creates a group shape
			return this.createObject(g.Group);	// dojox/gfx/Group
		},
		createRect: function(rect){
			// summary:
			//		creates a rectangle shape
			// rect: Object
			//		a path object (see dojox/gfx.defaultRect)
			return this.createObject(g.Rect, rect);	// dojox/gfx/shape.Rect
		},
		createEllipse: function(ellipse){
			// summary:
			//		creates an ellipse shape
			// ellipse: Object
			//		an ellipse object (see dojox/gfx.defaultEllipse)
			return this.createObject(g.Ellipse, ellipse);	// dojox/gfx/shape.Ellipse
		},
		createCircle: function(circle){
			// summary:
			//		creates a circle shape
			// circle: Object
			//		a circle object (see dojox/gfx.defaultCircle)
			return this.createObject(g.Circle, circle);	// dojox/gfx/shape.Circle
		},
		createLine: function(line){
			// summary:
			//		creates a line shape
			// line: Object
			//		a line object (see dojox/gfx.defaultLine)
			return this.createObject(g.Line, line);	// dojox/gfx/shape.Line
		},
		createPolyline: function(points){
			// summary:
			//		creates a polyline/polygon shape
			// points: Object
			//		a points object (see dojox/gfx.defaultPolyline)
			//		or an Array of points
			return this.createObject(g.Polyline, points);	// dojox/gfx/shape.Polyline
		},
		createImage: function(image){
			// summary:
			//		creates a image shape
			// image: Object
			//		an image object (see dojox/gfx.defaultImage)
			return this.createObject(g.Image, image);	// dojox/gfx/shape.Image
		},
		createText: function(text){
			// summary:
			//		creates a text shape
			// text: Object
			//		a text object (see dojox/gfx.defaultText)
			return this.createObject(g.Text, text);	// dojox/gfx/shape.Text
		},
		createPath: function(path){
			// summary:
			//		creates a path shape
			// path: Object
			//		a path object (see dojox/gfx.defaultPath)
			return this.createObject(g.Path, path);	// dojox/gfx/shape.Path
		},
		createTextPath: function(text){
			// summary:
			//		creates a text shape
			// text: Object
			//		a textpath object (see dojox/gfx.defaultTextPath)
			return this.createObject(g.TextPath, {}).setText(text);	// dojox/gfx/shape.TextPath
		},
		createObject: function(shapeType, rawShape){
			// summary:
			//		creates an instance of the passed shapeType class
			// shapeType: Function
			//		a class constructor to create an instance of
			// rawShape: Object 
			//		properties to be passed in to the classes 'setShape' method
	
			// SHOULD BE RE-IMPLEMENTED BY THE RENDERER!
			return null;	// dojox/gfx/shape.Shape
		}
	};
	
	/*=====
	 lang.extend(shape.Surface, shape.Container);
	 lang.extend(shape.Surface, shape.Creator);

	 g.Group = declare(shape.Shape, {
		// summary:
		//		a group shape, which can be used
		//		to logically group shapes (e.g, to propagate matricies)
	});
	lang.extend(g.Group, shape.Container);
	lang.extend(g.Group, shape.Creator);

	g.Rect     = shape.Rect;
	g.Circle   = shape.Circle;
	g.Ellipse  = shape.Ellipse;
	g.Line     = shape.Line;
	g.Polyline = shape.Polyline;
	g.Text     = shape.Text;
	g.Surface  = shape.Surface;
	=====*/

	return shape;
});

},
'dojox/gfx/renderer':function(){
define(["./_base","dojo/_base/lang", "dojo/_base/sniff", "dojo/_base/window", "dojo/_base/config"],
  function(g, lang, has, win, config){
  //>> noBuildResolver
	var currentRenderer = null;

	has.add("vml", function(global, document, element){
		element.innerHTML = "<v:shape adj=\"1\"/>";
		var supported = ("adj" in element.firstChild);
		element.innerHTML = "";
		return supported;
	});

	return {
		// summary:
		//		This module is an AMD loader plugin that loads the appropriate graphics renderer
		//		implementation based on detected environment and current configuration settings.
		
		load: function(id, require, load){
			// tags:
			//      private
			if(currentRenderer && id != "force"){
				load(currentRenderer);
				return;
			}
			var renderer = config.forceGfxRenderer,
				renderers = !renderer && (lang.isString(config.gfxRenderer) ?
					config.gfxRenderer : "svg,vml,canvas,silverlight").split(","),
				silverlightObject, silverlightFlag;

			while(!renderer && renderers.length){
				switch(renderers.shift()){
					case "svg":
						// the next test is from https://github.com/phiggins42/has.js
						if("SVGAngle" in win.global){
							renderer = "svg";
						}
						break;
					case "vml":
						if(has("vml")){
							renderer = "vml";
						}
						break;
					case "silverlight":
						try{
							if(has("ie")){
								silverlightObject = new ActiveXObject("AgControl.AgControl");
								if(silverlightObject && silverlightObject.IsVersionSupported("1.0")){
									silverlightFlag = true;
								}
							}else{
								if(navigator.plugins["Silverlight Plug-In"]){
									silverlightFlag = true;
								}
							}
						}catch(e){
							silverlightFlag = false;
						}finally{
							silverlightObject = null;
						}
						if(silverlightFlag){
							renderer = "silverlight";
						}
						break;
					case "canvas":
						if(win.global.CanvasRenderingContext2D){
							renderer = "canvas";
						}
						break;
				}
			}

			if (renderer === 'canvas' && config.canvasEvents !== false) {
				renderer = "canvasWithEvents";
			}

			if(config.isDebug){
				console.log("gfx renderer = " + renderer);
			}

			function loadRenderer(){
				require(["dojox/gfx/" + renderer], function(module){
					g.renderer = renderer;
					// memorize the renderer module
					currentRenderer = module;
					// now load it
					load(module);
				});
			}
			if(renderer == "svg" && typeof window.svgweb != "undefined"){
				window.svgweb.addOnLoad(loadRenderer);
			}else{
				loadRenderer();
			}
		}
	};
});

},
'dojox/lang/functional':function(){
define(["./functional/lambda", "./functional/array", "./functional/object"], function(df){
	return df;
});

},
'dojox/app/utils/nls':function(){
define(["require", "dojo/Deferred"],  function(require, Deferred){
	return function(/*Object*/ config, /*Object*/ parent){
		// summary:
		//		nsl is called to create to load the nls all for the app, or for a view.
		// config: Object
		//		The section of the config for this view or for the app.
		// parent: Object
		//		The parent of this view or the app itself, so that models from the parent will be
		//		available to the view.
		var path = config.nls;
		if(path){
			var nlsDef = new Deferred();
			var requireSignal;
			try{
				var loadFile = path;
				var index = loadFile.indexOf("./");
				if(index >= 0){
					loadFile = path.substring(index+2);
				}
				requireSignal = require.on("error", function(error){
					if (nlsDef.isResolved() || nlsDef.isRejected()) {
						return;
					}
					if(error.info[0] && (error.info[0].indexOf(loadFile)>= 0)){
						nlsDef.resolve(false);
						requireSignal.remove();
					}
				});

				if(path.indexOf("./") == 0){
					path = "app/"+path;
				}

				require(["dojo/i18n!"+path], function(nls){
					nlsDef.resolve(nls);
					requireSignal.remove();
				});
			}catch(e){
				nlsDef.reject(e);
				if(requireSignal){
					requireSignal.remove();
				}
			}
			return nlsDef;
		}else{
			return false;
		}
	};
});

},
'dojox/charting/scaler/common':function(){
define(["dojo/_base/lang"], function(lang){

	var eq = function(/*Number*/ a, /*Number*/ b){
		// summary:
		//		compare two FP numbers for equality
		return Math.abs(a - b) <= 1e-6 * (Math.abs(a) + Math.abs(b));	// Boolean
	};
	
	var common = lang.getObject("dojox.charting.scaler.common", true);
	
	var testedModules = {};

	return lang.mixin(common, {
		doIfLoaded: function(moduleName, ifloaded, ifnotloaded){
			if(testedModules[moduleName] == undefined){
				try{
					testedModules[moduleName] = require(moduleName);
				}catch(e){
					testedModules[moduleName] = null;
				}
			}
			if(testedModules[moduleName]){
				return ifloaded(testedModules[moduleName]);
			}else{
				return ifnotloaded();
			}
		},
		getNumericLabel: function(/*Number*/ number, /*Number*/ precision, /*Object*/ kwArgs){
			var def = "";
			common.doIfLoaded("dojo/number", function(numberLib){
				def = (kwArgs.fixed ? numberLib.format(number, {places : precision < 0 ? -precision : 0}) :
					numberLib.format(number)) || "";
			}, function(){
				def = kwArgs.fixed ? number.toFixed(precision < 0 ? -precision : 0) : number.toString();
			});
			if(kwArgs.labelFunc){
				var r = kwArgs.labelFunc(def, number, precision);
				if(r){ return r; }
				// else fall through to the regular labels search
			}
			if(kwArgs.labels){
				// classic binary search
				// TODO: working only if the array is sorted per value should be better documented or sorted automatically
				var l = kwArgs.labels, lo = 0, hi = l.length;
				while(lo < hi){
					var mid = Math.floor((lo + hi) / 2), val = l[mid].value;
					if(val < number){
						lo = mid + 1;
					}else{
						hi = mid;
					}
				}
				// lets take into account FP errors
				if(lo < l.length && eq(l[lo].value, number)){
					return l[lo].text;
				}
				--lo;
				if(lo >= 0 && lo < l.length && eq(l[lo].value, number)){
					return l[lo].text;
				}
				lo += 2;
				if(lo < l.length && eq(l[lo].value, number)){
					return l[lo].text;
				}
				// otherwise we will produce a number
			}
			return def;
		}
	});
});

},
'dojox/charting/axis2d/common':function(){
define(["dojo/_base/lang", "dojo/_base/window", "dojo/dom-geometry", "dojox/gfx", "dojo/has"],
	function(lang, win, domGeom, g, has){

	var common = lang.getObject("dojox.charting.axis2d.common", true);
	
	var clearNode = function(s){
		s.marginLeft   = "0px";
		s.marginTop    = "0px";
		s.marginRight  = "0px";
		s.marginBottom = "0px";
		s.paddingLeft   = "0px";
		s.paddingTop    = "0px";
		s.paddingRight  = "0px";
		s.paddingBottom = "0px";
		s.borderLeftWidth   = "0px";
		s.borderTopWidth    = "0px";
		s.borderRightWidth  = "0px";
		s.borderBottomWidth = "0px";
	};

	var getBoxWidth = function(n){
		// marginBox is incredibly slow, so avoid it if we can
		if(n["getBoundingClientRect"]){
			var bcr = n.getBoundingClientRect();
			return bcr.width || (bcr.right - bcr.left);
		}else{
			return domGeom.getMarginBox(n).w;
		}
	};

	return lang.mixin(common, {
		// summary:
		//		Common methods to be used by any axis.  This is considered "static".
		createText: {
			gfx: function(chart, creator, x, y, align, text, font, fontColor){
				// summary:
				//		Use dojox.gfx to create any text.
				// chart: dojox.charting.Chart
				//		The chart to create the text into.
				// creator: dojox.gfx.Surface
				//		The graphics surface to use for creating the text.
				// x: Number
				//		Where to create the text along the x axis (CSS left).
				// y: Number
				//		Where to create the text along the y axis (CSS top).
				// align: String
				//		How to align the text.  Can be "left", "right", "center".
				// text: String
				//		The text to render.
				// font: String
				//		The font definition, a la CSS "font".
				// fontColor: String|dojo.Color
				//		The color of the resultant text.
				// returns: dojox.gfx.Text
				//		The resultant GFX object.
				return creator.createText({
					x: x, y: y, text: text, align: align
				}).setFont(font).setFill(fontColor);	//	dojox.gfx.Text
			},
			html: function(chart, creator, x, y, align, text, font, fontColor, labelWidth){
				// summary:
				//		Use the HTML DOM to create any text.
				// chart: dojox.charting.Chart
				//		The chart to create the text into.
				// creator: dojox.gfx.Surface
				//		The graphics surface to use for creating the text.
				// x: Number
				//		Where to create the text along the x axis (CSS left).
				// y: Number
				//		Where to create the text along the y axis (CSS top).
				// align: String
				//		How to align the text.  Can be "left", "right", "center".
				// text: String
				//		The text to render.
				// font: String
				//		The font definition, a la CSS "font".
				// fontColor: String|dojo.Color
				//		The color of the resultant text.
				// labelWidth: Number?
				//		The maximum width of the resultant DOM node.
				// returns: DOMNode
				//		The resultant DOMNode (a "div" element).

				// setup the text node
				var p = win.doc.createElement("div"), s = p.style, boxWidth;
				// bidi support, if this function exists the module was loaded 
				if(chart.getTextDir){
					p.dir = chart.getTextDir(text);
				}
				clearNode(s);
				s.font = font;
				p.innerHTML = String(text).replace(/\s/g, "&nbsp;");
				s.color = fontColor;
				// measure the size
				s.position = "absolute";
				s.left = "-10000px";
				win.body().appendChild(p);
				var size = g.normalizedLength(g.splitFontString(font).size);

				// do we need to calculate the label width?
				if(!labelWidth){
					boxWidth = getBoxWidth(p);
				}
				// when the textDir is rtl, but the UI ltr needs
				// to recalculate the starting point
				if(p.dir == "rtl"){
					x += labelWidth ? labelWidth : boxWidth;
				}

				// new settings for the text node
				win.body().removeChild(p);

				s.position = "relative";
				if(labelWidth){
					s.width = labelWidth + "px";
					// s.border = "1px dotted grey";
					switch(align){
						case "middle":
							s.textAlign = "center";
							s.left = (x - labelWidth / 2) + "px";
							break;
						case "end":
							s.textAlign = "right";
							s.left = (x - labelWidth) + "px";
							break;
						default:
							s.left = x + "px";
							s.textAlign = "left";
							break;
					}
				}else{
					switch(align){
						case "middle":
							s.left = Math.floor(x - boxWidth / 2) + "px";
							// s.left = Math.floor(x - p.offsetWidth / 2) + "px";
							break;
						case "end":
							s.left = Math.floor(x - boxWidth) + "px";
							// s.left = Math.floor(x - p.offsetWidth) + "px";
							break;
						//case "start":
						default:
							s.left = Math.floor(x) + "px";
							break;
					}
				}
				s.top = Math.floor(y - size) + "px";
				s.whiteSpace = "nowrap";	// hack for WebKit
				// setup the wrapper node
				var wrap = win.doc.createElement("div"), w = wrap.style;
				clearNode(w);
				w.width = "0px";
				w.height = "0px";
				// insert nodes
				wrap.appendChild(p);
				chart.node.insertBefore(wrap, chart.node.firstChild);
				if(has("dojo-bidi")){
					chart.htmlElementsRegistry.push([wrap, x, y, align, text, font, fontColor]);
				}
				return wrap;	//	DOMNode
			}
		}
	});
});

},
'dojox/lang/functional/object':function(){
define(["dojo/_base/kernel", "dojo/_base/lang", "./lambda"], function(kernel, lang, df){

// This module adds high-level functions and related constructs:
//	- object/dictionary helpers

// Defined methods:
//	- take any valid lambda argument as the functional argument
//	- skip all attributes that are present in the empty object
//		(IE and/or 3rd-party libraries).

	var empty = {};

	lang.mixin(df, {
		// object helpers
		keys: function(/*Object*/ obj){
			// summary:
			//		returns an array of all keys in the object
			var t = [];
			for(var i in obj){
				if(!(i in empty)){
					t.push(i);
				}
			}
			return	t; // Array
		},
		values: function(/*Object*/ obj){
			// summary:
			//		returns an array of all values in the object
			var t = [];
			for(var i in obj){
				if(!(i in empty)){
					t.push(obj[i]);
				}
			}
			return	t; // Array
		},
		filterIn: function(/*Object*/ obj, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary:
			//		creates new object with all attributes that pass the test
			//		implemented by the provided function.
			o = o || kernel.global; f = df.lambda(f);
			var t = {}, v, i;
			for(i in obj){
				if(!(i in empty)){
					v = obj[i];
					if(f.call(o, v, i, obj)){ t[i] = v; }
				}
			}
			return t;	// Object
		},
		forIn: function(/*Object*/ obj, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary:
			//		iterates over all object attributes.
			o = o || kernel.global; f = df.lambda(f);
			for(var i in obj){
				if(!(i in empty)){
					f.call(o, obj[i], i, obj);
				}
			}
			return o;	// Object
		},
		mapIn: function(/*Object*/ obj, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary:
			//		creates new object with the results of calling
			//		a provided function on every attribute in this object.
			o = o || kernel.global; f = df.lambda(f);
			var t = {}, i;
			for(i in obj){
				if(!(i in empty)){
					t[i] = f.call(o, obj[i], i, obj);
				}
			}
			return t;	// Object
		}
	});
	
	return df;
});

},
'money/views/about':function(){
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

},
'money/views/charts':function(){
define(["dojo/_base/declare","dojo/dom","dojo/dom-class", "dojo/sniff","dojo/dom-style","dojo/date",
	"dojox/charting/Chart", "dojo/_base/array", "dojo/_base/window","dojo/on",
    "dojo/dom-attr",
    // Require the theme of our choosing
    "dojox/charting/themes/Shrooms","dojox/charting/plot2d/Pie","dojox/charting/widget/Legend", "dojox/mobile/ListItem"],
    function(declare,dom,domClass,has,domStyle,dojodate, Chart, arrayUtil, win, on,domAttr, theme, PiePlot, Legend, ListItem){
    
	return window.AppData.objChart = {
		
		/*
		 * Build new or update exsisting pie chart based on given chartData
		 */
		_buildChart: function(chartData){
			domStyle.set('no-transactions-chart', 'display', !chartData.length? 'block':'none')
			domStyle.set('pie-chart', 'display', chartData.length? 'block':'none')
			chartData.sort( function(a, b) {
				return a.y < b.y ? 1 : -1
			})
			
			if(!this.pieChart){
				try{
					this.pieChart = new Chart(dom.byId('chartNode')) 
						.setTheme(theme)
						.addPlot("default", {
							type		: PiePlot, // our plot2d/Pie module reference as type value
							fontColor	: "#333",
							labelWiring	: "#333",
							labelStyle	: "none",
							htmlLabels	: true,
							startAngle	: -10,
							labelOffset	: 20
						})
						.addSeries("tags", chartData)
						.render();
					
					this.legend = new Legend({ chart: this.pieChart,'horizontal' : false }, "legend");
					var self = this
					on(window,'resize', function(){
						self.pieChart.resize()
					})					
				}catch (e){
					domStyle.set('chart-main','display','none')
					console.log('WARN: charts are not supported')
				}
			}else {
				this.pieChart
					.updateSeries('tags',chartData)
					.render()
				this.legend.refresh()
			}
		},
		
		/*
		 * Get data for the bar chart
		 */ 
		_getBarChartData: function(){
			
		},
		
		/*
		 * 	get data (of given type) for the piechart
		 */ 
		_getData:function(type){
			var _t = window.AppData.currentType;
			window.AppData.currentType = type || "e"
			
			// all the transation of given type
			var data = window.AppData.store.query(this.query);
			window.AppData.currentType = _t
			
			var chartData = [], chartKeys = {}, sum = 0
			
			// transfers doesn't affect sums
			arrayUtil.forEach(data, function(item){
				sum += ( item.type != "t" ) ? parseFloat( item.amountHome ) : 0;
			})
			
			// define tags info rendering
			arrayUtil.forEach(data, function(item){
				var tags = item.tags.join(','), tagsLabels = ""
				if(tags){
					for(var i in item.tags){						
						if(window.AppData.tagsStore.get(item.tags[i]))
							tagsLabels += (tagsLabels ? ", " : "") + window.AppData.tagsStore.get(item.tags[i]).label
					}
				} else tags = "no tags", tagsLabels = "no tags"
				if(chartKeys[tags] == undefined){
					chartData.push ({ x:1, y:Math.abs( parseFloat(item.amountHome) ), text: '<span class="chart-label"><span class="chart-label-text">'+tagsLabels+"</span>" + '&nbsp;<span class="chart-label-amount">'+ Math.abs(item.amountHome).toFixed(2) +" ("+(Math.abs(item.amountHome / (sum != 0 ? sum : 0.001))*100).toFixed(2)+"%)</span></span>"});
					chartKeys[tags] = chartData.length-1
				}else {
					chartData[chartKeys[tags]].y += Math.abs(parseFloat(item.amountHome)), chartData[chartKeys[tags]].text = '<span class="chart-label"><span class="chart-label-text">'+tagsLabels + '</span>&nbsp;<span class="chart-label-amount">'+ Math.abs( chartData[ chartKeys[tags] ].y).toFixed(2) + " ("+ (Math.abs( chartData[ chartKeys[tags] ].y / (sum != 0 ? sum : 0.001) ) * 100 ).toFixed(2)+"%)</span></span>"
					
				}
			})
			return chartData
		},
		
		// does THE item should be queried or not?
		query: function(item){
			var allData = window.AppData.chartsView.allData || false
			var from = window.AppData.dateFrom ? window.AppData.dateFrom : (window.AppData.dateFrom = dojodate.add(new Date,"day",-32));
			var to = window.AppData.dateTo ? window.AppData.dateTo : (window.AppData.dateTo = dojodate.add(new Date,"day", 1));
			
			return (allData || item.type==window.AppData.currentType) && 
				(window.AppData.timespan == 'noneTimespan' || (dojodate.difference(item.date, from, "second") < 0) && (dojodate.difference(item.date, to, "second") > 0))
		},
		
		_buildSummary: function(){
			window.AppData.chartsView.allData = true //type-independant query mode
			
			//data - is data of current type
			//data2 - all data in store
			var data = window.AppData.store.query(this.query), e = 0, i = 0, t = 0,			
				data2 = window.AppData.store.query()
			
			window.AppData.chartsView.allData = false //type-dependant query mode
			
			var accData = window.AppData.accountStore.query()
			var accs = {}
			
			domStyle.set('no-accounts-chart','display', !accData.length? 'block':'none')
			domStyle.set('sum-acc','display', accData.length? 'block':'none')
			
			// start accounts sum counting from startAmount
			arrayUtil.forEach(accData, function(account){
				if(account.id){
					accs[account.id] = Number(account.startAmount ? account.startAmount : 0)
				}
			})
			
			console.log(accs)
			// get transaction summary by types
			arrayUtil.forEach(data, function(item){
				if (item.type == "e") e += parseFloat(item.amountHome);
				else if (item.type == "i") i += parseFloat(item.amountHome);
				else if (item.type == "t") t += Math.abs(parseFloat(item.amountHome));
			})
			
			var cashed = 0;
			arrayUtil.forEach(data2, function(item){
				var amount = item.type=="t" ? -Number(item.amount) : Number(item.amount)
				
				cashed += item.account == '0.2997778154166041' ? amount : 0
				//console.log(item.account)
				if(item.account){
					accs[item.account] = 
						(accs[item.account] ? 
							( accs[item.account] + amount ) : amount )
					if( ( item.type=="t" ) && ( item.accountTo ) ) {
						accs[item.accountTo] =
						(accs[item.accountTo] ? 
							( accs[item.accountTo] + Number(item.sumTo) ) : 
							+ Number(item.sumTo));
						
					}
				}
			})
			console.log('ALL TR:', cashed)
			//render transaction types summary
			this.sumE.set('rightText',getMoney(e,window.AppData.currency))
			this.sumI.set('rightText',getMoney(i,window.AppData.currency))
			this.sumT.set('rightText',getMoney(t,window.AppData.currency))
			
			arrayUtil.forEach(this.sumAcc.getChildren(), function(acc){
				acc.destroyRecursive();
			})
			
			var sumAll = 0;
			for (var i in accs){
				sumAll += fx( Number(accs[i]) )
					.from( window.AppData.accountStore.get(i).maincur )
					.to( window.AppData.currency );
				
				this.sumAcc.addChild( new ListItem({
					label		: window.AppData.accountStore.get(i).label,
					rightText	: getMoney(accs[i], window.AppData.accountStore.get(i).maincur)
				}))
			}
			domAttr.set('acc-sum','innerHTML',getMoney(sumAll,window.AppData.currency))
		},
		
		afterActivate: function(contact){
			// x and y coordinates used for easy understanding of where they should display
			// Data represents website visits over a week period
			
			var chartData = this._getData()
			this._buildChart(chartData)
			this._buildSummary()
			var self = this
			setTimeout(function(){
				self.pieChart.resize()
			},1)
        },
        
        init: function(){
			window.AppData.chartsView = this
			var self = this
			if(!has('isInitiallySmall'))
				domClass.add(this.backButton.domNode,'hideOnMedium hideOnLarge')
			
			
			//rebuild pie chart on transaction type change 
			this.expChart.onClick = function(){
				var chartData = self._getData()
				self._buildChart(chartData)
			}
			this.incChart.onClick = function(){
				var chartData = self._getData("i")
				self._buildChart(chartData)
			}
			this.transfChart.onClick = function(){
				var chartData = self._getData("t")
				self._buildChart(chartData)
			}
        }        
    };
});

},
'dojo/colors':function(){
define(["./_base/kernel", "./_base/lang", "./_base/Color", "./_base/array"], function(dojo, lang, Color, ArrayUtil){
	// module:
	//		dojo/colors

	/*=====
	return {
		// summary:
		//		Color utilities, extending Base dojo.Color
	};
	=====*/

	var ColorExt = {};
	lang.setObject("dojo.colors", ColorExt);

//TODO: this module appears to break naming conventions

	// this is a standard conversion prescribed by the CSS3 Color Module
	var hue2rgb = function(m1, m2, h){
		if(h < 0){ ++h; }
		if(h > 1){ --h; }
		var h6 = 6 * h;
		if(h6 < 1){ return m1 + (m2 - m1) * h6; }
		if(2 * h < 1){ return m2; }
		if(3 * h < 2){ return m1 + (m2 - m1) * (2 / 3 - h) * 6; }
		return m1;
	};
	// Override base Color.fromRgb with the impl in this module
	dojo.colorFromRgb = Color.fromRgb = function(/*String*/ color, /*dojo/_base/Color?*/ obj){
		// summary:
		//		get rgb(a) array from css-style color declarations
		// description:
		//		this function can handle all 4 CSS3 Color Module formats: rgb,
		//		rgba, hsl, hsla, including rgb(a) with percentage values.
		var m = color.toLowerCase().match(/^(rgba?|hsla?)\(([\s\.\-,%0-9]+)\)/);
		if(m){
			var c = m[2].split(/\s*,\s*/), l = c.length, t = m[1], a;
			if((t == "rgb" && l == 3) || (t == "rgba" && l == 4)){
				var r = c[0];
				if(r.charAt(r.length - 1) == "%"){
					// 3 rgb percentage values
					a = ArrayUtil.map(c, function(x){
						return parseFloat(x) * 2.56;
					});
					if(l == 4){ a[3] = c[3]; }
					return Color.fromArray(a, obj); // dojo/_base/Color
				}
				return Color.fromArray(c, obj); // dojo/_base/Color
			}
			if((t == "hsl" && l == 3) || (t == "hsla" && l == 4)){
				// normalize hsl values
				var H = ((parseFloat(c[0]) % 360) + 360) % 360 / 360,
					S = parseFloat(c[1]) / 100,
					L = parseFloat(c[2]) / 100,
					// calculate rgb according to the algorithm
					// recommended by the CSS3 Color Module
					m2 = L <= 0.5 ? L * (S + 1) : L + S - L * S,
					m1 = 2 * L - m2;
				a = [
					hue2rgb(m1, m2, H + 1 / 3) * 256,
					hue2rgb(m1, m2, H) * 256,
					hue2rgb(m1, m2, H - 1 / 3) * 256,
					1
				];
				if(l == 4){ a[3] = c[3]; }
				return Color.fromArray(a, obj); // dojo/_base/Color
			}
		}
		return null;	// dojo/_base/Color
	};

	var confine = function(c, low, high){
		// summary:
		//		sanitize a color component by making sure it is a number,
		//		and clamping it to valid values
		c = Number(c);
		return isNaN(c) ? high : c < low ? low : c > high ? high : c;	// Number
	};

	Color.prototype.sanitize = function(){
		// summary:
		//		makes sure that the object has correct attributes
		var t = this;
		t.r = Math.round(confine(t.r, 0, 255));
		t.g = Math.round(confine(t.g, 0, 255));
		t.b = Math.round(confine(t.b, 0, 255));
		t.a = confine(t.a, 0, 1);
		return this;	// dojo/_base/Color
	};

	ColorExt.makeGrey = Color.makeGrey = function(/*Number*/ g, /*Number?*/ a){
		// summary:
		//		creates a greyscale color with an optional alpha
		return Color.fromArray([g, g, g, a]);	// dojo/_base/Color
	};

	// mixin all CSS3 named colors not already in _base, along with SVG 1.0 variant spellings
	lang.mixin(Color.named, {
		"aliceblue":	[240,248,255],
		"antiquewhite": [250,235,215],
		"aquamarine":	[127,255,212],
		"azure":	[240,255,255],
		"beige":	[245,245,220],
		"bisque":	[255,228,196],
		"blanchedalmond":	[255,235,205],
		"blueviolet":	[138,43,226],
		"brown":	[165,42,42],
		"burlywood":	[222,184,135],
		"cadetblue":	[95,158,160],
		"chartreuse":	[127,255,0],
		"chocolate":	[210,105,30],
		"coral":	[255,127,80],
		"cornflowerblue":	[100,149,237],
		"cornsilk": [255,248,220],
		"crimson":	[220,20,60],
		"cyan": [0,255,255],
		"darkblue": [0,0,139],
		"darkcyan": [0,139,139],
		"darkgoldenrod":	[184,134,11],
		"darkgray": [169,169,169],
		"darkgreen":	[0,100,0],
		"darkgrey": [169,169,169],
		"darkkhaki":	[189,183,107],
		"darkmagenta":	[139,0,139],
		"darkolivegreen":	[85,107,47],
		"darkorange":	[255,140,0],
		"darkorchid":	[153,50,204],
		"darkred":	[139,0,0],
		"darksalmon":	[233,150,122],
		"darkseagreen": [143,188,143],
		"darkslateblue":	[72,61,139],
		"darkslategray":	[47,79,79],
		"darkslategrey":	[47,79,79],
		"darkturquoise":	[0,206,209],
		"darkviolet":	[148,0,211],
		"deeppink": [255,20,147],
		"deepskyblue":	[0,191,255],
		"dimgray":	[105,105,105],
		"dimgrey":	[105,105,105],
		"dodgerblue":	[30,144,255],
		"firebrick":	[178,34,34],
		"floralwhite":	[255,250,240],
		"forestgreen":	[34,139,34],
		"gainsboro":	[220,220,220],
		"ghostwhite":	[248,248,255],
		"gold": [255,215,0],
		"goldenrod":	[218,165,32],
		"greenyellow":	[173,255,47],
		"grey": [128,128,128],
		"honeydew": [240,255,240],
		"hotpink":	[255,105,180],
		"indianred":	[205,92,92],
		"indigo":	[75,0,130],
		"ivory":	[255,255,240],
		"khaki":	[240,230,140],
		"lavender": [230,230,250],
		"lavenderblush":	[255,240,245],
		"lawngreen":	[124,252,0],
		"lemonchiffon": [255,250,205],
		"lightblue":	[173,216,230],
		"lightcoral":	[240,128,128],
		"lightcyan":	[224,255,255],
		"lightgoldenrodyellow": [250,250,210],
		"lightgray":	[211,211,211],
		"lightgreen":	[144,238,144],
		"lightgrey":	[211,211,211],
		"lightpink":	[255,182,193],
		"lightsalmon":	[255,160,122],
		"lightseagreen":	[32,178,170],
		"lightskyblue": [135,206,250],
		"lightslategray":	[119,136,153],
		"lightslategrey":	[119,136,153],
		"lightsteelblue":	[176,196,222],
		"lightyellow":	[255,255,224],
		"limegreen":	[50,205,50],
		"linen":	[250,240,230],
		"magenta":	[255,0,255],
		"mediumaquamarine": [102,205,170],
		"mediumblue":	[0,0,205],
		"mediumorchid": [186,85,211],
		"mediumpurple": [147,112,219],
		"mediumseagreen":	[60,179,113],
		"mediumslateblue":	[123,104,238],
		"mediumspringgreen":	[0,250,154],
		"mediumturquoise":	[72,209,204],
		"mediumvioletred":	[199,21,133],
		"midnightblue": [25,25,112],
		"mintcream":	[245,255,250],
		"mistyrose":	[255,228,225],
		"moccasin": [255,228,181],
		"navajowhite":	[255,222,173],
		"oldlace":	[253,245,230],
		"olivedrab":	[107,142,35],
		"orange":	[255,165,0],
		"orangered":	[255,69,0],
		"orchid":	[218,112,214],
		"palegoldenrod":	[238,232,170],
		"palegreen":	[152,251,152],
		"paleturquoise":	[175,238,238],
		"palevioletred":	[219,112,147],
		"papayawhip":	[255,239,213],
		"peachpuff":	[255,218,185],
		"peru": [205,133,63],
		"pink": [255,192,203],
		"plum": [221,160,221],
		"powderblue":	[176,224,230],
		"rosybrown":	[188,143,143],
		"royalblue":	[65,105,225],
		"saddlebrown":	[139,69,19],
		"salmon":	[250,128,114],
		"sandybrown":	[244,164,96],
		"seagreen": [46,139,87],
		"seashell": [255,245,238],
		"sienna":	[160,82,45],
		"skyblue":	[135,206,235],
		"slateblue":	[106,90,205],
		"slategray":	[112,128,144],
		"slategrey":	[112,128,144],
		"snow": [255,250,250],
		"springgreen":	[0,255,127],
		"steelblue":	[70,130,180],
		"tan":	[210,180,140],
		"thistle":	[216,191,216],
		"tomato":	[255,99,71],
		"turquoise":	[64,224,208],
		"violet":	[238,130,238],
		"wheat":	[245,222,179],
		"whitesmoke":	[245,245,245],
		"yellowgreen":	[154,205,50]
	});

	return Color;	// TODO: return ColorExt, not Color
});

},
'dojox/charting/SimpleTheme':function(){
define(["dojo/_base/lang", "dojo/_base/array","dojo/_base/declare","dojo/_base/Color", "dojox/lang/utils", "dojox/gfx/gradutils"],
	function(lang, arr, declare, Color, dlu, dgg){
	
	var SimpleTheme = declare("dojox.charting.SimpleTheme", null, {
	// summary:
	//		A SimpleTheme or Theme is a pre-defined object, primarily JSON-based, that makes up the definitions to
	//		style a chart.
	//
	// description:
	//		While you can set up style definitions on a chart directly (usually through the various add methods
	//		on a dojox.charting.Chart object), a Theme simplifies this manual setup by allowing you to
	//		pre-define all of the various visual parameters of each element in a chart.
	//
	//		Most of the properties of a Theme are straight-forward; if something is line-based (such as
	//		an axis or the ticks on an axis), they will be defined using basic stroke parameters.  Likewise,
	//		if an element is primarily block-based (such as the background of a chart), it will be primarily
	//		fill-based.
	//
	//		In addition (for convenience), a Theme definition does not have to contain the entire JSON-based
	//		structure.  Each theme is built on top of a default theme (which serves as the basis for the theme
	//		"GreySkies"), and is mixed into the default theme object.  This allows you to create a theme based,
	//		say, solely on colors for data series.
	//
	//		Defining a new theme is relatively easy; see any of the themes in dojox.charting.themes for examples
	//		on how to define your own.
	//
	//		When you set a theme on a chart, the theme itself is deep-cloned.  This means that you cannot alter
	//		the theme itself after setting the theme value on a chart, and expect it to change your chart.  If you
	//		are looking to make alterations to a theme for a chart, the suggestion would be to create your own
	//		theme, based on the one you want to use, that makes those alterations before it is applied to a chart.
	//
	//		Finally, a Theme contains a number of functions to facilitate rendering operations on a chart--the main
	//		helper of which is the ~next~ method, in which a chart asks for the information for the next data series
	//		to be rendered.
	//
	//		A note on colors:
	//		A theme palette is usually comprised of 5 different color definitions, and
	//		no more.  If you have a need to render a chart with more than 5 data elements, you can simply "push"
	//		new color definitions into the theme's .color array.  Make sure that you do that with the actual
	//		theme object from a Chart, and not in the theme itself (i.e. either do that before using .setTheme
	//		on a chart).
	//
	// example:
	//		The default theme (and structure) looks like so:
	//	|	// all objects are structs used directly in dojox.gfx
	//	|	chart:{
	//	|		stroke: null,
	//	|		fill: "white",
	//	|		pageStyle: null // suggested page style as an object suitable for dojo.style()
	//	|	},
	//	|	plotarea:{
	//	|		stroke: null,
	//	|		fill: "white"
	//	|	},
	//	|	axis:{
	//	|		stroke:	{ // the axis itself
	//	|			color: "#333",
	//	|			width: 1
	//	|		},
	//	|		tick: {	// used as a foundation for all ticks
	//	|			color:     "#666",
	//	|			position:  "center",
	//	|			font:      "normal normal normal 7pt Tahoma",	// labels on axis
	//	|			fontColor: "#333"								// color of labels
	//	|		},
	//	|		majorTick:	{ // major ticks on axis, and used for major gridlines
	//	|			width:  1,
	//	|			length: 6
	//	|		},
	//	|		minorTick:	{ // minor ticks on axis, and used for minor gridlines
	//	|			width:  0.8,
	//	|			length: 3
	//	|		},
	//	|		microTick:	{ // minor ticks on axis, and used for minor gridlines
	//	|			width:  0.5,
	//	|			length: 1
	//	|		},
	//	|		title: {
	//	|			gap:  15,
	//	|			font: "normal normal normal 11pt Tahoma",	// title font
	//	|			fontColor: "#333",							// title font color
	//	|			orientation: "axis"						// "axis": facing the axis, "away": facing away
	//	|		}
	//	|	},
	//	|	series: {
	//	|		stroke:  {width: 1.5, color: "#333"},		// line
	//	|		outline: {width: 0.1, color: "#ccc"},		// outline
	//	|		//shadow:  {dx: 1, dy: 1, width: 2, color: [0, 0, 0, 0.3]},
	//	|		shadow: null,								// no shadow
	//	|		//filter:  dojox/gfx/filters.createFilter(),
	//	|		filter: null,								// no filter, to use a filter you must use gfx SVG render and require dojox/gfx/svgext
	//	|		fill:    "#ccc",							// fill, if appropriate
	//	|		font:    "normal normal normal 8pt Tahoma",	// if there's a label
	//	|		fontColor: "#000"							// color of labels
	//	|		labelWiring: {width: 1, color: "#ccc"},		// connect marker and target data item(slice, column, bar...)
	//	|	},
	//	|	marker: {	// any markers on a series
	//	|		symbol:  "m-3,3 l3,-6 3,6 z",				// symbol
	//	|		stroke:  {width: 1.5, color: "#333"},		// stroke
	//	|		outline: {width: 0.1, color: "#ccc"},		// outline
	//	|		shadow: null,								// no shadow
	//	|		fill:    "#ccc",							// fill if needed
	//	|		font:    "normal normal normal 8pt Tahoma",	// label
	//	|		fontColor: "#000"
	//	|	},
	//	|	grid: {	// grid, when not present axis tick strokes are used instead
	//	|		majorLine: {	// major grid line
	//	|			color:     "#666",
	//	|			width:  1,
	//	|			length: 6
	//	|		},
	//	|		minorLine: {	// minor grid line
	//	|			color:     "#666",
	//	|			width:  0.8,
	//	|			length: 3
	//	|		},
	//	|		fill: "grey",  // every other stripe
	//	|		alternateFill: "grey" // alternate stripe
	//	|	},
	//	|	indicator: {
	//	|		lineStroke:  {width: 1.5, color: "#333"},		// line
	//	|		lineOutline: {width: 0.1, color: "#ccc"},		// line outline
	//	|		lineShadow: null,								// no line shadow
	//	|		lineFill: null,									// fill between lines for dual indicators
	//	|		stroke:  {width: 1.5, color: "#333"},			// label background stroke
	//	|		outline: {width: 0.1, color: "#ccc"},			// label background outline
	//	|		shadow: null,									// no label background shadow
	//	|		fill:  "#ccc",									// label background fill
	//	|		radius: 3,										// radius of the label background
	//	|		font:    "normal normal normal 10pt Tahoma",	// label font
	//	|		fontColor: "#000"								// label color
	//	|		markerFill:    "#ccc",							// marker fill
	//	|		markerSymbol:  "m-3,0 c0,-4 6,-4 6,0 m-6,0 c0,4 6,4 6,0",	// marker symbol
	//	|		markerStroke:  {width: 1.5, color: "#333"},		// marker stroke
	//	|		markerOutline: {width: 0.1, color: "#ccc"},		// marker outline
	//	|		markerShadow: null,								// no marker shadow
	//	|	}
	//
	// example:
	//		Defining a new theme is pretty simple:
	//	|	var Grasslands = new SimpleTheme({
	//	|		colors: [ "#70803a", "#dde574", "#788062", "#b1cc5d", "#eff2c2" ]
	//	|	});
	//	|
	//	|	myChart.setTheme(Grasslands);

	shapeSpaces: {shape: 1, shapeX: 1, shapeY: 1},

	constructor: function(kwArgs){
		// summary:
		//		Initialize a theme using the keyword arguments.  Note that the arguments
		//		look like the example (above), and may include a few more parameters.
		kwArgs = kwArgs || {};

		// populate theme with defaults updating them if needed
		var def = SimpleTheme.defaultTheme;
		arr.forEach(["chart", "plotarea", "axis", "grid", "series", "marker", "indicator"], function(name){
			this[name] = lang.delegate(def[name], kwArgs[name]);
		}, this);

		// personalize theme
		if(kwArgs.seriesThemes && kwArgs.seriesThemes.length){
			this.colors  = null;
			this.seriesThemes = kwArgs.seriesThemes.slice(0);
		}else{
			this.seriesThemes = null;
			this.colors = (kwArgs.colors || SimpleTheme.defaultColors).slice(0);
		}
		this.markerThemes = null;
		if(kwArgs.markerThemes && kwArgs.markerThemes.length){
			this.markerThemes = kwArgs.markerThemes.slice(0);
		}
		this.markers = kwArgs.markers ? lang.clone(kwArgs.markers) : lang.delegate(SimpleTheme.defaultMarkers);

		// set flags
		this.noGradConv = kwArgs.noGradConv;
		this.noRadialConv = kwArgs.noRadialConv;
		if(kwArgs.reverseFills){
			this.reverseFills();
		}

		//	private housekeeping
		this._current = 0;
		this._buildMarkerArray();
	},

	clone: function(){
		// summary:
		//		Clone the current theme.
		// returns: dojox.charting.SimpleTheme
		//		The cloned theme; any alterations made will not affect the original.
		var theme = new this.constructor({
			// theme components
			chart: this.chart,
			plotarea: this.plotarea,
			axis: this.axis,
			grid: this.grid,
			series: this.series,
			marker: this.marker,
			// individual arrays
			colors: this.colors,
			markers: this.markers,
			indicator: this.indicator,
			seriesThemes: this.seriesThemes,
			markerThemes: this.markerThemes,
			// flags
			noGradConv: this.noGradConv,
			noRadialConv: this.noRadialConv
		});
		// copy custom methods
		arr.forEach(
			["clone", "clear", "next", "skip", "addMixin", "post", "getTick"],
			function(name){
				if(this.hasOwnProperty(name)){
					theme[name] = this[name];
				}
			},
			this
		);
		return theme;	//	dojox.charting.SimpleTheme
	},

	clear: function(){
		// summary:
		//		Clear and reset the internal pointer to start fresh.
		this._current = 0;
	},

	next: function(elementType, mixin, doPost){
		// summary:
		//		Get the next color or series theme.
		// elementType: String?
		//		An optional element type (for use with series themes)
		// mixin: Object?
		//		An optional object to mix into the theme.
		// doPost: Boolean?
		//		A flag to post-process the results.
		// returns: Object
		//		An object of the structure { series, marker, symbol }
		var merge = dlu.merge, series, marker;
		if(this.colors){
			series = lang.delegate(this.series);
			marker = lang.delegate(this.marker);
			var color = new Color(this.colors[this._current % this.colors.length]), old;
			// modify the stroke
			if(series.stroke && series.stroke.color){
				series.stroke = lang.delegate(series.stroke);
				old = new Color(series.stroke.color);
				series.stroke.color = new Color(color);
				series.stroke.color.a = old.a;
			}else{
				series.stroke = {color: color};
			}
			if(marker.stroke && marker.stroke.color){
				marker.stroke = lang.delegate(marker.stroke);
				old = new Color(marker.stroke.color);
				marker.stroke.color = new Color(color);
				marker.stroke.color.a = old.a;
			}else{
				marker.stroke = {color: color};
			}
			// modify the fill
			if(!series.fill || series.fill.type){
				series.fill = color;
			}else{
				old = new Color(series.fill);
				series.fill = new Color(color);
				series.fill.a = old.a;
			}
			if(!marker.fill || marker.fill.type){
				marker.fill = color;
			}else{
				old = new Color(marker.fill);
				marker.fill = new Color(color);
				marker.fill.a = old.a;
			}
		}else{
			series = this.seriesThemes ?
				merge(this.series, this.seriesThemes[this._current % this.seriesThemes.length]) :
				this.series;
			marker = this.markerThemes ?
				merge(this.marker, this.markerThemes[this._current % this.markerThemes.length]) :
				series;
		}

		var symbol = marker && marker.symbol || this._markers[this._current % this._markers.length];

		var theme = {series: series, marker: marker, symbol: symbol};
		
		// advance the counter
		++this._current;

		if(mixin){
			theme = this.addMixin(theme, elementType, mixin);
		}
		if(doPost){
			theme = this.post(theme, elementType);
		}

		return theme;	//	Object
	},

	skip: function(){
		// summary:
		//		Skip the next internal color.
		++this._current;
	},

	addMixin: function(theme, elementType, mixin, doPost){
		// summary:
		//		Add a mixin object to the passed theme and process.
		// theme: dojox/charting/SimpleTheme
		//		The theme to mixin to.
		// elementType: String
		//		The type of element in question. Can be "line", "bar" or "circle"
		// mixin: Object|Array
		//		The object or objects to mix into the theme.
		// doPost: Boolean
		//		If true, run the new theme through the post-processor.
		// returns: dojox/charting/SimpleTheme
		//		The new theme.
		if(lang.isArray(mixin)){
			arr.forEach(mixin, function(m){
				theme = this.addMixin(theme, elementType, m);
			}, this);
		}else{
			var t = {};
			if("color" in mixin){
				if(elementType == "line" || elementType == "area"){
					lang.setObject("series.stroke.color", mixin.color, t);
					lang.setObject("marker.stroke.color", mixin.color, t);
				}else{
					lang.setObject("series.fill", mixin.color, t);
				}
			}
			arr.forEach(["stroke", "outline", "shadow", "fill", "filter", "font", "fontColor", "labelWiring"], function(name){
				var markerName = "marker" + name.charAt(0).toUpperCase() + name.substr(1),
					b = markerName in mixin;
				if(name in mixin){
					lang.setObject("series." + name, mixin[name], t);
					if(!b){
						lang.setObject("marker." + name, mixin[name], t);
					}
				}
				if(b){
					lang.setObject("marker." + name, mixin[markerName], t);
				}
			});
			if("marker" in mixin){
				t.symbol = mixin.marker;
				t.symbol = mixin.marker;
			}
			theme = dlu.merge(theme, t);
		}
		if(doPost){
			theme = this.post(theme, elementType);
		}
		return theme;	//	dojox/charting/SimpleTheme
	},

	post: function(theme, elementType){
		// summary:
		//		Process any post-shape fills.
		// theme: dojox/charting/SimpleTheme
		//		The theme to post process with.
		// elementType: String
		//		The type of element being filled.  Can be "bar" or "circle".
		// returns: dojox/charting/SimpleTheme
		//		The post-processed theme.
		var fill = theme.series.fill, t;
		if(!this.noGradConv && this.shapeSpaces[fill.space] && fill.type == "linear"){
			if(elementType == "bar"){
				// transpose start and end points
				t = {
					x1: fill.y1,
					y1: fill.x1,
					x2: fill.y2,
					y2: fill.x2
				};
			}else if(!this.noRadialConv && fill.space == "shape" && (elementType == "slice" || elementType == "circle")){
				// switch to radial
				t = {
					type: "radial",
					cx: 0,
					cy: 0,
					r:  100
				};
			}
			if(t){
				return dlu.merge(theme, {series: {fill: t}});
			}
		}
		return theme;	//	dojox/charting/SimpleTheme
	},

	getTick: function(name, mixin){
		// summary:
		//		Calculates and merges tick parameters.
		// name: String
		//		Tick name, can be "major", "minor", or "micro".
		// mixin: Object?
		//		Optional object to mix in to the tick.
		var tick = this.axis.tick, tickName = name + "Tick",
			merge = dlu.merge;
		if(tick){
			if(this.axis[tickName]){
				tick = merge(tick, this.axis[tickName]);
			}
		}else{
			tick = this.axis[tickName];
		}
		if(mixin){
			if(tick){
				if(mixin[tickName]){
					tick = merge(tick, mixin[tickName]);
				}
			}else{
				tick = mixin[tickName];
			}
		}
		return tick;	//	Object
	},

	inspectObjects: function(f){
		arr.forEach(["chart", "plotarea", "axis", "grid", "series", "marker", "indicator"], function(name){
			f(this[name]);
		}, this);
		if(this.seriesThemes){
			arr.forEach(this.seriesThemes, f);
		}
		if(this.markerThemes){
			arr.forEach(this.markerThemes, f);
		}
	},

	reverseFills: function(){
		this.inspectObjects(function(o){
			if(o && o.fill){
				o.fill = dgg.reverse(o.fill);
			}
		});
	},

	addMarker:function(/*String*/ name, /*String*/ segment){
		// summary:
		//		Add a custom marker to this theme.
		// example:
		//	|	myTheme.addMarker("Ellipse", foo);
		this.markers[name] = segment;
		this._buildMarkerArray();
	},

	setMarkers:function(/*Object*/ obj){
		// summary:
		//		Set all the markers of this theme at once.  obj should be a
		//		dictionary of keys and path segments.
		//
		// example:
		//	|	myTheme.setMarkers({ "CIRCLE": foo });
		this.markers = obj;
		this._buildMarkerArray();
	},

	_buildMarkerArray: function(){
		this._markers = [];
		for(var p in this.markers){
			this._markers.push(this.markers[p]);
		}
	}
});

lang.mixin(SimpleTheme, {
	defaultMarkers: {
		CIRCLE:   "m-3,0 c0,-4 6,-4 6,0 m-6,0 c0,4 6,4 6,0",
		SQUARE:   "m-3,-3 l0,6 6,0 0,-6 z",
		DIAMOND:  "m0,-3 l3,3 -3,3 -3,-3 z",
		CROSS:    "m0,-3 l0,6 m-3,-3 l6,0",
		X:        "m-3,-3 l6,6 m0,-6 l-6,6",
		TRIANGLE: "m-3,3 l3,-6 3,6 z",
		TRIANGLE_INVERTED: "m-3,-3 l3,6 3,-6 z"
	},

	defaultColors:[
		// gray skies
		"#54544c", "#858e94", "#6e767a", "#948585", "#474747"
	],

	defaultTheme: {
		// all objects are structs used directly in dojox.gfx
		chart:{
			stroke: null,
			fill: "white",
			pageStyle: null,
			titleGap:		20,
			titlePos:		"top",
			titleFont:      "normal normal bold 14pt Tahoma",	// chart title
			titleFontColor: "#333"
		},
		plotarea:{
			stroke: null,
			fill: "white"
		},
		// TODO: label rotation on axis
		axis:{
			stroke:	{ // the axis itself
				color: "#333",
				width: 1
			},
			tick: {	// used as a foundation for all ticks
				color:     "#666",
				position:  "center",
				font:      "normal normal normal 7pt Tahoma",	// labels on axis
				fontColor: "#333",								// color of labels
				labelGap:  4                                    // gap between a tick and its label in pixels
			},
			majorTick:	{ // major ticks on axis, and used for major gridlines
				width:  1,
				length: 6
			},
			minorTick:	{ // minor ticks on axis, and used for minor gridlines
				width:  0.8,
				length: 3
			},
			microTick:	{ // minor ticks on axis, and used for minor gridlines
				width:  0.5,
				length: 1
			},
			title: {
				gap:  15,
				font: "normal normal normal 11pt Tahoma",	// title font
				fontColor: "#333",							// title font color
				orientation: "axis"						// "axis": facing the axis, "away": facing away
			}
		},
		series: {
			// used as a "main" theme for series, sThemes augment it
			stroke:  {width: 1.5, color: "#333"},		// line
			outline: {width: 0.1, color: "#ccc"},		// outline
			//shadow:  {dx: 1, dy: 1, width: 2, color: [0, 0, 0, 0.3]},
			shadow: null,								// no shadow
			fill:    "#ccc",							// fill, if appropriate
			font:    "normal normal normal 8pt Tahoma",	// if there's a label
			fontColor: "#000",							// color of labels
			labelWiring: {width: 1, color: "#ccc"}		// connect marker and target data item(slice, column, bar...)
		},
		marker: {	// any markers on a series
			stroke:  {width: 1.5, color: "#333"},		// stroke
			outline: {width: 0.1, color: "#ccc"},		// outline
			//shadow:  {dx: 1, dy: 1, width: 2, color: [0, 0, 0, 0.3]},
			shadow: null,								// no shadow
			fill:    "#ccc",							// fill if needed
			font:    "normal normal normal 8pt Tahoma",	// label
			fontColor: "#000"
		},
		indicator: {
			lineStroke:  {width: 1.5, color: "#333"},		
			lineOutline: {width: 0.1, color: "#ccc"},		
			lineShadow: null,
			lineFill: null,
			stroke:  {width: 1.5, color: "#333"},		
			outline: {width: 0.1, color: "#ccc"},		
			shadow: null,								
			fill : "#ccc",
			radius: 3,
			font:    "normal normal normal 10pt Tahoma",	
			fontColor: "#000",							
			markerFill:    "#ccc",							
			markerSymbol:  "m-3,0 c0,-4 6,-4 6,0 m-6,0 c0,4 6,4 6,0",			
			markerStroke:  {width: 1.5, color: "#333"},		
			markerOutline: {width: 0.1, color: "#ccc"},		
			markerShadow: null								
		}
	}
});

return SimpleTheme;
});

},
'dojo/cldr/nls/currency':function(){
define({ root:

//begin v1.x content
{
	"USD_symbol": "US$",
	"CAD_symbol": "CA$",
	"GBP_symbol": "£",
	"HKD_symbol": "HK$",
	"JPY_symbol": "JP¥",
	"AUD_symbol": "A$",
	"CNY_symbol": "CN¥",
	"EUR_symbol": "€"
}
//end v1.x content
,
	"ar": true,
	"ca": true,
	"cs": true,
	"da": true,
	"de": true,
	"el": true,
	"en": true,
	"en-au": true,
	"en-ca": true,
	"en-gb": true,
	"es": true,
	"fi": true,
	"fr": true,
	"fr-ch": true,
	"he": true,
	"hu": true,
	"it": true,
	"ja": true,
	"ko": true,
	"nb": true,
	"nl": true,
	"pl": true,
	"pt": true,
	"pt-pt": true,
	"ro": true,
	"ru": true,
	"sk": true,
	"sl": true,
	"sv": true,
	"th": true,
	"tr": true,
	"zh": true,
	"zh-hant": true,
	"zh-hk": true,
	"zh-tw": true
});
},
'dojo/cldr/nls/en/currency':function(){
define(
//begin v1.x content
{
	"HKD_displayName": "Hong Kong Dollar",
	"CHF_displayName": "Swiss Franc",
	"JPY_symbol": "¥",
	"CAD_displayName": "Canadian Dollar",
	"CNY_displayName": "Chinese Yuan",
	"USD_symbol": "$",
	"AUD_displayName": "Australian Dollar",
	"JPY_displayName": "Japanese Yen",
	"USD_displayName": "US Dollar",
	"GBP_displayName": "British Pound Sterling",
	"EUR_displayName": "Euro"
}
//end v1.x content
);
},
'dojo/cldr/nls/ru/currency':function(){
define(
//begin v1.x content
{
	"HKD_displayName": "Гонконгский доллар",
	"CHF_displayName": "Швейцарский франк",
	"JPY_symbol": "¥",
	"CAD_displayName": "Канадский доллар",
	"HKD_symbol": "HK$",
	"CNY_displayName": "Юань Ренминби",
	"USD_symbol": "$",
	"AUD_displayName": "Австралийский доллар",
	"JPY_displayName": "Японская иена",
	"CAD_symbol": "CA$",
	"USD_displayName": "Доллар США",
	"EUR_symbol": "€",
	"CNY_symbol": "CN¥",
	"GBP_displayName": "Английский фунт стерлингов",
	"GBP_symbol": "£",
	"AUD_symbol": "A$",
	"EUR_displayName": "Евро"
}
//end v1.x content
);
},
'money/store':function(){
/*
*   Хранилище данных
*   
* 
*/

define([
   	"dojo/_base/declare","dojo/_base/Deferred","dojo/json",
		"dojo/_base/array","dojo/date/locale", "money/idb",
		"dojo/_base/lang","dojo/store/Observable", "dojo/store/Memory" //or money/before-memory - memory with insert before item support
	],
    function(declare,Deferred,json,arrayUtil,locale,Idb,lang,Observable, Memory) {
        // Return the declared class!
        return declare(null, {
            // Options and methods will go here...
            __isPermanent: true,
			_store: null,
            
			isLocalStorageAvailable :function(){
				return 'localStorage' in window && window['localStorage'] !== null;			
			},
			
			/*
			 * 	Basic operations with storage:
			 * 
			 * 	- getItem
			 * 	- pushItem
			 * 	- removeItem
			 * 	- queryItems
			 * 
			 *  - query4period(from,to) - all transaction for given period
			 */
			getItem: function(id){
                return this.store.get(id)  
            },
            putItem: function(obj,dontupload){
                var dontupload = dontupload || false
                if(!!obj)
                try{
					for(var i = 0; i<obj.tags.length; i++){
						var q = window.AppData.tagsStore.query({'label':obj.tags[i]});
						var q2 = window.AppData.tagsStore.query({'id':obj.tags[i]});
						console.log('Qq', q, q2)
						if((q.length>0) && (q2.length==0)){
							obj.tags[i] = q[0].id
						}else if((q.length==0) && (q2.length==0)){
							var label = obj.tags[i]
							if(label != ""){
								obj.tags[i] = window.AppData.tagsStore.add({
									label: label,
									et: new Date().getTime()
								})
							}
							else remove(obj.tags,i)
							
						}
					}
					//if(!upload)
					obj.tags.sort()
					localStorage.setItem("tags",json.stringify(window.AppData.tagsStore.query()))
					/*alert('tags done')
					for(var i in obj){
						alert(i+" " +obj[i])
					}*/
					//end of null-handler
					var id = this.store.put(obj)
					var idbPromise = false
					//alert('going to upload')
					if(!dontupload && this.__isPermanent){
						//alert('uploading to idb.');
						obj.et = new Date().getTime()
						idbPromise = this.idb.addItem(obj)
					}					
					return {id:id, def:idbPromise}
                }catch(e){
					alert('error saving to store.. ' + e.toString())
                    /*for(var i in window.o){
						alert(i+" " +o[i] + typeof o[i])
					}*/
                    console.log("error saving to store...", e)
                }
            },
            getFeatures: function(){
				return {}
			},
            query: function(){
				console.log(arguments)
				return this.store.query.apply(this.store,arguments)
			},
            queryItems: function(){
				console.log(arguments)
                return this.store.query.apply(this.store,arguments)
            },
            _query4period: function(from,to, what){
				this.qyeryItems(function(item){
					return (date.difference(item.date, from, "second") > 0) && (date.difference(item.date, date.add(to,"day",1), "second") < 0)
				})
			},
            removeItem: function(removedFrom){
                try{
					this.store.remove(removedFrom)
                    var d = this.idb.deleteItem(removedFrom)                    
                    var deleted = localStorage.getItem('deleted') ? json.parse(localStorage.getItem('deleted')) : new Array();
					deleted.push(removedFrom);
					localStorage.setItem('deleted',json.stringify(deleted));
					
                }catch(e){
                    console.log("error removing from store...", e)
                }
                return d ? d : null
            },
            
            
            /*
             * Executes when data is etched from Permanent store
             */ 
            _onloadSavedData: function(data){
                /*
                *   item.date is transformed into Date object 
                * 	(IndexedDb doesn't support Date)
                */
               
                console.log('saved data loaded')
                arrayUtil.forEach(data,lang.hitch(function(item){
					if(!isValidDate(item.date))
						item.date = locale.parse(item.date, {"selector":"date", "datePattern":window.AppData.widgetDateFormat})
					if(!!item){
						this.putItem(item,true)
						//this.removeItem(item.id)
					}
				}),this)
					
				//create handlers for put and remove events
				//this._createTransactionHandlers();
				//resolve data loading promise
				this.createPromise.resolve({status: 'ok'})
            },
            
            // -------------------------------------------- //
            //		Database Event Handlers                 //
            // ---------------------------------------------//
            
            /*
            *   Private methods, handles put and remove events
            */
            _putCallbackRegistry: [{
				fn: function(object){
					console.log("inserted", object)
                },
                scope: window
            }],
            _removeCallbackRegistry: [{
				fn: function(object){
					console.log("removed", object)
				},
				scope: window
			}],
			
			_loadCallbackRegistry: [],
			
			
			/*
			 * 	Saves object to IndexedDb and executes callbacks from
			 * 	_putCallbackRegistry
			 */	
			_onPutItem: function(insertedInto,object){
				alert('on put')
				arrayUtil.forEach(this._putCallbackRegistry, function(c){                    
					if(lang.isFunction(c.fn)){
						var exec = lang.hitch(c.scope,c.fn,object);
						exec();
					}
				});
				alert('on put.')
				
				//this.idb.addItem(object)
			},
            
            /*
			 * 	Removes object to IndexedDb and executes callbacks from
			 * 	_removeCallbackRegistry
			 */
			_onRemoveItem: function(removedFrom, object){
				arrayUtil.forEach(this._removeCallbackRegistry, function(c){                    
					if(lang.isFunction(c.fn)){
						var exec = lang.hitch(c.scope,c.fn,object);
						exec();
					}
				});
				//this.idb.deleteItem(object.id)
			},
            
			_createTransactionHandlers: function(){
				var results = this.store.query()
				var self = this;
				this.transactionHandler = results.observe(function(object, removedFrom, insertedInto){
					if(removedFrom > -1){ // existing object removed
						self._onRemoveItem(removedFrom, object)
					}
					if(insertedInto > -1){ // new or updated object inserted
						self._onPutItem(insertedInto, object)
					}
				}, false);
			},
			
			_removeTransactioneHandlers: function(){
				this.transactionHandler.cancel();
			},
			
			constructor: function(args){
				this.createPromise = new Deferred()
				window.AppData.store = this
				if(this.isLocalStorageAvailable()){
					//localStorage.clear()
					var savedData = this.getAllData()
					window.AppData.accountStore = new Memory({idProperty:'id',data: savedData.accounts/* [{id:1,label:'Cash'},{id:2,label:'Account #2 (with a very long title)'}]*/});
					window.AppData.typeStore = new Memory({idProperty:'id',data: savedData.types});
					
					window.AppData.curs = []; var j=0;
					for (var i in window.AppData.currencies){
						//console.log(window.AppData.currencies[i])
						window.AppData.curs[j++] = {
							id: i,
							label:window.AppData.currencies[i] +  ' ('+i+')'//,
							//rightText: "$1 = " + window.AppData.rates.rates[i]+" "+i
						}
					}
					window.AppData.currencyStore = new Memory({idProperty:'id',data: window.AppData.curs});
					
					for(var i in savedData.tags)
						if(savedData.tags[i].id==1 || savedData.tags[i].id==2)
							savedData.tags[i]+=.2
					window.AppData.tagsStore = new Memory({idProperty:'id',data: savedData.tags});
					var themesData = [
						{"label": "Holodark", "id": "Holodark"},
						{"label": "Light (default)", "id": "Custom"}
					];
					var localeData = [
						{"label": "System default", "id": "no_lang"},
						{"label": "Russian", "id": "ru-ru"},
						{"label": "English", "id": "en-us"}
					];
					window.AppData.themeStore = new Memory({idProperty:'id',data: themesData});
					window.AppData.langStore = new Memory({idProperty:'id',data: localeData});
					
					console.log("Local storage: ", this.isLocalStorageAvailable())
                
					// create the initial Observable store
					this.store = new Observable(new Memory({}));
					//this.store = new Memory({});
					console.log('created temp storage')
					if(this.__isPermanent){
						this.idb = new Idb()
						this.idb.open(this._onloadSavedData, this)
					}else this._onloadSavedData([])
				}else alert("your browser is not supported (LocalStorage is not available)")			
			},
			
			// ----------------------------------------------//
			// 			Backup & Restore features            //
			// ----------------------------------------------//
			
			/*
			 *  _get & _set methods for each type of data.
			 *  Accounts, Tags and Settings - stored in LocalStorage
			 * 	Transactions - at IndexedDb
			 */ 
			setLocale: function(loc){
				if(loc && this.isLocalStorageAvailable())
					localStorage.setItem("lang",loc)
			},
			setTheme: function(theme){
				window.AppData.appTheme = theme
				if(theme && this.isLocalStorageAvailable())
					localStorage.setItem("appTheme",theme)
			},
			
			getAccount: function(id){
				//console.log(id)
				return window.AppData.accountStore.get(id)
			},
			putAccount: function(obj){
				//console.log(id)
				return window.AppData.accountStore.put(obj)
			},
			putTag: function(obj){
				//console.log(id)
				return window.AppData.tagsStore.put(obj)
			},
			getAccounts: function(){
				return window.AppData.accountStore.query()
			},
			getTags: function(){
				return window.AppData.tagsStore.query()
			},
			removeTag: function(id){
				if(id && window.AppData.tagsStore.get(id)){
					window.AppData.tagsStore.remove(id)
					this._setTags(this.getTags())
				}
			},
			removeAccount: function(id){
				if(id && window.AppData.accountStore.get(id)){
					var thisAccountTrans = this.store.query({account: id})
					arrayUtil.forEach(thisAccountTrans, function(item){
						this.store.removeItem(item.id)
					},this)
					thisAccountTrans = this.store.query({accountTo: id})
					arrayUtil.forEach(thisAccountTrans, function(item){
						this.store.removeItem(item.id)
					},this)
					window.AppData.accountStore.remove(id)
					this._setAccounts(this.getAccounts())
				}
			},
			_getAccounts: function(){
				if(this.isLocalStorageAvailable())
					return localStorage.getItem("accounts") ? json.parse(localStorage.getItem("accounts")) : []
				else return []
			},
			_setAccounts: function(data){
				if(data){
					localStorage.setItem("accounts",json.stringify(data))
					//window.AppData.accountStore = new Memory({idProperty:'id','data': data});
				}
			},
			_getSettings: function(){
				if(this.isLocalStorageAvailable())
					return localStorage.getItem("settings") ? json.parse(localStorage.getItem("settings")) : []
				else return []
			},
			
			_getTypes: function(){
				return [
					{"label": '_expence', "id": "e"},
					{"label": '_income', "id": "i"},
					{"label": '_transfer', "id": "t"}
				]
			},
			
			_getTags: function(){
				if(this.isLocalStorageAvailable())
					return localStorage.getItem("tags") ? json.parse(localStorage.getItem("tags")) : []
				else return []
			},
			getTag: function(id){
				console.log(id)
				return window.AppData.tagsStore.get(id)
			},
			_setTags: function(data){
				if(data){
					localStorage.setItem("tags",json.stringify(data))
					window.AppData.tagsStore = new Memory({idProperty:'id','data': data})
				}
			},
			_getStoredDataCopy: function(){
				return this.store ? lang.clone(this.store.query()) : []
			},
			getAllData: function(formatDate){
				var formatDate = formatDate || false
				var storeData = this._getStoredDataCopy()
				if(formatDate)
					arrayUtil.forEach(storeData,function(item){
						item.date = locale.format(item.date, {selector:"date", datePattern:window.AppData.widgetDateFormat})
					})
				return {
					accounts: this._getAccounts(),
					settings: this._getSettings(),
					types	: this._getTypes(),
					tags	: /*[{'label': 'Cafe','id': '0.931502124527675'},{'label': 'Food','id': '0.0012931561714026873'},{'label':'Car washing', 'id':'0.20785035528289175'},{'label':'Label', 'id':'0.89892'},{'label':'Label-1', 'id':'0.2112'},{'label':'Label-2', 'id':'0.112'},{'label':'Label-3', 'id':'0.222'},{'label':'Label-4', 'id':'9.2'},{'label':'Label-5', 'id':'8.2'},{'label':'Label-6', 'id':'3.2'},{'label':'Label-7', 'id':'7.2'},{'label':'Label-8', 'id':'0.7'},{'label':'Label-9', 'id':'0.22'},{'label':'Label-10', 'id':'0.12'},{'label':'Label-11', 'id':'0.5'},{'label':'Label-12', 'id':'0.4'},{'label':'Label-13', 'id':'0.3'}],*/this._getTags(),
					storeData: storeData
				}
			},
			
			restoreAllData: function(rawData){
				var restorePromise = new Deferred()
				try{
					var data = json.parse(rawData);
					console.log('data to restore ', data)
					this._setAccounts(data.accounts)
					this._setSettings(data.settings)
					this._setTags(data.tags)
					if(data.storeData){
						var rpromises = [], ipromises = []
						arrayUtil.forEach(this.queryItems(),function(item){
							var def = this.removeItem(item.id)
							if(def)rpromises.push(def)
						},this)
						if(rpromiss.length){
							var rDeferredList = new DeferredList(rpromises), self = this
							rDeferredList.then(function(state){
								arrayUtil.forEach(data,function(item){
									var def = self.putItem(item)
									if(def) ipromises.push(def)
								},self)
							})
						}else{
							arrayUtil.forEach(data,function(item){
								var def = self.putItem(item)
								if(def) ipromises.push(def)
							},self)
						}
						
						//return Deferred object
						if(ipromises.length){
							var iDeferredList = new DeferredList(ipromises)
							iDeferredList.then(function(e){
								restorePromise.resolve({state: 1 /* ~no errors */, msg: 'done'})
							})							
						}else restorePromise.resolve({state: 1 /* ~no errors */, msg: 'done'})
					}
				}catch(e){
					restorePromise.resolve({state: 10 /* ~error */, msg: 'unknown error'})
				}
				return restorePromise;
			}
        });
    }
);

},
'money/views/accounts':function(){
define([
	"dojo/_base/declare","dojox/mobile/TextBox","dojo/_base/array", "dojox/mobile/ListItem",
	"dijit/registry","dojo/dom-attr","dojo/json","dojo/dom-style",
	"dojox/mobile/ToolBarButton","money/dialog"
 ],
    function(declare,TextBox,arrayUtil, ListItem,   registry, domAttr,json, domStyle,Button, Dialog){
    
	return {
		beforeActivate: function(contact){
			window.AppData.numberPicker.mode = "a"
			this.start()
        },
        afterActivate: function(){
			window.hideProgress()
		},
		//l - number of existing accounts
		displayEmptyMsgs: function(l){
			domStyle.set('no-accounts-accounts','display', !l? 'block':'none')
			domStyle.set('accs-list','display', l? 'block':'none')
		},
        init: function(){
			window.AppData.objAccounts = this
			window.AppData.numberPicker._onDoneCallbackRegistry.push({
				scope 	: window.AppData.objAccounts,
				fn 		: window.AppData.objAccounts.getAmount,
				mode	: "a"
			})
			var self = this
			this.addBtn.onClick = function(){
				self.addNew();
			}
			this.dlg = window.AppData.dialogWindow ? window.AppData.dialogWindow : (window.AppData.dialogWindow = new Dialog);
			this.start();
			
		},
		start: function(){
			arrayUtil.forEach(this.accList.getChildren(), function(chWidget){
				chWidget.destroyRecursive()
			})
			
			var accs = window.AppData.store.getAccounts();
			console.log(accs)
			arrayUtil.forEach(accs, function(account){
				this.addExisting(account)
			},this)
			
			this.displayEmptyMsgs(accs.length)
			
		},
		getAmount: function(amount){
			window.AppData.objAccounts.account.startAmount = Math.abs(amount)
			registry.byId('ab-'+window.AppData.objAccounts.account.id).set('label',getMoney(
				window.AppData.objAccounts.account.startAmount
			))
			this.save()
		},
		addNew: function(){
			var self = this
			this.dlg.show(false, self.nls.newAccount + ". " +  self.nls.chooseCurrency, self.nls.createAccount, self.nls.process, function(){
				window.dFinance.transitionToView(self.domNode,{
					target: "currencypicker",
						transitionDir: 1,
						params : {backTo : 'accounts'}
					}
				)
			})
		},
		add: function(currency){
			var item = item || {label:'',startAmount:0, et: new Date().getTime(),'currency':currency, maincur: currency}
			var existing = window.AppData.accountStore.get(
				window.AppData.accountStore.add(item)
			)
			window.AppData.objAccounts.account = existing;
			this.addExisting(existing)
			this.save()
			
			this.displayEmptyMsgs(1) //always present at least one account
			
		},
		addExisting: function(account){
			var self = this
			if(account.startAmount == undefined) 
				account.startAmount = 0;
			deleteAccount = function(e, _this){
				e.preventDefault();
				e.stopPropagation();
				var id = domAttr.get(_this,"data-finance-id")
				if(id){
					var thisAccountItems = window.AppData.store.query({account: id})
					arrayUtil.forEach(thisAccountItems, function(item){
						window.AppData.store.removeItem(item.id)
					})
					thisAccountItems = window.AppData.store.query({accountTo: id})
					arrayUtil.forEach(thisAccountItems, function(item){
						window.AppData.store.removeItem(item.id)
					})
					
					window.AppData.accountStore.remove(id);
					
					self.displayEmptyMsgs(window.AppData.accountStore.query().length)
					
					var deleted = localStorage.getItem('deletedAccounts') ? json.parse(localStorage.getItem('deletedAccounts')) : new Array();
					deleted.push(id);
					localStorage.setItem('deletedAccounts',json.stringify(deleted));
					registry.byId('li'+id).destroyRecursive();
					window.AppData.store._setAccounts(window.AppData.store.getAccounts());
				}
			}
			this.accList.addChild(new ListItem({
				label: '<div ontouchstart="window.AppData.touched = true; deleteAccount(event,this)"'+
				'onclick="if(!window.AppData.touched)  deleteAccount(event,this)" data-finance-id="'+account.id+'" class="domButton mblDomButtonBlueCircleMinus"><div><div><div></div></div></div></div><input type="text" id="a-'+ account.id + '" value="' + account.label +'"/>',
				rightText: '<button id = "ab-'+account.id+'"></button><button id = "mb-'+account.id+'"></button>',
				'class':'button-at-right',
				id: 'li'+account.id
			}))
			var tb = new TextBox({
				onChange: function(value){
					window.AppData.objAccounts.account = account
					window.AppData.objAccounts.account.label = value
					self.save()
				},
				placeHolder: "Account title"
			},"a-"+account.id)
			var aBtn = new Button({
				label: getMoney(account.startAmount,account.maincur),
				_onTouchStart: function(){
					window.AppData.objAccounts.account = account
					window.AppData.numberPicker.show()
				},
				'class': 'mblButton mblGreyButton',
				style: 'margin:0'
			},"ab-"+account.id)
			aBtn.startup()
			
			var mBtn = new Button({
				label: account.currency ? account.currency : "USD",
				_onTouchStart: function(){
					window.dFinance.transitionToView(this.domNode,{
						target: "currencypicker" , transitionDir: 1,
						params: {'id' : account.id, 'backTo':'accounts'}
					})
				},
				'class': 'mblButton mblGreyButton',
				style: 'margin:0 0 0 10px'
			},"mb-"+account.id)
			mBtn.startup()
			
		},
		save: function(){
			var account = window.AppData.objAccounts.account;
			if(account){
				account.et = new Date().getTime()
				window.AppData.accountStore.put(account)
			}
			window.AppData.store._setAccounts(window.AppData.store.getAccounts())
			
		}
    };
});

},
'dojox/app/utils/model':function(){
define(["dojo/_base/lang", "dojo/Deferred", "dojo/promise/all", "dojo/when"], function(lang, Deferred, all, when){
	return function(/*Object*/ config, /*Object*/ parent, /*Object*/ app){
		// summary:
		//		model is called to create all of the models for the app, and all models for a view, it will
		//		create and call the appropriate model utility based upon the modelLoader set in the model in the config
		// description:
		//		Called for each view or for the app.  For each model in the config, it will  
		//		create the model utility based upon the modelLoader and call it to create and load the model. 
		// config: Object
		//		The models section of the config for this view or for the app.
		// parent: Object
		//		The parent of this view or the app itself, so that models from the parent will be 
		//		available to the view.
		// returns: loadedModels 
		//		 loadedModels is an object holding all of the available loaded models for this view.
		var loadedModels = {};
		if(parent.loadedModels){
			lang.mixin(loadedModels, parent.loadedModels);
		}
		if(config){
			var allDeferred = [];
			for(var item in config){
				if(item.charAt(0) !== "_"){
					allDeferred.push(setupModel(config, item, app, loadedModels));
				}
			}
			return (allDeferred.length == 0) ? loadedModels : all(allDeferred);
		}else{
			return loadedModels;
		}
	};

	function setupModel(config, item, app, loadedModels){
		// Here we need to create the modelLoader and call it passing in the item and the config[item].params
		var params = config[item].params ? config[item].params : {};

		var modelLoader = config[item].modelLoader ? config[item].modelLoader : "dojox/app/utils/simpleModel";
		// modelLoader must be listed in the dependencies and has thus already been loaded so it _must_ be here
		// => no need for complex code here
		try{
			var modelCtor = require(modelLoader);
		}catch(e){
			throw new Error(modelLoader+" must be listed in the dependencies");
		}
		var loadModelDeferred = new Deferred();
		var createModelPromise;
		try{
			createModelPromise = modelCtor(config, params, item);
		}catch(e){
			throw new Error("Error creating "+modelLoader+" for model named ["+item+"]: "+e.message);
		}
		when(createModelPromise, lang.hitch(this, function(newModel){
			loadedModels[item] = newModel;
			app.log("in app/model, for item=[",item,"] loadedModels =", loadedModels);
			loadModelDeferred.resolve(loadedModels);
			return loadedModels;
		}), function(e){
			throw new Error("Error loading model named ["+item+"]: "+e.message);
		});
		return loadModelDeferred;
	}
});

},
'dojox/charting/Element':function(){
define(["dojo/_base/array", "dojo/dom-construct","dojo/_base/declare", "dojox/gfx", "dojox/gfx/shape"],
	function(arr, domConstruct, declare, gfx, shape){

	return declare("dojox.charting.Element", null, {
		// summary:
		//		A base class that is used to build other elements of a chart, such as
		//		a series.
		// chart: dojox/charting/Chart
		//		The parent chart for this element.
		// group: dojox/gfx/shape.Group
		//		The visual GFX group representing this element.
		// htmlElement: Array
		//		Any DOMNodes used as a part of this element (such as HTML-based labels).
		// dirty: Boolean
		//		A flag indicating whether or not this element needs to be rendered.

		chart: null,
		group: null,
		htmlElements: null,
		dirty: true,
		renderingOptions: null,

		constructor: function(chart, kwArgs){
			// summary:
			//		Creates a new charting element.
			// chart: dojox/charting/Chart
			//		The chart that this element belongs to.
			this.chart = chart;
			this.group = null;
			this.htmlElements = [];
			this.dirty = true;
			this.trailingSymbol = "...";
			this._events = [];
			if (kwArgs && kwArgs.renderingOptions) {
				this.renderingOptions = kwArgs.renderingOptions;
			}
		},
		purgeGroup: function(){
			// summary:
			//		Clear any elements out of our group, and destroy the group.
			// returns: dojox/charting/Element
			//		A reference to this object for functional chaining.
			this.destroyHtmlElements();
			if(this.group){
				// since 1.7.x we need dispose shape otherwise there is a memoryleak
				this.getGroup().removeShape();
				var children = this.getGroup().children;
				// starting with 1.9 the registry is optional and thus dispose is
				if(shape.dispose){
					for(var i = 0; i < children.length;++i){
						shape.dispose(children[i], true);
					}
				}
				if(this.getGroup().rawNode){
					domConstruct.empty(this.getGroup().rawNode);
				}
				this.getGroup().clear();
				// starting with 1.9 the registry is optional and thus dispose is
				if(shape.dispose){
					shape.dispose(this.getGroup(), true);
				}
				if(this.getGroup() != this.group){
					// we do have an intermediary clipping group (see CartesianBase)
					if(this.group.rawNode){
						domConstruct.empty(this.group.rawNode);
					}
					this.group.clear();
					// starting with 1.9 the registry is optional and thus dispose is
					if(shape.dispose){
						shape.dispose(this.group, true);
					}
				}
				this.group = null;
			}
			this.dirty = true;
			if(this._events.length){
				arr.forEach(this._events, function(item){
					item.shape.disconnect(item.handle);
				});
				this._events = [];
			}
			return this;	//	dojox.charting.Element
		},
		cleanGroup: function(creator){
			// summary:
			//		Clean any elements (HTML or GFX-based) out of our group, and create a new one.
			// creator: dojox/gfx/shape.Surface?
			//		An optional surface to work with.
			// returns: dojox/charting/Element
			//		A reference to this object for functional chaining.
			this.destroyHtmlElements();
			if(!creator){ creator = this.chart.surface; }
			if(this.group){
				var bgnode;
				var children = this.getGroup().children;
				// starting with 1.9 the registry is optional and thus dispose is
				if(shape.dispose){
					for(var i = 0; i < children.length;++i){
						shape.dispose(children[i], true);
					}
				}
				if(this.getGroup().rawNode){
					bgnode = this.getGroup().bgNode;
					domConstruct.empty(this.getGroup().rawNode);
				}
				this.getGroup().clear();
				if(bgnode){
					this.getGroup().rawNode.appendChild(bgnode);
				}
			}else{
				this.group = creator.createGroup();
				// in some cases we have a rawNode but this is not an actual DOM element (CanvasWithEvents) so check
				// the actual rawNode type.
				if (this.renderingOptions && this.group.rawNode && 
					this.group.rawNode.namespaceURI == "http://www.w3.org/2000/svg") {
					for (var key in this.renderingOptions) {
						this.group.rawNode.setAttribute(key, this.renderingOptions[key]);
					}
				}
			}
			this.dirty = true;
			return this;	//	dojox.charting.Element
		},
		getGroup: function(){
			return this.group;
		},
		destroyHtmlElements: function(){
			// summary:
			//		Destroy any DOMNodes that may have been created as a part of this element.
			if(this.htmlElements.length){
				arr.forEach(this.htmlElements, domConstruct.destroy);
				this.htmlElements = [];
			}
		},
		destroy: function(){
			// summary:
			//		API addition to conform to the rest of the Dojo Toolkit's standard.
			this.purgeGroup();
		},
		//text utilities
		getTextWidth: function(s, font){
			return gfx._base._getTextBox(s, {font: font}).w || 0;
		},
		getTextWithLimitLength: function(s, font, limitWidth, truncated){
			// summary:
			//		Get the truncated string based on the limited width in px(dichotomy algorithm)
			// s: String?
			//		candidate text.
			// font: String?
			//		text's font style.
			// limitWidth: Number?
			//		text limited width in px.
			// truncated: Boolean?
			//		whether the input text(s) has already been truncated.
			// returns: Object
			// |	{
			// |		text: processed text, maybe truncated or not,
			// |		truncated: whether text has been truncated
			// |	}
			if(!s || s.length <= 0){
				return {
					text: "",
					truncated: truncated || false
				};
			}
			if(!limitWidth || limitWidth <= 0){
				return {
					text: s,
					truncated: truncated || false
				};
			}
			var delta = 2,
				//golden section for dichotomy algorithm
				trucPercentage = 0.618,
				minStr = s.substring(0,1) + this.trailingSymbol,
				minWidth = this.getTextWidth(minStr, font);
			if(limitWidth <= minWidth){
				return {
					text: minStr,
					truncated: true
				};
			}
			var width = this.getTextWidth(s, font);
			if(width <= limitWidth){
				return {
					text: s,
					truncated: truncated || false
				};
			}else{
				var begin = 0,
					end = s.length;
				while(begin < end){
					if(end - begin <= delta ){
						while (this.getTextWidth(s.substring(0, begin) + this.trailingSymbol, font) > limitWidth) {
							begin -= 1;
						}
						return {
							text: (s.substring(0,begin) + this.trailingSymbol),
							truncated: true
							};
					}
					var index = begin + Math.round((end - begin) * trucPercentage),
						widthIntercepted = this.getTextWidth(s.substring(0, index), font);
					if(widthIntercepted < limitWidth){
						begin = index;
						end = end;
					}else{
						begin = begin;
						end = index;
					}
				}
			}
		},
		getTextWithLimitCharCount: function(s, font, wcLimit, truncated){
			// summary:
			//		Get the truncated string based on the limited character count(dichotomy algorithm)
			// s: String?
			//		candidate text.
			// font: String?
			//		text's font style.
			// wcLimit: Number?
			//		text limited character count.
			// truncated: Boolean?
			//		whether the input text(s) has already been truncated.
			// returns: Object
			// |	{
			// |		text: processed text, maybe truncated or not,
			// |		truncated: whether text has been truncated
			// |	}
			if (!s || s.length <= 0) {
				return {
					text: "",
					truncated: truncated || false
				};
			}
			if(!wcLimit || wcLimit <= 0 || s.length <= wcLimit){
				return {
					text: s,
					truncated: truncated || false
				};
			}
			return {
				text: s.substring(0, wcLimit) + this.trailingSymbol,
				truncated: true
			};
		},
		// fill utilities
		_plotFill: function(fill, dim, offsets){
			// process a plot-wide fill
			if(!fill || !fill.type || !fill.space){
				return fill;
			}
			var space = fill.space, span;
			switch(fill.type){
				case "linear":
					if(space === "plot" || space === "shapeX" || space === "shapeY"){
						// clone a fill so we can modify properly directly
						fill = gfx.makeParameters(gfx.defaultLinearGradient, fill);
						fill.space = space;
						// process dimensions
						if(space === "plot" || space === "shapeX"){
							// process Y
							span = dim.height - offsets.t - offsets.b;
							fill.y1 = offsets.t + span * fill.y1 / 100;
							fill.y2 = offsets.t + span * fill.y2 / 100;
						}
						if(space === "plot" || space === "shapeY"){
							// process X
							span = dim.width - offsets.l - offsets.r;
							fill.x1 = offsets.l + span * fill.x1 / 100;
							fill.x2 = offsets.l + span * fill.x2 / 100;
						}
					}
					break;
				case "radial":
					if(space === "plot"){
						// this one is used exclusively for scatter charts
						// clone a fill so we can modify properly directly
						fill = gfx.makeParameters(gfx.defaultRadialGradient, fill);
						fill.space = space;
						// process both dimensions
						var spanX = dim.width  - offsets.l - offsets.r,
							spanY = dim.height - offsets.t - offsets.b;
						fill.cx = offsets.l + spanX * fill.cx / 100;
						fill.cy = offsets.t + spanY * fill.cy / 100;
						fill.r  = fill.r * Math.sqrt(spanX * spanX + spanY * spanY) / 200;
					}
					break;
				case "pattern":
					if(space === "plot" || space === "shapeX" || space === "shapeY"){
						// clone a fill so we can modify properly directly
						fill = gfx.makeParameters(gfx.defaultPattern, fill);
						fill.space = space;
						// process dimensions
						if(space === "plot" || space === "shapeX"){
							// process Y
							span = dim.height - offsets.t - offsets.b;
							fill.y = offsets.t + span * fill.y / 100;
							fill.height = span * fill.height / 100;
						}
						if(space === "plot" || space === "shapeY"){
							// process X
							span = dim.width - offsets.l - offsets.r;
							fill.x = offsets.l + span * fill.x / 100;
							fill.width = span * fill.width / 100;
						}
					}
					break;
			}
			return fill;
		},
		_shapeFill: function(fill, bbox){
			// process shape-specific fill
			if(!fill || !fill.space){
				return fill;
			}
			var space = fill.space, span;
			switch(fill.type){
				case "linear":
					if(space === "shape" || space === "shapeX" || space === "shapeY"){
						// clone a fill so we can modify properly directly
						fill = gfx.makeParameters(gfx.defaultLinearGradient, fill);
						fill.space = space;
						// process dimensions
						if(space === "shape" || space === "shapeX"){
							// process X
							span = bbox.width;
							fill.x1 = bbox.x + span * fill.x1 / 100;
							fill.x2 = bbox.x + span * fill.x2 / 100;
						}
						if(space === "shape" || space === "shapeY"){
							// process Y
							span = bbox.height;
							fill.y1 = bbox.y + span * fill.y1 / 100;
							fill.y2 = bbox.y + span * fill.y2 / 100;
						}
					}
					break;
				case "radial":
					if(space === "shape"){
						// this one is used exclusively for bubble charts and pie charts
						// clone a fill so we can modify properly directly
						fill = gfx.makeParameters(gfx.defaultRadialGradient, fill);
						fill.space = space;
						// process both dimensions
						fill.cx = bbox.x + bbox.width  / 2;
						fill.cy = bbox.y + bbox.height / 2;
						fill.r  = fill.r * bbox.width  / 200;
					}
					break;
				case "pattern":
					if(space === "shape" || space === "shapeX" || space === "shapeY"){
						// clone a fill so we can modify properly directly
						fill = gfx.makeParameters(gfx.defaultPattern, fill);
						fill.space = space;
						// process dimensions
						if(space === "shape" || space === "shapeX"){
							// process X
							span = bbox.width;
							fill.x = bbox.x + span * fill.x / 100;
							fill.width = span * fill.width / 100;
						}
						if(space === "shape" || space === "shapeY"){
							// process Y
							span = bbox.height;
							fill.y = bbox.y + span * fill.y / 100;
							fill.height = span * fill.height / 100;
						}
					}
					break;
			}
			return fill;
		},
		_pseudoRadialFill: function(fill, center, radius, start, end){
			// process pseudo-radial fills
			if(!fill || fill.type !== "radial" || fill.space !== "shape"){
				return fill;
			}
			// clone and normalize fill
			var space = fill.space;
			fill = gfx.makeParameters(gfx.defaultRadialGradient, fill);
			fill.space = space;
			if(arguments.length < 4){
				// process both dimensions
				fill.cx = center.x;
				fill.cy = center.y;
				fill.r  = fill.r * radius / 100;
				return fill;
			}
			// convert to a linear gradient
			var angle = arguments.length < 5 ? start : (end + start) / 2;
			return {
				type: "linear",
				x1: center.x,
				y1: center.y,
				x2: center.x + fill.r * radius * Math.cos(angle) / 100,
				y2: center.y + fill.r * radius * Math.sin(angle) / 100,
				colors: fill.colors
			};
		}
	});
});

},
'money/views/navigation':function(){
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

},
'money/views/details':function(){
define([
	//dojo base
	"dojo/_base/array", 
	"dojo/_base/lang",
	"dojo/Deferred", "dojo/date/locale", "dojo/has", "dojo/when",
	"money/dialog",
 
	//dom manipulation
	"dojo/dom", "dojo/query", "dojo/on",  "dojo/dom-class", "dojo/dom-style", 
    
    //widgets
     "dijit/registry","dojox/mobile/SpinWheelDatePicker"    
    ],
    function(
		array, lang, Deferred, locale, has, when,Dialog,
		dom,query, on, domClass, domStyle,
		registry, SpinDatePicker){ 
    
    return window.AppData.objDet = {
		afterActivate: function(){
			window.hideProgress()
		},
		beforeActivate: function(){
			//alert('called before activate')
			// in case we are still under saving previous
			// modifications, let's wait for the operation
			// to be completed and use the resulting
			// contact as input
			var self = this
			
			var callback = function(){
			
				window.AppData.numberPicker.mode = "t"
				var view = window.dFinance.children.dFinance_details;
				if(view.datePicker){
					view.datePicker.placeAt('datepickernode')
				}
					console.log(view.datePicker)
			
				if(this.params.proceed2)
					this.saver(window.AppData.details)
				else if(this.params.proceed){
					if(window.AppData.details.transaction.type != "t")
						this.saver(window.AppData.details)
					else {
						var self = this;
						this.dlg.show(false, "New accountTo will be created. Please, choose main currency for it","Creating account","Process", function(){
							window.dFinance.transitionToView(self.domNode,{
								target: window.AppData.isInitiallySmall ? 'currencypicker' : "currencypicker",//'navigation+list', 
								transitionDir: 1,
								params : {backTo : 'details', proceed: true, currency: view.params.currency, transaction: window.AppData.details.params.id ? window.AppData.details.params.id : true}
							})
							//saver();
						})
					}
				}
				if(!this.params.doNotReload){
					this.transaction = null
					when(view._savePromise, function(contact){
						view._savePromise = null;
						view._beforeActivate();
					});
				
				
				}
			}
			setTimeout(function(){
				callback.call(self)
			},0)
        },
        _beforeActivate: function(){
            // get the id of the displayed contact from the params if
            // we don't have a contact or from the contact if we have
            // one
            
			var id = this.params.id, edit = true. self = this//this.params.edit;
 
			// are we in create mode
			var create = (typeof id === "undefined");
			// change widgets readonly value based on that
			query("input", this.domNode).forEach(function(node){
                registry.byNode(node).set("readOnly", !edit);
            });
            // in edit mode change the label and params of the
            // edit button
            this.editButton.set("label", this.nls.ok);
            // put a listener to save the form when we are editing if
            // there is not one already
            this._onHandler = this.editButton.on("click",
				lang.hitch(this, this._saveForm));
            
            
            // hide back button in edit mode
            if(edit){
                //domClass.add(this.backButton.domNode, "hidden");
                domClass.remove(this.formLayout.domNode,
                    "mblFormLayoutReadOnly");
            }
            
            // cancel button must be shown in edit mode only,
            // same for delete button if we are not creating a
            // new contact
            //this.cancelButton.domNode.style.display = edit?"":"none";
			this.deleteButton.domNode.style.display =
				(edit&&(typeof id !== "undefined"))?"":"none";
 
            // let's fill the form with the currently selected contact
            // if nothing selected skip that part
            var view = window.AppData.details;
            var promise = null;
            //console.log(create, contact)
            view.deleteButton.set('disabled',!!create)
			if(!create){
				id = id.toString();
				// get the transaction on the store
				promise = view.loadedStores.transactions.getItem(id);                
			}else{
				promise = view.transaction = view._createContact();
			}
			var store = view.loadedStores.transactions
			var defaultAccount = store.getAccounts()[0] ? store.getAccounts()[0].label : 'Cash'
			var secondDefaultAccount = (store.getAccounts().length > 1) ? store.getAccounts()[1].label : 'Debit card'
            
            when(promise, function(transaction){
                console.log('transaction from store',transaction)
                view.transaction = {
					date	: (transaction && transaction.date) ? transaction.date : new Date,
					amount	: (transaction && transaction.amount) ? transaction.amount : 0,
					tags	: (transaction && transaction.tags) ? transaction.tags : [],
					descr	: (transaction && transaction.descr) ? transaction.descr : "",
					type 	: (transaction && transaction.type) ? transaction.type : 'e',
					account : (transaction && transaction.account) ? transaction.account : defaultAccount
				}
				
				registry.byId('det-is-'+view.transaction.type).set('selected',true)
				if(view.transaction.type=="t"){
					view.transaction.accountTo = (transaction && transaction.accountTo) ? transaction.accountTo : secondDefaultAccount
					view.accountTo.set("label",
						(transaction && transaction.accountTo) ? store.getAccount(transaction.accountTo).label : secondDefaultAccount);
				
				}
				domStyle.set("accountTo-container", "display", (view.transaction.type == "t") ? "": "none")
            
				view.account.set("label",
					(transaction && transaction.account) ? store.getAccount(transaction.account).label : defaultAccount);
				
				var a = window.AppData.accountStore.query({'label': view.account.get('label')})
					view.currency.set('label',a[0]?a[0].currency:window.AppData.currency);
					view.transaction.currency = a[0]?a[0].currency:window.AppData.currency
				
				view.amount.set("label",
					getNumber(view.transaction.amount))
				
					
				view.date.set("label",
					getDateStringHr(view.transaction.date,locale))
				
				/* set value of datepicker */
				var val = getDateString(view.transaction.date,locale)
				//var valarray = val.split('-')
				console.log(view.datePicker)
				//view.datePicker.reset()
				view.datePicker.set('value',val)
				/* end of datepicker */
				console.log('here we are')
				var tags = ""
				if(transaction && transaction.tags)
				for (var i in transaction.tags){
					if(tags != "") tags+=", "
					tags += store.getTag(transaction.tags[i]).label
				}
				view.tags.set("label", tags);
				view.descr.set("value",
					(transaction && transaction.descr) ? transaction.descr : "");
                    // hide empty fields when not in edit mode
				if(!edit){
					view._hideEmptyFields(view);
				}
			});
		},
		_saveForm: function(){
            var view = window.AppData.details, transaction;
            var id = view.params.id;
            var self = this;
            view._savePromise = new Deferred();
            view._savePromise.then(function(){
				window.dFinance.transitionToView(self.domNode,{
					target: window.AppData.isInitiallySmall ? 'list' : 'navigation+list', 
					transitionDir: -1,
					params: window.AppData.details.editButton.transitionOptions.params
				})
			})
            if(typeof id === "undefined"){
				transaction = view.transaction
            }
			// get the contact on the store
			var handler = function(transaction){
				self.saver = function(view){
					var transaction = view.transaction
					view._saveContact(transaction)
					when(view.loadedStores.transactions.putItem(transaction),
						function(savedContact){
							var def = savedContact.def
							var _handler = function(){
								view._savePromise.resolve(savedContact.id)
							}
							if(def.then && lang.isFunction(def.then))
								def.then(_handler)
							else _handler()
						}
					);
				}
				if(!window.AppData.accountStore.query({'label':self.account.get('label')})[0]){
					self.dlg.show(false, "New account will be created. Please, choose main currency for it","Creating new account","Process", function(){
						console.log(window.dFinance.transitionToView.toString())
						window.dFinance.transitionToView(self.domNode,{
							target: window.AppData.isInitiallySmall ? 'currencypicker' : "currencypicker",//'navigation+list', 
							transitionDir: 1,
							params : {backTo : 'details', transaction: window.AppData.details.params.id ? window.AppData.details.params.id : true}
						})
						//saver();
					})
				}else if(view.transaction.type=="t" && !window.AppData.accountStore.query({'label':self.accountTo.get('label')})[0]){
					self.dlg.show(false, "New accountTo will be created. Please, choose main currency for it","Creating new account","Process", function(){
						window.dFinance.transitionToView(self.domNode,{
							target: window.AppData.isInitiallySmall ? 'currencypicker' : "currencypicker",//'navigation+list', 
							transitionDir: 1,
							params : {backTo : 'details', proceed: true, transaction: window.AppData.details.params.id ? window.AppData.details.params.id : true}
						})
					})
				}else{
					self.saver(window.AppData.details);
				}
			}
			
			if(id){
				var promise =
					view.loadedStores.transactions.getItem(id.toString());
				when(promise, handler)
			}else handler(transaction)
		},
        _createContact: function(){
            return {
                "tags"	: "",
                "amount": parseFloat('0').toFixed(2),
                "type"	: "e",
                "date"	: new Date,
                "descr" : ""
            };
            var view = window.AppData.details;
            view._saveContact(contact);
            when(view.loadedStores.transactions.add(contact),
                function(savedContact){
                    // some store do return a contact some other an ID
                    view._savePromise.resolve(savedContact.id);
                }
            );
        },
        _saveContact: function(transaction){
            // set back the values on the contact object
            var value, keys, self = this;
            /*
             * 	Get description
             */
            if(!transaction.id && self.params.id)
				transaction.id = self.params.id
            value = this.descr.get("value");
            if(typeof value !== "undefined"){
                transaction.descr = value
            }else transaction.descr = ""
            
            value = this.tags.get('label')
            if(typeof value !== "undefined"){
                this.transaction.tags = value
            }else this.transaction.tags = ""
            
            value = this.transaction.date
            window.AppData.details.editButton.transitionOptions.params.id = 
				isValidDate(value) ? getDateString(value, locale) : (value)
            /*
             * 	Get transaction type ('e', 'i' or 't')
             */
            transaction.type 	= this.transaction.type
            var store  			= this.loadedStores.transactions
            
            value = this.account.get('label')
            var id  = window.AppData.accountStore.query({'label':value})[0] ?
				window.AppData.accountStore.query({'label':value})[0].id : window.AppData.accountStore.put({
					'label': value, 
					currency: self.params.currency, 
					startAmount: 0, 
					et: new Date().getTime(),
					maincur: self.params.currency
				})
			window.AppData.details.transaction.account = id
			
			transaction.amount 	= fx(Number(this.transaction.amount))
									.from(transaction.currency)
									.to(window.AppData.accountStore.get(id).maincur)
            
			window.AppData.store._setAccounts(window.AppData.accountStore.query())
			
            transaction.account = this.transaction.account //|| (store.getAccounts()[0] ? store.getAccounts()[0].id : 'Cash')
            if(transaction.type == "t"){
				value = this.accountTo.get('label')
				
				var id  = window.AppData.accountStore.query({'label':value})[0] ?
				window.AppData.accountStore.query({'label':value})[0].id : window.AppData.accountStore.put({
					'label': value, 
					currency: self.params.currencyTo, 
					startAmount: 0, 
					et: new Date().getTime(),
					maincur: self.params.currencyTo
				})
				window.AppData.details.transaction.accountTo = id
				console.log(window.AppData.details.transaction.account,window.AppData.accountStore.get(window.AppData.details.transaction.account).maincur,window.AppData.accountStore.get(id).maincur,id)
				window.AppData.details.transaction.sumTo = 
					fx(Number(transaction.amount))
						.from(window.AppData.accountStore.get(window.AppData.details.transaction.account).maincur)
						.to(window.AppData.accountStore.get(id).maincur);
				window.AppData.store._setAccounts(window.AppData.accountStore.query())
			}
            transaction.date	= this.transaction.date
            transaction.tags 	= this.transaction.tags.split(',')
            for(var i in transaction.tags){
				transaction.tags[i] = String(transaction.tags[i]).fulltrim()
			}
			transaction.amountHome = 
				fx(Number(transaction.amount))
					.from(window.AppData.accountStore.get(window.AppData.details.transaction.account).maincur)
					.to(window.AppData.currency);
            
            console.log(transaction)
            return transaction
        },
        
        _hideEmptyFields: function(view){
            query(".readOnlyHidden",
                view.formLayout.domNode).forEach(function(node){
                domClass.remove(node, "readOnlyHidden");
            });
            query("input",
                view.formLayout.domNode).forEach(function(node){
                var val = registry.byNode(node).get("value");
                if(!val && node.parentNode.parentNode &&
                    node.id !== "firstname" &&
                    node.id !== "lastname"){
                        domClass.add(node.parentNode.parentNode,
                            "readOnlyHidden");
                }
            }); 
        },
        deleteContact: function(){
			var view = window.AppData.details;
			view.deleteOverlay.show();			
		},
        _deleteContact: function(){
			var view = window.AppData.details;
			when(view.loadedStores.transactions.removeItem(
				view.params.id.toString()), function(def){
					// we want to be back to list
					view.deleteOverlay.hide();
					setTimeout(function(){
						view.app.transitionToView(view.domNode, {target: "list" , transitionDir: -1});
					}, 500);
				});
        },
        _hideDelete: function(){
			var view = window.AppData.details;
			view.deleteOverlay.hide();
		},
        init: function(){
			window.AppData.details = this
            if(has('isInitiallySmall')){
				this.isInitiallySmall = true
				this.constraint = "center"
				domClass.add	(this.domNode, "center");
				domClass.remove	(this.domNode, "left");
			}
			window.AppData.numberPicker._onDoneCallbackRegistry.push({
				scope 	: window.AppData.details,
				fn 		: window.AppData.details.getAmount,
				mode	: "t"
			})
			
			this.currency.onClick = function(){
				window.dFinance.transitionToView(window.AppData.details.domNode,{
					target: "currencypicker",//'navigation+list', 
					transitionDir: 1,
					params : {
						backTo : 'details', 
						'transaction' : window.AppData.details.params.id ? window.AppData.details.params.id : true,
						'setCurrency' : true
						}
				})
			}
			this.dlg = window.AppData.dialogWindow ? window.AppData.dialogWindow : (window.AppData.dialogWindow = new Dialog);
		},
		
		getAmount: function(amount){
			this.transaction.amount = parseFloat(amount)
			console.log("AMOUNT IS",this.transaction.amount)
			window.AppData.details.amount.set('label',getNumber(amount))
		},
		tagsShow: function(){
			registry.byId('newTags').set('value', window.AppData.details.tags.get('label'));
			//window.registry = registry
			var tags = window.AppData.details.transaction.tags
			var taglis = window.AppData.details.tagsPicker.getChildren()
			for (var i in taglis)
				taglis[i].set('checked',false)
			for (var i in tags)
				if(registry.byId(String(tags[i]))){
					registry.byId(String(tags[i])).set('checked',true)
				}
			var list = query("#tagsPicker .mblListItem")
			arrayUtil.forEach(list,function(li){
				if(!registry.byId(String(li.id))._onClickSetUp){
					registry.byId(String(li.id)).onClick = function(){
						//alert('handler')
						var val = registry.byId('newTags').get('value');
						var tag = window.AppData.tagsStore.get(this.id)
						var tagl = String(tag.label).toLowerCase(), tagn = String(tag.label)
						//alert('current: '+val+ 'tag: '+tagn)
						if(val.toLowerCase().indexOf(tagl) + 1){
							var end = String(val.substr(val.toLowerCase().indexOf(tagl)+tagl.length,val.length-1)).fulltrim()
							var beg = String(val.substr(0, val.toLowerCase().indexOf(tagl))).fulltrim()
							if(end.substr(0,1)==',') end = end.substr(1, end.length-1)
							else if(beg.substr(-1)==',') beg = beg.substr(0, beg.length-1)
							val =  beg + end;
						//	alert(beg + end)
						}else
							val += (val ? (', ' + tagn) : tagn)
						registry.byId('newTags').set('value', val);
					}
					registry.byId(String(li.id))._onClickSetUp = true
				}
			})
			window.AppData.details.tagsPickerOverlay.show('tags', ['below-centered','above-centered','after','before'])
		},
		tags: function(){
			var val = registry.byId('newTags').get('value');
			window.AppData.details.tags.set('label',val)
			if(typeof val == 'string'){
				val = val.split(',')
				for(var i in val){
					val[i] = String(val[i]).fulltrim()
					console.log(val[i])}
				window.AppData.details.transaction.tags = val
				console.log(window.AppData.details.transaction.tags)
			}
			//registry.byId('newTags').set('value','');
			//registry.byId('transactionTagsOverlay').hide()			
		},
		date: function(){
			registry.byId('transactionDateOverlay').hide()
			var w = window.AppData.details.datePicker,
			val = w.slots[0].value+ "-" + w.slots[1].value + "-" + w.slots[2].value;
			console.log(val)
			window.AppData.details.transaction.date = locale.parse(val,{"selector":"date", "datePattern":"yyyy-MMM-dd"})
			window.AppData.details.date.set('label',getDateStringHr(window.AppData.details.transaction.date,locale))
		},
		acc: function(btn){
			var val = registry.byId('newAccount').get('value');
			btn.set('label',val)
		},
		setType : function(type){
			window.AppData.details.transaction.type = type
			window.AppData.details.changeType(type)
		},
		setTypeE: function(){
			window.AppData.objDet.setType('e')
			domStyle.set("accountTo-container", "display", "none")
		},
		setTypeI: function(){
			window.AppData.objDet.setType('i')
			domStyle.set("accountTo-container", "display", "none")
		},
		setTypeT: function(){
			window.AppData.objDet.setType('t')
			domStyle.set("accountTo-container", "display", "")            
		},
		changeType: function(type){
			if (type == "e")
				window.AppData.details.transaction.amount = - Math.abs(window.AppData.details.transaction.amount)
			else if(type == "i" || type == "t")
				window.AppData.details.transaction.amount = Math.abs(window.AppData.details.transaction.amount)
			window.AppData.details.amount.set('label',getNumber(window.AppData.details.transaction.amount))
		}
    }
});

},
'dojox/charting/themes/PrimaryColors':function(){
define(["../Theme", "./gradientGenerator", "./common"], function(Theme, gradientGenerator, themes){

	var colors = ["#f00", "#0f0", "#00f", "#ff0", "#0ff", "#f0f", "./common"],
		defaultFill = {type: "linear", space: "plot", x1: 0, y1: 0, x2: 0, y2: 100};

	themes.PrimaryColors = new Theme({
		seriesThemes: gradientGenerator.generateMiniTheme(colors, defaultFill, 90, 40, 25)
	});
	
	return themes.PrimaryColors;
});

},
'url:money/conf.json':"{\n    \"id\": \"dFinance\",\n    \"dependencies\": [\n        \"dojox/mobile/Heading\",\n        \"dojox/app/widgets/Container\",\n        \"dojox/mobile/EdgeToEdgeCategory\",\n        \"dojox/mobile/RoundRectCategory\",\n        \"dojox/mobile/EdgeToEdgeList\",\n        \"dojox/mobile/RoundRect\",\n        \"dojox/mobile/ScrollableView\",\n        \"dojox/mobile/ScrollablePane\",\n\t\t\"dojox/app/widgets/Container\",\n        \"dojox/mobile/ToolBarButton\",\n        \"dojox/mobile/Switch\" ,\n        \"money/store\",\n        \"money/WheelScrollableView\",\n        \"dojox/mobile/ExpandingTextArea\",\n        \"dojox/mobile/TextBox\",\n        \"dojox/mobile/Pane\",\n        \"dijit/_WidgetBase\",\n        \"dijit/_WidgetsInTemplateMixin\",\n        \"dojox/mobile/SimpleDialog\",\n        \"dijit/_TemplatedMixin\",\n        \"dojox/mobile/Opener\",\n        \"dojox/mobile/Tooltip\",\n        \"dojox/mobile/FormLayout\",\n        \"dojox/mobile/TabBar\",\n        \"dojox/mobile/TabBarButton\",\n        \"dojox/mobile/GridLayout\",\n        \"dojox/mobile/TextBox\",\n        \"dojox/mobile/SpinWheelDatePicker\",\n        \"dojox/mobile/TextArea\",\n        \"dojox/mobile/Button\",\n        \"dojox/mobile/ContentPane\",\n        \"dojox/mobile/RoundRectStoreList\",        \n        \"dojox/mobile/Icon\"\n    ],\n    \"nls\"\t\t\t\t: \"money/nls/app.nls\",\n\t\"defaultTransition\"\t: \"fade\",\n\t\"transition\"\t\t: \"fade\",\n\t\"defaultView\"\t\t: \"navigation+summary\",\n    \"controllers\"\t\t: [\n        \"dojox/app/controllers/Load\",\n        \"dojox/app/controllers/Transition\",\n        \"dojox/app/controllers/Layout\"\n    ],\n    \"stores\" : {\n\t\t\"transactions\": {\n\t\t\t\"type\": \"money/store\"\n\t\t}\n\t},\n\t\"views\": {    \n        \"navigation\":{\n\t\t\t\"constraint\"\t: \"left\",\n\t\t\t\"template\"\t\t: \"money/views/navigation.html\",\n\t\t\t\"controller\"\t: \"money/views/navigation\",\n\t\t\t\"nls\"\t\t\t: \"money/nls/navigation\"\n\t\t},\n        \"list\": {\n            \"constraint\"\t: \"center\",\n            \"controller\"\t: \"money/views/list\",\n            \"template\"\t\t: \"money/views/list.html\",\n\t\t\t\"nls\"\t\t\t: \"money/nls/daily\"\n        },\n        \"details\": {\n\t\t\t\"constraint\" \t: \"center\",\n\t\t\t\"controller\"\t: \"money/views/details\",\n\t\t\t\"template\"\t\t: \"money/views/details.html\",\n\t\t\t\"nls\"\t\t\t: \"money/nls/details\"\n\t\t},\n\t\t\"summary\": {\n\t\t\t\"constraint\" \t: \"center\",\n\t\t\t\"controller\"\t: \"money/views/summary\",\n\t\t\t\"template\"\t\t: \"money/views/summary.html\",\n\t\t\t\"nls\"       \t: \"money/nls/summary\"\n\t\t},\n\t\t\"about\": {\n\t\t\t\"constraint\"\t: \"center\",\n\t\t\t\"controller\"\t: \"money/views/about\",\n\t\t\t\"template\"\t\t: \"money/views/about.html\",\n\t\t\t\"nls\"       \t: \"money/nls/about\"\n\t\t},\n\t\t\"charts\": {\n\t\t\t\"constraint\" \t: \"center\",\n\t\t\t\"controller\"\t: \"money/views/charts\",\n\t\t\t\"template\"\t\t: \"money/views/charts.html\",\n\t\t\t\"nls\"       \t: \"money/nls/stats\"\n\t\t},\n\t\t\"tagspicker\": {\n\t\t\t\"constraint\" \t: \"left\",\n\t\t\t\"controller\"\t: \"money/views/tagspicker\",\n\t\t\t\"template\"\t\t: \"money/views/tagspicker.html\",\n\t\t\t\"nls\"       \t: \"money/nls/tagspicker\"\n\t\t},\n\t\t\"accountpicker\": {\n\t\t\t\"constraint\" \t: \"left\",\n\t\t\t\"controller\" \t: \"money/views/accountpicker\",\n\t\t\t\"template\"\t \t: \"money/views/accountpicker.html\",\n\t\t\t\"nls\"       \t: \"money/nls/accountpicker\"\n\t\t},\n\t\t\"backup\": {\n\t\t\t\"constraint\" \t: \"center\",\n\t\t\t\"controller\" \t: \"money/views/backup\",\n\t\t\t\"template\"\t \t: \"money/views/backup.html\",\n\t\t\t\"nls\"       \t: \"money/nls/backup\"\n\t\t},\n\t\t\"settings\": {\n\t\t\t\"constraint\" \t: \"center\",\n\t\t\t\"controller\" \t: \"money/views/settings\",\n\t\t\t\"template\"\t \t: \"money/views/settings.html\",\n\t\t\t\"nls\"\t \t\t: \"money/nls/settings\"\n\t\t\t\n\t\t},\n\t\t\"accounts\": {\n\t\t\t\"constraint\" \t: \"center\",\n\t\t\t\"controller\" \t: \"money/views/accounts\",\n\t\t\t\"template\"\t \t: \"money/views/accounts.html\",\n\t\t\t\"nls\"\t \t\t: \"money/nls/accounts\"\n\t\t},\n\t\t\"tags\": {\n\t\t\t\"constraint\" : \"center\",\n\t\t\t\"controller\" : \"money/views/tags\",\n\t\t\t\"template\"\t : \"money/views/tags.html\",\n\t\t\t\"nls\"\t : \"money/nls/tags\"\n\t\t},\n\t\t\"currencypicker\": {\n\t\t\t\"constraint\" : \"center\",\n\t\t\t\"controller\" : \"money/views/currencypicker\",\n\t\t\t\"template\"\t : \"money/views/currencypicker.html\",\n\t\t\t\"nls\"        : \"money/nls/currency\"\n\t\t},\n\t\t\"timespan\": {\n\t\t\t\"constraint\" : \"center\",\n\t\t\t\"controller\" : \"money/views/timespan\",\n\t\t\t\"template\"\t : \"money/views/timespan.html\",\n\t\t\t\"nls\"\t\t : \"money/nls/timespan\"\n\t\t},\n\t\t\"transitione\": {\n\t\t\t\"constraint\" : \"center\",\n\t\t\t\"controller\" : \"money/views/transition\",\n\t\t\t\"template\"\t : \"money/views/transition.html\"\n\t\t},\n\t\t\"language\": {\n\t\t\t\"constraint\" : \"center\",\n\t\t\t\"controller\" : \"money/views/language\",\n\t\t\t\"template\"\t : \"money/views/language.html\",\n\t\t\t\"nls\"\t\t : \"money/nls/language\"\n\t\t}\n    },\n    \"has\": {\n\t\t\"html5history\": {\n\t\t\t\"controllers\": [\n\t\t\t\t\"dojox/app/controllers/History\"\n\t\t\t]\n\t\t},\n\t\t\"!html5history\": {\n\t\t\t\"controllers\": [\n\t\t\t\t\"dojox/app/controllers/HistoryHash\"\n\t\t\t]\n\t\t}\t\t\n\t}\n}\n",
'url:money/numberpicker.html':"<div class=\"wrapper1\">\r\n\t<h2 style=\"margin: 0px; line-height: 45px;\">\r\n\t\t<button data-dojo-type=\"dojox/mobile/ToolBarButton\" label=\"DONE\" class=\"mblColorBlue right-button\"\r\n\t\t\tonClick=\"window.AppData.numberPicker.onDone()\"\r\n\t\t\tdata-dojo-attach-point=\"okButton\"\r\n\t\t\t></button> Amount\r\n\t</h2>\r\n\t\t\r\n    <div style=\"margin:20px auto 15px auto; width:200px\">\r\n\t\t<input type=\"number\" id = \"amount-input\"\r\n\t\t\tdata-dojo-attach-point=\"inputField\"\r\n\t\t\tstyle=\"text-align:right;font-weight:bold;font-size:150%; line-height:1em; height:1.5em; width:100%\" data-dojo-props=\"readOnly:true, value:'0.00'\" data-dojo-type=\"dojox/mobile/TextBox\"/>\r\n\t</div>\r\n\t<div data-dojo-type=\"dojox/mobile/GridLayout\" data-dojo-props='cols:3' style=\"\">\r\n\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\r\n\t\t\t<div class=\"wrapper\">\r\n\t\t\t\t<button class=\"mblBlueButton wide\" data-dojo-type=\"dojox/mobile/ToolBarButton\"\r\n\t\t\t\tdata-dojo-props=\"_onTouchStart: function(){console.log(this,'!');window.AppData.numberPicker.key('1', this)}\">1</button>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\r\n\t\t\t<div class=\"wrapper\">\r\n\t\t\t\t<button class=\"mblBlueButton wide\" data-dojo-type=\"dojox/mobile/ToolBarButton\"\r\n\t\t\t\tdata-dojo-props=\"_onTouchStart: function(){window.AppData.numberPicker.key('2', this)}\">2</button>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\r\n\t\t\t<div class=\"wrapper\">\r\n\t\t\t\t<button class=\"mblBlueButton wide\" data-dojo-type=\"dojox/mobile/ToolBarButton\"\r\n\t\t\t\t\tdata-dojo-props=\"_onTouchStart: function(){window.AppData.numberPicker.key('3',this)}\">3</button>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\r\n\t\t\t<div class=\"wrapper\">\r\n\t\t\t\t<button class=\"mblBlueButton wide\" data-dojo-type=\"dojox/mobile/ToolBarButton\"\r\n\t\t\t\t\tdata-dojo-props=\"_onTouchStart: function(){window.AppData.numberPicker.key('4',this)}\">4</button>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\r\n\t\t\t<div class=\"wrapper\">\r\n\t\t\t\t<button class=\"mblBlueButton wide\" data-dojo-type=\"dojox/mobile/ToolBarButton\"\r\n\t\t\t\t\tdata-dojo-props=\"_onTouchStart: function(){window.AppData.numberPicker.key('5',this)}\">5</button>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\r\n\t\t\t<div class=\"wrapper\">\r\n\t\t\t\t<button class=\"mblBlueButton wide\" data-dojo-type=\"dojox/mobile/ToolBarButton\"\r\n\t\t\t\t\tdata-dojo-props=\"_onTouchStart: function(){window.AppData.numberPicker.key('6',this)}\">6</button>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\r\n\t\t\t<div class=\"wrapper\">\r\n\t\t\t\t<button class=\"mblBlueButton wide\" data-dojo-type=\"dojox/mobile/ToolBarButton\"\r\n\t\t\t\t\tdata-dojo-props=\"_onTouchStart: function(){window.AppData.numberPicker.key('7',this)}\">7</button>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\r\n\t\t\t<div class=\"wrapper\">\r\n\t\t\t\t<button class=\"mblBlueButton wide\" data-dojo-type=\"dojox/mobile/ToolBarButton\"\r\n\t\t\t\t\tdata-dojo-props=\"_onTouchStart: function(){window.AppData.numberPicker.key('8',this)}\">8</button>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\r\n\t\t\t<div class=\"wrapper\">\r\n\t\t\t\t<button class=\"mblBlueButton wide\" data-dojo-type=\"dojox/mobile/ToolBarButton\" \r\n\t\t\t\t\tdata-dojo-props=\"_onTouchStart: function(){window.AppData.numberPicker.key('9',this)}\">9</button>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\r\n\t\t\t<div class=\"wrapper\">\r\n\t\t\t\t<button class=\"mblRedButton wide\" data-dojo-type=\"dojox/mobile/ToolBarButton\"\r\n\t\t\t\t\tdata-dojo-props=\"_onTouchStart: function(){window.AppData.numberPicker.key('c',this)}\"><img style=\"vertical-align:middle;margin-top:-3px; \"/></button>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\r\n\t\t\t<div class=\"wrapper\">\r\n\t\t\t\t<button class=\"mblBlueButton wide\" data-dojo-type=\"dojox/mobile/ToolBarButton\"\r\n\t\t\t\t\tdata-dojo-props=\"_onTouchStart: function(){window.AppData.numberPicker.key('0',this)}\">0</button>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\r\n\t\t\t<div class=\"wrapper\">\r\n\t\t\t\t<button class=\"mblBlueButton wide\" data-dojo-type=\"dojox/mobile/ToolBarButton\"\r\n\t\t\t\t\tdata-dojo-props=\"_onTouchStart: function(){window.AppData.numberPicker.key('dz',this)}\">.00</button>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t</div>\r\n</div>\r\n",
'*now':function(r){r(['dojo/i18n!*preload*money/nls/money-app*[]']);}
}});
define("money/money-app", [], 1);
