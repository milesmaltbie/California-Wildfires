var width = 800,
    height = 950;

var formatNumber = d3.format(",d");

var path = d3.geo.path()
    .projection(null);

var coordinates = [0, 0];

var toolscaleX = d3.scale.linear()
    .domain([0, 960]) //960
    .range([0, width]);

var svg = d3.select("div#container")
    .append("svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
	 .attr("id", "svgElem")
	 .attr("viewBox", "0, 65, 989, 1150") //1150 //960, 1300
    .attr("width", width)
    .attr("height", height)
	 .classed("svg-content", true);


var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

var val = document.getElementById("svgElem").getBoundingClientRect();
var svgLeft = val.left;
var svgTop = val.top;
var svgBottom = val.bottom;
var svgRight = val.right;
var viewBoxHeight = 1150; //1150

var slider = d3.slider().min(1895).max(2015).step(1).axis(true).value([1895, 2015]);

// Extend moveToFront/Back functionalities + some Bostock magick as seen on:
// http://bl.ocks.org/eesur/4e0a69d57d3bfc8a82c2
d3.selection.prototype.moveToFront = function () {
    return this.each(function () {
        this.parentNode.appendChild(this);
    });
};
d3.selection.prototype.moveToBack = function () {
    return this.each(function () {
        var firstChild = this.parentNode.firstChild;
        if (firstChild) {
            this.parentNode.insertBefore(this, firstChild);
        }
    });
};
d3.json("caFire.json", function (error, caFire) {
    if (error) throw error;

    var fires = topojson.feature(caFire, caFire.objects.fires_great_5k);
    //var vals = values[0].properties;

    // Clip fires to land.
    svg.append("defs").append("clipPath")
        .attr("id", "clip-land")
        .append("path")
        .datum(topojson.feature(caFire, caFire.objects.counties))
        .attr("d", path);

    // Group fires by color for faster rendering.
    svg.append("g")
        .attr("class", "fireclip")
        .attr("clip-path", "url(#clip-land)")
        .selectAll("path")
        .data(d3.nest()
            .key(function (d) {
                return (d.properties.area * 2.58999e6);
            })
            .entries(fires.features.filter(function (d) {
                return d.properties.area;
            })))
	
    .enter().append("path")
        .attr("class", "fire")
        .attr("d", function (d) {
            return path({
                type: "FeatureCollection",
                features: d.values
            });
        })
        .on("mouseover", function (d) {
            if (this.getAttribute("hoverable") == "true") {
                // Display data from fire onto tooltip
                d3.select(this).moveToFront(); // Brings selection to front
                var t_acreage = d3.format(",f")(d.values[0].properties.acres);

                var t_name = d.values[0].properties.name.replace(/\w\S*/g, function (txt) {
                    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                });

                var t_agency = d.values[0].properties.agency;
                t_agency = agencyCode(t_agency);

                var t_cause = d.values[0].properties.cause;
                t_cause = causeCode(t_cause);
					 
					 var t_unit = d.values[0].properties.unit;
					 t_unit = unitCode(t_unit);
					 
                coordinates = d3.mouse(this);
                var Y = coordinates[1];

                
					 div.style("opacity", 0)
                    .transition().duration(400)
                    .style("opacity", .8)
                    // Displays tooltip to the right of the map
                    /*.style("left", function () {
                        if (Y < ((viewBoxHeight + svgTop) * .28))
                            return svgLeft + width / 2.4 + "px";
                        else if (Y >= ((viewBoxHeight + svgTop) * .28) && Y <= ((viewBoxHeight + svgTop) * .65))
                            return ((Y / 1.5) + (width + 40)) + "px";
                        else if (Y > ((viewBoxHeight + svgTop) * .65))
                            return (svgLeft + width) + "px";
                    })
                    .style("top", function (d) {
                        if (Y < (viewBoxHeight + svgTop) * .85)
                            return (d3.event.pageY - 28) + "px"
                        else
                            return 650 + "px";
                    });*/
						 div.html("<tab1>Fire Name: </tab1><tab2>" + t_name + "</tab2><br>" +
							  "<tab1>Year:</tab1><tab2>" + d.values[0].properties.year + "</tab2><br>" +
							  "<tab1>Agency: </tab1><tab2>&nbsp&nbsp" + t_agency + "</tab2><br>" +
							  "<tab1>Adm. Unit: </tab1><tab2>&nbsp&nbsp" + t_unit + "</tab2><br>" +
							  "<tab1>Cause: </tab1><tab2>" + t_cause + "</tab2><br>" +
							  "<tab1>Total Acreage: </tab1><tab2>" + t_acreage + "</tab2>")
						 d3.select(".tooltip").classed("hidden", false);
					}
            }
        })
        .on("mouseout", function (d) { // move selection to back to make room
            d3.select(this).moveToBack()
            div.style("opacity", .8)
                .transition().duration(400)
                .style("opacity", 0);
        })
        .on("click", function (d) { // move selection back on click to see more
            d3.select(this).moveToBack();
        });


    // Draw fires.
    svg.append("path")
        .datum(topojson.mesh(caFire, fires, function (a, b) {
            return a == b
        }))
        .attr("d", path)
        .data(topojson.feature(caFire, fires))
        .attr("d", path);


    // Draw state border
    svg.append("path")
        .datum(topojson.mesh(caFire, caFire.objects.state, function (d) {
            return true;
        }))
        .attr("class", "state-border")
        .attr("d", path)
        .on("mouseover", function (d) {
            console.log(d3.event.pageX + ", ")
            console.log(d3.event.pageY)
        });
    // assign all elements (fire) to false.
    svg.selectAll(".fire").attr("hoverable", true)
        // Draw county borders.
    svg.append("path")
        .datum(topojson.mesh(caFire, caFire.objects.counties, function (a, b) {
            return a !== b;
        }))
        .attr("class", "county-border")
        .attr("d", path);

    // Render the slider in the div and give it functionality
    d3.select('#slider').call(slider
            .on("slide", function (evt, targetyear) {
                d3.select("#handle-one").select(".yearBox")
                    .html(targetyear[0]);
                d3.select("#handle-two").select(".yearBox")
                    .html(targetyear[1]);
                svg.selectAll(".fire").each(function (d) {
                    if (d.values[0].properties.year > targetyear[0] && d.values[0].properties.year < targetyear[1]) {
                        this.setAttribute("hoverable", "true");
                    } else {
                        this.setAttribute("hoverable", "false");
                    }
                    this.style.fillOpacity = (d.values[0].properties.year > targetyear[0] && d.values[0].properties.year < targetyear[1]) ? .5 : 0;
                })
            })
        )
        .selectAll(".d3-slider-handle")
        .append("div")
        .attr("class", "yearBox")

    d3.select("#handle-one").select(".yearBox")
        .html("1895");
    d3.select("#handle-two").select(".yearBox")
        .html("2015");
});

function agencyCode(a) {
    switch (a) {
        case "BIA":
            a = "USDI Bureau of Indian Affairs"
            break;
        case "BLM":
            a = "Bureau of Land Management"
            break;
        case "CAL":
            a = "California Department of Forestry (CAL FIRE)"
            break;
        case "CCO":
            a = "Contract Counties"
            break;
        case "DOD":
            a = "Department of Defense"
            break;
        case "FWS":
            a = "USDI Fish and Wildlife Service"
            break;
        case "LRA":
            a = "Local Response Area"
            break;
        case "NOP":
            a = "No Protection"
            break;
        case "NPS":
            a = "National Park Service"
            break;
        case "PVT":
            a = "Private"
            break;
        case "USF":
            a = "United States Forest Service"
            break;
        case "OTH":
            a = "Other"
            break;
        case "CDF":
            a = "California Department of Forestry (CAL FIRE)"
            break;
    }
    return a;
}

function unitCode(a){
	switch (a) {
		case "AEU":
			a = "Amador / El Dorado Unit"
			break;
		case "BDU":
			a = "San Bernardino Unit"
			break;
		case "BEU":
			a = "San Benito / Monterey Unit"
			break;
		case "BTU":
			a = "Butte Unit"
			break;
		case "CZU":
		   a = "San Mateo / Santa Cruz Unit"
			break;
		case "FKU":
			a = "Fresno / Kings Unit"
			break;
		case "HUU":
			a = "Humboldt / Del Norte Unit"
			break;
		case "LMU":
			a = "Lassen / Modoc Unit"
			break;
		case "LNU":
			a = "Sonoma / Lake / Napa Unit"
			break;
		case "MEU":
			a = "Mendocino Unit"
			break;
		case "MMU":
			a = "Madera / Mariposa / Merced Unit"
			break;
		case "MVU":
			a = "San Diego Unit"
			break;
		case "NEU":
			a = "Nevada / Yuba / Placer Unit"
			break;
		case "RRU":
			a = "Riverside Unit"
			break;
		case "SCU":
			a = "Santa Clara Unit"
			break;
		case "SHU":
		   a = "Shasta / Trinity Unit"
			break;
		case "SKU":
			a = "Siskiyou Unit"
			break;
		case "SLU":
			a = "San Luis Obispo Unit"
			break;
		case "TCU":
			a = "Tuolumne / Calaveras Unit"
			break;
		case "TGU":
			a = "Tehama / Glenn Unit"
			break;
		case "TUU":
			a = "Tulare Unit"
			break;
		case "KRN":
			a = "Kern County"
			break;
		case "LAC":
			a = "Los Angeles County"
			break;
		case "MRN":
			a = "Marin County"
			break;
		case "ORC":
			a = "Orange County"
			break;
		case "SBC":
			a = "Santa Barbara County"
			break;
		case "VNC":
			a = "Ventura County"
			break;
	}
	return a;
}

function causeCode(c) {

    switch (c) {
        case 1:
            c = "Lightning"
            break;
        case 2:
            c = "Equipment Use"
            break;
        case 3:
            c = "Smoking"
            break;
        case 4:
            c = "Campfire"
            break;
        case 5:
            c = "Debris"
            break;
        case 6:
            c = "Railroad"
            break;
        case 7:
            c = "Arson"
            break;
        case 8:
            c = "Playing with Fire"
            break;
        case 9:
            c = "Miscellaneous"
            break;
        case 10:
            c = "Vehicle"
            break;
        case 11:
            c = "Power Line"
            break;
        case 12:
            c = "Firefighter Training"
            break;
        case 13:
            c = "Non-Firefighter Training"
            break;
        case 14:
            c = "Unknown/Unidentified"
            break;
        case 15:
            c = "Structure"
            break;
        case 16:
            c = "Aircraft"
            break;
        case 17:
            c = "Volcanic"
            break;
        case 18:
            c = "Escaped Prescribed Burn"
            break;
        case 19:
            c = "Illegal Alien Campfire"
    };
    return c;
}