(function ($) {
    var PLUGIN_NAME = 'generalBlock';

    // plugin signature ///////////////////////
    $[PLUGIN_NAME] =
    {
        defaults: {
            media: {},
            onSourceUrlEdit: '',
            onTargetUrlEdit: '',
            onSetPublished: '',
            embedCodeTemplate: ''
        }
    };

    // main funtion //////////////////////////
    $.fn[PLUGIN_NAME] = function (options) {

        $[PLUGIN_NAME].defaults.target = this;
        options = $.extend({}, $[PLUGIN_NAME].defaults, options);

        var $target = options.target;

        var _media;

        function handleSourceUrlEdit() {
            var func = options.onSourceUrlEdit;
            if (typeof func === 'function') {
                func();
            }
        }

        function handleTargetUrlEdit() {
            var func = options.onTargetUrlEdit;
            if (typeof func === 'function') {
                func();
            }
        }

        function handleSetPublished() {
            var func = options.onSetPublished;
            if (typeof func === 'function') {
                func();
            }
        }

        function main() {

            _media = options.media;

            $(options.target).load("Templates/GeneralBlock.htm", function () {
                $target.find(".hide").hide().removeClass('hide');

                if (_media.id) {
                    loadMediaData();
                }
                else {
                    $target.find("#embedCode").text("Embed code will be generated when media is saved.");
                    $target.find("#publishDate").datepicker("setValue", new Date());
                    $target.find('#timepicker1').timepicker({ defaultTime: formatAMPM(new Date()) });
                    $target.find("#language").languagePicker();
                    setDefaultDimensions();                    
                }

                setVisibilityForType();
                setupEvents();
                if (features.auth0) {
                    $target.find("#historyIcon").show()
                    .click(function () { $("#historyView").toggle(); });

                }
            });
        }

        function loadMediaData() {

        	if (!_media.id) {
        		$target.find("#mediaIdContainer").hide();
        	}
        	else {
        		$target.find("#mediaIdContainer").show();
        	}

            $target.find("#mediaId").text(_media.id);
            $target.find("#persistentURL").text(_media.persistentUrlToken);
            $target.find("#title").val(htmlDecode(_media.title));
            $target.find("#description").val(htmlDecode(_media.description));
            if (_media.eCard) {
                $target.find("#text").val(htmlDecode(_media.eCard.cardText));
            }

            if (features.auth0) {
                $target.find("#createdBy").text(_media.createdBy);
                var dc = new Date(_media.dateCreated);
                $target.find("#dateCreated").text(dc.toLocaleString());
                $target.find("#modifiedBy").text(_media.modifiedBy);
                var dm = new Date(_media.dateModified);
                $target.find("#dateModified").text(dm.toLocaleString());
            }

            if (_media.embedcode) {
                var escapeFix = _media.embedcode;
                escapeFix = escapeFix.split("\\\"").join("\"");
                escapeFix = escapeFix.split("\\r\\n").join("\r\n");
                $target.find("#embedCode").val(escapeFix);
            }

            $target.find("#url").text(_media.sourceUrl);
            $target.find("#targetUrl").val(_media.targetUrl);

            if (_media.targetUrl != _media.sourceUrl) {
                $target.find("#targetUrlResource").text(_media.targetUrl);
            }
           
            $target.find("#width").val(_media.width);
            $target.find("#height").val(_media.height);
            $target.find("#fileSize").val(_media.dataSize);
            $target.find("#pageCount").val(_media.pageCount);


            if (_media.status === "Published") {
                $("input[value=Published]").attr("checked", true);
                $("#publishDateTime").show();
            }
            if (_media.status === "Hidden") {
                $("input[value=Hidden]").attr("checked", true);
            }
            if (_media.status === "Archived") {
                $("input[value=Archived]").attr("checked", true);
            }
            if (_media.status === "Staged") {
                $("input[value=Staged]").attr("checked", true);
            }

            if (!$.isEmptyObject(_media.datePublished)) {
                var d = new Date(_media.datePublished);

                var currDate = d.getDate();
                var currMonth = d.getMonth();
                var currYear = d.getFullYear();

                var dateStr = currMonth + "/" + currDate + "/" + currYear;
                var timeStr = d.getHours + ":" + d.getMinutes;

                $("#publishDate").datepicker("setValue", d);
                $(".icon-calendar").parent()
                    .css("cursor", "pointer")
                    .click(function () { $("#publishDate").focus(); });
                $('#timepicker1').timepicker({ defaultTime: formatAMPM(d) });

            }
            else {
                $("#publishDate").datepicker("setValue", new Date());
                $('#timepicker1').timepicker({ defaultTime: formatAMPM(new Date()) });
            }

            $("#language").languagePicker({ selectedValue: _media.language });

        }

        function setVisibilityForType() {

            switch (_media.mediaType.toLowerCase()) {
                case 'html':

                    $target.find("#text").parents('.form-group').first().hide();
                    $target.find("#targetUrl").parents('.form-group').first().hide();
                    $target.find("#btnEditTargetUrl").parents('.form-group').first().hide();
                    $target.find("#width").parents('.form-group').first().hide();
                    $target.find("#fileSize").parents('.form-group').first().hide();
                    
                    break;

                case 'ecard':

                	$target.find("#mediaIdContainer").find('.col-md-4').last().hide();
                	$target.find("#persistentURL").parents('.col-md-4').last().hide();
                    $target.find("#btnEditUrl").parents('.form-group').first().hide();
                    $target.find("#targetUrl").parents('.form-group').first().hide();
                    $target.find("#embedCode").parents('.form-group').first().hide();
                    $target.find("#fileSize").parents('.form-group').first().hide();

                    break;

                case 'collection':

                	$target.find("#mediaIdContainer").find('.col-md-4').last().hide();
                	$target.find("#persistentURL").parents('.col-md-4').last().hide();
                    $target.find("#text").parents('.form-group').first().hide();
                    $target.find("#btnEditUrl").parents('.form-group').first().hide();
                    $target.find("#btnEditTargetUrl").parents('.form-group').first().hide();
                    $target.find("#width").parents('.form-group').first().hide();
                    $target.find("#embedCode").parents('.form-group').first().hide();
                    $target.find("#fileSize").parents('.form-group').first().hide();

                    break;

                case 'video':
                	$target.find("#mediaIdContainer").find('.col-md-4').last().hide();
                	$target.find("#persistentURL").parents('.col-md-4').last().hide();
                    $target.find("#text").parents('.form-group').first().hide();
                    $target.find("#targetUrl").parents('.form-group').first().hide();
                    $target.find("#btnEditTargetUrl").parents('.form-group').first().hide();
                    $target.find("#fileSize").parents('.form-group').first().hide();

                    break;

                case 'image':
                case 'infographic':
                case 'button':
                case 'badge':
                	$target.find("#mediaIdContainer").find('.col-md-4').last().hide();
                	$target.find("#persistentURL").parents('.col-md-4').last().hide();
                    $target.find("#text").parents('.form-group').first().hide();
                    $target.find("#targetUrl").parents('.form-group').first().hide();
                    $target.find("#fileSize").parents('.form-group').first().hide();

                    break;

                case 'pdf':
                	$target.find("#mediaIdContainer").find('.col-md-4').last().hide();
                	$target.find("#persistentURL").parents('.col-md-4').last().hide();
                    $target.find("#text").parents('.form-group').first().hide();
                    $target.find("#targetUrl").parents('.form-group').first().hide();
                    $target.find("#width").parents('.form-group').first().hide();

                    break;

                case 'widget':
                	$target.find("#mediaIdContainer").find('.col-md-4').last().hide();
                	$target.find("#persistentURL").parents('.col-md-4').last().hide();
                    $target.find("#btnEditUrl").parents('.form-group').first().hide();
                    $target.find("#btnEditTargetUrl").parents('.form-group').first().hide();
                    $target.find("#text").parents('.form-group').first().hide();
                    $target.find("#targetUrl").parents('.form-group').first().hide();
                    $target.find("#width").parents('.form-group').first().hide();
                    $target.find("#fileSize").parents('.form-group').first().hide();
                    $target.find("#embedCode").parents('.form-group').first().hide();
                    break;

                case 'feed':

                	$target.find("#mediaIdContainer").find('.col-md-4').last().hide();
                	$target.find("#persistentURL").parents('.col-md-4').last().hide();
                    $target.find("#btnEditUrl").parents('.form-group').first().hide();
                    $target.find("#btnEditTargetUrl").parents('.form-group').first().hide();
                    $target.find("#width").parents('.form-group').first().hide();
                    $target.find("#embedCode").parents('.form-group').first().hide();
                    $target.find("#fileSize").parents('.form-group').first().hide();

                    break;

                default:
                    break;
            }
        }

        function setPDFFileSizeValue() {
        	if($("#fileSize").is(":visible")){
        		CDC.Admin.Capture.getFileSize(_media.sourceUrl, function (kbSize) {
        			var size = formatFileSize(kbSize);
        			$target.find("#fileSize").val(size)
        			_media.dataSize = size;
        		});
        	}
        }

        function setPDFPageCountValue() {
        	if ($("#pageCount").is(":visible")) {
        		var url = "http://docs.google.com/gview?url=" + _media.sourceUrl + "&embedded=false";
        		CDC.Admin.Capture.getPageCount(url, function (pageCount) {
        			$target.find("#pageCount").val(pageCount)
        			_media.pageCount = pageCount;
        			updateEmbedCode();
        		});
        	}
        }

        function setDefaultDimensions() {

            var populateDimensions = function () {
                $target.find("#width").val(_media.width);
                $target.find("#height").val(_media.height);
            }

            switch (_media.mediaType.toLowerCase()) {
                case 'html':

                    break;

                case 'ecard':
                    _media.width = '580';
                    _media.height = '400';

                    break;

                case 'collection':
                    break;

            	case 'video':
            		_media.width = '560';
            		_media.height = '315';

            		break;
                case 'infographic':
                case 'button':
                case 'badge':
                case 'image':
                    var img = new Image();
                    img.onload = function () {
                        _media.width = this.width;
                        _media.height = this.height;
                        populateDimensions();
                    }
                    img.src = _media.sourceUrl;

                    break;
                default:
                    break;
            }

            populateDimensions();

        }
        

        function setupEvents() {

            $target.find("#title").keyup(function () {
                updateEmbedCode();
            });
            $target.find("#description").keyup(function () {
                updateEmbedCode();
            });

            $target.find('input:radio[name="mediaStatus"]').change(function () {
                if ($(this).is(':checked') && $(this).val() == 'Published') {
                    $target.find("#publishDateTime").show();
                    handleSetPublished();
                    return false;
                }
                else {
                    $("#publishDateTime").hide();
                    handleSetPublished();
                    return false;
                }
            });

            $target.find(".glyphicon-calendar").parent().click(function () {
                $target.find("#publishDate").focus();
            });

            $target.find(".glyphicon-time").parent().click(function () {
                $target.find("#timepicker1").focus();
            });

            $target.find("#url").click(function () {
                showPopUp(_media.sourceUrl);
            });

            $target.find("#btnEditUrl").click(function () {
                handleSourceUrlEdit();
            });


            $target.find("#btnEditTargetUrl").click(function () {
                handleTargetUrlEdit();
            });

            $("#webCriteria").keydown(function (event) {
                var $this = $(this);
                if (event.which == 36) { $this.css("paddingLeft", "0"); }
            });

            // handle tabbing - bootstrap is eating tab event.
            $target.find("#publishDate").focus(function () {
                cleanupTimePicker();
            });
            $target.find("#timepicker1").focus(function () {
                cleanupDatePicker();
            });


            $(".datepicker").find(".prev, .next, .day").css("cursor", "hand");

            $("body").on("keypress", function (e) {
                if (e.keyCode === 13) { // enter key
                    cleanupDatePicker();
                    cleanupTimePicker();
                    return false;
                }
            });

            $target.find("#width, #height").keyup(function () {
                updateEmbedCode();
            });

            $target.find("#btnDefaultSize").click(function () {
                setDefaultDimensions();
                $target.find("#width").val(_media.width);
                $target.find("#height").val(_media.height);
                updateEmbedCode();
            });            

        }


        function updateEmbedCode() {        	

        	if (!_media.id) { return; } // don't run because I don't yet have an embed code
        	if (!$target.find("#embedCode").is(":visible")) { return; } // don't run because I don't have an API generated emebd code

        	mapValuesToMedia();
        	_embedCode = processNewEmbedCodeFormat(_media);
        	$target.find("#embedCode").val(_embedCode);
        }

        function mapValuesToMedia() {
        	var title = replaceWordChars($target.find("#title").val());
        	var description = replaceWordChars($target.find("#description").val());
        	var text = replaceWordChars($target.find("#text").val());
            
        	if (_media.id && $target.find("#embedCode").is(":visible")) {        		
            	var embedCode = $target.find("#embedCode").val();
            }

            var status = $target.find("input[name=mediaStatus]:checked").val();
            var datePublished = $target.find("#publishDate").val();
            var publishTime = $target.find("#timepicker1").val();
            var language = $target.find("#language option:selected").text();
            var targetUrl = $target.find("#targetUrl").val();
            var width = $target.find("#width").val();
            var height = $target.find("#height").val();
            var fs = $target.find("#fileSize").val();

            if (isPubDateTimeValid()) {
                _media.datePublished = combineDateTime(datePublished, publishTime);
            }

            _media.title = title;
            _media.description = description;
            if (_media.eCard) {
                _media.eCard.cardText = text;
            }
            _media.width = width;
            _media.height = height;
            if (embedCode) {
            	_media.embedcode = embedCode;
            }
            _media.language = language;
            _media.status = status;
            _media.dataSize = fs;

            _media.pageCount = $target.find("#pageCount").val();

            // targetUrl - may be handled in resource validation page for specific media types.
            // if it's not visible and not populated, need to fill so media will validate.
            if ($target.find("#targetUrl").is(":visible")) {
                _media.targetUrl = targetUrl;
            } else if ($.isEmptyObject(_media.targetUrl)) {
                _media.targetUrl = _media.sourceUrl;
            }


        }

        main();

        this.hide = function () { $(options.target).hide(); },
        this.show = function () { $(options.target).show(); },

        this.updateFileSize = function () { setPDFFileSizeValue(); }
        this.updatePageCount = function () { setPDFPageCountValue(); }

        this.validate = function (returnGeneralValidationResult) {
            mapValuesToMedia();

            var isValid = true;

            // clear current errors before validating:
            clearError($target.find('#titleLabel'));
            clearError($target.find('#mediaStatusLabel'));
            clearError($target.find('#publishDateLabel'));
            clearError($target.find('#timePicker1Label'));
            clearError($target.find('#languageLabel'));
            clearError($target.find('#targetUrlLabel'));
            clearError($target.find('#embedCodeLabel'));
            clearError($target.find('#widthLabel'));
            clearError($target.find('#heightLabel'));
            clearError($target.find('#pageCountLabel'));
            

            // run regular validations
            if (!isTitleValid()) isValid = false;
            if (!isStatusValid()) isValid = false;
            if (!isLanguageValid()) isValid = false;
            if (!isPubDateTimeValid()) isValid = false;
            if (!isTargetUrlFormatValid()) isValid = false;            
            if (!isDimensionsValid()) isValid = false;
            if (!isPageCountValid()) isValid = false;

            if (isValid) {
                isTargetUrlResourceValid(returnGeneralValidationResult);
            }
            else {
                returnGeneralValidationResult(false);
            }

        },

        this.updateControl = function (media) {
        	_media = media;
            loadMediaData();
        },

        this.updateMediaObj = function (media) {
        	_media = media;
        	mapValuesToMedia();
        	updateEmbedCode();
            return _media;
        };

        ///////// validation types

        function isTitleValid() {
            var isValid = true;
            if ($.isEmptyObject(_media.title)) {
                showError($target.find('#titleLabel'), 'Title is a required field.');
                isValid = false;
            }
            if (_media.title.length > 250) {
                showError($target.find('#titleLabel'), 'Title must be less than 250 characters.');
                isValid = false;
            }
            return isValid;
        }

        function isStatusValid() {
            var isValid = true;
            if ($.isEmptyObject(_media.status)) {
                showError($target.find('#mediaStatusLabel'), 'Media Status is a required field.');
                isValid = false;
            }
            return isValid;
        }

        function isLanguageValid() {
            var isValid = true;
            if ($.isEmptyObject(_media.language)) {
                showError($target.find('#mediaStatusLabel'), 'Language is a required field.');
                isValid = false;
            }
            return isValid;
        }

        function isEmbedCodeValid() {
            if (!$target.find("#embedCode").is(":visible")) { return true; }
            var isValid = true;
            if ($.isEmptyObject(_media.embedCode)) {
                showError($target.find('#embedCodeLabel'), 'Embed Code is required for this media type.');
                isValid = false;
            }
            return isValid;
        }

        function isTargetUrlFormatValid() {
            // return true if this field is not visible.
            if (!$target.find("#targetUrl").is(":visible")) { return true; }
            var isValid = true;
            if (!$.isEmptyObject(_media.targetUrl)) {
                if (!isValidUrlFormat(_media.targetUrl)) {
                    showError($target.find('#targetUrlLabel'), 'Target URL is not in a valid URL format.');
                    isValid = false;
                }
            }
            return isValid;
        }

        function isTargetUrlResourceValid(resultCallback) {
            if (!$target.find("#targetUrl").is(":visible")) {
                resultCallback(true);
                return;
            }

            var callback = function (isValid) {
                if (!isValid) {
                    showError($target.find('#targetUrlLabel'), "A resource for the Target URL could not be found at '" + _media.targetUrl + "'");
                }
                resultCallback(isValid);
            };

            if (!$.isEmptyObject(_media.targetUrl)) {
                if (!isTargetUrlFormatValid()) { resultCallback(false); }

                var url = [];
                if (_media.targetUrl !== '') { url.push({ "url": _media.targetUrl, "resourceType": "WebPage" }); } else urls.push({});

                urlExists(url, callback);
            }
            else {
                resultCallback(true);
            }
        }

        function isPubDateTimeValid() {
            // only validate if status is 'published
            if (_media.status !== 'Published') { return true; }

            var isValid = true;
            var datePublished = $target.find("#publishDate").val();
            var timePublished = $target.find("#timepicker1").val();

            var dateLabel = $target.find('#publishDateLabel');
            var timeLabel = $target.find('#timePicker1Label');

            // using form fields for this validation because media property is a combination of date and time fields.
            if (!datePublished) {
                showError(dateLabel, 'Publish Date is a required field.');
                isValid = false;
            }

            if (!timePublished) {
                showError(timeLabel, 'Publish Time is a required field.');
                isValid = false;
            }

            if (datePublished && timePublished) {
                var dateStr = "";
                var timeStr = "";
                var dUtc;

                var time = timePublished.split(" ")[0];
                var hours = time.split(":")[0];
                var minutes = time.split(":")[1];

                // Calendar validation
                if (!isDate(datePublished, "/", 1, 0, 2)) {
                    showError(dateLabel, 'Date Published is a required field.');
                    isValid = false;
                }
                // end Calendar validation

                // time validation
                if (!hours || !minutes) {
                    showError(timeLabel, 'Time Published is a required field.');
                    isValid = false;
                }
                // end time validation
            }

            return isValid;
        }

        function isDimensionsValid() {
            if (!$target.find("#width").is(":visible")) { return true; }
            var isValid = true;
            var width = $target.find('#width').val();
            var height = $target.find('#height').val();

            var widthLabel = $target.find('#widthLabel');
            var heightLabel = $target.find('#heightLabel');

            // WIDTH
            if ($.isEmptyObject(width)) {
                showError(widthLabel, 'Width is a required field.');
                isValid = false;
            }
            else if (isNaN(width)) {
                showError(widthLabel, 'Width field must contain numbers only.');
                isValid = false;
            }

            // HEIGHT
            if ($.isEmptyObject(height)) {
                showError(heightLabel, 'Height is a required field.');
                isValid = false;
            }
            else if (isNaN(height)) {
                showError(heightLabel, 'Height field must contain numbers only.');
                isValid = false;
            }

            return isValid;
        }


        function isPageCountValid() {
        	if (!$target.find("#pageCount").is(":visible")) { return true; }
        	var isValid = true;
        	var pageCount = $target.find('#pageCount').val();

        	var pageCountLabel = $target.find('#pageCountLabel');
        	if (isNaN(pageCount)) {
        		showError(pageCountLabel, 'Page Count field must contain numbers only.');
        		isValid = false;
        	}
        	return isValid;
        }
        //////////////////////////


        function cleanupDatePicker() {
            if ($(".datepicker").is(":visible")) {
                // setting async call - directly chaining hide event to enter is failing.
                setTimeout(function () { $(".datepicker").hide(); $target.find("#publishDate").blur(); }, 100);
            }
        }

        function cleanupTimePicker() {
            if ($(".bootstrap-timepicker-widget").is(":visible")) {
                // setting async call - directly chaining hide event to enter is failing.
                setTimeout(function () {
                    $(".bootstrap-timepicker-widget").removeClass('open').addClass('closed');
                    $target.find("#timepicker1").blur();
                }, 100);
            }
        }



        return this;



    };

})(jQuery);