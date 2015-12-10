"use strict";  //ignore jslint
(function ($) {
    var PLUGIN_NAME = "feedItem";

    // plugin signature ///////////////////////
    $[PLUGIN_NAME] =
    {
        media: '',
        defaults: {}
    };

    // main funtion //////////////////////////
    $.fn[PLUGIN_NAME] = function (options) {

        $[PLUGIN_NAME].defaults.target = this;
        options = $.extend({}, $[PLUGIN_NAME].defaults, options);

        var $target = options.target;
        var _categoryBlock;

        function handleSetPublished() {
            var func = options.onSetPublished;
            if (typeof func === 'function') {
                func();
            }
        }

        function main() {

            $(options.target).empty();
            $(options.target).load("Templates/FeedItem.htm", function () {

                setupEvents();

            });
        }

        function setupEvents() {

            $target.find("#publishDateTime").hide();

            $target.find("#publishDate").datepicker("setValue", new Date());
            $target.find('#timepicker1').timepicker({ defaultTime: formatAMPM(new Date()) });

            $target.find('input:radio[name="mediaStatus"]').change(function () {
                if ($(this).is(':checked') && $(this).val() == 'Published') {
                    $target.find("#publishDateTime").show();
                    handleSetPublished();
                    return false;
                }
                else {
                    $target.find("#publishDateTime").hide();
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

            // handle tabbing - bootstrap is eating tab event.
            $target.find("#publishDate").focus(function () {cleanupTimePicker();});
            $target.find("#timepicker1").focus(function () { cleanupDatePicker(); });

            $("body").on("keypress", function (e) {
                if (e.keyCode === 13) { // enter key
                    cleanupDatePicker();
                    cleanupTimePicker();
                    return false;
                }
            });

            _categoryBlock = $target.find(".topContainer").categoryBlock({
                //media: _media
            });

            $target.find("#category").valuePicker({ valueSetId: FeedCategoryValueSetId, defaultText: "Choose a Category" });
            $target.find("#subCategory").valuePicker({ valueSetId: FeedSubCategoryValueSetId, defaultText: "Choose a Subcategory" });
            

            
        }



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

        this.loadFromMedia = function (mediaId) {
            alert('loading from existing media');
        }

        main();

        return this;

    };

})(jQuery);