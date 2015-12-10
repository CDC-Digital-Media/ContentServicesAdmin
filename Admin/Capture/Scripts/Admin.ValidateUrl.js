"use strict"; //ignore jslint
(function ($) {
    var PLUGIN_NAME = "validateUrl";

     // plugin signature ///////////////////////
    $[PLUGIN_NAME] =
    {
        defaults: {}
    };

     // main funtion //////////////////////////
    $.fn[PLUGIN_NAME] = function (options) {

        $[PLUGIN_NAME].defaults.target = this;
        $[PLUGIN_NAME].defaults.extractionType = "clsids";
        $[PLUGIN_NAME].defaults.extractionCriteria = "";
        $[PLUGIN_NAME].defaults.outputContainer = {};
        $[PLUGIN_NAME].defaults.contentContainer = {};
        $[PLUGIN_NAME].defaults.titleContainer = {};
        $[PLUGIN_NAME].defaults.errorContainer = {};
        $[PLUGIN_NAME].defaults.urlSelector = "#urlToValidate";
        $[PLUGIN_NAME].defaults.messageHeader = "";
        $[PLUGIN_NAME].defaults.postProcess = "";
        $[PLUGIN_NAME].defaults.type = "";
        $[PLUGIN_NAME].defaults.mediaId = "";
        options = $.extend({}, $[PLUGIN_NAME].defaults, options);

        function handlePostProcess(isValid, isDuplicate) {
            var func = options.postProcess;
            if (typeof func === 'function') {
                func(isValid, isDuplicate);
            }
        }

        var _validationResults = {};

        function main() {
            syndicationValidation();
        }

        var syndicationValidation = function(){

            var isValid = true;
            var isDuplicate = false;

            if(options.extractionCriteria === ""){
                var messageList = "<div>" + options.messageHeader + "</div><ul>";
                messageList += "<li>No extraction criteria was passed for " + options.messageHeader + ".</li>";
                messageList += "</ul>";

                options.outputContainer.append(messageList);
                options.outputContainer.show();
                $("#mobilePreviewTab").hide();

                handlePostProcess(false);

                return;
            }
            else{
                $("#mobilePreviewTab").show();
            }

            //type=mobile 

            var url = APIRoot + "/adminapi/v1/resources/validations/?url=" + $(options.urlSelector).val() + "&" + options.extractionType + "=" + options.extractionCriteria;

            if(options.type !== ""){
                url += "&type=" + options.type;
            }

            var matchOn = "class names";
            switch (options.extractionType) {
            case "clsids":
                matchOn = "class names";
                break;
            case "elemids":
                matchOn = "element IDs";
                break;
            case "xpath":
                matchOn = "XPath";
                break;
            }
            $.ajax({
                url: url,
                dataType: 'jsonp'
            }).done(function (response) {
                var results = response.results[0];
                if (response.meta.status === 200) {

                    if (!results.validation.isValid) {
                        var messageList = "<ul><li>Validation Failed.</li>";
                        var messages = results.validation.messages;

                        if (messages.length > 1) {
                            messages.forEach(function (message) {
                                if (message !== "") {
                                    messageList = messageList + "<li>" + message + "</li>";
                                }
                            });
                            messageList = messageList + "</ul>";
                        }
                        else { messageList = messages[0]; }

                        badUrl(messageList);
                        isValid = false;
                    }
                    else {

                        var messageList = "<div>" + options.messageHeader + "</div>";

                        if (results.validation.isDuplicate && options.mediaId === "") {
                            messageList += "<div class='alert alert-danger' id='alreadyExists'>This url and extraction criteria already exist in the catalog.</div>";
                            isDuplicate = true;
                        }

                        if(results.validation.numberOfElements == 0){
                            messageList += "<div class='alert alert-danger' id='noSynd'>Syndication markup not found.</div>";
                            isValid = false;
                        }

                        messageList += "<ul>";                        


                        var messages = results.validation.messages;

                        //TODO:  Discuss moving to API / BLL
                        messages.unshift("***Begin messages and warnings from Tidy.NET***");
                        if (results.validation.isLoadable) messages.unshift("Retrieve page -- Success!");
                        messages.push("***End messages and warnings from Tidy.NET***");
                        messages.push("Checking for syndication markup...");
                        messages.push("Matching on " + matchOn + " '" + options.extractionCriteria + "'. Found " + results.validation.numberOfElements + " items.");

                        messages.forEach(function (message) {
                            if (message !== "") {
                                messageList = messageList + "<li>" + message + "</li>";
                            }
                        });
                        messageList = messageList + "</ul>";


                        if (results.validation.numberOfElements > 0) {
                            if (results.content !== "") {

                                _validationResults.title = results.title;

                                $(".nav-tabs").show();
                                options.outputContainer.append(messageList);
                                if ($("#testOutputTab").hasClass("active")) {
                                    options.outputContainer.show();
                                }
                                if (options.titleContainer.val && options.titleContainer.val() === '') {
                                    options.titleContainer.val(htmlDecode(results.title));
                                }
                            }
                        }
                        else {
                            if (!$(".alert-success").is(":visible")) $("#noSynd").show();
                            $(".nav-tabs").show();
                            options.outputContainer.append(messageList);
                            if ($("#testOutputTab").hasClass("active")) {
                                options.outputContainer.show();
                            }
                            if (options.contentContainer.text() !== "Preview not available due to validation errors.") options.contentContainer.append("Preview not available due to validation errors.");
                        }
                    }

                    //var decoded = htmlDecode(results.content);
                    if (options.contentContainer.text() !== "Preview not available due to validation errors.") options.contentContainer.html(results.content);

                    

                }
                else {
                    var error = response.meta.message[0].userMessage;
                    badUrl(error);
                    isValid = false;
                }

                $("#spinner").hideSpinner();
                handlePostProcess(isValid, isDuplicate);
                                                              

            }).fail(function (xhr, ajaxOptions, thrownError) {
                console.debug(ajaxOptions);
                console.debug(xhr.status);
                console.debug(thrownError);
                console.debug(xhr.responseText);
                $("#apiError").show();
                $("#spinner").hideSpinner();
                $("#validateUrl").removeAttr("disabled");
            });

        };

        function badUrl(error) {
            if (options.errorContainer.text() !== error) {
                options.errorContainer.append(error);
            }
            options.errorContainer.show();
            $("#urlLabel").show();
            $("#urlLabel").parent('div').addClass('error');
            $(".nav-tabs").hide();
            $("#spinner").hideSpinner();
            $("#validateUrl").removeAttr("disabled");
            options.outputContainer.hide();
            options.contentContainer.hide();
            if (options.contentContainer.text() !== "Preview not available.") options.contentContainer.append("Preview not available.");
        }  


        this.validationResults = function () {
            return _validationResults;
        };

        main();


        return this;

    };


})(jQuery);