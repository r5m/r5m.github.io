/*
*   Store interface implementation via IndexedDB
* 	
*   v. 0.9
* 	21/09/2014
*   
* 	Mikhael Milikhin
* 
*/

define("money/idb", [
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
			dbVersion 	: 35,
			indexedDb	: null,
			moneyDb		: {},
			
			init: function(){
				this.moneyDb.open()
			},
			
			/*
			 * window.indexedDb 	- indexedDb interface
			 * moneyDb				- db instance for storing TRANSACTIONS
			 */ 
			
			constructor: function(){
				// проверяем существования префикса.
				window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
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
				this.moneyDb.db = null;
			},
			
			_onError: function(e) {
				console.log(e);
			},
			
			/*
			 * Allias to getById
			 */ 
			'get': function( id ){
				return this.getById( id )
			},
			
			/*
			 * It's easy: just getting object by id :-)
			 */ 
			getById: function(id) {
				var id = parseFloat(id) || -1, 
					db = this.moneyDb.db,
					trans = db.transaction( this.operationDb, 'readwrite'),
					store = trans.objectStore(this.operationDb),
					request = store.get(id),
					defRes = new Deferred;
				
				request.onsuccess = lang.hitch(this,function(e) {
					var item = e.target.result
					//replace transaction dateString with real Date
					if(item) {
						var date = item.date;
						item.date = locale.parse(date, {"selector":"date", "datePattern":window.AppData.widgetDateFormat})
					}
					defRes.resolve( item )
				});

				request.onerror = function(e) {
					console.log("Error getting object: " + id, e);
					defRes.resolve( null )
				};
				return defRes
			},
			
			getCount: function(){
				var def = new Deferred;
				this.query().then( function( items ){
					def.resolve( items.items.length )
				})
				return def
			},
			
			/* implements query dojo's interface
			* conditions (optional) is an object with filter params
			* {
			* 	from: date,
			* 	to	: date,
			* 	type: 'e' OR 'i' OR 't',
			* 
			* 	account: accountId,
			* 	tags: [ tadIds ]
			* }
			*	TODO: impement sorting params.
			*/ 
			'query': function( conditions ){
				var scope = scope || this,
					request = window.indexedDB.open( this.dbName ),
					items = [],
					defRes = new Deferred;
					
				request.onsuccess = lang.hitch(this,function(event) {
					// Enumerate the entire object store.
					var db = this.moneyDb.db,
						trans = db.transaction( this.operationDb, 'readonly' ),
						store = trans.objectStore( this.operationDb ),
						index, keyRange, from, to, type, account, accountTo,
						queryRequest;
						
					trans.oncomplete = lang.hitch(this,function() {
						// sort by date
						items = items.sort(function(a, b){
							return (a.date < b.date ? 1: -1) 
						})
						defRes.resolve( {'items': items} )
					});
					
					
					if( !!conditions ) {
						if( !!conditions.account){
							account = parseFloat( conditions.account );
						}
						if( !!conditions.accountTo){
							accountTo = parseFloat( conditions.accountTo );
						}
						if( !!conditions.from) {
							from = lang.isFunction(conditions.from) ?
								conditions.from() : conditions.from;
							if(!!from)
							from = isValidDate( from ) ? 
								locale.format( from, {
									"selector":"date", 
									"datePattern": window.AppData.widgetDateFormat
								}) : from;
						}
						if( !!conditions.to ){
							to = lang.isFunction(conditions.to) ?
								conditions.to() : conditions.to;
							if(!!to)
							to = locale.format( to, {
								"selector":"date", 
								"datePattern":window.AppData.widgetDateFormat
							});	
						}
						if( !!conditions.type) {
							type = lang.isFunction(conditions.type) ?
								conditions.type() : conditions.type
						}
					}
					console.log(from, to)
					if(account){
						keyRange = IDBKeyRange.only( account );
						index = store.index('account')
					}
					if(accountTo){
						keyRange = IDBKeyRange.only( accountTo );
						index = store.index('accountTo')
					}
					// get transations for the ONLY date
					if( from && !to) {
						if( type ) {
							keyRange = IDBKeyRange.only( [type, from]);
							index = store.index('dateType')
						}else{
							keyRange = IDBKeyRange.only( from );
							index = store.index('date')
						}
					}
					// get transations between given dates
					else if( from && to ) {
						if( type ) {
							keyRange = IDBKeyRange.bound( [type, from], [type, to]);
							index = store.index('dateType')
						} else {
							console.log(from, to)
							keyRange = IDBKeyRange.bound( from, to );
							index = store.index('date')
						}
					} else {
					// get transations by type						
						if( type ){
							keyRange = IDBKeyRange.only( type );
							index = store.index('type')
						}
					}
					
					if(keyRange) {
						queryRequest = index.openCursor( 
							keyRange
						);
					}
					else queryRequest = store.openCursor();
					
					if (queryRequest) {
						queryRequest.onsuccess = lang.hitch(this, function(event) {
							// This hack is to allow our code to run with Firefox (older versions than 6)
							var cursor = queryRequest.result || event.result;

							// If cursor is null then we've completed the enumeration, so return
							if (!cursor || !cursor.value) {
								return;
							}
							
							//get real date
							var date = cursor.value.date;
							cursor.value.date = 
								locale.parse(cursor.value.date, {
									"selector":"date", 
									"datePattern":
									window.AppData.widgetDateFormat
								})
							
							items.push(cursor.value)
							//this.deleteItem(cursor.value.id)
							//continue enumeration
							if(cursor["continue"] && lang.isFunction(cursor["continue"]))
								cursor["continue"]();
								
						})
					}else {
						defRes.resolve({ items: [] })
					}
				})
				
				return defRes;
			},
			
			'put': function(){
				return this.addItem( arguments );
			},		
			addItem: function(d, dontRefreshSummary){
				var def = new Deferred(),
					item = lang.clone(d),
					self = this
				var date = isValidDate(item.date) ? 
					locale.format(item.date, {
						"selector":"date", 
						"datePattern":"yyyy-MM-dd"
					}) : item.date
				
				item.date = date
				
				var db = self.moneyDb.db;
				var trans = db.transaction([self.operationDb], "readwrite");
				var store = trans.objectStore(self.operationDb);
				//console.log('????',parseFloat( item.id ))
				var getReq = store.get( parseFloat( item.id ) )
				
				getReq.onsuccess = function( res ){
					var oldDate, foundItem =  res.target.result;
					
					if(foundItem)
						oldDate = foundItem.date
					//console.log('OLD DATE',oldDate, foundItem)
					//console.log( d.id, item.id, '!')
				
					try {
						var request = store.put( item );
					}catch(e){
						console.log(' error adding to IDB')
						setTimeout(function(){
							def.resolve('e')
						},10);
						return def;
					}
					request.onsuccess = lang.hitch(self, function(e) {
						def.resolve('ok')
						console.log("saved..")
						if( !dontRefreshSummary)
						require(['dijit/registry'], function(registry){
							if( registry.byId('summary-list') )
								registry.byId('summary-list').onUpdate(
									d, oldDate
								)
						})
						
					});
						
					request.onerror = function(e) {
						def.resolve('e')
						console.log("Error Adding: ", e);
					};
				}
				
				return def
			},
			
			'remove': function(){
				return this.deleteItem( arguments )
			},
			/*
			 * Delete object with id = id from db :-)
			 */ 
			deleteItem: function(id) {
				var def = new Deferred()
				// Это неспроста. По-моему если передать строку - 
				// будет печаль.
				id = parseFloat(id)
				
				var db = this.moneyDb.db;
					trans = db.transaction(this.operationDb, 'readwrite');
					store = trans.objectStore(this.operationDb);
					request = store["delete"](id);

					request.onsuccess = function(e) {
						def.resolve('ok')
						console.log('RESOLVED DELETE')
					};

					request.onerror = function(e) {
						def.resolve('e')
					};
				return def				
			},
			
			/*
			 * Open DB. if version is newer, than version of DB, update db schema
			 * scope.callback will be executed on array of all DB objects
			 */
			open: function(){
				var callback = callback || null,
					scope = scope || this,
					request = window.indexedDB.open(this.dbName, this.dbVersion),
					self = this,
					defRes = new Deferred;
				
				request.onerror = function(e) {
					console.log(e);
				}
				
				request.onsuccess = function(e) {
					// Old api: var v = "2-beta";
					self.moneyDb.db = e.target.result;
					var db = self.moneyDb.db;
					if (db.setVersion) {
						console.log("in old setVersion: "+ db.setVersion);
						if (db.version != dbVersion) {
							var req = db.setVersion( self.dbVersion );
							req.onsuccess = lang.hitch(self, function () {
								if(db.objectStoreNames.contains(self.operationDb)) {
									db.deleteObjectStore(self.operationDb);
								}
								var store = db.createObjectStore(self.operationDb, {keyPath: 'id', autoIncrement:false});
								
								var trans = req.result;
								trans.oncomplete = function(e) {
									defRes.resolve('ok');
								}
							});
						}
						else {
							defRes.resolve( 'ok' )
						}
					}else {
						defRes.resolve( 'ok' )
					}
				}
				
				request.onupgradeneeded = function(e) {
					console.log ("going to upgrade our DB!");
					
					self.moneyDb.db = e.target.result;
					var db = self.moneyDb.db;
					if( db.objectStoreNames.contains(self.operationDb) ) {
						db.deleteObjectStore(self.operationDb);
					}
					var store = db.createObjectStore(self.operationDb,{keyPath: 'id',autoIncrement:false});
					store.createIndex("date", "date", { unique: false });
					store.createIndex("type", "type", { unique: false });
					store.createIndex("account", "account", { unique: false });
					store.createIndex("accountTo", "accountTo", { unique: false });
					store.createIndex("dateType", ["type", "date"], { unique: false });
					store.createIndex("accType", ["type", "account"], { unique: false });
					defRes.resolve( 'ok' )			
					//self.getAllItems();
				}
				request.onfailure = function(){
					self._onError;
					defRes.reolve( 'e' )
				}
				return defRes;
			}
		})
	})
