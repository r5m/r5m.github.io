define("money/views/backup", [
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
