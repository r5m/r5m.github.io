define([
"dojo/_base/declare",
"dojo/_base/event",
"dojo/mouse",
"dojox/mobile/sniff",
"dojox/mobile/ScrollablePane"
], function(declare, event, mouse, has, ScrollableView){
    return declare("money.WheelScrollableView", ScrollableView, {
        init: function(params){
            this.inherited(arguments);
            //if(!has("touch")){
            this.connect(this.domNode, mouse.wheel, "_mouseWheel");
            this.addCover();

            this.removeCover();
            this.flashScrollBar();
            this.isFirstScroll = true
            window.t = this
            this._waitingInterval = setInterval(function(){
                self.isFirstScroll = true
            },2000)

        },
        _mouseWheel: function(e){
            event.stop(e); // prevent propagation
            if(this._waitingInterval)
                clearInterval(this._waitingInterval)

            var pos = this.getPos();
            var dim = this.getDim();
            var self = this;

            if(this.isFirstScroll)
                this.flashScrollBar();

            this.isFirstScroll = false

            this.showScrollBar();

            if(window.AppData.scrollBarTimeout)
                clearTimeout(window.AppData.scrollBarTimeout)

            window.AppData.scrollBarTimeout = setTimeout(function(){
                self.hideScrollBar()
                self.removeCover();
                self._waitingInterval = setInterval(function(){
                    self.isFirstScroll = true
                },2000)
            },1000)

            var deltaY = e.wheelDelta > 0 ? 150 : - 150;
            var newY = pos.y + deltaY;
            //console.log(newY)
            //console.log(dim)

            if (newY <= 0 && Math.abs(newY) <= dim.o.h){ // stop scrolling at the top/bottom
                this.slideTo({x: pos.x, y: newY});
            }
            else 
                if( (newY < 0 ) && ( Math.abs(newY) > dim.o.h ) && ( dim.d.h < dim.c.h) ) this.slideTo({x: pos.x, y: -dim.o.h})
            else 
                if (newY > 0) this.slideTo({x: pos.x, y: 0}) 

        }
    });
});
