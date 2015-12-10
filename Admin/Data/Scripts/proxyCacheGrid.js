"use strict";  //ignore jslint
(function ($) {
    var PLUGIN_NAME = "proxyCacheGrid";

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
            $(options.target).empty().load("Templates/proxyCacheGrid.htm", function () {
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
                var url = options.url;

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

                if (_search !== '') url += "&urlcontains=" + _search;
                url += "&max=" + _pageSize + "&pagenum=" + _pageNum + "&callback=?";

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
                        id: itm.id,
                        datasetId: itm.datasetid,
                        url: itm.url,
                        expirationDateTime: itm.expirationdatetime,
                        expirationInterval: itm.expirationinterval,
                        status: itm.status,
                        failures: itm.failures
                    };

                    dtData.aaData.push(jItm);
                }

                return dtData;
            };

            var bindDatatable = function () {

                oTable = $(options.target).find("#proxyCacheGrid").dataTable({
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
                                $("#proxyCacheGrid").replaceWith("<div style='clear:both; font-style:italic; border-top:1px solid black; border-bottom:1px solid black; padding:10px; margin:15px 0 15px 0;'>No results we found matching your search criteria.</div>");
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
                            { "mDataProp": "id" },
                            { "mDataProp": "datasetId" },
                            { "mDataProp": "url" },
                            { "mDataProp": "expirationDateTime" },
                            { "mDataProp": "expirationInterval" },
                            { "mDataProp": "status" },
                            { "mDataProp": "failures" },
                            { "mDataProp": "id" },
                            { "mDataProp": "id" },
                            { "mDataProp": "id" }
                        ],
                    "aoColumnDefs": [
                        {
                            "mRender": function (data, type, row) {
                                var out;
                                //try {
                                    //out = decodeURI(data);
                                //}
                                //catch (err) {
                                    out = data;
                                //}                                                             
                                return out;
                            },
                            "aTargets": [2]
                        },
                        {
                            "mRender": function (data, type, row) {
                                var out;
                                if (data === "") { out = "<i>No Dataset ID provided</i>"; }
                                else {
                                    out = data;
                                }
                                return out;
                            },
                            "aTargets": [1]
                        },
                        {
                            "mRender": function (data, type, row) {
                                var d = new Date(data);
                                var expireDate = d.getDate();
                                var expireMonth = d.getMonth() + 1;
                                var expireYear = d.getFullYear();
                                var expireHours = (d.getHours() < 10 ? '0' : '') + d.getHours();
                                var expireMinutes = (d.getMinutes()<10?'0':'') + d.getMinutes();
                                var expireSecs = (d.getSeconds() < 10 ? '0' : '') + d.getSeconds();

                                return expireMonth + "/" + expireDate + "/" + expireYear + " " + expireHours + ":" + expireMinutes + ":" + expireSecs;
                            },
                            "aTargets": [3]
                        },
                        {
                            "mRender": function (data, type, row) {
                                var out = '<a class="btn btn-small btn-primary btnExpire" data-id="' + row.id + '" style="color: white;" href="#">Expire</a>';
                                return out;
                            },
                            "aTargets": [7]
                        },
                        {
                            "mRender": function (data, type, row) {
                                var out = '<a class="btn btn-small btn-primary btnDelete" data-id="' + row.id + '" style="color: white;" href="#">Delete</a>';
                                return out;
                            },
                            "aTargets": [8]
                        },
                        {
                            "mRender": function (data, type, row) {
                                var out = '<a class="btn btn-small btn-primary btnEdit" data-id="' + row.id + '" style="color: white;" href="#">Edit&nbsp;Detail</a>';
                                return out;
                            },
                            "aTargets": [9]
                        },
                        { "sClass": "center", "aTargets": [7,8,9] },
                        { 'bSortable': false, 'aTargets': [7,8,9] }

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

                $(".pagination").first().insertBefore("#proxyCacheGrid_filter");

                $("[id$='_info']").hide();

            };

            bindDatatable();

        }

        var setupButtonEvents = function(){
            $("#proxyCacheList .btnEdit").click(function(){
                
                _ctx.setPageData({
                    "_pageSize" : _pageSize,
                    "_pageNum" : _pageNum,
                    "_sortDirection" : _sortDirection,
                    "_sortProperty" :_sortProperty,
                    "_sortIndex" : _sortIndex
                });

                var id = $(this).attr('data-id');
                _ctx.setSelectedMediaId(id);

                document.location = urlRoot + "/Data/EditProxyCache.htm";
                return false;
            });

            $("#proxyCacheList .btnExpire").click(function () {

                _ctx.setPageData({
                    "_pageSize": _pageSize,
                    "_pageNum": _pageNum,
                    "_sortDirection": _sortDirection,
                    "_sortProperty": _sortProperty,
                    "_sortIndex": _sortIndex
                });

                var id = $(this).attr('data-id');
                expireProxyCache(id, function () { refreshMediaTable(); });                                      
                return false;
            });

            $("#proxyCacheList .btnDelete").click(function () {

                _ctx.setPageData({
                    "_pageSize": _pageSize,
                    "_pageNum": _pageNum,
                    "_sortDirection": _sortDirection,
                    "_sortProperty": _sortProperty,
                    "_sortIndex": _sortIndex
                });

                var id = $(this).attr('data-id');
                deleteProxyCache(id, function () { refreshMediaTable(); });
                return false;
            });
        };


        refreshMediaTable();
        //////////////////////////////////

    };

})(jQuery); /* File Created: October 24, 2014 */