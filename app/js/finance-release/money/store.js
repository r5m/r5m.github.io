/*
*   Хранилище данных
*   
* 
*/

define("money/store", [
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
