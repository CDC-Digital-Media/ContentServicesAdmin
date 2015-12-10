(function ($) {
    var PLUGIN_NAME = 'HtmlResources';

    // plugin signature ///////////////////////
    $[PLUGIN_NAME] =
    {
        defaults:
        {
            media: {},
            onContinue: "",
            templatePath: "",
            testOnly: false
        }
    };

    "use strict"; //ignore jslint

    $.fn[PLUGIN_NAME] = function (options) {

        $[PLUGIN_NAME].defaults.target = this;
        options = $.extend({}, $[PLUGIN_NAME].defaults, options);

        var $target = options.target;
        var newMedia = $.isEmptyObject(options.media.id);
        var id = newMedia ? null : options.media.id;
        var checkDuplicate = false;

        var _webValidationOutput;
        var _mobileValidationOutput;
        var _media;

        function handleContinue(oMedia) {
            var func = options.onContinue;
            if (typeof func === 'function') {
                func(oMedia);
            }
        }

        function main() {
            _media = options.media;

            loadMediaData();
        }

        function loadMediaData() {
            $target.empty();
            $target.load(options.templatePath + "Templates/HTMLResources.htm", function () {
                $target.find(".hide").hide().removeClass('hide');

                $target.find("#resetResources").hide();

                setupEvents();
            });
        }

        function setupEvents() {

            $target.find("#validateUrl").on("click", function () {
                runValidation(runTidyCheck_Preview);
            });

            $("body").off().on("keypress", function (e) {
                if (e.keyCode === 13) { // enter key
                    if ($target.find("#urlToValidate").is(":visible")) {
                        $target.find("#validateUrl").click();
                    }
                }
            });

            $('.container').on("keypress", function (e) {
                $('.alert-danger').fadeOut();
            });

            $target.find("#cancelButton").on("click", function () {
                setPrevalidateState();
                $target.find("#urlToValidate").val("");
            });

            $target.find("#previewWidth, #previewHeight").on("keypress", function (e) {
                if (e.keyCode === 13) { // enter key
                    checkSizes();
                }
            });

            $target.find("#previewWidth, #previewHeight").on("change", checkSizes);

            $target.find("#urlToValidate,#webCriteria,#mobileCriteria").keyup(function () {
                setPrevalidateState();
                if (_media.id) {
                    $target.find("#resetResources").show();
                }
            });

            $target.find("#webExtractionType,#mobileExtractionType").change(function () {
                setPrevalidateState();
            });

            $target.find("#continueButton").on("click", function () {
                handleContinue(_media);
            });

            if (_media.id) {
                var setupMediaData = function () {
                    $target.find("#urlToValidate").val(_media.sourceUrl);
                    setupExtractionPreferences();
                    setPrevalidateState();
                };

                setupMediaData();

                $target.find("#resetResources").show().click(function () {
                    setupMediaData();
                });

                runValidation(runTidyCheck_Preview);
            }
            else {
                $target.find("#resetResources").hide();
            }

        }


        function runValidation(postProcess) {

            var isValid = true;
            var $urlLabel = $target.find('#urlLabel');
            var $webCriteriaLabel = $target.find('#webCriteriaLabel');

            urlToValidate = $target.find("#urlToValidate").val().trim();
            webCriteria = $target.find("#webCriteria").val().trim();
            mobileCriteria = $target.find("#mobileCriteria").val().trim();

            clearError($urlLabel);
            clearError($webCriteriaLabel);

            // validate exists and format for url
            if (urlToValidate === '') {
                showError($urlLabel, 'You must enter a URL to validate.');
                isValid = false;
            }
            else if (!isValidUrlFormat(urlToValidate)) {
                showError($urlLabel, 'The test URL is not in a valid URL format.');
                isValid = false;
            }

            // validate exists for web criteria value
            if (webCriteria === '' && mobileCriteria === '') {
                showError($webCriteriaLabel, 'You must enter a value for either web or mobile extraction criteria.');
                isValid = false;
            }

            // url validation for html content
            if (isValid) {
                var url = [];
                if (urlToValidate !== '') { url.push({ "url": urlToValidate, "resourceType": "WebPage" }); } else urls.push({});

                var callback = function (isValid, msg) {
                    if (!isValid) {
                        showError($urlLabel, msg);
                    }
                    $target.find("#spinner").hideSpinner();
                    postProcess(isValid);
                };

                $target.find("#spinner").showSpinner();
                htmlUrlExists(urlToValidate, callback);
            }

        }

        var setPrevalidateState = function () {

            $target.find("#mobilePreviewTab, #webPreviewTab").parent().removeClass("active");
            $target.find("#testOutputTab").parent().addClass("active");
            $target.find(".webPreview, #mobilePreviewContainer").hide();
            $target.find(".alert-danger, .nav-tabs").hide();
            $target.find(".alert-success, #sidebar").hide();
            $target.find("#alreadyExists").hide();
            $target.find(".webTestOutput, .mobileTestOutput, .webPreview, .mobilePreview").empty();
            $target.find("#validateUrl").removeAttr("disabled");
            $target.find("#resetResources").hide();

            checkDuplicate = _media.id ? false : true;

        };

        function checkSizes() {
            var MIN_SIZE = 320,
            MAX_SIZE = 2048,
            desiredHeight = $target.find("#previewHeight").val(),
            desiredWidth = $target.find("#previewWidth").val();

            if (desiredHeight < MIN_SIZE || desiredHeight > MAX_SIZE || desiredWidth < MIN_SIZE || desiredWidth > MAX_SIZE) {
                $target.find("#invalidSize").show();
                return false;
            }

            if (desiredHeight >= MIN_SIZE && desiredHeight <= MAX_SIZE && desiredWidth >= MIN_SIZE && desiredHeight <= MAX_SIZE) {
                $target.find("#invalidSize").hide();
            }

            if (!$.isNumeric(desiredHeight) || !$.isNumeric(desiredWidth)) {
                $target.find("#invalidCharacter").show();
                return false;
            }
            if ($.isNumeric(desiredHeight) && $.isNumeric(desiredWidth)) {
                $target.find("#invalidCharacter").hide();
            }
            $target.find(".mobilePreview").height(desiredHeight);
            $target.find(".mobilePreview").width(desiredWidth);
        }

        var runTidyCheck_Preview = function (isValid) {

            if (!isValid) { return; }

            setupTestOutput();

            //fix xpath input - swap double quotes for single quotes. Fixing input because this is both the source for validation and for
            // storing criteria.
            $target.find("#mobileCriteria").val($target.find("#mobileCriteria").val().trim().replace(/"/g, '\''));
            $target.find("#webCriteria").val($target.find("#webCriteria").val().trim().replace(/"/g, '\''));

            $target.find("#spinner").showSpinner();
            $target.find(".alert-danger, .nav-tabs").hide();
            $target.find("#validationError").empty();
            $target.find(".alert-success").hide();
            $target.find('div.control-group.error').removeClass('error').addClass('success');

            if (id == null) {
                $target.find("#sidebar").hide();
            }

            $target.find(".webTestOutput, .mobileTestOutput, .webPreview, .mobilePreview").empty();
            $target.find("#validateUrl").attr("disabled", "disabled");
            var webExtractionType = $target.find("#webExtractionType").val();
            var mobileExtractionType = $target.find("#mobileExtractionType").val();

            var trueCount = 0;
            var testValidationOutput = function (isValid, isDuplicate) {
            	$("#continueButton, #cancelButton").show();
                // we run validation twice. this code should coallate the results.
                trueCount += isValid ? 1 : 0;
                if (trueCount > 0) {
                	$("#validationSuccess").show();
                	if (options.testOnly) { $("#validationSuccess").find(".btn").hide(); }
                	if (isDuplicate) {
                		$("#continueButton, #cancelButton").hide();
                	}
                }
                else {
                    $("#validationSuccess").hide();
                }
            };

            // validate web content
            _webValidationOutput = $target.find("#urlToValidate").validateUrl({
                outputContainer: $target.find(".webTestOutput"),
                contentContainer: $target.find(".webPreview"),
                titleContainer: $target.find("#title"),
                errorContainer: $target.find("#validationError"),
                messageHeader: "Web Syndication",
                extractionType: webExtractionType,
                extractionCriteria: webExtractionType !== "xpath" ? encodeURI($target.find("#webCriteria").val().trim().replace(/\s+/g, '')) : encodeURI($target.find("#webCriteria").val().trim()),
                mediaId: $.isEmptyObject(_media.id) || checkDuplicate ? "" : _media.id,
                postProcess: function (isValid, isDuplicate) {
                    if (!$.isEmptyObject(_media.id)) {
                        $target.find("#cancelButton").hide();
                        $target.find("#validateUrl").removeAttr("disabled");
                    }

                    testValidationOutput(isValid, isDuplicate);
                }
            });

            //validate mobile content
            _mobileValidationOutput = $target.find("#urlToValidate").validateUrl({
                outputContainer: $target.find(".mobileTestOutput"),
                contentContainer: $target.find(".mobilePreview"),
                errorContainer: $target.find("#validationError"),
                messageHeader: "Mobile Syndication",
                extractionType: mobileExtractionType,
                extractionCriteria: mobileExtractionType !== "xpath" ? encodeURI($target.find("#mobileCriteria").val().trim().replace(/\s+/g, '')) : encodeURI($target.find("#mobileCriteria").val().trim()),
                type: "mobile",
                mediaId: $.isEmptyObject(_media.id) || checkDuplicate ? "" : _media.id,
                postProcess: function (isValid) {
                    testValidationOutput(isValid);
                }
            });

            $target.find("#webPreviewTab").click(function () {
                $target.find("#testOutputTab, #mobilePreviewTab").parent().removeClass("active");
                $(this).parent().addClass("active");
                $target.find(".webTestOutput, .mobileTestOutput, #mobilePreviewContainer").hide();
                $target.find(".webPreview").show();
                return false;
            });

            $target.find("#mobilePreviewTab").click(function () {
                $target.find("#testOutputTab, #webPreviewTab").parent().removeClass("active");
                $(this).parent().addClass("active");
                $target.find(".webTestOutput, .mobileTestOutput, .webPreview").hide();
                //$target.find(".mobilePreview").resizable().show();
                $target.find("#mobilePreviewContainer").show();
                //checkSizes();
                return false;
            });

            $target.find("#testOutputTab").click(function () {
                setupTestOutput();
                return false;
            });

        };

        function setupTestOutput() {
            $target.find("#mobilePreviewTab, #webPreviewTab").parent().removeClass("active");
            $target.find("#testOutputTab").parent().addClass("active");
            $target.find(".webPreview, #mobilePreviewContainer").hide();
            $target.find(".webTestOutput, .mobileTestOutput").show();
            $target.find('#previewWidth').val('320');
            $target.find('#previewHeight').val('400');
        }

        function setupExtractionPreferences() {
            var includes, strType = "", strVal = "";

            if (_media && _media.preferences) {

                var webPref = $.grep(_media.preferences, function (item) {
                    return item.type == 'WebPage';
                })[0];

                includes = webPref.htmlPreferences.includedElements;
                if (includes !== null) {

                    var xPathVal = $('<div />').html(includes.xPath).text();
                    if (xPathVal !== '') {
                        strType = "xpath";
                        strVal = xPathVal;
                    }
                    if ($(includes.elementIds).length > 0) { strType = "elemids"; strVal = $(includes.elementIds).toArray().join(","); }
                    if ($(includes.classNames).length > 0) { strType = "clsids"; strVal = $(includes.classNames).toArray().join(","); }

                    $target.find("#webExtractionType").val(strType);
                    $target.find("#webCriteria").val(strVal);
                } else {
                    $target.find("#webExtractionType").val("clsids");
                    $target.find("#webCriteria").val("syndicate");
                }

                var mobilePref = $.grep(_media.preferences, function (item) {
                    return item.type == 'Mobile';
                })[0];

                if (mobilePref) {
                	includes = mobilePref.htmlPreferences.includedElements;
                	if (includes !== null) {
                		var xPathVal = $('<div />').html(includes.xPath).text();
                		if (xPathVal !== '') {
                			strType = "xpath";
                			strVal = xPathVal;
                		}
                		if ($(includes.elementIds).length > 0) { strType = "elemids"; strVal = $(includes.elementIds).toArray().join(","); }
                		if ($(includes.classNames).length > 0) { strType = "clsids"; strVal = $(includes.classNames).toArray().join(","); }

                		$target.find("#mobileExtractionType").val(strType);
                		$target.find("#mobileCriteria").val(strVal);
                	}
                	else {
                		$target.find("#webExtractionType").val("clsids");
                		$target.find("#webCriteria").val("msyndicate");
                	}
                }
            }
        }

        function mapValuesToMedia() {
            var sourceUrl = $target.find("#urlToValidate").val();
            var webExtractType = $target.find("#webExtractionType option:selected").val();
            var webCriteria = htmlEncode($target.find("#webCriteria").val());
            var mobileExtractType = $target.find("#mobileExtractionType option:selected").val();
            var mobileCriteria = htmlEncode($target.find("#mobileCriteria").val());

            var xPath = "", elementIds = "", classNames = "";

            switch (webExtractType) {
                case "clsids":
                    classNames = webCriteria;
                    break;
                case "elemids":
                    elementIds = webCriteria;
                    break;
                case "xpath":
                    xPath = webCriteria;
                    break;
            }

            var webPref = {
                "xPath": xPath !== "" ? xPath : null,
                "elementIds": elementIds !== "" ? elementIds.split(",") : null,
                "classNames": classNames !== "" ? classNames.split(",") : null
            };

            switch (mobileExtractType) {
                case "clsids":
                    classNames = mobileCriteria;
                    break;
                case "elemids":
                    elementIds = mobileCriteria;
                    break;
                case "xpath":
                    xPath = mobileCriteria;
                    break;
            }

            var mobilePref = {
                "xPath": xPath !== "" ? xPath : null,
                "elementIds": elementIds !== "" ? elementIds.split(",") : null,
                "classNames": classNames !== "" ? classNames.split(",") : null
            };


            var preferences = [{
                "type": "WebPage",
                "isDefault": true,
                "htmlPreferences": {
                    "includedElements": webPref,
                    "excludedElements": null,
                    "stripAnchor": null,
                    "stripComment": null,
                    "stripImage": null,
                    "stripScript": true,
                    "stripStyle": null,
                    "newWindow": null,
                    "imageAlign": null,
                    "outputEncoding": null,
                    "outputFormat": null,
                    "contentNamespace": null
                },
                "ecardPreferences": null
            },
            {
                "type": "Mobile",
                "isDefault": true,
                "htmlPreferences": {
                    "includedElements": mobilePref,
                    "excludedElements": null,
                    "stripAnchor": null,
                    "stripComment": null,
                    "stripImage": null,
                    "stripScript": true,
                    "stripStyle": null,
                    "newWindow": null,
                    "imageAlign": null,
                    "outputEncoding": null,
                    "outputFormat": null,
                    "contentNamespace": null
                },
                "ecardPreferences": null
            }];

            if (sourceUrl != _media.sourceUrl) {
                var wt = _webValidationOutput ? _webValidationOutput.validationResults().title : $target.find("#webCriteria").val();
                var mt = _mobileValidationOutput ? _mobileValidationOutput.validationResults().title : $target.find("#mobileCriteria").val();
                var t = wt || mt;
                _media.title = t;
            }

            _media.sourceUrl = $target.find("#urlToValidate").val();
            _media.targetUrl = $target.find("#urlToValidate").val();
            _media.preferences = preferences;

        }


        main();

    	this.updateControl = function (media) {
    		_media = media;
    		loadMediaData();
    	},

        this.hide = function () {
            $(options.target).hide();
        },
        this.show = function () {
            setPrevalidateState();
            $(options.target).show();
        },
        this.triggerValidation = function () {
            setPrevalidateState();
            runValidation(runTidyCheck_Preview);
        },

        this.validate = function (returnValidationResult) {
            runValidation(returnValidationResult)
        }


        this.updateMediaObj = function (media) {
            _media = media;
            if (_media.id) { checkDuplicate = false }
            mapValuesToMedia();
            return _media;
        };

        return this;

    };

})(jQuery); 