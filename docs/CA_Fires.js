var width = 700,
    height = 948;

var formatNumber = d3.format(",d");

var path = d3.geo.path()
    .projection(null);

var coordinates = [0, 0]

// leftover code //
/*var color = d3.scale.threshold()
    .domain([1, 10, 50, 100, 500, 1000, 2000, 5000])
    .range(["#fff7ec", "#fee8c8", "#fdd49e", "#fdbb84", "#fc8d59", "#ef6548",
            "#d7301f", "#b30000", "#7f0000"]);

// A position encoding for the key only.
var x = d3.scale.linear()
    .domain([0, 5100])
    .range([0, 480]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickSize(13)
    .tickValues(color.domain())
    .tickFormat(function (d) {
        return d >= 100 ? formatNumber(d) : null;
    });*/

var toolscaleX = d3.scale.linear()
    .domain([0,960])
    .range([0,width]);

var svg = d3.select("body").append("svg")
    .attr("viewBox", "0, 0, 960, 1300")
    .attr("width", width)
    .attr("height", height);

var g = svg.append("g")
    .attr("class", "key")
    .attr("transform", "translate(440,40)");


var div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Extend moveToFront/Back functionalities + some bostock magick as seen on:
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

    // Clip tracts to land.
    svg.append("defs").append("clipPath")
        .attr("id", "clip-land")
        .append("path")
        .datum(topojson.feature(caFire, caFire.objects.counties))
        .attr("d", path);

    // Group tracts by color for faster rendering.
    svg.append("g")
        .attr("class", "fire")
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
            d3.select(this).moveToFront(); // Brings selection to front
            var t_acreage = d3.format(",f")(d.values[0].properties.acres);

            var t_name = d.values[0].properties.name.replace(/\w\S*/g, function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });

            var t_agency = d.values[0].properties.agency;
            t_agency = agencyCode(t_agency);

            var t_cause = d.values[0].properties.cause;
            t_cause = causeCode(t_cause);

            coordinates = d3.mouse(this);
            var Y = coordinates[1];
            console.log(Y);

            div.style("opacity", .8)
                // campy code that makes the tooltip follow California's border
                // good for now (11.23), will need to be changed later
                .style("left", function () {
                    console.log(Y);
                    if (Y > 350 && Y < 870)
                        return toolscaleX((Y / 0.88372) + 30) + "px";
                    else if (Y >= 870)
                        return toolscaleX(900);
                    else return toolscaleX(430) + "px";
                })
                .style("top", (d3.event.pageY - 28) + "px");
            div.html("Fire Name: " + t_name + "<br>" +
                "Year: " + d.values[0].properties.year + "<br>" +
                "Agency in Command: " + t_agency + "<br>" +
                "Cause: " + t_cause + "<br>" +
                "Total Acreage: " + t_acreage);
            /*.style("left", (d3.event.pageX + 20) + "px")
            .style("top", (d3.event.pageY - 28) + "px")*/
        })
        .on("mouseout", function (d) { // move selection to back to make room
            d3.select(this).moveToBack();
            div.style("opacity", 0)
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


    // Draw county borders.
    svg.append("path")
        .datum(topojson.mesh(caFire, caFire.objects.counties, function (a, b) {
            return a !== b;
        }))
        .attr("class", "county-border")
        .attr("d", path);


    //});  




    d3.select(self.frameElement).style("height", height + "px");
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
            a = "California Department of Forestry and Fire Protection (CAL FIRE)"
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
            a = "California Department of Forestry and Fire Protection (CAL FIRE)"
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
