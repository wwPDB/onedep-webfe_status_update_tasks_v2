/*
 * File:  statusUpdateCommon.js
 * Date:  20-Dec-2013  J. Westbrook
 *
 *
 * Updates:
 *   15-Jan-2014  jdw add current status display
 *   04-Mar-2014  jdw add merge coordinate form
 *   20-May-2014  jdw export author release status on status update op
 *   27-Jul-2014  jdw update format of error messages -
 *   19-Jan-2015  jdw modify getEntryInfo() to work with async: false  -
 *   19-Mar-2015  jdw manage experimental methods along with other server data
 *                    and provide this on link to communication module.
 *    7-May-2015  jdw add reload form support
 *    2-Aug-2015  jdw add support for process site  -  status-process-site-update-form
 *   21-Oct-2015  jdw add addtional em specific update functionality
 *   22-Feb-2016  jdw update em status form on request completion
 *   12-Feb-2018  ep  hide em form unless EMDB in requested accession codes
 *   23-May-2018  ep  Update selectors to use .val() instead of deprecated attributes
 *   11-Jun-2018  ep  Add displayReportContent that will display on error or hide content
 *
 */
//
// Globals -
//
var sessionId = '';
var entryId = '';
var pdbId = '';
var emdbId = '';
var combId = '';
var structTitle = '';
var experimentalMethods = '';
var annotatorId = '';
var wfAnnotatorId = '';
var statusCode = '';
var postRelStatusCode = '';
var authRelCode = '';
var initialDepositDate = '';
var holdCoordinatesDate = '';
var coordinatesDate = '';
var approvalType = '';
var processSite = '';
var reqacctypes = '';
//
var em_current_status = '';
var em_deposition_date = '';
var em_deposition_site = '';
var em_obsoleted_date = '';
var em_details = '';
var em_last_update = '';
var em_map_hold_date = '';
var em_map_release_date = '';
var em_header_release_date = '';
var em_depui_depositor_hold_instructions = '';
var em_replace_existing_entry_flag = '';
var em_title = '';
//
var standaloneMode = true;
var standaloneModeFirst = true;
//
var successFlag = 'false';
var errorFlag = '';
var errotText = '';
//
var pagePath = '';
// Do not update picker until init
var datetimeInit = false;

//
// Application task URLS
statusMiscReportsUrl = '/service/status_update_tasks_v2/misc_reports';
// Deprecared
statusCodeUpdateUrl = '/service/status_update_tasks_v2/status_code_update';
statusCodeUpdateV2Url = '/service/status_update_tasks_v2/status_code_update_v2';
statusReloadUrl = '/service/status_update_tasks_v2/status_reload';
setIdcodeUrl = '/service/status_update_tasks_v2/set_idcode';
statusCreateFilesUrl = '/service/status_update_tasks_v2/create_files';
statusMergeXyzUrl = '/service/status_update_tasks_v2/mergexyzcalc';
processSiteUpdateUrl = '/service/status_update_tasks_v2/process_site_update';
statusOtherUpdateUrl = '/service/status_update_tasks_v2/other_update';
//
setIdcodeEmUrl = '/service/status_update_tasks_v2/set_idcode_em';
statusCodeUpdateEmUrl = '/service/status_update_tasks_v2/status_code_update_em';

var newSessionServiceUrl = '/service/status_update_tasks_v2/newsession';
//var getSessionInfoServiceUrl = '/service/status_update_tasks_v2/getsessioninfo';

/*window.log = function(){
  log.history = log.history || [];   // store logs to an array for reference
  log.history.push(arguments);
  if(this.console){
    console.log( Array.prototype.slice.call(arguments) );
  }
};*/

(function() {
    var b, d, c = this,
        a = c.console;
    c.log = b = function() {
        d.push(arguments);
        a && a.log[a.firebug ? "apply" : "call"](a, Array.prototype.slice.call(arguments))
    };
    c.logargs = function(e) {
        b(e, arguments.callee.caller.arguments)
    };
    b.history = d = []
})();
String.prototype.startsWith = function(str) {
    return this.indexOf(str) == 0;
};

function logContext(message) {
    //log("log: " + message + " (  entry id " + entryId + " session id " + sessionId + " annotator id " + annotatorId + ")");
    console.log("log: " + message );
}

function newSession(context) {
    var retObj;
    clearServiceContext();
    var serviceData = getServiceContext();
    logContext("Calling newsession ");
    $.ajax({
        url: newSessionServiceUrl,
        async: false,
        data: serviceData,
        type: 'post',
        success: function(jsonObj) {
            retObj = jsonObj;
        }
    });
    //
    assignContext(retObj);
    logContext("After newsession ");
    appendContextToMenuUrls();
}

function getEntryInfoOrg() {
    var entryInfoUrl = '/service/status_update_tasks_v2/entryinfo';
    var serviceData = getServiceContext();
    $.ajax({
        url: entryInfoUrl,
        async: false,
        data: serviceData,
        dataType: 'json',
        type: 'post',
        success: function(jsonObj) {
            assignContext(jsonObj);
            renderContext();
        },
        beforeSubmit: function(arr, $form, options) {
            // Reset any existing state --
        }

    });

    //
    //logContext("After getEntryInfo ");
}


function getEntryInfo() {
    // Display spinner
    progressStart();
    var entryInfoUrl = '/service/status_update_tasks_v2/entryinfo';
    var serviceData = getServiceContext();
    $.ajax({
        url: entryInfoUrl,
        //        async: false,
        data: serviceData,
        dataType: 'json',
        type: 'post',
        beforeSubmit: function(arr, $form, options) {
            // Reset any existing state --
        }
    }).done(function(jsonObj) {
	logContext("Entryinfo context" + JSON.stringify(jsonObj))
        assignContext(jsonObj);
        renderContext();
        logContext("After done in getEntryInfo  - statusCode " + statusCode + " -postRelStatusCode " + postRelStatusCode);
	// Asynchronous call - need to update here 
	if ($("#status-identifier-dialog").length > 0) {
            $("#subheader").html(getSubHeader());
	}
        appendContextToMenuUrls();
        updateStatusForm();
        // if (em_current_status.length > 0) {
        //    updateStatusFormEm();
        //     if ($("#status-update-em-dialog").length > 0) {
        //         $("#subheader").html(getSubHeaderEm());
        //     }
        // }
	// Take down spinner
	progressEnd();
    });
    //
    //logContext("After getEntryInfo ");
}

function getSubHeader() {
    //    var myText = entryId + '<br /><h5>';

    var showpdb;
    var myText = '<span class="pull-right">' + entryId + '</span> <br /><h5>';
    logContext('getSubHeader ' + statusCode + ' : ' + postRelStatusCode);

    var ispdb = false;
    if (statusCode.length > 0) {
	// Maponly sets a status code as well
	ispdb = ispdbentry();
	if (ispdb === true) {
	    if (postRelStatusCode.length == 0) {
		myText += '&nbsp;&nbsp;&nbsp;&nbsp;Status: ' + statusCode;
	    } else {
		myText += '&nbsp;&nbsp;&nbsp;&nbsp;Status: ' + postRelStatusCode + '(' + statusCode + ')';
	    }
	}
    }

    if (authRelCode.length > 0  && ispdb === true) {
        myText += '&nbsp;&nbsp; Author status: ' + authRelCode
    }

    if (ispdb == true && initialDepositDate.length > 0) {
        myText += '&nbsp;&nbsp; Deposited: ' + initialDepositDate
    }


    if (em_current_status.length > 0) {
	if (ispdb === true) {
	    myText += '<br />';
	}
        myText += '&nbsp;&nbsp;&nbsp;&nbsp;EMDB Status: ' + em_current_status;

	if (em_depui_depositor_hold_instructions.length > 0) {
	    myText += '&nbsp;&nbsp;Author status: ' + em_depui_depositor_hold_instructions;
	}

	if (ispdb == false && initialDepositDate.length > 0) {
            myText += '&nbsp;&nbsp; Deposited: ' + initialDepositDate
	}
    }

    if (annotatorId.length > 0) {
        myText += '<br />&nbsp;&nbsp; Annotator: ' + annotatorId
    }

    if (approvalType.length > 0) {
        myText += '&nbsp;&nbsp; Approval type: ' + approvalType
    }
    myText += '</h5>'
    logContext("After getSubHeader() myText " + myText);
    return myText
}

function getSubHeaderEm() {
    //    var myText = entryId + '<br /><h5>';
    var myText = '<span class="pull-right">' + entryId + '</span> <br /><h5>';

    if (emdbId.length > 0) {
        myText += '&nbsp;&nbsp;&nbsp;&nbsp;EMDB ID: ' + emdbId
    }

    if (em_current_status.length > 0) {
        myText += '&nbsp;&nbsp;&nbsp;&nbsp;EM Status: ' + em_current_status
    }

    if (authRelCode.length > 0) {
        myText += '&nbsp;&nbsp; Author status: ' + authRelCode
    }

    /*
      if (initialDepositDate.length > 0) {
      myText += '&nbsp;&nbsp; Deposited: ' + initialDepositDate
      }

      if (annotatorId.length > 0) {
      myText += '<br />&nbsp;&nbsp; Annotator: ' + annotatorId
      }

      if (approvalType.length > 0) {
      myText += '&nbsp;&nbsp; Approval type: ' + approvalType
      }
    */
    myText += '</h5>'
    logContext("After getSubHeaderEm() myText " + myText);
    return myText
}

function renderContext() {
    /*
      Load some cosmetic details in the top of page  --
    */
    if (structTitle.length > 0 || em_title.length > 0) {
        $('#my_title').remove();
	if (structTitle.length > 0) {
            $('.page-header').append('<h5 id="my_title"> Title: ' + structTitle + '</h5>');
	}
	if (em_title.length > 0) {
            $('.page-header').append('<h5 id="my_title"> EMDB Title: ' + em_title + '</h5>');
	}
    } else {
        $('#my_title').hide();
    }

    if (combId.length > 0) {
        $('title').html("Stat: " + combId);
    } else if (pdbId.length > 0 && entryId.length > 0) {
        $('title').html("Stat: " + pdbId + '/' + entryId);
    } else if (entryId.length > 0) {
        $('title').html("Stat: " + entryId);
    } else {
        $('title').html("Status");
    }

    //$("#subheader").html(getSubHeader());
}

function ispdbentry() {
    // Function to return if this is a PDB entry.
    // Checks requested accession codes. If not set (legacy) than 
    // is.  Returns booksan
    var showpdb = false;
    if (reqacctypes.length < 2) {
	// No accession codes, assume legacy
	showpdb = true;
    } else if (reqacctypes.indexOf('PDB') >= 0) {
	showpdb = true;
    }
    return showpdb;
};

function isementry() {
    // Function to return if this is a EMDB entry.
    // Checks requested accession codes. If not set (legacy) than 
    // is.  Returns booksan
    var showem = false;
    if (reqacctypes.length < 2) {
	// No accession codes, assume legacy - not emdb
	showem = false;
    } else if (reqacctypes.indexOf('EMDB') >= 0) {
	showem = true;
    }
    return showem;
};

function updateStatusForm() {
    logContext("+updateStatusForm - statusCode " + statusCode + " - postRelStatus " + postRelStatusCode);

    if (em_current_status.length > 0) {
        $(".showem").show();
        $(".hideem").hide();
    } else {
        $(".showem").hide();
        $(".hideem").show();
    }

    var showpdb = ispdbentry();
    if (showpdb === true) {
        $(".showpdb").show();
        $(".hidepdb").hide();
    } else {
	$(".showpdb").hide();
        $(".hidepdb").show();
    }


    if (statusCode.length > 0) {
        var statusCodeList = [ "HPUB", "AUTH", "HOLD", "WAIT", "PROC", "REFI", "AUCO", "REPL", "POLC", "WDRN" ];
        if (authRelCode.length > 0) {
            if (authRelCode == "REL") {
                statusCodeList = [ "AUTH", "WAIT", "PROC", "REFI", "AUCO", "REPL", "POLC", "WDRN" ];
                if (statusCode == "HPUB") {
                    statusCodeList = [ "HPUB", "AUTH", "WAIT", "PROC", "REFI", "AUCO", "REPL", "POLC", "WDRN" ];
                } else if (statusCode == "HOLD") {
                    statusCodeList = [ "AUTH", "HOLD", "WAIT", "PROC", "REFI", "AUCO", "REPL", "POLC", "WDRN" ];
                }
            } else if (authRelCode == "HPUB") {
                statusCodeList = [ "HPUB", "AUTH", "WAIT", "PROC", "REFI", "AUCO", "REPL", "POLC", "WDRN" ];
                if (statusCode == "HOLD") {
                    statusCodeList = [ "HPUB", "AUTH", "HOLD", "WAIT", "PROC", "REFI", "AUCO", "REPL", "POLC", "WDRN" ];
                }
            } else if (authRelCode == "HOLD") {
                statusCodeList = [ "AUTH", "HOLD", "WAIT", "PROC", "REFI", "AUCO", "REPL", "POLC", "WDRN" ];
                if (statusCode == "HPUB") {
                    statusCodeList = [ "HPUB", "AUTH", "HOLD", "WAIT", "PROC", "REFI", "AUCO", "REPL", "POLC", "WDRN" ];
                }
            }
        }
        var optionList = "";
        for (var i = 0; i < statusCodeList.length; i++) {
            optionList += '<option value="' + statusCodeList[i] + '">' + statusCodeList[i] + '</option>\n';
        }
        $('#status-code').empty().append(optionList);

        var emStatusCodeList = [ "AUTH", "HOLD", "HPUB", "POLC", "PROC", "REFI", "REPL", "WAIT", "WDRN" ];
        if (em_depui_depositor_hold_instructions.length > 0) {
            if (em_depui_depositor_hold_instructions == "REL"){
                emStatusCodeList = [ "AUTH", "POLC", "PROC", "REFI", "REPL", "WAIT", "WDRN" ];
                if ((em_current_status.length > 0) && (em_current_status == "HPUB")) {
                    emStatusCodeList = [ "AUTH", "HPUB", "POLC", "PROC", "REFI", "REPL", "WAIT", "WDRN" ];
                } else if ((em_current_status.length > 0) && (em_current_status == "HOLD")) {
                    emStatusCodeList = [ "AUTH", "HOLD", "POLC", "PROC", "REFI", "REPL", "WAIT", "WDRN" ];
                }
            } else if (em_depui_depositor_hold_instructions == "HPUB") {
                emStatusCodeList = [ "AUTH", "HPUB", "POLC", "PROC", "REFI", "REPL", "WAIT", "WDRN" ];
                if ((em_current_status.length > 0) && (em_current_status == "HOLD")) {
                    emStatusCodeList = [ "AUTH", "HOLD", "HPUB", "POLC", "PROC", "REFI", "REPL", "WAIT", "WDRN" ];
                }
            } else if (em_depui_depositor_hold_instructions == "HOLD") {
                emStatusCodeList = [ "AUTH", "HOLD", "POLC", "PROC", "REFI", "REPL", "WAIT", "WDRN" ];
                if ((em_current_status.length > 0) && (em_current_status == "HPUB")) {
                     emStatusCodeList = [ "AUTH", "HOLD", "HPUB", "POLC", "PROC", "REFI", "REPL", "WAIT", "WDRN" ];
                }
            }
        }
        var emOptionList = "";
        for (var i = 0; i < emStatusCodeList.length; i++) {
            emOptionList += '<option value="' + emStatusCodeList[i] + '">' + emStatusCodeList[i] + '</option>\n';
        }
        $('#em_new_status').empty().append(emOptionList);

        $('#status-code').val(statusCode);
        $('#status-code2').val(statusCode);
        $('#status-code2em').val(em_current_status);
        //$("#status-code option[value=" + statusCode + "]").attr("selected", "selected");
	if (statusCode == 'REL' || statusCode == 'OBS') {
            $("#status-code-pulldown").hide();
            $("#status-code-text").show();
            $(".hiderel").hide();
	} else {
            $("#status-code-pulldown").show();
            $("#status-code-text").hide();
	    // We do not expliclty show - as will override show/hidepdb. But we do not allow status change from REL anyways
            // $(".hiderel").show();
	}

	if (em_current_status == 'REL' || em_current_status == 'OBS') {
            $("#status-code-em-pulldown").hide();
            $("#status-code-em-text").show();
            $(".hiderelem").hide();
	} else {
            $("#status-code-em-pulldown").show();
            $("#status-code-em-text").hide();
	    // We do not expliclty show - as will override show/hidepdb. But we do not allow status change from REL anyways
            // $(".hiderel").show();
	}
    }

    // -----------------------    
    // Logic to determine if approval should be displayed
    var ispdb = ispdbentry();
    var isem = isementry();
    if ((ispdb && statusCode != "REL" && statusCode != "OBS") || 
	(isem && em_current_status != "REL" && em_current_status != "OBS")) {
        $("#status-code-approval-pulldown").show();
    } else {
        $("#status-code-approval-pulldown").hide();
    }

    // Logic to determine if Set All to AUTH should be displayed
    if ((ispdb && "AUTH" && statusCode != "REL" && statusCode != "OBS"  && statusCode != "WDRN") || 
	(isem && em_current_status != "AUTH" && em_current_status != "REL" && em_current_status != "OBS" && em_current_status != "WDRN")) {
        $("#change-to-auth-button").show();
    } else {
        $("#change-to-auth-button").hide();
    }

    // -----------------------
    // Logic to determine if explicit approval button seen
    // Unless author requested status is REL and not at terminal step (HPUB/HOLD/REL/OBS/PROC) display and not set already
    var disp_approval = false;

    if (approvalType.length == 0 ||  approvalType == "unassigned") {
	if (ispdb && (authRelCode != "REL") && ["HPUB", "HOLD", "REL", "OBS", "PROC", "WDRN", "POLC"].indexOf(statusCode) == -1) {
	    disp_approval = true;
	}

	if (isem && (em_depui_depositor_hold_instructions != "REL") && ["HPUB", "HOLD", "HOLD8W", "REL", "OBS", "PROC", "WDRN", "POLC"].indexOf(em_current_status) == -1) {
	    disp_approval = true;
	}
    }

    if (disp_approval == false) {
        $("#explicit-approval-button").hide();
    } else {
        $("#explicit-approval-button").show();
    }

    // -----------------------
    // PostRelStatus
    if (postRelStatusCode.length > 0) {
        $("#postrel-pulldown").show();
        $('#postrel-status-code').val(postRelStatusCode);
    } else {
        $("#postrel-pulldown").hide();
        $('#postrel-status-code').val('');
    }

    if (authRelCode.length > 0) {
        $('#new-auth-status-code').val(authRelCode);
        //$("#auth-status-code option[value=" + authRelCode + "]").attr("selected", "selected");
    }
    if (approvalType.length > 0) {
        $('#approval-type').val(approvalType);
        //$("#approval-type option[value=" + approvalType + "]").attr("selected", "selected");
    }

    if (annotatorId.length > 0) {
        $('#annotator-initials').val(annotatorId);
    }
    if (holdCoordinatesDate.length > 0) {
        $('#new-auth-status-hold-date').val(holdCoordinatesDate);
	if (datetimeInit) {
	    // Do not invoke update until init - otherwise minview is wrong
	    $(".form_date").datetimepicker('update');
	}

    }

    if (processSite.length > 0) {
        //$("#process-site option[value=" + processSite + "]").attr("selected", "selected");
	$("#process-site").val(processSite);
    }

    // Single form
    if (em_depui_depositor_hold_instructions.length > 0) {
        $('#em_depui_depositor_hold_instructions').val(em_depui_depositor_hold_instructions);
    }

    if (em_current_status.length > 0) {
        //$("#em_current_status option[value=" + em_current_status + "]").attr("selected", "selected");
        $("#em_new_status").val(em_current_status);

    }

    if (em_map_hold_date.length > 0) {
        $('#em_map_hold_date').val(em_map_hold_date);
	// With date filled in - pickup the default date
	if (datetimeInit) {
	    // Do not invoke update until init - otherwise minview is wrong
	    $(".form_date_emdb").datetimepicker('update');
	}
    }


}

function updateStatusFormEm() {
    /*
      var em_current_status = '';
      var em_deposition_date = '';
      var em_deposition_site = '';
      var em_details = '';
      var em_last_update = '';
      var em_map_release_date = '';
      var em_replace_existing_entry_flag = '';
      var em_title = '';
    */
    logContext("+updateStatusFormEm - em_current_status " + em_current_status);

    if (em_current_status.length > 0) {
        //$("#em_current_status option[value=" + em_current_status + "]").attr("selected", "selected");
        $("#em_new_status").val(em_current_status);

    }

    if (em_replace_existing_entry_flag.length > 0) {
        //$("#em_replace_existing_entry_flag option[value=" + em_replace_existing_entry_flag + "]").attr("selected", "selected");
	$("#em_replace_existing_entry_flag").val(em_replace_existing_entry_flag);
    }

    if (em_map_release_date.length > 0) {
        $('#em_map_release_date').val(em_map_release_date);
    }

    if (em_header_release_date.length > 0) {
        $('#em_header_release_date').val(em_header_release_date);
    }

    if (em_depui_depositor_hold_instructions.length > 0) {
        $('#em_depui_depositor_hold_instructions').val(em_depui_depositor_hold_instructions);
    }

    if (em_deposition_date.length > 0) {
        $('#em_deposition_date').val(em_deposition_date);
    }

    if (em_obsoleted_date.length > 0) {
        $('#em_obsoleted_date').val(em_obsoleted_date);
    }

    if (em_last_update.length > 0) {
        $('#em_last_update').val(em_last_update);
    }

    if (em_map_hold_date.length > 0) {
        $('#em_map_hold_date').val(em_map_hold_date);
    }

    if (em_title.length > 0) {
        $('#em_title').val(em_title);
    }

    if (em_details.length > 0) {
        $('#em_details').val(em_details);
    }

    if (em_deposition_site.length > 0) {
        //$("#em_deposition_site option[value=" + em_deposition_site + "]").attr("selected", "selected");
	$("#em_deposition_site").val(em_deposition_site);
    }

    if (approvalType.length > 0) {
        $('#approval-type').val(approvalType);
        //$("#approval-type option[value=" + approvalType + "]").attr("selected", "selected");
    }

    if (annotatorId.length > 0) {
        $('#annotator-initials').val(annotatorId);
    }

    if (processSite.length > 0) {
        //$("#process-site option[value=" + processSite + "]").attr("selected", "selected");
	$("#process-site").val(processSite);
    }


}


function getCurrentContext() {
    if ((typeof startupFromService != 'undefined') && startupFromService) {
        sessionId = startupSessionId;
        entryId = startupEntryId;
        annotatorId = startupAnnotatorId;
        statusCode = startupStatusCode;
        postRelStatusCode = startupPostRelStatusCode;
        authRelCode = startupAuthRelCode;
        //
        initialDepositDate = startupInitialDepositDate;
        holdCoordinatesDate = startupHoldCoordinatesDate;
        coordinatesDate = startupCoordinatesDate;
        pdbId = startupPdbId;
        emdbId = startupEmdbId;
        //
	reqacctypes = startupAccTypes
	//
        standaloneMode = false;
	//
	wfAnnotatorId = startupWFAnnotator;
    } else {
        var myUrl = $(location).attr('href');
        pagePath = $.url(myUrl).attr('relative');
        params = $.url(myUrl).param();
        if ("sessionid" in params) {
            sessionId = params.sessionid;
        }
        if ("entryid" in params) {
            entryId = params.entryid;
            standaloneMode = false;
        } else {
            standaloneMode = true;
        }
        if ("annotatorid" in params) {
            annotatorId = params.annotatorid;
            standaloneMode = false;
        } else {
            standaloneMode = true;
        }
        if ("statuscode" in params) {
            statusCode = params.statuscode;
            standaloneMode = false;
        } else {
            standaloneMode = true;
        }

        if ("postrelstatuscode" in params) {
            postRelStatusCode = params.postrelstatuscode;
	}

        if ("authrelcode" in params) {
            authRelCode = params.authrelcode;
        }

        if ("initialdepositdate" in params) {
            initialDepositDate = params.initialdepositdate;
        }

        if ("holdcoordinatesdate" in params) {
            holdCoordinatesDate = params.holdcoordinatesdate;
        }

        if ("coordinatesdate" in params) {
            coordinatesDate = params.coordinatesdate;
        }

        if ("expmethod" in params) {
            experimentalMethods = params.expmethod;
        }

        if ("reqacctypes" in params) {
            reqacctypes = params.reqacctypes;
        }

        if ("wfannotatorid" in params) {
            wfAnnotatorId=params.wfannotatorid;
        }

        logContext("After getCurrentContext() sessionId " + sessionId + " entryId " +  entryId + " annotatorId " + annotatorId + " wfannotatorid " + wfAnnotatorId);
        logContext("After getCurrentContext() experimentalMethods " +  experimentalMethods);
    }
}



function appendContextToMenuUrls() {
    // append the current session id to menu urls

    $("fieldset legend a, ul.nav li a").attr('href', function(index, href) {
        ret = href.split("?")[0];
        if (sessionId.length > 0 ) {
            ret += (/\?/.test(ret) ? '&' : '?') + 'sessionid=' + sessionId;
        }
        if (entryId.length > 0 ) {
            ret += (/\?/.test(ret) ? '&' : '?') + 'entryid=' + entryId;
        }

        if (annotatorId.length > 0 ) {
            ret += (/\?/.test(ret) ? '&' : '?') + 'annotatorid=' + annotatorId;
        }

        if (statusCode.length > 0) {
            ret += (/\?/.test(ret) ? '&' : '?') + 'statuscode=' + statusCode;
        }

        if (postRelStatusCode.length > 0) {
            ret += (/\?/.test(ret) ? '&' : '?') + 'postrelstatuscode=' + postRelStatusCode;
        }

        if (authRelCode.length > 0) {
            ret += (/\?/.test(ret) ? '&' : '?') + 'authrelcode=' + authRelCode;
        }

        if (initialDepositDate.length > 0) {
            ret += (/\?/.test(ret) ? '&' : '?') + 'initialdepositdate=' + initialDepositDate;
        }

        if (holdCoordinatesDate.length > 0) {
            ret += (/\?/.test(ret) ? '&' : '?') + 'holdcoordinatesdate=' + holdCoordinatesDate;
        }

        if (coordinatesDate.length > 0) {
            ret += (/\?/.test(ret) ? '&' : '?') + 'coordinatesdate=' + coordinatesDate;
        }

        if (experimentalMethods.length > 0) {
            ret += (/\?/.test(ret) ? '&' : '?') + 'expmethod=' + experimentalMethods;
        }

        if (reqacctypes.length > 0) {
            ret += (/\?/.test(ret) ? '&' : '?') + 'reqacctypes=' + reqacctypes;
        }

        if (wfAnnotatorId.length > 0) {
            ret += (/\?/.test(ret) ? '&' : '?') + 'wfannotatorid=' + wfAnnotatorId;
        }
        return ret;
    });

    logContext('Update url context with pdbId  = ' + pdbId);
    logContext('Update url context with emdbId = ' + emdbId);
    logContext('Update url reqacctypes' + reqacctypes.indexOf('EMDB'));

    if (pdbId.length > 0  || standaloneModeFirst) {
        $("li.pdb-context").show();
    } else {
        $("li.pdb-context").hide();
    }

    // Not used anymore but maintain in case ever need
    if ((emdbId.length > 0 && reqacctypes.indexOf('EMDB') >= 0) || standaloneModeFirst) {
        $("li.em-context").show();
	logContext('Showing EM context');
    } else {
        $("li.em-context").hide();
	logContext('Hiding EM context ' + reqacctypes);
    }
    standaloneModeFirst = false;

}


function assignContext(jsonObj) {
    // Extract interesting attributes from input object --
    if ('sessionid' in jsonObj) {
        sessionId = jsonObj.sessionid;
    }
    if ('errorflag' in jsonObj) {
        errorFlag = jsonObj.errorflag;
    }
    if ('errortext' in jsonObj) {
        errorText = jsonObj.errortext;
    }

    if ('entryid' in jsonObj) {
        entryId = jsonObj.entryid;
    }
    if ('annotatorid' in jsonObj) {
        annotatorId = jsonObj.annotatorid;
    }

    if ('pdb_id' in jsonObj) {
        pdbId = jsonObj.pdb_id;
    }

    if ('comb_id' in jsonObj) {
        combId = jsonObj.comb_id;
    }

    if ('experimental_methods' in jsonObj) {
        experimentalMethods = jsonObj.experimental_methods;
    }

    if ('struct_title' in jsonObj) {
        structTitle = jsonObj.struct_title;
    }

    if ('statuscode' in jsonObj) {
        statusCode = jsonObj.statuscode;
    }

    if ('postrelstatuscode' in jsonObj) {
        postRelStatusCode = jsonObj.postrelstatuscode;
    }

    if ("authrelcode" in jsonObj) {
        authRelCode = jsonObj.authrelcode;
    }

    if ("initialdepositdate" in jsonObj) {
        initialDepositDate = jsonObj.initialdepositdate;
    }

    if ("holdcoordinatesdate" in jsonObj) {
        holdCoordinatesDate = jsonObj.holdcoordinatesdate;
    }

    if ("coordinatesdate" in jsonObj) {
        coordinatesDate = jsonObj.coordinatesdate;
    }

    if ("annotator_initials" in jsonObj) {
        annotatorId = jsonObj.annotator_initials;
    }

    if ("approval_type" in jsonObj) {
        approvalType = jsonObj.approval_type;
    }

    if ("process_site" in jsonObj) {
        processSite = jsonObj.process_site;
    }

    if ("reqacctypes" in jsonObj) {
        reqacctypes = jsonObj.reqacctypes;
    }

    // em items --
    if ( 'em_current_status' in jsonObj) {
        em_current_status = jsonObj.em_current_status;
    }
    if ('em_deposition_date' in jsonObj) {
        em_deposition_date = jsonObj.em_deposition_date;
    }
    if ('em_deposition_site' in jsonObj) {
        em_deposition_site = jsonObj.em_deposition_site;
    }
    if ('em_details' in jsonObj) {
        em_details = jsonObj.em_details;
    }
    if ('em_last_update' in jsonObj) {
        em_last_update = jsonObj.em_last_update;
    }
    if ('em_map_hold_date' in jsonObj) {
        em_map_hold_date = jsonObj.em_map_hold_date;
    }
    if ('em_obsoleted_date' in jsonObj) {
        em_obsoleted_date = jsonObj.em_obsoleted_date;
    }
    if ('em_map_release_date' in jsonObj) {
        em_map_release_date = jsonObj.em_map_release_date;
    }
    if ('em_header_release_date' in jsonObj) {
        em_header_release_date = jsonObj.em_header_release_date;
    }
    if ('em_depui_depositor_hold_instructions' in jsonObj) {
        em_depui_depositor_hold_instructions = jsonObj.em_depui_depositor_hold_instructions;
    }
    if ('em_replace_existing_entry_flag' in jsonObj) {
        em_replace_existing_entry_flag = jsonObj.em_replace_existing_entry_flag;
    }
    if ('em_title' in jsonObj) {
        em_title= jsonObj.em_title;
    }
    if ('emdb_id' in jsonObj) {
        emdbId = jsonObj.emdb_id;
    }
}

function clearServiceContext() {
    sessionId = '';
    entryId = '';
    annotatorId = '';
    //
    statusCode = '';
    postRelStatusCode = '';
    authRelCode = '';
    initialDepositDate = '';
    holdCoordinatesDate = '';
    coordinatesDate = '';
    experimentalMethods = '';
}

function getServiceContext() {
    // data that must be provided to any service request -
    var sc = {};
    sc.sessionid = sessionId;
    sc.entryid = entryId;
    sc.annotatorid = annotatorId;
    sc.useversion = 1;
    return sc;
}

function hideCommunicationFrame() {
    $('#status-communication-frame').addClass('displaynone');
    $('#full-page').show();
}

function progressStart() {
    $("#loading").fadeIn('slow').spin("large", "black");
}

function progressEnd() {
    $("#loading").fadeOut('fast').spin(false);
}

function updateCompletionStatus(jsonObj, statusId) {
    var errFlag = jsonObj.errorflag;
    var statusText = jsonObj.statustext;
    if (errFlag) {
        $(statusId + ' div.op-status').html('<p class="text-danger">' + statusText + '</p>');
        $(statusId + ' div.op-status').addClass('error-status');
    } else {
        $(statusId + ' div.op-status').html('<p class="text-success">' + statusText + '</p>');
        $(statusId + ' div.op-status').removeClass('error-status');
    }
    $(statusId + ' div.op-status').show();
}

// --------------------------------------------------------------------------------------------------------------
//   Appication specific options

function updateDownloadOptions(jsonObj) {
    var url;
    var el;
    var fn;
    var arr;
    var htmlS;
    if ("logfiles" in jsonObj) {
        arr = jsonObj.logfiles;
        htmlS = "";
        for (var i = 0; i < arr.length; i++) {
            fn = arr[i];
            url = "/sessions/" + sessionId + "/" + fn;
            el = '<span> &nbsp; <a href="' + url + '">' + fn + '</a> </span>'
            logContext("log file " + i + " " + el);
            htmlS += el;
        }
        if (arr.length > 0) {
            $("#download-logfiles").html(htmlS);
            $("#download-logfiles-label").html("Log files:");
            $("#download-logfiles").show();
            $("#download-logfiles-label").show();
        }
    }

}

function updateReportContent(jsonObj, contentId) {
    var retHtml = jsonObj.htmlcontent;
    var errFlag = jsonObj.errorflag;
    logContext('Updating report content  = ' + contentId);
    if (!errFlag) {
        logContext('Updating report content  with = ' + retHtml);
        logContext('Selection container ' + $(contentId).length);
        logContext('Selection report div ' + $(contentId + ' div.report-content').length);
        $(contentId + ' div.report-content').append(retHtml);
        $(contentId + ' div.report-content').show();
    }
}

function displayReportContent(jsonObj, contentId) {
    // Like updateReportContent - but display if errFlag is true - which indicates XML conversion failed. Does not append - replaces text.
    var retHtml = jsonObj.htmlcontent;
    var errFlag = jsonObj.errorflag;
    logContext('Updating report content  = ' + contentId);
    logContext('Updating report error  = ' + errFlag);
    if (errFlag) {
        logContext('Updating report content  with = ' + retHtml);
        logContext('Selection container ' + $(contentId).length);
        logContext('Selection report div ' + $(contentId + ' div.report-content').length);
        $(contentId + ' div.report-content').html(retHtml);
        $(contentId + ' div.report-content').show();
    } else {
	$(contentId + ' div.report-content').hide();
    }
}

function updateLinkContent(jsonObj, contentId) {
    var retHtml = jsonObj.htmllinkcontent;
    var errFlag = jsonObj.errorflag;
    logContext('Updating link content id = ' + contentId);
    if (retHtml.length > 0) {
        logContext('Updating link content  with = ' + retHtml);
        logContext('Selection container ' + $(contentId).length);
        logContext('Selection link div ' + $(contentId + ' div.op-links').length);
        $(contentId + ' div.op-links ').html(retHtml);
        $(contentId + ' div.op-links ').show();
    }
}

function handleCLoseWindow() {
    var inFormOrLink;
    $('a').on('click', function() {
        inFormOrLink = true;
    });
    $('form').on('submit', function() {
        inFormOrLink = true;
    });

    $(window).bind('beforeunload', function(eventObject) {
        var returnValue = undefined;
        if (!inFormOrLink) {
            returnValue = "Do you really want to close?";
        }
        eventObject.returnValue = returnValue;
        return returnValue;
    });
}

// --------------------------------------------------------------------------------------------------------------
//

$(document).ready(function() {
    getCurrentContext();
    if (sessionId.length == 0) {
        newSession('request session');
        logContext('Assigning new session id  = ' + sessionId);
    }
    //
    // This condition is not going to support both entry points -
    //
    if (!standaloneMode && entryId.length > 0) {
        getEntryInfo();
        appendContextToMenuUrls();
        updateStatusForm();
    }

    renderContext();

    //
    var myDate1 = new Date();
    var myDate2 = new Date();
    var dayOfMonth = myDate2.getDate();
    myDate2.setDate(dayOfMonth + 500);
    $(".form_date").datetimepicker({
        //      format: 'yyyy-mm-dd',
        //	startDate: '+0d',
        startDate: myDate1,
        //      endDate: '+1y',
        endDate: myDate2,
        weekStart: 1,
        //        todayBtn:  1,
        autoclose: 1,
        //        todayHighlight: 1,
        startView: 2,
        minView: 2,
        forceParse: 0
    });

    $(".form_date_emdb").datetimepicker({
        //      format: 'yyyy-mm-dd',
        //	startDate: '+0d',
        startDate: myDate1,
        //      endDate: '+1y',
        endDate: myDate2,
        weekStart: 1,
        //        todayBtn:  1,
        autoclose: 1,
        //        todayHighlight: 1,
        startView: 2,
        minView: 2,
        forceParse: 0
    });

    datetimeInit = true;


    if ($("#status-identifier-dialog").length > 0) {
        $("#subheader").html(getSubHeader());
        if (standaloneMode) {
            //
            $("#status-identifier-dialog").removeClass("displaynone");
            $("#status-update-dialog").addClass("displaynone");
            $("#status-create-files-dialog").addClass("displaynone");
            $("#status-reload-files-dialog").addClass("displaynone");
            $("#status-misc-report-dialog").addClass("displaynone");
            $("#process-site-update-dialog").addClass("displaynone");
            $('#status-set-idcode-form div.op-status').hide();

            $('#status-set-idcode-form').ajaxForm({
                url: setIdcodeUrl,
                dataType: 'json',
                success: function(jsonObj) {
                    logContext("Setting Id Code Operation completed");
                    if (jsonObj.errorflag) {
                        progressEnd();
                        $('#status-set-idcode-form div.op-status').html(jsonObj.statustext);
                        $('#status-set-idcode-form div.op-status').show();
                        $('#status-set-idcode-button').show();
                    } else {
                        updateCompletionStatus(jsonObj, '#status-set-idcode-form');
                        updateLinkContent(jsonObj, '#status-set-idcode-form');
                        updateReportContent(jsonObj, '#status-report-container');
                        $('#status-report-container  div.status-misc-content').show();
                        $("#status-identifier-dialog").addClass("displaynone");
                        assignContext(jsonObj);
                        getEntryInfo();
                        progressEnd();
                        //
                        appendContextToMenuUrls();
                        // jdw today  - already called on completion of getEntryInfo()
                        // updateStatusForm();
                        $("#status-update-dialog").removeClass("displaynone");
                        $("#status-create-files-dialog").removeClass("displaynone");
                        $("#status-reload-files-dialog").removeClass("displaynone");
                        $("#status-misc-report-dialog").removeClass("displaynone");
                        $("#process-site-update-dialog").removeClass("displaynone");
                        progressEnd();
                    }
                },
                beforeSubmit: function(arr, $form, options) {
                    $('#status-set-idcode-form div.op-status').hide();
                    $('#status-set-idcode-form div.op-links').hide();
                    $('#status-report-container  div.report-content').hide();

                    progressStart();
                    $('#status-set-idcode-button').hide();
                    arr.push({
                        "name": "sessionid",
                        "value": sessionId
                    });
                }
            });
        } else {
            $("#status-identifier-dialog").addClass("displaynone");
            $("#status-update-dialog").removeClass("displaynone");
            $("#status-create-files-dialog").removeClass("displaynone");
            $("#status-reload-files-dialog").removeClass("displaynone");
            $("#status-misc-report-dialog").removeClass("displaynone");
            $("#process-site-update-dialog").removeClass("displaynone");
        }
    }

    if ($("#status-update-dialog").length > 0) {
        // Handle change to AUTH button
        $('#change-to-auth-button').click(function() {
	    var ispdb = ispdbentry();
	    var isem = isementry();
	    if (ispdb && statusCode != "REL" && statusCode != "OBS") {
		$('#status-code').val("AUTH");
		$('#status-code2').val("AUTH");
	    }

	    if (isem && em_current_status != "REL" && em_current_status != "OBS") {
		$('#em_new_status').val("AUTH");
		$('#status-code2em').val("AUTH");
	    }

	    // Unassigned approval
	    approvalType = "unassigned";
            $('#approval-type').val(approvalType);
	    
	    // Activate status code update
	    $('#status-code-button').trigger('click');
	});

        // Handle explicit approval button
        $('#explicit-approval-button').click(function() {
	    approvalType = "explicit";
            $('#approval-type').val(approvalType);

	    // Set status code if appropriate
	    var nochange = ["HPUB", "HOLD", "REL", "OBS", "PROC", "WAIT", "WDRN", "POLC"];
	    var ispdb = ispdbentry();
	    var isem = isementry();
	    
	    if (ispdb && nochange.indexOf(statusCode) == -1) {
		// Potential change status.
		if (authRelCode != "REL") {
		    statusCode = authRelCode;
		    $('#status-code').val(statusCode);
		    $('#status-code2').val(statusCode);
		}
	    };

	    if (isem && nochange.indexOf(em_current_status) == -1) {
		// Potential change status.
		if (em_depui_depositor_hold_instructions != "REL") {
		    em_current_status = em_depui_depositor_hold_instructions;
		    $("#em_new_status").val(em_current_status);
		}
	    };


	    $('#status-code-button').trigger('click');
	});



        $("#subheader").html(getSubHeader());
        // status code update form
        $('#status-code-form').ajaxForm({
            url: statusCodeUpdateV2Url,
            dataType: 'json',
            success: function(jsonObj) {
                logContext("Operation completed");
                progressEnd();
                updateCompletionStatus(jsonObj, '#status-code-form');
                updateLinkContent(jsonObj, '#status-code-form');
                updateReportContent(jsonObj, '#status-report-container');
		displayReportContent(jsonObj, '#status-update-container');
                $('#status-report-container  div.report-content').show();
                $('#status-code-button').show();
                //JDW added
                assignContext(jsonObj);
		// To get buttons displayed
		updateStatusForm();
                $("#subheader").html(getSubHeader());

            },
            beforeSubmit: function(formdata, $form, options) {
                formdata.push({
                    "name": "sessionid",
                    "value": sessionId
                });
                formdata.push({
                    "name": "entryid",
                    "value": entryId
                });
                formdata.push({
                    "name": "idcode",
                    "value": entryId
                });
                formdata.push({
                    "name": "idcode1",
                    "value": entryId
                });
                formdata.push({
                    "name": "initialdepositdate",
                    "value": initialDepositDate
                });
                // formdata.push({
                //    "name": "holdcoordinatesdate",
                //    "value": holdCoordinatesDate
                // });
                formdata.push({
                    "name": "coordinatesdate",
                    "value": coordinatesDate
                });
                //formdata.push({
                //    "name": "authrelcode",
                //    "value": authRelCode
                //});
                formdata.push({
                    "name": "reqacctypes",
                    "value": reqacctypes
                });
		// Send back current initials - no cross form data for status history
		formdata.push({
		    "name": "cur-annotator-initials",
		    "value": annotatorId
		});



                $('#status-code-form div.op-status').hide();
                $('#status-code-form div.op-links').hide();
                $('#status-report-container  div.report-content').hide();
                progressStart();
                $('#status-code-button').hide();

            }
        });

    } // status-update-dialog


    if ($("#status-other-dialog").length > 0) {
	$('#status-other-form').ajaxForm({
            url: statusOtherUpdateUrl,
            dataType: 'json',
            success: function(jsonObj) {
                logContext("Status-other Operation completed");
                progressEnd();
                updateCompletionStatus(jsonObj, '#status-other-form');
                updateLinkContent(jsonObj, '#status-other-form');
                updateReportContent(jsonObj, '#status-report-container');
                $('#status-report-container  div.report-content').show();
                $('#status-other-button').show();
		// Parse data coming back
                assignContext(jsonObj);
                $("#subheader").html(getSubHeader());
		// Needed?
		updateStatusForm();
	    },

            beforeSubmit: function(formdata, $form, options) {
                formdata.push({
                    "name": "sessionid",
                    "value": sessionId
                });
                formdata.push({
                    "name": "idcode",
                    "value": entryId
                });
                formdata.push({
                    "name": "reqacctypes",
                    "value": reqacctypes
                });

                $('#status-other-form div.op-status').hide();
                $('#status-other-form div.op-links').hide();
                $('#status-report-container  div.report-content').hide();
                $('#status-other-button').hide();
                progressStart();
            }
        });
    }


    if ($("#status-misc-report-dialog").length > 0) {
         $("#subheader").html(getSubHeader());
        $('#status-misc-report-form').ajaxForm({
            url: statusMiscReportsUrl,
            dataType: 'json',
            success: function(jsonObj) {
                logContext("Operation completed");
                progressEnd();
                updateCompletionStatus(jsonObj, '#status-misc-report-form');
                updateLinkContent(jsonObj, '#status-misc-report-form');
                updateReportContent(jsonObj, '#status-report-container');
                $('#status-report-container  div.report-content').show();
                $('#status-misc-report-button').show();

            },
            beforeSubmit: function(formdata, $form, options) {
                formdata.push({
                    "name": "sessionid",
                    "value": sessionId
                });
                formdata.push({
                    "name": "entryid",
                    "value": entryId
                });
                formdata.push({
                    "name": "idcode",
                    "value": entryId
                });
                formdata.push({
                    "name": "idcode1",
                    "value": entryId
                });


                $('#status-misc-report-form div.op-status').hide();
                $('#status-misc-report-form div.op-links').hide();
                $('#status-report-container  div.report-content').hide();
                $('#status-misc-report-button').hide();
                progressStart();
            }
        });
    }

    if ($("#status-create-files-dialog").length > 0) {
        $('#status-create-files-form').ajaxForm({
            url: statusCreateFilesUrl,
            dataType: 'json',
            success: function(jsonObj) {
                logContext("Operation completed");
                progressEnd();
                updateCompletionStatus(jsonObj, '#status-create-files-form');
                updateLinkContent(jsonObj, '#status-create-files-form');
                updateReportContent(jsonObj, '#status-report-container');
                $('#status-report-container  div.report-content').show();
                $('#status-create-files-button').show();

            },
            beforeSubmit: function(formdata, $form, options) {
                formdata.push({
                    "name": "sessionid",
                    "value": sessionId
                });
                formdata.push({
                    "name": "entryid",
                    "value": entryId
                });
                formdata.push({
                    "name": "idcode",
                    "value": entryId
                });
                $('#status-create-files-form div.op-status').hide();
                $('#status-create-files-form div.op-links').hide();
                $('#status-report-container  div.report-content').hide();
                $('#status-create-files-button').hide();
                progressStart();
            }
        });
    }

   if ($("#status-reload-files-dialog").length > 0) {
        $('#status-reload-files-form').ajaxForm({
            url: statusReloadUrl,
            dataType: 'json',
            success: function(jsonObj) {
                logContext("Operation completed");
                progressEnd();
                updateCompletionStatus(jsonObj, '#status-reload-files-form');
                $('#status-reload-files-button').show();

            },
            beforeSubmit: function(formdata, $form, options) {
                formdata.push({
                    "name": "sessionid",
                    "value": sessionId
                });
                formdata.push({
                    "name": "entryid",
                    "value": entryId
                });
                formdata.push({
                    "name": "idcode",
                    "value": entryId
                });
                $('#status-reload-files-form div.op-status').hide();
                $('#status-reload-files-button').hide();
                progressStart();
            }
        });
    }

 if ($("#process-site-update-dialog").length > 0) {
        $('#process-site-update-form').ajaxForm({
            url: processSiteUpdateUrl,
            dataType: 'json',
            success: function(jsonObj) {
                logContext("Operation completed");
                progressEnd();
                updateCompletionStatus(jsonObj, '#process-site-update-form');
                $('#process-site-update-button').show();

            },
            beforeSubmit: function(formdata, $form, options) {
                formdata.push({
                    "name": "sessionid",
                    "value": sessionId
                });
                formdata.push({
                    "name": "entryid",
                    "value": entryId
                });
                formdata.push({
                    "name": "idcode",
                    "value": entryId
                });
                $('#process-site-update-form div.op-status').hide();
                $('#process-site-update-button').hide();
                progressStart();
            }
        });
    }

    // Coordinate merge and other task operations
    if ($("#task-dialog").length > 0) {
        if (entryId.length > 0) {
            $("#task-alt-dialog").html("Annotating entry: " + entryId);
            $("#task-alt-dialog").show();
            $("#task-dialog").show();
            $('#merge-xyz-task-form').ajaxForm({
                url: statusMergeXyzUrl,
                dataType: 'json',
                success: function(jsonObj, statusText, xhr, $form) {
                    var formId = "#" + $form.attr('id');
                    logContext("Operation completed");
                    progressEnd();
                    updateCompletionStatus(jsonObj, formId);
                    updateLinkContent(jsonObj, formId);
                    $(formId + ' fieldset input.my-task-form-submit ').show();
                },
                beforeSubmit: function(formdata, $form, options) {
                    formdata.push({
                        "name": "sessionid",
                        "value": sessionId
                    });
                    formdata.push({
                        "name": "entryid",
                        "value": entryId
                    });
                    var formId = "#" + $form.attr('id');
                    $(formId + ' fieldset div.my-task-form-status').hide();
                    $(formId + ' fieldset div.my-task-form-links ').hide();
                    $(formId + ' fieldset input.my-task-form-submit ').hide();
                    progressStart();
                }
            });
        } else {
            $("#task-dialog").hide();
            $("#task-alt-dialog").html("No active entry");
            $("#task-alt-dialog").show();
        }
    }


    //communication  operations - non-instant selection
    if ($("#status-communication-dialog").length > 0) {
        $('#status-communication-button').click(function() {
            var serviceData = getServiceContext();

	    // If wfAnnotatorId is set - use it - otherwise annotator of entry
	    var ann = annotatorId;
            if (wfAnnotatorId.length > 0) {
		ann = wfAnnotatorId;
	    };
            url = "/service/messaging/new_session/wf?filesource=archive&embed=true&identifier=" + entryId +  '&annotator=' + ann +
                 '&expmethod=' + experimentalMethods;
            $("#page-top").html('');
            $("#page-top").hide();
            $("#status-communication-frame").attr("src", url).removeClass("displaynone");
            $("#status-communication-frame").height(800);
        });

    }

    // communication  operations - instant open message
    if ($("#status-communication-instant-dialog").length > 0) {
        var serviceData = getServiceContext();

	// If wfAnnotatorId is set - use it - otherwise annotator of entry
	var ann = annotatorId;
        if (wfAnnotatorId.length > 0) {
	    ann = wfAnnotatorId;
	};
        url = "/service/messaging/new_session/wf?filesource=archive&embed=true&identifier=" + entryId + '&annotator=' + ann +
                     '&expmethod=' + experimentalMethods;
        logContext('communication instant url = ' + url);
        $("#page-top").html('');
        $("#page-top").hide();
        $("#status-communication-frame").attr("src", url).removeClass("displaynone");
        $("#status-communication-frame").height(800);
        logContext('communication instant done for ' + entryId);
    }

    // em status update  operations
    if ($("#status-identifier-em-dialog").length > 0) {
        if (standaloneMode) {
            //
            $("#status-identifier-em-dialog").removeClass("displaynone");
            $("#status-update-em-dialog").addClass("displaynone");
            $('#status-set-idcode-em-form div.op-status').hide();

            $('#status-set-idcode-em-form').ajaxForm({
                url: setIdcodeEmUrl,
                dataType: 'json',
                success: function(jsonObj) {
                    logContext("Setting Id Code Operation completed");
                    if (jsonObj.errorflag) {
                        progressEnd();
                        $('#status-set-idcode-em-form div.op-status').html(jsonObj.statustext);
                        $('#status-set-idcode-em-form div.op-status').show();
                        $('#status-set-idcode-em-button').show();
                    } else {
                        updateCompletionStatus(jsonObj, '#status-set-idcode-em-form');
                        updateLinkContent(jsonObj, '#status-set-idcode-em-form');
                        //updateReportContent(jsonObj, '#status-report-container');
                        //$('#status-report-container  div.status-misc-content').show();
                        $("#status-identifier-em-dialog").addClass("displaynone");
                        assignContext(jsonObj);
                        getEntryInfo();
                        progressEnd();
                        //
                        appendContextToMenuUrls();
                        // jdw today  - already called on completion of getEntryInfo()
                        // updateStatusForm();
                        $("#status-update-em-dialog").removeClass("displaynone");
                        progressEnd();
                    }
                },
                beforeSubmit: function(arr, $form, options) {
                    $('#status-set-idcode-em-form div.op-status').hide();
                    $('#status-set-idcode-em-form div.op-links').hide();

                    progressStart();
                    $('#status-set-idcode-em-button').hide();
                    arr.push({
                        "name": "sessionid",
                        "value": sessionId
                    });
                }
            });
        } else {
            $("#status-identifier-em-dialog").addClass("displaynone");
            $("#status-update-em-dialog").removeClass("displaynone");
        }
    }

    if ($("#status-update-em-dialog").length > 0) {
        $("#subheader").html(getSubHeaderEm());
        <!-- status code update form -->
        $('#status-code-em-form').ajaxForm({
            url: statusCodeUpdateEmUrl,
            dataType: 'json',
            success: function(jsonObj) {
                logContext("Operation completed");
                progressEnd();
                updateCompletionStatus(jsonObj, '#status-code-em-form');
                updateLinkContent(jsonObj, '#status-code-em-form');
		displayReportContent(jsonObj, '#status-update-container');
                $('#status-code-em-button').show();
                assignContext(jsonObj);
                $("#subheader").html(getSubHeaderEm());
                // add this dynamic update
                updateStatusFormEm();
            },
            beforeSubmit: function(formdata, $form, options) {
                formdata.push({
                    "name": "sessionid",
                    "value": sessionId
                });
                formdata.push({
                    "name": "entryid",
                    "value": entryId
                });
                formdata.push({
                    "name": "idcode",
                    "value": entryId
                });
                formdata.push({
                    "name": "idcode1",
                    "value": entryId
                });
                formdata.push({
                    "name": "initialdepositdate",
                    "value": initialDepositDate
                });
                formdata.push({
                    "name": "holdcoordinatesdate",
                    "value": holdCoordinatesDate
                });
                formdata.push({
                    "name": "coordinatesdate",
                    "value": coordinatesDate
                });
                formdata.push({
                    "name": "authrelcode",
                    "value": authRelCode
                });

                $('#status-code-em-form div.op-status').hide();
                $('#status-code-em-form div.op-links').hide();
                progressStart();
                $('#status-code-em-button').hide();

            }
        });

    }
    <!-- make the nav item for the current page active -->

    $('.nav a[href="' + pagePath + '"]').parent().addClass('active');
    handleCLoseWindow();

}); // end-ready
