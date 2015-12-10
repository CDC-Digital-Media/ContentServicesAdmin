(function ($) {
    var PLUGIN_NAME = 'extAttributeBlock';

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

        function main() {

            _media = options.media;

            $target.load("Templates/ExtAttributeBlock.htm", function () {

                if (id) {
                    // _media.extendedAttributes[attName] = attValue;
                    for (var key in _media.extendedAttributes) {
                        var row = $target.find('.attrRow').last()

                        row.find('.txtAttName').val(key);
                        row.find('.txtAttName').attr('guid', $.guid++);

                        row.find('.txtAttValue').val(_media.extendedAttributes[key]);
                        row.find('.txtAttValue').attr('guid', $.guid++);

                        if ($target.find('.attrRow').length < count(_media.extendedAttributes)) {
                            createNewRow();
                        }

                    };
                }

                $target.find('.addAttribute').on('click', function () {

                    if ($target.find('.txtAttName').last().val() === '' && $target.find('.txtAttValue').last().val() === '') {
                        // empty row exists - don't add a new one.
                        alert('Please use existing empty row.')
                        return;
                    }

                    var row = createNewRow();
                    row.find('.txtAttName').focus();
                    setupDelete();

                });

                setupDelete();

            });
        }

        function createNewRow() {
            var row = $target.find('.attrRow').first().clone();
            row.find('.txtAttName').val('');
            row.find('.txtAttName').attr('guid', $.guid++);

            row.find('.txtAttValue').val('');
            row.find('.txtAttValue').attr('guid', $.guid++);

            row.insertAfter($target.find('.attrRow').last());

            return row;
        }

        var setupDelete = function () {

            $target.find('.removeAttribute').off().on('click', function () {
                $(this).parents('.attrRow').remove();

                setupDelete();
                return false;
            });

            if ($target.find('.attrRow').length === 1) {
                $target.find('.removeAttribute').hide();
            }
            else {
                $target.find('.removeAttribute').show();
            }

        }

        function count(obj) {
            var count = 0;
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    ++count;
                }
            }
            return count;
        }

        function mapValuesToMedia() {

            _media.extendedAttributes = {};

            $target.find('.attrRow').each(function () {
                var attName = $(this).find('.txtAttName').val();
                var attValue = $(this).find('.txtAttValue').val();

                if (attName !== '' && attValue !== '') {
                    _media.extendedAttributes[attName] = attValue;
                }
            });
        }

        main();

        this.hide = function () { $(options.target).hide(); },
        this.show = function () { $(options.target).show(); },

        this.validate = function (returnResult) {

            clearError($target.find('#extAttrLabel'));

            var isValid = true;
            mapValuesToMedia();

            $target.find('.attrRow').each(function () {
                var attName = $(this).find('.txtAttName').val();
                var attValue = $(this).find('.txtAttValue').val();
                if ((attName !== '' && attValue === '') || (attName === '' && attValue !== '')) {
                    showError($target.find('#extAttrLabel'), 'Each Extended Attribute must contain both a Name and Value.');
                    isValid = false;
                }
            });

            $('.txtAttName').each(function () {
                var $current = $(this);
                $('.txtAttName').each(function () {
                    if ($(this).val() == $current.val() && $(this).attr('guid') != $current.attr('guid')) {
                        showError($target.find('#extAttrLabel'), 'Attribute Names must be unique.');
                        $(this).focus()
                        isValid = false;
                    }
                });
            });

            returnResult(isValid);
        },

        this.updateMediaObj = function (media) {
            _media = media;
            mapValuesToMedia();
            return _media;
        };

        return this;


    };

})(jQuery);
