"use strict";  //ignore jslint
(function ($) {
    var PLUGIN_NAME = "seriesGrid";

    // plugin signature ///////////////////////
    $[PLUGIN_NAME] =
    {
        url: '',
        defaults: {}
    };

    // main funtion //////////////////////////
    $.fn[PLUGIN_NAME] = function (options) {

        $[PLUGIN_NAME].defaults.target = this;
        options = $.extend({}, $[PLUGIN_NAME].defaults, options);


        /////////////////////////////////////

        var oTable;

        var _totalPages = 0;
        var _pageNum = 1;
        var _pageSize = 10;
        var _sortIndex = '';
        var _sortDirection = '';
        var _sortProperty = '';
        var _search = '';

        function refreshMediaTable() {
            $().showSpinner();            

            $(options.target).empty();
            $(options.target).addClass('dataTable');
            $(options.target).empty().load("Templates/seriesGrid.htm", function () {
                buildMediaTable();
            });
        }


        function buildMediaTable() {

            var getSort = function () {
                if (_sortProperty === '') { return [[5, "desc"]]; }
                var strSort = _sortDirection === '-' ? "desc" : "asc";
                return [[_sortIndex, strSort]];
            };

            var url;

            var getUrl = function () {

                if(url){return url;}
                url = options.url;

                //have we stored paging parameters?
                if(_ctx.Filter.PageData){                
                    _pageSize = _ctx.Filter.PageData._pageSize;
                    _pageNum = _ctx.Filter.PageData._pageNum;
                    _sortDirection = _ctx.Filter.PageData._sortDirection;
                    _sortProperty = _ctx.Filter.PageData._sortProperty;
                    _sortIndex = _ctx.Filter.PageData._sortIndex;
                    _ctx.setPageData(null);
                }

                if (_sortProperty !== '') {
                    url += "&sort=";
                    url += _sortDirection;
                    url += _sortProperty;
                }

                if (_search !== '') url += "&q=" + _search;
                url += "&max=" + _pageSize + "&pagenum=" + _pageNum + "&callback=?";

            	// debugger code
                if ($(".urlDebugWindow").length === 0) {
                	var $div = $("<div class='urlDebugWindow'></div>");
                	$div.css({
                		"color": "#cccccc",
                		"border": "1px dashed #cccccc",
                		"padding": "10px",
                		"background-color": "white",
                		"font-size": "smaller",
                		"clear": "both"
                	});

                	$("body").append($div);
                }
                var $url = $("<div>" + url + "</div>");
                $(".urlDebugWindow").append($url);
            	///////////////


                return url;
            };

            var processResponse = function (response) {

                $(".dataTables_paginate").hide();
                $(".pagination").pager({
                    count: response.meta.pagination.total,
                    displayCount: response.results.length,
                    totalPages: response.meta.pagination.totalPages,
                    currentPageNum: _pageNum,
                    pagingHandler: function (newPageNumber) {
                        _pageNum = newPageNumber;
                        refreshMediaTable();
                        return false;
                    }
                });

                var dtData = {
                    aaData: []
                };

                dtData.iTotalRecords = response.meta.pagination.total;
                dtData.iTotalDisplayRecords = response.meta.pagination.count;
                dtData.sEcho = response.meta.pagination.count;

                for (var i = 0; i < response.results.length; i++) {
                    var itm = response.results[i];

                    var jItm = {


                    	mediaId: itm.mediaId,
                    	title: itm.title,
						mediaType : itm.mediaType,
						topics: itm.tags['topic'],
                    	status: itm.status,
                    	datePublished: itm.datePublished,
						sourceUrl: itm.sourceUrl

                    };

                    dtData.aaData.push(jItm);
                }

                return dtData;
            };

            var bindDatatable = function () {

                oTable = $(options.target).find("#seriesGrid").dataTable({
                    "bServerSide": true,
                    "sAjaxSource": getUrl(),
                    "aaSorting": getSort(),
                    "fnInitComplete": function(oSettings, json) {
                        setupButtonEvents();
                        $().hideSpinner();
                    },
                    "fnServerData": function (sSource, aoData, fnCallback, oSettings) {
                        oSettings.jqXHR = $.ajax({
                            'url': getUrl(),
                            'dataType': 'jsonp',
                            'data': ''
                        }).done(function (response) {
                            var tmpData = processResponse(response);                            
                            if(response.meta.pagination.count==0){
                                $("#feedGrid").replaceWith("<div style='clear:both; font-style:italic; border-top:1px solid black; border-bottom:1px solid black; padding:10px; margin:15px 0 15px 0;'>No results we found matching your search criteria.</div>");
                            }
                            else{
                                fnCallback(tmpData);
                            }
                            $().hideSpinner();
                        }).fail(function (xhr, ajaxOptions, thrownError) {
                            alert("error");
                        });
                    },
                    "aoColumns": [
                            { "mDataProp": "mediaId" },
                            { "mDataProp": "title" },
                            { "mDataProp": "mediaId" },
                            { "mDataProp": "status" },
                            { "mDataProp": "datePublished" },
                            { "mDataProp": "mediaId" },
							{ "mDataProp": "datePublished" }
                        ],
                    "aoColumnDefs": [
                        {
                            "mRender": function (data, type, row) {
                            	var out = "<ul class='grid_topics'>";

                            	$(row.topics).each(function () {
                            		out += "<li>" + this.name; +"</li>";
                            	});

                            	out += "</ul>";

                                return out;
                            },
                            "aTargets": [2]
                        },
                        {
                        	"mRender": function (data, type, row) {

                        		if (row.status === "Published") {
                        			var d = new Date(data);
                        			var modifiedDate = d.getDate();
                        			var modifiedMonth = d.getMonth() + 1;
                        			var modifiedYear = d.getFullYear();

                        			return modifiedMonth + "/" + modifiedDate + "/" + modifiedYear;
                        		}
                        		else {
                        			return "";
                        		}
                            },
                            "aTargets": [4]
                        },
                        {
                            "mRender": function (data, type, row) {
                                var out = '';
                                return out;
                            },
                            "aTargets": [5]
                        },
                        {
                            "mRender": function (data, type, row) {
                                var out = '<a class="btn btn-small btn-primary btnEdit" mediaId="' + row.mediaId + '" mediaType="'+ row.mediaType +'" style="color: white;" href="#">Podcast Detail</a>';
                                return out;
                            },
                            "aTargets": [6]
                        },
                        { "sClass": "center", "aTargets": [5,6] },
                        { 'bSortable': false, 'aTargets': [2,5,6] }

                    ]
                });

                $("[id$='_filter'] input").val(_search);

                $("[name$='_length']")
                    .unbind()
                    .val(_pageSize)
                    .change(function () {
                        _pageNum = 1;
                        _pageSize = $(this).val();
                        refreshMediaTable();
                    });

                var $filter = $("[id$='_filter'] input");
                $filter.unbind();

                $(document).unbind('keypress');
                $(document).keypress(function (e) {
                    if (e.which == 13) {
                        if ($filter.val() !== '') {
                            _pageNum = 1;
                            _search = $filter.val();
                            refreshMediaTable();
                            return false;
                        }
                    }
                });

                var $th = $(options.target).find("th");

                $th.unbind('click.DT');
                $(options.target).find("th:empty").addClass('noSort');
                $(options.target).find("th:not(:empty)").click(function () {
                    _pageNum = 1;
                    if ($(this).hasClass('sorting_asc') || $(this).hasClass('sorting_desc')) {
                        _sortDirection = $(this).hasClass('sorting_desc') ? '' : '-';
                    }
                    else {
                        _sortDirection = '';
                    }
                    _sortProperty = $(this).attr('sort');
                    _sortIndex = $th.filter(
                        function () {
                            return $(this).attr('sort') == _sortProperty;
                        }).index();
                    refreshMediaTable();
                });

                $(".pagination").first().insertBefore(".dataTables_length");

                $("[id$='_info']").hide();
                $("[id$='_filter']").hide();

            };

            bindDatatable();

        }

        var setupButtonEvents = function(){
            $("#seriesGrid .btnEdit").click(function () {
                
                _ctx.setPageData({
                    "_pageSize" : _pageSize,
                    "_pageNum" : _pageNum,
                    "_sortDirection" : _sortDirection,
                    "_sortProperty" :_sortProperty,
                    "_sortIndex" : _sortIndex
                });

                var mediaId = $(this).attr('mediaId');
                document.location = urlRoot + "/Podcasts/Podcasts.htm?view=detail&id=" + mediaId;
                return false;
            });

        };


        refreshMediaTable();
        //////////////////////////////////

    };

})(jQuery); /* File Created: March 11, 2014 */