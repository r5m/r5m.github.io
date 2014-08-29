define("money/dialog", [
	"dojo/_base/declare",
	"dojo/_base/window", "dojox/mobile/Heading",
	"dojo/on",
	"dojo/dom-construct",
	"dojo/dom-style",
	"dojox/mobile/SimpleDialog",
	"dojox/mobile/ProgressIndicator",
	"money/TouchableButton", "dojo/dom-attr","dojox/mobile/Heading"
], function(declare, win, Heading, on, domConstruct, domStyle, SimpleDialog, ProgressIndicator, Button, domAttr, Heading){
	return declare(null, {
		constructor: function(){
			var self = this
			this.dlg = new SimpleDialog();
			win.body().appendChild(this.dlg.domNode);
			
			var handler = on ( window, 'resize', function() {
				if(self.dlg)
					self.dlg.refresh();
				else handler.remove();
			})
			//create message box
			this.titleBox = new Heading({
				//id: 'dialogHeading'
			}, domConstruct.create('div',{}, this.dlg.domNode) );
			
			//create message box
			this.msgBox = domConstruct.create("div", {
				'class': "mblSimpleDialogText",
				innerHTML: ""
			}, this.dlg.domNode);
			
			//create progress indicator box
			this.piBox = domConstruct.create("div", {
				'class': "mblSimpleDialogText"
			},	this.dlg.domNode);
			
			//create ok/close button
			this.cancelBtn = new Button({
				'class' : "mblSimpleDialogButton mblRedButton",
				innerHTML : ""
			});
			
			this.closeBtn = new Button({
				'class' : "mblSimpleDialogButton mblBlueButton",
				innerHTML : ""
			});
			
			this.handler = on ( this.cancelBtn, 'click',
				function(e){ self.hide() }
			);
			
			on (this.closeBtn, 'click',
				function(e){ self.hide() }
			);
			
			this.cancelBtn.placeAt(this.dlg.domNode);
			this.closeBtn.placeAt(this.dlg.domNode);
			
		},
		show : function(isPi, msgText, titleText, closeText, onOk, undoText){
			
			var self = this
			
			if(isPi){
				this.piIns = ProgressIndicator.getInstance();
				this.piBox.appendChild(this.piIns.domNode);
			}
			
			console.log(this, closeText)
			this.dlg.hide();
			this.dlg.show();
			
			this.titleBox.set('label',titleText ? titleText : "R5M Finance")
			domAttr.set(this.msgBox,'innerHTML',msgText ? msgText : "")
			domAttr.set(this.cancelBtn.domNode,'innerHTML',closeText ? closeText : "")
			domAttr.set(this.closeBtn.domNode,'innerHTML',undoText ? undoText : "")
			domStyle.set(this.closeBtn.domNode,'display',undoText ? "" : "none")
			
			//if(onOk) {
				if(this.handler) 
					this.handler.remove();
				this.handler = on ( this.cancelBtn, 'click', function(){
					self.hide();
					if(onOk) onOk();
				});
			//}
			if(isPi)
				this.piIns.start();
			else if( this.piIns ){
				this.piIns.stop();
			}
			this.isPi = isPi
			
			this.dlg.refresh();			
		},
		hide : function(){
			if(this.isPi)
				this.piIns.stop();
			this.dlg.hide();
		}
	})
});
