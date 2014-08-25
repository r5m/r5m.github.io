document.addEventListener('deviceready', function() {
					// device ready! initialize your app.
	require(["etc/appNls"],function(AppNls){
		AppNls() //load translations and then load app
		require(["money/Application",'dojo/hash'],function(Application,hash){
			window.AppData.App = new Application()
		})
	})

}, false);
			

