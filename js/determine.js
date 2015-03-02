/* List of CatalogueEntry objects.
 * Load from master XML once on page load
 */
var catalogue;

function CatalogueEntry(courseNum, courseTitle, courseGroup, track, courseDescrip, prereqList, coreqList) {
	this.courseNum = courseNum;
	this.courseTitle = courseTitle;
	this.courseGroup = courseGroup ? courseGroup : "D";
	this.track = track ? track : "Other";
	this.courseDescrip = (typeof courseDescrip == 'undefined' || courseDescrip == null) ? "": courseDescrip + "<br>";
	this.prereqList = (typeof prereqList == 'undefined' || prereqList == null) ? new Array(): prereqList;
	this.coreqList = (typeof coreqList == 'undefined' || coreqList == null) ? new Array(): coreqList;
	// this.prereqList = new Array();
	// this.coreqList = new Array();
};

/* Integer of number of total courses needed for valid schedule
 */
var totalNeeded;

/* Dictionary in the form {courseGroup: minNeeded, ...} */
var courseGroups;

var defaultNumYears;

var genericDNum;
var genericDTitle;
var genericDDescrip;

var defaultDCount;

var genericDIndex;

function initCatalogue() {
	$.ajax({
		async: false,
		url:"data/settings.json",
		success: function (result) {
			totalNeeded = result.totalNeeded;
			courseGroups = result.courseGroups;
			defaultInfoTitle = result.defaultInfoTitle;
			defaultInfoDescrip = result.defaultInfoDescrip;
			genericDNum = result.genericDNum;
			genericDTitle = result.genericDTitle;
			genericDDescrip = result.genericDDescrip;
			defaultDCount = result.defaultDCount;
			defaultNumYears = result.defaultNumYears;
		}
	});
	
	// Generic D
	catalogue = new Array();
	catalogue.push(new CatalogueEntry(genericDNum, genericDTitle,'D', "Default", genericDDescrip));
	genericDIndex = catalogue.length-1;

	$.ajax({
		async: false,
		url:"data/catalogue.json",
		success: function (result) {
			for (var i = 0; i < result.length; i++) {
				if (result[i].show == "true") {
					newEntry = new CatalogueEntry(
							result[i].courseNum,
							result[i].courseTitle,
							result[i].courseGroup,
							result[i].track,
							result[i].courseDescrip,
							result[i].prereqList,
							result[i].coreqList
						);
					catalogue.push(newEntry);
				}
			};

		}
	});
}

var _groupDSelectHTML;
function groupDSelectHTML(uid) {
	if (typeof _groupDSelectHTML != "undefined") {
		return _groupDSelectHTML;
	}

	var tracks = {};
	for (var i = 0; i < catalogue.length; i++) {
		if (catalogue[i].courseGroup == 'D') {
			var t = typeof catalogue[i].track !== "undefined" ? catalogue[i].track : "Other";
			if (tracks[t] == undefined) {
				tracks[t] = [i];
			} else {
				tracks[t].push(i);
			}
		}
	};
	var s = "<select id='" + uid +"-select' onchange='groupDSelect(this.id, this.value)'>\n";
	for (var i in tracks) {
		// console.log(i);
		if (tracks.hasOwnProperty(i)) {
			s += "<optgroup label = '" + i + "'>\n"; 
			for (var j = 0; j < tracks[i].length; j++) {
				s += "<option value= '" + tracks[i][j] + "'>" + catalogue[tracks[i][j]].courseNum + "</option>";
			};
			s += "</optgroup>";
		}
	}

	s += "</select>\n";
	return s;
}

function groupDSelect(uid, val) {
	// console.log(el[el.selectedIndex].id+ "selected catalogue num " + el[el.selectedIndex].value);
	uid = uid.replace("-select", "");
	schedule[uid].catalogueIndex = val;
	lastSelected = -1;
	selectClass(uid);
}

function moreInfoLinkText(courseNum) {
	
	return 	"<a href='http://www.bu.edu/academics/cas/courses/cas-cs-" + courseNum + "' target='_blank'>" + 
			"Full Description & Current Schedule</a>" +
			"<img src='img/share.png'>";
	
}

/***********************************************/


/* List of ScheduleEntry objects.
 * 		Represents all class objects on the screen
 * Optional load from saved schedule XML.
 * Blank upon Reset
 * 
 */
var schedule;

function ScheduleEntry(catalogueIndex, isTaking, semester, position) {
	this.catalogueIndex = catalogueIndex;
	this.isTaking = typeof isTaking !== 'undefined' ? isTaking: false;;
	this.semester = typeof semester !== 'undefined' ? semester: "-1";
	this.uniqueClassID = getUniqueClassID();
	this.position = typeof position !== 'undefined' ? position: {};

	this.getCourseNum = function() {
		return catalogue[this.catalogueIndex].courseNum;
	}
	this.getClassTitle = function() {
		return catalogue[this.catalogueIndex].courseTitle;
	}
	this.getClassGroup = function() {
		return catalogue[this.catalogueIndex].courseGroup;
	}

	
}

/* Unique ID's for ScheduleEntry objectss
 * Enables duplicate classes with same title
 * Corresponds to ID's of UI class objects
 */
var uniqueClassIDCounter;

function getUniqueClassID() {
	return uniqueClassIDCounter++;
}

function resetUniqueClassID() {
	uniqueClassIDCounter = 0;
}

/* Eventually should read from XML document */
function initSchedule() {
	uniqueClassIDCounter = 0;
	
	schedule = [];
	for (var i = 0; i < catalogue.length; i++) {
		if (catalogue[i].courseGroup != 'D') {
			schedule.push(new ScheduleEntry(i));
		}
		
		if (catalogue[i].courseNum == genericDNum) {
			for (var j = 0; j < defaultDCount; j++) {
				schedule.push(new ScheduleEntry(i));
			};
		}
	};
}

function initMap(groupName) {
	$("#total-container .score-container .tally-denom").html(totalNeeded);

	for (var i = 0; i < defaultNumYears; i++) {
		generateYear();
	};

	if (typeof groupName !== "undefined") {
		$("#bank-" + groupName + " .bank-content").empty();
	}
	for (var i = 0; i < schedule.length; i++) {
		if (typeof groupName !== "undefined" && schedule[i].getClassGroup() != groupName) {
			continue;
		}

		var name = schedule[i].getCourseNum();
		var container = $("#bank-" + schedule[i].getClassGroup() + " .bank-content");
		if (typeof container !== "undefined") {
			var inner = schedule[i].getClassGroup() != 'D' ? schedule[i].getCourseNum() : groupDSelectHTML(i);
			container.append(
				"<div class='class draggable' id='" + schedule[i].uniqueClassID + "' onclick=selectClass(this.id)>" + 
				inner +
				"</div>");
			// .hide().
			// fadeIn(1000);
		}
	}
	initDrag();
}

function styleMap() {
	$("#semester-0-container td.semester").css("background-color", "#F6F6F6");
	$("#schedule tr.schedule-content-row:even td.semester").css("background-color", "#F6F6F6");
	setYearNames();
}

function setYearNames() {
	var start = $("#spinner-start-year").val();
	$(".year-name").each(function(i) {
		$(this).html(addToYear(start, i));
		// $(this).hide().html(addToYear(start, i)).fadeIn("fast");
	});
}

function incrementYear(yearStr) {
	vals = yearStr.split("-");
	return (++vals[0]) + "-" + (++vals[1])
}

function addToYear(yearStr, incr) {
	vals = yearStr.split("-");
	return (vals[0]*1+incr) + "-" + (vals[1]*1+incr)
}

/* Add or remove a class from the schedule */
function updateSchedule(uniqueClassID, isTaking, semester) {
	if (typeof semester == 'undefined') {
		semester = "-1";
	}

	for (var i = 0; i < schedule.length; i++) {
		if (schedule[i].uniqueClassID == uniqueClassID) {
			schedule[i].isTaking = isTaking;
			schedule[i].semester = semester;
			break;
		}
	};

	updateMap();
}

function updateMap() {
	// Generate blank tally with 0's for each group
	tally = {};
	for (g in courseGroups) {
		tally[g] = 0;
	}

	// Loop through schedule
	for (var i in schedule) {
		var c = schedule[i];
		if (c.isTaking) {
			tally[c.getClassGroup()] += 1;
		}
		// tally[c.courseGroup] += c.numTaking;
	}

	// console.log("tally:");
	// console.log(tally);

	// Result strings to be printed 
	var report = [];

	var totalTaking = 0;
	var minTotal = 0;
	var offset = 0;
	var needD = totalNeeded - minTotal - offset;

	// Loop through class group
	// var _courseGroups = {'A':5, 'B':2, 'C':2, 'D': needD};
	for (var g in courseGroups) {
		// Update each tally
		var id = 'tally-' + g;
		document.getElementById(id).textContent = tally[g];

		// Update bank properties
		var id = 'bank-' + g;
		var bank = document.getElementById('bank-' + g);
		if (tally[g] >= courseGroups[g]) {
			// console.log(g + " is satisfied");
			// console.log("tally " + g + " : " + tally[g])
			bank.classList.add('-satisfied');
			bank.classList.remove('-unsatisfied');
			report.push("Group " + g + ": Satisfied (Taking " + tally[g] + " classes)");
		}
		else {
			// console.log(g + " is not satisfied");
			bank.classList.add('-unsatisfied');
			bank.classList.remove('-satisfied');
			report.push("Group " + g + ": Add at least " + (courseGroups[g] - tally[g]) + " more classes");
		}		
		
		// Increment count of total classes taken
		totalTaking += tally[g];

		if (g != 'D') {
			minTotal += courseGroups[g];
			if (tally[g] > courseGroups[g]) {
				offset += (tally[g] - courseGroups[g]);
			}

			needD = totalNeeded - minTotal - offset;
			courseGroups['D'] = needD;
			document.getElementById("need-D").textContent = needD;
			// console.log("courseGroups['D']: " + courseGroups['D']);
		}
	}

	// Check & Update Totals
	document.getElementById("tally-total").textContent = totalTaking;
	var total = document.getElementById("total-container");
	if (totalTaking < totalNeeded) {
		report.push("Total:\tAdd at least " + (totalNeeded - totalTaking) + " more classes");
		total.classList.add('-unsatisfied');
		total.classList.remove('-satisfied');
	}
	else {
		report.push("Total:\tSatisfied. (Taking " + totalTaking + " classes)");	
		total.classList.add('-satisfied');
		total.classList.remove('-unsatisfied');
	}

	updateMissingRequirements();

	if (lastSelected) {
		updateInfo(lastSelected);
	}

	return;
	// // Print Report
	// report_html = "";
	// for (var i = 0; i < report.length; i++) {
	// 	report_html += "<li>" + report[i] + "</li>";
	// };

	// document.getElementById("report-list").innerHTML = report_html;
}

/* Global state of missing requirements
 * Recreated at each updateMap(), accessed by updateInfo()
 */
var missingRequirements;
function updateMissingRequirements() {
	// Check Prereqs & Coreqs
	missingRequirements = {};
	for (var i = 0; i < schedule.length; i++) {
		if (schedule[i].semester >= 0) {
			missingRequirements[schedule[i].getCourseNum()] = {"semester":schedule[i].semester,
															  "prereqList":catalogue[schedule[i].catalogueIndex].prereqList,
															  "coreqList":catalogue[schedule[i].catalogueIndex].coreqList };
		}
	};
	$.each(missingRequirements, function (course, info) {
		// Prerequistes
		var missing = new Array();
		// console.log("-----------\ncalculating missing requirements for " + course);
		$.each(info.prereqList, function (i, prereq) {
			if (typeof missingRequirements[prereq] == 'undefined') {
				missing.push(prereq);
				// console.log("\ttypeof mr[prereq] is undefined. pushing " + prereq + " to missing.")
			} else {
				if (Number(missingRequirements[prereq].semester) >= Number(info.semester)) {
					missing.push(prereq);
					// console.log("\tmr[prereq].semester (" + missingRequirements[prereq].semester + ") >= info.semester (" + info.semester +"). pushing " + prereq + " to missing.");
					// console.log("\t\t" + typeof missingRequirements[prereq].semester);
					// console.log("\t\t" + typeof info.semester);
				}
			}
		});
		info["missingPrereqList"] = missing;

		// Corequisites
		var missing = new Array();
		$.each(info.coreqList, function (i, coreq) {
			if (typeof missingRequirements[coreq] == 'undefined') {
				missing.push(coreq);
				// console.log("   " + coreq + " is missing for " + course)
			} else {
				if (Number(missingRequirements[coreq].semester) > Number(info.semester)) {
					missing.push(coreq);
				}
			}
		});
		info["missingCoreqList"] = missing;
	});

	$.each(schedule, function (i, s) {
		$("#" + s.uniqueClassID).removeClass("invalid");
		$("#" + s.uniqueClassID).removeClass("valid");
		var n = s.getCourseNum();
		var valid = true;
		if (n in missingRequirements) {
			if (missingRequirements[n].missingPrereqList.length > 0 || missingRequirements[n].missingCoreqList.length > 0) {
				$("#" + s.uniqueClassID).addClass("invalid");
				valid = false;
			}
		}
		if (valid && Number(s.semester) >= 0) {
			$("#" + s.uniqueClassID).addClass("valid");
		}
	});
}

function showHiddenMenu(menu) {
	// if ($("#" + menu).is(":visible")) {
	// 	return;
	// }
	$("#hidden-menu-container div:not(#" + menu + "):visible").slideToggle("fast");
	$("#" + menu).slideToggle("fast");
}

function resetAll() {
	for (var i in schedule) {
		resetPos(schedule[i].uniqueClassID);
	}

	while (yearCount > defaultNumYears) { removeYear(); }
	while (yearCount < defaultNumYears) { generateYear(); }



	initSchedule();
	initSpinner();
	setYearNames();
	updateMap();

	$("#bank-D .class select").val(genericDIndex);
}

function removeClass(uniqueClassID) {
	resetPos(uniqueClassID);
	updateSchedule(uniqueClassID, false);
}

function resetPos(elemId) {
	$("#" + elemId).animate({left: 0, top: 0});
}

function resetGroup(groupName) {
	for (var i in schedule) {
		if (schedule[i].getClassGroup() == groupName) {
			removeClass(schedule[i].uniqueClassID);
		}
	}
	if (groupName == "D") {
		$("#bank-D .class select").val(genericDIndex);
	}
}

$(document).mousedown(function(e) {
	if ($(e.target).closest('.draggable, #info-container').length === 0) {
		selectClass(-1);
	}
	// if ($(e.target).closest('#download-schedule-container').length === 0) {
	// 	$("#name-missing-error").css("visibility", "hidden");
	// }
});

$(".draggable").mouseenter(function () {
	// console.log("mouseenter:" + this);
	if (this.id != lastSelected) {
		updateInfo(this.id);
	}
});

$(".draggable").mouseleave(function () {
	// console.log("mouseleave:" + this);
	if (this.id != lastSelected) {
		updateInfo(lastSelected);
	}
});

var defaultInfoTitle;
var defaultInfoDescrip;

var lastSelected;
function selectClass(uid) {
	if (uid != lastSelected) {
		updateMissingRequirements();
		updateInfo(uid);
		lastSelected = uid;
	}
}

function updateInfo(uid) {
	// console.log(uid + " is selected");
	if (uid == -1) {
		$("#info-title").hide().html(defaultInfoTitle).fadeIn("fast");
		// $("#info-descrip").html("<p>" + defaultInfoDescrip + "</p>");
		$("#info-descrip").hide().html(defaultInfoDescrip).fadeIn("fast");
		$("#info-prereq-list, #info-coreq-list").empty();
		$("#info-prereq-container, #info-coreq-container, #info-additional").hide();
	} else {
		// $("#info-prereq-list, #info-coreq-list").empty();
		// $("#info-prereq-list, #info-coreq-list").hide();
		$("#info-prereq-container, #info-coreq-container").hide();
		$("#info-prereq-container, #info-coreq-container").hide();
		var i = schedule[uid].catalogueIndex;
		$("#info-title").hide().html("CS " + catalogue[i].courseNum + ": " + catalogue[i].courseTitle + "").fadeIn("fast");
		// $("#info-descrip").hide().html(catalogue[i].courseDescrip + moreInfoLinkText(catalogue[i].courseNum)).fadeIn("fast");
		var descrip = "<em>" + catalogue[i].courseDescrip + "</em>";
		if (i != genericDIndex) {
			descrip += moreInfoLinkText(catalogue[i].courseNum);
		}
		$("#info-descrip").hide().html(descrip).fadeIn("fast");
		// $("#info-prereq-container, #info-coreq-container").fadeIn("fast");

		var courseNum = schedule[uid].getCourseNum();
		// console.log("in updateInfo(): uid = " + uid + ", courseNum = " + courseNum);
		if (catalogue[i].prereqList.length > 0) {
			$("#info-prereq-container").fadeIn("fast");
			var prereq = "";
			$.each(catalogue[i].prereqList, function (i, p) {
				if (schedule[uid].semester < 0) {
					prereq += "<span>";
				} else if (courseNum in missingRequirements && missingRequirements[courseNum].missingPrereqList.indexOf(p) >= 0) {
					prereq += "<span class='invalid'>";
				} else {
					prereq += "<span class='valid'>";
				}
				prereq += "CS" + p + "</span>; ";
			});
			$("#info-prereq-list").hide().html(prereq).fadeIn("fast");
		} else {
			$("#info-prereq-list").empty();
			$("#info-prereq-container").hide();
		}

		if (catalogue[i].coreqList.length > 0) {
			$("#info-coreq-container").fadeIn("fast");
			var coreq = "";
			$.each(catalogue[i].coreqList, function (i, p) {
				if (schedule[uid].semester < 0) {
					coreq += "<span>";
				} else if (courseNum in missingRequirements && missingRequirements[courseNum].missingCoreqList.indexOf(p) >= 0) {
					coreq += "<span class='invalid'>";
				} else {
					coreq += "<span class='valid'>";
				}
				coreq += "CS" + p + "</span>; ";
			});
			$("#info-coreq-list").hide().html(coreq).fadeIn("fast");
		} else {
			$("#info-coreq-list").empty();
			$("#info-coreq-container").hide();
		}

		$("#info-additional").hide().html("(Be sure to check the official course page or ask the professor for the most accurate requisites.)").fadeIn("fast");
		
		// var coreq;
		// if (catalogue[i].coreqList.length > 0) {
		// 	coreq = catalogue[i].coreqList.join(", ");
		// 	$("#info-coreq-list").html(coreq);
		// } else {
		// 	$("#info-coreq-list").empty();
		// 	$("#info-coreq-container").hide();
		// }


		/* Create a new obj
			add all things to it.
			compare to current info-container
			if same, ditch
				else replace obj


		*/

		
	}
}

var yearCount = 0;
var semesterCount = 0;
function generateYear() {
	$("#schedule tr:last")
		.after(
			"<tr class='schedule-content-row' data-year='" + (++yearCount) + "'>" + 
				"<td class='semester-row-title'>" +
					// "Y" + "<span class='semester-row-title-inner'>" + (++yearCount) + "</span>" +
					// "Y" + yearCount + "<br>2014-15" +
					"<span class='year-count-container'>Y" + "<span class='year-count'>" + yearCount + "</span></span><div class='year-name'><div>" +
				"</td>" +
				"<td class='semester semester-fall' id='semester-" + (++semesterCount) + "' data-semester='" + (semesterCount) + "'>" +
					"<div class=semester-inner></div></td>" +
				"<td class='semester semester-spring' id='semester-" + (++semesterCount) + "' data-semester='" + (semesterCount) + "'>" +
					"<div class=semester-inner></div></td>" +
				"<td class='semester semester-summer' id='semester-" + (++semesterCount) + "' data-semester='" + (semesterCount) + "'>" +
					"<div class=semester-inner></div></td>" +
			"</tr>");

	if (yearCount > 1) {
		$("#remove-year").prop('disabled', false);
	}

	initDrag();
	styleMap();
}

function removeYear() {
	// if (yearCount < 2) {
	// 	return;
	// }
	yearCount += -1;
	semesterCount += -3;
	$("#schedule tr:last").remove();
	for (var i = 0; i < schedule.length; i++) {
		if (schedule[i].semester > semesterCount) {
			removeClass(schedule[i].uniqueClassID);
		}
	};

	if (yearCount < 2) {
		$("#remove-year").prop('disabled', true);
	}

	initDrag();
	styleMap();
}

// function SavedScheduleEntry(courseNum, isTaking, semester, )

var savedSchedule;

function saveSchedule() {
	var f = {};

	for (var i = 0; i < schedule.length; i++) {
		schedule[i].position["left"] = $("#" + schedule[i].uniqueClassID).css("left");
		schedule[i].position["top"] = $("#" + schedule[i].uniqueClassID).css("top")
	};

	f['yearCount'] = yearCount;
	f['schedule'] = schedule;
	f['startYear'] = $("#spinner-start-year").val();
	f['nameText'] = $("#name-text").val();

	savedSchedule = f;
	// return f;
}

function loadSchedule() {
	resetUniqueClassID();
	var f = savedSchedule;
	// console.log(yearCount);
	// console.log(f.yearCount);
	while (yearCount < f.yearCount) {
		generateYear();
	}
	while (yearCount > f.yearCount) {
		removeYear();
	}

	schedule = [];
	for (var i = 0; i < f.schedule.length; i++) {
		var s = f.schedule[i];
		schedule.push(new ScheduleEntry(s.catalogueIndex, s.isTaking, s.semester, s.position));
	};

	for (var i = 0; i < schedule.length; i++) {
		// $("#" + schedule[i].uniqueClassID).css("left", schedule[i].position["left"]);
		// $("#" + schedule[i].uniqueClassID).css("top", schedule[i].position["top"]);
		if (schedule[i].getClassGroup() == 'D') {
			$("#" + schedule[i].uniqueClassID + " select").val(schedule[i].catalogueIndex);
		}

		$("#" + schedule[i].uniqueClassID).animate({
			left: schedule[i].position["left"],
			top: schedule[i].position["top"]
		}, 500, function() {
			updateMap();
		});
	};

	$("#spinner-start-year").val(f.startYear);
	$("#name-text").val(f.nameText);
	setYearNames();

	updateMap();
}

function initUploadForm() {
	var form = document.getElementById('upload-form');
	var userfile = document.getElementById('userfile');
	var uploadButton = document.getElementById('upload-button');

	form.onsubmit = function(event) {
		// console.log("form onsubmit init");
		event.preventDefault();
		// Get the selected files from the input.
		var files = userfile.files;
		// Create a new FormData object.
		var formData = new FormData();
		// Loop through each of the selected files.
		for (var i = 0; i < files.length; i++) {
			var file = files[i];
			// // Check the file type.
			// if (!file.type.match('image.*')) {
			// 	continue;
		 //  }
			formData.append('userfile', file, file.name);
		}

		// console.log(formData);
		if (formData) {
		  $.ajax({
			url: "php/upload.php",
			type: "POST",
			data: formData,
			processData: false,
			contentType: false,
			success: function (res) {
				$("#upload-form")[0].reset();
				var newsched = JSON.parse(res);
				// console.log("UPLOAD SUCCESS");
				// console.log(newsched);
				savedSchedule = newsched;
				loadSchedule();
				showHiddenMenu();
			}
		  });
		}
	}
}

function initURLLoadForm() {
	var form = document.getElementById('load-from-url-form');
	var uploadButton = document.getElementById('load-from-url-button');

	form.onsubmit = function(event) {
		event.preventDefault();
		// console.log("url load init");
		var url = $("#load-from-url-text").val();
		var formData = new FormData();
		formData.append("url", url);

		if (formData) {
		  $.ajax({
			url: "php/loadfromurl.php",
			type: "POST",
			data: formData,
			processData: false,
			contentType: false,
			success: function (res) {
				// console.log(res);
				$("#load-from-url-form")[0].reset();
				var newsched = JSON.parse(res);
				// console.log("UPLOAD SUCCESS");
				// console.log(newsched);
				savedSchedule = newsched;
				loadSchedule();
				showHiddenMenu();
			}
		  });
		}
	}

}

function downloadSched() {
	var name = $("#name-text").val();
	name = name.replace(/[^\w\s]/gi, '')
	name = name.trim();
	name = name.replace(/\s{2,}/g, ' ');
	name = name.replace(/ /g,"_");

	if (name.length < 1) {
		$("#name-missing-error").css("visibility", "visible")
		return;
	}

	$("#name-missing-error").css("visibility", "hidden");
	saveSchedule();
	var sched = JSON.stringify(savedSchedule);
	var formData = new FormData();
	formData.append("file", sched);
	
	var r = Math.floor(Math.random() * 100000);
	formData.append("rand", r);

	$.ajax({
		type: "POST",
		url: "php/genfile.php",
		data: formData,
		processData: false,
		contentType: false,
		success: function (res) {
			// console.log("downloadSched ajax success");
			// console.log(res);
			window.location = 'php/download.php?rand=' + r + '&name=' + name;
		}
	});
}

function check(event) {
	// console.log("check called");
	// console.log(event);
	// console.log(event.checked)
	updateSchedule(event.name, event.checked);
}

function test() {
	// console.log(schedule);
	// console.log(totalNeeded);
	// console.log(courseGroups);
	updateSchedule('112', true);
	updateSchedule('330', true);
	// console.log(schedule);
}



document.addEventListener("DOMContentLoaded", function (event) {
	initCatalogue();
	initSchedule();
	initMap();
	initSpinner();
	styleMap();
	resetAll();
	selectClass(-1);
	initUploadForm();
	initURLLoadForm();
});


// function hasClass(element, cls) {
//     return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
// }

















