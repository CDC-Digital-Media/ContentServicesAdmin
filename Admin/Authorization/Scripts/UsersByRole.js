"use strict"; //ignore jslint

(function ($) {
    var PLUGIN_NAME = 'byrole';

    // plugin signature ///////////////////////
    $[PLUGIN_NAME] = {
        defaults: {}
    };

    // main funtion //////////////////////////
    $.fn[PLUGIN_NAME] = function (options) {

        $[PLUGIN_NAME].defaults.target = this;
        options = $.extend({}, $[PLUGIN_NAME].defaults, options);

        var roleData = [];
        var userInfoUrl = '/adminapi/v1/resources/adminusers?max=0';

        main();

        function main() {

            console.log(urlRoot);
            var roleInfoUrl = '/adminapi/v1/resources/roles?max=0'
            var url = urlRoot + '/Secure.aspx/UsersByRole';
            console.log(roles);

            $.ajax({
                type: 'POST',
                contentType: 'application/json; charset=utf-8',
                url: url,
                dataType: 'json',
                data: '{"apiURL": "' + roleInfoUrl + '"}'
            }).success(function (response) {

                
                roleData = JSON.parse(response.d).results;
                var html = [];

                roleData.forEach(function (item) {
                    html.push('<tr>');
                    html.push('<td class="role">' + item.name + '</td><td>' + item.mediaSet + '</td>');
                    html.push('<td>');
                    html.push('<div class="dropdown">');
                    html.push('		<button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu1" data-toggle="dropdown">');
                    html.push('			Assigned Users');
                    html.push('			<span class="caret"></span>');
                    html.push('		</button>');
                    html.push('		<ul class="dropdown-menu user-menu rolesList" role="menu" aria-labelledby="dropdownMenu1">');

                    if (item.members !== null) {
                        item.members.forEach(function (member) {
                            html.push('		<li>');
                            html.push(member.DisplayName + '  <a role="menuitem" class="pull-right btnRemove" tabindex="-1" href="#" style="display:none;"><span class="glyphicon glyphicon-remove-circle"></span></a>');
                            html.push('		</li>');
                        });
                    }
					html.push('		</ul>');
					html.push('</div>');
					html.push('</td>');
					html.push('<td><a class="btn btn-primary btn-xs btnAssignUser">Assign User</a><div class="utilWrap" style="display:none;"></div></td>');
					html.push('</tr>');
				});


                $("#rolesBody").html(html.join(''));

                setEvents();

            }).error(function (xhr, ajaxOptions, thrownError) {
                console.log(xhr.status);
                console.log(thrownError);
                console.log(xhr.responseText);
                $('#apiError').show();
            });

        }

        function insertNewUser(formDataString) {
            var userInfoUrl = '/adminapi/v1/resources/adminusers';
            var url = urlRoot + '/Secure.aspx/AddUser';
            var call = JSON.stringify({ "apiURL": userInfoUrl, "data": formDataString });
            console.log(call);

            $.ajax({
                type: 'POST',
                contentType: 'application/json; charset=utf-8',
                url: url,
                dataType: 'json',
                data: call
            }).success(function (response) {
                $('#authNewUserModal').modal('hide');
                var obj = $.parseJSON(response.d);
                if (obj.meta.status !== 200) {
                    if (obj.meta.message.length === 1) {
                        showMessage('fail', obj.meta.message[0].userMessage);
                        console.log(obj.meta.message[0].userMessage);
                        console.log(obj.meta.message[0].developerMessage);
                    }
                    else {
                        var messages = "<ul>";
                        $(obj.meta.message).each(function () {
                            messages = messages + "<li>" + $(this)[0].userMessage + "</li>";
                        });
                        messages = messages + "</ul>";
                        showMessage('fail', messages);
                        console.log(messages);
                    }
                }
                else {
                    showMessage('success', 'User Info Saved');
                }

            }).error(function (xhr, ajaxOptions, thrownError) {
                console.log(xhr.status);
                console.log(thrownError);
                console.log(xhr.responseText);
                $('#apiError').show();
            });
        }

		function getUserDropdown(sender) {

		    var url = urlRoot + '/Secure.aspx/AvailableUsersForRole';

			var btnAssignUser = $(sender);
			var roleName = btnAssignUser.parents("tr").find(".role").text();
			console.log(roleName);

			$.ajax({
				type: 'POST',
				contentType: 'application/json; charset=utf-8',
				url: url,
				dataType: 'json',
				data: '{"apiURL": "' + userInfoUrl + '"}'
			}).success(function (response) {
			    var role = $.grep(JSON.parse(response.d), function (item) {
			        return item.name === roleName;
			    });
			    if (role.length < 1) {
			        console.log("Could not find role " + roleName);
			        return;
			    }
			    role = role[0];

				var html = [];
				html.push('<div class="btn-group">');
				html.push('	<div class="ddlAssignUser">');
                //TODO:  Add back "Users List" or similar
				html.push(' <select class="form-control">');

				$.each(role.members, function (index, user) {
				    html.push('<option>' + user.DisplayName + '</option>');
				});

				html.push('  </select>');
				html.push('	</div>');
				html.push('</div>');
				html.push('<div class="btn-group">');
				html.push('	<div class="btn btn-primary" id="btnSave">Save</div>');
				html.push('</div>');
				html.push('<div class="btn-group">');
				html.push('	<div><a class="close closeUsers" title="Cancel Assigning a User">&times;</a></div>');
				html.push('</div>');

				btnAssignUser.parent().find('.utilWrap').show().html(html.join(''));

				$(options.target).find("#btnSave").click(function () {
				    assignUser(event.target);
				});

				$(options.target.selector + ' .utilWrap .closeUsers').on('click', function () {
					$(this).parents('.utilWrap').empty().hide();
				});

			}).error(function (xhr, ajaxOptions, thrownError) {
				console.log(xhr.status);
				console.log(thrownError);
				console.log(xhr.responseText);
				$('#apiError').show();
			});

		}

    

        function setEvents() {

            $(options.target.selector + " .btnAdd").click(function () {
                $('.modalHolder').load("Templates/newUser.htm", function (data) {
                    $('#authNewUserModal').modal();

                    $("#btnNewUserSave").click(function () {
                        var formData = [],
                            firstName = $('#authNewUserModal #userFname').val(),
                            lastName = $('#authNewUserModal #userLname').val(),
                            email = $('#authNewUserModal #userEmail').val(),
                            username = $('#authNewUserModal #userNetworkID').val();

                        formData.push('{ "userName" : "CDC|' + username + '"');
                        formData.push('"email" : "' + email + '"');
                        formData.push('"firstName" : "' + firstName + '"');
                        formData.push('"lastName" : "' + lastName + '" }');



                        var formDataString = formData.join(', ');
                        insertNewUser(formDataString);
                        $("#usersBody").byuser();
                    });
                });
            });


	        $(options.target.selector + ' .btnAssignUser').click(function (event) {
	    	    getUserDropdown(event.target);
	        });

            $('.rolesList li').hover(
                function () { $(this).find('.btnRemove').show() },
                function () { $(this).find('.btnRemove').hide() }
            );

            $('.btnRemove').click(function () {
                console.log($(this).parents("li")); //li
                var txt = $(this).parents("li").text(); //user name
                var userId = getParensText(txt);
                var roleToRemove = $(this).parents("tr").find("td.role").text();
                console.log(roleToRemove);

                console.log(userId);

                console.log(roleData);
                userRoles(userId, function (userObj) {
                    console.log(userObj);
                    var userRoles = []; //userObj.Roles;
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

            $(options.target.selector + '.btnRemove').click(function () {
                $(this).parents('li').fadeOut();
            });


        }

        function assignUser(sender) {
            var selectedRole = $(sender).parents("tr").find(".role").text();

            var name = $(sender).parents("td").find("select").children(":selected").text();
            var userName = userIdFromDisplayName(name);

            var result = $.grep(roleData, function (item) {
                return item.name === selectedRole;
            });
            if (result.length === 1) {
                var role = result[0];

                if (userName.startsWith("CDC\\")) {
                    userName = userName.substring(4);
                }

                console.log(userName);

                //var userRoles = $.grep(roleData, function (item) {
                //    return item !== selectedRole;
                //});
                //userRoles.push(selectedRole);
                //TODO:  don't call API if no changes

                addUserRole(userName, selectedRole, loadAuthData);

            }
        }
    };

})(jQuery);