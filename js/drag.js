function initDrag() {
	$(".draggable").draggable({
		addClasses: false,
		cursor: "move",
		revert: "invalid",
		containment: $("#main"),
		zIndex: 100,
		// snap: true,	
		// snap: ".semester",
		snap: ".semester-inner",
		snapMode: "inner",
		snapTolerance: 35,
		start: function(event, ui) {
			selectClass(event.target.id);
		}
	});

	$("#rightcol").droppable({
		accept: ".draggable",
		drop: function (event, ui) {
			removeClass(ui.draggable.attr("id"));
		}
	});

	$(".semester").droppable({
		accept: ".draggable",
		activate: function(event, ui) {
			event.target.classList.add('-drop-possible');
	        document.getElementById("schedule").classList.add('-drop-possible');
		},
		deactivate: function(event, ui) {
			event.target.classList.remove('-drop-possible');
	        event.target.classList.remove('-drop-over');
	        document.getElementById("schedule").classList.remove('-drop-possible');
		},
		over: function (event, ui) {
			event.target.classList.add('-drop-over');
		},
		out: function (event, ui) {
			event.target.classList.remove('-drop-over');
		},
		drop: function(event, ui) {
			// console.log(ui.draggable.attr("id") + " dropped in " + event.target.id);
			// console.log(event.target.getAttribute('data-semester'));
			updateSchedule(ui.draggable.attr("id"), true, event.target.getAttribute('data-semester'));
		}
	});
}

function initSpinner() {
	$.widget( "ui.yrspinner", $.ui.spinner, {
	    // _format: function( value ) { return value + '%'; },
	    _format: function( value ) { return value + "-" + (value % 2000 + 1); },
	    
	    _parse: function(value) { return parseFloat(value); }
	});

	$("#spinner-start-year").yrspinner({ 
	    min: 2000,
	    max: 2098,
	    step: 1,

	    change: function( event, ui) {
			setTimeout(setYearNames, 1);
		},
		spin: function( event, ui) {
			setTimeout(setYearNames, 1);
		}
	});

	// Hacky way to get the spinner to start at something reasonable
	var currentYear = (new Date).getFullYear();
	var startVal = (currentYear) + "-" + (currentYear - 1999);
	$("#spinner-start-year").val(startVal);
}

document.addEventListener("DOMContentLoaded", function (event) {
	initDrag();
});