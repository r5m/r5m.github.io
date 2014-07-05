//sorry for my English :-)

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
