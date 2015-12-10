_ctx.setNavTarget('Data');

$(document).ready(function () {

    loadConfigValues(function () {
        initalize();

        $(".head").header({
            selectedValue: _ctx.NavTarget,
            navigationHandler: '',
            webFolder: getWebFolder()
        });

    });

});


function initalize() {

    $("#newProxyCache").click(function () {
        _ctx.setSelectedMediaId('');
        document.location = urlRoot + "/Data/EditProxyCache.htm";
    });

    var url = APIRoot + "/adminapi/v1/resources/data/?foo=bar";
    //url = "https://localhost:44301/adminapi/v1/resources/data/?foo=bar";

    $("#proxyCacheList").proxyCacheGrid({ url: url });
}

function expireProxyCache(proxyCacheId, refreshFunction) {
    $().showSpinner();
    //Get proxy cache
    var url = APIRoot + "/adminapi/v1/resources/data/" + proxyCacheId;
    $.ajax({
        url: url,
        dataType: 'jsonp'
    }).done(function (response) {
        var results = response.results;
        if (!results || results.id !== proxyCacheId) {
            alert("Error expiring item, could not find unique proxy cache item with this ID.");
            $().hideSpinner();
            return;
        }
        results.expirationDateTime = getCurrentExpireDate();

        var apiUrl = APIRoot + "/adminapi/v1/resources/data/" + results.id;
        var url = urlRoot + "/Secure.aspx/UpdateProxyCache";
        var call = JSON.stringify({ "data": JSON.stringify(results), "apiUrl": apiUrl });

        $.ajax({
            type: "POST",
            url: url,
            data: call,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            xhrFields: {
                withCredentials: true
            },
            success: function (response) {
                var obj = (typeof response.d) === 'string' ? eval('(' + response.d + ')') : response.d;
                if (obj.meta.status != 200) {
                    showErrorMessage(obj.meta.message);
                    $("#goodSave").hide();
                    $().hideSpinner();
                }
                else {
                    $("#goodSave").empty().append("Expiration Successful").show();
                    refreshFunction();
                }
            }
        });        
    }).fail(function (xhr, ajaxOptions, thrownError) {
        var response = $.parseJSON(xhr.responseText);
        var obj = (typeof response.d) === 'string' ? eval('(' + response.d + ')') : response.d;
        showErrorMessage(obj.meta.message);
        $("#goodSave").show();
        $().hideSpinner();
    });
}

function deleteProxyCache(proxyCacheId, refreshFunction) {
    $().showSpinner();
    var apiUrl = APIRoot + "/adminapi/v1/resources/data/" + proxyCacheId;
    var url = urlRoot + "/Secure.aspx/DeleteProxyCache";
    var call = JSON.stringify({ "data": "", "apiUrl": apiUrl });

    $.ajax({
        type: "POST",
        url: url,
        data: call,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        xhrFields: {
            withCredentials: true
        },
        success: function (response) {
            var obj = (typeof response.d) === 'string' ? eval('(' + response.d + ')') : response.d;
            if (obj.meta.status != 200) {
                showErrorMessage(obj.meta.message);
                $("#goodSave").hide();
                $().hideSpinner();
            }
            else {
                $("#goodSave").empty().append("Deletion Successful").show();
                refreshFunction();
            }
        }
    }).fail(function (xhr, ajaxOptions, thrownError) {
        var response = $.parseJSON(xhr.responseText);
        var obj = (typeof response.d) === 'string' ? eval('(' + response.d + ')') : response.d;
        showErrorMessage(obj.meta.message);
        $("#goodSave").hide();
        $().hideSpinner();
    });
}

function getCurrentExpireDate() {
    var d = new Date();
    var expireDay = (d.getUTCDate() < 10 ? '0' : '') + d.getUTCDate();
    var expireMonth = ((d.getUTCMonth() + 1) < 10 ? '0' : '') + (d.getUTCMonth() + 1);
    var expireYear = d.getUTCFullYear();
    var expireHours = (d.getUTCHours() < 10 ? '0' : '') + d.getUTCHours();
    var expireMinutes = (d.getUTCMinutes() < 10 ? '0' : '') + d.getUTCMinutes();
    var expireSecs = (d.getUTCSeconds() < 10 ? '0' : '') + d.getUTCSeconds();
    return expireYear + "-" + expireMonth + "-" + expireDay + "T" + expireHours + ":" + expireMinutes + ":" + expireSecs + "Z";
}

function showErrorMessage(oMsg) {
    if (oMsg.length > 0) {
        var messages = "<ul>";
        $(oMsg).each(function () {
            messages = messages + "<li>" + $(this)[0].userMessage + "</li>";
        });
        messages = messages + "</ul>";

        $("#badSave").empty().append(messages).show();
    }
}