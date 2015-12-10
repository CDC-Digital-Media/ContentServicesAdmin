_ctx.setNavTarget('Collections');

$(document).ready(function () {

	loadConfigValues(function () {

    	initalize();

        var header = $(".head").header({
            selectedValue: _ctx.NavTarget,
            navigationHandler: '',
            webFolder: getWebFolder(),
            callback: function () {
                if ($.isEmptyObject(_ctx.UserInfo)) {
                    document.location = "../Index.htm"
                }
                else {
                    header.setUser(_ctx.UserInfo);
                }
            }
        });

    });

});


function initalize() {

    _ctx.setMediaType("collection");

    $("#newCollection").click(function () {        
        document.location = urlRoot + "/Capture/Capture.htm";
    });

    var filter = $("#filterPanel").mediaFilter({
        searchHandler: search,
        mediaType: _ctx.MediaType,
        callback: function () {
        	// hide for collections
        	$('#url').hide();
        }
    });
}

function search(url) {
    $("#collectionList").collectionGrid({ url: url });
}


