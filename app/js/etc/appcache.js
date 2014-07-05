var appCache = window.applicationCache;
var cachedFilesCount = 0
var CACHE_LATEST = 0;
var CACHE_UPDATE_READY = 1;
var CACHE_UPDATE_DOWNLOADING = 2;
window.CACHE_STATUS = CACHE_LATEST

function handleCacheEvent(e) {
	if(e.type=="progress"){
		if(window.CACHE_STATUS != CACHE_UPDATE_READY) {
			console.log(e, ++cachedFilesCount)
			window.CACHED_FILES = cachedFilesCount;
			window.CACHE_STATUS = CACHE_UPDATE_DOWNLOADING
		}
	}else {
		console.log(e)
		if(e.type == "updateready"){
		    setTimeout(function(){
				window.CACHE_STATUS = CACHE_UPDATE_READY;
			},250);
		}
		if(e.type == "noupdate"){
		    window.CACHE_STATUS = CACHE_LATEST;
		}
	}
}

function handleCacheError(e) {
	console.log('Error: Cache failed to update!',e);
};

// Fired after the first cache of the manifest.
appCache.addEventListener('cached', handleCacheEvent, false);

// Checking for an update. Always the first event fired in the sequence.
appCache.addEventListener('checking', handleCacheEvent, false);

// An update was found. The browser is fetching resources.
appCache.addEventListener('downloading', handleCacheEvent, false);

// The manifest returns 404 or 410, the download failed,
// or the manifest changed while the download was in progress.
appCache.addEventListener('error', handleCacheError, false);

// Fired after the first download of the manifest.
appCache.addEventListener('noupdate', handleCacheEvent, false);

// Fired if the manifest file returns a 404 or 410.
// This results in the application cache being deleted.
appCache.addEventListener('obsolete', handleCacheEvent, false);

// Fired for each resource listed in the manifest as it is being fetched.
appCache.addEventListener('progress', handleCacheEvent, false);

// Fired when the manifest resources have been newly redownloaded.
appCache.addEventListener('updateready', handleCacheEvent, false);

