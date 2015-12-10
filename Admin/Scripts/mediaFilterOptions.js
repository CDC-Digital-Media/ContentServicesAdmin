(function ($) {
    var PLUGIN_NAME = 'mediaFilter';

    // plugin signature ///////////////////////
    $[PLUGIN_NAME] =
    {
    	defaults: {
    		searchHandler: '',
    		mediaType: '',
    		callback: ''
        }
    };

    // main funtion //////////////////////////
    $.fn[PLUGIN_NAME] = function (options) {

        $[PLUGIN_NAME].defaults.target = this;
        options = $.extend({}, $[PLUGIN_NAME].defaults, options);

        var $target = options.target;


        function handleSearchCallback(url) {
            var func = options.searchHandler;
            if (typeof func === 'function') {
                func(url);
            }
        }

        var _data;
        var _html;
        var valueSetData, typeAheadArray = [], mapped = {};
        var mediaTypePicker;

        //main();

        // decode value names
        $(_data).map(function () {
            this.valueName = $('<div />').html(this.valueName).text();
        });

        var dataUrl = APIRoot + '/adminapi/v1/resources/values?valueset=topics&max=0&sort=ValueName&language=english';

        $.ajax({
            type: "POST",
            url: urlRoot + "/Secure.aspx/GetTopicList",
            data: "{'apiURL': '" + dataUrl + "'}",
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (response) {
                var obj = (typeof response.d) === 'string' ? eval('(' + response.d + ')') : response.d;
                _data = obj.results;
                _html = obj.html;
                main();

            },
            error: function (xhr, ajaxOptions, thrownError) {
                console.debug(xhr.status);
                console.debug(thrownError);
                console.debug(xhr.responseText);
            }
        });


        function main() {

        	valueSetData = doDataMapping(_data);

        	$.each(valueSetData, function (i, item) {
        		mapped[item.valueName] = item.valueId;
        		typeAheadArray.push(item.valueName);
        	});


            $(options.target).load(urlRoot + "/Templates/FilterCriteria.htm", function () {
                setupControls();
                search();

                if (typeof options.callback == 'function') {
                	options.callback();
                }
            });
            
        }

        function setupControls() {


            $target.find("#hideFilterLink").click(function () {
                var $filterSection = $target.find("#filterSection");
                var $searchBtns = $target.find('.searchFilterBtns');

                $filterSection.slideToggle(function () {
                    if ($filterSection.hasClass('filterClosed')) {
                        // change text add class
                        $target.find('#hideFilterLink span').html("Hide");
                        $filterSection.removeClass('filterClosed').addClass('filterOpen');
                        $searchBtns.find('.glyphicon').removeClass('glyphicon-chevron-down').addClass('glyphicon-chevron-up');                        
                    } else {
                        // change text and remove class
                        $target.find('#hideFilterLink span').html("Show");
                        $filterSection.removeClass('filterOpen').addClass('filterClosed');
                        $searchBtns.find('.glyphicon').removeClass('glyphicon-chevron-up').addClass('glyphicon-chevron-down');
                    }
                });
            });

            // load previously selected values
            $target.find('#filterMediaId').val(_ctx.Filter.MediaId);
            $target.find('#filterTitle').val(_ctx.Filter.Title);
            $target.find("#url").val(_ctx.Filter.Url);
            $target.find("#filterTopic").val(_ctx.Filter.Topic);
            $target.find("#filterTopic").attr('data-id', _ctx.Filter.TopicId)
            $target.find("#filterAudience").val(_ctx.Filter.Audience);
            $target.find("#filterPersistentUrlKey").val(_ctx.Filter.PersistentUrlKey);

            if (_ctx.Filter.StatusSearch !== '') {
                $target.find(":checkbox[value='staged']").attr("checked", _ctx.Filter.StatusSearch.indexOf("staged") > -1);
                $target.find(":checkbox[value='published']").attr("checked", _ctx.Filter.StatusSearch.indexOf("published") > -1);
                $target.find(":checkbox[value='archived']").attr("checked", _ctx.Filter.StatusSearch.indexOf("archived") > -1);
                $target.find(":checkbox[value='hidden']").attr("checked", _ctx.Filter.StatusSearch.indexOf("hidden") > -1);
            }

            if (options.mediaType) {

            	if (options.mediaType.toLowerCase().indexOf('feed') > -1) {
            		$target.find('#filterPersistentUrlKey').parent().hide();
            		mediaTypePicker = $target.find('#filterMediaType').mediaTypePicker({
            			selectedValue: _ctx.Filter.MediaType, postProcess: function () {
            				$target.find('#filterMediaType option').each(function () {
            					if ($(this).val().toLowerCase().indexOf('feed') === -1 && $(this).val() !== '') {
            						$(this).remove();
            					}
            				});
            			}
            		});
            	}
            	else {
            		$target.find('#filterMediaType').parent().hide();
            		$target.find('#url').hide();
            	}

            }
            else {
                mediaTypePicker = $target.find('#filterMediaType').mediaTypePicker({ selectedValue: _ctx.Filter.MediaType });
            }

            if (_ctx.Filter.FromDate && _ctx.Filter.FromDate !== '') {
                $target.find("#fromDate").datepicker("setValue", formatForDatePicker(_ctx.Filter.FromDate));
            }
            else {
                $target.find("#fromDate").datepicker();
            }

            if (_ctx.Filter.ToDate && _ctx.Filter.ToDate !== '') {
                $target.find("#toDate").datepicker("setValue", formatForDatePicker(_ctx.Filter.ToDate));
            }
            else {
                $target.find("#toDate").datepicker();
            }

            if (_ctx.Filter.DateType !== '') {
                $target.find("input:radio[name='dateType']").prop('checked', false);
                $target.find("input:radio[value='" + _ctx.Filter.DateType + "']").prop('checked', true);
            }

            languagePicker = $target.find("#filterLanguage").languagePicker({
                defaultText: "Show All",
                selectedValue: _ctx.Filter.Language
            });
            sourcePicker = $target.find("#filterSource").sourcePicker({
                selectedValue: _ctx.Filter.Source,
                defaultText: "Show All",
                owningOrgSelector: "#filterOwningOrganization",
                maintainingOrgSelector: "#filterMaintainingOrganization",
                selectedOwningOrg: _ctx.Filter.OwningOrganization,
                selectedMaintainingOrg: _ctx.Filter.MaintainingOrganization
            });

            $target.find('#clearFilter').click(ClearFilter);
            $target.find('#applyFilter').click(search);

            $target.find('.selectAllStatuses').click(function () {
                var $selectAllBox = $(this).find('a');
                var $statusBoxList = $target.find('.status-list input');

                if ($selectAllBox.hasClass('selectAll')) {
                    $statusBoxList.each(function () {
                        $statusBoxList.prop('checked', true);
                    });
                    $selectAllBox.html('Select None');
                    $selectAllBox.removeClass('selectAll').addClass('selectNone');
                } else {
                    $statusBoxList.each(function () {
                        $statusBoxList.prop('checked', false);
                    });
                    $selectAllBox.html('Select All');
                    $selectAllBox.removeClass('selectNone').addClass('selectAll');
                }
            });

            $target.find('.valueSearch').typeahead({
            	source: typeAheadArray,
            	allowFreeEntries: false,
                updater: function (term) {
                	var id = mapped[term];
                    var termTxt = $('<div/>').html(term).text();
                    $target.find('.valueSearch').val(termTxt);
                    $target.find('.valueSearch').attr('data-id', id);
                    return termTxt;
                }
            });


            // Placeholder shim
            $target.find('#filterTopic').watermark('Topic');
            $target.find('#filterTitle').watermark('Title');

            $(document).keydown(function (e) {
                if (e.which == 13) {
                    if ($target.find("#filterTopic").val() !== '' || $target.find("#filterTitle").val() !== '' || $target.find("#filterMediaType").val() !== '') {
                        search();
                    }
                }
            });


            if (_ctx.FilterLoaded) {
                $target.find('#hideFilterLink span').html("Hide");
                $target.find("#filterSection").removeClass('filterClosed').addClass('filterOpen').show();
            }
            
        }
      
        function addMediaIdParms(url, mediaId) {
            return url + mediaId + "?";
        }

        function addOtherParms(url) {
            var parms = [];
            var titleSearch = encodeURIComponent($target.find("#filterTitle").val());
            if (titleSearch && titleSearch !== "") {
            	parms.push("title=" + titleSearch);
            	_ctx.setFilterTitle($target.find('#filterTitle').val());
            } else {
            	_ctx.setFilterTitle("");
            }


            var mediaTypeSearch = encodeURIComponent($target.find("#filterMediaType").val());
            console.log("media type: " + mediaTypeSearch);
            if (mediaTypeSearch && mediaTypeSearch !== "" && mediaTypeSearch !== "null") {
            	parms.push("mediatype=" + mediaTypeSearch);
            	_ctx.setFilterMediaType($target.find('#filterMediaType').val());
            } else {
            	if (options.mediaType != '') {
            		parms.push("mediatype=" + encodeURIComponent(options.mediaType));
            	} else {
            		_ctx.setFilterMediaType("");
            	}
            }
            

            var langSearch = encodeURIComponent($target.find("#filterLanguage").val());
            if (langSearch && langSearch !== "Show All" && langSearch !== "null") {
            	parms.push("language=" + langSearch);
            	_ctx.setFilterLanguage($target.find('#filterLanguage').val());
            } else {
            	_ctx.setFilterLanguage("");
            }

            var urlSearch = encodeURIComponent($target.find("#url").val());
            if (urlSearch && urlSearch !== "") {
            	parms.push("urlcontains=" + urlSearch);
            	_ctx.setFilterUrl($target.find('#url').val());
            } else {
            	_ctx.setFilterUrl("");
            }

            var statusSearch = $target.find("input[name=status]:checked").map(function () { return this.value; }).get().join(",");
            if (statusSearch && statusSearch !== "") {
            	parms.push("status=" + statusSearch);
            	_ctx.setFilterStatusSearch(statusSearch);
            } else {
            	_ctx.setFilterStatusSearch("");
            }

            var persistentUrlSearch = encodeURIComponent($target.find("#filterPersistentUrlKey").val());
            if (persistentUrlSearch && persistentUrlSearch !== "") {
            	parms.push("persistenturl=" + persistentUrlSearch);
            	_ctx.setFilterPersistentUrlKey($target.find("#filterPersistentUrlKey").val());
            } else {
            	_ctx.setFilterPersistentUrlKey("");
            }

            var topicSearch = $target.find("#filterTopic").val();
            if (topicSearch && topicSearch !== "") {

            	var id = mapped[topicSearch];
            	if (id && id != '') {
            		parms.push("topicid=" + id);
            		_ctx.setFilterTopic(topicSearch, id);
            	} else {
            		$target.find("#filterTopic").val('');
            		_ctx.setFilterTopic('','');
            	}
            }
            else {
            	$target.find("#filterTopic").attr('data-id', '');
            }

            var audienceSearch = encodeURIComponent($target.find("#filterAudience").val());
            if (audienceSearch && audienceSearch !== "") {
            	parms.push("audience=" + audienceSearch);
            	_ctx.setFilterAudience($target.find('#filterAudience').val());
            } else {
            	_ctx.setFilterAudience('');
            }
            
            var sourceSearch = $target.find("#filterSource").val();
            if (sourceSearch && sourceSearch !== "Show All") {
            	parms.push("sourceName=" + encodeURIComponent(sourceSearch));
            	_ctx.setFilterSource($target.find("#filterSource").val());
            } else {
            	_ctx.setFilterSource('');
            }

            var mainOrgSearch = $target.find("#filterMaintainingOrganization").val();
            if (mainOrgSearch && mainOrgSearch !== "Select One") {
            	parms.push("maintainingorg=" + encodeURIComponent(mainOrgSearch));
            	_ctx.setFilterMaintainingOrganization($target.find('#filterMaintainingOrganization').val());
            } else {
            	_ctx.setFilterMaintainingOrganization('');
            }

            var ownOrgSearch = $target.find("#filterOwningOrganization").val();
            if (ownOrgSearch && ownOrgSearch !== "Select One") {
            	parms.push("owningorg=" + encodeURIComponent(ownOrgSearch));
            	_ctx.setFilterOwningOrganization($target.find('#filterOwningOrganization').val());
            } else {
            	_ctx.setFilterOwningOrganization('');
            }

            var from = $target.find("#fromDate").val();
            var to = $target.find("#toDate").val();
            var dateType = $target.find("input[name=dateType]:checked").val();

            if (dateType === "publishDate") {
                if (from && from !== "") { parms.push("fromdatepublished=" + from); }
                if (to && to !== "") { parms.push("todatepublished=" + to); }
            }
            else {
                if (from && from !== "") { parms.push("fromdatemodified=" + from); }
                if (to && to !== "") { parms.push("todatemodified=" + to); }
            }

            _ctx.setFilterFromDate(from);
            _ctx.setFilterToDate(to);
            _ctx.setFilterDateType(dateType);

            return url + "?" + parms.join("&");
        }

        function formatForDatePicker(stringDate) {
            var d = new Date(stringDate);

            var currDate = d.getDate();
            var currMonth = d.getMonth();
            var currYear = d.getFullYear();

            var dateStr = (currMonth + 1) + "/" + currDate + "/" + currYear;

            return dateStr;
        }

        var search = function(){
            var url = APIRoot + "/adminapi/v1/resources/media/";

            var mediaIdSearch = $target.find('#filterMediaId').val().trim();
            if (mediaIdSearch && mediaIdSearch !== "") {
            	url = addMediaIdParms(url, mediaIdSearch);

            	if (options.mediaType != '') {
            		url += "mediatype=" + options.mediaType;
            	}

                _ctx.setFilterMediaId(mediaIdSearch);
            }
            else {
            	_ctx.setFilterMediaId("");
                url = addOtherParms(url); 
            }

            handleSearchCallback(url);
        }

        function doDataMapping(response) {
        	var data = $.map(response, function (item) {
        		item.valueName = $('<div/>').html(item.valueName).text();
        		return item;
        	});

        	return data;
        }

        function ClearFilter() {

            $('#activeStateActive').prop('checked', true);
            $('#visibleStateVisible').prop('checked', true);
            $('#archiveStateNotArchived').prop('checked', true);

            $('#filterMediaId').val("");
            $('#filterTitle').val("");
            $('#filterTopic').val("");
            $('#filterPersistentUrlKey').val("");
            $('#filterAudience').val("");
            $('#url').val("");
            $("#fromDate").val("");
            $("#toDate").val("");

            $(":checkbox[value='all']").attr("checked", false);
            $(":checkbox[value='staged']").attr("checked", false);
            $(":checkbox[value='published']").attr("checked", true);
            $(":checkbox[value='archived']").attr("checked", false);
            $(":checkbox[value='hidden']").attr("checked", false);

            //dateType
            $("input:radio[value='publishDate']").prop('checked', true);
            $("input:radio[value='dateModified']").prop('checked', false);
            
            if(mediaTypePicker) mediaTypePicker.setSelected("Select a Media Type");
            languagePicker.setSelected("Show All");
            sourcePicker.clearSelected();

            _ctx.clearFilterParms();

            search();
        }

        return this;

    };

})(jQuery);