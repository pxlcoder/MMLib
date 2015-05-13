google.load("feeds", "1");

$(document).ready(function() {
    	var titles = [];
    	var years = [];
	var upcoming = [];
	
	var currentList = 'Coming Soon';
	var waitingList = [];
	var removeFlag = false;
	
	var rootURL = 'http://miss.ent.sirsidynix.net/client/';
	
	if($.cookie("waitlist") !== undefined){
		waitingList = decodeList($.cookie('waitlist'));
	}
	
	function encodeList(list){
		var encoded = "";
		for (var i = 0; i < list.length; i++){
			for (var j = 0; j < list[i].length; j++){
				encoded += list[i][j];
				
				if (j !== list[i].length - 1){
					encoded += "~";
				}
			}
			
			if (i !== list.length - 1){
				encoded += "|";
			}
		}
		return encoded;
	}
	
	function decodeList(liststring){
		list = [];
		templist = liststring.split("|");
		
		for (var i = 0; i < templist.length; i++){
			list.push(templist[i].split("~"));
		}
		
		return list;
	}
	
	function updateSearch(){
		var feed = new google.feeds.Feed(rootURL + "rss/hitlist/mlsathome/qu=" + $('#searchTitle').val() + "&lm=DVDALL");

	        feed.load(function(result) {
	   		if (!result.error) {
		                titles = [];
		                years = [];
		
		                var tableData = '<thead><tr><th data-field="id">Title</th><th data-field="Year">Year</th></tr></thead><tbody>';
						
		                for (var i = 0; i < result.feed.entries.length; i++) {
		                    tableData += "<tr>";
		                    var entry = result.feed.entries[i];
		
		                    var movieTitle = entry.title;
		                    var movieYear = entry.content.slice(entry.content.indexOf("Publication Date") + 16, entry.content.indexOf("Call Number") - 4);
		
		                    titles.push(movieTitle);
		                    years.push(movieYear);
		
		                    tableData += "<td>" + movieTitle + "</td><td>" + movieYear + "</td></tr>";
		                }
						
		                $('.dataTable').html(tableData + "</tbody>");
		
		                $("#dataTable table tr").click(function() {
					var selectedMovie = titles[this.rowIndex - 1];
					if (selectedMovie !== undefined){
						window.open(rootURL + "mlsathome/search/results?qu=" + selectedMovie + "&te=&lm=DVDALL", '_blank');
					}
		                });
	        	}
	        });
	}
	
	function tableHandle(titleArray){
		$("#upcomingTable table tr").click(function() {
			if (removeFlag === false){
				var selectedMovie = titleArray[this.rowIndex - 1][0];
				$('#searchTitle').val(selectedMovie);
				$("html, body").animate({ scrollTop: 0 }, "slow");
				updateSearch();
			}else{
				titleArray.splice(this.rowIndex - 1, 1);
				$.cookie('waitlist', encodeList(waitingList), { expires: 365 });
				$('.upcomingTable').html(constructTable(waitingList));
				tableHandle(waitingList);
				removeFlag = false;
			}
		});
	}
	
	function constructTable(titleArray){
		var upcomingTableData = '<thead><tr><th data-field="id">Title</th><th data-field="Year">Release Date</th><th data-field="Score">Critics Score</th></tr></thead><tbody>';
		
		for (var i = 0; i < titleArray.length; i++){
			var upcomingMovie = titleArray[i][0];
			var releaseDate = titleArray[i][1];
			var criticsScore = titleArray[i][2];
			
			upcomingTableData += "<tr><td>" + upcomingMovie + "</td><td>" + releaseDate + "</td><td>" + criticsScore + "</td></tr>";
		}
		
		upcomingTableData += "</tbody>";
		
		return upcomingTableData;
	}
	
	function swapLists(){
		if (currentList === "Coming Soon"){
			currentList = "Waiting List"
			$('.upcomingTable').html(constructTable(waitingList));
			tableHandle(waitingList);
		}else{
			currentList = "Coming Soon";
			$('.upcomingTable').html(constructTable(upcoming));
			tableHandle(upcoming);
		}
		
		$('#moviesHeader').html("<h4>"+currentList+"</h4>");
	}
	
	function addTitles(){
		var movie = prompt("Please enter a title", "");
		if (movie != null) {
			$.ajax("http://api.rottentomatoes.com/api/public/v1.0/movies.json", {
				data: {
					apikey: 'mz7z7f9zm79tc3hcaw3xb85w',
					q: movie
				},
				dataType: "jsonp",
				success: function(data) {
					var criticsScore = data.movies[0].ratings.critics_score;
					var upcomingMovie = data.movies[0].title;
					var releaseDate = data.movies[0].release_dates.dvd;
					waitingList.push([upcomingMovie, releaseDate, criticsScore]);
					$.cookie('waitlist', encodeList(waitingList), { expires: 365 });
					if (currentList === "Waiting List"){
						$('.upcomingTable').html(constructTable(waitingList));
						tableHandle(waitingList);
					}
				}           
			});
		}
	}
	
	function removeTitles(){
		if(currentList === "Waiting List"){
			removeFlag = true;
		}
	}
	
	$.ajax("http://api.rottentomatoes.com/api/public/v1.0/lists/dvds/upcoming.json", {
        	data: {
			apikey: 'mz7z7f9zm79tc3hcaw3xb85w',
			page_limit: 50
		},
		dataType: "jsonp",
		success: function(data) {
			for (var i = 0; i < data.total; i++){
				var audienceScore = data.movies[i].ratings.audience_score;
				var criticsScore = data.movies[i].ratings.critics_score;
				var upcomingMovie = data.movies[i].title;
				var releaseDate = data.movies[i].release_dates.dvd;
				
				if(audienceScore > 49 && criticsScore !== -1){
					upcoming.push([upcomingMovie, releaseDate, criticsScore]);
				}
			}
			
			$('.upcomingTable').html(constructTable(upcoming));
			
			tableHandle(upcoming);
        	}           
	});
	
	$('#sbutton').on('click', updateSearch);
	$('#swapList').on('click', swapLists);
	$('#addTitle').on('click', addTitles);
	$('#removeTitle').on('click', removeTitles);
	
	$("#searchTitle").keyup(function (e) {
		if (e.keyCode == 13) {
			updateSearch();
		}
	});
});
