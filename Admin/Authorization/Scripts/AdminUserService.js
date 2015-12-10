function updateRoles(userName, roles, callback) {

    function handleCallback(user) {
        var func = callback;
        if (typeof func === 'function') { func(user); }
    }

    $().showSpinner();
    var data = { "userName": userName, "roles": roles };
    var userInfoUrl = APIRoot + "/adminapi/v1/resources/adminusers/"

    var call = JSON.stringify({ "data": JSON.stringify(data), "apiURL": userInfoUrl });
    console.log(call);

    $.ajax({
        type: "POST",
        url: urlRoot + "/Secure.aspx/SetRoles",
        data: call,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (response) {
            console.log(response);
            //var obj = $.parseJSON(response.d);
            handleCallback();
            $().hideSpinner();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.debug(xhr.status);
            console.debug(thrownError);
            console.debug(xhr.responseText);
            $().hideSpinner();
        }
    });

}

function addUserRole(userName, roleName, callback) {
    function handleCallback() {
        var func = callback;
        if (typeof func === 'function') { func(); }
    }

    userRoles(userName, addRole, roleName, callback);
}

function addRole(user, roleName, callback) {
    user.Roles.push(roleName);
    var userName = user.UserName;
    if (userName.startsWith("CDC\\")) {
        userName = userName.substring(4);
    }

    updateRoles(userName, user.Roles, callback);
}

function userRoles(userName, callback, roleName, callback2) {

    function handleCallback(user, role, callback2) {
        var func = callback;
        if (typeof func === 'function') { func(user, role, callback2); }
    }

    var userInfoUrl = "/adminapi/v1/resources/adminusers/" + userName;
    $().showSpinner();

    $.ajax({
        type: "POST",
        url: urlRoot + "/Secure.aspx/GetSingleUserInfo",
        data: "{'apiURL': '" + userInfoUrl + "'}",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (response) {
            var obj = $.parseJSON(response.d);
            console.log(obj.results[0]);
            handleCallback(obj.results[0], roleName, callback2);
            $().hideSpinner();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.debug(xhr.status);
            console.debug(thrownError);
            console.debug(xhr.responseText);
            $().hideSpinner();
        }
    });
}
