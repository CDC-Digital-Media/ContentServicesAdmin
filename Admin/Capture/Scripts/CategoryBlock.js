(function ($) {
    var PLUGIN_NAME = 'categoryBlock';

    // plugin signature ///////////////////////
    $[PLUGIN_NAME] =
    {
        defaults: {
            media: {}
        }
    };

    // main funtion //////////////////////////
    $.fn[PLUGIN_NAME] = function (options) {

        $[PLUGIN_NAME].defaults.target = this;
        options = $.extend({}, $[PLUGIN_NAME].defaults, options);

        var $target = options.target;
        var newMedia = $.isEmptyObject(options.media.id);
        var id = newMedia ? null : options.media.id;

        var _media;
        var _topicPicker;

        function main() {
            _media = options.media;
            loadMediaData();
        }

        function loadMediaData() {
            $(options.target).load("Templates/CategoryBlock.htm", function () {
                $target.find(".hide").hide().removeClass('hide');
                
                function setupPicker(language) {
                	_topicPicker = $target.find("#topicContainer").attributeTreePicker({
                		attributeDisplayName: getTopicTitle(),
                		dataUrl: APIRoot + "/adminapi/v1/resources/values?valueset=topics&max=0&sort=ValueName&language=" + language,
                		selectedValueData: _media.tags ? _media.tags.topic : [],
                		assignAtRoot: false,
                		termSelectHandler: clearAndFocusSearchBox,
						media: _media
                	});
                }

                $target.find("#catLanguagePicker").languagePicker();
                $target.find("#catLanguagePicker").change(function () {
                	setupPicker($(this).val())
                });

                setupPicker('english');

            });
        }

        var clearAndFocusSearchBox = function(oTerm){
        	var searchBox = $(options.target).find(".valueSearch");
        	if ($(searchBox).val() != "") { $(searchBox).val("").focus(); }
        }

        function mapValuesToMedia() {
            var topics = $("#topicContainer").data("values");

            if (!_media.tags) { _media.tags = {}; }
            if (!_media.tags.topic) { _media.tags.topic = []; }

            if (!$.isEmptyObject(topics)) {
                _media.tags.topic = []; // empty array.
                for (var i = 0; i < topics.length; i++) {
                    _media.tags.topic.push({ 'id': topics[i] });
                }
            }
            else {
                _media.tags.topic = [];
            }

        }

        function getTopicTitle() {
            var attrName = "";
            if (_media.status === 'Published') {
                attrName = '<span class="ttl_name">Topics</span> <span class="requiredStar">*</span>';
            }
            else {
            	attrName = '<span class="ttl_name">Topics</span>';
            }
            return attrName;
        }

        main();

        this.hide = function () { $(options.target).hide(); },
        this.show = function () { $(options.target).show(); },

        this.validate = function (returnResult) {
            var isValid = true;
            mapValuesToMedia();

            if (_media.status === 'Published') {
                if (_media.tags.topic.length === 0) {
                    showError($target.find('#topicContainerLabel'), 'At least one topic must be selected when Media Status is set to Published.');
                    isValid = false;
                }
            }

            returnResult(isValid);
        },

        this.updateControl = function (media) {
        	_topicPicker.updateHeader(getTopicTitle());
        	_media = media;
        	loadMediaData();
        },

        this.updateMediaObj = function (media) {
            _media = media;
            mapValuesToMedia();
            return _media;
        };

        return this;


    };

})(jQuery);