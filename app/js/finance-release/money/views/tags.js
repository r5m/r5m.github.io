define("money/views/tags", [
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
