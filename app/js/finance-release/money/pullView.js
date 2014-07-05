 return declare("dojox.mobile.PullView", ScrollableView, {
    adjustDestination: function(to, pos, dim){
      var h = dom.byId("pull").offsetHeight;
      if(this.getPos().y >= h){
        this.slideTo({y:h}, 0.3, "ease-out");
        connect.publish("/dojox/mobile/onPulled", [this]);
        this.onPulled(this);
        return false;
      }
      return true;
    },


    scrollTo: function(/*Object*/to, /*Boolean?*/doNotMoveScrollBar, /*DomNode?*/node){
      this.inherited(arguments); // scrollable#scrollTo() will be called
      var h = dom.byId("pull").offsetHeight;
      connect.publish("/dojox/mobile/onPull", [this, to.y, h]);
      this.onPull(this, to.y, h);
    },

    onPull: function(/*Widget*/view, /*Number*/y, /*Number*/h){
    },

    onPulled: function(/*Widget*/view){
    }
  });
