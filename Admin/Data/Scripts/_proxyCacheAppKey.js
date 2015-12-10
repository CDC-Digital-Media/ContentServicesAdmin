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

    $("#newProxyCacheAppKey").click(function () {
        _ctx.setSelectedMediaId('');
        document.location = urlRoot + "/Data/EditProxyCacheAppKey.htm";
    });

    var url = APIRoot + "/adminapi/v1/resources/dataappkey/?foo=bar";
    //url = "https://localhost:44301/adminapi/v1/resources/dataappkey/?foo=bar";

    $("#proxyCacheAppKeyList").proxyCacheAppKeyGrid({ url: url });
}

function toggleActiveProxyCacheAppKey(proxyCacheAppKeyId, setActive, refreshFunction) {
    $().showSpinner();
    //Get proxy cache app key
    var url = APIRoot + "/adminapi/v1/resources/dataappkey/" + proxyCacheAppKeyId;
    $.ajax({
        url: url,
        dataType: 'jsonp'
    }).done(function (response) {
        var results = response.results;
        if (!results || results.proxycacheappkeyid !== proxyCacheAppKeyId) {
            alert("Error deactivating item, could not find unique proxy cache app key item with this ID.");
            $().hideSpinner();
            return;
        }
        results.active = setActive;

        var apiUrl = APIRoot + "/adminapi/v1/resources/dataappkey/" + results.proxycacheappkeyid;
        var url = urlRoot + "/Secure.aspx/UpdateProxyCacheAppKey";
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
                    if (setActive) {
                        $("#goodSave").empty().append("Activation Successful").show();
                    }
                    else {
                        $("#goodSave").empty().append("Deactivation Successful").show();
                    }
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

function deleteProxyCacheAppKey(proxyCacheAppKeyId, refreshFunction) {
    $().showSpinner();
    var apiUrl = APIRoot + "/adminapi/v1/resources/dataappkey/" + proxyCacheAppKeyId;
    var url = urlRoot + "/Secure.aspx/DeleteProxyCacheAppKey";
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