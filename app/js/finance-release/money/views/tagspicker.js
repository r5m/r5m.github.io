require({cache:{
'url:money/views/tagspicker.html':"<div class=\"\" data-dojo-type=\"dojox/app/widgets/Container\" >\n\t<h1 data-dojo-type=\"dojox/mobile/Heading\" data-dojo-props=\"fixed:'top',label:'${nls.title}'\">\n\t\t\t<div data-dojo-type=\"dojox/mobile/ToolBarButton\" label=\"${nls.done}\" class=\"mblColorBlue\" style=\"width:45px;float:right;\" \n\t\t\t\tdata-dojo-props=\"onClick:function(){\n\t\t\t\t\twindow.AppData.objDet.tags(); \n\t\t\t\t\tvar t = window.AppData.isInitiallySmall ? 'details' : 'navigation+details'\n\t\t\t\t\twindow.dFinance.transitionToView(this.domNode,{\n\t\t\t\t\t\ttarget: t , transitionDir: -1,\n\t\t\t\t\t\tparams: {'edit' : true, doNotReload : true, 'id': window.AppData.tagsPickerOverlay.params.id}\n\t\t\t\t\t})\n\t\t\t\t}\"\t\n\t\t\t></div>\n\t\t</h1>\n\t\t<div data-dojo-type=\"money/WheelScrollableView\">\n\t\t<div data-dojo-type=\"dojox/mobile/Heading\" data-dojo-props=\"fixed:'top'\" style=\"height:auto\">\n\t\t\t<div style=\"padding: 5px 20px;\">\n\t\t\t\t<div class=\"view-help\">${nls.viewHelp}</div>\n\t\t\t\t<input type=\"text\" data-dojo-type=\"dojox/mobile/TextBox\" id=\"newTags\" \n\t\t\t\t\tdata-dojo-props=\"placeHolder:'${nls.inputHelp}'\"/>\n\t\t\t</div>\n\t\t</div>\n\t\t<div style=\"padding: 0 10px 10px 10px\">\n\t\t\t<div id=\"tagsPicker\" \n\t\t\t\tdata-dojo-type=\"dojox/mobile/RoundRectStoreList\"\n\t\t\t\tdata-dojo-attach-point=\"tagsPicker\"\n\t\t\t\tdata-dojo-props=\"stateful:false,store: window.AppData.tagsStore, select:'multiple'\">\n\t\t\t</div>\n\t\t</div>\n\t</div>\n</div>\t\n"}});
define("money/views/tagspicker", ["dijit/registry","dojo/_base/array","dojo/query","dojo/sniff","dojo/dom-class",'dojo/text!money/views/tagspicker.html'],
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
