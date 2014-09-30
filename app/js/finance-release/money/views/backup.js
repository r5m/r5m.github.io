require({cache:{
'url:money/views/backup.html':"<div class=\"mblBackground\">\n    <div data-dojo-type=\"dojox/mobile/Heading\"\n        data-dojo-props=\"fixed: 'top'\">\n        <button data-dojo-type=\"dojox/mobile/ToolBarButton\"\n            data-dojo-attach-point=\"backButton\"\n            data-dojo-props=\"arrow: 'left', target: 'navigation', transitionDir: -1\"\n            class=\"left-button\">${nls.menu}</button>\n    </button>\n    ${nls.title} \n    </div>\n    <div data-dojo-type=\"money/WheelScrollableView\">\n\t\t<div id=\"online\">\n\t\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t\t${nls.title}\n\t\t\t\t</div>\n\t\t\t\t<div id=\"sync-login\" data-dojo-type=\"dojox/mobile/Pane\" data-dojo-props='shadow:true'>\n\t\t\t\t\t${nls.dropbox}\n\t\t\t\t\t<br/>\n\t\t\t\t\t<span id=\"dr-redir\">${nls.dropboxRedirect}</span>\n\t\t\t\t\t<span id=\"dropbox-sync-help\">${nls.dropboxStart}</span>\n\t\t\t\t\t<button data-dojo-type=\"money/TouchableButton\" class=\"mblBlueButton\"  id=\"backup-create\"\n\t\t\t\t\t\tdata-dojo-attach-point=\"syncBtn\"  style=\"padding: 0 10px; margin:0; margin-top:5px;\"\n\t\t\t\t\t\tdata-dojo-props='label:\"${nls.backupCreate}\"'>\n\t\t\t\t\t</button>\t\t\t\t\t\n\t\t\t\t\t<button \n\t\t\t\t\t\tdata-dojo-type=\"money/TouchableButton\"\n\t\t\t\t\t\tdata-dojo-props=\"label: '${nls.linkDropbox}'\"\n\t\t\t\t\t\tdata-dojo-attach-point=\"loginBtn\" class=\"mblBlueButton\" style=\"padding: 0 10px; margin:0; margin-top:5px;\"\n\t\t\t\t\t\t></button>\t\t\t\t\t\n\t\t\t\t</div>\n\t\t\t<div id=\"backup-download\">\t\t\t\n\t\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t\t${nls.onlineBackup}\n\t\t\t\t</div>\n\t\t\t\t<ul data-dojo-type=\"dojox/mobile/EdgeToEdgeList\">\n\t\t\t\t\t<!--<li data-dojo-type=\"dojox/mobile/ListItem\"  id=\"backup-restore\"\n\t\t\t\t\t\tdata-dojo-attach-point=\"restoreBtn\"\n\t\t\t\t\t\tdata-dojo-props='clickable:true, label:\"${nls.restore}\"'>\n\t\t\t\t\t</li>-->\n\t\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"\n\t\t\t\t\t\tdata-dojo-attach-point=\"logoutBtn\"\n\t\t\t\t\t\tdata-dojo-props='noArrow: true, clickable:true, label:\"${nls.unlinkDropbox}\"'>\n\t\t\t\t\t</li>\n\t\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"  id=\"backup-clear\"\n\t\t\t\t\t\tdata-dojo-attach-point=\"clearBtn\"\n\t\t\t\t\t\tdata-dojo-props='noArrow: true, clickable:true, label:\"${nls.clearRemote}\"'>\n\t\t\t\t\t</li>\n\t\t\t\t</ul>\n\t\t\t</div>\n\t\t\t<div data-dojo-type=\"dojox/mobile/EdgeToEdgeCategory\">\n\t\t\t\t\t${nls.factoryReset}\n\t\t\t</div>\n\t\t\t<ul data-dojo-type=\"dojox/mobile/EdgeToEdgeList\">\n\t\t\t\t<!--<li data-dojo-type=\"dojox/mobile/ListItem\"  id=\"backup-clear-trans\"\n\t\t\t\t\tdata-dojo-attach-point=\"clearTransBtn\"\n\t\t\t\t\tdata-dojo-props='clickable:true, label:\"${nls.clearTrans}\"'>\n\t\t\t\t</li>-->\n\t\t\t\t<li data-dojo-type=\"dojox/mobile/ListItem\"  id=\"backup-clear-all\"\n\t\t\t\t\tdata-dojo-attach-point=\"clearAllBtn\"\n\t\t\t\t\tdata-dojo-props='noArrow: true, clickable:true, label:\"${nls.clear}\"'>\n\t\t\t\t</li>\n\t\t\t</ul>\n\t\t</div>\n\t\t<div id=\"offline\">\n\t\t\t<div data-dojo-type=\"dojox/mobile/Pane\">\n\t\t\t\t${nls.internetRequired}\n\t\t\t</div>\n\t\t</div>\n    </div>\n</div>\n"}});
define("money/views/backup", [
	"dojo/json","dojo/on",'dojo/when',"dojo/dom-style","dojo/dom-class", 
	"dojo/DeferredList", "dojo/Deferred", "dijit/registry",
	"dojo/sniff","dojox/mobile/ProgressIndicator","dojo/_base/array",
	"money/TouchableButton", "dojo/date/locale","money/dialog",'dojo/text!money/views/backup.html'
 ],
    function(json, on, when, domStyle, domClass, DeferredList, Deferred, registry,has, ProgressIndicator, arrayUtil,Button, locale, Dialog){
    
	return window.AppData.objBackup = {
		//0 - sync, 1 - clear dropbox, 2 - restore from dropbox, 3 - clear transactions, 4 - clear all
		syncMode: {
			SYNC			 : 0,
			CLEAR_DROPBOX	 : 1,
			CLEAR_TRANSACIONS : 3,
			CLEAR_ALL		 : 4
		},
		
		beforeActivate: function(){			
			domStyle.set("online","display",navigator.onLine ? "" : "none")
			domStyle.set("offline","display",navigator.onLine ? "none" : "")
			
			if(this._onLineInt)
				clearInterval( this._onLineInt );
			
			this._onLineInt = setInterval(function(){
				domStyle.set("online","display",navigator.onLine ? "" : "none")
				domStyle.set("offline","display",navigator.onLine ? "none" : "")				
			},1000)
			
			//this.loginBtn.set('label',window.AppData.client.isAuthenticated() ? this.nls.unlinkDropbox : this.nls.linkDropbox)
			if( !window.AppData.client.isAuthenticated() ){
				domStyle.set('dropbox-sync-help',"display",'none');
				domStyle.set(this.loginBtn.domNode,"display",'block');
				domStyle.set(this.logoutBtn.domNode,"display",'none');
				domStyle.set(this.syncBtn.domNode,"display",'none');
				domStyle.set('dr-redir',"display",'block');
			}else {
				domStyle.set('dropbox-sync-help',"display",'block');
				domStyle.set(this.loginBtn.domNode,"display",'none');
				domStyle.set(this.logoutBtn.domNode,"display",'block');
				domStyle.set(this.syncBtn.domNode,"display",'block');
				domStyle.set('dr-redir',"display",'none');
			}
			domStyle.set('backup-download','display',window.AppData.client.isAuthenticated()? "" : "none")
        },
        
        init: function(){
			if(!has('isInitiallySmall'))
				domClass.add(this.backButton.domNode,'hideOnMedium hideOnLarge')
			var self = this
			
			//this.loginBtn = new Button;
			this.loginBtn.onClick = function(){
				if(!window.AppData.client.isAuthenticated()) {
					try{
						self.dlg.show(true, self.nls.pleaseWait, self.nls.signing , self.nls.cancel)
						//throw "";
						window.AppData.client.authenticate();
					}catch(e) {
						self.dlg.hide()
						self.dlg.show(false, self.nls.errorInState , self.nls.error, self.nls.restart, function(){
							location.reload();
						})
						
					}
				} 
			}
			
			this.logoutBtn.onClick = function(){
				try {
					window.AppData.client.signOut();
					localStorage.removeItem('dropboxEnabled')
					domStyle.set('backup-download','display', "none")
					domStyle.set('dropbox-sync-help',"display",'none');
					domStyle.set('dr-redir',"display",'block');
					domStyle.set(self.loginBtn.domNode,"display",'block');
					domStyle.set(self.logoutBtn.domNode,"display",'none');
					domStyle.set(self.syncBtn.domNode,"display",'none');
				}catch(e) {
					console.log( e )
				}
			}
			var self = this
			
			on(this.syncBtn,'click',function(){
				
				self.doSync( self.syncMode.SYNC )
			})
			on(this.clearBtn,'click',function(){
				self.dlg.show(false, 
					self.nls.sureToClear, self.nls.clearRemote , self.nls.yes, function(){
						self.doSync( self.syncMode.CLEAR_DROPBOX )
					}, self.nls.no );					
			})
			/*on(this.clearTransBtn,'click',function(){
				self.doSync(3)
			})*/
			on(this.clearAllBtn,'click',function(){
				self.dlg.show(false, 
					self.nls.sureToClearAll, self.nls.clearLocal , self.nls.yes, function(){
						self.doSync( self.syncMode.CLEAR_ALL )
					}, self.nls.no
				);
			})
			
			this.dlg = window.AppData.dialogWindow ? window.AppData.dialogWindow : (window.AppData.dialogWindow = new Dialog);
				
        },
        
        doSync: function(flag){
			var self = this, client = window.AppData.client;
			
			if( client.isAuthenticated() || flag == self.syncMode.CLEAR_ALL || flag == self.syncMode.CLEAR_TRANSACTIONS ){
				this.dlg.show(true, self.nls.processing, self.nls.syncing , self.nls.cancel)
				
				if( !this.datastore && ( flag != self.syncMode.CLEAR_ALL && flag != self.syncMode.CLEAR_TRANSACTIONS ) ){
					try{
						var datastoreManager = client.getDatastoreManager();
						
					}catch(e){
						self.dlg.hide();
						self.dlg.show( false, self.nls.errorCreatingDatastore, self.nls.backupRestoreTitle ,"Ok" )
						console.log(e)
					}
					datastoreManager.openDefaultDatastore(function (error, datastore) {
						if (error) {
							self.dlg.hide() ;
							self.dlg.show( false, self.nls.errorOpeningDatastore, self.nls.backupRestoreTitle ,"Ok" ) ;
							return ;
						}
						
						// Now you have a datastore. The next few examples can be included here.
						self.datastore = datastore
						var res = self._doSync( self.datastore, flag ) ;
						
						
						var callback = function(){
							if(self.error) return;
							
							self.dlg.hide();
							if( registry.byId('summary-list') ) {
								window.dFinance.children.dFinance_summary.summary = [];
								registry.byId('summary-list'). refresh();
							}
							self.dlg.show( false, self.nls.taskCompleted + (( flag == self.syncMode.CLEAR_ALL || flag == self.syncMode.CLEAR_TRANSACTIONS) ? "<br/>"+ self.nls.applicationWillBeRestarted:""), self.nls.backupRestoreTitle ,"Ok", function(){
								if( flag == self.syncMode.CLEAR_ALL || flag == self.syncMode.CLEAR_TRANSACTIONS )
									location.reload();								
							})
						};
						if(!!res) res.then( callback );
						else callback();
					});
				}else{
					var res = self._doSync(self.datastore ? self.datastore : null, flag)
					var callback = function(){
						if(self.error) return;
						
						self.dlg.hide();
						self.dlg.show(false,  self.nls.taskCompleted + (( flag == self.syncMode.CLEAR_ALL || flag == self.syncMode.CLEAR_TRANSACTIONS ) ? "<br/>"+ self.nls.applicationWillBeRestarted :""), self.nls.backupRestoreTitle  ,"Ok",function(){
							if(  flag == self.syncMode.CLEAR_ALL || flag == self.syncMode.CLEAR_TRANSACTIONS )
								location.reload()
						})
					}
					if(!!res) res.then( callback );
					else callback();
				}
				
			}
		},
		_doSync: function(datastore, flag){
			var self = this
			
			if(!datastore && flag != self.syncMode.CLEAR_ALL && flag != self.syncMode.CLEAR_TRANSACTIONS) {

				self.dlg.hide();
				self.dlg.show( false, self.nls.errorStrange, self.nls.backupRestoreTitle ,"Ok" )				
				this.error = true;
				return ;
			}
			this.error = false;
			var flag = flag || 0; //0 - sync, 1 - clear dropbox, 2 - restore from dropbox, 3 - clear transactions, 4 - clear all
			if( flag != self.syncMode.CLEAR_ALL && flag != self.syncMode.CLEAR_TRANSACTIONS ){
				
				var table = datastore.getTable('settings');
				var currency = table.query({id: 'hc'}).length ? table.query({id: 'hc'})[0].get('value') : false
				
				if(flag == 0){
					if(!currency) 
						table.insert({
							'id' : 'hc',
							'value' : window.AppData.currency
						})
					else if(currency != window.AppData.currency){
						this.dlg.hide();
						this.error = true;
						this.dlg.show(false, self.nls.currenciesDontMatch, "Backup & Restore", "Ok");
						return;
					}
					this.error = false;
				}
			}
				
			this._syncAccounts(datastore, flag);
			this._syncTags(datastore, flag);			
			return this._syncTransactions(datastore, flag);
			
			
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
						if(!localRecord) {
							localRecord = window.AppData.store.putAccount({
								id : record.get('id'),
								et : record.get('et'),
								startAmount: record.get('startAmount'),
								label: record.get('label'),
								currency: record.get('currency'),
								maincur: record.get('maincur')
							}) 
						}else if(record.get('et') < localRecord.et){
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
			var def = [];
			
			console.log('SYNCTRANSACTION ', flag)
			switch (flag)  {
				case 4 : ;
				case 3 :
					var delDeferred = new Deferred;
					var singleDeleteOperations = []
					window.AppData.store.query().then( function(data){
						for(var i=0; i< data.items.length; i++){
							var item = data.items[i];
							
							singleDeleteOperations.push( 
								window.AppData.store.remove(item.id, true) 
							);
						}
						
						new DeferredList( singleDeleteOperations ).then(
							function(){ delDeferred.resolve('ok') }
						);
					})
					
					localStorage.removeItem('deleted');
					localStorage.removeItem('currency');
					
					
					
					return delDeferred;
					
				case 1 : 
					var table = datastore.getTable('trans');
					var settingsTable = datastore.getTable('settings');
					arrayUtil.forEach(settingsTable.query(),function(item){
						item.deleteRecord()
					})
					
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
					
					/*
					 * 	Remove trash from v0.5 - 0.7.5.2
					 */ 
					var remoteDeleted = table4deleted.query()
					for(var i=0; i<remoteDeleted.length; i++){
						if(remoteDeleted[i].get('id') === 'true' && 
							table4deleted.query({id: remoteDeleted[i].get('id')}).length)
								table4deleted.query({id: remoteDeleted[i].get('id')})[0].deleteRecord();
					}
					
					
					var remoteDeleted = table4deleted.query()
					
					for(var i = 0; i<remoteDeleted.length; i++){
						var deferredDeleteOperation = new Deferred;
						(function( ddo, i ){
							window.AppData.store.get(remoteDeleted[i].get('id'))
								.then(function( item ) {
									if( item ) {
										window.AppData.store.remove(remoteDeleted[i].get('id'))
											.then( function(){ console.log('resolved del oper'); ddo.resolve('ok') } )
									} else {
										ddo.resolve('ok');
									}
								})
							}							
						)(deferredDeleteOperation, i);
						def.push( deferredDeleteOperation );
					}
					
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
						var singleRecord = results[i];
						var defPushChangesOperation = new Deferred;
						def.push( defPushChangesOperation );
						
						(function(record, defPushChangesOperation){
						var lrDef = window.AppData.store.get( record.get('id') )
						when(lrDef, function(localRecord){
							
							if(!localRecord){
								var lr = window.AppData.store.put({
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
								}, true, true)
								if(lr.def)
									lr.def.then( function(){ defPushChangesOperation.resolve('ok') });
								else defPushChangesOperation.resolve('ok');
							}else if(record.get('e') < localRecord.et){
							
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
								defPushChangesOperation.resolve('ok')
							}else if(record.get('e') < localRecord.et){
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
								var lrDef = window.AppData.store.put(localRecord, true, true).def
									.then( function(){
										defPushChangesOperation.resolve('ok')
									} )
								
							}else {
								defPushChangesOperation.resolve('ok')
							}
						
						
						})	
					})(singleRecord, defPushChangesOperation);
					}
					var queryDef = new Deferred;
					window.AppData.store.query().then( function(data){
						for(var i = 0; i<data.items.length; i++ ){
							var localRecord = data.items[i]
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
						queryDef.resolve('ok')
					})
					def.push(queryDef);
					console.log('done with trans');
					return new DeferredList( def );					
			}
			return false
		}
    };
});
