_ctx.setNavTarget('Vocabulary');
var firstLoad = true;

$(document).ready(function () {

    if (firstLoad) {

        loadConfigValues(function () {

            initalize();

            firstLoad = false;

            var header = $(".head").header({
                selectedValue: _ctx.NavTarget,
                navigationHandler: vocabNavHandler,
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
    }


    $("body").on("keypress", function (e) {
        if (e.keyCode === 13) { // enter key
            e.preventDefault();
        }
    });

});

var vocabNavHandler = function (target) { };

function initalize() {

    var editValueSet = function (valueSet) {

        $("#content").editValueSet({
            valueSet: valueSet,
            postProcess: showValueSetGrid
        });
    };

    var newValueSet = function () {

        $("#content").editValueSet({
            valueSet: '',
            postProcess: showValueSetGrid
        });
    };

    var showDetail = function (valueSet) {
        $("#content").empty();
        $("#content").valueSetDetail({
            valueSet: valueSet,
            returnClickHandler: showValueSetGrid
        });

    };

    var showValueSetGrid = function () {
        var url = APIRoot + "/adminapi/v1/resources/valuesets.json/?";

        var grid = $("#content").valueSetsGrid({
            url: url,
            onEdit: editValueSet,
            onNew: newValueSet,
            onDetail: showDetail,
            callback: function () { }
        });
    }

    showValueSetGrid();
}

function doDataMapping(response) {
    var data = $.map(response, function (item) {
        item.valueName = $('<div/>').html(item.valueName).text();
        return item;
    });

    return data;
}