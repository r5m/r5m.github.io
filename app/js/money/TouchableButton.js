define([
	"dojo/_base/array", 
	"dojo/_base/declare",
	"dojo/_base/window",
	"dojo/_base/event",
	"dojo/sniff",
	"dojo/touch",
	"dojo/on",
	"dojo/dom",
	"dojo/dom-class",
	"dojox/mobile/Button"
	], function(array, declare,win, event, has, touch, on, dom, domClass, Button) {
    return declare("money.TouchableButton", Button, {
		
		duration: 0,
			
		postCreate: function(){
			var _this = this;
			on(this.domNode, 'mousedown', function(){
				if(!_this._isTouched)
					_this._isMouseClicked = true
			})
			this.on(touch.press, function(e){
				if(_this._isMouseClicked) return;
				_this._isTouched = true
						
				event.stop(e);
				if(_this.domNode.disabled){
					return;
				}
				_this._press(true);
				
				_this._moveh = on(win.doc, touch.move, function(e){
					event.stop(e);							
					var inside = false;
					for(var t = e.target; t; t = t.parentNode){
						if(t == _this.domNode){
							inside = true;
							break;
						}
					}
					_this._press(inside);
				});
				_this._endh = on(win.doc, touch.release, function(e){
					if(_this._pressed){
						setTimeout(function(){
							//alert('click called ' + e.target)
							on.emit(e.target, "click", { 
								bubbles: true, 
								cancelable: true, 
								_synthetic: true 
							});
							console.log('emitted')
								
						});
					}
					event.stop(e);
					_this._press(false);
					_this._moveh.remove();
					_this._endh.remove();
				});
			});
			//this.domNode.addEventListener("click", function(e){
				//if(_this._isTouched){
				//	e.stopImmediatePropagation();
				//	e.preventDefault();
				//}
			//}, true);
					
			dom.setSelectable(this.focusNode, false);
			this.connect(this.domNode, "onclick", "_onClick");
		},
				
		_press: function(pressed){
			if(pressed != this._pressed){
				this._pressed = pressed;
				var button = this.focusNode || this.domNode;
				var newStateClasses = (this.baseClass+' '+this["class"]).split(" ");
				newStateClasses = array.map(newStateClasses, function(c){ return c+"Selected"; });
				(pressed?domClass.add:domClass.remove)(button, newStateClasses);
			}
		}
    });
});
