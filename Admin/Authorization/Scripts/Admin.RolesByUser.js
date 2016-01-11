"use strict"; //ignore jslint

(function ($) {
    var PLUGIN_NAME = 'byuser';

    // plugin signature ///////////////////////
    $[PLUGIN_NAME] = {
        defaults: {}
    };

    // main funtion //////////////////////////
    $.fn[PLUGIN_NAME] = function (options) {

        $[PLUGIN_NAME].defaults.target = this;
        options = $.extend({}, $[PLUGIN_NAME].defaults, options);

        var users = [];

        main();

        function main() {

            var url = urlRoot + '/Secure.aspx/RolesByUser';
            console.log(url);
            var userInfoUrl = '/adminapi/v1/resources/adminusers?max=0';
            console.log(userInfoUrl);

            $.ajax({
                type: 'POST',
                contentType: 'application/json; charset=utf-8',
                url: url,
                dataType: 'json',
                data: '{"apiURL": "' + userInfoUrl + '"}'
            }).success(function (response) {

                console.log(response.d);
                users = JSON.parse(response.d);

                var html = [];

                users.forEach(function (item) {
                    html.push('<tr>');
                    html.push('<td class="name">' + item.name + ' <span class="username">(' + item.userName + ')</span>')
                    if (features.auth0) {
                        html.push('<span style="float: right" class="historyIcon glyphicon glyphicon-info-sign"></span>')
                        html.push('<div class="historyView col-md-6" style="display: none; float: right; border: 1px solid black; background-color: white;">')
                        html.push('<ul>')
                        html.push('<li>' + item.name + ' modified...</li>')
                        html.push('</ul>')
                        html.push('</div>')
                    }
                    html.push('</td>')
                    html.push('<td>' + item.mediaSet + '</td>');
                    html.push('<td>');

                    if (item.roles.length !== 0) {
                        html.push('<div class="dropdown">');
                        html.push('		<button class="btn btn-default dropdown-toggle" type="button" id="roleMenu1" data-toggle="dropdown">');
                        html.push('			Assigned Roles');
                        html.push('			<span class="caret"></span>');
                        html.push('		</button>');
                        html.push('		<ul class="dropdown-menu user-menu usersList" role="menu" aria-labelledby="roleMenu1">');
                        item.roles.forEach(function (role) {
                            html.push('		<li>');
                            html.push(role + '  <a role="menuitem" class="pull-right btnRemove" tabindex="-1" href="#" style="display:none;"><span class="glyphicon glyphicon-remove-circle"></span></a>');
                            html.push('		</li>');
                        });
                        html.push('		</ul>');
                        html.push('</div>');
                    } else {
                        html.push('<em>No roles assigned</em>');
                    }
                    html.push('</td>');
                    html.push('<td class="actions">');
                    html.push('	<a class="btn btn-primary btn-xs btnAddRole">Assign Role</a>');
                    html.push('	<a class="btn btn-xs btn-default btnClone"><i class="glyphicon glyphicon-transfer"></i> Clone Access</a>');
                    html.push('</td>');
                    html.push('</tr>');
                });

                $(options.target).html(html.join(''));

                loadEvents();

            }).error(function (xhr, ajaxOptions, thrownError) {
                console.log(xhr.status);
                console.log(thrownError);
                console.log(xhr.responseText);
                $('#apiError').show();
            });

        }

        function loadEvents() {
            
            $('.usersList li').hover(
				function () { $(this).find('.btnRemove').show() },
				function () { $(this).find('.btnRemove').hide() }
			);

            $('.btnAddRole').click(function (event) {
                buildRoleDropdown(event.target);
            });

            $(".historyIcon").click(function () {
                $(this).parents("td").find(".historyView").toggle();
            });

            $('.btnRemove').click(function () {
                var roleToRemove = $(this).parents("li").text().trim();
                console.log("*" + roleToRemove + "*");

                var userId = getParensText($(this).parents("tr").find("span.username").text());
                userId = userId.replace("CDC\\", "");
                console.log(userId);

                userRoles(userId, function (userObj) {
                    console.log(userObj);
                    var userRoles = [];
                    $.each(userObj.Roles, function (index, item) {
                        if (item !== roleToRemove) {
                            userRoles.push(item);
                        }
                    });

                    console.log(userRoles);
                    updateRoles(userId, userRoles);
                    loadAuthData();
                });

            });
        }

        function buildRoleDropdown(sender) {
            var html = [];

            html.push('<div class="btn-group">');
            html.push('<div class="ddlAddRole">');
            html.push('<select class="form-control">');

            var url = APIRoot + '/adminapi/v1/resources/roles';
            var btnAddRole = $(sender);

            $.ajax({
                contentType: 'application/json; charset=utf-8',
                url: url,
                dataType: 'json'
            }).success(function (response) {

                response.results.forEach(function (item) {
                    console.log(item.name);
                    html.push('<option>' + item.name + '</option>');
                });

                html.push('</select>');
                html.push('</div>');
                html.push('</div><!-- /btn-group -->');

                html.push('<div class="btn-group">');
                html.push('	<div class="btn btn-primary" id="btnSave">Save</div>');
                html.push('</div>');
                html.push('<div class="btn-group">');
                html.push('	<div><a class="close closeUsers" title="Cancel Assigning a User">&times;</a></div>');
                html.push('</div>');

                btnAddRole.parent().append(html.join(''));

                $("#btnSave").click(function () {
                    submitUserRoles($(this));
                });

            }).error(function (xhr, ajaxOptions, thrownError) {
                console.log(xhr.status);
                console.log(thrownError);
                console.log(xhr.responseText);
                $('#apiError').show();
            });


        }

        function submitUserRoles(sender) {

            var name = $(sender).parents("tr").find('.name').text();
            var paren = name.indexOf("(");
            if (paren > 1) {
                name = name.substr(0, paren - 1);
            }
            console.log(name);

            var result = $.grep(users, function (item) {
                return item.name === name;
            });
            if (result.length === 1) {
                var user = result[0];
                console.log(user);

                var userName = trimPrefix(user.userName, "CDC\\");

                console.log(userName);

                var selectedRole = $('.ddlAddRole :selected').text();
                console.log(selectedRole);

                var roles = $.grep(user.roles, function (item) {
                    return item !== selectedRole;
                });
                roles.push(selectedRole);
                //TODO:  don't call API if no changes

                updateRoles(userName, roles, loadAuthData);

            }
        }
    };

})(jQuery);