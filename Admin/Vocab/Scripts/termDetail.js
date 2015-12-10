"use strict"; //ignore jslint

(function ($) {
    var PLUGIN_NAME = 'termDetail';

    // plugin signature ///////////////////////
    $[PLUGIN_NAME] = {
        defaults: {
            valueSet: '',
            term: '',
            relatedTermSelectHandler: '',
            updateHandler: '',
            hideHandler: ''
        }
    };

    // main funtion //////////////////////////
    $.fn[PLUGIN_NAME] = function (options) {


        $[PLUGIN_NAME].defaults.target = this;
        options = $.extend({}, $[PLUGIN_NAME].defaults, options);

        if (typeof options.term === "undefined" || options.term === '') { return; }


        // handlers
        function handleRelatedItemSelection(relatedTermId) {
            var func = options.relatedTermSelectHandler;
            if (typeof func === 'function') {
                func(relatedTermId);
            }
        }

        var handleUpdate = function (oTerm) {
            var func = options.updateHandler;
            if (typeof func === 'function') {
                func(oTerm);
            }
        };

        function handleHide() {
            var func = options.hideHandler;
            if (typeof func === 'function') {
                func();
            }
        }

        // end handlers

        // widget scope variables
        var $det;
        var relationshipType = '';
        var valueSetData, typeAheadArray = [], mapped = {};
        var languages = [];
        //

        function main() {
            // for validations/typeahead etc.
        	loadExistingTerms();

        	CDC.Admin.Lookup.GetLanguages(function (results) {
        		languages = results;
        		var toAdd = $.grep(languages, function (itm) { return itm.name !== options.valueSet.language; });
        		$(toAdd).each(function (i,o) {
        			var $li = $("<li><a tabindex='-1' href='#' code='TT' language='" + o.name + "'>translates to (" + o.name + ")</a></li>")
        			$(".relationshipType ul.dropdown-menu").append($li);
        		});
        		
        	});

            if ($(options.target).find('.termDetailContainer').length === 0) {
                $(options.target).append("<div class='termDetailContainer'></div>");
            }

            $det = $(options.target).find('.termDetailContainer');
            $det.empty();
            $det.load("Templates/TermDetail.htm", function () {

                
                setupTermDetail();
                centerModal();

                // new term options
                if (options.term.valueId == -1) {
                    showTermDefintionEdit();
                    $det.find(".editTerm , .createRelationship, .deactivate").attr("disabled", "disabled").addClass('disabled');
                    $det.find(".cancelTermEdit").unbind('click').click(function () {
                        $det.find("a.close").click();
                    });
                }

                applyWatermark();
            });
        }


        var setupTermDetail = function () {

            var valueSet = options.valueSet;
            var term = options.term;

            showTermDefinitionDisplay();

            $det.find('.relationshipBuilder').hide();
            $det.find('.currentRelationships').show();

            var $head = $det.find(".modal-header");
            var $body = $det.find(".modal-body");

            $head.find("p.valueSetName").html("Value Set: " + valueSet.name);
            $head.find("h4 span.termName").html("Details for: " + term.valueName + (term.isActive ? "" : " (Inactive)"));
            $head.find("input.termName").val(htmlDecode(term.valueName));
            $head.find("p.termDefinition span").html(htmlDecode(term.description));
            $head.find("p.termDefinition textarea").val(htmlDecode(term.description));

            if (valueSet.hierarchical) {
                $body.find("p.parents").append(typeList(term, "NT", "Parent Terms", "No parent terms were found for this item"));
                $body.find("p.children").append(typeList(term, "BT", "Child Terms", "No child terms were found for this item"));
            }
            $body.find("p.preferred").append(typeList(term, "USE", "Preferred Term", "No preferred term has been defined for this item", restrictPreferredTermCount));
            $body.find("p.useFor").append(typeList(term, "UF", "This is the preferred term for the following items", "No items were found that should use this term"));
            $body.find("p.relatedTo").append(typeList(term, "RT", "Related Terms", "No related terms were found for this item"));
            $body.find("p.translatesTo").append(typeList(term, "TT", "Translates To", "No translated terms were found for this item"));

            // bind term and relationship buttons
            // including unbinds because html structure is reused.
            $det.find(".editTerm").unbind('click').click(function () {
                showTermDefintionEdit();
                return false;
            });

            $det.find(".saveTermEdit").unbind('click').click(function () {
                saveTerm();
                $det.find(".editTerm, .createRelationship, .deactivate").removeAttr("disabled").removeClass('disabled');
                return false;
            });

            $det.find(".saveRelationships").unbind('click').click(function () {
            	saveRelationships();
            	$det.find(".editTerm, .createRelationship, .deactivate").removeAttr("disabled").removeClass('disabled');
            	return false;
            });

            $det.find(".cancelTermEdit").unbind('click').click(function () {
                showTermDefinitionDisplay();

                $head.find("input.termName").val(htmlDecode(term.valueName));
                $head.find("p.termDefinition textarea").val(htmlDecode(term.description));

                return false;
            });

            $det.find(".createRelationship").unbind('click').click(function () {
                $det.find('.relationshipBuilder').show();

                $det.find('.modal-body').css('overflow', 'visible');

                $det.find('.currentRelationships').hide();
                $det.find(".editTerm, .createRelationship, .deactivate").attr("disabled", "disabled").addClass('disabled');
                var $row = $det.find('.relationshipBuilderRow').first();
                setupRelationshipRow($det, $row, '');
            });

            $det.find(".cancelRelationships").unbind('click').click(function () {
                $det.find('.relationshipBuilder').hide();
                $det.find('.currentRelationships').show();
                $det.find('.relationshipBuilderRow:gt(0)').remove();
                $det.find(".editTerm, .createRelationship, .deactivate").removeAttr("disabled").removeClass('disabled');
            });

            var $activeToggle = $det.find(".deactivate");
            $activeToggle.text(options.term.isActive ? 'Deactivate' : 'Make Active');

            $det.find(".deactivate").unbind('click').click(function () {
                options.term.isActive = !options.term.isActive;
                saveTerm();
            });

            $det.find('.addRelationshipRow').unbind('click').click(function () {
                var $lastRow = $det.find('.relationshipBuilderRow').last();

                var termName = $lastRow.find(".valueSearch").val();
                if (!validateTermName(termName)) { return false; }

                var $row = $det.find('.relationshipBuilderRow').first().clone();
                $lastRow.after($row);
                setupRelationshipRow($det, $row, '');

            });

            // done with setup - display as modal
            $det.find('.termDetail').modal({ show: true, backdrop: false });

            $det.find('.termDetail').on('hidden', function () {
                handleHide();
            });

            $det.find("a.close").click(function () {
                $det.find(".modal-footer .btn").click();
            });

        };


        var centerModal = function () {
            var $modal = $det.find('.termDetail');
            var windowHeight = $(document).height();
            var windowWidth = $(document).width();

            $modal.css({
                top: 20,
                left: (windowWidth / 2) - ($modal.width() / 2)
            });
        };


        var saveRelationships = function () {
        	var url = APIRoot + '/adminapi/v1/resources/values/';
        	url += options.term.valueId;
        	url += '/addRelationships';

        	var desc = $det.find('p.termDefinition textarea').val();
        	desc = desc === '' ? $det.find('input.termName').val() : desc;

        	var oTerm = {
        		valueName: htmlEncode($det.find('input.termName').val()),
        		languageCode: options.valueSet.language,
        		description: htmlEncode(desc),
        		displayOrdinal: options.term.displayOrdinal,
        		isActive: options.term.isActive,
        		valueSet: options.valueSet.name,
        		valueSet_isDefault: false        		
        	};


        	var oRel = { relationships: getRelationships() };

        	if ($(oRel.relationships).length > 0) {
        		if (!validateRelationships(oRel.relationships)) { return; }
        	}

        	var displayErrors = function (obj, postProcess) {
        		if (obj.meta.message.length > 0) {

        			var errors, warnings, messages, $term;

        			errors = $.grep(obj.meta.message, function (msg) {
        				return (msg.type == "Error");
        			});

        			warnings = $.grep(obj.meta.message, function (msg) {
        				return (msg.type == "Warning");
        			});

        			if (errors.length > 0) {
        				messages = "<ul>";
        				$(errors).each(function () {

							messages = messages + "<li>" + $(this)[0].userMessage + "</li>";

        				});
        				messages = messages + "</ul>";
        				$(".alert-error").empty().append(messages).show();
        			}

        			if (warnings.length > 0) {
        				messages = "<ul>";
        				$(warnings).each(function () {

							messages = messages + "<li>" + $(this)[0].userMessage + "</li>";

        				});
        				messages = messages + "</ul>";
        				$(".alert-warning").empty().append(messages).show();
        			        				

        			}

        		}
        	};

        	var localUrl = urlRoot + "/Secure.aspx/UpdateTerm";

        	var call = JSON.stringify({ "data": JSON.stringify(oRel), "apiUrl": url });
        	//"{data: '" + JSON.stringify(oTerm) + "', apiUrl: '" + url + "'}"

        	var saveOperation = function () {
        		$.ajax({
        			type: "POST",
        			url: localUrl,
        			data: call,
        			contentType: "application/json; charset=utf-8",
        			dataType: "json",
        			success: function (response) {
        				var obj = $.parseJSON(response.d);
        				if (obj.meta.message.length > 0) {
        					displayErrors(obj, handleUpdate);
        				}
        				else {
        					handleUpdate(oTerm);
        				}
        			},
        			error: function (xhr, ajaxOptions, thrownError) {
        				console.debug(xhr.status);
        				console.debug(thrownError);
        				console.debug(xhr.responseText);
        				alert(xhr.status);
        				alert(thrownError);
        			}
        		});
        	};

        	saveOperation();


        }


        var saveTerm = function () {

            if (!validateTerm()) { return; }

            var url = APIRoot + '/adminapi/v1/resources/values';
            url += options.term.valueId != -1 ? '/' + options.term.valueId : '';
            url += '/';

            var desc = $det.find('p.termDefinition textarea').val();
            desc = desc === '' ? $det.find('input.termName').val() : desc;

            var oTerm = {
                valueName: htmlEncode($det.find('input.termName').val()),
                languageCode: options.valueSet.language,
                description: htmlEncode(desc),
                displayOrdinal: options.term.displayOrdinal,
                isActive: options.term.isActive,
                valueSet: options.valueSet.name,
                valueSet_isDefault: false
            };

            if ($(oTerm.relationships).length > 0) {
                if (!validateRelationships(oTerm.relationships)) { return; }
            }

            var displayErrors = function (obj, postProcess) {
                if (obj.meta.message.length > 0) {

                    var errors, warnings, messages, $term;

                    errors = $.grep(obj.meta.message, function (msg) {
                        return (msg.type == "Error");
                    });

                    warnings = $.grep(obj.meta.message, function (msg) {
                        return (msg.type == "Warning");
                    });

                    $term = $(".treeview .btn").filter(function () {
                        return this.title.toLowerCase() == oTerm.valueName.toLowerCase();
                    });

                    if (errors.length > 0) {
                        messages = "<ul>";
                        $(errors).each(function () {
                            if ($(this)[0].userMessage.indexOf("This item already exists") > -1) {
                                if ($term.length > 0) {
                                    messages = messages + "<li>An item with this name already exists in this valueset. <a href='#' class='termTreeClick'>Click here</a> to edit the existing item.</li>";
                                }
                                if ($(".datagrid .search input").length > 0) {
                                    messages = messages + "<li>An item with this name already exists in this valueset. <a href='#' class='termGridClick'>Click here</a> to find the existing item.</li>";
                                }

                            }
                            else {
                                messages = messages + "<li>" + $(this)[0].userMessage + "</li>";
                            }

                            console.debug($(this)[0].developerMessage);
                        });
                        messages = messages + "</ul>";
                        $(".alert-error").empty().append(messages).show();
                        $(".alert-error").find('.termTreeClick').click(function () {
                            $term.click();
                        });
                        $(".alert-error").find('.termGridClick').click(function () {
                            $(".modal .close").click();
                            $(".datagrid .search input").val(oTerm.valueName);
                            setTimeout(function () {
                                $(".datagrid .search .btn").click();
                            }, 100);

                        });

                        $(".currentRelationships").hide();
                    }

                    if (warnings.length > 0) {
                        messages = "<ul>";
                        $(warnings).each(function () {
                            if ($(this)[0].userMessage.indexOf("This item already exists as a value") > -1) {

                                $det.find(".modal .btn").attr("disabled", "disabled").addClass('disabled');
                                $det.find(".modal .close").attr("disabled", "disabled").addClass('disabled');
                                messages = messages + "<li>This term already exists within the vocabulary system and has been added to this value set. Any established relationships between this term and others in this value set will be reflected in this addition.<br><br><a href='#' class='continueClick btn btn-warning'>Continue</a></li>";

                            }
                            else {
                                messages = messages + "<li>" + $(this)[0].userMessage + "</li>";
                            }

                            console.debug($(this)[0].developerMessage);
                        });
                        messages = messages + "</ul>";
                        $(".alert-warning").empty().append(messages).show();
                        $(".alert-warning").find('.continueClick').click(function () {
                            if (typeof postProcess === 'function') {
                                postProcess(oTerm);
                            }

                            setTimeout(function () {
                                $term = $(".treeview .btn").filter(function () {
                                    return this.title.toLowerCase() == oTerm.valueName.toLowerCase();
                                });
                                $term.click();
                            }, 1000);

                        });
                        $(".currentRelationships").hide();

                    }

                }
            };

            var localUrl = urlRoot + "/Secure.aspx/" + (options.term.valueId > -1 ? 'UpdateTerm' : 'SaveTerm');

            var call = JSON.stringify({ "data": JSON.stringify(oTerm), "apiUrl": url });
            //"{data: '" + JSON.stringify(oTerm) + "', apiUrl: '" + url + "'}"

            var saveOperation = function () {
                $.ajax({
                    type: "POST",
                    url: localUrl,
                    data: call,
                    contentType: "application/json; charset=utf-8",
                    dataType: "json",
                    success: function (response) {
                        var obj = $.parseJSON(response.d);
                        if (obj.meta.message.length > 0) {
                            displayErrors(obj, handleUpdate);
                        }
                        else {
                            handleUpdate(oTerm);
                        }
                    },
                    error: function (xhr, ajaxOptions, thrownError) {
                        console.debug(xhr.status);
                        console.debug(thrownError);
                        console.debug(xhr.responseText);
                        alert(xhr.status);
                        alert(thrownError);
                    }
                });
            };

            saveOperation();
        };

        var setupRelationshipRow = function ($det, $row, relType) {

            if (relType !== '') { relationshipType = relType; }

            if (relationshipType !== '') {
                $row.find('.relationshipType a.dropdown-toggle')
                    .html($row.find('.relationshipType ul a[code="' + relationshipType + '"]').first().html() + ' <span class="caret"></span>')
                    .attr("code", $row.find('.relationshipType ul a[code="' + relationshipType + '"]').first().attr("code"));
            }
            else {
                $row.find('.relationshipType a.dropdown-toggle')
                    .html($row.find('.relationshipType ul a').first().html() + ' <span class="caret"></span>')
                    .attr("code", $row.find('.relationshipType ul a').first().attr("code"));
            }

            $row.find('.valueSearch').val('');
            setupTypeAhead($row.find('.valueSearch'));
            $row.find('.valueSearch').on('paste', function () {
            	setTimeout(function () {
            		$row.find('.valueSearch').val($row.find('.valueSearch').val().trim());
            		//$(this).keyup();
            	}, 100)
            });

            $row.find('.relationshipType ul a').click(function () {
                $row.find('.relationshipType a.dropdown-toggle')
                    .html($(this).html() + ' <span class="caret"></span>')
                    .attr("code", $(this).attr("code"));
            });

            $row.find('.relationshipDelete').click(function () {
                if ($det.find('.relationshipBuilderRow .relationshipDelete').length == 1) {
                    $det.find('.relationshipBuilder').hide();
                    $det.find('.currentRelationships').show();
                }
                else {
                    $(this).parents('.relationshipBuilderRow').remove();
                }
            });

        };




        function loadExistingTerms() {

            if (typeAheadArray.length > 0) {
                attachPlugin(typeAheadArray);
            }
            else {
                var url = APIRoot + '/adminapi/v1/resources/valuesets/' + options.valueSet.id + '.json/?max=0&lang=english&sort=displayOrdinal&callback=?';

                $.ajax({ url: url, dataType: 'jsonp' })
                    .done(function (response) {

                        valueSetData = doDataMapping(response.results);

                        $.each(valueSetData, function (i, item) {
                            mapped[item.valueName] = item.valueId;
                            typeAheadArray.push(item.valueName);
                        });
                    })
                    .fail(function (xhr, ajaxOptions, thrownError) {
                        debugger;
                        alert(xhr.status);
                        alert(thrownError);
                    });
            }

        }

        function setupTypeAhead($field) {
            $field.typeahead({
                source: typeAheadArray,
                updater: function (term) {
                    var id = mapped[term];
                    $field.attr("relatedTermId", id);
                    return term;
                }
            });
            $field.focus();
        }

        var showTermDefintionEdit = function () {
            $det.find("input.termName,  p.termDefinition textarea, .termEditOptions, .required").show();
            $det.find("span.termName, p.termDefinition span").hide();
            $det.find("input.termName").focus();
            $det.find(".modal-body .btn").attr("disabled", "disabled").addClass('disabled');
            $det.find(".editTerm, .createRelationship, .deactivate").attr("disabled", "disabled").addClass('disabled');
        };

        var showTermDefinitionDisplay = function () {
            $det.find("input.termName, p.termDefinition textarea, .termEditOptions, .required").hide();
            $det.find("span.termName, p.termDefinition span").show();
            $det.find(".modal-body .btn").removeAttr("disabled").removeClass('disabled');
            $det.find(".editTerm, .createRelationship, .deactivate").removeAttr("disabled").removeClass('disabled');
        };

        // define function for building out relationship lists
        var typeList = function (term, typeCode, caption, emptySetText, postProcess) {

            var $rList = $(term.relationships);
            var $div = $("<div>");
            var $ul = $("<ul class='buttonList'>");
            var hasItems = false;

            $rList.each(function () {

                var relationship = this;
                if (relationship.type == typeCode) {

                    var $li = $("<li>");

                    if (options.relatedTermSelectHandler !== '') {
                        var $aTerm = $("<a class='btn btn-default btn-sm' termId='detail_" + relationship.relatedValueId + "'>" + relationship.relatedValueName + "</a>");
                        $aTerm.click(function () {
                            handleRelatedItemSelection(relationship.relatedValueId);
                        });
                        $li.append($aTerm);
                    }
                    else {
                        var $txtTerm = $("<div class='txtTerm'>" + relationship.relatedValueName + "</div>");
                        $li.append($txtTerm);
                    }

                    var $aDelete = $("<div class='pull-right delete'><i class='glyphicon glyphicon-trash deleteRelationship' style='cursor:pointer;'>&nbsp;&nbsp;&nbsp;</i></div>");
                    $li.append($aDelete);

                    $aDelete.click(function () {
                        $.each(term.relationships, function (idx, r) {
                            if (relationship.type == r.type && relationship.relatedValueId == r.relatedValueId) {
                                term.relationships.splice(idx, 1);
                                return false;
                            }
                        });
                        saveRelationships();
                    });

                    $ul.append($li);
                    hasItems = true;
                }
            });

            var $addRelation = $("<div class='relTypeHeader'><a class='btn btn-small pull-right btnAddRelationship' reltype='" + typeCode + "'>Add</a>" + caption + "</div>");

            $addRelation.click(function () {
                $det.find('.relationshipBuilder').show();
                $det.find('.currentRelationships').hide();
                $det.find(".editTerm, .createRelationship, .deactivate").attr("disabled", "disabled").addClass('disabled');
                setupRelationshipRow($det, $det.find(".relationshipBuilderRow"), typeCode);
            });

            $div.append($addRelation);


            if (hasItems) {
                $div.append($ul);
            }
            else {
                if (emptySetText !== "") {
                    $ul.append("<div><i>" + emptySetText + "</i></div>");
                    $div.append($ul);
                }
                else {
                    $div.empty();
                }
            }

            var func = postProcess;
            if (typeof func === 'function') {
                func($div);
            }

            return $div;
        };// end typeList

        var restrictPreferredTermCount = function ($relationshipDiv) {
            if ($relationshipDiv.find('.deleteRelationship').length > 0) {
                $relationshipDiv.find('.btnAddRelationship').hide();
            }
        };


        main();


        // Save utilities //////
        function validateTerm() {
            var name = $det.find('input.termName').val();
            if (name === '') { alert('Term Name is a required field.'); $det.find('input.termName').focus(); return false; }

            var arr = $.map(typeAheadArray, function (elem) { return elem.toLowerCase(); });

            if (options.term.valueId > 0) {
                arr = jQuery.grep(arr, function (value) {
                    return value != htmlDecode(options.term.valueName).toLowerCase();
                });
            }

            if ($.inArray(name.toLowerCase(), arr) > -1) { alert('This term already exists in this Value Set.'); $det.find('input.termName').focus(); return false; }

            return true;
        }

        function validateRelationships(rels) {

            // lets do some relationship validation :

            // if valueSetData is not populated we've not used the realtionship builder and will accept all existing relationships as good.
            if (!valueSetData) { return true; }

            // first one is easy: cannot be in a relationship with itself -
            var conceit = $.grep(rels, function (e, i) { return e.valueId == options.term.valueId; });
            if (conceit.length > 0) {
                alert("A term cannot be related to itself.");
                return false;
            }

            // second one is easy: can only have one preferred term -
            var prefTerms = $.grep(rels, function (e, i) { return e.type == 'USE'; });
            if (prefTerms.length > 1) {
                alert("An item can have only one preferred term.");
                return false;
            }

            // a child cannot be an ancestor of itself
            var ancestors = [];
            var selfParents = [];
            var childRelationships = $.grep(rels, function (e, i) { return e.type == 'BT'; });

            ancestors.push(options.term);
            getRelatedByType(ancestors, options.term, 'NT');

            $(childRelationships).each(function () {
                var rels = $(this)[0];
                selfParents = $.grep(ancestors, function (e, i) {
                    return e.valueId == rels.valueId;
                });
            });

            if (selfParents.length > 0) {
                alert("A child relationship cannot be created because the child term is already an ancestor of this item.");
                return false;
            }

            // a parent cannot be a child of itself
            var descendents = [];
            var selfChildren = [];
            var parentRelationships = $.grep(rels, function (e, i) { return e.type == 'NT'; });

            descendents.push(options.term);
            getRelatedByType(descendents, options.term, 'BT');

            $(parentRelationships).each(function () {
                var rels = $(this)[0];
                selfChildren = $.grep(descendents, function (e, i) {
                    return e.valueId == rels.valueId;
                });
            });

            if (selfChildren.length > 0) {
                alert("A parent relationship cannot be created because the parent term is already a descendant of this item.");
                return false;
            }

            // a preferred term (USE) cannot be created for a term that is already set as a preferred term downstream of the target term 
            var preferredAncestors = [];
            var selfPreferrer = [];
            var childPreferrers = $.grep(rels, function (e, i) { return e.type == 'USE'; });

            preferredAncestors.push(options.term);
            getRelatedByType(preferredAncestors, options.term, 'UF');

            $(childPreferrers).each(function () {
                var rels = $(this)[0];
                selfPreferrer = $.grep(preferredAncestors, function (e, i) {
                    return e.valueId == rels.valueId;
                });
            });

            if (selfPreferrer.length > 0) {
                alert("The preferred term relationship could not be created because this term is already preferred over the target term.");
                return false;
            }

            // a preferred term (UF) cannot be created for a term that is already set as a preferred term upstream of the target term 
            childPreferrers = $.grep(rels, function (e, i) { return e.type == 'UF'; });

            preferredAncestors.push(options.term);
            getRelatedByType(preferredAncestors, options.term, 'USE');

            $(childPreferrers).each(function () {
                var rels = $(this)[0];
                selfPreferrer = $.grep(preferredAncestors, function (e, i) {
                    return e.valueId == rels.valueId;
                });
            });

            if (selfPreferrer.length > 0) {
                alert("The preferred term relationship could not be created because this term is already preferred over the target term.");
                return false;
            }

            return true;

            function getRelatedByType(arr, oTerm, relType) {

                var relationShips = $.grep(oTerm.relationships, function (e, i) { return e.type == relType; });

                $(relationShips).each(function () {
                    var r = $(this)[0];
                    var o = $.grep(valueSetData, function (e, i) {
                        return e.valueId == r.relatedValueId;
                    });

                    $(o).each(function () {
                        arr.push($(this)[0]);
                        getRelatedByType(arr, $(this)[0], relType);
                    });
                });

            }

        }

        function getRelationships() {

            if (!options.term.relationships) { options.term.relationships = []; }

            // load existing relationships           
            var rels = $.map(options.term.relationships, function (item) {
                var rel = {
                    //relatedValueName: item.relatedValueName,
                    type: item.type,
                    valueId: item.relatedValueId,
                    isActive: true
                };
                return rel;
            });

            // load from visible relationship builder rows
            $(".relationshipBuilderRow").each(function () {

                var type = $(this).find(".relationshipType a").first().attr("code");
                var relTermId = $(this).find(".valueSearch").attr("relatedTermId");

                var termName = $(this).find(".valueSearch").val();
                if (termName !== "" && !validateTermName(termName)) { return false; }

                if (type !== '' && relTermId !== undefined && relTermId !== '') {
                    rels.push({
                        relatedValueName: htmlEncode(termName),
                        type: type,
                        valueId: relTermId,
                        isActive: true
                    });
                }

            });

            return rels;
        }


        function validateTermName(termName) {
            if (termName === '') {
                alert('Please enter a term name to complete the current relationship before trying to create an additional one.');
                return false;
            }

            var o = $.grep(valueSetData, function (e, i) {
                return e.valueName.toLowerCase() == termName.toLowerCase();
            });

            if (o.length === 0) {
                alert('"' + termName + '" is not an existing term in this value set. Relationships can only be established between existing terms.');
                $(this).find(".valueSearch").focus();
                return false;
            }

            return true;
        }


    };

})(jQuery);