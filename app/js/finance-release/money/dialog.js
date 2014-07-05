define("money/dialog", [
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
