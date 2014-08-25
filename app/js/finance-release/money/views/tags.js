require({cache:{
'url:money/views/tags.html':"<div class=\"mblBackground\">\n    <div data-dojo-type=\"dojox/mobile/Heading\"\n        data-dojo-props=\"fixed: 'top'\">\n        <button data-dojo-type=\"dojox/mobile/ToolBarButton\"\n            data-dojo-attach-point=\"backButton\"\n            data-dojo-props=\"arrow: 'left', target: 'settings', transitionDir: -1, transitionOptions: { params: { id: window.AppData.currentDate }}\"\n            style=\"float:left\"\n            class=\"backButton\">${nls.settings}</button>\n\t\t</button>\n\t\t<button data-dojo-type=\"dojox/mobile/ToolBarButton\"\n            class=\"right-button mblRedButton\"\n            data-dojo-attach-point=\"addBtn\"><i class=\"fa fa-plus\"></i> ${nls.add}</button>\n\t\t${nls.title} \n    </div>\n    <div data-dojo-type=\"money/WheelScrollableView\">\n\t\t<div data-dojo-type=\"dojox/mobile/RoundRectCategory\">\n\t\t\t<span class=\"right-title\">${nls.quantity}</span>${nls.myTags}\n\t\t\t</div>\n\t\t\t<div data-dojo-type=\"dojox/mobile/RoundRect\" data-dojo-props=\"shadow:true\" id=\"no-tags-tags\">\n\t\t\t\t${nls.noTags} <br/>\n\t\t\t\t${nls.tap} <b>${nls.add}</b> ${nls.addFirst}.\n\t\t\t</div>\n\t\t\t<ul data-dojo-type=\"dojox/mobile/RoundRectList\"\n\t\t\t\tdata-dojo-attach-point = \"tagList\" id=\"tags-list\">\n\t\t\t</ul>\n\t</div>\n\t\n</div>\n"}});
define("money/views/tags", [
	"dojo/_base/declare","dojox/mobile/TextBox","dojo/_base/array", "dojox/mobile/ListItem",
	"dijit/registry","dojo/dom-attr","dojo/json", "dojo/dom-style",
	"dojox/mobile/Button", 'money/dialog','dojo/text!money/views/tags.html'
 ],
    function(declare,TextBox,arrayUtil, ListItem,   registry, domAttr,json, domStyle,Button,Dialog){
    
	return window.AppData.objTags = {
		beforeActivate: function(contact){
			//window.AppData.numberPicker.mode = "a"
        },
        afterActivate: function(){
			window.hideProgress()
		},
        init: function(){
			var self = this
			this.dlg = window.AppData.dialogWindow ? window.AppData.dialogWindow : (window.AppData.dialogWindow = new Dialog);
				
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
			var item = {label:'', et: new Date().getTime(), freq: 0}
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
				
				self.dlg.show(false, "", self.nls.deleteTag + '?', self.nls.yes, function(){
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
					window.AppData.store.removeTag(id)
					window.AppData.store._setTags(window.AppData.store.getTags())
					
					self.displayEmptyMsgs(window.AppData.store.getTags().length)
					//destroy account list item
					registry.byId('l'+id).destroyRecursive();
					var deleted = localStorage.getItem('deletedTags') ? json.parse(localStorage.getItem('deletedTags')) : new Array();
						deleted.push(id);
					localStorage.setItem('deletedTags',json.stringify(deleted));
				}, self.nls.no)
				//get account id from it's button's tag
				
				//remove all transactions at this account
				
				//remove account itself
				
				
			}
			this.tagList.addChild(new ListItem({
				label: '<div ontouchend="window.AppData.touched = true; delTagByMinus(event, this);"'+
				'onclick="if(!window.AppData.touched) delTagByMinus(event, this);" style="" class="domButton mblDomButtonBlueCircleMinus" data-finance-id="'+tag.id+'"><div><div><div></div></div></div></div>'+
					'<input type="text" id="a-'+ tag.id + '" value="' + tag.label +'"/>',
				//rightText: '<button id = "ab-'+account.id+'"></button>',
				'class':'button-at-right',
				rightText : tag.freq,
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
