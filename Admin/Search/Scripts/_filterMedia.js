"use strict"; //ignore jslint

_ctx.setNavTarget("SyndicationAdmin");

$(function () {
    loadConfigValues(function () {

        initalize();
        var header = $(".head").header({
            selectedValue: _ctx.NavTarget,
            navigationHandler: captureNavHandler,
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

var captureNavHandler = function (target) { };

var mediaTypePicker;
var languagePicker;
var sourcePicker;

function initalize() {

    var filter = $("#filterPanel").mediaFilter({
        searchHandler: search
    });

}

function search(url) {

    var grid = $(".mediaGrid").mediaFilterGrid({
        url: url,
        callback: function () {
            $('#filterTopic').watermark('Topic');
            $('#filterTitle').watermark('Title');
        },
        collection: {
            id: _ctx.SelectedCollection.Id,
            aValues: _ctx.SelectedCollection.aValues
        },
        feed: {
            id: _ctx.SelectedFeed.Id        
        }
    });

    //Am I a collection management interface?
    if (_ctx.SelectedCollection.Id !== "") {
        $(".collectionAlert").show();
        $(".collectionName").text(htmlDecode(_ctx.SelectedCollection.Name))
            .css("text-decoration", "underline")
            .css("cursor", "pointer")
            .click(function () {
            var altLocation = urlRoot + "/Capture/Capture.htm?showChildItems=true";
            editMedia(_ctx.SelectedCollection.Id, 'collection', altLocation);
        });
        //grid.addCollectionManagementControls(_ctx.SelectedCollection.aValues);

        $(".collectionAlert .close").click(function () {
            _ctx.setSelectedCollection('', '', '');
            grid.refresh();
        });

    }
    else {
        $(".collectionAlert").hide();
    }


    //Am I a feed management interface?
    if (_ctx.SelectedFeed.Id !== "") {
        $(".feedAlert").show();
        $(".feedName").text(htmlDecode(_ctx.SelectedFeed.Name))
            .css("text-decoration", "underline")
            .css("cursor", "pointer")
            .click(function () {
            	var altLocation = urlRoot + "/Feeds/Feeds.htm?view=detail&id=" + _ctx.SelectedFeed.Id;
                editMedia(_ctx.SelectedFeed.Id, 'feed', altLocation);
            });
        //grid.addFeedManagementControls(_ctx.SelectedFeed.aValues);

        $(".feedAlert .close").click(function () {
            _ctx.setSelectedFeed('', '', '');
            grid.refresh();
        });

    }
    else {
        $(".feedAlert").hide();
    }

}
