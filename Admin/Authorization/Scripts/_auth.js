"use strict"; //ignore jslint
_ctx.setNavTarget("Auth");

$(function () {

    loadConfigValues(function () {
        var firstLoad = true;

        var header = $(".head").header({
            selectedValue: _ctx.NavTarget,
            navigationHandler: function (navTarget) {
                //_ctx.setSelectedMediaId("");
                authNavHandler();
            },
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

        if (firstLoad) {
            authNavHandler();
            firstLoad = false;
        }
    });

});

function authNavHandler() {

    //var view = getURLParameter("view");
    //switch (view) {
    //    case "roles":
    //        $("#content").empty().load("Templates/roles.htm", function () {
    //            $("#roles").users();
    //        });
    //        break;
    //    case "users":
    //        $("#content").empty().load("Templates/users.htm", function () {
    //            $("#usersBody").rolesByUser();
    //        });
    //        break;
    //    case "mediasets":

    //        break;

    //	case "auth":
    $("#content").empty().load("Templates/authmain.htm", loadAuthData);
    //		break;
    //} // end switch

}

function loadAuthData() {
    $("#roles").byrole();

    $("#usersBody").byuser();

    $("#mediasetBody").bymediasets();
}

function userIdFromDisplayName(displayName) {
    var paren = displayName.indexOf("(");
    if (paren > 1) {
        return displayName.substr(paren + 1, 4);
    }
    return displayName;
}

