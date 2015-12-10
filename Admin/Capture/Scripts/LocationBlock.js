(function ($) {
    var PLUGIN_NAME = 'locationBlock';

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

            $(options.target).load("Templates/LocationBlock.htm", function () {

                if (id) {
                    //setup table of existing values.
                    if (!$.isEmptyObject(_media.geoTags)) {

                        $(_media.geoTags).each(function (idx, itm) {
                            var strRow = '';
                            var strLoc = '';

                            strLoc += itm.countryCode != null ? itm.countryCode : ''
                            strLoc += itm.admin1Code != null ? ', ' + itm.admin1Code : ''
                            strLoc += itm.name != null ? ', ' + itm.name : ''

                            strRow += '<tr location-data="' + itm.geoNameId + '">';
                            strRow += '<td>' + strLoc + '</td>';
                            strRow += '<td><a href="#" class="pull-right" title="Remove this location"><span class="glyphicon glyphicon-remove"></span></a></td>';
                            strRow += '</tr>';

                            $target.find('.selectedLocations > tbody').append(strRow);

                        });

                        $target.find('.selectedLocations tr .glyphicon-remove').unbind().click(function () {
                            $(this).parents('tr').remove();
                            toggleSelectedTableVisibility();
                            return false;
                        });


                    }
                }

                // setup location fields
                $target.find('.location').attr('disabled', 'disabled');
                var locs = $target.find('.location');

                // set defaults -
                getPlaces('', $(locs[0]), 6255149); //6295630 - root
                getPlaces(6255149, $(locs[1]), 6252001); //6255149 - North America
                getPlaces(6252001, $(locs[2])); //6252001 - USA                    

                $('.location').change(function () {
                    var placeID = $(this).find(':selected')[0].value,
                        $locFields = $target.find('.location'),
                        idx = $locFields.index($(this));

                    if (placeID) {
                        idx++;
                        if (idx < $locFields.length) {
                            getPlaces($(this).find(':selected')[0].value, $($('.location')[idx]));
                        }
                    }

                    $('.location:gt(' + (idx) + ')').each(function () {
                        $(this).attr('disabled', 'disabled').children('option:not(:first)').remove();
                    });

                    if (placeID === '6255149') { //North America
                        getPlaces(6255149, $(locs[1]), 6252001); //Select U.S. if North America
                        getPlaces(6252001, $(locs[2])); //6252001 - USA
                    }
                });

                toggleSelectedTableVisibility();
                setupEvents();

            });
        }

        function getPlaces(gId, o, selectedId) {

            getLocations(gId, function (err, data) {

                var locFields = $('.location'),
					idx = locFields.index(o),
					locRows = $('.location').parents('.control-group');

                if (data && data.length > 0) {
                    o.children('option:not(:first)').remove();

                    $.each(data, function (index, value) {
                        var option = $('<option value="' + value.geoNameId + '">' + value.name + '</option>');
                        if (value.geoNameId === selectedId) option.attr('selected', true);

                        o.append(option);
                    });
                    o.removeAttr('disabled').addClass('active');

                    locRows.show();

                } else {

                    $('.location').parents('.control-group:gt(' + --idx + ')').hide();
                }
            });
        }

        function getLocations(gId, next) {
            // /api/v2/resources/locations/

            //var url = '/locations/' + gId,
            //    params = {
            //        max: 0
            //    };

            var url = publicAPIRoot + "/v2/resources/locations/" + gId + "?max=0&callback=?";

            $.ajax({
                url: url,
                dataType: "jsonp"
            }).done(function (response) {
                return next(null, response.results);

            }).fail(function (xhr, ajaxOptions, thrownError) {
                return next(thrownError);
            });



        }

        function setupEvents() {
            $target.find("#addLocation").click(function () {
                addToSelected();
            });
        }

        function addToSelected() {
            var $locFields = $('.location');
            var strLocation = '';
            var strRow = '';
            var geoId = '';

            $locFields.each(function (itm, idx) {
                var $selected = $(this).find("option:selected");

                if ($selected.val() !== '') {
                    strLocation = strLocation == '' ? '' : strLocation += ", ";
                    strLocation += $selected.text() + " ";
                    geoId = $selected.val();
                }

            })

            // check to see if row exists.
            if ($target.find('[location-data="' + geoId + '"]').length > 0) {
                alert('Location has already been selected');
                return;
            }
            else {
                // add row
                strRow += '<tr location-data="' + geoId + '">';
                strRow += '<td>' + strLocation + '</td>';
                strRow += '<td><a href="#" class="pull-right" title="Remove this location"><span class="glyphicon glyphicon-remove"></span></a></td>';
                strRow += '</tr>';

                $target.find('.selectedLocations > tbody').append(strRow);
            }

            $target.find('.selectedLocations tr .glyphicon-remove').unbind().click(function () {
                $(this).parents('tr').remove();
                toggleSelectedTableVisibility();
                return false;
            });

            toggleSelectedTableVisibility();
        }

        function toggleSelectedTableVisibility() {
            if ($target.find('.selectedLocations tr').length > 0) {
                $target.find('.selectedLocations').show();
                $target.find('.currentLocations').show();
            }
            else {
                $target.find('.selectedLocations').hide();
                $target.find('.currentLocations').hide();
            }
        }

        function mapValuesToMedia() {
            var geoIds = [];
            $target.find('.selectedLocations tr').each(function (itm, idx) {
                var id = $(this).attr("location-data");

                geoIds.push({ geoNameId: id });
            });
            _media.geoTags = geoIds;
        }

        main();

        //"geoTags": [{ "geoNameId": 4197000}]

        this.hide = function () { $(options.target).hide(); },
        this.show = function () { $(options.target).show(); },

        this.validate = function (returnResult) {

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
