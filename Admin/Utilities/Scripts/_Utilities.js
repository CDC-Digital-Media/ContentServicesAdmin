"use strict"; //ignore jslint
_ctx.setNavTarget("Utilities");

$(function () {
    loadConfigValues(function () {
        initialize();

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

function initialize() {

    loadThumbnailUtility();

}
