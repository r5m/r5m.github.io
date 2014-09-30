define(["dojo/i18n!../money/nls/app.nls","dojo/_base/declare"], 
	function(nls, declare){
		return declare(null,{
			constructor: function(){
				console.log(nls)
				window.AppData.nls = nls
			}
		})     
})
