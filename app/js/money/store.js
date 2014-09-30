/*
*   Store module
* 	rebuilt to work only with IndexedDB	
* 
*   v. 0.9
* 	21/09/2014
*   
* 	Mikhael Milikhin
* 
*/

define([
   	"dojo/_base/declare",
   	"dojo/_base/Deferred",
   	"dojo/json",
	"dojo/_base/array",
	"dojo/date/locale", 
	"money/idb",
	"dojo/_base/lang",
	"dojo/store/Observable", "dojo/store/Memory"
	],
    function(
		declare, Deferred, json,
		arrayUtil, locale, Idb,
		lang, Observable, Memory) {
			
        return declare(null, {
            isLocalStorageAvailable :function(){
				return 'localStorage' in window && window['localStorage'] !== null;			
			},
			
			idb: null,
			
			/*
			 * 	Basic operations with storage:
			 * 
			 * 	- get
			 * 	- put
			 * 	- remove
			 * 	- query
			 * 
			 */
			'get': function(id){
                return this.idb.getById(id);
            },
            
            /*
             * @doNotRefresh - not to update edited time//not to initiate views update
             */ 
            'put': function(obj, doNotRefresh, doNotRefreshSummary){
				var doNotRefresh = doNotRefresh || false
				var doNotRefreshSummary = doNotRefreshSummary || false
                if( !obj ) return false;
                try{
					for(var i = 0; i < obj.tags.length; i++){
						var queryTagByLabel = window.AppData.tagsStore.query({
							'label' : obj.tags[i]
						});
						var queryTagById = window.AppData.tagsStore.query({
							'id' : obj.tags[i]
						});
						
						//if condition below are false, we already have have tag ID, so nothing needed to be done
						if( ( queryTagByLabel.length > 0 ) && ( queryTagById.length == 0 ) ){
							//tag found by label
							obj.tags[i] = queryTagByLabel[0].id
						}else if(( queryTagByLabel.length == 0 ) && ( queryTagById.length == 0) ){
							//tag not found
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
					
					if(obj.tags.sort) 
						obj.tags.sort();
					
					localStorage.setItem("tags",
						json.stringify( window.AppData.tagsStore.query() )
					);
					
					// generate unique object ID
					obj.id = obj.id ? obj.id : Math.random()
					
					var idbPromise = false
					//Edit time. needed for Dropbox; ??
					if(!doNotRefresh)
						obj.et = new Date().getTime();
						
					idbPromise = this.idb.addItem( obj, doNotRefreshSummary );
					return {
						id	: obj.id, 
						obj	: obj, 
						def	: idbPromise
					}					
                }catch(e){
					alert('error saving to store.. ' + e.toString())
                    console.log("error saving to store...", e)
                }
            },
            
            'query': function(){
				return this.idb.query.apply( this.idb, arguments )
			},
			
			/*
			 * @doNotLog - don't save info about deletion
			 */ 
            'remove': function(removedFrom, doNotLog){
                var d = null, doNotLog = doNotLog || false;
                try{
					d = this.idb.deleteItem(removedFrom)                    
					if( !doNotLog ) {
						var deleted = 
							localStorage.getItem('deleted') ? 
								json.parse(localStorage.getItem('deleted')) : 
								new Array();
								
						deleted.push(removedFrom);
						localStorage.setItem('deleted',json.stringify(deleted));
					}
                }catch(e){
                    console.log("error removing from store...", e)
                }
                
                if(!d) {
					d = new Deferred;
					setTimeout(function(){
						d.resolve('hz');
					},0);
				}
                return d;
            },
            
            
            /*
             * Should be executed when data is fetched from Permanent store
             */ 
            _setupTagsDueToFrequency: function(data){
                /*
                *   item.date is transformed into Date object 
                * 	(IndexedDb doesn't support Date)
                */
               
                var tagsFreq = {};
                arrayUtil.forEach( data, lang.hitch( function( item ) {
					for( var i = 0; i < item.tags.length; i++) {
						if (tagsFreq [ item.tags[i] ])
							tagsFreq [ item.tags[i] ] ++;
						else
							tagsFreq [ item.tags[i] ] = 1;
					}					
				}), this)
				
				
				//reorder tags
				var tags = this._getTags();
				tags.sort( function( a,b ) {					
					return tagsFreq[a.id] < tagsFreq[b.id] ? 1 : -1;
				})
				
				for(var i = 0; i < tags.length; i++)
					tags[i].freq = tagsFreq[ tags[i].id ]
				
				window.AppData.tagsStore = 
					new Memory({ 
						idProperty:'id', 
						data: tags
					});
				
				
				console.log( 'TAGS', window.AppData.tagsStore.query() );
				
				//create handlers for put and remove events
				//this._createTransactionHandlers();
				//resolve data loading promise
				this.createPromise.resolve({status: 'ok'})
            },
            
            // -------------------------------------------- //
            //		  Initialize all stores                 //
            // ---------------------------------------------//
            
            		
			constructor: function( args ){
				this.createPromise = new Deferred()
				var self = this
				window.AppData.store = this
				if( !this.isLocalStorageAvailable() ){
					alert( 'HTML5 Local storage is not supported. Application won\'t work.')
					throw "NO_LOCAL_STORAGE";
				}
				
				var savedData = this.getAllData()
				window.AppData.accountStore = new Memory({
					idProperty:'id',
					data: savedData.accounts
				});
					
				window.AppData.curs = []; 
				var j=0;
				for (var i in window.AppData.currencies){
					//console.log(window.AppData.currencies[i])
					window.AppData.curs[j++] = {
						id: i,
						label:window.AppData.currencies[i] +  ' ('+i+')'//,
						//rightText: "$1 = " + window.AppData.rates.rates[i]+" "+i
					}
				}
				window.AppData.currencyStore = new Memory({ 
					idProperty:'id', 
					data: window.AppData.curs 
				});
					
				window.AppData.tagsStore = new Memory({
					idProperty:'id',
					data: savedData.tags
				});
				
				var themesData = [
					{"label": "Holodark", "id": "Holodark"},
					{"label": "Light (default)", "id": "Custom"}
				];
				var localeData = [
					{"label": "System default", "id": "no_lang"},
					{"label": "Russian", "id": "ru-ru"},
					{"label": "English", "id": "en-us"}
				];
				
				window.AppData.themeStore = new Memory({
					idProperty:'id',
					data: themesData
				});
				window.AppData.langStore = new Memory({
					idProperty:'id',
					data: localeData
				});
					
				this.idb = new Idb();
				this.idb.open().then( function(){
					self.query().then( function( data ){
						self._setupTagsDueToFrequency( data.items );
					});
					
				})
				
				
			},
			
			// ----------------------------------------------//
			//		Basic operations with additional stores  //
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
				return window.AppData.accountStore.get(id)
			},
			getAccounts: function(){
				return window.AppData.accountStore.query()
			},
			putAccount: function(obj){
				return window.AppData.accountStore.put(obj)
			},
			
			// remove account and all connected transactions
			removeAccount: function(id){
				var defArray = [],  defResult = new Deferred;
				defArray.push( new Deferred );
				defArray.push( new Deferred );
				if(id && window.AppData.accountStore.get(id)){
					this.idb.query({
						account: id
					}).then( function( data ) {
						var thisAccountTrans = data.items;
						arrayUtil.forEach(thisAccountTrans, function(item){
							this.idb.remove(item.id). then(
								function(){
									defArray[0].resolve('ok')
								}
							)
						},this)
					} )
					
					this.idb.query({
						accountTo: id
					}).then ( function( data) {
						var thisAccountTrans = data.items;
						arrayUtil.forEach(thisAccountTrans, function(item){
							this.idb.remove(item.id). then(
								function(){
									defArray[1].resolve('ok')
								}
							)
						},this)
					})
					
					new DeferredList( defArray )
						.then( function(){
							window.AppData.accountStore.remove(id)
							this._setAccounts(this.getAccounts());
							defResult.resolve( 'ok' )
						});					
				}
				return defResult;
			},
			_getAccounts: function(){
				if(this.isLocalStorageAvailable())
					return localStorage.getItem("accounts") ? json.parse(localStorage.getItem("accounts")) : []
				else return []
			},
			_setAccounts: function(data){
				if(data){
					localStorage.setItem("accounts", json.stringify( data ) )
					window.AppData.accountStore = new Memory({
						idProperty : 'id',
						'data' : data
					});
				}
			},
			
			
			
			
			_getSettings: function(){
				if(this.isLocalStorageAvailable())
					return localStorage.getItem("settings") ? json.parse(
						localStorage.getItem("settings")
					) : []
				else return []
			},
			
			_getTypes: function(){
				return [
					{"label": '_expence', "id": "e"},
					{"label": '_income', "id": "i"},
					{"label": '_transfer', "id": "t"}
				]
			},
			
			
			
			// Works with store
			getTag: function(id){
				return window.AppData.tagsStore.get(id)
			},
			putTag: function(obj){
				return window.AppData.tagsStore.put(obj)
			},
			getTags: function(){
				return window.AppData.tagsStore.query()
			},
			removeTag: function(id){
				if(id && window.AppData.tagsStore.get(id)){
					window.AppData.tagsStore.remove(id)
					this._setTags( this.getTags() )
				}
			},
			
			// Works with local storage			
			_getTags: function(){
				if(this.isLocalStorageAvailable())
					return localStorage.getItem("tags") ? json.parse(localStorage.getItem("tags")) : []
				else return []
			},
			_setTags: function(data){
				if(data){
					localStorage.setItem("tags", json.stringify( data ))
					window.AppData.tagsStore = new Memory({
						idProperty:'id','data': data
					})
				}
			},
			
			
			// NOT USED FOR NOW
			
			_getStoredDataCopy: function(){
				return this.idb ? lang.clone(this.idb.query()) : []
			},
			getAllData: function(formatDate){
				var formatDate = formatDate || false
				//var storeData = this._getStoredDataCopy()
				//if(formatDate)
				//	arrayUtil.forEach(storeData,function(item){
				//		item.date = locale.format(item.date, {selector:"date", datePattern:window.AppData.widgetDateFormat})
				//	})
				//console.log(storeData)
				return {
					accounts: this._getAccounts(),
					settings: this._getSettings(),
					types	: this._getTypes(),
					tags	: this._getTags()//,
					//storeData: storeData
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
