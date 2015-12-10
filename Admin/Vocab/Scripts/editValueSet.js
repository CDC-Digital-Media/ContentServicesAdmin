(function ($) {
    var PLUGIN_NAME = 'editValueSet';

    // plugin signature ///////////////////////
    $[PLUGIN_NAME] = {
        defaults: {
            valueSet: '',
            postProcess: ''
        }
    };

    // main funtion //////////////////////////
    $.fn[PLUGIN_NAME] = function (options) {

        $[PLUGIN_NAME].defaults.target = this;
        options = $.extend({}, $[PLUGIN_NAME].defaults, options);

        function handlePostProcess() {
            var func = options.postProcess;
            if (typeof func === 'function') {
                func(false);
            }
        }

        var valueSet = null;

        main();

        function main() {

            $('.trail').empty();
            $('.trail').load("Templates/CookieCrumb.htm", function () {
                $('.trail').find('.crumb-valueSets').parent()
                    .html('<a href="#">Value Sets</a><span class="divider">&gt;</span>')
                    .click(function () { handlePostProcess(); });
                $('.trail').find('.crumb-valueSet').html('New/Edit Value Set Definition');
            });
            $(".trail").show();

            if (options.valueSet != '') {
                valueSet = options.valueSet;
            }

            $(options.target).empty();
            $(options.target).load("Templates/editValueSet.htm", function () {

                $("#badSave").hide();
                $("#goodSave").hide();

                setupValueForm();

                $('.trail').empty();
                $('.trail').load("Templates/CookieCrumb.htm", function () {
                    $('.trail').find('.crumb-valueSets').parent()
                        .html('<a href="#">Value Sets</a><span class="divider">&gt;</span>')
                        .click(function () { handlePostProcess(); });
                    $('.trail').find('.crumb-valueSet').html('New/Edit Value Set');
                });
            });

        }

        function setupValueForm() {

            if (options.valueSet !== '') {
                $(options.target).find("#valueSetName").val(htmlDecode(valueSet.name));
                $(options.target).find("#valueSetDesc").val(htmlDecode(valueSet.description));
                $(options.target).find("#active").prop('checked', valueSet.active);
                $(options.target).find("#orderable").prop('checked', valueSet.orderable);
                $(options.target).find("#defaultable").prop('checked', valueSet.defaultable);
                $(options.target).find("#relatable").prop('checked', valueSet.hierarchical);

                $(options.target).find("#valueSetHeader").text("Editing Value Set Defintion: " + htmlDecode(valueSet.name));

                languagePicker = $(options.target).find("#language").languagePicker({
                	defaultText: '',
                	selectedValue: valueSet.language
                });

            }
            else {
                $(options.target).find("#valueSetName").focus();

                $(options.target).find("#valueSetHeader").text("New Value Set Defintion");
            }

            

            $(options.target).find("#btnSave").click(function () {
                saveValueSet();
                return false;
            });
            $(options.target).find("#btnCancel").click(function () {
                handlePostProcess();
                return false;
            });
        }

        function saveValueSet() {
            validateForm();
        }

        function validateForm() {

            var name = $(options.target).find("#valueSetName").val();
            if (name === '') { alert('Name is a required field.'); $(options.target).find("#valueSetName").focus(); return false; }

            var desc = $(options.target).find("#valueSetDesc").val();
            if (desc === '') { alert('Description is a required field.'); $(options.target).find("#valueSetDesc").focus(); return false; }

            var active = $(options.target).find("#active").is(":checked");
            var orderable = $(options.target).find("#orderable").is(":checked");
            var defaultable = $(options.target).find("#defaultable").is(":checked");
            var relatable = $(options.target).find("#relatable").is(":checked");
            var language = $(options.target).find("#language option:selected").val();

            var o = {
                name: htmlEncode(name),
                language: language,
                description: htmlEncode(desc),
                displayOrdinal: "-1",
                isActive: String(active),
                isDefaultable: String(defaultable),
                isOrderable: String(orderable),
                isHierachical: String(relatable)
            };

            if (valueSet) {o.id = valueSet.id}

            //Check to see if it already exists
            var url = APIRoot + "/adminapi/v1/resources/valuesets.json/?";
            url += "&callback=?";
            $.ajax({
                url: url,
                dataType: 'jsonp'
            })
            .done(function (response) {


                // if name is unique
                var exists = false;
                $(response.results).each(function () {
                	if (valueSet && this.id != valueSet.id
						&& this.name.toLowerCase() == name.toLowerCase()
						&& this.languageCode.toLowerCase() == language.toLowerCase()
						) {
                        exists = true;
                    }
                });

                if (!exists) {
                    postValueSet(o);
                }
                else {
                    alert('This name is already in use. Value set names must be unique.');
                    $(options.target).find("#valueSetName").focus();
                    return false;
                }
            })
            .fail(function (xhr, ajaxOptions, thrownError) {
                console.log(xhr.status);
                console.log(xhr.responseText);
                console.log(thrownError);
                $("#apiError").show();
            });

        }

        var postValueSet = function (oValueSet) {
            var api = APIRoot.replace("http:", "https:");
            var url = api + '/adminapi/v1/resources/valuesets';
            url += valueSet ? '/' + valueSet.id : '';            

            var call = JSON.stringify({ "data": JSON.stringify(oValueSet), "apiURL": url });            

            console.log(call);

            $.ajax({
                type: "POST",
                url: urlRoot + (valueSet ? "/Secure.aspx/UpdateVocab" : "/Secure.aspx/SaveVocab"),
                data: call,
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function (response) {
                    //                    var obj = (typeof response.d) == 'string' ? eval('(' + response.d + ')') : response.d;
                    var obj = $.parseJSON(response.d);
                    if (obj.meta.status !== 200) {
                        if (obj.meta.message.length === 1) {
                            $("#badSave").append(obj.meta.message[0].userMessage).show();
                            console.log(obj.meta.message[0].userMessage);
                            console.log(obj.meta.message[0].developerMessage);
                        }
                        else {
                            var messages = "<ul>";
                            $(obj.meta.message).each(function () {
                                messages = messages + "<li>" + $(this)[0].userMessage + "</li>";
                            });
                            messages = messages + "</ul>";
                            $("#badSave").append(messages).show();
                            console.log(messages);
                        }
                    }
                    else {
                        $("#badSave").hide();
                        $("#goodSave").show();
                    }

                }
            }).fail(function (xhr, ajaxOptions, thrownError) {
                console.log(xhr.status);
                console.log(xhr.responseText);
                if (thrownError) {
                    console.log(thrownError.message);
                    console.log(thrownError.stack);
                }
                //console.log(thrownError);
                $("#apiError").show();
            });


        };

        var apiError = function (e) {
            console.debug("ERROR");
        };

    };


})(jQuery);






